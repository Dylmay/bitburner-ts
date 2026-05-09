import { ArgOf, AnyCallableDefinition, CallableOptions } from 'lib/callables/typedCallable';
import { toJsonArgs } from 'lib/args/jsonArgs';
import { InternalServerCrawlerArgs } from 'lib/crawler/models';

export type RunCallableArgs<TDef extends AnyCallableDefinition> = {
  ns: NS;
  callableDefinition: TDef;
  runOptions?: RunOptions;
  args?: ArgOf<TDef> | undefined;
  crawlerArgs?: InternalServerCrawlerArgs;
  callableOptions?: CallableOptions;
};

export const runCallable = <TDef extends AnyCallableDefinition>({
  ns,
  callableDefinition,
  runOptions,
  args,
  crawlerArgs,
  callableOptions,
}: RunCallableArgs<TDef>): number | undefined => {
  const pid = ns.run(
    callableDefinition.scriptPath.path,
    runOptions ?? {},
    ...(args !== undefined || crawlerArgs !== undefined || callableOptions !== undefined
      ? [toJsonArgs(args, crawlerArgs, callableOptions)]
      : []),
  );

  return pid === 0 ? undefined : pid;
};
