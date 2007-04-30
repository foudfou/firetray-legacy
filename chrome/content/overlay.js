var FireTray = new Object();

FireTray.interface = null;
FireTray.is_hidden = false;

FireTray.trayCallback = function() {
    if (FireTray.is_hidden) {
        FireTray.interface.restore();
        FireTray.is_hidden = false;
    } else {
        FireTray.hide_to_tray();
    }
}

FireTray.init = function() {
    try {
        FireTray.interface = Components.classes["@mozilla.org/FireTray;1"].getService(Components.interfaces.nsITray);
    } catch (err) {
        alert(err);
        return;
    }
    FireTray.interface.trayActivateEvent(FireTray.trayCallback);
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

FireTray.status_icon = function(check_box) {
    if (!FireTray.interface) {
        FireTray.init();
    }

    if (check_box.getAttribute("checked")) {
        FireTray.interface.showTray();
    } else {
        FireTray.interface.hideTray();
    }
};

FireTray.hide_to_tray = function() {
    FireTray.is_hidden = true;

    if (!FireTray.interface) {
        FireTray.init();
    }

    try {
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
    } catch (err) {
        alert(err);
        return;
    }

    var _status_icon = document.getElementById("menu_statusIcon");
    if (_status_icon && !_status_icon.getAttribute("checked")) {
        _status_icon.setAttribute("checked", true);
        FireTray.interface.showTray();
    }

    var baseWindows = new Array();
    var e = wm.getEnumerator(null);
    var windows = [];
    while (e.hasMoreElements()) {
        var w = e.getNext();
        baseWindows[baseWindows.length] = FireTray.getBaseWindow(w);
    } 
    FireTray.interface.minimize(baseWindows.length, baseWindows);
};
