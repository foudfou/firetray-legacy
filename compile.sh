#!/bin/sh

#export GECKO_SDK=/Temp/FireTray_Dev/xulrunner-sdk/sdk/ 
export GECKO_SDK=/usr/lib/xulrunner-devel-1.9.0.1/
export GECKO_SDK_BIN=/usr/lib/xulrunner-devel-1.9.0.1/bin/
export GECKO_SDK_INCLUDE=/usr/include/xulrunner-1.9.0.1/unstable/ 
export GECKO_SDK_IDL=/usr/share/idl/xulrunner-1.9.0.1/unstable
export GECKO_SDK_LIB=/usr/lib/xulrunner-devel-1.9.0.1/sdk/lib

FILE=firetray.xpi

rm $FILE
scons $FILE
if [ -e $FILE ] 
then
  echo ok
else 
  echo error compiling $FILE
fi