import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { CommandFor } from 'bin/commands/models';

export type SpinCommand = { command: 'spin' };

export const SPIN_COMMAND_CALLABLE: TypedCallableDefinition<void> = {
  scriptPath: 'bin/commands/spin/spin.ts',
};

export const spinCommand: CommandFor<typeof SPIN_COMMAND_CALLABLE> & SpinCommand = {
  command: 'spin',
  description: 'Spin across the commands depending on progress of the player',
  definition: SPIN_COMMAND_CALLABLE,
  parseArgs: () => undefined,
};
