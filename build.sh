#!/bin/sh

export GECKO_SDK=/usr/lib/xulrunner-devel-1.9/
export GECKO_SDK_BIN=/usr/lib/xulrunner-devel-1.9/bin/
export GECKO_SDK_INCLUDE=/usr/include/xulrunner-1.9/unstable/ 
export GECKO_SDK_IDL=/usr/share/idl/xulrunner-1.9/unstable
export GECKO_SDK_LIB=/usr/lib/xulrunner-devel-1.9/sdk/lib

FILE=firetray.xpi

rm $FILE
scons $FILE
if [ -e $FILE ] 
then
  #zip $FILE components/libnptray_i386.so
  echo ok
else 
  echo error compiling $FILE
fi
