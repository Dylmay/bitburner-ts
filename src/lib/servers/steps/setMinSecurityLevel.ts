import * as files from 'lib/utils/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_INFO_BUILDER_PATH,
  serverInfoBuilderMaxMoneyGuard,
} from 'lib/servers/serverInfoBuilder';
import { SET_MIN_SECURITY_LEVEL_CALLABLE } from 'lib/servers/steps/models';

export const main = typedMain(SET_MIN_SECURITY_LEVEL_CALLABLE, async ({ ns }) => {
  const builder = files.loadJson(ns, SERVER_INFO_BUILDER_PATH, serverInfoBuilderMaxMoneyGuard);
  files.writeJson(ns, SERVER_INFO_BUILDER_PATH, {
    ...builder,
    minSecurityLevel: ns.getServerMinSecurityLevel(builder.hostname),
  });
});
