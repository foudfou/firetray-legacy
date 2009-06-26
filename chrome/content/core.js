var gfiretrayBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);

var mystrings = gfiretrayBundle.createBundle("chrome://firetray/locale/core.properties");
var firetray_closerequest = mystrings.GetStringFromName("firetray_closerequest");
var firetray_exitrequest = mystrings.GetStringFromName("firetray_exitrequest");
var firetray_restoreall = mystrings.GetStringFromName("firetray_restoreall");
var firetray_exit = mystrings.GetStringFromName("firetray_exit");
var firetray_windowslist = mystrings.GetStringFromName("firetray_windowslist");
var firetray_no_unread_messages = mystrings.GetStringFromName("firetray_no_unread_messages");
var firetray_unread_message = mystrings.GetStringFromName("firetray_unread_message");
var firetray_unread_messages = mystrings.GetStringFromName("firetray_unread_messages");
var firetray_check_mail = mystrings.GetStringFromName("firetray_check_mail");
var firetray_new_mail = mystrings.GetStringFromName("firetray_new_mail");
var firetray_previous_track = mystrings.GetStringFromName("firetray_previous_track");
var firetray_next_track = mystrings.GetStringFromName("firetray_next_track");
var firetray_play = mystrings.GetStringFromName("firetray_play");
var firetray_pause = mystrings.GetStringFromName("firetray_pause");
var firetray_stop = mystrings.GetStringFromName("firetray_stop");
var firetray_unknown = mystrings.GetStringFromName("firetray_unknown");
var firetray_artist = mystrings.GetStringFromName("firetray_artist");
var firetray_album = mystrings.GetStringFromName("firetray_album");
var firetray_title = mystrings.GetStringFromName("firetray_title");

var minimizeComponent = Components.classes['@mozilla.org/Minimize;1'].getService(Components.interfaces.nsIMinimize);
var pPS=null;
var minimized=false;

var FireTray = new Object();

FireTray.interface = Components.classes["@mozilla.org/FireTray;1"].getService(Components.interfaces.nsITray);


var myPrefObserver =
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
  return  (baseWindows.length == FireTray.interface.menuLength(minimizeComponent.menu_window_list)) || (FireTray.isSong && minimized) ; 
}


FireTray.trayCallback = function() {
    //var vis=FireTray.isVisible () ; TOFIX: ISVISIBLE NOT WORKING
    if ( FireTray.isHidden() ) {
    
   if(FireTray.isMail){

           if(FireTray.prefManager.getBoolPref("extensions.firetray.restore_to_next_unread"))
              MsgNextUnreadMessage();
        } //nextUnreadMessage*/
      
        var baseWindows = FireTray.getAllWindows();
        FireTray.interface.restore(baseWindows.length, baseWindows);
        FireTray.interface.menuRemoveAll(minimizeComponent.menu_window_list);
        minimized = false;
    } else {
        FireTray.interface.menuRemoveAll(minimizeComponent.menu_window_list);
        FireTray.hideToTray();
    }

   if(FireTray.isMail)
   {
      FireTray.lastnum=-1;
      FireTray.updateMailTray(); 
   } 
 
 
};

FireTray.exitCallback = function() {
    try {
	var appStartup = Components.classes['@mozilla.org/toolkit/app-startup;1'].getService(Components.interfaces.nsIAppStartup);
        var do_confirm=true;
        do_confirm=FireTray.prefManager.getBoolPref("extensions.firetray.confirm_exit");
        if (!do_confirm || confirm(firetray_exitrequest)) {
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
    minimized = false;
    FireTray.interface.menuRemoveAll(minimizeComponent.menu_window_list);
};

FireTray.updatePreferences=function(){

    FireTray.setTrayIcon();
    
    //set windows close command blocking 
    FireTray.interface.setCloseBlocking(FireTray.prefManager.getBoolPref("extensions.firetray.close_to_tray"));	

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
    FireTray.interface.menuAppend(minimizeComponent.menu_window_list, aWindow, function() {
                FireTray.interface.restoreWindow(basewindow);
                FireTray.interface.menuRemove(minimizeComponent.menu_window_list, aWindow);
            });
};

FireTray.hideWindow = function() {
    var basewindow = FireTray.getBaseWindow(window);
    FireTray.interface.hideWindow(basewindow);
    minimized = true;
    FireTray.windowsListAdd(basewindow);
}

FireTray.hideToTray = function() {
    FireTray.interface.menuRemoveAll(minimizeComponent.menu_window_list);

    var baseWindows = FireTray.getAllWindows();
    minimized = true;
    for(var i=0; i<baseWindows.length; i++) {
        var basewindow = baseWindows[i];
        FireTray.windowsListAdd(basewindow);
        FireTray.interface.hideWindow(basewindow);
    }
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
		FireTray.hideToTray();		
	}
   }
}

