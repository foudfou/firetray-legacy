var FireTray = new Object();

FireTray.gfiretrayBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);

FireTray.strings = FireTray.gfiretrayBundle.createBundle("chrome://firetray/locale/core.properties");
FireTray.string_closerequest = FireTray.strings.GetStringFromName("firetray_closerequest");
FireTray.string_exitrequest = FireTray.strings.GetStringFromName("firetray_exitrequest");
FireTray.string_restoreall = FireTray.strings.GetStringFromName("firetray_restoreall");
//FireTray.string_hideall = "Hide all windows";//FireTray.strings.GetStringFromName("firetray_hideall");
FireTray.string_exit = FireTray.strings.GetStringFromName("firetray_exit");
FireTray.string_windowslist = FireTray.strings.GetStringFromName("firetray_windowslist");
FireTray.string_no_unread_messages = FireTray.strings.GetStringFromName("firetray_no_unread_messages");
FireTray.string_unread_message = FireTray.strings.GetStringFromName("firetray_unread_message");
FireTray.string_unread_messages = FireTray.strings.GetStringFromName("firetray_unread_messages");
FireTray.string_check_mail = FireTray.strings.GetStringFromName("firetray_check_mail");
FireTray.string_new_mail = FireTray.strings.GetStringFromName("firetray_new_mail");
FireTray.string_previous_track = FireTray.strings.GetStringFromName("firetray_previous_track");
FireTray.string_next_track = FireTray.strings.GetStringFromName("firetray_next_track");
FireTray.string_play = FireTray.strings.GetStringFromName("firetray_play");
FireTray.string_pause = FireTray.strings.GetStringFromName("firetray_pause");
FireTray.string_stop = FireTray.strings.GetStringFromName("firetray_stop");
FireTray.string_unknown = FireTray.strings.GetStringFromName("firetray_unknown");
FireTray.string_artist = FireTray.strings.GetStringFromName("firetray_artist");
FireTray.string_album = FireTray.strings.GetStringFromName("firetray_album");
FireTray.string_title = FireTray.strings.GetStringFromName("firetray_title");
FireTray.string_junk_message = FireTray.strings.GetStringFromName("firetray_junk_message");
FireTray.string_junk_messages = FireTray.strings.GetStringFromName("firetray_junk_messages");

FireTray.minimizeComponent = Components.classes['@mozilla.org/Minimize;1'].getService(Components.interfaces.nsIMinimize);
FireTray.pPS=null;
FireTray.minimized=false;


FireTray.interface = Components.classes["@mozilla.org/FireTray;1"].getService(Components.interfaces.nsITray);


FireTray.prefObserver =
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
    FireTray.updatePreferences();
  }
}

FireTray.isHidden = function() {
  var baseWindows = FireTray.getAllWindows();
  return  (baseWindows.length == FireTray.interface.menuLength(FireTray.minimizeComponent.menu_window_list)) || (FireTray.isSong && FireTray.minimized) ; 
}


FireTray.trayCallback = function() {
   //var vis=FireTray.isVisible (); //TOFIX: ISVISIBLE NOT WORKING
   //alert(vis);
   if ( FireTray.isHidden() ) {
    
       if(FireTray.isMail && FireTray.prefManager.getBoolPref("extensions.firetray.restore_to_next_unread"))
              GoNextMessage(nsMsgNavigationType.nextUnreadMessage,true);

       FireTray.restoreFromTray(); 	  

    } else {
        
       FireTray.hideToTray();

   }

}


FireTray.trayScrollCallback = function(direction) {
 
   if(FireTray.prefManager.getBoolPref("extensions.firetray.scroll_to_hide"))
   {
     var scroll_action=FireTray.prefManager.getIntPref("extensions.firetray.scroll_action");

     switch(scroll_action)
     {
      case 0: // UP=hide DOWN=unhide
            if(direction==0) FireTray.hideToTray();
            if(direction==1) FireTray.restoreFromTray();
            break;

      case 1: // UP=unhide DOWN=hide
            if(direction==0) FireTray.restoreFromTray();
            if(direction==1) FireTray.hideToTray();
            break;

      case 2: // Songbird volume control
           if(FireTray.isSong){
            if(direction==0) FireTray.volumeChange(true); 
            if(direction==1) FireTray.volumeChange(false);
           }

           break;

      case 3: // Songbird prev/next song
           if(FireTray.isSong){
            if(direction==0) FireTray.prevTrack();
            if(direction==1) FireTray.nextTrack();
           }
           
           break;

          default:
		break;
       }  

   }
  
}

