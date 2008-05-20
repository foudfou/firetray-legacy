#include "nsTray.h"
#include "pixmaps/firefox.xpm"
#include "pixmaps/thunderbird.xpm"
#include "pixmaps/dove.xpm"
#include "pixmaps/weasel.xpm"
#include "pixmaps/icecat.xpm"
#include "pixmaps/newmail.xpm"
#include "pixmaps/songbird.xpm"
#include "pixmaps/songbirdegg.xpm"
#include "pixmaps/sunbird.xpm"

#include "nsMemory.h"
#include "nsIBaseWindow.h"
#include <pango/pangoft2.h>
#include <pango/pango-layout.h>

#include <gtk/gtksignal.h>
#include <libnotify/notify.h>
#include <iostream>

using namespace std;

//#define DO_DEBUG 1

#ifdef DO_DEBUG
 #define DEBUGSTR(str) cerr << str << endl;
#else
 #define DEBUGSTR(str) ;
#endif

// Returns the lenght of a NULL-terminated UTF16 PRUnichar * string 
PRUint32 PRUstrlen(const PRUnichar *text) {
  if(!text) return 0;
  PRUint32 cnt=0;
  while(*text != 0) {
    cnt++;
    text++;
  }
  return cnt;
}

void nsTray::activate(GtkStatusIcon* status_icon, gpointer user_data) {
    PRBool ret = TRUE;
    nsTray *data = static_cast<nsTray*>(user_data);

    data->tray_callback->Call(&ret);
}

void nsTray::popup(GtkStatusIcon *status_icon, guint button, guint activate_time, gpointer user_data) {
    nsTray *data = static_cast<nsTray*>(user_data);

    if (data->pop_menu) {
        gtk_widget_show_all(data->pop_menu);
        gtk_menu_popup(GTK_MENU(data->pop_menu), NULL, NULL,
                gtk_status_icon_position_menu, data->systray_icon, button, activate_time);
    }
}

void nsTray::item_event(GtkWidget *widget, gpointer user_data) {
    PRBool ret = TRUE;
    nsTray *data = static_cast<nsTray*>(user_data);

    if(data->item_callback_list[(PRUint64)widget]) {
        data->item_callback_list[(PRUint64)widget]->Call(&ret);
    }
}

void nsTray::menu_remove_all_callback(GtkWidget *widget, gpointer user_data) {
    nsTray *data = static_cast<nsTray*>(user_data);

    gtk_widget_destroy(widget);
    data->item_callback_list.erase((PRUint64)widget);

    if (GTK_IS_CONTAINER(widget)) {
        gtk_container_foreach(GTK_CONTAINER(widget), (GtkCallback)(nsTray::menu_remove_all_callback), user_data);
    }
}

/* Implementation file */
NS_IMPL_ISUPPORTS1(nsTray, nsITray)

nsTray::nsTray() {
    /* member initializers and constructor code */
    this->block_close=false;

    this->systray_icon = NULL;
    this->icon = NULL;
    this->default_icon = NULL;
    this->special_icon = NULL;
    this->pop_menu = NULL;
    this->tray_callback = NULL;

    this->systray_icon = gtk_status_icon_new();

    this->icon = gdk_pixbuf_new_from_xpm_data((const char**)firefox_xpm);

    /* Connect signals */
    g_signal_connect(G_OBJECT(this->systray_icon), "activate", G_CALLBACK(nsTray::activate), this);
    g_signal_connect(G_OBJECT(this->systray_icon), "popup-menu", G_CALLBACK(nsTray::popup), this);

    this->pop_menu = gtk_menu_new();
}

nsTray::~nsTray() {
    /* destructor code */ //TO_DO CHECK FOR MEMORY LEAKS...
    this->systray_icon = NULL;
    this->icon = NULL;
    this->pop_menu = NULL;
    this->tray_callback = NULL;
}

/* void showTray (); */
NS_IMETHODIMP nsTray::ShowTray() {
    if (this->systray_icon) {
        gtk_status_icon_set_visible(this->systray_icon, TRUE);
    }

    return NS_OK;
}

/* void hideTray (); */
NS_IMETHODIMP nsTray::HideTray() {
    gtk_status_icon_set_visible(this->systray_icon, FALSE);

    return NS_OK;
}

