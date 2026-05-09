import * as files from 'lib/utils/files/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_INFO_BUILDER_PATH,
  serverInfoBuilderRequiredHackingLevelGuard,
} from 'lib/servers/serverInfoBuilder';
import { SET_IP_CALLABLE } from 'lib/servers/steps/models';

export const main = typedMain(SET_IP_CALLABLE, async ({ ns }, args) => {
  const builderPath = args?.outputPath ?? SERVER_INFO_BUILDER_PATH;

  const builder = files.loadJson(ns, builderPath, serverInfoBuilderRequiredHackingLevelGuard);
  files.writeJson(ns, builderPath, {
    ...builder,
    ip: ns.getIP(),
  });
});
