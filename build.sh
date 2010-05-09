#!/bin/sh

export GECKO_SDK=$(pkg-config libxul --variable=sdkdir)
export GECKO_SDK_BIN=$GECKO_SDK/bin/
export GECKO_SDK_INCLUDE=$GECKO_SDK/include/
export GECKO_SDK_IDL=$GECKO_SDK/idl/
export GECKO_SDK_LIB=$GECKO_SDK/lib/

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
