


#include "nsTray.h"

//BUILT IN PIXMAPS 
#include "pixmaps/firefox.xpm"
#include "pixmaps/thunderbird.xpm"
#include "pixmaps/dove.xpm"
#include "pixmaps/weasel.xpm"
#include "pixmaps/icecat.xpm"
#include "pixmaps/newmail.xpm"
#include "pixmaps/seamonkey.xpm"
#include "pixmaps/songbird.xpm"
#include "pixmaps/songbirdegg.xpm"
#include "pixmaps/sunbird.xpm"

#include "nsMemory.h"
#include "nsIBaseWindow.h"
#include <pango/pangoft2.h>
#include <pango/pango-layout.h>

#include <gdk/gdk.h>
#include <gtk/gtksignal.h>
#include <gdk/gdkx.h>

#define _REMEMBER_POSITION_
#define _KEYSYMS_

#ifdef _KEYSYMS_
  #include <gdk/gdkkeysyms.h>
  #include "keysyms.h"
  #include <X11/XF86keysym.h>
#endif
//// REMOVE NOTIFY #include <libnotify/notify.h>

#include <X11/Xlib.h>
#include <X11/Xatom.h>
#include <X11/Xutil.h>

#include "debug.h"

#define CAPTURE_ERRORS()  gdk_error_trap_push ();
#define RELEASE_CAPTURE(msg)       { gdk_flush (); if (gdk_error_trap_pop ()) ERRORMSG(msg); }
#define RELEASE_CAPTURE_RETURN(msg,val)       { gdk_flush (); if (gdk_error_trap_pop ()) { ERRORMSG(msg); return val; } }      

Atom delete_window = XInternAtom (GDK_DISPLAY(), "WM_DELETE_WINDOW", False);

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

/*

SCROLL DIRECTIONS:

0 - UP
1 - DOWN
2 - LEFT
3 - RIGHT

*/

gboolean nsTray::scroll(GtkStatusIcon  *status_icon, GdkEventScroll *event, gpointer user_data)  
{
    DEBUG_CALL("scroll")

    if(!event || !user_data) return false;

    PRBool ret = TRUE;
    nsTray *data = static_cast<nsTray*>(user_data);

    PRUint32 dir=0;

    switch(event->direction)
    {    
        case GDK_SCROLL_UP:
	      DEBUGSTR("SCROLL UP")	
	      dir=0;
	      break;

        case GDK_SCROLL_DOWN:
	      DEBUGSTR("SCROLL DOWN")	  
	      dir=1;
	      break;

        case GDK_SCROLL_LEFT:
	      DEBUGSTR("SCROLL LEFT")	  
	      dir=2;
	      break;

        case GDK_SCROLL_RIGHT:
	      DEBUGSTR("SCROLL RIGHT")	  
	      dir=3;
	      break;

        default:
	      DEBUGSTR("SCROLL UNKNOWN")	  
	      return false;
	      break;      
    }

    if(!data->scroll_callback) return true;

    data->scroll_callback->Call(dir, &ret);

    return true; 

}

void nsTray::popup(GtkStatusIcon *status_icon, guint button, guint activate_time, gpointer user_data) {
    DEBUG_CALL("popup")
    nsTray *data = static_cast<nsTray*>(user_data);

    if (data->pop_menu) {
        gtk_widget_show_all(data->pop_menu);
        gtk_menu_popup(GTK_MENU(data->pop_menu), NULL, NULL,
                gtk_status_icon_position_menu, data->systray_icon, button, activate_time);
    }
}

void nsTray::item_event(GtkWidget *widget, gpointer user_data) {
    DEBUG_CALL("item_event")
    PRBool ret = TRUE;
    nsTray *data = static_cast<nsTray*>(user_data);

    if(data->item_callback_list[(PRUint64)widget]) {
        data->item_callback_list[(PRUint64)widget]->Call(&ret);
    }
}

void nsTray::menu_remove_all_callback(GtkWidget *widget, gpointer user_data) {
    DEBUG_CALL("menu_remove_all_callback")
    nsTray *data = static_cast<nsTray*>(user_data);

    if (GTK_IS_CONTAINER(widget)) {
        gtk_container_foreach(GTK_CONTAINER(widget), (GtkCallback)(nsTray::menu_remove_all_callback), user_data);
    }
    
    gtk_widget_destroy(widget);
    data->item_callback_list.erase((PRUint64)widget);
}

/* Implementation file */
NS_IMPL_ISUPPORTS1(nsTray, nsITray)

nsTray::nsTray() {
    DEBUG_CALL("nsTray")

    /* member initializers and constructor code */
    appStarted=false;
    menuCreated=false;
    block_close=false;
    block_minimize=false;

    systray_icon = NULL;
    icon = NULL;
    default_icon = NULL;
    special_icon = NULL;
    pop_menu = NULL;

    tray_callback = NULL;
    scroll_callback = NULL;
    key_callback = NULL;

    systray_icon = gtk_status_icon_new();

    icon = gdk_pixbuf_new_from_xpm_data((const char**)firefox_xpm);

    /* Connect signals */
    g_signal_connect(G_OBJECT(this->systray_icon), "activate", G_CALLBACK(nsTray::activate), this);
    g_signal_connect(G_OBJECT(this->systray_icon), "popup-menu", G_CALLBACK(nsTray::popup), this);
    g_signal_connect(G_OBJECT(this->systray_icon), "scroll-event", G_CALLBACK(nsTray::scroll), this);

    this->pop_menu = gtk_menu_new();

}

