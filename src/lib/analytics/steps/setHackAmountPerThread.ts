import * as files from 'lib/utils/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_ANALYTICS_BUILDER_PATH,
  serverAnalyticsBuilderHackChanceGuard,
} from 'lib/analytics/serverAnalyticsBuilder';
import { SET_HACK_AMOUNT_PER_THREAD_CALLABLE } from 'lib/analytics/steps/models';

export const main = typedMain(SET_HACK_AMOUNT_PER_THREAD_CALLABLE, async ({ ns }) => {
  const builder = files.loadJson(ns, SERVER_ANALYTICS_BUILDER_PATH, serverAnalyticsBuilderHackChanceGuard);

  files.writeJson(ns, SERVER_ANALYTICS_BUILDER_PATH, {
    ...builder,
    hackAmountPerThread: ns.hackAnalyze(builder.hostname),
  });
});
