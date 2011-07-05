
const Firetray_BROWSER=0;
const Firetray_MAIL=1;
const Firetray_MUSIC=2;
const Firetray_CALENDAR=4;

function Firetray_getAppType()  
{

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

     case THUNDERBIRD_ID:
        return Firetray_MAIL;  
        break;

     case SONGBIRD_ID:
        return Firetray_MUSIC;
        break;

     case SUNBIRD_ID:
        return Firetray_CALENDAR; 
        break;

     case SEAMONKEY_ID:
        return Firetray_BROWSER | Firetray_MAIL;
        break;

     case CHATZILLA_ID:
     case FIREFOX_ID:
     default:
        return Firetray_BROWSER;
        break;
  }

 }
 catch (err) {
        alert(err);
        return -1;
    }
}

function DisableGroup(group,disableval)
{    
  try
  {
  for(var i=0; i< group.childNodes.length; i++) 
    group.childNodes[i].disabled=disableval;
  } catch(e) {}  
}

function Firetray_config_enabled_controls()
{
  
  var prefpane= document.getElementById("optionsPane");

  //NORMAL ICON SETTINGS
  var check_user_normal_icon = document.getElementById("check_user_normal_icon");
  var select_normal_icon = document.getElementById("select_normal_icon");
  var normal_icon_filename = document.getElementById("normal_icon_filename");
  
  var use_default_normal_icon=!check_user_normal_icon.checked;
  select_normal_icon.disabled=use_default_normal_icon;
  normal_icon_filename.disabled=use_default_normal_icon;

  //MAIL NOTIFICATION SETTINGS
  var check_user_special_icon = document.getElementById("check_user_special_icon");
  

  var radio_mail_notify = document.getElementById("radiogroup_mail_notification");
  var check_user_special_icon = document.getElementById("check_user_special_icon");
  var radio_mail_count1 = document.getElementById("radio_mail_count1");
  var radio_mail_count2 = document.getElementById("radio_mail_count2");
  var check_show_mail_count = document.getElementById("check_show_mail_count");
  var btn_choose_color = document.getElementById("btn_mail_count_color");
  var group_exclude_folders  = document.getElementById("exclude_folders_hbox");
  var group_exclude_accounts  = document.getElementById("accounts_box");
  var spam_checkbox  = document.getElementById("spam_checkbox");
  
  var disable_notification=(radio_mail_notify.selectedIndex==0);
  
  check_user_special_icon.disabled = disable_notification;
  radio_mail_count1.disabled = disable_notification;
  radio_mail_count2.disabled = disable_notification;
  check_show_mail_count.disabled = disable_notification;

  var radiogroup_mail_count=document.getElementById("radiogroup_mail_count");
/*  if(radiogroup_mail_count.selectedIndex==0)
  {
   check_show_mail_count.label = string_show_new_number;
   check_show_mail_count.accesskey = string_show_new_number_accesskey;
  }  else   {
   check_show_mail_count.label = string_show_unread_number;
   check_show_mail_count.accesskey = string_show_unread_number_accesskey;
  }*/

  btn_choose_color.disabled = disable_notification;
  
  DisableGroup(group_exclude_folders,disable_notification);
  DisableGroup(group_exclude_accounts,disable_notification);
  
  //SPECIAL ICON SETTINGS
  var select_special_icon = document.getElementById("select_special_icon");	
  var special_icon_filename = document.getElementById("special_icon_filename");	

  var use_default_special_icon=!check_user_special_icon.checked;
  select_special_icon.disabled=use_default_special_icon;
  special_icon_filename.disabled=use_default_special_icon;


  // SCROLL SETTINGS
  var check_scroll_hide = document.getElementById("check_scroll_hide");

  var radio_scroll1 = document.getElementById("radio_scroll1");
  var radio_scroll2 = document.getElementById("radio_scroll2");
  var radio_scroll3 = document.getElementById("radio_scroll3");
  var radio_scroll4 = document.getElementById("radio_scroll4");

  radio_scroll1.disabled=!check_scroll_hide.checked;
  radio_scroll2.disabled=!check_scroll_hide.checked;
  radio_scroll3.disabled=!check_scroll_hide.checked;
  radio_scroll4.disabled=!check_scroll_hide.checked;
  
}

function Firetray_update_notification_settings() {
  // MAIL NOTIFICATION SETTINGS  
  var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
  var radio_mail_notify = document.getElementById("radiogroup_mail_notification");
  prefManager.setIntPref("extensions.firetray.show_mail_notification",radio_mail_notify.selectedIndex);
  
  var radiogroup_mail_count=document.getElementById("radiogroup_mail_count");
  prefManager.setIntPref("extensions.firetray.mail_count_type",radiogroup_mail_count.selectedIndex);

  Firetray_config_enabled_controls();
}

function Firetray_update_scroll_settings() {
   var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

   var radiogroup = document.getElementById("radiogroup_scroll"); 
   var scroll_action=radiogroup.selectedIndex;

   prefManager.setIntPref("extensions.firetray.scroll_action",scroll_action);

}

