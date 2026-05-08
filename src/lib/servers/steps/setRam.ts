import * as files from 'lib/utils/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_INFO_BUILDER_PATH,
  serverInfoBuilderHostnameGuard,
} from 'lib/servers/serverInfoBuilder';
import { SET_RAM_CALLABLE } from 'lib/servers/steps/models';

export const main = typedMain(SET_RAM_CALLABLE, async ({ ns }) => {
  const builder = files.loadJson(ns, SERVER_INFO_BUILDER_PATH, serverInfoBuilderHostnameGuard);
  files.writeJson(ns, SERVER_INFO_BUILDER_PATH, {
    ...builder,
    ram: ns.getServerMaxRam(builder.hostname),
  });
});
