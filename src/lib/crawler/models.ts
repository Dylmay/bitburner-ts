import { objectGuard, literal } from 'lib/utils/typeGuard';

export type CrawlerKey = string;
export type LockId = string;

export type InternalServerCrawlerArgs = {
  __type: 'serverCrawlerArgs';
  crawlerKey: CrawlerKey;
  lockId: LockId;
};

export const serverCrawlerArgsGuard = objectGuard<InternalServerCrawlerArgs>({
  __type: literal('serverCrawlerArgs'),
  crawlerKey: 'string',
  lockId: 'string',
});
