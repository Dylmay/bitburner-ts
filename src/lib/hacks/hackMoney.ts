import { typedMain } from 'lib/callables/typedCallable';
import { HACK_MONEY_CALLABLE } from 'lib/hacks/models';
import { createNiceError } from 'lib/utils/errors';

export const main = typedMain(
  HACK_MONEY_CALLABLE,
  async ({ ns, log, localServerInfo, outputPort }, args) => {
    if (!localServerInfo || !outputPort) {
      throw createNiceError('No local server info provided');
    }
    const { hostname: localhost } = localServerInfo;

    const target = args?.target ?? localhost;

    log.info('Starting to hack target', ['target', target]);
    while (true) {
      const hackAmount = await ns.hack(target);

      outputPort.write({ type: 'hack', hackAmount, hostname: localhost });

      log.info('Hacked target', ['target', target], ['hackAmount', hackAmount]);
    }
  },
);
