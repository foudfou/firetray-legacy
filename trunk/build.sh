#!/bin/bash

FIRETRAY_ID="{9533f794-00b4-4354-aa15-c2bbda6989f8}"


prepare_options_header_file()
{
  echo "******************************"
  echo " TRAY COMPONENT BUILD OPTIONS"
  echo "******************************"

  DEST="components/options.h"
  echo "// OPTIONS.H - dinamically generated by build script " > $DEST
  echo "#ifndef _OPTIONS_H_" >> $DEST
  echo "#define _OPTIONS_H_" >> $DEST
  echo ""  >> $DEST

  if [ -z "$NO_ERROR_MESSAGES" ] 
  then
   echo "ERROR MESSAGES: on"
   echo "#define ENABLE_ERROR_MSG 1       //enable error messages"  >> $DEST
  else
   echo "ERROR MESSAGES: off"
  fi

  if [ -n "$ENABLE_DEBUG" ] 
  then
   echo "DEBUG MESSAGES: on"
   echo "#define DO_DEBUG 1             //enable generic debug messages"  >> $DEST
  else
   echo "DEBUG MESSAGES: off"

  fi

  if [ -n "$ENABLE_DEBUG_FILTERS" ] 
  then
    echo "DEBUG EVENT FILTERS: on"
    echo "#define DO_DEBUG_FILTER 1      //enable window events filter debug messages"  >> $DEST
  else
    echo "DEBUG EVENT FILTERS: off"
  fi 
 
  if [ -n "$ENABLE_DEBUG_CALLS" ] 
  then
    echo "DEBUG FUNCTION CALLS: on"
    echo "#define DO_DEBUG_CALLS 1       //enable function calls debug messages"  >> $DEST
  else
    echo "DEBUG FUNCTION CALLS: off"
  fi
 
  echo ""  >> $DEST

  if [ -z "$DISABLE_RESTORE_POSITION" ] 
  then
    echo "REMEMBER WINDOWS POSITION: on"
    echo "#define _REMEMBER_POSITION_"  >> $DEST
  else
    echo "REMEMBER WINDOWS POSITION: off"
  fi

  if [ -n "$DISABLE_UPDATE_MENU_LABELS" ] 
  then
    echo "MENU LABELS UPDATE DISABLED"
  else
    echo "#define __GTK_SET_LABEL__"  >> $DEST
  fi

  echo "#define _KEYSYMS_"  >> $DEST
  echo ""  >> $DEST
  echo "#endif"  >> $DEST
}

prepare_source()
{
  rm source.zip
  for f in `find | grep -v "\.svn" | grep -v "~" | grep -v "\.xpi"`
  do
    zip source.zip $f
  done
}

show_options()
{
  echo " "   
  echo "options:"
  echo " "   
  echo "    --official-amo-release    set version number for official AMO release"
  echo "    --release-name=suffix     set version number for other non testing release"
  echo ""
  echo "    --gecko-sdk=folder        Manually specify gecko-sdk path "
  echo "    --output-dir=folder       Install extension files to the selected folder "
  echo "    --dynamic-linking         Do not use static linking of libraries "
  echo " "   
  echo "    --no-restore-positions    Disable saving window postion"  
  echo "    --with-old-gtklib         Disable the use of functions introduced in gtk 2.16"
  echo " "   
  echo "    --gecko19-compat          Enable Gecko 1.9.x compatability when building"
  echo "                              with Gecko 2.0"
  echo " "    
  echo "    --no-error-messages       Disable error messages"
  echo "    --enable-debug            Enable general debug messages"
  echo "    --debug-filters           Enable event filters debugging"
  echo "    --debug-calls             Enable function calls debugging"
  echo "    --debug-all               Enable all debugging messages"
  echo " "   
  echo "    --source-package          Create a zip file containing the source code"
  exit
}
#SEP="--------------------------------------------------"



for param in "$@"
do
    paramval=`echo $param | sed 's/[-a-zA-Z0-9]*=//'`
    
    case $param in

        --source-package)
          prepare_source
          exit
          ;;

        --official-amo-release)
          export OFFICIAL_AMO_RELEASE="yes"
          ;;

        --release-name=*)
          export OTHER_DISTRIBUTION_NAME="$paramval"
          ;;

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

        --gecko19-compat)
          export GECKO_19_COMPAT="on"
          ;;

        --dynamic-linking)
          export DYNAMIC_LINKING="dyn"
          ;;

        --no-error-messages)
          NO_ERROR_MESSAGES="on"
          ;;

        --enable-debug)
          ENABLE_DEBUG="on"
          ;;

        --debug-filters)
          ENABLE_DEBUG_FILTERS="on"
          ;;

        --debug-calls)
          ENABLE_DEBUG_CALLS="on"
          ;;

        --debug-all)
          ENABLE_DEBUG="on"
          ENABLE_DEBUG_FILTERS="on"
          ENABLE_DEBUG_CALLS="on"
          ;;

        --no-restore-positions)
          DISABLE_RESTORE_POSITION="on"
          ;;

        --with-old-gtklib)
          DISABLE_UPDATE_MENU_LABELS="on"
          ;;

        -h|--help)
          show_options  
          ;;

        *)
          echo
          echo Unknown option: $param
          show_options 
          ;;

    esac
done

rm -f -r dist

if [ -z "$GECKO_SDK" ] 
then
   #echo sdk_not_set
   export GECKO_SDK=$(pkg-config libxul --variable=sdkdir)
fi

export LIB_ARCH=_`uname -m`




rm install.rdf
source ./generate_install_rdf.sh > install.rdf

FILE=firetray.xpi
DESTFILE=firetray-$EXTENSION_VERSION.xpi

prepare_options_header_file

echo
echo $SEP
echo

rm $FILE 2> /dev/null
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

  echo Extension packaged as: $DESTFILE
  mv $FILE $DESTFILE
  
  
else 
  echo error compiling $FILE
  exit 1
fi

