import * as files from 'lib/utils/files/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_INFO_BUILDER_PATH,
  unstableServerInfoBuilderSecurityLevelGuard,
} from 'lib/servers/serverInfoBuilder';
import { HAS_ROOT_ACCESS_CALLABLE } from 'lib/servers/steps/models';

export const main = typedMain(HAS_ROOT_ACCESS_CALLABLE, async ({ ns }, args) => {
  const builderPath = args?.outputPath ?? SERVER_INFO_BUILDER_PATH;

  const builder = files.loadJson(ns, builderPath, unstableServerInfoBuilderSecurityLevelGuard);
  files.writeJson(ns, builderPath, {
    ...builder,
    unstable: {
      ...builder.unstable,
      hasRootAccess: ns.hasRootAccess(builder.hostname),
    },
  });
});