/* void trayActivateEvent (in nsITrayCallback aCallback); */
NS_IMETHODIMP nsTray::TrayActivateEvent(nsITrayCallback *aCallback) {
    this->tray_callback = aCallback;
    return NS_OK;
}

/* void hideWindow (in nsIBaseWindow aBaseWindow); */
NS_IMETHODIMP nsTray::HideWindow(nsIBaseWindow *aBaseWindow) {
    nsresult rv;

    NS_ENSURE_ARG_POINTER(aBaseWindow);

    nativeWindow aNativeWindow;
    rv = aBaseWindow->GetParentNativeWindow(&aNativeWindow);
    NS_ENSURE_SUCCESS(rv, rv);

     //#gdk_window_hide(gdk_window_get_toplevel(NS_REINTERPRET_CAST(GdkWindow*, aNativeWindow)));

    gdk_window_hide(gdk_window_get_toplevel((GdkWindow*) aNativeWindow));

    return NS_OK;
}

/* void restore (in PRUint32 aCount, [array, size_is (aCount)] in nsIBaseWindow aBaseWindows); */
NS_IMETHODIMP nsTray::Restore(PRUint32 aCount, nsIBaseWindow **aBaseWindows) {
    nsresult rv;
    PRUint32 i;

    NS_ENSURE_ARG(aCount);
    NS_ENSURE_ARG_POINTER(aBaseWindows);

    for (i = 0; i < aCount; ++i) {
        nativeWindow aNativeWindow;
        rv = aBaseWindows[i]->GetParentNativeWindow(&aNativeWindow);
        NS_ENSURE_SUCCESS(rv, rv);
        
        GdkWindow * toplevel=gdk_window_get_toplevel((GdkWindow*) aNativeWindow);
        
        gdk_window_show(toplevel);

        GdkWindowState s=gdk_window_get_state(toplevel);

        if(s & GDK_WINDOW_STATE_ICONIFIED) 
          gdk_window_deiconify(toplevel);

    }

    return NS_OK;
}

/* void restoreWindow (in nsIBaseWindow aBaseWindow); */
NS_IMETHODIMP nsTray::RestoreWindow(nsIBaseWindow *aBaseWindow) {
    nsresult rv;

    NS_ENSURE_ARG_POINTER(aBaseWindow);

    nativeWindow aNativeWindow;
    rv = aBaseWindow->GetParentNativeWindow(&aNativeWindow);
    NS_ENSURE_SUCCESS(rv, rv);

    gdk_window_show(gdk_window_get_toplevel((GdkWindow*)aNativeWindow));

    return NS_OK;
}

/* PRUint64 get_tray_menu (); */
NS_IMETHODIMP nsTray::Get_tray_menu(PRUint64 *_retval) {
    *_retval = (PRUint64)this->pop_menu;

    return NS_OK;
}

/* PRUint64 menu_new (in string label); */
NS_IMETHODIMP nsTray::Menu_new(PRUint64 *_retval) {
    GtkWidget *menu = gtk_menu_new();
    *_retval = (PRUint64)menu;

    return NS_OK;
}

/* PRUint64 menu_item_new (in wstring label); */
NS_IMETHODIMP nsTray::Menu_item_new(const PRUnichar *label, PRUint64 *_retval) {
    PRUint32 len=PRUstrlen(label);  
    gchar * utf8=g_utf16_to_utf8 ((const gunichar2 *)label, len, NULL, NULL, NULL);
    GtkWidget *item = gtk_menu_item_new_with_label(utf8);
    *_retval = (PRUint64)item;
    g_free(utf8);  

    return NS_OK;
}

/* PRUint64 separator_menu_item_new (); */
NS_IMETHODIMP nsTray::Separator_menu_item_new(PRUint64 *_retval) {
    GtkWidget *item = gtk_separator_menu_item_new();
    *_retval = (PRUint64)item;

    return NS_OK;
}

