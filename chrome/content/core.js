
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

var minimizeComponent = Components.classes['@mozilla.org/Minimize;1'].getService(Components.interfaces.nsIMinimize);
var pPS=null;

var FireTray = new Object();

FireTray.interface = Components.classes["@mozilla.org/FireTray;1"].getService(Components.interfaces.nsITray);

FireTray.nextUnreadMessage = function() {
      if (FireTray.nextUnreadMailController.controller && FireTray.nextUnreadMailController.controller.isCommandEnabled("cmd_nextUnreadMsg")){
         FireTray.nextUnreadMailController.controller.doCommand(command);
      }
}

FireTray.trayCallback = function() {
    var baseWindows = FireTray.getAllWindows();
    if (baseWindows.length == FireTray.interface.menu_length(minimizeComponent.menu_window_list)) {
        if(FireTray.isMail){
            FireTray.nextUnreadMessage();
        } //nextUnreadMessage
        FireTray.interface.restore(baseWindows.length, baseWindows);
        FireTray.interface.menu_remove_all(minimizeComponent.menu_window_list);
    } else {
        FireTray.interface.menu_remove_all(minimizeComponent.menu_window_list);
        FireTray.hide_to_tray();
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
    FireTray.interface.menu_remove_all(minimizeComponent.menu_window_list);
};

FireTray.init = function() {
    FireTray.isMail=false;
    FireTray.isSong=false;
    FireTray.lastnum=-1;


    window.onclose = FireTray.on_close
    window.onresize = FireTray.on_resize
 
    FireTray.prefManager = Components.classes["@mozilla.org/preferences-service;1"]
                                .getService(Components.interfaces.nsIPrefBranch);
    var accountManager;
    var app=FireTray.getMozillaAppCode();

    if (!minimizeComponent.menu_window_list) {
        FireTray.interface.trayActivateEvent(FireTray.trayCallback);
	
        // Init basic pop-up menu items.
        var tray_menu = FireTray.interface.get_tray_menu();
        if (tray_menu) {
            var item_s_one = FireTray.interface.separator_menu_item_new();
            FireTray.interface.menu_append(tray_menu, item_s_one, null);
            var item_restore = FireTray.interface.menu_item_new(firetray_restoreall);
            FireTray.interface.menu_append(tray_menu, item_restore, FireTray.restoreCallback);
            var item_s_two = FireTray.interface.separator_menu_item_new();
            FireTray.interface.menu_append(tray_menu, item_s_two, null);
 
            if(FireTray.isMail) { //TODO 
		//thunderbird special menu entries
                var mail_check = FireTray.interface.menu_item_new("Check mail");
                FireTray.interface.menu_append(tray_menu, mail_check, null);

                var mail_end_separator = FireTray.interface.separator_menu_item_new();
                FireTray.interface.menu_append(tray_menu, mail_end_separator, null);
	    }


            var item_exit = FireTray.interface.menu_item_new(firetray_exit);
            FireTray.interface.menu_append(tray_menu, item_exit, FireTray.exitCallback);
            var item_s_three = FireTray.interface.separator_menu_item_new();
            FireTray.interface.menu_insert(tray_menu, item_s_three, 0, null);
            var item_windows_list = FireTray.interface.menu_item_new(firetray_windowslist);
            FireTray.interface.menu_insert(tray_menu, item_windows_list, 1, null);
            minimizeComponent.menu_window_list = FireTray.interface.menu_new();
            FireTray.interface.menu_sub(item_windows_list, minimizeComponent.menu_window_list);
        }
    }


    FireTray.interface.set_default_xpm_icon(app);
    FireTray.interface.showTray();

    if(FireTray.isMail) {
      FireTray.nextUnreadMailController = document.commandDispatcher.getControllerForCommand("cmd_nextUnreadMsg");

      if(FireTray.nextUnreadMailController.controller) alert("controller OK");

      accountManager = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Components.interfaces.nsIMsgAccountManager);
      FireTray.localfolders = accountManager.localFoldersServer.rootFolder;
      FireTray.subscribe_to_mail_events();
      FireTray.UpdateMailTray();
    }

    
	if(FireTray.isSong){
		pPS = Components.classes["@songbirdnest.com/Songbird/PlaylistPlayback;1"]
                    	.getService(Components.interfaces.sbIPlaylistPlayback);
		
		var myPlaylistPlaybackServiceListener = {
 			init: function() {
   				pPS.addListener(this);
   				
   				/* Song controls */

            	var music_list = FireTray.interface.menu_new();
            	
            	var item_play = FireTray.interface.menu_item_new("Play");
            	FireTray.interface.menu_append(music_list, item_play, FireTray.playASong);
            	
            	var item_s_four = FireTray.interface.separator_menu_item_new();
           	 	FireTray.interface.menu_append(tray_menu, item_s_four, null);
            	var item_pause = FireTray.interface.menu_item_new("Pause");
            	FireTray.interface.menu_append(music_list, item_pause, FireTray.pauseASong);
            	
            	var item_s_five = FireTray.interface.separator_menu_item_new();
           	 	FireTray.interface.menu_append(tray_menu, item_s_five, null);
            	var item_stop = FireTray.interface.menu_item_new("Stop");
            	FireTray.interface.menu_append(music_list, item_stop, FireTray.stopASong);
            	
            	tray_menu = FireTray.interface.get_tray_menu();
            	
            	var item_s_six = FireTray.interface.separator_menu_item_new();
            	FireTray.interface.menu_insert(tray_menu, item_s_six, 0, null);
   				var item_music_ctrl = FireTray.interface.menu_item_new("Music");
   				FireTray.interface.menu_sub(item_music_ctrl, music_list);
            	FireTray.interface.menu_insert(tray_menu, item_music_ctrl, 1, null);
 			},
 			onTrackChange: function(aMediaItem, aMediaView, aIndex) {
             	var artist=SBDataGetStringValue("metadata.artist");
   				var title=SBDataGetStringValue("metadata.title");
   				var album=SBDataGetStringValue("metadata.album");
   				FireTray.interface.set_tray_tooltip("Artist:"+artist+"\nTitle:"+title+"\nAlbum:"+album);
   				FireTray.interface.set_tray_icon(1);
  				
 			},
 			onStop: function() {
 				FireTray.interface.set_tray_icon(0);
 			}
		};
		myPlaylistPlaybackServiceListener.init();
	}
	
    window.setTimeout(function() {
                window.removeEventListener("load", FireTray.init, true);
            }, 0);
};

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

