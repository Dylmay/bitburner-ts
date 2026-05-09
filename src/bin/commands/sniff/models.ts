import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { CommandFor } from 'bin/commands/models';
import { pathOf } from 'lib/utils/files/paths';

export type SniffCommand = { command: 'sniff' };

export const SNIFF_COMMAND_CALLABLE: TypedCallableDefinition<void> = {
  scriptPath: pathOf('bin/commands/sniff/sniff.ts'),
};

export const sniffCommand: CommandFor<typeof SNIFF_COMMAND_CALLABLE> & SniffCommand = {
  command: 'sniff',
  description: 'Discover and build server info for all connectable nodes in the network report',
  definition: SNIFF_COMMAND_CALLABLE,
  parseArgs: () => undefined,
};
