import * as files from 'lib/utils/files/files';
import { typedMain } from 'lib/callables/typedCallable';
import { SERVER_INFO_BUILDER_PATH } from 'lib/servers/serverInfoBuilder';
import { SET_HOSTNAME_CALLABLE } from 'lib/servers/steps/models';

export const main = typedMain(SET_HOSTNAME_CALLABLE, async ({ ns }, args) => {
  const builderPath = args?.outputPath ?? SERVER_INFO_BUILDER_PATH;

  files.writeJson(ns, builderPath, { hostname: ns.getHostname() });
});
