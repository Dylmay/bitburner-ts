import * as files from 'lib/utils/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_ANALYTICS_BUILDER_PATH,
  serverAnalyticsBuilderWeakenTimeGuard,
} from 'lib/analytics/serverAnalyticsBuilder';
import { SET_REQUIRED_HACKING_LEVEL_CALLABLE } from 'lib/analytics/steps/models';

export const main = typedMain(SET_REQUIRED_HACKING_LEVEL_CALLABLE, async ({ ns }) => {
  const builder = files.loadJson(ns, SERVER_ANALYTICS_BUILDER_PATH, serverAnalyticsBuilderWeakenTimeGuard);

  files.writeJson(ns, SERVER_ANALYTICS_BUILDER_PATH, {
    ...builder,
    requiredHackingLevel: ns.getServerRequiredHackingLevel(builder.hostname),
  });
});
