function status_icon(check_box) {
    try {
        var obj = Components.classes["@mozilla.org/FireTray;1"].createInstance();
        obj = obj.QueryInterface(Components.interfaces.nsITray);
    } catch (err) {
        alert(err);
        return;
    }

    if (check_box.getAttribute("checked")) {
        obj.showTray();
    } else {
        obj.hideTray();
    }
}
