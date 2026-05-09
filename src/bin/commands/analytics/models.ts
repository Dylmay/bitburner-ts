import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { typeIs } from 'lib/utils/typeGuard';
import { createNiceError } from 'lib/utils/errors';
import { CommandFor } from 'bin/commands/models';
import { pathOf } from 'lib/utils/paths';

export type CollectAnalyticsArgs = {
  target: string;
  donorHost?: string;
};

export const COLLECT_ANALYTICS_CALLABLE: TypedCallableDefinition<CollectAnalyticsArgs> = {
  scriptPath: pathOf('bin/commands/analytics/analytics.ts'),
};

export type AnalyticsCommand = {
  command: 'analytics';
};

export const analyticsCommand: CommandFor<typeof COLLECT_ANALYTICS_CALLABLE> & AnalyticsCommand = {
  command: 'analytics',
  description: 'Collect analytics for a target host - analytics <target> [donorHost]',
  definition: COLLECT_ANALYTICS_CALLABLE,
  parseArgs: ([target, donorHost]) => {
    if (!typeIs(target, 'string')) {
      throw createNiceError('analytics: expected string target hostname', ['target', target]);
    }

    if (!typeIs(donorHost, 'string')) {
      throw createNiceError('analytics: expected string donorHost', ['donorHost', donorHost]);
    }

    return {
      target,
      donorHost,
    };
  },
};
