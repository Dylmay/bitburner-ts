import * as files from 'lib/utils/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_INFO_BUILDER_PATH,
  serverInfoBuilderRequiredHackingLevelGuard,
} from 'lib/servers/serverInfoBuilder';
import { SET_IP_CALLABLE } from 'lib/servers/steps/models';

export const main = typedMain(SET_IP_CALLABLE, async ({ ns }) => {
  const builder = files.loadJson(
    ns,
    SERVER_INFO_BUILDER_PATH,
    serverInfoBuilderRequiredHackingLevelGuard,
  );
  files.writeJson(ns, SERVER_INFO_BUILDER_PATH, {
    ...builder,
    ip: ns.getIP(),
  });
});
