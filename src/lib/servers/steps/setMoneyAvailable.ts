import * as files from 'lib/utils/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_INFO_BUILDER_PATH,
  unstableServerInfoBuilderFilesGuard,
} from 'lib/servers/serverInfoBuilder';
import { SET_MONEY_AVAILABLE_CALLABLE } from 'lib/servers/steps/models';

export const main = typedMain(SET_MONEY_AVAILABLE_CALLABLE, async ({ ns }) => {
  const builder = files.loadJson(ns, SERVER_INFO_BUILDER_PATH, unstableServerInfoBuilderFilesGuard);
  files.writeJson(ns, SERVER_INFO_BUILDER_PATH, {
    ...builder,
    unstable: {
      ...builder.unstable,
      moneyAvailable: ns.getServerMoneyAvailable(builder.hostname),
    },
  });
});
