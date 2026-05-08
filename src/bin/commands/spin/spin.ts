import { AnyCallableDefinition, typedMain } from 'lib/callables/typedCallable';
import { SPIN_COMMAND_CALLABLE } from 'bin/commands/spin/models';
import { runCallableAndWait } from 'lib/callables/runAndWait';
import {
  HACK_CRAWLER_CALLABLE,
  INFIL_CRAWLER_CALLABLE,
  KILL_CRAWLER_CALLABLE,
} from 'lib/scripts/models';
import { RunCallableArgs } from 'lib/callables/run';
import { createNiceError } from 'lib/utils/errors';
import { SYNC_COMMAND_CALLABLE } from 'bin/commands/sync/models';

export const main = typedMain(SPIN_COMMAND_CALLABLE, async ({ ns, log }) => {
  const spin = async () => {
    await throwOrWait({ ns, callableDefinition: KILL_CRAWLER_CALLABLE });
    await throwOrWait({ ns, callableDefinition: INFIL_CRAWLER_CALLABLE });
    await throwOrWait({ ns, callableDefinition: SYNC_COMMAND_CALLABLE });
    await throwOrWait({ ns, callableDefinition: HACK_CRAWLER_CALLABLE });
  };

  let lastSpinLevel = ns.getPlayer().skills.hacking;

  log.info('Starting spin');
  await spin();

  while (true) {
    const { hacking } = ns.getPlayer().skills;

    if (hacking - lastSpinLevel >= 10) {
      log.info(
        'Restarting spin after experience gain',
        ['hackingLevel', hacking],
        ['lastSpinLevel', lastSpinLevel],
      );
      lastSpinLevel = hacking;
      await spin();
    }

    log.debug('Sleeping for 10 seconds');
    await ns.sleep(10_000);
  }
});

const throwOrWait = async (callableArgs: RunCallableArgs<AnyCallableDefinition>) => {
  const pid = await runCallableAndWait(callableArgs);

  if (!pid) {
    throw createNiceError('Unable to start callable', [
      'definition',
      callableArgs.callableDefinition,
    ]);
  }
};