nsTray::~nsTray() {
    DEBUG_CALL("~nsTray")
    /* destructor code */ //TO_DO CHECK FOR MEMORY LEAKS...
    this->systray_icon = NULL;
    this->icon = NULL;
    this->pop_menu = NULL;
    this->tray_callback = NULL;
}

/* void showTray (); */
NS_IMETHODIMP nsTray::ShowTray() {
    DEBUG_CALL("showTray")

    if (this->systray_icon) {
         gtk_status_icon_set_from_pixbuf(GTK_STATUS_ICON(this->systray_icon), GDK_PIXBUF(default_icon));
//	this->systray_icon=gtk_status_icon_new_from_pixbuf(GDK_PIXBUF(default_icon));
        gtk_status_icon_set_visible(this->systray_icon, TRUE);
    }

    return NS_OK;
}

/* void hideTray (); */
NS_IMETHODIMP nsTray::HideTray() {
    DEBUG_CALL("hideTray")

    gtk_status_icon_set_visible(this->systray_icon, FALSE);

    return NS_OK;
}

/* void trayActivateEvent (in nsITrayCallback aCallback); */
NS_IMETHODIMP nsTray::TrayActivateEvent(nsITrayCallback *aCallback) {
    DEBUG_CALL("trayActivateEvent")
    this->tray_callback = aCallback;
    return NS_OK;
}

/* void trayScrollEvent (in nsIScrollCallback aCallback); */
NS_IMETHODIMP nsTray::TrayScrollEvent(nsIScrollCallback *aCallback) {
    DEBUG_CALL("trayScrollEvent")
    this->scroll_callback = aCallback;
    return NS_OK;
}

/* void trayKeyEvent (in nsIKeySymCallback aCallback); */
NS_IMETHODIMP nsTray::TrayKeyEvent(nsIKeySymCallback *aCallback) {
    DEBUG_CALL("trayKeyEvent")
    this->key_callback = aCallback;
    return NS_OK;
}


int GetParent(Window win, Window *parent)
{
   DEBUG_CALL("getParent")

   if(parent==NULL)return 0;

   CAPTURE_ERRORS()

   Window root;
   Window *children;
   unsigned int nchildren;
   if(!XQueryTree(GDK_DISPLAY(), win, &root, parent, &children, &nchildren)) return 0;
            
   if(children) XFree(children);

   RELEASE_CAPTURE_RETURN("Error getting window parent",0)

   return 1;
}



void EchoWinAttribs(Window win)
{
   CAPTURE_ERRORS()

   XWindowAttributes attrib;
   if( XGetWindowAttributes(GDK_DISPLAY(), win, &attrib) )
    {
       DEBUGSTR( "WIN: "<< win <<" POS: ("<< attrib.x << ","<< attrib.y << ") - SIZE: " << attrib.width << "x" << attrib.height) 
   }

   RELEASE_CAPTURE("Error getting window information")
}

void ExploreTree(Window xwin)
{
  int ok=1;
  while(ok)
   {
     EchoWinAttribs(xwin);
     Window parent;
     ok=GetParent(xwin, &parent);
     xwin=parent;
   }
}

/* void hideWindow (in nsIBaseWindow aBaseWindow); */
NS_IMETHODIMP nsTray::HideWindow(nsIBaseWindow *aBaseWindow) {
     DEBUG_CALL("hideWindow")
 
    nsresult rv;
 
    NS_ENSURE_ARG_POINTER(aBaseWindow);

    nativeWindow aNativeWindow;
    rv = aBaseWindow->GetParentNativeWindow(&aNativeWindow);
    NS_ENSURE_SUCCESS(rv, rv);

    CAPTURE_ERRORS()

    GdkWindow *win=gdk_window_get_toplevel((GdkWindow*) aNativeWindow);

    DEBUGSTR("HIDING") 

 #ifdef _REMEMBER_POSITION_
 
    Window xwin=GDK_WINDOW_XID(win);

    DEBUGSTR("HANDLER LIST COUNT " << handled_windows.size()) 

    if(handled_windows.count(xwin)>0) 
      {
         window_state* ws=handled_windows[xwin]; 
  
	 if(ws) {

            Window parent;

            if(GetParent(xwin,&parent)) //we need to get the position of the window with the titlebar
              if(GetParent(parent,&parent) && parent) 
                {              
    	          XWindowAttributes attrib;
  	          if( XGetWindowAttributes(GDK_DISPLAY(), parent, &attrib) )
	          {
                    ws->pos_x=attrib.x;
                    ws->pos_y=attrib.y;
		    DEBUGSTR( "SAVING POSITION X: "<< ws->pos_x << " Y: "<< ws->pos_y )
	          }
	        }            
         } 
      }
 #endif
 
    gdk_window_hide(win);

    RELEASE_CAPTURE("Error hiding window")

    return NS_OK;
}




