Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

// -- CONSTANTS -----------------------------------------------------

// firefox windows get shown again after sessionstore-window-restored event
// (expecially if there is more than one window restored), so we have to wait
// a "reasonable" amount of seconds before hiding to tray and consider the 
// startup process terminated. (unless we find a better way...)
const FIRETRAY_WAIT_BROWSER_STARTUP_DELAY = 5;                    


// -- UTILS ---------------------------------------------------------
                  
mydump=function(str) {
  dump(str+"\n"); 
}

alert=function(img,title,msg){
  mydump("ALERT: "+title+": "+msg); 
}

myconfirm=function(msg) {
 
 try
 {
   var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                      .getService(Components.interfaces.nsIPromptService);
                      
   return ps.confirm(null,"",msg);
 }                   
 catch(e) {
 }
 return false;

}

// -- CONSTRUCTOR ---------------------------------------------------                  

function FireTrayHandler() {
  
   FireTrayHandler.menuCreated = false;
   FireTrayHandler.appStarted = false;
   
   FireTrayHandler.isMail=false;
   FireTrayHandler.isSong=false;
   FireTrayHandler.isCalendar=false; 
   FireTrayHandler.lastnum=-1;

   FireTrayHandler.pPS=null;
   FireTrayHandler.minimized=false;

   FireTrayHandler.normalIconOnlyMinimized=false;
   FireTrayHandler.mailIconDisabled=false;
   FireTrayHandler.mailIconOnlyMinimized=false;
   FireTrayHandler.showMailCount=false;
   
   FireTrayHandler.load_strings();
   FireTrayHandler.minimizeComponent = new Object();
   
   FireTrayHandler.menu_window_list = 0;   
         
   FireTrayHandler.interface = Components.classes['@mozilla.org/FireTray;1'].getService(Components.interfaces.nsITray);
   FireTrayHandler.prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
   FireTrayHandler.appCode = FireTrayHandler.getMozillaAppCode();

   FireTrayHandler.setupMenus();
   if(FireTrayHandler.isMail) FireTrayHandler.mailSetup();
   if(FireTrayHandler.isSong) FireTrayHandler.songSetup();
   
   FireTrayHandler.prefObserver.register(); 
   FireTrayHandler.startupObserver.register();
  
   FireTrayHandler.updatePreferences(); 

   
   
//   alert("","TITLE","APPCODE="+FireTrayHandler.appCode + " - K:"+ String(FireTrayHandler.prefManager.getIntPref(prefname)) );//string_closerequest); */
};

// -- PROTOTYPE ---------------------------------------------------                  
                  
FireTrayHandler.prototype = {
    classDescription: "FireTray handler XPCOM Component",
                                      
    classID:          Components.ID("{f2f05844-d398-11df-9885-7d29dfd72085}"),
    contractID:       "@mozilla.org/FireTrayHandler;1",

    QueryInterface:   XPCOMUtils.generateQI([Components.interfaces.nsIFireTrayHandler,
                                             Components.interfaces.nsISupports]),
    
    hideAll: function() {
      FireTrayHandler.hideToTray();
    },

    hideWindow: function(window) {
      FireTrayHandler.hideWin(window);
    },
    
    setupWindow: function(window) {
      FireTrayHandler.setWindow(window);
    }
    
};

 
// -- MODULE INITIALIZATION -----------------------------------------

var components=[FireTrayHandler];
if (XPCOMUtils.generateNSGetFactory)
 var NSGetFactory = XPCOMUtils.generateNSGetFactory(components);
else
 var NSGetModule = XPCOMUtils.generateNSGetModule(components);

// -- LOCALIZED STRINGS ---------------------------------------------

FireTrayHandler.getStringFromName=function(name,defaultval) {
   try
   {
     return FireTrayHandler.strings.GetStringFromName(name);
   } catch(e) {
     if(typeof(defaultval) !== 'undefined') return defaultval;
     else return "";
   }
}
 
FireTrayHandler.load_strings = function() {
   FireTrayHandler.gfiretrayBundle=Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
   FireTrayHandler.strings=FireTrayHandler.gfiretrayBundle.createBundle("chrome://firetray/locale/core.properties");
      
 //  this.string_closerequest=this.this.getStringFromName("firetray_closerequest");
   this.string_closerequest = this.getStringFromName("firetray_closerequest","");
   this.string_exitrequest = this.getStringFromName("firetray_exitrequest");
   this.string_restoreall = this.getStringFromName("firetray_restoreall");
   this.string_hideall = this.getStringFromName("firetray_hideall");
   this.string_exit = this.getStringFromName("firetray_exit");
   this.string_windowslist = this.getStringFromName("firetray_windowslist");
   this.string_no_unread_messages = this.getStringFromName("firetray_no_unread_messages");
   this.string_unread_message = this.getStringFromName("firetray_unread_message");
   this.string_unread_messages = this.getStringFromName("firetray_unread_messages");
   this.string_no_new_messages = this.getStringFromName("firetray_no_new_messages");
   this.string_new_message = this.getStringFromName("firetray_new_message");
   this.string_new_messages = this.getStringFromName("firetray_new_messages");
   this.string_check_mail = this.getStringFromName("firetray_check_mail");
   this.string_new_mail = this.getStringFromName("firetray_new_mail");
   this.string_previous_track = this.getStringFromName("firetray_previous_track");
   this.string_next_track = this.getStringFromName("firetray_next_track");
   this.string_play = this.getStringFromName("firetray_play");
   this.string_pause = this.getStringFromName("firetray_pause");
   this.string_stop = this.getStringFromName("firetray_stop");
   this.string_unknown = this.getStringFromName("firetray_unknown");
   this.string_artist = this.getStringFromName("firetray_artist");
   this.string_album = this.getStringFromName("firetray_album");
   this.string_title = this.getStringFromName("firetray_title");
   this.string_junk_message = this.getStringFromName("firetray_junk_message");
   this.string_junk_messages = this.getStringFromName("firetray_junk_messages");

   this.string_unread_messages_alternative_plural=this.getStringFromName("firetray_unread_messages_alternative_plural");
   this.string_new_messages_alternative_plural=this.getStringFromName("firetray_new_messages_alternative_plural");
   this.string_junk_messages_alternative_plural=this.getStringFromName("firetray_junk_messages_alternative_plural");
   try {
//     this.alternative_plural_starts_at=parseInt(this.getStringFromName("firetray_alternative_plural_starts_at"));
   } catch(e) {
     this.alternative_plural_starts_at=-1;     
   }
}


