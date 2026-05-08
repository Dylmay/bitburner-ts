import { runCallableAndWait } from 'lib/callables/runAndWait';
import { spawnCallable } from 'lib/callables/spawn';
import { SAVE_LIB_CALLABLE } from 'lib/installs/models';
import { BUILD_SERVER_INFO_STEPS } from 'lib/servers/steps/models';
import { createNiceError } from 'lib/utils/errors';

export async function main(ns: NS) {
  for (const step of BUILD_SERVER_INFO_STEPS) {
    const pid = await runCallableAndWait({ ns, callableDefinition: step });
    if (!pid) {
      throw createNiceError('Unable to build server info', ['step', step]);
    }
  }

  spawnCallable({ ns, callableDefinition: SAVE_LIB_CALLABLE });
}