FireTray.trayKeyCallback = function(key_string, key_code) {

  //alert(key_string + " KEY_CODE: "+key_code);
 
  try {
 
  if (key_code==FireTray.prefManager.getIntPref("extensions.firetray.hide_show_mm_key")) FireTray.trayCallback();

  if(!FireTray.isSong) return;
  if (key_string=="XF86AudioPlay") FireTray.playPause();
  if (key_string=="XF86AudioPause") FireTray.playPause();
  if (key_string=="XF86AudioNext") FireTray.nextTrack();
  if (key_string=="XF86AudioPrev") FireTray.prevTrack();
  if (key_string=="XF86AudioStop") FireTray.stopASong();
  } catch(err) {}
}


FireTray.exitCallback = function() {
    try {
	var appStartup = Components.classes['@mozilla.org/toolkit/app-startup;1'].getService(Components.interfaces.nsIAppStartup);
        var do_confirm=true;
        do_confirm=FireTray.prefManager.getBoolPref("extensions.firetray.confirm_exit");
        if (!do_confirm || confirm(FireTray.string_exitrequest)) {
          appStartup.quit(Components.interfaces.nsIAppStartup.eAttemptQuit);
        }
    } catch (err) {
        alert(err);
        return;
    }
   
};

FireTray.restoreCallback = function() {
    var baseWindows = FireTray.getAllWindows();
    FireTray.interface.restore(baseWindows.length, baseWindows);
    FireTray.minimized = false;
    FireTray.interface.menuRemoveAll(FireTray.minimizeComponent.menu_window_list);
};

FireTray.updatePreferences=function(){

    FireTray.setTrayIcon();
    
    //set windows close and minimize command blocking 
    FireTray.interface.setCloseBlocking(FireTray.prefManager.getBoolPref("extensions.firetray.close_to_tray"));	
    FireTray.interface.setMinimizeBlocking(FireTray.prefManager.getBoolPref("extensions.firetray.minimize_to_tray")); 
}

/*
FireTray.observe=function(subject,topic,data){
     alert("observe!");
     if (topic != "nsPref:changed")
     {
       return;
     }
     
/*     switch(data)
     {
       case "symbol":
         this.tickerSymbol = this.prefs.getCharPref("symbol").toUpperCase();
         this.refreshInformation();
         break;
     }*/


FireTray.getBaseWindow = function(win) {
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
        /* ignore no-interface exception */
    }
    return rv;    
};

FireTray.getAllWindows = function() {
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
        baseWindows[baseWindows.length] = FireTray.getBaseWindow(w);
    } 

    return baseWindows;
};

FireTray.windowsListAdd = function(basewindow) {
    var aWindow = FireTray.interface.menuItemNew(basewindow.title,"");
    FireTray.interface.menuAppend(FireTray.minimizeComponent.menu_window_list, aWindow, function() {
                FireTray.interface.restoreWindow(basewindow);
                FireTray.interface.menuRemove(FireTray.minimizeComponent.menu_window_list, aWindow);
            });
};

FireTray.hideWindow = function() {
    var basewindow = FireTray.getBaseWindow(window);
    FireTray.interface.hideWindow(basewindow);
    FireTray.minimized = true;
    FireTray.windowsListAdd(basewindow);
}


FireTray.hideToTray = function() {
    FireTray.interface.menuRemoveAll(FireTray.minimizeComponent.menu_window_list);

    var baseWindows = FireTray.getAllWindows();
    FireTray.minimized = true;
    for(var i=0; i<baseWindows.length; i++) {
        var basewindow = baseWindows[i];
        FireTray.interface.hideWindow(basewindow);
        FireTray.windowsListAdd(basewindow);
    }

   if(FireTray.isMail) FireTray.updateMailTray(true);  
}

FireTray.restoreFromTray = function() {
    var baseWindows = FireTray.getAllWindows();
    FireTray.interface.restore(baseWindows.length, baseWindows);
    FireTray.interface.menuRemoveAll(FireTray.minimizeComponent.menu_window_list);
    FireTray.minimized = false;

    if(FireTray.isMail) FireTray.updateMailTray(true);  
}