// -- PREFERENCES -----------------------------------------------------

FireTrayHandler.getCharPref = function(prefname, default_value) {
  try
  {
    return FireTrayHandler.prefManager.getCharPref(prefname);      
  }
  catch(e)
  {
    alert(e.message);
  }
  return default_value;
}

FireTrayHandler.getIntPref = function(prefname, default_value) {
  try
  {
    return FireTrayHandler.prefManager.getIntPref(prefname);      
  }
  catch(e)
  {
    alert(e.message);
  }
  return default_value;
}
 
FireTrayHandler.getBoolPref = function(prefname, default_value) {
  try
  {
    return FireTrayHandler.prefManager.getBoolPref(prefname);      
  }
  catch(e)
  {
    alert(e.message);
  }
  return default_value;
}

FireTrayHandler.prefObserver =
{
  register: function()
  {
    var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                                .getService(Components.interfaces.nsIPrefService);
    this._branch = prefService.getBranch("extensions.firetray.");
    this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
    this._branch.addObserver("", this, false);
  },

  unregister: function()
  {
    if(!this._branch) return;
    this._branch.removeObserver("", this);
  },

  observe: function(aSubject, aTopic, aData)
  {
    if(aTopic != "nsPref:changed") return;
    FireTrayHandler.updatePreferences();
  }
}

FireTrayHandler.updatePreferences=function(){
    
    FireTrayHandler.dontCountSpam=FireTrayHandler.getBoolPref("extensions.firetray.dont_count_spam",true);
    FireTrayHandler.textColor=FireTrayHandler.getCharPref("extensions.firetray.text_color","#000000");

    FireTrayHandler.normalIconOnlyMinimized=FireTrayHandler.getBoolPref("extensions.firetray.show_icon_only_minimized",false); ;    
    FireTrayHandler.mailCountType=FireTrayHandler.getIntPref("extensions.firetray.mail_count_type",0); 
    
    var sel=FireTrayHandler.getIntPref("extensions.firetray.show_mail_notification",2); 
    
    switch(sel)
    {
      case 0:
             FireTrayHandler.mailIconDisabled=true;
             FireTrayHandler.mailIconOnlyMinimized=false;
             break;

      case 1:
             FireTrayHandler.mailIconDisabled=false;
             FireTrayHandler.mailIconOnlyMinimized=true;
             break;
             
      default:
             FireTrayHandler.mailIconDisabled=false;
             FireTrayHandler.mailIconOnlyMinimized=false;
             break;
    }
             
    FireTrayHandler.showMailCount=FireTrayHandler.getBoolPref("extensions.firetray.show_mail_count",true); ;;
    

    //set windows close and minimize command blocking 
    FireTrayHandler.interface.setCloseBlocking(FireTrayHandler.getBoolPref("extensions.firetray.close_to_tray"),true);    
    FireTrayHandler.interface.setMinimizeBlocking(FireTrayHandler.getBoolPref("extensions.firetray.minimize_to_tray"),true); 

    FireTrayHandler.setTrayIcon();
    //FireTrayHandler.update();
}


// -- MOZILLA APPLICATION DETECTION ----------------------------------

FireTrayHandler.getMozillaAppCode = function() {

// RETURN VALUE
//   0 - Unknown (defaults to firefox)
//   1 - Firefox
//   2 - Thunderbird
//   3 - Swiftdove
//   4 - Swiftweasel
//   5 - Icedove
//   6 - iceweasel 
//   7 - icecat
//   8 - songbird
//   9 - sunbird
//   10 - seamonkey
//   11 - chatzilla
  
 try {
  var appInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);

  const FIREFOX_ID = "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}";
  const THUNDERBIRD_ID = "{3550f703-e582-4d05-9a08-453d09bdfdc6}";
  const SONGBIRD_ID = "songbird@songbirdnest.com";
  const SUNBIRD_ID = "{718e30fb-e89b-41dd-9da7-e25a45638b28}";
  const SEAMONKEY_ID = "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}";
  const CHATZILLA_ID = "{59c81df5-4b7a-477b-912d-4e0fdf64e5f2}";
  
  var appname=appInfo.name.toLowerCase()

  switch(appInfo.ID) {
     case FIREFOX_ID:
        FireTrayHandler.isBrowser=true; 
        if(appname=="swiftweasel") return 4; 
        if(appname=="iceweasel") return 6; 
        if(appname=="icecat") return 7; 
        return 1;  //Firefox
        break;

     case THUNDERBIRD_ID:
        FireTrayHandler.isMail=true; 
        if(appname=="swiftdove") return 3; 
        if(appname=="icedove") return 5; 
        return 2;  //Thunderbird
        break;
     case SONGBIRD_ID:
        FireTrayHandler.isSong=true;
        FireTrayHandler.interface.initNotification(SONGBIRD_ID);
        return 8; //songbird
        break;

     case SUNBIRD_ID:
        FireTrayHandler.isCalendar=true; 
        return 9; //sunbird
        break;

     case SEAMONKEY_ID:
        FireTrayHandler.isBrowser=true; 
        FireTrayHandler.isMail=true;  
        return 10;  //Seamonkey
        break;
        
     case CHATZILLA_ID:
        FireTrayHandler.isBrowser=true;
        return 11;
        break;

     default:
        return 0;
        break;
  }

 }
 catch (err) {
        alert(err);
        return -1;
    }
}


