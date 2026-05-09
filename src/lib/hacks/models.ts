import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { pathOf } from 'lib/utils/files/paths';
import { Port } from 'lib/utils/ports';
import { guard, typeIs } from 'lib/utils/typeGuard';

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
};

export type HackMoneyOutput = {
  type: 'hack';
  hackAmount: number;
  hostname: string;
};

export type WeakenSecurityOutput = {
  type: 'weaken';
  weakenAmount: number;
  hostname: string;
};

export type HackOutput = GrowMoneyOutput | HackMoneyOutput | WeakenSecurityOutput;

export const hackOutputGuard = guard(
  (arg: unknown): arg is HackOutput =>
    typeIs(arg, Object) &&
    'type' in arg &&
    typeIs(arg.type, 'string') &&
    'hostname' in arg &&
    typeIs(arg.hostname, 'string'),
);

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
