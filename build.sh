#!/bin/sh

export GECKO_SDK=/usr/lib/xulrunner-devel-1.9.1/
export GECKO_SDK_BIN=/usr/lib/xulrunner-devel-1.9.1/bin/
export GECKO_SDK_INCLUDE=/usr/lib/xulrunner-devel-1.9.1/include/
export GECKO_SDK_IDL=/usr/lib/xulrunner-devel-1.9.1/idl/
export GECKO_SDK_LIB=/usr/lib/xulrunner-devel-1.9.1/lib/

FILE=firetray.xpi

rm $FILE
scons $FILE
if [ -e $FILE ] 
then

  echo ok
else 
  echo error compiling $FILE
fi