FireTrayHandler.getDefaultAppString = function(appcode) 
{

   var text="";
   switch(appcode)
   {
    
    case 11: //chatzilla
         text="Firetray (ChatZilla)";
         break;

    case 10: //seamonkey
         text="Firetray (Seamonkey)";
         break;

    case 9: //sunbird
         text="Firetray (Sunbird)";
         break;

    case 8: //songbird
         text="Firetray (Songbird)";
         break;

    case 7: //icecat
         text="Firetray (Icecat)";
         break;

    case 6: //iceweasel
         text="Firetray (Iceweasel)";
         break;
    case 5: //swiftdove
         text="Firetray (Icedove)";
         break;
    case 4: //swiftweasel
         text="Firetray (Swifweasel)";
         break;
    case 3: //swiftdove
         text="Firetray (Swiftdove)";
         break;
    case 2: //thunderbird
         text="Firetray (Thunderbird)";
         break;
    case 1: //firefox
    default:
         text="Firetray (Firefox)";
         break;

  }
  
  return text;

}



// -- CALLBACKS ----------------------------------------------------

FireTrayHandler.trayCallback = function() {
     mydump("trayCallback");

   //var vis=FireTrayHandler.isVisible (); //TOFIX: ISVISIBLE NOT WORKING
   //alert(vis);
   if ( FireTrayHandler.isHidden() ) {
    
       if(FireTrayHandler.isMail && FireTrayHandler.getBoolPref("extensions.firetray.restore_to_next_unread",false))
       {   
         //GoNextMessage(nsMsgNavigationType.nextUnreadMessage,true);
       }

       FireTrayHandler.restoreFromTray();    

    } else {
        
       FireTrayHandler.hideToTray();

   }

}


FireTrayHandler.trayScrollCallback = function(direction) {
   mydump("trayScrollCallback");

   if(FireTrayHandler.getBoolPref("extensions.firetray.scroll_to_hide",true))
   {
     var scroll_action=FireTrayHandler.getIntPref("extensions.firetray.scroll_action",0);

     switch(scroll_action)
     {
      case 0: // UP=hide DOWN=unhide
            if(direction==0) FireTrayHandler.hideToTray();
            if(direction==1) FireTrayHandler.restoreFromTray();
            break;

      case 1: // UP=unhide DOWN=hide
            if(direction==0) FireTrayHandler.restoreFromTray();
            if(direction==1) FireTrayHandler.hideToTray();
            break;

      case 2: // Songbird volume control
           if(FireTrayHandler.isSong){
            if(direction==0) FireTrayHandler.volumeChange(true); 
            if(direction==1) FireTrayHandler.volumeChange(false);
           }

           break;

      case 3: // Songbird prev/next song
           if(FireTrayHandler.isSong){
            if(direction==0) FireTrayHandler.prevTrack();
            if(direction==1) FireTrayHandler.nextTrack();
           }
           
           break;

          default:
        break;
       }  

   }
  
}

FireTrayHandler.trayKeyCallback = function(key_string, key_code) {
  mydump("trayKeyCallback");

  //alert(key_string + " KEY_CODE: "+key_code);
 
  try {
 
  if (key_code==FireTrayHandler.getIntPref("extensions.firetray.hide_show_mm_key"),161) FireTrayHandler.trayCallback();

  if(!FireTrayHandler.isSong) return;
  if (key_string=="XF86AudioPlay") FireTrayHandler.playPause();
  if (key_string=="XF86AudioPause") FireTrayHandler.playPause();
  if (key_string=="XF86AudioNext") FireTrayHandler.nextTrack();
  if (key_string=="XF86AudioPrev") FireTrayHandler.prevTrack();
  if (key_string=="XF86AudioStop") FireTrayHandler.stopASong();
  } catch(err) {}
}


FireTrayHandler.exitCallback = function() {
    mydump("exitCallback");

    try {
    var appStartup = Components.classes['@mozilla.org/toolkit/app-startup;1'].getService(Components.interfaces.nsIAppStartup);
        var do_confirm=true;
        do_confirm=FireTrayHandler.getBoolPref("extensions.firetray.confirm_exit",true);
        if (!do_confirm || myconfirm(FireTrayHandler.string_exitrequest)) {
          appStartup.quit(Components.interfaces.nsIAppStartup.eAttemptQuit);
        }
    } catch (err) {
        alert("","EXIT CALLBACK EXCEPTION",err);
        return;
    }
   
};

FireTrayHandler.restoreCallback = function() {
  mydump("restoreCallback");
    FireTrayHandler.trayCallback(); //FireTrayHandler.restoreFromTray();   
};



// -- EVENT HANDLERS --------------------------------------------------


