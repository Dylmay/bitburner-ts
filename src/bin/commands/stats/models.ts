import { CommandFor } from 'bin/commands/models';
import { TypedCallableDefinition } from 'lib/callables/typedCallable';

type StatsArgs = {
  orderBy: 'growth' | 'moneyAvailable' | 'maxMoney' | 'ramAvailable';
};

export const STATS_CALLABLE: TypedCallableDefinition<StatsArgs> = {
  scriptPath: 'bin/commands/stats/stats.ts',
};

export type StatsCommand = { command: 'stats' };

export const statsCommand: CommandFor<typeof STATS_CALLABLE> & StatsCommand = {
  command: 'stats',
  description: 'Pull information about the system to home',
  definition: STATS_CALLABLE,
  parseArgs: () => ({ orderBy: 'maxMoney' }),
};
