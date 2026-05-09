import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { StoreDef } from 'lib/stores/store';
import { pathOf } from 'lib/utils/files/paths';
import { objectGuard } from 'lib/utils/typeGuard';

export type ServerAnalytics = {
  hostname: string;
  hackChance: number;
  hackAmountPerThread: number;
  hackTime: number;
  growTime: number;
  weakenTime: number;
  requiredHackingLevel: number;
};

export const serverAnalyticsGuard = objectGuard<ServerAnalytics>({
  hostname: 'string',
  hackChance: 'number',
  hackAmountPerThread: 'number',
  hackTime: 'number',
  growTime: 'number',
  weakenTime: 'number',
  requiredHackingLevel: 'number',
});

export const SERVER_ANALYTICS_STORE: StoreDef<ServerAnalytics> = {
  location: pathOf('analytics/server.analytics.json'),
  loadGuard: serverAnalyticsGuard,
};

export type GetAnalyticsOutputPortArgs = {
  host: string;
  serverAnalytics: ServerAnalytics;
};

const getAnalyticsOutputPortGuard = objectGuard<GetAnalyticsOutputPortArgs>({
  host: 'string',
  serverAnalytics: serverAnalyticsGuard,
});

export const GET_ANALYTICS_CALLABLE: TypedCallableDefinition<void, GetAnalyticsOutputPortArgs> = {
  scriptPath: pathOf('lib/analytics/getAnalytics.ts'),
  outputPort: {
    port: 2347,
    guard: getAnalyticsOutputPortGuard,
  },
};