FireTrayHandler.closeEventHandler = function() {
  mydump("closeEventHandler");
   // if the window menubar is not visible (ex.popup windows) don't close to tray
   if(window.menubar.visible && FireTrayHandler.getBoolPref("extensions.firetray.close_to_tray",true)) {
      FireTrayHandler.hideToTray();
      return false; 
   }
   
}

FireTrayHandler.resizeEventHandler = function(window) {
  var basewindow = FireTrayHandler.getBaseWindow(window);
  mydump("WIN: "+basewindow.title+" RESIZE EVENT HANDLER - APP STARTED:"+FireTrayHandler.appStarted+"\n\n");
  
  if(!FireTrayHandler.appStarted)
     FireTrayHandler.minimizeAtStartup();     
  else
   //remove resize handler when no longer necessary 
   window.onresize=null;
}

FireTrayHandler.timerEvent = { notify: function(timer) { mydump("timerEvent"); FireTrayHandler.appStarted=true; } }

FireTrayHandler.startupObserver =
{
  register: function()
  {
    var observerService = Components.classes["@mozilla.org/observer-service;1"]
                          .getService(Components.interfaces.nsIObserverService);
    observerService.addObserver(this, "mail-startup-done", false); //tb3
    //observerService.addObserver(this, "sessionstore-windows-restored", false); //ff>=3
  },

  unregister: function()
  {
    var observerService = Components.classes["@mozilla.org/observer-service;1"]
                            .getService(Components.interfaces.nsIObserverService);
    observerService.removeObserver(this, "mail-startup-done");
    //observerService.removeObserver(this, "sessionstore-windows-restored");
  },

  observe: function(aSubject, aTopic, aData)
  {
    mydump("<<<<<<<<<<OBSERVE!!!!!!>>>>>>>>"+aSubject+" - "+aTopic);
    FireTrayHandler.minimizeAtStartup();
    FireTrayHandler.appStarted=true;
  }
}




FireTrayHandler.setAndUpdateCloseHandler = function() {

    var baseWindows = FireTrayHandler.getAllWindows();

    for(var i=0; i<baseWindows.length; i++) {
        var basewindow = baseWindows[i];
          FireTrayHandler.interface.setWindowHandler(basewindow);

    }
}



// -- WINDOW HANDLING FUNCTIONS --------------------------------------------

FireTrayHandler.minimizeAtStartup = function() {
    if(FireTrayHandler.getBoolPref("extensions.firetray.start_minimized",false)){          
       FireTrayHandler.hideToTray();              
    }
}

FireTrayHandler.isVisible = function() {
    var baseWindows = FireTrayHandler.getAllWindows();
    var cnt=0;
    var res=false;

    for(var i=0; i<baseWindows.length; i++) {
        var basewindow = baseWindows[i];
          res=false;
          res=FireTrayHandler.interface.getFocusState(basewindow);
          if(res) cnt++;        
    }
    if(cnt>0) return true;
    return false;
}


FireTrayHandler.isHidden = function() {

  var baseWindows = FireTrayHandler.getAllWindows();
  return  (baseWindows.length == FireTrayHandler.interface.menuLength(FireTrayHandler.menu_window_list)) || (FireTrayHandler.isSong && FireTrayHandler.minimized) ; 
}


FireTrayHandler.getBaseWindow = function(win) {

    var rv;
    try {
        var requestor = win.QueryInterface(Components.interfaces.nsIInterfaceRequestor);
        var nav = requestor.getInterface(Components.interfaces.nsIWebNavigation);
        var dsti = nav.QueryInterface(Components.interfaces.nsIDocShellTreeItem);
        var owner = dsti.treeOwner;
        requestor = owner.QueryInterface(Components.interfaces.nsIInterfaceRequestor);
        rv = requestor.getInterface(Components.interfaces.nsIXULWindow);
        rv = rv.docShell;
        rv = rv.QueryInterface(Components.interfaces.nsIDocShell);
        rv = rv.QueryInterface(Components.interfaces.nsIBaseWindow);
    } catch (ex) {
        rv = null;
        setTimeout(function() {throw ex; }, 0);
        // ignore no-interface exception 
    }
    return rv;    
};

FireTrayHandler.getAllWindows = function() {

    try {
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
    } catch (err) {
        alert(err);
        return;
    }

    var baseWindows = new Array();
    var e = wm.getEnumerator(null);
    var windows = [];
    while (e.hasMoreElements()) {
        var w = e.getNext();
        baseWindows[baseWindows.length] = FireTrayHandler.getBaseWindow(w);
    } 

    return baseWindows;
};

FireTrayHandler.restoreWindow = function(basewindow, menu_item_window) {
   FireTrayHandler.interface.restoreWindow(basewindow);
   FireTrayHandler.interface.menuRemove(FireTrayHandler.menu_window_list, menu_item_window);
   FireTrayHandler.updateMenuLabels();
};


FireTrayHandler.windowsListAdd = function(basewindow) {
    var aWindow = FireTrayHandler.interface.menuItemNew(basewindow.title,"");
    FireTrayHandler.interface.menuAppend(FireTrayHandler.menu_window_list, aWindow, function() { FireTrayHandler.restoreWindow(basewindow,aWindow); } );
};

FireTrayHandler.hideWin = function(window) {
    var basewindow = FireTrayHandler.getBaseWindow(window);
    FireTrayHandler.interface.hideWindow(basewindow);
    FireTrayHandler.minimized = true;
    FireTrayHandler.windowsListAdd(basewindow);
}

