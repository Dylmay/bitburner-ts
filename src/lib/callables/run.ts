import { ArgOf, AnyCallableDefinition, CallableOptions } from 'lib/callables/typedCallable';
import { toJsonArgs } from 'lib/args/jsonArgs';
import { Logger } from 'lib/utils/logging/logger';
import { InternalServerCrawlerArgs } from 'lib/crawler/models';

export type RunCallableArgs<TDef extends AnyCallableDefinition> = {
  ns: NS;
  callableDefinition: TDef;
  runOptions?: RunOptions;
  args?: ArgOf<TDef> | undefined;
  crawlerArgs?: InternalServerCrawlerArgs;
  callableOptions?: CallableOptions;
  log?: Logger,
};

export const runCallable = <TDef extends AnyCallableDefinition>({
  ns,
  callableDefinition,
  runOptions,
  args,
  crawlerArgs,
  callableOptions,
  log,
}: RunCallableArgs<TDef>): number | undefined => {
  const pid = ns.run(
    callableDefinition.scriptPath,
    runOptions ?? {},
    ...(args !== undefined || crawlerArgs !== undefined || callableOptions !== undefined ? [toJsonArgs(args, crawlerArgs, callableOptions)] : []),
  );

  log?.trace("Running callable", ["callable", callableDefinition], ["launchedPid", pid]);

  return pid === 0 ? undefined : pid;
};
