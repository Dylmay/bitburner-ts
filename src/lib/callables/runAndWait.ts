import { runCallable, RunCallableArgs } from 'lib/callables/run';
import { AnyCallableDefinition } from 'lib/callables/typedCallable';

const DEFAULT_SLEEP_AMOUNT_MS = 100;

type RunWaitArgs = {
  sleepAmountMs?: number | undefined;
};

export const runCallableAndWait = async <TDef extends AnyCallableDefinition>({
  ns,
  sleepAmountMs,
  ...rest
}: RunCallableArgs<TDef> & RunWaitArgs): Promise<number | undefined> => {
  const pid = runCallable({ ns, ...rest });

  if (pid) {
    while (ns.isRunning(pid)) {
      await ns.sleep(sleepAmountMs ?? DEFAULT_SLEEP_AMOUNT_MS);
    }

    return pid;
  }
};
