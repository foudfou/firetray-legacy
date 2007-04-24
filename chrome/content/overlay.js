function test() {
    try {
        var obj = Components.classes["@mozilla.org/FireTray;1"].createInstance();
        obj = obj.QueryInterface(Components.interfaces.nsITray);
    } catch (err) {
        alert(err);
        return;
    }
    obj.showTray();
}
