import * as files from 'lib/utils/files/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_INFO_BUILDER_PATH,
  serverInfoBuilderGrowthLevelGuard,
} from 'lib/servers/serverInfoBuilder';
import { SET_REQUIRED_HACKING_LEVEL_CALLABLE } from 'lib/servers/steps/models';

export const main = typedMain(SET_REQUIRED_HACKING_LEVEL_CALLABLE, async ({ ns }, args) => {
  const builderPath = args?.outputPath ?? SERVER_INFO_BUILDER_PATH;

  const builder = files.loadJson(ns, builderPath, serverInfoBuilderGrowthLevelGuard);
  files.writeJson(ns, builderPath, {
    ...builder,
    requiredHackingLevel: ns.getServerRequiredHackingLevel(builder.hostname),
  });
});