FireTray.closeEventHandler = function() {
   // if the window menubar is not visible (ex.popup windows) don't close to tray
   if(window.menubar.visible && FireTray.prefManager.getBoolPref("extensions.firetray.close_to_tray")) {
      FireTray.hideToTray();
      return false;	
   }
   
}

FireTray.resizeEventHandler = function() {
   if(!FireTray.interface.appStarted){	
	if(FireTray.prefManager.getBoolPref("extensions.firetray.start_minimized")){	
        if(FireTray.isMail)FireTray.appStarted();
		FireTray.hideToTray();		        
	}
   }
}

FireTray.getDefaultAppString = function(appcode) 
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

FireTray.getMozillaAppCode = function() {

  /* RETURN VALUE
   0 - Unknown (defaults to firefox)
   1 - Firefox
   2 - Thunderbird
   3 - Swiftdove
   4 - Swiftweasel
   5 - Icedove
   6 - iceweasel 
   7 - icecat
   8 - songbird
   9 - sunbird
   10 - seamonkey
  */

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
        FireTray.isBrowser=true; 
        if(appname=="swiftweasel") return 4; 
        if(appname=="iceweasel") return 6; 
        if(appname=="icecat") return 7; 
        return 1;  //Firefox
        break;

     case THUNDERBIRD_ID:
        FireTray.isMail=true; 
        if(appname=="swiftdove") return 3; 
        if(appname=="icedove") return 5; 
        return 2;  //Thunderbird
        break;
     case SONGBIRD_ID:
        FireTray.isSong=true;
        FireTray.interface.initNotification(SONGBIRD_ID);
        return 8; //songbird
        break;

     case SUNBIRD_ID:
        FireTray.isCalendar=true; 
        return 9; //sunbird
        break;

     case SEAMONKEY_ID:
        FireTray.isBrowser=true; 
        FireTray.isMail=true;  
        return 10;  //Seamonkey
        break;
        
     case CHATZILLA_ID:
        FireTray.isBrowser=true;
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


FireTray.getSpamFolder = function(spamFolderURI, folders) {
  for(var i=0; i<folders.length; i++)
  {
     var spamfolder=folders[i].getChildWithURI(spamFolderURI, true, false);
     if(spamfolder!=null) return spamfolder;          
  }
}

FireTray.getMailCount = function() {

    var folders = [FireTray.localfolders];
    var spamFolderURIs = [];
    var allServers = FireTray.accountManager.allServers;

    var num_unread_msgs = folders[0].getNumUnread(true);
    var num_new_msgs = folders[0].getNumNewMessages(true);
    var num_unread_spam_msgs = 0;
    var num_new_spam_msgs = 0;
    
    var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
     // Get accounts id to check in preferences
    var prefs = prefManager.getCharPref('extensions.firetray.accounts_to_exclude');
    var accounts_to_exclude = new Array();
    accounts_to_exclude = prefs.split(' ');
  
    for(var i=0; i< allServers.Count(); i++)    
    {
        if(accounts_to_exclude.indexOf(String(i))>=0) continue;
        
        var server = allServers.GetElementAt(i).QueryInterface(Components.interfaces.nsIMsgIncomingServer);

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
    }

    for(var i=0; i<spamFolderURIs.length; i++) //get spam mail count
    {
      var spamfolder=FireTray.getSpamFolder(spamFolderURIs[i], folders);   
      if(spamfolder!=null) 
      {
        num_unread_spam_msgs +=spamfolder.getNumUnread(true);   
        num_new_spam_msgs += spamfolder.getNumNewMessages(true);
      }
    }

    
    FireTray.numUnreadMail = num_unread_msgs;
    FireTray.numNewMail = num_new_msgs; 
    FireTray.numUnreadSpam = num_unread_spam_msgs;
    FireTray.numNewSpam = num_new_spam_msgs; 
}


FireTray.updateMailTray = function (force_update) {

  //get preferences

  //TODO ADD OPTION TO SHOW UNREAD VS NEW MAIL COUNT
  var show_num_new = true;
  var show_num_unread = false; 
  
  
  if(force_update) FireTray.lastnum=-1; //force updating icon

  if( FireTray.prefManager.getBoolPref("extensions.firetray.show_num_unread") && 
      !(FireTray.prefManager.getBoolPref("extensions.firetray.show_unread_only_minimized") && !FireTray.isHidden() ) && FireTray.localfolders  )
   {
     FireTray.getMailCount(); 
   }
  else
  {
     FireTray.interface.setIconText("", "#000000");
     FireTray.SetDefaultTextTooltip();
     return;
  }

  var res=FireTray.numUnreadMail;
  var spam_tooltip="";
 
  if(FireTray.prefManager.getBoolPref("extensions.firetray.dont_count_spam") && FireTray.numUnreadSpam>0)  {
     res-=FireTray.numUnreadSpam;
     if(res<0) res=0;
     if(FireTray.numUnreadSpam>1) spam_tooltip=" ("+FireTray.numUnreadSpam+" "+FireTray.string_junk_messages+ ")"; 
     else spam_tooltip=" ("+FireTray.numUnreadSpam+" "+FireTray.string_junk_message+ ")"; 
  }

  if(FireTray.lastnum==res) return; //update the icon only if something has changed
  FireTray.lastnum=res;

  var tooltip="";
  var num=""+res;
  if(res==0) { num=""; tooltip=FireTray.string_no_unread_messages + spam_tooltip; }
  else if(res==1)  tooltip=res + " " + FireTray.string_unread_message + spam_tooltip; 
       else tooltip = res + " " + FireTray.string_unread_messages + spam_tooltip;

  var color="#000000";

  try { 
   color=FireTray.prefManager.getCharPref("extensions.firetray.text_color")
  }  catch (err) {  }

  //num = FireTray.numNewMail + "/" + num;
  FireTray.interface.setIconText(num, color);
  FireTray.interface.setTrayTooltip(tooltip);
}


FireTray.subscribeToMailEvents = function()
{

  var mailSession = Components.classes["@mozilla.org/messenger/services/session;1"].
  getService(Components.interfaces.nsIMsgMailSession);
 
  var folderListener = {
  OnItemAdded: function(parent, item) {},
  OnItemBoolPropertyChanged: function(item, property, oldValue, newValue) {},
  OnItemEvent: function(item, event)  {},
  OnItemIntPropertyChanged: function(item, property, oldValue, newValue) { FireTray.updateMailTray(false); },
  OnItemPropertyChanged: function(parent, item, viewString) {},
  OnItemPropertyFlagChanged: function(item, property, oldFlag, newFlag) {},
  OnItemRemoved: function(parent, item) {},
  OnItemUnicharPropertyChanged: function(item, property, oldValue, newValue) {},
}
 
  var nFlags = Components.interfaces.nsIFolderListener.added | Components.interfaces.nsIFolderListener.intPropertyChanged; mailSession.AddFolderListener(folderListener,nFlags);
}

FireTray.checkMail = function() {
  MsgGetMessagesForAllAuthenticatedAccounts();    
}

FireTray.composeNewMail = function() {
  goOpenNewMessage();  
}

FireTray.volumeChange = function(raise) {
    if(FireTray.pPS == null) return;
   
    var volume=FireTray.pPS.volumeControl.volume;

    var delta=0.1; // change volume by 10%

    if(raise) {
       if(volume<1) {
           volume=volume+delta;
           if(volume>1) volume=1;
           FireTray.pPS.volumeControl.volume=volume;
       }
    } else {
       if(volume>0) {
           volume=volume-delta;
           if(volume<0) volume=0;
           FireTray.pPS.volumeControl.volume=volume;
       }
    }

}

FireTray.prevTrack = function() {
    if(FireTray.pPS == null) return;
        
    FireTray.pPS.sequencer.previous();
    FireTray.pPS.sequencer.play();
}

FireTray.nextTrack = function() {
    if(FireTray.pPS == null) return;

    FireTray.pPS.sequencer.next();
    FireTray.pPS.sequencer.play();
}

FireTray.playPause = function () {
	if(FireTray.pPS == null) return;

    if(FireTray.pPS.status.state == 2)
        FireTray.pPS.playbackControl.play();
    else if (FireTray.pPS.status.state != 1){
        FireTray.pPS.sequencer.play();
        if (FireTray.pPS.status.state != 1)
            Components.classes['@songbirdnest.com/Songbird/ApplicationController;1'].createInstance(Components.interfaces.sbIApplicationController).playDefault()
    }else
        FireTray.pPS.playbackControl.pause();
    FireTray.interface.setTrayIcon(1);	
}

FireTray.stopASong = function () {
	if(FireTray.pPS != null && FireTray.pPS.status.state != 4){
			FireTray.pPS.sequencer.stop();
	}
}

FireTray.isVisible = function() {
    var baseWindows = FireTray.getAllWindows();
    var cnt=0;
    var res=false;

    for(var i=0; i<baseWindows.length; i++) {
        var basewindow = baseWindows[i];
          res=false;
          res=FireTray.interface.getFocusState(basewindow);
          if(res) cnt++;        
    }
    if(cnt>0) return true;
    return false;
}

FireTray.setCloseHandler = function() {
    
    var baseWindows = FireTray.getAllWindows();

    for(var i=0; i<baseWindows.length; i++) {
        var basewindow = baseWindows[i];
          FireTray.interface.setWindowHandler(basewindow);

    }
}

FireTray.SetDefaultTextTooltip = function()
{
  var appcode=FireTray.getMozillaAppCode();
  var text=FireTray.getDefaultAppString(appcode);
  FireTray.interface.setTrayTooltip(text);
} 


FireTray.setTrayIcon = function() {
 
 var app=FireTray.getMozillaAppCode();
  FireTray.interface.setDefaultXpmIcon(app);

  //check use user specified icons
 try {

  if( FireTray.prefManager.getBoolPref("extensions.firetray.use_custom_normal_icon") )
     {
	var icon_normal=FireTray.prefManager.getCharPref("extensions.firetray.custom_normal_icon");
	FireTray.interface.setDefaultIcon(icon_normal);

     }

  if( FireTray.prefManager.getBoolPref("extensions.firetray.use_custom_special_icon") )
     {
	var icon_special=FireTray.prefManager.getCharPref("extensions.firetray.custom_special_icon");
	FireTray.interface.setSpecialIcon(icon_special);
     }
  }
  catch (err)  { 
  	alert(err); 
  }

  FireTray.SetDefaultTextTooltip();

  FireTray.interface.showTray();

  if (FireTray.isMail) FireTray.updateMailTray(true);

}

FireTray.setupMenus = function() {

    /*var keystr;
   
    keystr=FireTray.interface.getKeycodeString(161);

    var str = "Hide/unkyde keycode: " + 161 + " (" + keystr + ")";
    alert(str);*/

 
        FireTray.interface.trayActivateEvent(FireTray.trayCallback);
        FireTray.interface.trayScrollEvent(FireTray.trayScrollCallback);
        FireTray.interface.trayKeyEvent(FireTray.trayKeyCallback);
      
        if(FireTray.prefManager.getBoolPref("extensions.firetray.grab_multimedia_keys"))
        {   
          FireTray.interface.addHandledKeyCode(FireTray.prefManager.getIntPref("extensions.firetray.hide_show_mm_key"));

          if(FireTray.isSong)
          {
             FireTray.interface.addHandledKey("XF86AudioPlay");
             FireTray.interface.addHandledKey("XF86AudioPause");
             FireTray.interface.addHandledKey("XF86AudioNext");
             FireTray.interface.addHandledKey("XF86AudioPrev");
             FireTray.interface.addHandledKey("XF86AudioStop");
          }
        }
        // Init basic pop-up menu items.
        var tray_menu = FireTray.interface.getTrayMenu();

        if (tray_menu) {

            var item_s_one = FireTray.interface.separatorMenuItemNew();
            FireTray.interface.menuAppend(tray_menu, item_s_one, null);
            
	    var item_restore = FireTray.interface.menuItemNew(FireTray.string_restoreall,"");
            FireTray.interface.menuAppend(tray_menu, item_restore, FireTray.restoreCallback);
            var item_s_two = FireTray.interface.separatorMenuItemNew();
            FireTray.interface.menuAppend(tray_menu, item_s_two, null);

            if(FireTray.isMail) {       //thunderbird special menu entries

                var mail_check = FireTray.interface.menuItemNew(FireTray.string_check_mail,"");
                FireTray.interface.menuAppend(tray_menu, mail_check, FireTray.checkMail);

                var new_mail = FireTray.interface.menuItemNew(FireTray.string_new_mail,"");
                FireTray.interface.menuAppend(tray_menu, new_mail, FireTray.composeNewMail);

                var mail_end_separator = FireTray.interface.separatorMenuItemNew();
                FireTray.interface.menuAppend(tray_menu, mail_end_separator, null);
	    }

            if(FireTray.isBrowser) { 
		//thunderbird special menu entries
              /*  var newwin = FireTray.interface.menuItemNew("Open new window");
                FireTray.interface.menuAppend(tray_menu, newwin, FireTray.new_window);

                var newtab = FireTray.interface.menuItemNew("Open new tab");
                FireTray.interface.menuAppend(tray_menu, newtab, FireTray.new_tab);

                var closewins = FireTray.interface.menuItemNew("Close windows");
                FireTray.interface.menuAppend(tray_menu, closewins, FireTray.close_windows);

                var mail_end_separator = FireTray.interface.separatorMenuItemNew();
                FireTray.interface.menuAppend(tray_menu, mail_end_separator, null);*/
		
            }

	    if(FireTray.isSong) {
	      
               FireTray.interface.menuInsert(tray_menu,
	       FireTray.interface.menuItemNew(FireTray.string_previous_track ,"gtk-media-previous"), 0, FireTray.prevTrack);
      
	       FireTray.interface.menuInsert(tray_menu,
	       FireTray.interface.menuItemNew(FireTray.string_play + "/" + FireTray.string_pause, "gtk-media-play"), 1, FireTray.playPause);
	      
	       FireTray.interface.menuInsert(tray_menu,
	       FireTray.interface.menuItemNew(FireTray.string_stop,"gtk-media-stop"), 2, FireTray.stopASong);
	  
	       FireTray.interface.menuInsert(tray_menu,
	       FireTray.interface.menuItemNew(FireTray.string_next_track,"gtk-media-next"), 3, FireTray.nextTrack);

	       /*var volume_menu = FireTray.interface.menuNew();

	       FireTray.interface.menuInsert(volume_menu,
	       FireTray.interface.menuItemNew("100%",""), 0, FireTray.nextTrack);
	       FireTray.interface.menuInsert(volume_menu,
	       FireTray.interface.menuItemNew("90%",""), 0, FireTray.nextTrack);
	       FireTray.interface.menuInsert(volume_menu,
	       FireTray.interface.menuItemNew("80%",""), 0, FireTray.nextTrack);
	       FireTray.interface.menuInsert(volume_menu,
	       FireTray.interface.menuItemNew("50%",""), 0, FireTray.nextTrack);
	       FireTray.interface.menuInsert(volume_menu,
	       FireTray.interface.menuItemNew("25%",""), 0, FireTray.nextTrack);
	       FireTray.interface.menuInsert(volume_menu,
	       FireTray.interface.menuItemNew("0%",""), 0, FireTray.nextTrack);

	       var item_volume=FireTray.interface.menuItemNew("Volume","");
	       FireTray.interface.menuInsert(tray_menu,item_volume, 4, null);
	       

  	       FireTray.interface.menuSub(item_volume, volume_menu);*/

	    }

            var item_exit = FireTray.interface.menuItemNew(FireTray.string_exit,"gtk-quit");
            FireTray.interface.menuAppend(tray_menu, item_exit, FireTray.exitCallback);


            if ( !FireTray.isSong){

                //var item_s_three = FireTray.interface.separatorMenuItemNew();
                //FireTray.interface.menuInsert(tray_menu, item_s_three, 0, null);

                var item_windows_list = FireTray.interface.menuItemNew(FireTray.string_windowslist,"");
                FireTray.interface.menuInsert(tray_menu, item_windows_list, 0, null);

    
                FireTray.minimizeComponent.menu_window_list = FireTray.interface.menuNew();
  	        FireTray.interface.menuSub(item_windows_list, FireTray.minimizeComponent.menu_window_list);

            }

        }

}

FireTray.mailSettings = function() {
      FireTray.accountManager = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Components.interfaces.nsIMsgAccountManager);

	  try
	  {
        FireTray.localfolders = FireTray.accountManager.localFoldersServer.rootFolder;
	  }
	  catch(error) {}
      FireTray.subscribeToMailEvents();
}

