import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { CommandFor } from 'bin/commands/models';
import { pathOf } from 'lib/utils/files/paths';
import { ActionType } from 'lib/scripts/models';
import { ServerInfo } from 'lib/servers/models';

export type SwarmCommand = { command: 'swarm' };

export type ThreadAllocationStrategy = { kind: 'budget'; total: number };

export type ThreadRequirementCalculator = (ns: NS, target: ServerInfo) => number;

export type SwarmArgs = {
  managed: boolean | undefined;
};

export const SWARM_COMMAND_CALLABLE: TypedCallableDefinition<SwarmArgs> = {
  scriptPath: pathOf('bin/commands/swarm/swarm.ts'),
};

export const swarmCommand: CommandFor<typeof SWARM_COMMAND_CALLABLE> & SwarmCommand = {
  command: 'swarm',
  description: 'Swarm the best hackable target with all servers using coordinated phase-switching',
  definition: SWARM_COMMAND_CALLABLE,
  parseArgs: () => ({
    managed: undefined,
  }),
};
