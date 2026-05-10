import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { pathOf } from 'lib/utils/files/paths';
import { Port } from 'lib/utils/ports';
import { objectGuard } from 'lib/utils/typeGuard';

export type HackArgs = {
  target?: string | undefined;
};

export type HackAllArgs = {
  target?: string | undefined;
  maxMoney?: number | undefined;
  minSecurityLevel?: number | undefined;
};

export type GrowMoneyOutput = {
  type: 'grow';
  growAmount: number;
  hostname: string;
  target: string;
};

export type HackMoneyOutput = {
  type: 'hack';
  hackAmount: number;
  hostname: string;
  target: string;
};

export type WeakenSecurityOutput = {
  type: 'weaken';
  weakenAmount: number;
  hostname: string;
  target: string;
};

export type HackOutput = GrowMoneyOutput | HackMoneyOutput | WeakenSecurityOutput;

export const hackOutputGuard = objectGuard<HackOutput>({
  type: 'string',
  hostname: 'string',
  target: 'string',
});

export const HACK_OUTPUT_PORT: Port<HackOutput> = {
  port: 1337,
  guard: hackOutputGuard,
};

export const HACK_MONEY_CALLABLE: TypedCallableDefinition<HackArgs, HackOutput> = {
  scriptPath: pathOf('lib/hacks/hackMoney.ts'),
  outputPort: HACK_OUTPUT_PORT,
};

export const GROW_MONEY_CALLABLE: TypedCallableDefinition<HackArgs, HackOutput> = {
  scriptPath: pathOf('lib/hacks/growMoney.ts'),
  outputPort: HACK_OUTPUT_PORT,
};

export const WEAKEN_SECURITY_CALLABLE: TypedCallableDefinition<HackArgs, HackOutput> = {
  scriptPath: pathOf('lib/hacks/weakenSecurity.ts'),
  outputPort: HACK_OUTPUT_PORT,
};

export const HACK_ALL_CALLABLE: TypedCallableDefinition<HackAllArgs, HackOutput> = {
  scriptPath: pathOf('lib/hacks/hackAll.ts'),
  outputPort: HACK_OUTPUT_PORT,
};
