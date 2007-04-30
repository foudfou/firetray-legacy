#ifndef _TRAY_H_
#define _TRAY_H_

#include <gtk/gtk.h>
#include <gdk-pixbuf/gdk-pixbuf.h>

#include "nsITray.h"
#include "nsCOMPtr.h"

#define NS_ITRAY_CONTRACTID "@mozilla.org/FireTray;1"
#define NS_ITRAY_CLASSNAME "System Tray for Firefox"
#define NS_ITRAY_CID  { 0xbf249f85, 0x20f2, 0x49be, { 0x96, 0xf3, 0x96, 0x81, 0xf3, 0xbb, 0x03, 0x34 } }

/* Header file */
class nsTray : public nsITray {
public:
    NS_DECL_ISUPPORTS
    NS_DECL_NSITRAY

    nsTray();

    nsCOMPtr<nsITrayCallback> tray_callback;

private:
    ~nsTray();

protected:
    /* additional members */
    GdkWindow **windowList;
    int windowListCount; 
};

#endif //_TRAY_H_
