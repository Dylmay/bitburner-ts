import { execCallable } from 'lib/callables/exec';
import { typedMain } from 'lib/callables/typedCallable';
import { EXEC_CALLABLE } from 'lib/exec/models';
import { createNiceError } from 'lib/utils/errors';

export const main = typedMain(EXEC_CALLABLE, async ({ ns }, args) => {
  if (!args) {
    throw createNiceError('No args passed');
  }

  const { definition, hostToExecTo, processArgs } = args;

  execCallable({
    ns,
    hostname: hostToExecTo,
    callableDefinition: definition,
    args: processArgs,
  });
});
