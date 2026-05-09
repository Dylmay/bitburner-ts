import * as files from 'lib/utils/files/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_INFO_BUILDER_PATH,
  serverInfoBuilderMaxMoneyGuard,
} from 'lib/servers/serverInfoBuilder';
import { SET_MIN_SECURITY_LEVEL_CALLABLE } from 'lib/servers/steps/models';

export const main = typedMain(SET_MIN_SECURITY_LEVEL_CALLABLE, async ({ ns }, args) => {
  const builderPath = args?.outputPath ?? SERVER_INFO_BUILDER_PATH;

  const builder = files.loadJson(ns, builderPath, serverInfoBuilderMaxMoneyGuard);
  files.writeJson(ns, builderPath, {
    ...builder,
    minSecurityLevel: ns.getServerMinSecurityLevel(builder.hostname),
  });
});
