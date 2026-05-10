import { CommandFor } from 'bin/commands/models';
import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { pathOf } from 'lib/utils/files/paths';
import { cast, enumGuard } from 'lib/utils/typeGuard';
import { flag, parseFlags } from 'lib/utils/flags';

type OrderBy = 'growth' | 'moneyAvailable' | 'maxMoney' | 'ramAvailable' | 'perTick';

type StatsArgs = {
  orderBy: OrderBy;
  onlyRoot: boolean;
};

const orderByGuard = enumGuard<OrderBy>(['growth', 'moneyAvailable', 'maxMoney', 'ramAvailable', 'perTick']);

const statsFlags = {
  orderBy: flag.string({ default: 'maxMoney', desc: 'Sort results by (growth|moneyAvailable|maxMoney|ramAvailable|perTick)' }),
  onlyRoot: flag.boolean({ desc: 'Only show root-accessible servers' }),
} as const;

export const STATS_CALLABLE: TypedCallableDefinition<StatsArgs> = {
  scriptPath: pathOf('bin/commands/stats/stats.ts'),
};

export type StatsCommand = { command: 'stats' };

export const statsCommand: CommandFor<typeof STATS_CALLABLE> & StatsCommand = {
  command: 'stats',
  description: 'Pull information about the system to home',
  definition: STATS_CALLABLE,
  flags: statsFlags,
  parseArgs: (args): StatsArgs => {
    const { flags } = parseFlags(args, statsFlags);
    return {
      orderBy: cast(flags.orderBy, orderByGuard),
      onlyRoot: flags.onlyRoot,
    };
  },
};
