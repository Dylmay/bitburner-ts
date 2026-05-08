import { ArgOf, AnyCallableDefinition, CallableOptions } from 'lib/callables/typedCallable';
import { toJsonArgs } from 'lib/args/jsonArgs';
import { Logger } from 'lib/utils/logging/logger';
import { InternalServerCrawlerArgs } from 'lib/crawler/models';

export type ExecCallableArgs<TDef extends AnyCallableDefinition> = {
  ns: NS;
  hostname: string;
  callableDefinition: TDef;
  runOptions?: RunOptions;
  args?: ArgOf<TDef> | undefined;
  crawlerArgs?: InternalServerCrawlerArgs;
  callableOptions?: CallableOptions;
  log?: Logger;
};

export const execCallable = <TDef extends AnyCallableDefinition>({
  ns,
  hostname,
  callableDefinition,
  runOptions,
  args,
  crawlerArgs,
  callableOptions,
  log,
}: ExecCallableArgs<TDef>): number | undefined => {
  const launchedPid = ns.exec(
    callableDefinition.scriptPath,
    hostname,
    runOptions ?? {},
    ...(args !== undefined || crawlerArgs !== undefined || callableOptions !== undefined
      ? [toJsonArgs(args, crawlerArgs, callableOptions)]
      : []),
  );

  log?.trace(
    'Executing callable',
    ['targetHost', hostname],
    ['callable', callableDefinition],
    ['launchedPid', launchedPid],
  );

  return launchedPid === 0 ? undefined : launchedPid;
};
