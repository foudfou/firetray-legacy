
var FireTray = new Object();

FireTray.handler = Components.classes['@mozilla.org/FireTrayHandler;1'].getService(Components.interfaces.nsIFireTrayHandler);

FireTray.init = function() {
  window.removeEventListener("load", FireTray.init, true);
   
}

FireTray.hideWindow = function() {
   FireTray.handler.hideWindow(window);
}

FireTray.hideToTray = function() { 
   FireTray.handler.hideAll();
}

FireTray.handler.setupWindow(window); 

window.addEventListener("load", FireTray.init, true);