function Firetray_config_options_window() {

    var appType=Firetray_getAppType();

    var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

    var mail_group = document.getElementById("special_icon_tab");
    var filepath = document.getElementById("normal_icon_filename");	
    var filelabel = document.getElementById("normal_icon_label");	
    var check_restore_next_unread = document.getElementById("check_restore_next_unread");	

    mail_group.hidden=!(appType & Firetray_MAIL);
    check_restore_next_unread.hidden=!(appType & Firetray_MAIL);

    var check_scroll_hide = document.getElementById("check_scroll_hide");

    var radiogroup = document.getElementById("radiogroup_scroll"); 
    var radio_scroll3 = document.getElementById("radio_scroll3");
    var radio_scroll4 = document.getElementById("radio_scroll4");
    radio_scroll3.hidden=!(appType & Firetray_MUSIC);
    radio_scroll4.hidden=!(appType & Firetray_MUSIC);


    var pref=prefManager.getIntPref("extensions.firetray.scroll_action");

    radiogroup.selectedIndex=pref;

    var label_mmkeys = document.getElementById("label_mmkeys");
    var keycode=prefManager.getIntPref("extensions.firetray.hide_show_mm_key");

/*    var keystr;
    firetray_interface = Components.classes["@mozilla.org/FireTray;1"].getService(Components.interfaces.nsITray);
    
    keystr=firetray_interface.getKeycodeString(keycode);

    var str = "Hide/unkyde keycode: " + keycode + " (" + keystr + ")";*/
    if(appType & Firetray_MUSIC)
    label_mmkeys.value="Enabling key grabbing allows to control playback using multimedia keys." ;

    //notification settings
    var radio_mail_notify = document.getElementById("radiogroup_mail_notification"); 
    var mnotify=prefManager.getIntPref("extensions.firetray.show_mail_notification");
    if(mnotify<0 || mnotify>2) mnotify=2;
    radio_mail_notify.selectedIndex=mnotify;

    var radiogroup_mail_count=document.getElementById("radiogroup_mail_count");
    radiogroup_mail_count.selectedIndex=prefManager.getIntPref("extensions.firetray.mail_count_type");

    Firetray_config_enabled_controls();
    if(appType & Firetray_MAIL) insert_accounts_name("accounts_box");    
}
 
function Firetray_choose_file(icon_filename)
{
	const nsIFilePicker = Components.interfaces.nsIFilePicker;
	//this.netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect'); 
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	
	fp.init(window, "Dialog Title", nsIFilePicker.modeOpen);
	fp.appendFilters(nsIFilePicker.filterImages);

	var rv = fp.show();
	if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) 
	{
		icon_filename.value=fp.file.path;
		var prefpane= document.getElementById("optionsPane");	
		prefpane.userChangedValue(icon_filename);
	}
}


function Firetray_choose_normal_icon_file()
{
  var filepath = document.getElementById("normal_icon_filename");	
  Firetray_choose_file(filepath);  	
}


function Firetray_choose_special_icon_file()
{
  var filepath = document.getElementById("special_icon_filename");	
  Firetray_choose_file(filepath);  	
}


function insert_accounts_name(parentId) {
  var accountManager = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Components.interfaces.nsIMsgAccountManager);
  var allAccounts = accountManager.allServers;
  // the DOM parent where we do appendChild
  var parent = document.getElementById(parentId);
  var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
  // firetray.accounts_to_exclude preference is a string containing the keys of the accounts to exclude, separated with a space
  // for example "server1 server2 server3"
  var prefs = prefManager.getCharPref('extensions.firetray.accounts_to_exclude');
  var accounts = new Array();
  accounts = prefs.split(' ');
  for(var i=0; i< allAccounts.Count(); i++) 
   {
    var node = document.createElement("checkbox");
    var server = allAccounts.GetElementAt(i).QueryInterface(Components.interfaces.nsIMsgIncomingServer);
    var folder = server.rootMsgFolder;
    var id=String(server.key);      

    node.setAttribute('id', id);
    node.setAttribute('label', folder.name);
    
    if(accounts.indexOf(id)>=0) node.setAttribute('checked', true);        
    else node.setAttribute('checked', false);        
    
    node.setAttribute('oncommand', 'update_accounts_to_exclude()');    
    parent.appendChild(node);
   }

   var disable_notify=prefManager.getIntPref("extensions.firetray.show_mail_notification")==0;
   DisableGroup(parent,disable_notify);
}

function update_accounts_to_exclude() {
  var accounts_box = document.getElementById('accounts_box');

  var pref = "";
    
  for(var i=1; i< accounts_box.childNodes.length; i++) 
   {               
      if (accounts_box.childNodes[i].getAttribute('checked')=='true') {        
        pref = pref + " " + accounts_box.childNodes[i].getAttribute('id');        
      }      
   }
   
  var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
  prefManager.setCharPref('extensions.firetray.accounts_to_exclude', pref);
}

