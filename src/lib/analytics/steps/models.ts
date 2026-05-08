import { TypedCallableDefinition } from 'lib/callables/typedCallable';

export type SetTargetArgs = {
  target: string;
};

export const SET_TARGET_CALLABLE: TypedCallableDefinition<SetTargetArgs> = {
  scriptPath: 'lib/analytics/steps/setTarget.ts',
};

export const SET_HACK_CHANCE_CALLABLE: TypedCallableDefinition<void> = {
  scriptPath: 'lib/analytics/steps/setHackChance.ts',
};

export const SET_HACK_AMOUNT_PER_THREAD_CALLABLE: TypedCallableDefinition<void> = {
  scriptPath: 'lib/analytics/steps/setHackAmountPerThread.ts',
};

export const SET_HACK_TIME_CALLABLE: TypedCallableDefinition<void> = {
  scriptPath: 'lib/analytics/steps/setHackTime.ts',
};

export const SET_GROW_TIME_CALLABLE: TypedCallableDefinition<void> = {
  scriptPath: 'lib/analytics/steps/setGrowTime.ts',
};

export const SET_WEAKEN_TIME_CALLABLE: TypedCallableDefinition<void> = {
  scriptPath: 'lib/analytics/steps/setWeakenTime.ts',
};

export const SET_REQUIRED_HACKING_LEVEL_CALLABLE: TypedCallableDefinition<void> = {
  scriptPath: 'lib/analytics/steps/setRequiredHackingLevel.ts',
};

export const ASSEMBLE_ANALYTICS_CALLABLE: TypedCallableDefinition<void> = {
  scriptPath: 'lib/analytics/steps/assemble.ts',
};

export const BUILD_ANALYTICS_STEPS: TypedCallableDefinition<void>[] = [
  SET_HACK_CHANCE_CALLABLE,
  SET_HACK_AMOUNT_PER_THREAD_CALLABLE,
  SET_HACK_TIME_CALLABLE,
  SET_GROW_TIME_CALLABLE,
  SET_WEAKEN_TIME_CALLABLE,
  SET_REQUIRED_HACKING_LEVEL_CALLABLE,
  ASSEMBLE_ANALYTICS_CALLABLE,
];
