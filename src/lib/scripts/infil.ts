import { ServerCrawler } from 'lib/crawler/crawler';
import { INFIL_CRAWLER_CALLABLE } from 'lib/scripts/models';
import { typedMain } from 'lib/callables/typedCallable';
import { infilHost } from 'lib/scripts/infilHost';

export const main = typedMain(INFIL_CRAWLER_CALLABLE, async ({ ns, log }) => {
  const crawler = ServerCrawler.builder(ns, 'infiltrate', log)
    .ignoringServer('home')
    .calling(INFIL_CRAWLER_CALLABLE);

  await crawler.crawl(async ({ hostToVisit }) => {
    await infilHost(ns, log, hostToVisit);
  });
});
