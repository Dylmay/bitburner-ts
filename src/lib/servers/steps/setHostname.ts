import * as files from 'lib/utils/files';
import { typedMain } from 'lib/callables/typedCallable';
import { SERVER_INFO_BUILDER_PATH } from 'lib/servers/serverInfoBuilder';
import { SET_HOSTNAME_CALLABLE } from 'lib/servers/steps/models';

export const main = typedMain(SET_HOSTNAME_CALLABLE, async ({ ns }) =>
  files.writeJson(ns, SERVER_INFO_BUILDER_PATH, { hostname: ns.getHostname() }),
);
