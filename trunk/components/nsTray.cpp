#include "nsTray.h"
#include "pixmaps/tray.xpm"

static GtkStatusIcon *systray_icon = NULL;
static GdkPixbuf *icon = NULL;

/* Implementation file */
NS_IMPL_ISUPPORTS1(nsTray, nsITray)

nsTray::nsTray()
{
  /* member initializers and constructor code */
}

nsTray::~nsTray()
{
  /* destructor code */
}

/* void showTray (); */
NS_IMETHODIMP nsTray::ShowTray()
{
    systray_icon = gtk_status_icon_new();
    icon = gdk_pixbuf_new_from_xpm_data((const char**)tray_icon);
    gtk_status_icon_set_from_pixbuf(GTK_STATUS_ICON(systray_icon), GDK_PIXBUF(icon));
    gtk_status_icon_set_tooltip(systray_icon, "Firetray");

	return NS_OK;
}

/* void hideTray (); */
NS_IMETHODIMP nsTray::HideTray()
{
    return NS_ERROR_NOT_IMPLEMENTED;
}