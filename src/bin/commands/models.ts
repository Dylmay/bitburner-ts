import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { FlagSchema } from 'lib/utils/flags';

export type Command<TArg, TPort = unknown> = {
  command: string;
  description: string;
  definition: TypedCallableDefinition<TArg, TPort>;
  parseArgs: (args: ScriptArg[]) => TArg;
  flags?: FlagSchema;
};

export type CommandFor<TDef> =
  TDef extends TypedCallableDefinition<infer TArg, infer TPort> ? Command<TArg, TPort> : never;
