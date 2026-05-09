import { execCallable, ExecCallableArgs } from 'lib/callables/exec';
import { AnyCallableDefinition } from 'lib/callables/typedCallable';

const DEFAULT_SLEEP_AMOUNT_MS = 100;

type ExecWaitArgs = {
  sleepAmountMs?: number | undefined;
};

export const execCallableAndWait = async <TDef extends AnyCallableDefinition>({
  ns,
  sleepAmountMs,
  ...rest
}: ExecCallableArgs<TDef> & ExecWaitArgs): Promise<boolean> => {
  const pid = execCallable({ ns, ...rest });

  if (pid) {
    while (ns.isRunning(pid)) {
      await ns.sleep(sleepAmountMs ?? DEFAULT_SLEEP_AMOUNT_MS);
    }
  }

  return !!pid;
};
