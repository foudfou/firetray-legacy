#ifndef _DEBUG_H_
#define _DEBUG_H_

    #include <iostream>
    using namespace std;
    
    #define _SEPARATOR_ " ********************************************************************* "

    #ifdef ENABLE_ERROR_MSG
    #define ERRORMSG(str) {cerr << str << endl; cerr.flush();}
    #else
    #define ERRORMSG(str) {}
    #endif

    #ifdef DO_DEBUG
    #define DEBUGSTR(str) {cerr << str << endl; cerr.flush();}
    #else
    #define DEBUGSTR(str) {}
    #endif


    #ifdef DO_DEBUG_FILTER
    #define FDEBUGSTR(str) {cerr << str << endl; cerr.flush();}
    #else
    #define FDEBUGSTR(str) {}
    #endif


    #ifdef DO_DEBUG_CALLS
    #define DEBUG_CALL(str) {cerr << str << endl; cerr.flush();}
    #else
    #define DEBUG_CALL(str) {}
    #endif

    #define CAPTURE_ERRORS()  gdk_error_trap_push ();
    #define RELEASE_CAPTURE(msg)       { gdk_flush (); if (gdk_error_trap_pop ()) ERRORMSG(msg); }
    #define RELEASE_CAPTURE_RETURN(msg,val)       { gdk_flush (); if (gdk_error_trap_pop ()) { ERRORMSG(msg); return val; } }      

#endif
