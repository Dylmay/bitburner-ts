import { runCallableAndWait } from 'lib/callables/runAndWait';
import { SCAN_CALLABLE } from 'lib/scripts/models';
import { SAVE_LIB_CALLABLE } from 'lib/installs/models';
import { BUILD_SERVER_INFO_STEPS } from 'lib/servers/steps/models';
import { LogLevel } from 'lib/utils/logging/logger';
import { typedMain } from 'lib/callables/typedCallable';
import { SYNC_COMMAND_CALLABLE } from 'bin/commands/sync/models';
import { spawnCallable } from 'lib/callables/spawn';
import { createNiceError } from 'lib/utils/errors';

const buildLocalServerInfo = async (ns: NS) => {
  for (const step of BUILD_SERVER_INFO_STEPS) {
    const pid = await runCallableAndWait({ ns, callableDefinition: step });
    if (!pid) {
      throw createNiceError('Unable to build local server info', ['step', step]);
    }
  }
};

export const main = typedMain(SYNC_COMMAND_CALLABLE, async ({ ns }) => {
  await buildLocalServerInfo(ns);

  const saveLibPid = await runCallableAndWait({ ns, callableDefinition: SAVE_LIB_CALLABLE });
  if (!saveLibPid) {
    throw createNiceError('Unable to launch saveLib callable');
  }

  spawnCallable({
    ns,
    callableDefinition: SCAN_CALLABLE,
    callableOptions: { logLevel: LogLevel.DEBUG },
  });
});
