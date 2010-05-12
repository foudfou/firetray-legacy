#ifndef _DEBUG_H_
#define _DEBUG_H_

    #include <iostream>
    using namespace std;


    #define ENABLE_ERROR_MSG 1       //enable error messages
    //#define DO_DEBUG 1             //enable generic debug messages	
    //#define DO_DEBUG_FILTER 1      //enable window events filter debug messages
    //#define DO_DEBUG_CALLS 1       //enable function calls debug messages

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




#endif
