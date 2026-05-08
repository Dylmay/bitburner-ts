import * as files from 'lib/utils/files';
import { typedMain } from 'lib/callables/typedCallable';
import { GET_ANALYTICS_CALLABLE, SERVER_ANALYTICS_PATH, serverAnalyticsGuard } from 'lib/analytics/models';
import { createNiceError } from 'lib/utils/errors';

export const main = typedMain(GET_ANALYTICS_CALLABLE, async ({ ns, outputPort }) => {
  if (!outputPort) {
    throw createNiceError('getAnalytics requires a configured output port');
  }

  const serverAnalytics = files.loadJson(ns, SERVER_ANALYTICS_PATH, serverAnalyticsGuard);

  outputPort.write({ host: serverAnalytics.hostname, serverAnalytics });
});