FireTrayHandler.hideTrayIfNeeded = function() {
  if(FireTrayHandler.normalIconOnlyMinimized) {
    if(!FireTrayHandler.isMail || FireTrayHandler.lastnum<=0)
      FireTrayHandler.interface.hideTray();
  }
  else 
    FireTrayHandler.interface.showTray();     
}

FireTrayHandler.updateMenuLabels = function() {
  var string_menu_restore="";
  
  if( FireTrayHandler.isHidden() ) {
    string_menu_restore=FireTrayHandler.string_restoreall;
    FireTrayHandler.interface.showTray();
  }  else {    
    string_menu_restore=FireTrayHandler.string_hideall;
    FireTrayHandler.hideTrayIfNeeded();
  }
  
  FireTrayHandler.interface.menuItemUpdate(FireTrayHandler.menu_item_restore,string_menu_restore);    

}


FireTrayHandler.hideToTray = function() {

  FireTrayHandler.interface.menuRemoveAll(FireTrayHandler.menu_window_list);

    var baseWindows = FireTrayHandler.getAllWindows();
    FireTrayHandler.minimized = true;
    for(var i=0; i<baseWindows.length; i++) {
        var basewindow = baseWindows[i];
        FireTrayHandler.interface.hideWindow(basewindow);
        FireTrayHandler.windowsListAdd(basewindow);
    }


    FireTrayHandler.update();
}

FireTrayHandler.restoreFromTray = function() {
    var baseWindows = FireTrayHandler.getAllWindows();
  
    FireTrayHandler.interface.restore(baseWindows.length, baseWindows);    
    FireTrayHandler.interface.menuRemoveAll(FireTrayHandler.menu_window_list);
        
    FireTrayHandler.minimized = false;

    FireTrayHandler.update();  
}



// -- MAIL FEATURES ------------------------------------------------

FireTrayHandler.getSpamFolder = function(spamFolderURI, folders) {
  for(var i=0; i<folders.length; i++)
  {
     var spamfolder=folders[i].getChildWithURI(spamFolderURI, true, false);
     if(spamfolder!=null) return spamfolder;          
  }
}

FireTrayHandler.updateMailCount = function() {
    mydump("UPDATEMAILCOUNT-----");
    var folders = [];
    var spamFolderURIs = [];
    var allServers = FireTrayHandler.accountManager.allServers;

    var num_unread_msgs = 0;
    var num_new_msgs = 0;
    var num_unread_spam_msgs = 0;
    var num_new_spam_msgs = 0;
    
     // Get accounts id to check in preferences
    var pref_excluded_accounts = FireTrayHandler.prefManager.getCharPref('extensions.firetray.accounts_to_exclude');
    var accounts_to_exclude = new Array();
    accounts_to_exclude = pref_excluded_accounts.split(' ');
  
    var msg="";
    
    for(var i=0; i< allServers.Count(); i++)    
    {
        var server = allServers.GetElementAt(i).QueryInterface(Components.interfaces.nsIMsgIncomingServer);
        var id=String(server.key);
      mydump("SERVER "+i+" ID: "+id);
        
        if(accounts_to_exclude.indexOf(id)>=0) continue;
      mydump(" NOT EXCLUDED");
        
        var folder = server.rootMsgFolder.QueryInterface(Components.interfaces.nsIMsgFolder);           
        var spamsettings = server.spamSettings.QueryInterface(Components.interfaces.nsISpamSettings);                
        var spamFolderURI=spamsettings.spamFolderURI;

        if(spamFolderURI!=null && spamFolderURIs.indexOf(spamFolderURI)<0 )
        { spamFolderURIs.push(spamFolderURI); }

        if(folders.indexOf(folder)<0) //avoid considering folders multiple times
        {
          folders.push(folder);
          num_unread_msgs += folder.getNumUnread(true);
          num_new_msgs += folder.getNumNewMessages(true);
        }
      mydump("temp_n_msgs: unread="+num_unread_msgs+" new="+num_new_msgs);
    }

    for(var i=0; i<spamFolderURIs.length; i++) //get spam mail count
    {
      var spamfolder=FireTrayHandler.getSpamFolder(spamFolderURIs[i], folders);   
      if(spamfolder!=null) 
      {
        num_unread_spam_msgs +=spamfolder.getNumUnread(true);   
        num_new_spam_msgs += spamfolder.getNumNewMessages(true);
      }
    }
    
    FireTrayHandler.numUnreadMail = num_unread_msgs;
    FireTrayHandler.numNewMail = num_new_msgs; 
    FireTrayHandler.numUnreadSpam = num_unread_spam_msgs;
    FireTrayHandler.numNewSpam = num_new_spam_msgs; 
}


