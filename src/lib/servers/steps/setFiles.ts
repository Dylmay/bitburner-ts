import * as files from 'lib/utils/files/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_INFO_BUILDER_PATH,
  serverInfoBuilderMinSecurityLevelGuard,
} from 'lib/servers/serverInfoBuilder';
import { SET_FILES_CALLABLE } from 'lib/servers/steps/models';

export const main = typedMain(SET_FILES_CALLABLE, async ({ ns }) => {
  const builder = files.loadJson(
    ns,
    SERVER_INFO_BUILDER_PATH,
    serverInfoBuilderMinSecurityLevelGuard,
  );
  files.writeJson(ns, SERVER_INFO_BUILDER_PATH, {
    ...builder,
    unstable: {
      files: ns.ls(builder.hostname),
    },
  });
});