/* void restore (in PRUint32 aCount, [array, size_is (aCount)] in nsIBaseWindow aBaseWindows); */
NS_IMETHODIMP nsTray::Restore(PRUint32 aCount, nsIBaseWindow **aBaseWindows) {
    DEBUG_CALL("restore")

    PRUint32 i;

    DEBUGSTR("RESTORING WINDOWS");
    
    DEBUGSTR("Appstarted: "<<appStarted);

    NS_ENSURE_ARG(aCount);
    NS_ENSURE_ARG_POINTER(aBaseWindows);

    for (i = 0; i < aCount; ++i)       
       RestoreWindow(aBaseWindows[i]);        

    return NS_OK;
}

/* void restoreWindow (in nsIBaseWindow aBaseWindow); */
NS_IMETHODIMP nsTray::RestoreWindow(nsIBaseWindow *aBaseWindow) {
    DEBUG_CALL("restoreWindow")
    nsresult rv;

    NS_ENSURE_ARG_POINTER(aBaseWindow);

    nativeWindow aNativeWindow;
    rv = aBaseWindow->GetParentNativeWindow(&aNativeWindow);
    NS_ENSURE_SUCCESS(rv, rv);

    CAPTURE_ERRORS()
 
    GdkWindow * toplevel=gdk_window_get_toplevel((GdkWindow*)aNativeWindow);

    gdk_window_show(toplevel);

  #ifdef _REMEMBER_POSITION_
   //if possible restore window position
    Window xwin=GDK_WINDOW_XID(toplevel);
    if(handled_windows.count(xwin)>0) 
      {
         window_state* ws=handled_windows[xwin]; 
  
	 if(ws) {

	          XMoveWindow(GDK_DISPLAY(), xwin, ws->pos_x, ws->pos_y);
		  //gdk_window_move (toplevel, ws->pos_x, ws->pos_y);
		  DEBUGSTR( "RESTORING WINDOW POSITION TO X: "<< ws->pos_x << " Y: "<< ws->pos_y )
         } 
   
      }
  #endif
  
    gdk_window_focus (toplevel, gtk_get_current_event_time ());

    GdkWindowState s=gdk_window_get_state(toplevel);

    if(s & GDK_WINDOW_STATE_ICONIFIED) 
       gdk_window_deiconify(toplevel);


    RELEASE_CAPTURE("Error restoring window")

    return NS_OK;
}

/* PRUint64 getTrayMenu (); */
NS_IMETHODIMP nsTray::GetTrayMenu(PRUint64 *_retval) {
    DEBUG_CALL("getTrayMenu")
    *_retval = (PRUint64)this->pop_menu;

    return NS_OK;
}

/* PRUint64 menuNew (in string label); */
NS_IMETHODIMP nsTray::MenuNew(PRUint64 *_retval) {
    DEBUG_CALL("menuNew")
    GtkWidget *menu = gtk_menu_new();
    *_retval = (PRUint64)menu;

    return NS_OK;
}

gchar *convertUtf16ToUtf8(const PRUnichar *str)
{
    PRUint32 len=PRUstrlen(str);  
    gchar * utf8=g_utf16_to_utf8 ((const gunichar2 *)str, len, NULL, NULL, NULL);
    return utf8;
}


/* PRUint64 menuItemNew (in wstring label, in wstring img); */
NS_IMETHODIMP nsTray::MenuItemNew(const PRUnichar *label, const PRUnichar *img, PRUint64 *_retval) {
    DEBUG_CALL("menuItemNew")

    if(!img) DEBUGSTR("IMMG NULL")
    else {
       DEBUGSTR("IMMG NOT NULL:")	
       DEBUGSTR(img)
    }
 
    GtkWidget *item=NULL;

    gchar * label_utf8=convertUtf16ToUtf8(label);

    if(img && PRUstrlen(img)>0) //try to create menu item with stock image
    {
       gchar * img_utf8=convertUtf16ToUtf8(img);
       item = gtk_image_menu_item_new_with_label (label_utf8);
       gtk_image_menu_item_set_image((GtkImageMenuItem*)item, gtk_image_new_from_stock ( img_utf8 ,GTK_ICON_SIZE_MENU));
       g_free(img_utf8);  
    }

    if(!item) //if img not specified or img error just set menu item with label
    {
       item = gtk_menu_item_new_with_label(label_utf8);
    }

    g_free(label_utf8);  

    *_retval = (PRUint64)item;
    return NS_OK; 
}

/* PRUint64 separatorMenuItemNew (); */
NS_IMETHODIMP nsTray::SeparatorMenuItemNew(PRUint64 *_retval) {
    DEBUG_CALL("separatorMenuItemNew")
    GtkWidget *item = gtk_separator_menu_item_new();
    *_retval = (PRUint64)item;

    return NS_OK;
}
/*///ADDED FOR IMG MENU
/ PRUint64 menu_item_new (in wstring label); /
NS_IMETHODIMP nsTray::Menu_item_img_new(const PRUnichar *label, const PRUnichar *immg, PRUint64 *_retval) {
   PRUint32 len=PRUstrlen(label);  
   gchar * utf8=g_utf16_to_utf8 ((const gunichar2 *)label, len, NULL, NULL, NULL);
   len=PRUstrlen(immg);  
   
gchar * iconn=g_utf16_to_utf8 ((const gunichar2 *)immg, len, NULL, NULL, NULL);

   gtk_image_menu_item_set_image((GtkImageMenuItem*)item, gtk_image_new_from_stock (iconn,GTK_ICON_SIZE_MENU));
   *_retval = (PRUint64)item;
   g_free(utf8);  
   g_free(iconn); 
    return NS_OK;
}

//////*/