/* void menu_append (in PRUint64 menu_item); */
NS_IMETHODIMP nsTray::Menu_append(PRUint64 menu, PRUint64 item, nsITrayCallback *aCallback) {
    gtk_menu_shell_append(GTK_MENU_SHELL(menu), GTK_WIDGET(item));
    nsCOMPtr<nsITrayCallback> item_callback = aCallback;
    this->item_callback_list[item] = item_callback;
    g_signal_connect(G_OBJECT(item), "activate", G_CALLBACK(nsTray::item_event), this);

    return NS_OK;
}

/* void menu_prepend (in PRUint64 item, in nsITrayCallback aCallback); */
NS_IMETHODIMP nsTray::Menu_prepend(PRUint64 menu, PRUint64 item, nsITrayCallback *aCallback) {
    gtk_menu_shell_prepend(GTK_MENU_SHELL(menu), GTK_WIDGET(item));
    nsCOMPtr<nsITrayCallback> item_callback = aCallback;
    this->item_callback_list[item] = item_callback;
    g_signal_connect(G_OBJECT(item), "activate", G_CALLBACK(nsTray::item_event), this);

    return NS_OK;
}
/* void menu_insert (in PRUint64 menu, in PRUint64 item, in PRUint64 pos, in nsITrayCallback aCallback); */
NS_IMETHODIMP nsTray::Menu_insert(PRUint64 menu, PRUint64 item, PRUint64 pos, nsITrayCallback *aCallback) {
    gtk_menu_shell_insert(GTK_MENU_SHELL(menu), GTK_WIDGET(item), pos);
    nsCOMPtr<nsITrayCallback> item_callback = aCallback;
    this->item_callback_list[item] = item_callback;
    g_signal_connect(G_OBJECT(item), "activate", G_CALLBACK(nsTray::item_event), this);

    return NS_OK;
}

/* void menu_sub (in PRUint64 item, in PRUint64 sub_menu); */
NS_IMETHODIMP nsTray::Menu_sub(PRUint64 item, PRUint64 sub_menu) {
    gtk_menu_item_set_submenu(GTK_MENU_ITEM(item), GTK_WIDGET(sub_menu));

    return NS_OK;
}

/* void menu_remove (in PRUint64 menu, in PRUint64 item); */
NS_IMETHODIMP nsTray::Menu_remove(PRUint64 menu, PRUint64 item) {
    gtk_container_remove(GTK_CONTAINER(menu), GTK_WIDGET(item));
    this->item_callback_list.erase(item);

    return NS_OK;
}

/* void menu_remove_all (in PRUint64 menu); */
NS_IMETHODIMP nsTray::Menu_remove_all(PRUint64 menu) {
    gtk_container_foreach(GTK_CONTAINER(menu), (GtkCallback)(nsTray::menu_remove_all_callback), this);

    return NS_OK;
}

/* void menu_length (in PRUint64 menu); */
NS_IMETHODIMP nsTray::Menu_length(PRUint64 menu, PRUint64 *_retval) {
    GList *list = gtk_container_get_children(GTK_CONTAINER(menu));
    *_retval = g_list_length(list);

    return NS_OK;
}

