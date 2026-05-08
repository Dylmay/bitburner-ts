import { typedMain } from 'lib/callables/typedCallable';
import { GROW_MONEY_CALLABLE } from 'lib/hacks/models';
import { createNiceError } from 'lib/utils/errors';

export const main = typedMain(
  GROW_MONEY_CALLABLE,
  async ({ ns, log, localServerInfo, outputPort }, args) => {
    if (!localServerInfo || !outputPort) {
      throw createNiceError('Unable to load local server info');
    }

    const { hostname: localhost } = localServerInfo;

    const target = args?.target ?? localhost;

    log.info('Starting to grow target', ['target', target]);
    while (true) {
      const growAmount = await ns.grow(target);

      outputPort.write({ type: 'grow', growAmount, hostname: localhost });

      log.info('Grown target', ['target', target], ['growAmount', growAmount]);
    }
  },
);