/* void menuAppend (in PRUint64 menu_item); */
NS_IMETHODIMP nsTray::MenuAppend(PRUint64 menu, PRUint64 item, nsITrayCallback *aCallback) {
    DEBUG_CALL("menuAppend")
    gtk_menu_shell_append(GTK_MENU_SHELL(menu), GTK_WIDGET(item));
    nsCOMPtr<nsITrayCallback> item_callback = aCallback;
    this->item_callback_list[item] = item_callback;
    g_signal_connect(G_OBJECT(item), "activate", G_CALLBACK(nsTray::item_event), this);

    return NS_OK;
}

/* void menuPrepend (in PRUint64 item, in nsITrayCallback aCallback); */
NS_IMETHODIMP nsTray::MenuPrepend(PRUint64 menu, PRUint64 item, nsITrayCallback *aCallback) {
    DEBUG_CALL("menuPrepend")
    gtk_menu_shell_prepend(GTK_MENU_SHELL(menu), GTK_WIDGET(item));
    nsCOMPtr<nsITrayCallback> item_callback = aCallback;
    this->item_callback_list[item] = item_callback;
    g_signal_connect(G_OBJECT(item), "activate", G_CALLBACK(nsTray::item_event), this);

    return NS_OK;
}
/* void menuInsert (in PRUint64 menu, in PRUint64 item, in PRUint64 pos, in nsITrayCallback aCallback); */
NS_IMETHODIMP nsTray::MenuInsert(PRUint64 menu, PRUint64 item, PRUint64 pos, nsITrayCallback *aCallback) {
    DEBUG_CALL("menuInsert")
    gtk_menu_shell_insert(GTK_MENU_SHELL(menu), GTK_WIDGET(item), pos);
    nsCOMPtr<nsITrayCallback> item_callback = aCallback;
    this->item_callback_list[item] = item_callback;
    g_signal_connect(G_OBJECT(item), "activate", G_CALLBACK(nsTray::item_event), this);

    return NS_OK;
}

/* void menuSub (in PRUint64 item, in PRUint64 sub_menu); */
NS_IMETHODIMP nsTray::MenuSub(PRUint64 item, PRUint64 sub_menu) {
    DEBUG_CALL("menuSub")
    gtk_menu_item_set_submenu(GTK_MENU_ITEM(item), GTK_WIDGET(sub_menu));

    return NS_OK;
}

/* void menuRemove (in PRUint64 menu, in PRUint64 item); */
NS_IMETHODIMP nsTray::MenuRemove(PRUint64 menu, PRUint64 item) {
    DEBUG_CALL("menuRemove")
    gtk_container_remove(GTK_CONTAINER(menu), GTK_WIDGET(item));
    this->item_callback_list.erase(item);

    return NS_OK;
}

/* void menuRemoveAll (in PRUint64 menu); */
NS_IMETHODIMP nsTray::MenuRemoveAll(PRUint64 menu) {
    DEBUG_CALL("menuRemoveAll")
    gtk_container_foreach(GTK_CONTAINER(menu), (GtkCallback)(nsTray::menu_remove_all_callback), this);

    return NS_OK;
}

/* void menuLength (in PRUint64 menu); */
NS_IMETHODIMP nsTray::MenuLength(PRUint64 menu, PRUint64 *_retval) {
    DEBUG_CALL("menuLength")

    GList *list = gtk_container_get_children(GTK_CONTAINER(menu));
    *_retval = g_list_length(list);

    return NS_OK;
}

/* void setDefaultXpmIcon (in PRUint64 app); */
NS_IMETHODIMP nsTray::SetDefaultXpmIcon(PRUint32 app) 
{
    DEBUG_CALL("setDefaultXpmIcon")

 if(this->icon) { g_object_unref(this->icon); this->icon=NULL;}
 if(this->default_icon) { g_object_unref(this->default_icon); this->default_icon=NULL;}
 if(this->special_icon) { g_object_unref(this->special_icon); this->special_icon=NULL;}

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
   10 - seamonkey

  */

 switch(app)
 {
   case 10: //seamonkey  
           df_icon=(char**)seamonkey_xpm;
           sp_icon=(char**)newmail_xpm;
           break;
   case 9: //sunbird
           df_icon=(char**)sunbird_xpm;
           sp_icon=(char**)sunbird_xpm;
           break;
   case 8: //songbird
           df_icon=(char**)songbirdegg_xpm;
           sp_icon=(char**)songbird_xpm;
           break;
   case 7: //icecat
           df_icon=(char**)icecat_xpm;
           sp_icon=(char**)newmail_xpm;
           break;
   case 6: //iceweasel
           df_icon=(char**)weasel_xpm;
           sp_icon=(char**)newmail_xpm;
           break;
   case 5: //swiftdove
           df_icon=(char**)dove_xpm;
           sp_icon=(char**)newmail_xpm;
           break;
   case 4: //swiftweasel
           df_icon=(char**)weasel_xpm;
           sp_icon=(char**)newmail_xpm;
           break;
   case 3: //swiftdove
           df_icon=(char**)dove_xpm;
           sp_icon=(char**)newmail_xpm;
           break;
   case 2: //thunderbird
           df_icon=(char**)thunderbird_xpm;
           sp_icon=(char**)newmail_xpm;
           break;
   case 1: //firefox
   default:
           df_icon=(char**)firefox_xpm;
           sp_icon=(char**)firefox_xpm;
           break;
 }
  
 this->default_icon = gdk_pixbuf_new_from_xpm_data((const char**)df_icon);
 this->special_icon = gdk_pixbuf_new_from_xpm_data((const char**)sp_icon);

/* gtk_status_icon_set_from_pixbuf(GTK_STATUS_ICON(this->systray_icon), GDK_PIXBUF(this->default_icon));

 gtk_status_icon_set_tooltip(this->systray_icon, text);
 gtk_status_icon_set_visible(this->systray_icon, TRUE);*/

 return NS_OK;   
}



  /* boolean setDefaultIcon (in string filename); */