FireTray.songSettings = function() {

	
	      FireTray.pPS = Components.classes["@songbirdnest.com/Songbird/Mediacore/Manager;1"]
		      .getService(Components.interfaces.sbIMediacoreManager);
      Components.utils.import("resource://app/jsmodules/sbProperties.jsm");
	      /* Song controls */


	      
	      
	      /*var item_s_six = FireTray.interface.separatorMenuItemNew();
	      FireTray.interface.menuInsert(tray_menu, item_s_six, 0, null);
	      var item_music_ctrl = FireTray.interface.menuItemNew("Music");
	      FireTray.interface.menuSub(item_music_ctrl, music_list);
	      FireTray.interface.menuInsert(tray_menu, item_music_ctrl, 1, null);*/
	      
	      
	      var myPlaylistPlaybackServiceListener = {
		      init: function() {
			      FireTray.pPS.addListener(this);
		      },
	  onMediacoreEvent: function(aEvent){
	      if (aEvent.type == aEvent.TRACK_CHANGE){
		  this.onTrackChange(aEvent.data)
	      }else if (aEvent.type == aEvent.STREAM_STOP){
		  this.onStop();
	      }
	  },
		      onTrackChange: function(aMediaItem) {
	      var artist=aMediaItem.getProperty(SBProperties.artistName);
			      var title=aMediaItem.getProperty(SBProperties.trackName);
			      var album=aMediaItem.getProperty(SBProperties.albumName);
			  var showSong=true;//FireTray.prefManager.getBoolPref("extensions.firetray.show_notification");
			      
			      /*Check on null or empty infos and length*/
			      if(artist =="" |artist == null)
				      artist = FireTray.string_unknown;
			      if(title =="" |title == null)
				      title = FireTray.string_unknown;
			      if(album =="" | album == null)
				      album = FireTray.string_unknown;
			      
			      if(artist.length > 30){
				      artist = artist.substring(0,30);	
			      }
			      if(title.length > 30){
				      title = title.substring(0,30);	
			      }
			      if(album.length > 30){
				      album = album.substring(0,30);	
			      }
			      
			      FireTray.interface.setTrayTooltip(FireTray.string_artist + ": "+artist+"\n"+FireTray.string_title+": "+title+"\n"+FireTray.string_album+": "+album);
			      FireTray.interface.setTrayIcon(1);
			      if(showSong)
				      FireTray.interface.showANotification(artist, FireTray.string_title + ": " + title + "\n" + FireTray.string_album + ": "+album,null);
	  },
		      onStop: function() {
			      FireTray.interface.setTrayIcon(0);
		      }
	      };
	      myPlaylistPlaybackServiceListener.init();
	
}

