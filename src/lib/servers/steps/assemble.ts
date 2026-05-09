import * as files from 'lib/utils/files/files';
import { typedMain } from 'lib/callables/typedCallable';
import { SERVER_INFO_BUILDER_PATH } from 'lib/servers/serverInfoBuilder';
import { SERVER_INFO_STORE, serverInfoGuard } from 'lib/servers/models';
import { ASSEMBLE_CALLABLE } from 'lib/servers/steps/models';
import { Store } from 'lib/stores/store';

export const main = typedMain(ASSEMBLE_CALLABLE, async ({ ns }) => {
  // TODO(dmayor): This can easily break with the builder
  const builder = files.loadJson(ns, SERVER_INFO_BUILDER_PATH, serverInfoGuard);

  Store.openStore(ns, SERVER_INFO_STORE).write({
    hostname: builder.hostname,
    ram: builder.ram,
    connectableServers: builder.connectableServers,
    maxMoney: builder.maxMoney,
    minSecurityLevel: builder.minSecurityLevel,
    baseSecurityLevel: builder.baseSecurityLevel,
    growthLevel: builder.growthLevel,
    requiredHackingLevel: builder.requiredHackingLevel,
    ip: builder.ip,
    unstable: {
      files: builder.unstable.files,
      moneyAvailable: builder.unstable.moneyAvailable,
      securityLevel: builder.unstable.securityLevel,
      hasRootAccess: builder.unstable.hasRootAccess,
    },
  });
});
