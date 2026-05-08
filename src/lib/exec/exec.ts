import { execCallable } from 'lib/callables/exec';
import { typedMain } from 'lib/callables/typedCallable';
import { EXEC_CALLABLE } from 'lib/exec/models';
import { createNiceError } from 'lib/utils/errors';

export const main = typedMain(EXEC_CALLABLE, async ({ ns, log }, args) => {
  if (!args) {
    throw createNiceError('No args passed');
  }

  const { definition, hostToExecTo, processArgs } = args;

  log.info(
    'Parsed args',
    ['definition', definition],
    ['hostToExecTo', hostToExecTo],
    ['processArgs', processArgs],
  );

  const pid = execCallable({
    ns,
    hostname: hostToExecTo,
    callableDefinition: definition,
    args: processArgs,
    log,
  });

  if (!pid) {
    throw createNiceError(
      'Unable to exec scripts',
      ['definition', definition],
      ['hostToExecTo', hostToExecTo],
      ['processArgs', processArgs],
    );
  }
});