/* void set_default_xpm_icon (in PRUint64 app); */
NS_IMETHODIMP nsTray::Set_default_xpm_icon(PRUint32 app) 
{

 if(this->icon) { g_object_unref(this->icon); this->icon=NULL;}
 if(this->default_icon) { g_object_unref(this->default_icon); this->default_icon=NULL;}
 if(this->special_icon) { g_object_unref(this->special_icon); this->special_icon=NULL;}

 
 const char * text;
 char **df_icon;
 char **sp_icon;

  /* APPS

   0 - Unknown (defaults to firefox)
   1 - Firefox
   2 - Thunderbird
   3 - Swiftdove
   4 - Swiftweasel
   5 - Icedove
   6 - iceweasel 
   7 - icecat
   8 - songbird
   9 - sunbird
 
  */

 switch(app)
 {
   case 9: //sunbird
           df_icon=(char**)sunbird_xpm;
           sp_icon=(char**)sunbird_xpm;
	   text="Firetray (Sunbird)";
           break;
   case 8: //songbird
           df_icon=(char**)songbirdegg_xpm;
           sp_icon=(char**)songbird_xpm;
	   text="Firetray (Songbird)";
           break;
   case 7: //icecat
           df_icon=(char**)icecat_xpm;
           sp_icon=(char**)newmail_xpm;
	   text="Firetray (Icecat)";
           break;
   case 6: //iceweasel
           df_icon=(char**)weasel_xpm;
           sp_icon=(char**)newmail_xpm;
	   text="Firetray (Iceweasel)";
           break;
   case 5: //swiftdove
           df_icon=(char**)dove_xpm;
           sp_icon=(char**)newmail_xpm;
	   text="Firetray (Icedove)";
           break;
   case 4: //swiftweasel
           df_icon=(char**)weasel_xpm;
           sp_icon=(char**)newmail_xpm;
	   text="Firetray (Swifweasel)";
           break;
   case 3: //swiftdove
           df_icon=(char**)dove_xpm;
           sp_icon=(char**)newmail_xpm;
	   text="Firetray (Swiftdove)";
           break;
   case 2: //thunderbird
           df_icon=(char**)thunderbird_xpm;
           sp_icon=(char**)newmail_xpm;
	   text="Firetray (Thunderbird)";
           break;
   case 1: //firefox
   default:
           df_icon=(char**)firefox_xpm;
           sp_icon=(char**)firefox_xpm;
	   text="Firetray (Firefox)";
           break;
 }
  
 this->default_icon = gdk_pixbuf_new_from_xpm_data((const char**)df_icon);
 this->special_icon = gdk_pixbuf_new_from_xpm_data((const char**)sp_icon);

 gtk_status_icon_set_from_pixbuf(GTK_STATUS_ICON(this->systray_icon), GDK_PIXBUF(this->default_icon));

 gtk_status_icon_set_tooltip(this->systray_icon, text);
 gtk_status_icon_set_visible(this->systray_icon, TRUE);

 return NS_OK;   
}

/* void set_default_icon (in string filename); */
NS_IMETHODIMP nsTray::Set_default_icon(const char *filename) 
{
    GError * error = NULL;
    GdkPixbuf *new_icon=gdk_pixbuf_new_from_file(filename, &error);
    if(new_icon) 
     {
       if(this->default_icon) 
        { 
           g_object_unref(this->default_icon); 
           this->default_icon=NULL;
        }

       this->default_icon=new_icon;
      }
    
    return NS_OK;   
}

/* void set_special_icon (in string filename); */
NS_IMETHODIMP nsTray::Set_special_icon(const char *filename)
{
    GError * error = NULL;
    GdkPixbuf *new_icon=gdk_pixbuf_new_from_file(filename, &error);
    if(new_icon) 
     {
       if(this->special_icon) 
        { 
           g_object_unref(this->special_icon); 
           this->special_icon=NULL;
        }

       this->special_icon=new_icon;
      }
    
    return NS_OK;   
}


#define MIN_FONT_SIZE 4

GdkPixbuf *DrawText (GdkPixbuf *base, gchar *text)
{ 
  if(!base || !text) return NULL;
 
  int w=gdk_pixbuf_get_width(base);  
  int h=gdk_pixbuf_get_height(base);
  
  GdkPixmap *pm = gdk_pixmap_new (NULL, w, h, 24);
    
  GdkGC *gc = gdk_gc_new (pm);
  
  GdkColor fore = { 100, 255, 255, 0x00 };
  //GdkColor back = { 100, 105, 105, 0x00 };

  /*GdkColor color;
  color.red=0;
  color.green=100;
  color.blue=200;*/
  //gdk_gc_set_rgb_fg_color (gc,&color);

  gdk_draw_pixbuf (pm, gc, base, 0, 0, 0, 0, w, h, GDK_RGB_DITHER_NONE, 0, 0);

  GtkWidget *scratch = gtk_window_new (GTK_WINDOW_TOPLEVEL);
  gtk_widget_realize (scratch);

  PangoLayout *layout = gtk_widget_create_pango_layout (scratch, NULL);
  gtk_widget_destroy (scratch);

  PangoFontDescription *fnt = pango_font_description_from_string("Sans 18");

  pango_font_description_set_weight (fnt,PANGO_WEIGHT_SEMIBOLD);
  pango_layout_set_spacing            (layout,0);

  pango_layout_set_font_description   (layout, fnt);

  pango_layout_set_text (layout, text,-1);
  
  int tw=0;
  int th=0;
  int sz;
  int border=4;
  
  pango_layout_get_pixel_size(layout, &tw, &th);

  while( (tw>w - border || th > h - border)) //fit text to the icon by decreasing font size
  {
    sz=pango_font_description_get_size (fnt);

    if(sz<MIN_FONT_SIZE) {  
        sz=MIN_FONT_SIZE;
        break; 
    }
    sz-=PANGO_SCALE; //to do: check if is absolute...
   
    pango_font_description_set_size (fnt,sz);
    pango_layout_set_font_description   (layout, fnt);
    pango_layout_get_pixel_size(layout, &tw, &th);
  }

  //centers the text
  int px, py;
  px=(w-tw)/2;
  py=(h-th)/2;


  //paints the text
  //TODO
  gdk_draw_layout_with_colors (pm, gc, px, py, layout, &fore,NULL);
  g_object_unref (layout);   
  
  GdkPixbuf *ret = gdk_pixbuf_get_from_drawable (NULL, pm, NULL, 0, 0, 0, 0, w, h);
   
  pango_font_description_free (fnt);
  return ret;
}

