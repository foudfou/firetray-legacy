#!/bin/sh

export GECKO_SDK=/usr/lib/xulrunner-devel-1.9.0.19/
export GECKO_SDK_BIN=/usr/lib/xulrunner-devel-1.9.0.19/bin/
export GECKO_SDK_INCLUDE=/usr/lib/xulrunner-devel-1.9.0.19/include/
export GECKO_SDK_IDL=/usr/lib/xulrunner-devel-1.9.0.19/idl/
export GECKO_SDK_LIB=/usr/lib/xulrunner-devel-1.9.0.19/lib/

export LIB_ARCH=_`uname -m`

FILE=firetray.xpi

rm $FILE
scons $FILE
if [ -e $FILE ] 
then
  zip $FILE components/libnptray*.so
  echo ok
else 
  echo error compiling $FILE
fi
