import { TypedCallableDefinition } from 'lib/callables/typedCallable';

export type HackArgs = {
  target?: string | undefined;
};

export type HackAllArgs = {
  target?: string | undefined;
  maxMoney?: number | undefined;
  minSecurityLevel?: number | undefined;
};

export const HACK_MONEY_CALLABLE: TypedCallableDefinition<HackArgs> = {
  scriptPath: '/lib/hacks/hackMoney.ts',
};

export const GROW_MONEY_CALLABLE: TypedCallableDefinition<HackArgs> = {
  scriptPath: 'lib/hacks/growMoney.ts',
};

export const WEAKEN_SECURITY_CALLABLE: TypedCallableDefinition<HackArgs> = {
  scriptPath: 'lib/hacks/weakenSecurity.ts',
};

export const HACK_ALL_CALLABLE: TypedCallableDefinition<HackAllArgs> = {
  scriptPath: 'lib/hacks/hackAll.ts',
};
