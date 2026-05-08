import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { CommandFor } from 'bin/commands/models';

export type SwarmCommand = { command: 'swarm' };

export const SWARM_COMMAND_CALLABLE: TypedCallableDefinition<void> = {
  scriptPath: 'bin/commands/swarm/swarm.ts',
};

export const swarmCommand: CommandFor<typeof SWARM_COMMAND_CALLABLE> & SwarmCommand = {
  command: 'swarm',
  description: 'Swarm the best hackable target with all servers using coordinated phase-switching',
  definition: SWARM_COMMAND_CALLABLE,
  parseArgs: () => undefined,
};
