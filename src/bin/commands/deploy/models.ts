import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { CommandFor } from 'bin/commands/models';
import { pathOf } from 'lib/utils/files/paths';

export type DeployCommand = { command: 'deploy' };

export type DeployArgs = {
  managed: 'managed' | 'unmanaged';
};

export const DEPLOY_COMMAND_CALLABLE: TypedCallableDefinition<DeployArgs> = {
  scriptPath: pathOf('bin/commands/deploy/deploy.ts'),
};

export const deployCommand: CommandFor<typeof DEPLOY_COMMAND_CALLABLE> & DeployCommand = {
  command: 'deploy',
  description: 'Refresh install data and distribute the library to all known nodes',
  definition: DEPLOY_COMMAND_CALLABLE,
  parseArgs: () => ({
    managed: 'unmanaged',
  }),
};
