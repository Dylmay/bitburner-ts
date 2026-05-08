import { typedMain } from 'lib/callables/typedCallable';
import { WEAKEN_SECURITY_CALLABLE } from 'lib/hacks/models';
import { createNiceError } from 'lib/utils/errors';

export const main = typedMain(
  WEAKEN_SECURITY_CALLABLE,
  async ({ ns, log, localServerInfo, outputPort }, args) => {
    if (!localServerInfo || !outputPort) {
      throw createNiceError('No server info provided');
    }

    const { hostname: localhost } = localServerInfo;

    const target = args?.target ?? localhost;

    log.info('Starting to weaken target', ['target', target]);
    while (true) {
      const weakenAmount = await ns.weaken(target);

      log.info('Weakened target', ['target', target], ['weakenAmount', weakenAmount]);
    }
  },
);
