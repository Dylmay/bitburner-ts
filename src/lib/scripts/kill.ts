import { typedMain } from 'lib/callables/typedCallable';
import { ServerCrawler } from 'lib/crawler/crawler';
import { KILL_CRAWLER_CALLABLE } from 'lib/scripts/models';

const IGNORED_SCRIPT_PATHS = ['kill.ts'];

export const main = typedMain(KILL_CRAWLER_CALLABLE, async ({ ns, log }, args) => {
  const excludedServers = args?.excludedServers ?? ['home'];

  const crawlerBuilder = ServerCrawler.builder(ns, 'killer-crawler', log);
  for (const excludedServer of excludedServers) {
    crawlerBuilder.ignoringServer(excludedServer);
  }

  await crawlerBuilder.calling(KILL_CRAWLER_CALLABLE, args).crawl(async ({ hostToVisit }) => {
    const processes = ns.ps(hostToVisit);

    for (const process of processes) {
      if (IGNORED_SCRIPT_PATHS.find((path) => process.filename.includes(path)) !== undefined) {
        log.info('Not killing ignored process', ['file', process.filename]);

        continue;
      }

      ns.kill(process.pid);

      log.info('Killed process', ['file', process.filename], ['pid', process.pid]);
    }
  });
});