NS_IMETHODIMP nsTray::SetDefaultIcon(const char *filename, PRBool *_retval)
{
    DEBUG_CALL("setDefaultIcon")

    *_retval=true;   

   DEBUGSTR(filename);

    GError * error = NULL;
    GdkPixbuf *new_icon=gdk_pixbuf_new_from_file(filename, &error);
    if(new_icon) 
     {
       DEBUGSTR("OK!")

       if(this->default_icon) { 
           g_object_unref(this->default_icon); 
        }
        this->default_icon=new_icon;
      }
    else 
	{
		DEBUGSTR("ERROR!")
               *_retval=false;
	}
    
    return NS_OK;   
}

  /* boolean setSpecialIcon (in string filename); */
NS_IMETHODIMP nsTray::SetSpecialIcon(const char *filename, PRBool *_retval) 
{
   DEBUG_CALL("setSpecialIcon")
   *_retval=true;   

   DEBUGSTR(filename);

    GError * error = NULL;
    GdkPixbuf *new_icon=gdk_pixbuf_new_from_file(filename, &error);
    if(new_icon) 
     {
       DEBUGSTR("OK!")

       if(this->special_icon) { 
           g_object_unref(this->special_icon); 
        }
        this->special_icon=new_icon;
      }
    else 
	{
		DEBUGSTR("ERROR!")
               *_retval=false;
	}
    
    return NS_OK;   
}


#define MIN_FONT_SIZE 4

GdkPixbuf *DrawText (GdkPixbuf *base, gchar *text, const gchar *colorstr)
{ 
  if(!base || !text) return NULL;
 
  int w=gdk_pixbuf_get_width(base);  
  int h=gdk_pixbuf_get_height(base);
  
  GdkPixmap *pm = gdk_pixmap_new (NULL, w, h, 24);
    
  GdkGC *gc = gdk_gc_new (pm);
  
  GdkColor fore; // = { 0xFFFF, 255, 255, 0x00 };

  if(  gdk_color_parse  (colorstr, &fore) ) DEBUGSTR("COLOR OK")
  else DEBUGSTR("COLOR ERROR")

//  GdkColormap * colormap=gdk_gc_get_colormap (gc);
//  if(colormap) 
   {
     DEBUGSTR("COLORMAP NOT NULL")
     gboolean res=gdk_colormap_alloc_color (gdk_rgb_get_cmap (), &fore,true,true);

     if(res) DEBUGSTR("RES=TRUE")
    else DEBUGSTR("RES=FALSE")

   }

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
    sz-=PANGO_SCALE; 
   
    pango_font_description_set_size (fnt,sz);
    pango_layout_set_font_description   (layout, fnt);
    pango_layout_get_pixel_size(layout, &tw, &th);
  }

  //centers the text
  int px, py;
  px=(w-tw)/2;
  py=(h-th)/2;


  //paints the text
  gdk_draw_layout_with_colors (pm, gc, px, py, layout, &fore,NULL);
  g_object_unref (layout);   
  
  GdkPixbuf *ret = gdk_pixbuf_get_from_drawable (NULL, pm, NULL, 0, 0, 0, 0, w, h);
   
  pango_font_description_free (fnt);
  return ret;
}


