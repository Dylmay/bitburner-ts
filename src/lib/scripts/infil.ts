import { ServerCrawler } from 'lib/crawler/crawler';
import { INFIL_CRAWLER_CALLABLE } from 'lib/scripts/models';
import { typedMain } from 'lib/callables/typedCallable';

export const main = typedMain(INFIL_CRAWLER_CALLABLE, async ({ ns, log }) => {
  const crawler = ServerCrawler.builder(ns, 'infiltrate', log)
    .ignoringServer('home')
    .calling(INFIL_CRAWLER_CALLABLE);

  await crawler.crawl(async ({ currentHost, hostToVisit }) => {
    try {
      log.info(
        'Attempting to hack connected host',
        ['currentHost', currentHost],
        ['hostToHack', hostToVisit],
      );

      if (ns.hasRootAccess(hostToVisit)) {
        log.info('Already have root access on host. Skipping', ['hostToHack', hostToVisit]);
      }

      const completedBrute = ns.brutessh(hostToVisit);
      const completedFtpCrack = ns.ftpcrack(hostToVisit);
      const completedNuke = ns.nuke(hostToVisit);
      const completedSmtp = ns.relaysmtp(hostToVisit);

      log.info(
        'Completed hack',
        ['bruteSshSuccessful', completedBrute],
        ['ftpCrackSuccessful', completedFtpCrack],
        ['nukeSuccessful', completedNuke],
        ['smtpSuccessful', completedSmtp],
      );
    } catch (exc) {
      log.warn(
        'Unable to hack connected host',
        ['currentHost', currentHost],
        ['hostToHack', hostToVisit],
        ['exception', exc],
      );
    }
  });
});
