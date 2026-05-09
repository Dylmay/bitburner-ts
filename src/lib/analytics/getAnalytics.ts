import { typedMain } from 'lib/callables/typedCallable';
import { GET_ANALYTICS_CALLABLE, SERVER_ANALYTICS_STORE } from 'lib/analytics/models';
import { createNiceError } from 'lib/utils/errors';
import { Store } from 'lib/stores/store';

export const main = typedMain(GET_ANALYTICS_CALLABLE, async ({ ns, outputPort }) => {
  if (!outputPort) {
    throw createNiceError('getAnalytics requires a configured output port');
  }

  const serverAnalytics = Store.openStore(ns, SERVER_ANALYTICS_STORE).load();

  outputPort.write({ host: serverAnalytics.hostname, serverAnalytics });
});