FireTrayHandler.updateMailTray = function (force_update) {
  if(force_update) FireTrayHandler.lastnum=-1; //force updating icon

  var minimized = FireTrayHandler.isHidden()

  mydump("UPDATE_MAIL_TRAY: mailIconDisabled:"+FireTrayHandler.mailIconDisabled + " minimized:"+minimized);       
  
  if(FireTrayHandler.mailIconDisabled || (FireTrayHandler.mailIconOnlyMinimized && !minimized))
  {
     mydump("SHOW STANDARD ICON mailIconDisabled:"+FireTrayHandler.mailIconDisabled + " minimized:"+minimized);
     FireTrayHandler.interface.setIconText("", FireTrayHandler.textColor);
     FireTrayHandler.SetDefaultTextTooltip();
     FireTrayHandler.lastnum=-1
     return;
  }

  FireTrayHandler.updateMailCount(); 

  var res;
  
  var string_no_messages;
  var string_one_message;
  var string_many_messages;
  var string_alternate_plural;

  if(FireTrayHandler.mailCountType==0) {
    mydump("SHOWING NEW MAIL");
    res=FireTrayHandler.numNewMail;
    spam=FireTrayHandler.numNewSpam;
    string_no_messages=FireTrayHandler.string_no_new_messages;
    string_one_message=FireTrayHandler.string_new_message;    
    string_many_messages=FireTrayHandler.string_new_messages;    
    string_alternate_plural=FireTrayHandler.string_firetray_new_messages_alternative_plural;
  }
  else {
    mydump("SHOWING UNREAD MAIL");
    res=FireTrayHandler.numUnreadMail;
    spam=FireTrayHandler.numUnreadSpam;
    string_no_messages=FireTrayHandler.string_no_unread_messages;
    string_one_message=FireTrayHandler.string_unread_message;
    string_many_messages=FireTrayHandler.string_unread_messages;
    string_alternate_plural=FireTrayHandler.string_firetray_unread_messages_alternative_plural;
  }
  
  mydump("MAIL COUNT RES="+res);
    
  var spam_tooltip="";
 
  if(FireTrayHandler.dontCountSpam && FireTrayHandler.numUnreadSpam>0)  {
     res-=spam;
     if(res<0) res=0;
     if(spam>1) spam_tooltip=" ("+spam+" "+FireTrayHandler.string_junk_messages+ ")"; 
     else spam_tooltip=" ("+spam+" "+FireTrayHandler.string_junk_message+ ")"; 
  }

  mydump("LASTNUM:"+FireTrayHandler.lastnum);

  if(FireTrayHandler.lastnum==res) return; //update the icon only if something has changed
  FireTrayHandler.lastnum=res;

  var tooltip="";
  var num=""+res;
  if(res==0) { num=""; tooltip=string_no_messages + spam_tooltip; }
  else if(res==1)  tooltip=res + " " + string_one_message + spam_tooltip; 
  else if(FireTrayHandler.alternative_plural_starts_at<res) tooltip = res + " " + string_many_messages + spam_tooltip;
  else tooltip = res + " " + string_alternate_plural + spam_tooltip;
       
  if(!FireTrayHandler.showMailCount) num=" ";

  //num = FireTrayHandler.numNewMail + "/" + num;
  FireTrayHandler.interface.setIconText(num, FireTrayHandler.textColor);
  FireTrayHandler.interface.setTrayTooltip(tooltip);
  
  if(num=="") FireTrayHandler.hideTrayIfNeeded();
  else FireTrayHandler.interface.showTray();
}

FireTrayHandler.subscribeToMailEvents = function()
{
  var mailSession = Components.classes["@mozilla.org/messenger/services/session;1"].
  getService(Components.interfaces.nsIMsgMailSession);
 
  var folderListener = {
  OnItemAdded: function(parent, item) {},
  OnItemBoolPropertyChanged: function(item, property, oldValue, newValue) {},
  OnItemEvent: function(item, event)  {},
  OnItemIntPropertyChanged: function(item, property, oldValue, newValue) { FireTrayHandler.updateMailTray(false); },
  OnItemPropertyChanged: function(parent, item, viewString) {},
  OnItemPropertyFlagChanged: function(item, property, oldFlag, newFlag) {},
  OnItemRemoved: function(parent, item) {},
  OnItemUnicharPropertyChanged: function(item, property, oldValue, newValue) {},
}
 
  var nFlags = Components.interfaces.nsIFolderListener.added | Components.interfaces.nsIFolderListener.intPropertyChanged; mailSession.AddFolderListener(folderListener,nFlags);
}

FireTrayHandler.checkMail = function() {
  //MsgGetMessagesForAllAuthenticatedAccounts();    
}

FireTrayHandler.composeNewMail = function() {
  //goOpenNewMessage();  
}


FireTrayHandler.mailSetup = function() {
 
   FireTrayHandler.accountManager = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Components.interfaces.nsIMsgAccountManager);
   try
   {
        FireTrayHandler.localfolders = FireTrayHandler.accountManager.localFoldersServer.rootFolder;
   }
   catch(error) {}
   
   FireTrayHandler.subscribeToMailEvents();
}



// -- SONGBIRD FUNCTIONS -------------------------------------------------

FireTrayHandler.volumeChange = function(raise) {
    if(FireTrayHandler.pPS == null) return;
   
    var volume=FireTrayHandler.pPS.volumeControl.volume;

    var delta=0.1; // change volume by 10%

    if(raise) {
       if(volume<1) {
           volume=volume+delta;
           if(volume>1) volume=1;
           FireTrayHandler.pPS.volumeControl.volume=volume;
       }
    } else {
       if(volume>0) {
           volume=volume-delta;
           if(volume<0) volume=0;
           FireTrayHandler.pPS.volumeControl.volume=volume;
       }
    }

}

FireTrayHandler.prevTrack = function() {
    if(FireTrayHandler.pPS == null) return;
        
    FireTrayHandler.pPS.sequencer.previous();
    FireTrayHandler.pPS.sequencer.play();
}

FireTrayHandler.nextTrack = function() {
    if(FireTrayHandler.pPS == null) return;

    FireTrayHandler.pPS.sequencer.next();
    FireTrayHandler.pPS.sequencer.play();
}

