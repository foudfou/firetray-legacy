#!/bin/sh

VER=1.9.0.11

export GECKO_SDK=/usr/lib/xulrunner-devel-$VER/
export GECKO_SDK_BIN=/usr/lib/xulrunner-devel-$VER/bin/
export GECKO_SDK_INCLUDE=/usr/include/xulrunner-$VER/unstable/ 
export GECKO_SDK_IDL=/usr/share/idl/xulrunner-$VER/unstable
export GECKO_SDK_LIB=/usr/lib/xulrunner-devel-$VER/sdk/lib

cd components

COMPILED_LIB=libnptray.so
I386_LIB=libnptray_i386.so

rm *.os

rm $COMPILED_LIB
rm $I386_LIB

scons -f SConscript

if [ -e $COMPILED_LIB ] 
then
  mv $COMPILED_LIB $I386_LIB
  echo ok
else 
  echo error compiling $COMPILED_LIB
fi

rm *.os