FireTray.getDefaultAppString = function(appcode) 
{

   var text="";
   switch(appcode)
   {
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
        //FireTray.isMail=true;   <<   Before enabling fix mail issues
        return 10;  //Seamonkey
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


FireTray.updateMailTray = function () {

  var show_num_mail=false;

  if( FireTray.prefManager.getBoolPref("extensions.firetray.show_num_unread") && 
	 !(FireTray.prefManager.getBoolPref("extensions.firetray.show_unread_only_minimized") && !FireTray.isHidden() )  )
    {
        show_num_mail = true;

	var folders = [FireTray.localfolders];
	var allServers = accountManager.allServers;

        var res = folders[0].getNumUnread(true);

	for(var i=0; i< allServers.Count(); i++)     // TO ADD: AVOID CONSIDERING SPAM...
	{
	    var folder = allServers.GetElementAt(i).QueryInterface(Components.interfaces.nsIMsgIncomingServer).rootMsgFolder;
	    
            var found = false;
	    for(var j = 0; j < folders.length; j++)
	    {
		if(folder == folders[j])
		{
			found = true;
			break;
		}
	    }

	    if(!found)
	    {
		folders.push(folder);
		res += folder.getNumUnread(true);
	    }

	}
      /*  if(rootfolder)
	{
		var text="["+rootfolder.name+"] ";

		var folder;

		if(rootfolder.subFolders)
		while(rootfolder.subFolders.hasMoreElements())
                {
                   folder=rootfolder.subFolders.getNext();

                   if(folder) { text=text + "-" + folder.name;  }			
                    text=text+ " - ";
		}

		alert(text + " [ " + rootfolder.numSubFolders + " subs. ]");
	}/**/

 
  
  }
  else res=0;

  if(!show_num_mail) 
  {
     FireTray.interface.setIconText("", "#000000");
     FireTray.SetDefaultTextTooltip();
     return;
  }

  if(FireTray.lastnum==res) return; //update the icon only if something has changed
  FireTray.lastnum=res;
  var tooltip="";
  var num=""+res;
  if(res==0) { num=""; tooltip=firetray_no_unread_messages; }
  else if(res==1)  tooltip=res + " " + firetray_unread_message; 
       else tooltip = res + " " + firetray_unread_messages;

  var color="#000000";

  try { 
   color=FireTray.prefManager.getCharPref("extensions.firetray.text_color")
  }  catch (err) {  }

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
  OnItemIntPropertyChanged: function(item, property, oldValue, newValue) { FireTray.updateMailTray(); },
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

FireTray.prevTrack = function() {
    if(pPS != null){
        pPS.sequencer.previous();
        pPS.sequencer.play();
    }
}

FireTray.nextTrack = function() {
    if(pPS != null){
        pPS.sequencer.next();
        pPS.sequencer.play();
    }
}

FireTray.playPause = function () {
	if(pPS != null){
			if(pPS.status.state == 2)
                pPS.playbackControl.play();
            else if (pPS.status.state != 1){
				pPS.sequencer.play();
                if (pPS.status.state != 1)
                    Components.classes['@songbirdnest.com/Songbird/ApplicationController;1'].createInstance(Components.interfaces.sbIApplicationController).playDefault()
			}else
                pPS.playbackControl.pause();
            FireTray.interface.setTrayIcon(1);
	}
}
FireTray.stopASong = function () {
	if(pPS != null && pPS.status.state != 4){
			pPS.sequencer.stop();
	}
}

/*FireTray.raise()
{

}*/

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

  if (FireTray.isMail)
    {
	FireTray.lastnum =-1; //force mail number update (to reflect color change)
        FireTray.updateMailTray();
    }

}

FireTray.setupMenus = function() {

        FireTray.interface.trayActivateEvent(FireTray.trayCallback);

        // Init basic pop-up menu items.
        var tray_menu = FireTray.interface.getTrayMenu();

        if (tray_menu) {

            var item_s_one = FireTray.interface.separatorMenuItemNew();
            FireTray.interface.menuAppend(tray_menu, item_s_one, null);
            
	    var item_restore = FireTray.interface.menuItemNew(firetray_restoreall,"");
            FireTray.interface.menuAppend(tray_menu, item_restore, FireTray.restoreCallback);
            var item_s_two = FireTray.interface.separatorMenuItemNew();
            FireTray.interface.menuAppend(tray_menu, item_s_two, null);

            if(FireTray.isMail) { 
		//thunderbird special menu entries
                var mail_check = FireTray.interface.menuItemNew(firetray_check_mail,"");
                FireTray.interface.menuAppend(tray_menu, mail_check, FireTray.checkMail);

                var new_mail = FireTray.interface.menuItemNew(firetray_new_mail,"");
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
	       FireTray.interface.menuItemNew(firetray_previous_track ,"gtk-media-previous"), 0, FireTray.prevTrack);
      
	       FireTray.interface.menuInsert(tray_menu,
	       FireTray.interface.menuItemNew(firetray_play + "/" + firetray_pause, "gtk-media-play"), 1, FireTray.playPause);
	      
	       FireTray.interface.menuInsert(tray_menu,
	       FireTray.interface.menuItemNew(firetray_stop,"gtk-media-stop"), 2, FireTray.stopASong);
	  
	       FireTray.interface.menuInsert(tray_menu,
	       FireTray.interface.menuItemNew(firetray_next_track,"gtk-media-next"), 3, FireTray.nextTrack);
	    }

            var item_exit = FireTray.interface.menuItemNew(firetray_exit,"gtk-quit");
            FireTray.interface.menuAppend(tray_menu, item_exit, FireTray.exitCallback);


            if ( !FireTray.isSong){

                //var item_s_three = FireTray.interface.separatorMenuItemNew();
                //FireTray.interface.menuInsert(tray_menu, item_s_three, 0, null);

                var item_windows_list = FireTray.interface.menuItemNew(firetray_windowslist,"");
                FireTray.interface.menuInsert(tray_menu, item_windows_list, 0, null);

    
                minimizeComponent.menu_window_list = FireTray.interface.menuNew();
  	        FireTray.interface.menuSub(item_windows_list, minimizeComponent.menu_window_list);

            }

        }

}

FireTray.mailSettings = function() {
      var accountManager = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Components.interfaces.nsIMsgAccountManager);

      FireTray.localfolders = accountManager.localFoldersServer.rootFolder;
      FireTray.subscribeToMailEvents();
}