FireTray.windows_list_add = function(basewindow) {
    var aWindow = FireTray.interface.menu_item_new(basewindow.title);
    FireTray.interface.menu_append(minimizeComponent.menu_window_list, aWindow, function() {
                FireTray.interface.restoreWindow(basewindow);
                FireTray.interface.menu_remove(minimizeComponent.menu_window_list, aWindow);
            });
};

FireTray.hide_window = function() {
    var basewindow = FireTray.getBaseWindow(window);
    FireTray.interface.hideWindow(basewindow);

    FireTray.windows_list_add(basewindow);
};

FireTray.hide_to_tray = function() {
    FireTray.interface.menu_remove_all(minimizeComponent.menu_window_list);

    var baseWindows = FireTray.getAllWindows();

    for(var i=0; i<baseWindows.length; i++) {
        var basewindow = baseWindows[i];
        FireTray.interface.hideWindow(basewindow);
        FireTray.windows_list_add(basewindow);
    }
};

FireTray.on_close = function() {
   // if the window menubar is not visible (ex.popup windows) don't close to tray
   if(window.menubar.visible && FireTray.prefManager.getBoolPref("extensions.firetray.close_to_tray")) {
      FireTray.hide_to_tray();
      return false;	
   }
   
}
/*FireTray.on_close2 = function() {
      alert("onclose2");
      return false;	 
}*/

FireTray.on_resize = function() {
   if(!FireTray.started)
	if(FireTray.prefManager.getBoolPref("extensions.firetray.start_minimized")){	
		FireTray.started=true;	
		FireTray.hide_to_tray();
	}
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
  */

 try {
  var appInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);

  const FIREFOX_ID = "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}";
  const THUNDERBIRD_ID = "{3550f703-e582-4d05-9a08-453d09bdfdc6}";
  const SONGBIRD_ID = "songbird@songbirdnest.com";
  const SUNBIRD_ID = "{718e30fb-e89b-41dd-9da7-e25a45638b28}";
  
  var appname=appInfo.name.toLowerCase()
  //alert(appInfo.ID); 
  switch(appInfo.ID) {
     case FIREFOX_ID:
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
        FireTray.isPlayer=true;
        return 8; //songbird
        break;

     case SUNBIRD_ID:
        return 9; //sunbird
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


FireTray.UpdateMailTray = function () {
  var res=FireTray.localfolders.getNumUnread(true); //gets the number of all unread mails
  if(FireTray.lastnum==res) return; //update the icon only if something has changed
  FireTray.lastnum=res;
  var tooltip="";
  var num=""+res;
  if(res==0) { num=""; tooltip=firetray_no_unread_messages; }
  else if(res==1)  tooltip=res + " " + firetray_unread_message; 
       else tooltip = res + " " + firetray_unread_messages;

  FireTray.interface.set_icon_text(num);
  FireTray.interface.set_tray_tooltip(tooltip);
}


FireTray.subscribe_to_mail_events = function()
{

  var mailSession = Components.classes["@mozilla.org/messenger/services/session;1"].
  getService(Components.interfaces.nsIMsgMailSession);
 
  var folderListener = {
  OnItemAdded: function(parent, item) {},
  OnItemBoolPropertyChanged: function(item, property, oldValue, newValue) {},
  OnItemEvent: function(item, event)  {},
  OnItemIntPropertyChanged: function(item, property, oldValue, newValue) { FireTray.UpdateMailTray(); },
  OnItemPropertyChanged: function(parent, item, viewString) {},
  OnItemPropertyFlagChanged: function(item, property, oldFlag, newFlag) {},
  OnItemRemoved: function(parent, item) {},
  OnItemUnicharPropertyChanged: function(item, property, oldValue, newValue) {},
}
 
  var nFlags = Components.interfaces.nsIFolderListener.added | Components.interfaces.nsIFolderListener.intPropertyChanged; mailSession.AddFolderListener(folderListener,nFlags);
}

FireTray.playASong = function () {
	if(pPS != null){
			if(pPS.paused || !pPS.playing){
				pPS.play();
				FireTray.interface.set_tray_icon(1);
			}
	}
}
FireTray.pauseASong = function () {
	if(pPS != null && !pPS.paused){
		pPS.pause();
 		FireTray.interface.set_tray_icon(0);
	}
}
FireTray.stopASong = function () {
	if(pPS != null && pPS.playing){
			pPS.stop();
			pPS.pause(); /* For now... because there is a bug into songbird API*/
	}
}

window.addEventListener("load", FireTray.init, true);
//window.addEventListener("close", FireTray.on_close2, true);



