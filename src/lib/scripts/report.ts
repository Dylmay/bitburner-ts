import { typedMain } from 'lib/callables/typedCallable';
import { INFIL_CRAWLER_CALLABLE, REPORT_CRAWLER_CALLABLE } from 'lib/scripts/models';
import { ServerCrawler } from 'lib/crawler/crawler';

export const main = typedMain(REPORT_CRAWLER_CALLABLE, async ({ ns, log }) => {
  const crawler = ServerCrawler.builder(ns, 'reporter', log)
    .ignoringServer('home')
    .calling(INFIL_CRAWLER_CALLABLE);

  await crawler.crawl(async ({ hostToVisit }) => {
    log.info('Reporting information about visiting host', ['hostToVisit', hostToVisit]);
  });
});