FireTray.songSettings = function() {

	
	      pPS = Components.classes["@songbirdnest.com/Songbird/Mediacore/Manager;1"]
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
			      pPS.addListener(this);
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
				      artist = firetray_unknown;
			      if(title =="" |title == null)
				      title = firetray_unknown;
			      if(album =="" | album == null)
				      album = firetray_unknown;
			      
			      if(artist.length > 30){
				      artist = artist.substring(0,30);	
			      }
			      if(title.length > 30){
				      title = title.substring(0,30);	
			      }
			      if(album.length > 30){
				      album = album.substring(0,30);	
			      }
			      
			      FireTray.interface.setTrayTooltip(firetray_artist + ": "+artist+"\n"+firetray_title+": "+title+"\n"+firetray_album+": "+album);
			      FireTray.interface.setTrayIcon(1);
			      if(showSong)
				      FireTray.interface.showANotification(artist, firetray_title + ": " + title + "\n" + firetray_album + ": "+album,null);
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

var timerEvent = { notify: function(timer) { FireTray.appStarted(); } }

FireTray.init = function() {

    if(FireTray.interface.menuCreated) return;
    else FireTray.interface.menuCreated=true;

    FireTray.isMail=false;
    FireTray.isSong=false;
    FireTray.isCalendar=false; 
    FireTray.lastnum=-1;



    window.onresize = FireTray.resizeEventHandler;

    //register an observer for getting prefs changes 
    FireTray.prefManager = Components.classes["@mozilla.org/preferences-service;1"]
                                .getService(Components.interfaces.nsIPrefBranch);
    myPrefObserver.register();

    var app=FireTray.getMozillaAppCode();

    if (!minimizeComponent.menu_window_list) {

       FireTray.setupMenus();
       if(FireTray.isMail) FireTray.mailSettings();
       if(FireTray.isSong) FireTray.songSettings();

    }

    FireTray.setTrayIcon();
   

    window.setTimeout(function() {
                window.removeEventListener("load", FireTray.init, true);
                window.onclose = FireTray.closeEventHandler;
            }, 0);

    FireTray.updatePreferences();
   /* if(!FireTray.isBrowser) */ FireTray.setCloseHandler();

    
 
 
    var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
 
    var nsec=5;
    timer.initWithCallback( timerEvent, nsec * 1000, Components.interfaces.nsITimer.TYPE_ONE_SHOT);


  // FireTray.hideToTray();
}





window.addEventListener("load", FireTray.init, true);

//trick to know when all windows are restored by SessionSaver
//document.addEventListener("SSTabRestored", FireTray.checkAppStarted, false);





