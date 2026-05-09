import { CallableOptions, AnyCallableDefinition, ArgOf } from 'lib/callables/typedCallable';
import { toJsonArgs } from 'lib/args/jsonArgs';
import { InternalServerCrawlerArgs } from 'lib/crawler/models';

export const spawnCallable = <TDef extends AnyCallableDefinition>({
  ns,
  callableDefinition,
  runOptions,
  args,
  crawlerArgs,
  callableOptions,
}: {
  ns: NS;
  callableDefinition: TDef;
  runOptions?: SpawnOptions;
  args?: ArgOf<TDef> | undefined;
  crawlerArgs?: InternalServerCrawlerArgs;
  callableOptions?: CallableOptions;
}) => {
  ns.spawn(
    callableDefinition.scriptPath.path,
    runOptions ?? { spawnDelay: 0 },
    ...(args !== undefined || crawlerArgs !== undefined || callableOptions !== undefined
      ? [toJsonArgs(args, crawlerArgs, callableOptions)]
      : []),
  );
};