/* void set_icon_text (in string text); */
NS_IMETHODIMP nsTray::Set_icon_text(const char *text) {

    if(strlen(text)>0 && special_icon) 
     {
       GdkPixbuf *edit=DrawText (special_icon, (gchar *)text);       

       gtk_status_icon_set_from_pixbuf(GTK_STATUS_ICON(this->systray_icon), GDK_PIXBUF(edit));
       gtk_status_icon_set_visible(this->systray_icon, TRUE);
       //if(old) delete old;
     }
    else {
      if(default_icon)
      {
       gtk_status_icon_set_from_pixbuf(GTK_STATUS_ICON(this->systray_icon), GDK_PIXBUF(default_icon));
       gtk_status_icon_set_visible(this->systray_icon, TRUE);
      }
    }

    return NS_OK;   
}

  /* void set_tray_tooltip (in wstring text); */
NS_IMETHODIMP nsTray::Set_tray_tooltip(const PRUnichar *text){
  if(!text) return NS_OK;

  PRUint64 len=PRUstrlen(text);
  gchar * utf8=g_utf16_to_utf8 ((const gunichar2 *)text,len,NULL,NULL,NULL);

  gtk_status_icon_set_tooltip(this->systray_icon, utf8);

  g_free(utf8);  
 
  return NS_OK;
}

/* void set_tray_tooltip (in string text); */
NS_IMETHODIMP nsTray::Set_tray_icon(PRUint32 FLAG) {
	
    if (!FLAG)
       	gtk_status_icon_set_from_pixbuf(GTK_STATUS_ICON(this->systray_icon), GDK_PIXBUF(default_icon));
    else
		gtk_status_icon_set_from_pixbuf(GTK_STATUS_ICON(this->systray_icon), GDK_PIXBUF(special_icon));
	
	gtk_status_icon_set_visible(this->systray_icon, TRUE);
  	return NS_OK;
}


/*
NS_IMETHODIMP nsTray::Init_tooltip_image() {
	GtkWidget * sysIW = GTK_WIDGET(this->systray_icon);
	gtk_widget_set_has_tooltip(sysIW,TRUE);
	GtkWidget *winTooltip = gtk_window_new(GTK_WINDOW_TOPLEVEL);
	g_signal_connect(GTK_OBJECT(this->systray_icon), "query-tooltip",
					   G_CALLBACK(gtk_widget_set_tooltip_window), 
					   (sysIW,
					   GTK_WINDOW(winTooltip)) );
  	return NS_OK;
}
*/
NS_IMETHODIMP nsTray::Show_a_notification(const PRUnichar *title,const PRUnichar * info,const gchar *image) {

  	
  	PRUint64 len=PRUstrlen(title);
  	gchar * utf8_title =g_utf16_to_utf8 ((const gunichar2 *)title,len,NULL,NULL,NULL);
  	
  	len=PRUstrlen(info);
  	gchar * utf8_info =g_utf16_to_utf8 ((const gunichar2 *)info,len,NULL,NULL,NULL);

	notify_notification_update(this->sys_notification,
									utf8_title,utf8_info,image);
							
	if(!image)								
		notify_notification_set_icon_from_pixbuf(sys_notification,GDK_PIXBUF(this->special_icon));
	
	notify_notification_show(sys_notification,NULL);

	g_free(utf8_title);  	
  	g_free(utf8_info);
  	return NS_OK;
}

