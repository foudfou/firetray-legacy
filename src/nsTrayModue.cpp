#include "nsIGenericFactory.h"
#include "nsTray.h"

NS_GENERIC_FACTORY_CONSTRUCTOR(nsTray)

static nsModuleComponentInfo components[] =
{
    {
       NS_ITRAY_CLASSNAME, 
       NS_ITRAY_CID,
       NS_ITRAY_CONTRACTID,
       nsTrayConstructor,
    }
};

NS_IMPL_NSGETMODULE("nsTrayMoudle", components)
