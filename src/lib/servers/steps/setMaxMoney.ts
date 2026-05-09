import * as files from 'lib/utils/files/files';
import { typedMain } from 'lib/callables/typedCallable';
import { SERVER_INFO_BUILDER_PATH, serverInfoBuilderRamGuard } from 'lib/servers/serverInfoBuilder';
import { SET_MAX_MONEY_CALLABLE } from 'lib/servers/steps/models';

export const main = typedMain(SET_MAX_MONEY_CALLABLE, async ({ ns }, args) => {
  const builderPath = args?.outputPath ?? SERVER_INFO_BUILDER_PATH;

  const builder = files.loadJson(ns, builderPath, serverInfoBuilderRamGuard);

  files.writeJson(ns, builderPath, {
    ...builder,
    maxMoney: ns.getServerMaxMoney(builder.hostname),
  });
});
