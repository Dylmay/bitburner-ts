import * as files from 'lib/utils/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_INFO_BUILDER_PATH,
  serverInfoBuilderMinSecurityLevelGuard,
} from 'lib/servers/serverInfoBuilder';
import { SET_BASE_SECURITY_LEVEL_CALLABLE } from 'lib/servers/steps/models';

export const main = typedMain(SET_BASE_SECURITY_LEVEL_CALLABLE, async ({ ns }) => {
  const builder = files.loadJson(
    ns,
    SERVER_INFO_BUILDER_PATH,
    serverInfoBuilderMinSecurityLevelGuard,
  );
  files.writeJson(ns, SERVER_INFO_BUILDER_PATH, {
    ...builder,
    baseSecurityLevel: ns.getServerBaseSecurityLevel(builder.hostname),
  });
});
