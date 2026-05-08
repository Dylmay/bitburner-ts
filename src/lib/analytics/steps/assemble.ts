import * as files from 'lib/utils/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_ANALYTICS_BUILDER_PATH,
  completeServerAnalyticsBuilderGuard,
} from 'lib/analytics/serverAnalyticsBuilder';
import { ASSEMBLE_ANALYTICS_CALLABLE } from 'lib/analytics/steps/models';
import { SERVER_ANALYTICS_PATH, type ServerAnalytics } from 'lib/analytics/models';

export const main = typedMain(ASSEMBLE_ANALYTICS_CALLABLE, async ({ ns }) => {
  const builder = files.loadJson(ns, SERVER_ANALYTICS_BUILDER_PATH, completeServerAnalyticsBuilderGuard);

  const serverAnalytics: ServerAnalytics = {
    hostname: builder.hostname,
    hackChance: builder.hackChance,
    hackAmountPerThread: builder.hackAmountPerThread,
    hackTime: builder.hackTime,
    growTime: builder.growTime,
    weakenTime: builder.weakenTime,
    requiredHackingLevel: builder.requiredHackingLevel,
  };

  files.writeJson(ns, SERVER_ANALYTICS_PATH, serverAnalytics);
});
