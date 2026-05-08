import { CommandFor } from 'bin/commands/models';
import { INFIL_CRAWLER_CALLABLE } from 'lib/scripts/models';

export type InfilCommand = { command: 'infil' };

export const infilCommand: CommandFor<typeof INFIL_CRAWLER_CALLABLE> & InfilCommand = {
  command: 'infil',
  description: 'Attempt to connect to new nodes',
  definition: INFIL_CRAWLER_CALLABLE,
  parseArgs: () => undefined,
};