FireTray.appStarted = function(){ 
  if(!FireTray.interface.appStarted) { 
    FireTray.interface.appStarted=true;
  }
}

FireTray.timerEvent = { notify: function(timer) { FireTray.appStarted(); } }

FireTray.init = function() {

    if(FireTray.interface.menuCreated) {
      //If the tray is already loaded this is a new window.
      //We just have to set the close handler for all the 
      //windows not handled jet.
      FireTray.setCloseHandler();
      return;
    }
    else FireTray.interface.menuCreated=true;

    FireTray.isMail=false;
    FireTray.isSong=false;
    FireTray.isCalendar=false; 
    FireTray.lastnum=-1;

    window.onresize = FireTray.resizeEventHandler;

    //register an observer for getting prefs changes 
    FireTray.prefManager = Components.classes["@mozilla.org/preferences-service;1"]
                                .getService(Components.interfaces.nsIPrefBranch);
                                
    FireTray.prefObserver.register();

    var app=FireTray.getMozillaAppCode();

    if (!FireTray.minimizeComponent.menu_window_list) {

       FireTray.setupMenus();
       if(FireTray.isMail) FireTray.mailSettings();
       if(FireTray.isSong) FireTray.songSettings();

    }

    FireTray.setTrayIcon();
   

    window.setTimeout(function() {
                window.removeEventListener("load", FireTray.init, true);
                window.onclose = FireTray.closeEventHandler;
            }, 0);

    FireTray.setCloseHandler();
    FireTray.updatePreferences();
 
    //minimize at start "hack" to wait for all windows to be restored
    var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
 
    var nsec=5;
    timer.initWithCallback( FireTray.timerEvent, nsec * 1000, Components.interfaces.nsITimer.TYPE_ONE_SHOT);

    
  // FireTray.hideToTray();
}


/*Firetray.testEvent = function() {
  alert("TEST!");  
}*/





window.addEventListener("load", FireTray.init, true);

//trick to know when all windows are restored by SessionSaver
//document.addEventListener("SSTabRestored", FireTray.checkAppStarted, false);





