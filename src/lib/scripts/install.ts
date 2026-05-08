import { typedMain } from 'lib/callables/typedCallable';
import { ServerCrawler } from 'lib/crawler/crawler';
import { installLib } from 'lib/installs/installer';
import { INSTALL_CRAWLER_CALLABLE } from 'lib/scripts/models';
import { execCallableAndWait } from 'lib/callables/execAndWait';
import { BUILD_SERVER_INFO_STEPS } from 'lib/servers/steps/models';
import { GET_SERVER_INFO_CALLABLE } from 'lib/servers/models';
import { PortHandle } from 'lib/utils/ports';

export const main = typedMain(INSTALL_CRAWLER_CALLABLE, async ({ ns, log, outputPort }) => {
  const crawler = ServerCrawler.builder(ns, 'install-lib', log)
    .ignoringServer('home')
    .calling(INSTALL_CRAWLER_CALLABLE);

  await crawler.crawl(async ({ currentHost, hostToVisit }) => {
    // TODO(dmayor): Make it so that it's actually possible to run this on home or work on generic donor server logic
    installLib(ns, hostToVisit, log);

    for (const step of BUILD_SERVER_INFO_STEPS) {
      log.trace(
        'Running server info build step',
        ['step', step],
        ['targetHost', hostToVisit],
        ['currentHost', currentHost],
      );

      // TODO(dmayor): pass down args like crawler?
      const completed = await execCallableAndWait({
        ns,
        callableDefinition: step,
        hostname: hostToVisit,
      });

      log.trace('Completed step', ['completed', completed]);

      if (!completed) {
        log.warn(
          'Unable to run step. Possibly not enough memory',
          ['step', step],
          ['hostToVisit', hostToVisit],
          ['currentHost', currentHost],
        );

        return;
      }
    }

    if (outputPort) {
      // super hacky. This may come to bite me due to it reading _any_ data on the port
      const completed = await execCallableAndWait({
        ns,
        callableDefinition: GET_SERVER_INFO_CALLABLE,
        hostname: hostToVisit,
      });

      if (!completed) {
        log.error('Unable to sync', ['hostToVisit', hostToVisit], ['currentHost', currentHost]);
      }

      const getServerInfoPort = PortHandle.connectToPort(ns, GET_SERVER_INFO_CALLABLE.outputPort!);
      const serverInfoData = await getServerInfoPort.awaitRead();

      log.debug('Writing to output port', ['outputPort', outputPort]);
      outputPort.write(serverInfoData);
    }
  });
});
