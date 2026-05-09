import * as files from 'lib/utils/files/files';
import { typedMain } from 'lib/callables/typedCallable';
import {
  SERVER_ANALYTICS_BUILDER_PATH,
  serverAnalyticsBuilderTargetGuard,
} from 'lib/analytics/serverAnalyticsBuilder';
import { SET_HACK_CHANCE_CALLABLE } from 'lib/analytics/steps/models';

export const main = typedMain(SET_HACK_CHANCE_CALLABLE, async ({ ns }) => {
  const builder = files.loadJson(
    ns,
    SERVER_ANALYTICS_BUILDER_PATH,
    serverAnalyticsBuilderTargetGuard,
  );

  files.writeJson(ns, SERVER_ANALYTICS_BUILDER_PATH, {
    ...builder,
    hackChance: ns.hackAnalyzeChance(builder.hostname),
  });
});
