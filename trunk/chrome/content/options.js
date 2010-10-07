
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


function Firetray_config_enabled_controls()
{
  var prefpane= document.getElementById("optionsPane");	

  //var radio_default_normal_icon = document.getElementById("radio_default_normal_icon");
//  var radio_user_normal_icon = document.getElementById("radio_user_normal_icon");
  var check_user_normal_icon = document.getElementById("check_user_normal_icon");
  var select_normal_icon = document.getElementById("select_normal_icon");	
  var normal_icon_filename = document.getElementById("normal_icon_filename");	
  
//  check_user_normal_icon.checked = radio_user_normal_icon.selected;
//  prefpane.userChangedValue(check_user_normal_icon);
  var use_default_normal_icon=!check_user_normal_icon.checked;
  select_normal_icon.disabled=use_default_normal_icon;
  normal_icon_filename.disabled=use_default_normal_icon;

  
//  var radio_default_special_icon = document.getElementById("radio_default_special_icon");
//  var radio_user_special_icon = document.getElementById("radio_user_special_icon");
  var select_special_icon = document.getElementById("select_special_icon");	
  var special_icon_filename = document.getElementById("special_icon_filename");	
  var check_user_special_icon = document.getElementById("check_user_special_icon");

//  check_user_special_icon.checked = radio_user_special_icon.selected;
//  prefpane.userChangedValue(check_user_special_icon);

  var use_default_special_icon=!check_user_special_icon.checked;
  select_special_icon.disabled=use_default_special_icon;
  special_icon_filename.disabled=use_default_special_icon;


// Handles SCROLL SETTINGS
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

function Firetray_update_radio_preferences() {
   var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

   var radiogroup = document.getElementById("radiogroup_scroll"); 
   var scroll_action=radiogroup.selectedIndex;
   /*var radio_scroll2 = document.getElementById("radio_scroll2");
   if(radio_scroll2.selected) scroll_action=1;
   var radio_scroll3 = document.getElementById("radio_scroll3");
   if(radio_scroll3.selected) scroll_action=2;*/

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

    Firetray_config_enabled_controls();

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
  // firetray.accounts_to_exclude preference is a string containing the accounts id to exclude, separated with a space
  // for example "0 2 3 "
  var prefs = prefManager.getCharPref('extensions.firetray.accounts_to_exclude');
  var accounts = new Array();
  accounts = prefs.split(' ');
  for(var i=0; i< allAccounts.Count(); i++) 
   {
    var folder = allAccounts.GetElementAt(i).QueryInterface(Components.interfaces.nsIMsgIncomingServer).rootMsgFolder;
    var node = document.createElement("checkbox");
    node.setAttribute('id', 'check_account_'+i);
    node.setAttribute('label', folder.name);
    node.setAttribute('checked', false);
    node.setAttribute('oncommand', 'update_accounts_to_exclude()');
    for(var j=0; j< accounts.length; j++) {
      if ( parseInt(accounts[j]) == i ) {
        node.setAttribute('checked', true);
      }
    }
    parent.appendChild(node);
   }
}

function update_accounts_to_exclude() {
  var accountManager = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Components.interfaces.nsIMsgAccountManager);
  var allAccounts = accountManager.allServers;
  var pref = "";
  for(var i=0; i< allAccounts.Count(); i++) 
   {
      var node = document.getElementById("check_account_"+i);
      if (node.getAttribute('checked')) {
        pref = pref + " " + i;
        //alert(allAccounts.GetElementAt(i).key);
      }
   }
  var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
  prefManager.setCharPref('extensions.firetray.accounts_to_exclude', pref);
}

