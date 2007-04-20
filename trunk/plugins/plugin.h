#ifndef __PLUGIN_H__
#define __PLUGIN_H__

/* Xlib/Xt stuff */
#include <X11/Xlib.h>
#include <X11/Intrinsic.h>
#include <X11/cursorfont.h>

#include <gtk/gtk.h>
#include <gdk-pixbuf/gdk-pixbuf.h>

#include "pluginbase.h"
#include "nsScriptablePeer.h"

class nsPluginInstance : public nsPluginInstanceBase {
public:
    nsPluginInstance(NPP aInstance);
    virtual ~nsPluginInstance();

    NPBool init(NPWindow* aWindow);
    void shut();
    NPBool isInitialized() {
        return mInitialized;
    }
    NPError GetValue(NPPVariable variable, void *value);
    NPError SetWindow(NPWindow* aWindow);

    // locals
    const char * getVersion();

    GtkStatusIcon* getTrayIcon();

    nsScriptablePeer* getScriptablePeer();

private:
    NPP mInstance;
    NPBool mInitialized;

    GtkStatusIcon* systray_icon;
    GdkPixbuf* icon;

    Window mWindow;

    nsScriptablePeer * mScriptablePeer;
};

#endif // __PLUGIN_H__
