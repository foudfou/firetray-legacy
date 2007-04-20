#include "plugin.h"
#include "pixmaps/tray.xpm"

#define MIME_TYPES_HANDLED  "application/firetray-plugin"
#define PLUGIN_NAME         "System Tray Plug-in for Mozilla"
#define MIME_TYPES_DESCRIPTION  MIME_TYPES_HANDLED":fty:"PLUGIN_NAME
#define PLUGIN_DESCRIPTION  PLUGIN_NAME " (Plug-ins firetray)"

static GtkWidget *tray_menu = NULL;

static void activate(GtkStatusIcon* status_icon, gpointer user_data) {
    g_debug("'activate' signal triggered");
}

static void popup(GtkStatusIcon *status_icon, guint button, guint activate_time, gpointer user_data) {
    g_debug("'popup-menu' signal triggered");
    nsPluginInstance *data;
    data = (nsPluginInstance*)user_data;
    GtkStatusIcon* systray_icon = data->getTrayIcon();

    if (!tray_menu) {
        GtkWidget *item;
        tray_menu = gtk_menu_new();

        item = gtk_menu_item_new_with_label("Test 1");
        gtk_menu_append(tray_menu, item);
        g_signal_connect(G_OBJECT(item), "activate", G_CALLBACK(activate), NULL);
    }
    
    gtk_widget_show_all(tray_menu);

    gtk_menu_popup(GTK_MENU(tray_menu), NULL, NULL, gtk_status_icon_position_menu, systray_icon, button, activate_time);
}

char* NPP_GetMIMEDescription(void) {
    return(MIME_TYPES_DESCRIPTION);
}

/////////////////////////////////////
// general initialization and shutdown
//
NPError NS_PluginInitialize() {
    return NPERR_NO_ERROR;
}

void NS_PluginShutdown() {
}

// get values per plugin
NPError NS_PluginGetValue(NPPVariable aVariable, void *aValue) {
    NPError err = NPERR_NO_ERROR;

    switch (aVariable) {
    case NPPVpluginNameString:
        *((char **)aValue) = PLUGIN_NAME;
        break;
    case NPPVpluginDescriptionString:
        *((char **)aValue) = PLUGIN_DESCRIPTION;
        break;
    default:
        err = NPERR_INVALID_PARAM;
        break;
    }

    return err;
}

/////////////////////////////////////////////////////////////
//
// construction and destruction of our plugin instance object
//
nsPluginInstanceBase * NS_NewPluginInstance(nsPluginCreateData * aCreateDataStruct) {
    if(!aCreateDataStruct)
        return NULL;

    nsPluginInstance * plugin = new nsPluginInstance(aCreateDataStruct->instance);
    return plugin;
}

void NS_DestroyPluginInstance(nsPluginInstanceBase * aPlugin) {
    if(aPlugin)
        delete (nsPluginInstance *)aPlugin;
}

////////////////////////////////////////
//
// nsPluginInstance class implementation
//
nsPluginInstance::nsPluginInstance(NPP aInstance) : nsPluginInstanceBase(),
        mInstance(aInstance),
        mInitialized(FALSE) {}

nsPluginInstance::~nsPluginInstance() {
  // mScriptablePeer may be also held by the browser 
  // so releasing it here does not guarantee that it is over
  // we should take precaution in case it will be called later
  // and zero its mPlugin member
//  mScriptablePeer->SetInstance(NULL);
//  NS_IF_RELEASE(mScriptablePeer);
}

NPBool nsPluginInstance::init(NPWindow* aWindow) {
    if(aWindow == NULL)
        return FALSE;

    if (SetWindow(aWindow))
        mInitialized = TRUE;

    return mInitialized;
}

void nsPluginInstance::shut() {
    gtk_status_icon_set_visible(GTK_STATUS_ICON(systray_icon), FALSE);
    mInitialized = FALSE;
}

const char * nsPluginInstance::getVersion() {
    return NPN_UserAgent(mInstance);
}

NPError nsPluginInstance::GetValue(NPPVariable aVariable, void *aValue) {
    NPError err = NPERR_NO_ERROR;

    switch (aVariable) {
    case NPPVpluginNameString:
    case NPPVpluginDescriptionString:
        return NS_PluginGetValue(aVariable, aValue) ;
        break;
    default:
        err = NPERR_INVALID_PARAM;
        break;
    }

    return err;
}

NPError nsPluginInstance::SetWindow(NPWindow* aWindow) {
    if(aWindow == NULL)
        return FALSE;

    if (mWindow == (Window) aWindow->window) {
        // The page with the plugin is being resized.
        // Save any UI information because the next time
        // around expect a SetWindow with a new window id.
    } else {
        mWindow = (Window) aWindow->window;

        systray_icon = gtk_status_icon_new();
        icon = gdk_pixbuf_new_from_xpm_data((const char**)tray_icon);
        gtk_status_icon_set_from_pixbuf(GTK_STATUS_ICON(systray_icon), GDK_PIXBUF(icon));
        gtk_status_icon_set_tooltip(systray_icon, "Firetray");

        /* Connect signals */
        g_signal_connect (G_OBJECT(systray_icon), "popup-menu", G_CALLBACK(popup), this);
        g_signal_connect (G_OBJECT(systray_icon), "activate", G_CALLBACK(activate), this);
    }

    return TRUE;
}

GtkStatusIcon* nsPluginInstance::getTrayIcon() {
    return this->systray_icon;
}

// ==============================
// ! Scriptability related code !
// ==============================
//
// this method will return the scriptable object (and create it if necessary)
nsScriptablePeer* nsPluginInstance::getScriptablePeer()
{
  if (!mScriptablePeer) {
    mScriptablePeer = new nsScriptablePeer(this);
    if(!mScriptablePeer)
      return NULL;

    NS_ADDREF(mScriptablePeer);
  }

  // add reference for the caller requesting the object
  NS_ADDREF(mScriptablePeer);
  return mScriptablePeer;
}
