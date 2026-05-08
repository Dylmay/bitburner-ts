import { typedMain } from 'lib/callables/typedCallable';
import { execCallableAndWait } from 'lib/callables/execAndWait';
import { PortHandle } from 'lib/utils/ports';
import { createNiceError } from 'lib/utils/errors';
import { SET_TARGET_CALLABLE, BUILD_ANALYTICS_STEPS } from 'lib/analytics/steps/models';
import { COLLECT_ANALYTICS_CALLABLE } from 'bin/commands/analytics/models';
import { GET_ANALYTICS_CALLABLE } from 'lib/analytics/models';

export const main = typedMain(
  COLLECT_ANALYTICS_CALLABLE,
  async ({ ns, log, localServerInfo }, args) => {
    if (!args?.target) {
      throw createNiceError('collectAnalytics requires a target hostname');
    }

    const donorHost = args.donorHost ? args.donorHost : localServerInfo?.hostname;

    if (!donorHost) {
      throw createNiceError('No donor host provided and no local server info');
    }

    log.info('Collecting analytics', ['target', args.target], ['donorHost', donorHost ?? 'local']);

    const setTarget = await execCallableAndWait({
      ns,
      log,
      callableDefinition: SET_TARGET_CALLABLE,
      hostname: donorHost,
      args: { target: args.target },
    });

    if (!setTarget) {
      throw createNiceError(
        'Failed to set target, aborting analytics collection',
        ['target', args.target],
        ['donorHost', donorHost],
      );
    }

    for (const step of BUILD_ANALYTICS_STEPS) {
      const completed = await execCallableAndWait({
        ns,
        log,
        callableDefinition: step,
        hostname: donorHost,
      });

      if (!completed) {
        throw createNiceError('Analytics step failed, aborting', ['step', step.scriptPath]);
      }
    }

    const completed = await execCallableAndWait({
      ns,
      log,
      callableDefinition: GET_ANALYTICS_CALLABLE,
      hostname: donorHost,
    });

    if (!completed) {
      throw createNiceError(
        'Failed to read assembled analytics',
        ['target', args.target],
        ['donorHost', donorHost],
      );
    }

    const analyticsPort = PortHandle.connectToPort(ns, GET_ANALYTICS_CALLABLE.outputPort!);
    const analyticsData = await analyticsPort.awaitRead();

    // log.info('Wrote analytics data to file', ['port', outputPort.getPort()]);
    ns.alert('' + JSON.stringify(analyticsData, undefined, 2));
  },
);
