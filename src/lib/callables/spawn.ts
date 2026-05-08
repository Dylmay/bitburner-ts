import { CallableOptions, AnyCallableDefinition, ArgOf } from 'lib/callables/typedCallable';
import { toJsonArgs } from 'lib/args/jsonArgs';
import { Logger } from 'lib/utils/logging/logger';
import { InternalServerCrawlerArgs } from 'lib/crawler/models';

export const spawnCallable = <TDef extends AnyCallableDefinition>({
  ns,
  callableDefinition,
  runOptions,
  args,
  crawlerArgs,
  callableOptions,
  log,
}: {
  ns: NS;
  callableDefinition: TDef;
  runOptions?: SpawnOptions;
  args?: ArgOf<TDef> | undefined;
  crawlerArgs?: InternalServerCrawlerArgs;
  callableOptions?: CallableOptions;
  log?: Logger;
}) => {
  log?.trace('spawning callable', ['callable', callableDefinition]);

  ns.spawn(
    callableDefinition.scriptPath,
    runOptions ?? { spawnDelay: 0 },
    ...(args !== undefined || crawlerArgs !== undefined || callableOptions !== undefined
      ? [toJsonArgs(args, crawlerArgs, callableOptions)]
      : []),
  );
};
