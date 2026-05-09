import * as files from 'lib/utils/files/files';
import { typedMain } from 'lib/callables/typedCallable';
import { SERVER_ANALYTICS_BUILDER_PATH } from 'lib/analytics/serverAnalyticsBuilder';
import { SET_TARGET_CALLABLE } from 'lib/analytics/steps/models';
import { createNiceError } from 'lib/utils/errors';

export const main = typedMain(SET_TARGET_CALLABLE, async ({ ns }, args) => {
  if (!args?.target) {
    throw createNiceError('setTarget requires a target hostname');
  }

  files.writeJson(ns, SERVER_ANALYTICS_BUILDER_PATH, { hostname: args.target });
});
