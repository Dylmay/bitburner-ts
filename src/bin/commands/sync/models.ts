import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { CommandFor } from 'bin/commands/models';
import { pathOf } from 'lib/utils/paths';

export type SyncCommand = { command: 'sync' };

export const SYNC_COMMAND_CALLABLE: TypedCallableDefinition<void> = {
  scriptPath: pathOf('bin/commands/sync/sync.ts'),
};

export const syncCommand: CommandFor<typeof SYNC_COMMAND_CALLABLE> & SyncCommand = {
  command: 'sync',
  description: 'Update the library and sync it across all nodes',
  definition: SYNC_COMMAND_CALLABLE,
  parseArgs: () => undefined,
};
