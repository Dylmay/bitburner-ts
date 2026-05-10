import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { CommandFor } from 'bin/commands/models';
import { pathOf } from 'lib/utils/files/paths';

export type AutoCommand = { command: 'auto' };

export const AUTO_COMMAND_CALLABLE: TypedCallableDefinition<void> = {
  scriptPath: pathOf('bin/commands/auto/auto.ts'),
};

export const autoCommand: CommandFor<typeof AUTO_COMMAND_CALLABLE> & AutoCommand = {
  command: 'auto',
  description: 'Distribute sniff and swarm to the lowest-value rooted servers in the network',
  definition: AUTO_COMMAND_CALLABLE,
  parseArgs: () => undefined,
};
