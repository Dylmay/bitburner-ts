import { pathOf } from 'lib/utils/files/paths';
import { guard, typeIs } from 'lib/utils/typeGuard';

export const SERVER_ANALYTICS_BUILDER_PATH = pathOf('analytics/builder.analytics.json.txt');

export type ServerAnalyticsBuilderTarget = {
  hostname: string;
};

export type ServerAnalyticsBuilderHackChance = {
  hackChance: number;
} & ServerAnalyticsBuilderTarget;

export type ServerAnalyticsBuilderHackAmountPerThread = {
  hackAmountPerThread: number;
} & ServerAnalyticsBuilderHackChance;

export type ServerAnalyticsBuilderHackTime = {
  hackTime: number;
} & ServerAnalyticsBuilderHackAmountPerThread;

export type ServerAnalyticsBuilderGrowTime = {
  growTime: number;
} & ServerAnalyticsBuilderHackTime;

export type ServerAnalyticsBuilderWeakenTime = {
  weakenTime: number;
} & ServerAnalyticsBuilderGrowTime;

export type ServerAnalyticsBuilderRequiredHackingLevel = {
  requiredHackingLevel: number;
} & ServerAnalyticsBuilderWeakenTime;

export type CompleteServerAnalyticsBuilder = ServerAnalyticsBuilderRequiredHackingLevel;

export const serverAnalyticsBuilderTargetGuard = guard(
  (arg: unknown): arg is ServerAnalyticsBuilderTarget =>
    typeIs(arg, Object) && 'hostname' in arg && typeIs(arg.hostname, 'string'),
);

export const serverAnalyticsBuilderHackChanceGuard = guard(
  (arg: unknown): arg is ServerAnalyticsBuilderHackChance =>
    typeIs(arg, serverAnalyticsBuilderTargetGuard) &&
    'hackChance' in arg &&
    typeIs(arg.hackChance, 'number'),
);

export const serverAnalyticsBuilderHackAmountPerThreadGuard = guard(
  (arg: unknown): arg is ServerAnalyticsBuilderHackAmountPerThread =>
    typeIs(arg, serverAnalyticsBuilderHackChanceGuard) &&
    'hackAmountPerThread' in arg &&
    typeIs(arg.hackAmountPerThread, 'number'),
);

export const serverAnalyticsBuilderHackTimeGuard = guard(
  (arg: unknown): arg is ServerAnalyticsBuilderHackTime =>
    typeIs(arg, serverAnalyticsBuilderHackAmountPerThreadGuard) &&
    'hackTime' in arg &&
    typeIs(arg.hackTime, 'number'),
);

export const serverAnalyticsBuilderGrowTimeGuard = guard(
  (arg: unknown): arg is ServerAnalyticsBuilderGrowTime =>
    typeIs(arg, serverAnalyticsBuilderHackTimeGuard) &&
    'growTime' in arg &&
    typeIs(arg.growTime, 'number'),
);

export const serverAnalyticsBuilderWeakenTimeGuard = guard(
  (arg: unknown): arg is ServerAnalyticsBuilderWeakenTime =>
    typeIs(arg, serverAnalyticsBuilderGrowTimeGuard) &&
    'weakenTime' in arg &&
    typeIs(arg.weakenTime, 'number'),
);

export const serverAnalyticsBuilderRequiredHackingLevelGuard = guard(
  (arg: unknown): arg is ServerAnalyticsBuilderRequiredHackingLevel =>
    typeIs(arg, serverAnalyticsBuilderWeakenTimeGuard) &&
    'requiredHackingLevel' in arg &&
    typeIs(arg.requiredHackingLevel, 'number'),
);

export const completeServerAnalyticsBuilderGuard = serverAnalyticsBuilderRequiredHackingLevelGuard;
