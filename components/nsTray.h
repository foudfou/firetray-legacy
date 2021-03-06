#ifndef _TRAY_H_
#define _TRAY_H_

#include <map>

#include <gtk/gtk.h>
#include <gdk-pixbuf/gdk-pixbuf.h>
#include <pango/pango.h>
#include <glib-object.h>
#include <gtk/gtksignal.h>
// REMOVE NOTIFY #include <libnotify/notify.h>
#include <X11/Xlib.h>

#include "nsITray.h"
#include "nsCOMPtr.h"

#define NS_ITRAY_CONTRACTID "@mozilla.org/FireTray;1"
#define NS_ITRAY_CLASSNAME "System Tray for Firefox"
#define NS_ITRAY_CID  { 0xbf249f85, 0x20f2, 0x49be, { 0x96, 0xf3, 0x96, 0x81, 0xf3, 0xbb, 0x03, 0x34 } }
#define NS_NOTIFY_TIME 2500

//#define Point std::pair<gint,gint>

struct window_state //keeps needed window information ... 
{
  
  bool valid; 
  
  int visibility; // VisibilityUnobscured, VisibilityPartiallyObscured, or VisibilityFullyObscured.
  
  int pos_x;	//save the position of the window 
  int pos_y;
  
  int width;
  int height;

  window_state()
  {
    valid=false;
  }
  
};

/* Header file */
class nsTray : public nsITray {
public:
    NS_DECL_ISUPPORTS
    NS_DECL_NSITRAY

    nsTray();

    nsCOMPtr<nsITrayCallback> tray_callback;
    nsCOMPtr<nsIScrollCallback> scroll_callback;
    nsCOMPtr<nsIKeySymCallback> key_callback;


    std::map <PRUint64, nsCOMPtr<nsITrayCallback> > item_callback_list;
    std::map<Window,window_state *> handled_windows;
   
    static void activate(GtkStatusIcon*, gpointer);
    static gboolean scroll(GtkStatusIcon  *status_icon, GdkEventScroll *event, gpointer user_data);
    static void popup(GtkStatusIcon*, guint, guint, gpointer);
    static void item_event(GtkWidget *, gpointer);
    static void menu_remove_all_callback(GtkWidget *, gpointer);

    void minimizeEvent(); 
    bool closeEvent();    
    
private:
  
    void AddMenuItemCallback(PRUint64 item,nsITrayCallback *aCallback);
    void RemoveMenuItemCallback(PRUint64 item);
    bool SetIcon(const char *filename, GdkPixbuf *& icon);
    ~nsTray();

    bool block_close;
    bool block_minimize;

    GtkStatusIcon *systray_icon;
    
    GdkPixbuf *default_icon;
    GdkPixbuf *special_icon;

    GdkPixbuf *icon;

    GtkWidget *pop_menu;
    PangoLayout *layout;

// REMOVE NOTIFY   NotifyNotification *sys_notification;


protected:
    /* additional members */
};

#endif //_TRAY_H_
