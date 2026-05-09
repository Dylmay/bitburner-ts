import { pathOf } from 'lib/utils/files/paths';
import { objectGuard, extendGuard } from 'lib/utils/typeGuard';

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

export const serverAnalyticsBuilderTargetGuard = objectGuard<ServerAnalyticsBuilderTarget>({
  hostname: 'string',
});

export const serverAnalyticsBuilderHackChanceGuard =
  extendGuard<ServerAnalyticsBuilderHackChance>(serverAnalyticsBuilderTargetGuard, {
    hackChance: 'number',
  });

export const serverAnalyticsBuilderHackAmountPerThreadGuard =
  extendGuard<ServerAnalyticsBuilderHackAmountPerThread>(serverAnalyticsBuilderHackChanceGuard, {
    hackAmountPerThread: 'number',
  });

export const serverAnalyticsBuilderHackTimeGuard = extendGuard<ServerAnalyticsBuilderHackTime>(
  serverAnalyticsBuilderHackAmountPerThreadGuard,
  { hackTime: 'number' },
);

export const serverAnalyticsBuilderGrowTimeGuard = extendGuard<ServerAnalyticsBuilderGrowTime>(
  serverAnalyticsBuilderHackTimeGuard,
  { growTime: 'number' },
);

export const serverAnalyticsBuilderWeakenTimeGuard = extendGuard<ServerAnalyticsBuilderWeakenTime>(
  serverAnalyticsBuilderGrowTimeGuard,
  { weakenTime: 'number' },
);

export const serverAnalyticsBuilderRequiredHackingLevelGuard =
  extendGuard<ServerAnalyticsBuilderRequiredHackingLevel>(serverAnalyticsBuilderWeakenTimeGuard, {
    requiredHackingLevel: 'number',
  });

export const completeServerAnalyticsBuilderGuard = serverAnalyticsBuilderRequiredHackingLevelGuard;
