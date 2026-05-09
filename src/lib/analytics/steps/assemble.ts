import * as files from 'lib/utils/files/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_ANALYTICS_BUILDER_PATH,
  completeServerAnalyticsBuilderGuard,
} from 'lib/analytics/serverAnalyticsBuilder';
import { ASSEMBLE_ANALYTICS_CALLABLE } from 'lib/analytics/steps/models';
import { SERVER_ANALYTICS_STORE } from 'lib/analytics/models';
import { Store } from 'lib/stores/store';

export const main = typedMain(ASSEMBLE_ANALYTICS_CALLABLE, async ({ ns }) => {
  const builder = files.loadJson(
    ns,
    SERVER_ANALYTICS_BUILDER_PATH,
    completeServerAnalyticsBuilderGuard,
  );

  const analyticsStore = Store.openStore(ns, SERVER_ANALYTICS_STORE);

  analyticsStore.write({
    hostname: builder.hostname,
    hackChance: builder.hackChance,
    hackAmountPerThread: builder.hackAmountPerThread,
    hackTime: builder.hackTime,
    growTime: builder.growTime,
    weakenTime: builder.weakenTime,
    requiredHackingLevel: builder.requiredHackingLevel,
  });
});
