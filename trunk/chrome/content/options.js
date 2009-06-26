
const BROWSER=0;
const MAIL=1;
const MUSIC=2;
const CALENDAR=4;

function getAppType()  
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
  
  var appname=appInfo.name.toLowerCase()

  switch(appInfo.ID) {

     case THUNDERBIRD_ID:
        return MAIL;  
        break;

     case SONGBIRD_ID:
        return MUSIC;
        break;

     case SUNBIRD_ID:
        return CALENDAR; 
        break;

     case SEAMONKEY_ID:
        return BROWSER;
        break;

     case FIREFOX_ID:
     default:
        return BROWSER;
        break;
  }

 }
 catch (err) {
        alert(err);
        return -1;
    }
}


function config_enabled_controls()
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

}


function config_options_window() {

	var appType=getAppType();

	var mail_group = document.getElementById("special_icon_group");
	var filepath = document.getElementById("normal_icon_filename");	
	var filelabel = document.getElementById("normal_icon_label");	
	var check_restore_next_unread = document.getElementById("check_restore_next_unread");	

	mail_group.hidden=!(appType & MAIL);
	check_restore_next_unread.hidden=!(appType & MAIL);

//	var check_user_normal_icon = document.getElementById("check_user_normal_icon");
//	var radio_default_normal_icon = document.getElementById("radio_default_normal_icon");
//	var radio_user_normal_icon = document.getElementById("radio_user_normal_icon");


        //if(check_user_normal_icon.checked) check_user_normal_icon.selected=true;
	//else radio_default_normal_icon.selected=true;
	

//	var check_user_special_icon = document.getElementById("check_user_special_icon");
//	var radio_default_special_icon = document.getElementById("radio_default_special_icon");
//	var radio_user_special_icon = document.getElementById("radio_user_special_icon");

	config_enabled_controls();
}
 
function choose_file(icon_filename)
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


function choose_normal_icon_file()
{
  var filepath = document.getElementById("normal_icon_filename");	
  choose_file(filepath);  	
}


function choose_special_icon_file()
{
  var filepath = document.getElementById("special_icon_filename");	
  choose_file(filepath);  	
}
