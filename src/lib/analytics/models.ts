import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { StoreDef } from 'lib/stores/store';
import { pathOf } from 'lib/utils/paths';
import { guard, typeIs } from 'lib/utils/typeGuard';

export type ServerAnalytics = {
  hostname: string;
  hackChance: number;
  hackAmountPerThread: number;
  hackTime: number;
  growTime: number;
  weakenTime: number;
  requiredHackingLevel: number;
};

export const serverAnalyticsGuard = guard((arg: unknown): arg is ServerAnalytics => {
  if (!typeIs(arg, Object)) return false;
  if (!('hostname' in arg) || !typeIs(arg.hostname, 'string')) return false;
  if (!('hackChance' in arg) || !typeIs(arg.hackChance, 'number')) return false;
  if (!('hackAmountPerThread' in arg) || !typeIs(arg.hackAmountPerThread, 'number')) return false;
  if (!('hackTime' in arg) || !typeIs(arg.hackTime, 'number')) return false;
  if (!('growTime' in arg) || !typeIs(arg.growTime, 'number')) return false;
  if (!('weakenTime' in arg) || !typeIs(arg.weakenTime, 'number')) return false;
  if (!('requiredHackingLevel' in arg) || !typeIs(arg.requiredHackingLevel, 'number')) return false;
  return true;
});

export const SERVER_ANALYTICS_STORE: StoreDef<ServerAnalytics> = {
  location: pathOf('analytics/server.analytics.json'),
  loadGuard: serverAnalyticsGuard,
};

export type GetAnalyticsOutputPortArgs = {
  host: string;
  serverAnalytics: ServerAnalytics;
};

const getAnalyticsOutputPortGuard = guard(
  (arg: unknown): arg is GetAnalyticsOutputPortArgs =>
    typeIs(arg, Object) &&
    'host' in arg &&
    typeIs(arg.host, 'string') &&
    'serverAnalytics' in arg &&
    typeIs(arg.serverAnalytics, serverAnalyticsGuard),
);

export const GET_ANALYTICS_CALLABLE: TypedCallableDefinition<void, GetAnalyticsOutputPortArgs> = {
  scriptPath: pathOf('lib/analytics/getAnalytics.ts'),
  outputPort: {
    port: 2347,
    guard: getAnalyticsOutputPortGuard,
  },
};
