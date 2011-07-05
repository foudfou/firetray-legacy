#ifdef GECKO_2
  #include "mozilla/ModuleUtils.h"
#else  // GECKO_2
  #include "nsIGenericFactory.h"
#endif // GECKO_2

#include "nsTray.h"

NS_GENERIC_FACTORY_CONSTRUCTOR(nsTray)

#ifdef GECKO_2

NS_DEFINE_NAMED_CID(NS_ITRAY_CID);

static const mozilla::Module::CIDEntry kTrayCIDs[] = {
    { &kNS_ITRAY_CID, false, NULL, nsTrayConstructor },
    { NULL }
};

static const mozilla::Module::ContractIDEntry kTrayContracts[] = {
    { NS_ITRAY_CONTRACTID, &kNS_ITRAY_CID },
    { NULL }
};

static const mozilla::Module::CategoryEntry kTrayCategories[] = {
    { NULL }
};

static const mozilla::Module kTrayModule = {
    mozilla::Module::kVersion,
    kTrayCIDs,
    kTrayContracts,
    kTrayCategories
};

NSMODULE_DEFN(nsTrayModule) = &kTrayModule;
NS_IMPL_MOZILLA192_NSGETMODULE(&kTrayModule)

#else  // GECKO_2

static nsModuleComponentInfo components[] =
{
    {
       NS_ITRAY_CLASSNAME, 
       NS_ITRAY_CID,
       NS_ITRAY_CONTRACTID,
       nsTrayConstructor,
    }
};

NS_IMPL_NSGETMODULE("nsTrayModule", components)

#endif // GECKO_2