FireTrayHandler.playPause = function () {
    if(FireTrayHandler.pPS == null) return;

    if(FireTrayHandler.pPS.status.state == 2)
        FireTrayHandler.pPS.playbackControl.play();
    else if (FireTrayHandler.pPS.status.state != 1){
        FireTrayHandler.pPS.sequencer.play();
        if (FireTrayHandler.pPS.status.state != 1)
            Components.classes['@songbirdnest.com/Songbird/ApplicationController;1'].createInstance(Components.interfaces.sbIApplicationController).playDefault()
    }else
        FireTrayHandler.pPS.playbackControl.pause();
    FireTrayHandler.interface.setTrayIcon(1);  
}

FireTrayHandler.stopASong = function () {
    if(FireTrayHandler.pPS != null && FireTrayHandler.pPS.status.state != 4){
            FireTrayHandler.pPS.sequencer.stop();
    }
}

FireTrayHandler.songSetup = function() {
      
      FireTrayHandler.pPS = Components.classes["@songbirdnest.com/Songbird/Mediacore/Manager;1"].getService(Components.interfaces.sbIMediacoreManager);
      Components.utils.import("resource://app/jsmodules/sbProperties.jsm");
      
      var myPlaylistPlaybackServiceListener = {
        
        init: function() {
           FireTrayHandler.pPS.addListener(this);          
        },
        
        onMediacoreEvent: function(aEvent){
          if (aEvent.type == aEvent.TRACK_CHANGE){
            this.onTrackChange(aEvent.data)
          } else if (aEvent.type == aEvent.STREAM_STOP){
           this.onStop();
          }
        },

      onTrackChange: function(aMediaItem) {
        
        var artist=aMediaItem.getProperty(SBProperties.artistName);
        var title=aMediaItem.getProperty(SBProperties.trackName);
        var album=aMediaItem.getProperty(SBProperties.albumName);
        var showSong=true;
                  
        //Check on null or empty infos and length
        
        if(artist =="" |artist == null)
           artist = FireTrayHandler.string_unknown;
        if(title =="" |title == null)
           title = FireTrayHandler.string_unknown;
        if(album =="" | album == null)
           album = FireTrayHandler.string_unknown;
                    
        if(artist.length > 30){
           artist = artist.substring(0,30); 
         }
        if(title.length > 30){
           title = title.substring(0,30);   
        }
        
        if(album.length > 30){
          album = album.substring(0,30);              
        }

        FireTrayHandler.interface.setTrayTooltip(FireTrayHandler.string_artist + ": "+artist+"\n"+FireTrayHandler.string_title+": "+title+"\n"+FireTrayHandler.string_album+": "+album);
        FireTrayHandler.interface.setTrayIcon(1);
        if(showSong)
          FireTrayHandler.interface.showANotification(artist, FireTrayHandler.string_title + ": " + title + "\n" + FireTrayHandler.string_album + ": "+album,null);      
        
      },

      onStop: function() {
        FireTrayHandler.interface.setTrayIcon(0);
      }
            
  };
  myPlaylistPlaybackServiceListener.init();
}


// -- TRAY ICON HANDLING FUNCTIONS -----------------------------------



FireTrayHandler.SetDefaultTextTooltip = function()
{  
  var text=FireTrayHandler.getDefaultAppString(FireTrayHandler.appCode);
  FireTrayHandler.interface.setTrayTooltip(text);
} 


FireTrayHandler.setTrayIcon = function() {
 
  FireTrayHandler.interface.setDefaultXpmIcon(FireTrayHandler.appCode);

  //check use user specified icons
 try {

  if( FireTrayHandler.getBoolPref("extensions.firetray.use_custom_normal_icon",false) )
     {
    var icon_normal=FireTrayHandler.getCharPref("extensions.firetray.custom_normal_icon","");
    FireTrayHandler.interface.setDefaultIcon(icon_normal);

     }

  if( FireTrayHandler.getBoolPref("extensions.firetray.use_custom_special_icon",false) )
     {
    var icon_special=FireTrayHandler.getCharPref("extensions.firetray.custom_special_icon","");
    FireTrayHandler.interface.setSpecialIcon(icon_special);
     }
  }
  catch (err)  { 
    alert(err); 
  }

  FireTrayHandler.SetDefaultTextTooltip();
 
  FireTrayHandler.update(); 
}

// -- MENUS ----------------------------------------------------

