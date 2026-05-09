import { ArgOf, AnyCallableDefinition, CallableOptions } from 'lib/callables/typedCallable';
import { toJsonArgs } from 'lib/args/jsonArgs';
import { InternalServerCrawlerArgs } from 'lib/crawler/models';

export type ExecCallableArgs<TDef extends AnyCallableDefinition> = {
  ns: NS;
  hostname: string;
  callableDefinition: TDef;
  runOptions?: RunOptions;
  args?: ArgOf<TDef> | undefined;
  crawlerArgs?: InternalServerCrawlerArgs;
  callableOptions?: CallableOptions;
};

export const execCallable = <TDef extends AnyCallableDefinition>({
  ns,
  hostname,
  callableDefinition,
  runOptions,
  args,
  crawlerArgs,
  callableOptions,
}: ExecCallableArgs<TDef>): number | undefined => {
  const launchedPid = ns.exec(
    callableDefinition.scriptPath.path,
    hostname,
    runOptions ?? {},
    ...(args !== undefined || crawlerArgs !== undefined || callableOptions !== undefined
      ? [toJsonArgs(args, crawlerArgs, callableOptions)]
      : []),
  );

  return launchedPid === 0 ? undefined : launchedPid;
};
