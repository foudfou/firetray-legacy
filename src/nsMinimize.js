/***********************************************************
constants
***********************************************************/

// reference to the interface defined in nsIMinimize.idl
const nsIMinimize = Components.interfaces.nsIMinimize;

// reference to the required base interface that all components must support
const nsISupports = Components.interfaces.nsISupports;

// UUID uniquely identifying our component
const CLASS_ID = Components.ID("{77284574-9091-4b63-a5cf-533edb2897a1}");

// description
const CLASS_NAME = "Minimize Javascript XPCOM Component for FireTray";

// textual unique identifier
const CONTRACT_ID = "@mozilla.org/Minimize;1";

/***********************************************************
class definition
***********************************************************/

//class constructor
function Minimize() {
};

// class definition
Minimize.prototype = {
    _all_hidden: false,
    _menu_window_list: 0,

    // define the function we want to expose in our interface
    get all_hidden() {
        return this._all_hidden;
    },

    set all_hidden(status) {
        this._all_hidden = status;
    },

    get menu_window_list() {
        return this._menu_window_list;
    },

    set menu_window_list(menu) {
        this._menu_window_list = menu;
    },

    QueryInterface: function(aIID) {
        if (!aIID.equals(nsIMinimize) && !aIID.equals(nsISupports)) {
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }
        return this;
    }
};

/***********************************************************
class factory

This object is a member of the global-scope Components.classes.
It is keyed off of the contract ID. Eg:

myMinimize = Components.classes["@dietrich.ganx4.com/helloworld;1"].
                                                    createInstance(Components.interfaces.nsIMinimize);

***********************************************************/
var MinimizeFactory = {
    createInstance: function (aOuter, aIID) {
        if (aOuter != null) {
            throw Components.results.NS_ERROR_NO_AGGREGATION;
        }
        return (new Minimize()).QueryInterface(aIID);
    }
};

/***********************************************************
module definition (xpcom registration)
***********************************************************/
var MinimizeModule = {
    _firstTime: true,
    registerSelf: function(aCompMgr, aFileSpec, aLocation, aType) {
        aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
        aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID, aFileSpec, aLocation, aType);
    },

    unregisterSelf: function(aCompMgr, aLocation, aType) {
        aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
        aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);                
    },
    
    getClassObject: function(aCompMgr, aCID, aIID) {
        if (!aIID.equals(Components.interfaces.nsIFactory)) {
            throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
        }

        if (aCID.equals(CLASS_ID)) {
            return MinimizeFactory;
        }

        throw Components.results.NS_ERROR_NO_INTERFACE;
    },

    canUnload: function(aCompMgr) { return true; }
};

/***********************************************************
module initialization

When the application registers the component, this function
is called.
***********************************************************/
function NSGetModule(aCompMgr, aFileSpec) { return MinimizeModule; }
