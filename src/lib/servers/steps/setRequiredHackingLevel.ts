import * as files from 'lib/utils/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_INFO_BUILDER_PATH,
  serverInfoBuilderGrowthLevelGuard,
} from 'lib/servers/serverInfoBuilder';
import { SET_REQUIRED_HACKING_LEVEL_CALLABLE } from 'lib/servers/steps/models';

export const main = typedMain(SET_REQUIRED_HACKING_LEVEL_CALLABLE, async ({ ns }) => {
  const builder = files.loadJson(ns, SERVER_INFO_BUILDER_PATH, serverInfoBuilderGrowthLevelGuard);
  files.writeJson(ns, SERVER_INFO_BUILDER_PATH, {
    ...builder,
    requiredHackingLevel: ns.getServerRequiredHackingLevel(builder.hostname),
  });
});
