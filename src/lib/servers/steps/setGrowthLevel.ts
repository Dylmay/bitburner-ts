import * as files from 'lib/utils/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_INFO_BUILDER_PATH,
  serverInfoBuilderBaseSecurityLevelGuard,
} from 'lib/servers/serverInfoBuilder';
import { SET_GROWTH_LEVEL_CALLABLE } from 'lib/servers/steps/models';

export const main = typedMain(SET_GROWTH_LEVEL_CALLABLE, async ({ ns }) => {
  const builder = files.loadJson(
    ns,
    SERVER_INFO_BUILDER_PATH,
    serverInfoBuilderBaseSecurityLevelGuard,
  );
  files.writeJson(ns, SERVER_INFO_BUILDER_PATH, {
    ...builder,
    growthLevel: ns.getServerGrowth(builder.hostname),
  });
});
