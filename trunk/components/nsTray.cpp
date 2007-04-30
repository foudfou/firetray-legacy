#include "nsTray.h"
#include "pixmaps/tray.xpm"

#include "nsMemory.h"
#include "nsIBaseWindow.h"

static GtkStatusIcon *systray_icon = NULL;
static GdkPixbuf *icon = NULL;

static void activate(GtkStatusIcon* status_icon, gpointer user_data) {
    PRBool ret = TRUE;
    ((nsTray*)user_data)->tray_callback->Call(&ret);
}

/* Implementation file */
NS_IMPL_ISUPPORTS1(nsTray, nsITray)

nsTray::nsTray() {
    /* member initializers and constructor code */
    this->windowList = NULL;
    this->windowListCount = 0;
    this->tray_callback = NULL;
}

nsTray::~nsTray() {
    /* destructor code */
    if (this->windowList) {
        delete [] this->windowList;
        this->windowList = NULL;
    }
}

/* void showTray (); */
NS_IMETHODIMP nsTray::ShowTray() {
    if (!systray_icon) {
        systray_icon = gtk_status_icon_new();
        icon = gdk_pixbuf_new_from_xpm_data((const char**)tray_icon);
        gtk_status_icon_set_from_pixbuf(GTK_STATUS_ICON(systray_icon), GDK_PIXBUF(icon));
        gtk_status_icon_set_tooltip(systray_icon, "Firetray");

        /* Connect signals */
        g_signal_connect(G_OBJECT(systray_icon), "activate", G_CALLBACK(activate), this);
    } else {
        gtk_status_icon_set_visible(systray_icon, TRUE);
    }

	return NS_OK;
}

/* void hideTray (); */
NS_IMETHODIMP nsTray::HideTray() {
    gtk_status_icon_set_visible(systray_icon, FALSE);

	return NS_OK;
}

/* void trayActivateEvent (in nsITrayCallback aCallback); */
NS_IMETHODIMP nsTray::TrayActivateEvent(nsITrayCallback *aCallback) {
    this->tray_callback = aCallback;
    return NS_OK;
}

/* void minimize (in PRUint32 aCount, [array, size_is (aCount)] in nsIBaseWindow aBaseWindows); */
NS_IMETHODIMP nsTray::Minimize(PRUint32 aCount, nsIBaseWindow **aBaseWindows) {
    nsresult rv;
    PRUint32 i;

    NS_ENSURE_ARG(aCount);
    NS_ENSURE_ARG_POINTER(aBaseWindows);
    NS_ENSURE_TRUE(0 == this->windowListCount, NS_ERROR_ALREADY_INITIALIZED);

    this->windowList = new GdkWindow*[aCount];
    if (!this->windowList) {
        return NS_ERROR_OUT_OF_MEMORY;
    }
    this->windowListCount = aCount;

    for (i = 0; i < aCount; ++i) {
        nativeWindow aNativeWindow;
        rv = aBaseWindows[i]->GetParentNativeWindow(&aNativeWindow);
        NS_ENSURE_SUCCESS(rv, rv);

        this->windowList[i] = NS_REINTERPRET_CAST(GdkWindow*, aNativeWindow);
        NS_ENSURE_ARG_POINTER(this->windowList[i]);
    }

    // everything worked, now hide the window
    for (i = 0; i < aCount; ++i) {
        gdk_window_hide(gdk_window_get_toplevel(this->windowList[i]));
    }

    return NS_OK;
}

/* void restore (); */
NS_IMETHODIMP nsTray::Restore() {
    for (PRInt32 i = 0; i < this->windowListCount; ++i) {
        gdk_window_show(gdk_window_get_toplevel(this->windowList[i]));
    }

    delete [] this->windowList;
    this->windowList = NULL;
    this->windowListCount = 0;

    return NS_OK;
}
