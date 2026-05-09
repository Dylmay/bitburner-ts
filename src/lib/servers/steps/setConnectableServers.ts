import * as files from 'lib/utils/files/files';
import { typedMain } from 'lib/callables/typedCallable';
import { SERVER_INFO_BUILDER_PATH, serverInfoBuilderRamGuard } from 'lib/servers/serverInfoBuilder';
import { SET_CONNECTABLE_SERVERS_CALLABLE } from 'lib/servers/steps/models';

export const main = typedMain(SET_CONNECTABLE_SERVERS_CALLABLE, async ({ ns }) => {
  const builder = files.loadJson(ns, SERVER_INFO_BUILDER_PATH, serverInfoBuilderRamGuard);
  files.writeJson(ns, SERVER_INFO_BUILDER_PATH, {
    ...builder,
    connectableServers: ns.scan(builder.hostname),
  });
});
