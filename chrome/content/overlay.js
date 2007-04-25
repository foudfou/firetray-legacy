function getBaseWindow(win) {
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
    }
    catch (ex)
    {
        rv = null;
        setTimeout(function() {throw ex; }, 0);
        /* ignore no-interface exception */
    }
    return rv;    
}

function status_icon(check_box) {
    try {
        var obj = Components.classes["@mozilla.org/FireTray;1"].getService(Components.interfaces.nsITray);
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

function hide_to_tray() {
    try {
        var obj = Components.classes["@mozilla.org/FireTray;1"].getService(Components.interfaces.nsITray);
    } catch (err) {
        alert(err);
        return;
    }

    var _status_icon = document.getElementById("menu_statusIcon");
    if (_status_icon && !_status_icon.getAttribute("checked")) {
        _status_icon.setAttribute("checked", true);
        obj.showTray();
    }

    var baseWindows = [getBaseWindow(window)];
    obj.minimize(baseWindows.length, baseWindows);
}
