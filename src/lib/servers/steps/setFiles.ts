import * as files from 'lib/utils/files/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_INFO_BUILDER_PATH,
  serverInfoBuilderMinSecurityLevelGuard,
} from 'lib/servers/serverInfoBuilder';
import { SET_FILES_CALLABLE } from 'lib/servers/steps/models';

export const main = typedMain(SET_FILES_CALLABLE, async ({ ns }, args) => {
  const builderPath = args?.outputPath ?? SERVER_INFO_BUILDER_PATH;

  const builder = files.loadJson(ns, builderPath, serverInfoBuilderMinSecurityLevelGuard);
  files.writeJson(ns, builderPath, {
    ...builder,
    unstable: {
      files: ns.ls(builder.hostname),
    },
  });
});
