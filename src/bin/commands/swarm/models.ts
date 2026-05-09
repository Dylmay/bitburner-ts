import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { CommandFor } from 'bin/commands/models';
import { cast } from 'lib/utils/typeGuard';
import { pathOf } from 'lib/utils/paths';

export type SwarmCommand = { command: 'swarm' };

export type SwarmArgs = {
  target: string | undefined;
};

export const SWARM_COMMAND_CALLABLE: TypedCallableDefinition<SwarmArgs> = {
  scriptPath: pathOf('bin/commands/swarm/swarm.ts'),
};

export const swarmCommand: CommandFor<typeof SWARM_COMMAND_CALLABLE> & SwarmCommand = {
  command: 'swarm',
  description: 'Swarm the best hackable target with all servers using coordinated phase-switching',
  definition: SWARM_COMMAND_CALLABLE,
  parseArgs: ([target]) => ({ target: target ? cast(target, 'string') : undefined }),
};
