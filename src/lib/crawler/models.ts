import { guard, typeIs } from 'lib/utils/typeGuard';

export type CrawlerKey = string;
export type LockId = string;

export type InternalServerCrawlerArgs = {
  __type: 'serverCrawlerArgs';
  crawlerKey: CrawlerKey;
  lockId: LockId;
};

export const serverCrawlerArgsGuard = guard(
  (arg: unknown): arg is InternalServerCrawlerArgs =>
    typeIs(arg, Object) &&
    'crawlerKey' in arg &&
    typeIs(arg.crawlerKey, 'string') &&
    'lockId' in arg &&
    typeIs(arg.lockId, 'string') &&
    '__type' in arg &&
    typeIs(arg.__type, 'string') &&
    arg.__type === 'serverCrawlerArgs',
);
