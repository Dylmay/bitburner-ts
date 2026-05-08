import * as files from 'lib/utils/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_ANALYTICS_BUILDER_PATH,
  serverAnalyticsBuilderHackTimeGuard,
} from 'lib/analytics/serverAnalyticsBuilder';
import { SET_GROW_TIME_CALLABLE } from 'lib/analytics/steps/models';

export const main = typedMain(SET_GROW_TIME_CALLABLE, async ({ ns }) => {
  const builder = files.loadJson(ns, SERVER_ANALYTICS_BUILDER_PATH, serverAnalyticsBuilderHackTimeGuard);

  files.writeJson(ns, SERVER_ANALYTICS_BUILDER_PATH, {
    ...builder,
    growTime: ns.getGrowTime(builder.hostname),
  });
});