NS_IMETHODIMP nsTray::Init_notification(const gchar * appName) {
	
	notify_init(appName);
	sys_notification=notify_notification_new_with_status_icon(
											"FireTray Notification", 
											NULL,
											NULL,
											this->systray_icon);
											
	notify_notification_attach_to_status_icon(sys_notification,
                                              this->systray_icon);
	notify_notification_set_timeout(sys_notification,NS_NOTIFY_TIME);
	
	return NS_OK;
}

  /* void set_close_blocking (in boolean block); */
NS_IMETHODIMP nsTray::Set_close_blocking(PRBool val)  
{
    block_close=val;
    return NS_OK;
}

/* void get_close_blocking (out boolean block); */
NS_IMETHODIMP nsTray::Get_close_blocking(PRBool *val) 
{
    if(val)*val=this->block_close;
    return NS_OK;
}


GtkWindow * get_gtkwindow_from_gdkwindow(GdkWindow *win)
{
      /* don't know if there's a better way ...  */

      GList*  list=gtk_window_list_toplevels();

      if(list) {
         GList* pos=g_list_first(list);
         while(pos!=NULL)
         {
           
           GtkWindow *w=(GtkWindow *)pos->data;
          
           if(w) {
              
               GdkWindow *gdw=((GtkWidget *)w)->window;
               
                if(gdw==win)
                { return w; }

              }
          
           pos=g_list_next(pos);

         }  
      }

      return NULL; // not found
}


#include<X11/Xlib.h>
#include <X11/Xatom.h>
#include <gdk/gdkx.h>


Atom delete_window = XInternAtom (GDK_DISPLAY(), "WM_DELETE_WINDOW", False);

GdkFilterReturn filter_func(GdkXEvent *xevent, GdkEvent *event, gpointer data)
{
   if(!data || !xevent) return GDK_FILTER_CONTINUE;

   XEvent *e=(XEvent *)xevent;
   nsTray *tray = (nsTray *)data;

   switch(e->xany.type)
    {
      case DestroyNotify: 
             DEBUGSTR("DESTROY-NOTIFY!!!") 
             break;
      case ConfigureNotify: 
             DEBUGSTR("CONFIGURE-NOTIFY")
             break;
      case MapNotify: 
             DEBUGSTR("MapNotify-NOTIFY")
             break;
      case UnmapNotify: 
             DEBUGSTR("UnmapNotify-NOTIFY")
             break;
      case ClientMessage: 
             if(e->xclient.data.l[0]==delete_window)
             {
              DEBUGSTR("CLOSING WINDOW") 
              PRBool block=FALSE;
              tray->Get_close_blocking(&block);
              if(block) 
               { 
                 PRBool ret = TRUE;
                 if(tray->tray_callback)tray->tray_callback->Call(&ret);
                 return GDK_FILTER_REMOVE; 
               }
             }
             else 
               DEBUGSTR("ClientMessage-NOTIFY");
             break;
      case VisibilityNotify: 
             DEBUGSTR("VisibilityNotify-NOTIFY")
             break;
      default:
             DEBUGSTR("FILTER_FUNC - UNKNOWN")
             break;

    }

   return GDK_FILTER_CONTINUE;
}



NS_IMETHODIMP nsTray::Set_window_handler(nsIBaseWindow *aBaseWindow) 
{
      nsresult rv;

      NS_ENSURE_ARG_POINTER(aBaseWindow);

      nativeWindow aNativeWindow;
      rv = aBaseWindow->GetParentNativeWindow(&aNativeWindow);
      NS_ENSURE_SUCCESS(rv, rv);

      GdkWindow *gdk_win=gdk_window_get_toplevel((GdkWindow*) aNativeWindow);

      /*GtkWindow *w=get_gtkwindow_from_gdkwindow(gdk_win);
      GtkWidget *wdg=(GtkWidget *)w;*/
      
      //filter close event
      gdk_window_add_filter (gdk_win, filter_func, this);

      return NS_OK;
}
