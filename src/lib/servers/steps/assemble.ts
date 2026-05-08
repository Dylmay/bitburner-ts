import * as files from 'lib/utils/files';
import { typedMain } from 'lib/callables/typedCallable';
import { SERVER_INFO_BUILDER_PATH } from 'lib/servers/serverInfoBuilder';
import { SERVER_INFO_PATH, serverInfoGuard, type ServerInfo } from 'lib/servers/models';
import { ASSEMBLE_CALLABLE } from 'lib/servers/steps/models';

export const main = typedMain(ASSEMBLE_CALLABLE, async ({ ns }) => {
  const builder = files.loadJson(ns, SERVER_INFO_BUILDER_PATH, serverInfoGuard);

  const serverInfo: ServerInfo = {
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
    },
  };

  files.writeJson(ns, SERVER_INFO_PATH, serverInfo);
});
