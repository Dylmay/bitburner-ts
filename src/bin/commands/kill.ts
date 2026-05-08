import { CommandFor } from 'bin/commands/models';
import { KILL_CRAWLER_CALLABLE } from 'lib/scripts/models';

export type KillCommand = { command: 'kill' };

export const killCommand: CommandFor<typeof KILL_CRAWLER_CALLABLE> & KillCommand = {
  command: 'kill',
  description: 'Kill all running scripts across all nodes',
  definition: KILL_CRAWLER_CALLABLE,
  parseArgs: () => undefined,
};
