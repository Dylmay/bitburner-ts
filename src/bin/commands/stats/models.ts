import { CommandFor } from 'bin/commands/models';
import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { pathOf } from 'lib/utils/files/paths';
import { cast, guard, typeIs } from 'lib/utils/typeGuard';

type OrderBy = 'growth' | 'moneyAvailable' | 'maxMoney' | 'ramAvailable' | 'perTick';

type StatsArgs = {
  orderBy: OrderBy;
};

const orderByGuard = guard(
  (args: unknown): args is OrderBy =>
    typeIs(args, 'string') &&
    ['growth', 'moneyAvailable', 'maxMoney', 'ramAvailable', 'perTick'].includes(args),
);

export const STATS_CALLABLE: TypedCallableDefinition<StatsArgs> = {
  scriptPath: pathOf('bin/commands/stats/stats.ts'),
};

export type StatsCommand = { command: 'stats' };

export const statsCommand: CommandFor<typeof STATS_CALLABLE> & StatsCommand = {
  command: 'stats',
  description: 'Pull information about the system to home',
  definition: STATS_CALLABLE,
  parseArgs: (args): StatsArgs => {
    const orderArg = args.at(0) ?? 'maxMoney';

    return { orderBy: cast(orderArg, orderByGuard) };
  },
};
