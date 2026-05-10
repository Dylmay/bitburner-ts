import { CommandFor } from 'bin/commands/models';
import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { pathOf } from 'lib/utils/files/paths';
import { typeIs } from 'lib/utils/typeGuard';

export const buildCachePath = (hostname: string, filepath: string): string => {
  const contractName = filepath.split('/').at(-1) ?? filepath;
  return `/contracts/${hostname}-${contractName}.json`;
};

type LsArgs = {
  action: 'ls';
  search: string | undefined;
};

type TypesArgs = {
  action: 'types';
};

type InfoArgs = {
  action: 'info';
  fuzzyPath: string;
  host: string | undefined;
};

type AttemptArgs = {
  action: 'attempt';
  fuzzyPath: string;
  answer: string;
  host: string | undefined;
};

export type ContractArgs = LsArgs | TypesArgs | InfoArgs | AttemptArgs;

export type ResolvedInfoArgs = {
  hostname: string;
  filepath: string;
};

export type ResolvedAttemptArgs = {
  hostname: string;
  filepath: string;
  answer: string;
};

export type ContractInfoSubArgs = {
  hostname: string;
  filepath: string;
  cachePath: string;
};

export const CONTRACT_CALLABLE: TypedCallableDefinition<ContractArgs> = {
  scriptPath: pathOf('bin/commands/contract/contract.ts'),
};

export const CONTRACT_INFO_CALLABLE: TypedCallableDefinition<ResolvedInfoArgs> = {
  scriptPath: pathOf('bin/commands/contract/info.ts'),
};

export const CONTRACT_ATTEMPT_CALLABLE: TypedCallableDefinition<ResolvedAttemptArgs> = {
  scriptPath: pathOf('bin/commands/contract/attempt.ts'),
};

export const CONTRACT_GET_TYPE_CALLABLE: TypedCallableDefinition<ContractInfoSubArgs> = {
  scriptPath: pathOf('bin/commands/contract/info/getType.ts'),
};

export const CONTRACT_GET_DESC_CALLABLE: TypedCallableDefinition<ContractInfoSubArgs> = {
  scriptPath: pathOf('bin/commands/contract/info/getDescription.ts'),
};

export const CONTRACT_GET_DATA_CALLABLE: TypedCallableDefinition<ContractInfoSubArgs> = {
  scriptPath: pathOf('bin/commands/contract/info/getData.ts'),
};

export const CONTRACT_GET_TRIES_CALLABLE: TypedCallableDefinition<ContractInfoSubArgs> = {
  scriptPath: pathOf('bin/commands/contract/info/getTries.ts'),
};

export const CONTRACT_SCAN_CALLABLE: TypedCallableDefinition<undefined> = {
  scriptPath: pathOf('bin/commands/contract/scan.ts'),
};

export type ContractCommand = { command: 'contract' };

export const contractCommand: CommandFor<typeof CONTRACT_CALLABLE> & ContractCommand = {
  command: 'contract',
  description: 'List or interact with coding contracts across the network',
  definition: CONTRACT_CALLABLE,
  parseArgs: (args): ContractArgs => {
    const action = args[0];
    const rest = args.slice(1).filter((a) => typeIs(a, 'string'));

    if (action === 'info') {
      return { action: 'info', fuzzyPath: rest[0] ?? '', host: rest[1] ?? undefined };
    }

    if (action === 'attempt') {
      return {
        action: 'attempt',
        fuzzyPath: rest[0] ?? '',
        answer: rest[1] ?? '',
        host: rest[2] ?? undefined,
      };
    }

    if (action === 'types') {
      return { action: 'types' };
    }

    return { action: 'ls', search: rest[0] ?? undefined };
  },
};
