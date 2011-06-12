#!/bin/bash

VERSION="0.3.0"
EXTENSION_ID="{9533f794-00b4-4354-aa15-c2bbda6989f8}"
EXTENSION_NAME="FireTray"
HOMEPAGE="http://code.google.com/p/firetray/"
OPTIONS="chrome://firetray/content/options.xul"
ICON="chrome://firetray/content/icon.png"
CREATOR="Hua Luo, Francesco Solero"
DESCRIPTION="A system tray extension for linux"
IFS=""

APP_SEPARATOR=';'

#SUPPORTED APPS:
# "name;id;min.ver;max.ver"
SUPPORTED_APPS=( \
"Mozilla Firefox;{ec8030f7-c20a-464f-9b0e-13a3a9e97384};3.0;5.*" \
"Mozilla Thunderbird;{3550f703-e582-4d05-9a08-453d09bdfdc6};3.0;5.*" \
"Songbird;songbird@songbirdnest.com;0.8;1.8.0" \
"SeaMonkey;{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a};2.0a1;2.0.*   " \
"Sunbird;{718e30fb-e89b-41dd-9da7-e25a45638b28};1.0b1;1.0pre" \
"ChatZilla;{59c81df5-4b7a-477b-912d-4e0fdf64e5f2};0.8;0.9.*" \
)

DEVELOPERS=( "Jared Forsyth" "Glen Winters" )

CONTRIBUTORS=( \
"Simone 'Underpass' " \
"Diego Rodriguez" \
"Dave Bartlett" \
"Bertolotti Pierre" \
"Ziyuan Yao" \
"+Hard -Soft" \
"SparkyBluefang" \
"Corossig" \
"Hicham.Haouari" \
"Jreybert" \
"aedrin" \
)

TRANSLATORS=( \
"Lachezar [bg-BG]" \
"SoftcatalàAljullu,ellibre [ca-AD]" \
"Sam [cz-CZ]" \
"bricks [de-DE]" \
"profediego [es-AR]" \
"chuzo [es-ES]" \
"GµårÐïåñ [fa-IR]" \
"BatBat,Jojaba,nico@nc [fr-FR]" \
"Simone 'Underpass' [it-IT]" \
"drry [ja-JP]" \
"renegade06 [mk-MK]" \
"markh [nl-NL]" \
"Wacław Jacek [pl-PL]" \
"Alberto Eidh [pt-BR]" \
"Quicksilver tears [ru-RU]" \
"lukas_sk [sk-SK]" \
"miles [sl-SL]" \
"Lakrits [sv-SE]" \
"efecan [tr-TR]" \
"Sappa [uk-UA]" \
"xmoke [zh-CN]" \
)

svn info > /dev/null 2> /dev/null
NOT_SVN=$?

SVN_REV=svn-r`svnversion .`

if [ $NOT_SVN -ne 0 ]
then
  SVN_REV="src-build"
fi

EXTENSION_VERSION=$VERSION-$SVN_REV #unofficial build
if [ ${#OFFICIAL_AMO_RELEASE} -gt 0 ] 
then  
  EXTENSION_VERSION=$VERSION  #amo build
else 
  if [ ${#OTHER_DISTRIBUTION_NAME} -gt 0 ]
  then
    EXTENSION_VERSION=$VERSION-$OTHER_DISTRIBUTION_NAME #other official build
  fi
fi



add_field() #  add_field (val, tagname)
{
  if [ -z "$1" ]                       
  then 
     return
  else
     VAL=$1
  fi

  if [ -z "$2" ]                       
  then
     OPEN_TAG=''
     CLOSE_TAG=''
  else
     OPEN_TAG="<$2>"
     CLOSE_TAG="</$2>"
  fi

  echo $3$OPEN_TAG$VAL$CLOSE_TAG
}

extension_info_head()
{
  echo "    <em:id>$EXTENSION_ID</em:id>"
  echo "    <em:version>$EXTENSION_VERSION</em:version>"
  echo "    <em:type>2</em:type>"
  echo "    <em:unpack>true</em:unpack>"
  echo


  echo "    <!-- Front End MetaData -->"
  echo "    <em:name>$EXTENSION_NAME</em:name>"
  echo "    <em:description>$DESCRIPTION</em:description>"
  echo "    <em:creator>$CREATOR</em:creator>"
  echo


  echo "    <em:homepageURL>$HOMEPAGE</em:homepageURL>"
  echo "    <em:optionsURL>$OPTIONS</em:optionsURL>"    
  echo "    <em:iconURL>$ICON</em:iconURL>"  
  echo  


}

supported_apps()
{
  echo       
  echo '    <!-- Target Application this extension can install into, '
  echo '         with minimum and maximum supported versions. --> '

  for l in ${SUPPORTED_APPS[@]}
  do
    OLD_IFS=$IFS
    IFS=$APP_SEPARATOR
    APP=( $l )
    echo
    echo "      <!-- ${APP[0]} -->"
    echo "      <em:targetApplication>"
    echo "        <Description>"
    echo "          <em:id>${APP[1]}</em:id>"
    echo "          <em:minVersion>${APP[2]}</em:minVersion>"
    echo "          <em:maxVersion>${APP[3]}</em:maxVersion>"
    echo "        </Description>"
    echo "      </em:targetApplication>"
    IFS=$OLD_IFS
  done
}

developers()
{
  echo
  for l in ${DEVELOPERS[@]}
  do
    add_field $l "em:developer" "    "
  done  
}

contributors()
{
  echo
  for l in ${CONTRIBUTORS[@]}
  do
    add_field $l "em:contributor" "    "
  done  
}

translators()
{
  echo
  for l in ${TRANSLATORS[@]}
  do
    add_field $l "em:translator" "    "
  done  
}



echo '<?xml version="1.0"?>'
echo
echo '<RDF xmlns="http://www.w3.org/1999/02/22-rdf-syntax-ns#"'
echo '     xmlns:em="http://www.mozilla.org/2004/em-rdf#">'
echo '  <Description about="urn:mozilla:install-manifest">'

extension_info_head
supported_apps
developers
contributors
translators
echo
echo '  </Description>'
echo '</RDF>'

unset IFS


