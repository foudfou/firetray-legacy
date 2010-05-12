#!/bin/sh

FIRETRAY_ID="{9533f794-00b4-4354-aa15-c2bbda6989f8}"

VERSION=`cat install.rdf | grep em:version | sed '*<em:version'`

for param in "$@"
do
    paramval=`echo $param | sed 's/[-a-zA-Z0-9]*=//'`
    
    case $param in
        --output-dir=*)
          OUTPUT_FOLDER="$paramval"
          ;;

        --gecko-sdk=*)
          export GECKO_SDK="$paramval"
          ;;

        --gecko-sdk-bin=*)
          export GECKO_SDK_BIN="$paramval"
          ;;

        --gecko-sdk-include=*)
          export GECKO_SDK_INCLUDE="$paramval"
          ;;

        --gecko-sdk-idl=*)
          export GECKO_SDK_IDL="$paramval"
          ;;

        --gecko-sdk-lib=*)
          export GECKO_SDK_LIB="$paramval"
          ;;

        --dynamic-linking)
          export DYNAMIC_LINKING="dyn"
          ;;

        -h|--help)
        
          echo "options:"
          echo "    --gecko-sdk=folder        Manually specify gecko-sdk path "
          echo "    --output-dir=folder       Install extension files to the selected folder "
          echo "    --dynamic-linking         Do not use static linking of libraries "

          exit
          ;;

        *)
          echo Unknown option: $param
          ;;

    esac
done

if [ -z "$GECKO_SDK" ] 
then
   echo sdk_not_set
   export GECKO_SDK=$(pkg-config libxul --variable=sdkdir)
fi

export LIB_ARCH=_`uname -m`

FILE=firetray.xpi

rm $FILE
scons $FILE
if [ -e $FILE ] 
then
  zip $FILE components/libnptray*.so
  
  if [ ! -z "$OUTPUT_FOLDER" ] 
  then
     DEST_DIR="$OUTPUT_FOLDER/$FIRETRAY_ID/"
     mkdir -p $DEST_DIR
     if [ -d "$DEST_DIR" ]
     then
        rm $FILE

        unzip $FILE -d $DEST_DIR
        
        if [ $? -eq 0 ] 
        then 
          echo ok
        else
          exit 1
        fi
     else
        exit 1
     fi
  fi
  
else 
  echo error compiling $FILE
  exit 1
fi