FireTrayHandler.setupMenus = function() {
  
  if(FireTrayHandler.menuCreated) return; 
 
  FireTrayHandler.interface.trayActivateEvent(FireTrayHandler.trayCallback);
  FireTrayHandler.interface.trayScrollEvent(FireTrayHandler.trayScrollCallback);
  FireTrayHandler.interface.trayKeyEvent(FireTrayHandler.trayKeyCallback);
      
  if(FireTrayHandler.getBoolPref("extensions.firetray.grab_multimedia_keys"),false)
   {   
     FireTrayHandler.interface.addHandledKeyCode(FireTrayHandler.getIntPref("extensions.firetray.hide_show_mm_key"),161);

     if(FireTrayHandler.isSong)
      {
        FireTrayHandler.interface.addHandledKey("XF86AudioPlay");
        FireTrayHandler.interface.addHandledKey("XF86AudioPause");
        FireTrayHandler.interface.addHandledKey("XF86AudioNext");
        FireTrayHandler.interface.addHandledKey("XF86AudioPrev");
        FireTrayHandler.interface.addHandledKey("XF86AudioStop");
      }
    }
    
    // Init basic pop-up menu items.
    var tray_menu = FireTrayHandler.interface.getTrayMenu();

    if (tray_menu) {

       var item_s_one = FireTrayHandler.interface.separatorMenuItemNew();
       FireTrayHandler.interface.menuAppend(tray_menu, item_s_one, null);
            
       FireTrayHandler.menu_item_restore = FireTrayHandler.interface.menuItemNew(FireTrayHandler.string_restoreall,"");
       FireTrayHandler.interface.menuAppend(tray_menu, FireTrayHandler.menu_item_restore , FireTrayHandler.restoreCallback);

       //FireTrayHandler.menu_item_hideall = FireTrayHandler.interface.menuItemNew(FireTrayHandler.string_hideall,"");
       //FireTrayHandler.interface.menuAppend(tray_menu, FireTrayHandler.menu_item_hideall , FireTrayHandler.restoreCallback);

       var item_s_two = FireTrayHandler.interface.separatorMenuItemNew();
       FireTrayHandler.interface.menuAppend(tray_menu, item_s_two, null);

       if(FireTrayHandler.isMail) {       //thunderbird special menu entries

          var mail_check = FireTrayHandler.interface.menuItemNew(FireTrayHandler.string_check_mail,"");
          FireTrayHandler.interface.menuAppend(tray_menu, mail_check, FireTrayHandler.checkMail);

          var new_mail = FireTrayHandler.interface.menuItemNew(FireTrayHandler.string_new_mail,"");
          FireTrayHandler.interface.menuAppend(tray_menu, new_mail, FireTrayHandler.composeNewMail);

          var mail_end_separator = FireTrayHandler.interface.separatorMenuItemNew();
          FireTrayHandler.interface.menuAppend(tray_menu, mail_end_separator, null);
        }

        if(FireTrayHandler.isBrowser) { 
              
         /*  var newwin = FireTrayHandler.interface.menuItemNew("Open new window");
             FireTrayHandler.interface.menuAppend(tray_menu, newwin, FireTrayHandler.new_window);

             var newtab = FireTrayHandler.interface.menuItemNew("Open new tab");
             FireTrayHandler.interface.menuAppend(tray_menu, newtab, FireTrayHandler.new_tab);

             var closewins = FireTrayHandler.interface.menuItemNew("Close windows");
             FireTrayHandler.interface.menuAppend(tray_menu, closewins, FireTrayHandler.close_windows);

             var mail_end_separator = FireTrayHandler.interface.separatorMenuItemNew();
             FireTrayHandler.interface.menuAppend(tray_menu, mail_end_separator, null);*/
        
        }

        if(FireTrayHandler.isSong) {
          
           FireTrayHandler.interface.menuInsert(tray_menu,
           FireTrayHandler.interface.menuItemNew(FireTrayHandler.string_previous_track ,"gtk-media-previous"), 0, FireTrayHandler.prevTrack);
      
           FireTrayHandler.interface.menuInsert(tray_menu,
           FireTrayHandler.interface.menuItemNew(FireTrayHandler.string_play + "/" + FireTrayHandler.string_pause, "gtk-media-play"), 1, FireTrayHandler.playPause);
          
           FireTrayHandler.interface.menuInsert(tray_menu,
           FireTrayHandler.interface.menuItemNew(FireTrayHandler.string_stop,"gtk-media-stop"), 2, FireTrayHandler.stopASong);
      
           FireTrayHandler.interface.menuInsert(tray_menu,
           FireTrayHandler.interface.menuItemNew(FireTrayHandler.string_next_track,"gtk-media-next"), 3, FireTrayHandler.nextTrack);
        }

        var item_exit = FireTrayHandler.interface.menuItemNew(FireTrayHandler.string_exit,"gtk-quit");
        FireTrayHandler.interface.menuAppend(tray_menu, item_exit, FireTrayHandler.exitCallback);

        if ( !FireTrayHandler.isSong) {

           //var item_s_three = FireTrayHandler.interface.separatorMenuItemNew();
           //FireTrayHandler.interface.menuInsert(tray_menu, item_s_three, 0, null);

           FireTrayHandler.item_windows_list = FireTrayHandler.interface.menuItemNew(FireTrayHandler.string_windowslist,"");
           FireTrayHandler.interface.menuInsert(tray_menu, FireTrayHandler.item_windows_list, 0, null);

           FireTrayHandler.menu_window_list = FireTrayHandler.interface.menuNew();
           FireTrayHandler.interface.menuSub(FireTrayHandler.item_windows_list, FireTrayHandler.menu_window_list);
        }

    }
    
    FireTrayHandler.menuCreated = true;
}

// -- GENERAL USE FUNCTIONS

FireTrayHandler.appStarted = function(){ 
  if(!FireTrayHandler.appStarted) { 
    FireTrayHandler.appStarted=true;
  }
}



FireTrayHandler.setWindow = function(window) {
    window.onresize = function() { FireTrayHandler.resizeEventHandler(window); }
    window.onclose = FireTrayHandler.closeEventHandler;
    FireTrayHandler.setAndUpdateCloseHandler();

    //minimize at start "hack" to wait for all windows to be restored
    if(!FireTrayHandler.isMail) //not needed with thunderbird
      if(FireTrayHandler.getBoolPref("extensions.firetray.start_minimized",false))
      {
        var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer); 
        timer.initWithCallback( FireTrayHandler.timerEvent, FIRETRAY_WAIT_BROWSER_STARTUP_DELAY * 1000, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
      }
 
    FireTrayHandler.updateMenuLabels();       
}

FireTrayHandler.update = function() {
   if(FireTrayHandler.isMail) FireTrayHandler.updateMailTray(true);        
   FireTrayHandler.updateMenuLabels();
}