/* void setIconText (in string text, in string color); */
NS_IMETHODIMP nsTray::SetIconText(const char *text, const char *color) 
{
    DEBUG_CALL("setIconText")

    if(strlen(text)>0 && special_icon) 
     {
       GdkPixbuf *edit=DrawText (special_icon, (gchar *)text, color);       

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

  /* void setTrayTooltip (in wstring text); */
NS_IMETHODIMP nsTray::SetTrayTooltip(const PRUnichar *text){
  DEBUG_CALL("setTrayTooltip")

  if(!text) return NS_OK;

  PRUint64 len=PRUstrlen(text);
  gchar * utf8=g_utf16_to_utf8 ((const gunichar2 *)text,len,NULL,NULL,NULL);

  gtk_status_icon_set_tooltip(this->systray_icon, utf8);

  g_free(utf8);  
 
  return NS_OK;
}

/* void setTrayIcon(in PRUint32 FLAG); */
NS_IMETHODIMP nsTray::SetTrayIcon(PRUint32 FLAG) {
    DEBUG_CALL("setTrayIcon")


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

/* void setCloseBlocking (in boolean block); */
NS_IMETHODIMP nsTray::SetCloseBlocking(PRBool val)  
{
    DEBUG_CALL("setCloseBlocking")
    block_close=val;
    return NS_OK;
}

/* void getCloseBlocking (out boolean block); */
NS_IMETHODIMP nsTray::GetCloseBlocking(PRBool *val) 
{
    DEBUG_CALL("getCloseBlocking")

    if(val)*val=this->block_close;
    return NS_OK;
}

/* void setMinimizeBlocking (in boolean val); */
NS_IMETHODIMP nsTray::SetMinimizeBlocking(PRBool val)
{
    DEBUG_CALL("SetMinimizeBlocking")
    block_minimize=val;
    return NS_OK;
}

/* void getMinimizeBlocking (out boolean val); */
NS_IMETHODIMP nsTray::GetMinimizeBlocking(PRBool *val)
{
    DEBUG_CALL("GetMinimizeBlocking")
    if(val)*val=this->block_minimize;
    return NS_OK;
}



/* void initNotification(in string appname); */
NS_IMETHODIMP nsTray::InitNotification(const gchar * appName) {
    DEBUG_CALL("initNotification")

	  
// REMOVE NOTIFY 
/*	notify_init(appName);
	sys_notification=notify_notification_new_with_status_icon(
											"FireTray Notification", 
											NULL,
											NULL,
											this->systray_icon);
											
	notify_notification_attach_to_status_icon(sys_notification,
                                              this->systray_icon);
	notify_notification_set_timeout(sys_notification,NS_NOTIFY_TIME);
*/	
	return NS_OK;
}

/* void showANotification(in wstring title, in wstring info,in string image); */
NS_IMETHODIMP nsTray::ShowANotification(const PRUnichar *title,const PRUnichar * info,const gchar *image) {
    DEBUG_CALL("showANotification")

 // REMOVE NOTIFY  	
 /* 	PRUint64 len=PRUstrlen(title);
  	gchar * utf8_title =g_utf16_to_utf8 ((const gunichar2 *)title,len,NULL,NULL,NULL);
  	
  	len=PRUstrlen(info);
  	gchar * utf8_info =g_utf16_to_utf8 ((const gunichar2 *)info,len,NULL,NULL,NULL);

	notify_notification_update(this->sys_notification,
									utf8_title,utf8_info,image);
							
	if(!image)								
		notify_notification_set_icon_from_pixbuf(sys_notification,GDK_PIXBUF(this->special_icon));
	
	notify_notification_show(sys_notification,NULL);

	g_free(utf8_title);  	
  	g_free(utf8_info);*/
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



void DebugATOM(char *msg, Atom atom)
{
  #ifdef DO_DEBUG
  
   CAPTURE_ERRORS()
          
   char *str=XGetAtomName(GDK_DISPLAY(), atom);
   if(str)
     DEBUGSTR(msg << " "<<str)
      
   RELEASE_CAPTURE("BAD ATOM!") 
  
  #endif
}


#define WM_STATE_ELEMENTS 1

unsigned long getWMState (Window w)
{
  DEBUG_CALL("getWMState")
  
  unsigned long state=0; 
  
  Display *display=GDK_DISPLAY();
  Atom property=XInternAtom(display, "WM_STATE", False);
  Atom actual_type;
  int actual_format;
  unsigned long nitems;
  unsigned long bytes_after;
  unsigned char *prop_value;
  
  int res=XGetWindowProperty(display, w, property, 0L, WM_STATE_ELEMENTS, false, property, 
                        &actual_type, &actual_format, &nitems, &bytes_after, 
                        &prop_value);
  
  if( (res==Success) && (actual_type==property) && (nitems==WM_STATE_ELEMENTS) )
  {
     if(prop_value) state=*prop_value;    
  }
  
  if (prop_value)
  {
    XFree ((char *)prop_value);
    prop_value = NULL;
  }

  return state;
} 

bool isIconified(Window w)
{
  DEBUG_CALL("isIconified")
  return (getWMState(w) == IconicState);
}


GdkFilterReturn key_filter_func(GdkXEvent *xevent, GdkEvent *event, gpointer data)
{
   if(!data || !xevent) return GDK_FILTER_CONTINUE;

   XEvent *e=(XEvent *)xevent;
   
   if(e->xany.type!=KeyPress) return GDK_FILTER_CONTINUE;

   XKeyEvent *kev=(XKeyEvent *)e;
   nsTray *tray = (nsTray *)data;   
   PRBool ret = TRUE;

   DEBUGSTR("KEYPRESS EVENT: KEY="<<kev->keycode) 

   KeySym ks=XKeycodeToKeysym (GDK_DISPLAY (), kev->keycode,0);
   if(ks==NoSymbol) return GDK_FILTER_CONTINUE;
   char *str=XKeysymToString(ks);
   if(!str) str="-"; 
   if(tray->key_callback)tray->key_callback->Call(str, kev->keycode, &ret);
              
   return GDK_FILTER_CONTINUE;
}


GdkFilterReturn filter_func(GdkXEvent *xevent, GdkEvent *event, gpointer data)
{
   if(!data || !xevent) return GDK_FILTER_CONTINUE;

   XEvent *e=(XEvent *)xevent;
   nsTray *tray = (nsTray *)data;
   
   Window xwin=e->xany.window;
   window_state *ws;
   
   switch(e->xany.type)  
    {
      case UnmapNotify: 
           if(isIconified(xwin)) 
            {
              FDEBUGSTR("Minimize-Event")
              if(tray) tray->minimizeEvent();                               
            }
           else
              FDEBUGSTR("Unmap-Notify")
           break;   

      case ClientMessage: 

            if(e->xclient.data.l && tray) 
            {
             if((Atom)e->xclient.data.l[0]==delete_window)
             {
                if(tray->closeEvent())
                  return GDK_FILTER_REMOVE; 
             }
            }

            break;
            
     case VisibilityNotify: 
             //FDEBUGSTR("VisibilityNotify-NOTIFY")
             
             //update window visibility state 
             if(tray->handled_windows.count(xwin)>0) 
             {
                ws=tray->handled_windows[xwin]; 
                ws->visibility=e->xvisibility.state; 
                //GdkWindow *win=gdk_window_lookup (xwin);
                //if(win) gdk_window_get_position(win, &(ws->pos_x), &(ws->pos_y));
                  
            //FDEBUGSTR(" UPDATING WS_STATE:"<<e->xvisibility.state)
             }

             break; 
             
      default:       
             break;

    }

   return GDK_FILTER_CONTINUE;
}




void nsTray::minimizeEvent()
{
   DEBUG_CALL("minimizeEvent") 

   PRBool ret = TRUE;    
   if(block_minimize) 
    { 
       FDEBUGSTR("MINIMIZING TO TRAY")

       if(tray_callback) tray_callback->Call(&ret);
       else  FDEBUGSTR("CALLBACK NOT DEFINED")
    }    
}
  

bool nsTray::closeEvent()
{    
   DEBUG_CALL("closeEvent")       
   
   PRBool ret = TRUE;
   if(block_close) 
    { 
       FDEBUGSTR("CLOSE BLOCKING")

       if(tray_callback) tray_callback->Call(&ret);
       else  FDEBUGSTR("CALLBACK NOT DEFINED")
       
       return true;      
    }
    
    return false; //do not block closing
}

/* void setWindowHandler(in nsIBaseWindow aBaseWindow); */
NS_IMETHODIMP nsTray::SetWindowHandler(nsIBaseWindow *aBaseWindow) 
{
    DEBUG_CALL("setWindowHandler")

      nsresult rv;

      NS_ENSURE_ARG_POINTER(aBaseWindow);

      nativeWindow aNativeWindow;
      rv = aBaseWindow->GetParentNativeWindow(&aNativeWindow);
      NS_ENSURE_SUCCESS(rv, rv);

      CAPTURE_ERRORS()

      GdkWindow *gdk_win=gdk_window_get_toplevel((GdkWindow*) aNativeWindow);

      Window xwin=GDK_WINDOW_XID(gdk_win);

/*      PRInt32 x,y;
      aBaseWindow->GetPosition(&x, &y);
      DEBUGSTR("X: "<<x << " Y: "<<y)
      aBaseWindow->GetSize(&x, &y);
      DEBUGSTR("SizeX: "<<x << " SizeY: "<<y)

      
      DEBUGSTR("ADDING HANDLER")
      DEBUGSTR("GDK_WIN: "<< gdk_win << " XWIN: "<<xwin)
      ExploreTree(GDK_WINDOW_XID((GdkWindow*) aNativeWindow));
  
      g_signal_connect(G_OBJECT(gdk_win), "delete-event", G_CALLBACK(delete_event), this);     
      g_signal_connect(G_OBJECT(gdk_win), "destroy", G_CALLBACK(delete_event), this);     
  */  
      if(handled_windows.count(xwin)>0) FDEBUGSTR(">>ALREADY HANDLED")
      else {
        GdkEventMask m=(GdkEventMask)( /*  |*/ /*(GdkEventMask)*/GDK_VISIBILITY_NOTIFY_MASK | (long) gdk_window_get_events (gdk_win)) ;
        
        gdk_window_set_events   (gdk_win, m);

        window_state *ws=new window_state;
        ws->visibility=VisibilityUnobscured;

        handled_windows[xwin]=ws;
        gdk_window_add_filter (gdk_win, filter_func, this);
      }

      RELEASE_CAPTURE("Error setting window handler")

      return NS_OK;
}



/* boolean addHandledKeyCode (in PRUint64 key_code); */
NS_IMETHODIMP nsTray::AddHandledKeyCode(PRUint64 key_code, PRBool *_retval) {
  #ifdef _KEYSYMS_

      CAPTURE_ERRORS()

      KeyCode key=(KeyCode) key_code;

      GdkDisplay *gdkdisplay=gdk_display_get_default();
      
      gint nscr=gdk_display_get_n_screens(gdkdisplay);

      for (int i=0; i<nscr; i++)
      {
         GdkScreen *screen=gdk_display_get_screen(gdkdisplay,i);
         GdkWindow *rootwin=gdk_screen_get_root_window(screen);
         XGrabKey( GDK_DISPLAY() , key, AnyModifier, GDK_WINDOW_XID(rootwin), true, GrabModeAsync, GrabModeAsync);
         gdk_window_add_filter (rootwin, key_filter_func, this);
         DEBUGSTR("ADDED KEY FILTER FOR KEY " << key_code)
      }      

      RELEASE_CAPTURE("Unable to grab key "<< key_code)

  #endif

 return NS_OK;
}

/* boolean addHandledKey (in string key_string); */
NS_IMETHODIMP nsTray::AddHandledKey(const char *key_string, PRBool *_retval) {
    DEBUG_CALL("addHandledKey")
      
#ifdef _KEYSYMS_
      if(!key_string) return NS_OK;

      CAPTURE_ERRORS();

      DEBUGSTR("KEY STRING: "<< key_string)  

      KeySym ksym=getKeySymFromString(key_string); //XStringToKeysym
      DEBUGSTR(ksym);

      if(ksym==NoSymbol) RELEASE_CAPTURE_RETURN("NO_SYMBOL", NS_OK) 

      KeyCode key=XKeysymToKeycode(GDK_DISPLAY(), ksym);
     
      if(!key) RELEASE_CAPTURE_RETURN("NOKEY_CODE",NS_OK)
      
      PRBool ret=true; 

      RELEASE_CAPTURE("Couldn't get grab on key "<< key_string)

      AddHandledKeyCode( (PRUint64)key ,&ret);
#endif

      return NS_OK;
}

/* string getKeycodeString (in PRUint64 key_code); */
NS_IMETHODIMP nsTray::GetKeycodeString(PRUint64 key_code, char **_retval) 
{
    DEBUG_CALL("getKeyCodeString")

    DEBUGSTR("KEY: " << key_code)
    
    char *key_string=NULL;
    KeySym ks=XKeycodeToKeysym (GDK_DISPLAY (), key_code,0);
    if(ks==NoSymbol) key_string="unknown";
    key_string=XKeysymToString(ks);

    DEBUGSTR("KEY: " << key_string)

    if(!_retval) return NS_ERROR_NULL_POINTER;

//    *_retval = (char*) nsMemory::Clone(key_string, sizeof(char)*(strlen(key_string)+1));

    char *tmp = (char*) nsMemory::Alloc(4);//nsMemory::Clone("pippo", 5);
    if(!tmp) DEBUGSTR("CLONE FAILED!!!")

    return *_retval ? NS_OK : NS_ERROR_OUT_OF_MEMORY;
}





/*     boolean getFocusState(in nsIBaseWindow aBaseWindow); */
NS_IMETHODIMP nsTray::GetFocusState(nsIBaseWindow *aBaseWindow, PRBool *_retval) 
{
    DEBUG_CALL("getFocusState")

      *_retval=false;
      nsresult rv;
  
      NS_ENSURE_ARG_POINTER(aBaseWindow);

      nativeWindow aNativeWindow;
      rv = aBaseWindow->GetParentNativeWindow(&aNativeWindow);
      NS_ENSURE_SUCCESS(rv, rv);

      CAPTURE_ERRORS()

      GdkWindow *gdk_win=gdk_window_get_toplevel((GdkWindow*) aNativeWindow);

      //XWindowAttributes res;
   
      Window xwin=GDK_WINDOW_XID(gdk_win);

      window_state *ws=handled_windows[xwin];
      if(ws) 
       { *_retval = ws->visibility == 0; DEBUGSTR(" GOT VIS.STATE")}
      else 
        *_retval = TRUE;
       if(*_retval)DEBUGSTR(" RETVAL: TRUE")
       //else DEBUGSTR(" RETVAL: FALSE")

       
      
//      XGetWindowAttributes(GDK_DISPLAY(), xwin, &res);
      

      DEBUGSTR("MAP-STATE "<<res.map_state)
  

      RELEASE_CAPTURE("Error getting window focus state")    
/*

      GtkWidget *w=(GtkWidget *)get_gtkwindow_from_gdkwindow(gdk_win);

      if(GTK_WIDGET_HAS_FOCUS(w)) *_retval=true;*/

      return NS_OK;
}




/* attribute boolean appStarted; */
NS_IMETHODIMP nsTray::GetAppStarted(PRBool *aAppStarted) 
{
    DEBUG_CALL("getAppStarted")
   if(aAppStarted)*aAppStarted=appStarted;
   else DEBUGSTR("ERROR on boolean value")

   if(appStarted)DEBUGSTR("APP_STARTED=TRUE")
   else DEBUGSTR("APP_STARTED=FALSE")

   return NS_OK;
}

NS_IMETHODIMP nsTray::SetAppStarted(PRBool aAppStarted) 
{
    DEBUG_CALL("setAppStarted")

   if(appStarted)DEBUGSTR("APP_STARTED=TRUE")
   else DEBUGSTR("APP_STARTED=FALSE")

   appStarted=aAppStarted;
   return NS_OK;
}




  /* attribute boolean menuCreated; */
NS_IMETHODIMP nsTray::GetMenuCreated(PRBool *aMenuCreated) 
{
    DEBUG_CALL("getMenuCreated")

  if(aMenuCreated)*aMenuCreated=menuCreated;
   else DEBUGSTR("ERROR on boolean value")

   if(menuCreated)DEBUGSTR("MENU_CREATED=TRUE")
   else DEBUGSTR("MENU_CREATED=FALSE")
  return NS_OK;
}

NS_IMETHODIMP nsTray::SetMenuCreated(PRBool aMenuCreated) 
{
   DEBUG_CALL("setMenuCreated")

   menuCreated=aMenuCreated;

   if(menuCreated)DEBUGSTR("MENU_CREATED=TRUE")
   else DEBUGSTR("MENU_CREATED=FALSE")
   return NS_OK;
}


