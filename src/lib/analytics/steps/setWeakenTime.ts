import * as files from 'lib/utils/files/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_ANALYTICS_BUILDER_PATH,
  serverAnalyticsBuilderGrowTimeGuard,
} from 'lib/analytics/serverAnalyticsBuilder';
import { SET_WEAKEN_TIME_CALLABLE } from 'lib/analytics/steps/models';

export const main = typedMain(SET_WEAKEN_TIME_CALLABLE, async ({ ns }) => {
  const builder = files.loadJson(
    ns,
    SERVER_ANALYTICS_BUILDER_PATH,
    serverAnalyticsBuilderGrowTimeGuard,
  );

  files.writeJson(ns, SERVER_ANALYTICS_BUILDER_PATH, {
    ...builder,
    weakenTime: ns.getWeakenTime(builder.hostname),
  });
});
