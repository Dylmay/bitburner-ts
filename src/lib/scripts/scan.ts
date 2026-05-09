import { typedMain } from 'lib/callables/typedCallable';
import { SCAN_CALLABLE } from 'lib/scripts/models';
import { INSTALL_CRAWLER_CALLABLE } from 'lib/scripts/models';
import { PortHandle } from 'lib/utils/ports';
import { runCallable } from 'lib/callables/run';
import { createNiceError } from 'lib/utils/errors';
import { NETWORK_REPORT_STORE, NetworkReport, ServerName } from 'lib/reports/models';
import { ServerInfo } from 'lib/servers/models';
import { LogLevel } from 'lib/utils/logging/logger';
import { createPortLogger } from 'lib/utils/logging/portLogger';
import { Store } from 'lib/stores/store';

const LOGGING_PORT = 12352;

export const main = typedMain(SCAN_CALLABLE, async ({ ns, log }) => {
  // TODO(dmayor): Fix the output port model (types shouldn't need casting/banging)
  const listeningPort = PortHandle.connectToPort(ns, INSTALL_CRAWLER_CALLABLE.outputPort!, log);
  listeningPort.clearPort();

  const loggingPort = createPortLogger(LOGGING_PORT);
  const loggingPortHandle = PortHandle.connectToPort(ns, loggingPort);

  const networkReportStore = Store.openStore(ns, NETWORK_REPORT_STORE);

  const installCrawlerPid = runCallable({
    ns,
    callableDefinition: INSTALL_CRAWLER_CALLABLE,
    callableOptions: { logLevel: LogLevel.WARN, loggingPort },
  });

  if (!installCrawlerPid) {
    throw createNiceError('unable to start installCrawler');
  }

  const serverToServerInfo: Record<ServerName, ServerInfo> = {};
  while (ns.isRunning(installCrawlerPid) || listeningPort.hasData()) {
    const report = listeningPort.read();

    if (report) {
      log.info('Received report', ['hostname', report.host], ['serverInfo', report.serverInfo]);
      serverToServerInfo[report.host] = report.serverInfo;
    }

    let maybeData = loggingPortHandle.read() ?? null;
    while (maybeData != null) {
      log.info('received log message', ['logMessage', maybeData]);

      maybeData = loggingPortHandle.read() ?? null;
    }

    await ns.sleep(200);
  }
  log.debug('Verifying report');

  let maybeData = loggingPortHandle.read();
  while (maybeData) {
    log.info('received log message', ['logMessage', maybeData]);

    maybeData = loggingPortHandle.read();
  }

  const allServers = Object.entries(serverToServerInfo).flatMap(([serverName, serverInfo]) => [
    serverName,
    ...serverInfo.connectableServers,
  ]);
  const allDistinctServers = new Set(allServers);

  const serversNotVisited = allDistinctServers
    .keys()
    .filter((server) => !(server in serverToServerInfo))
    .toArray();

  log.info(
    'Completed reporting. Writing to report path',
    ['reportPath', NETWORK_REPORT_STORE.location],
    ['notVisitedServers', serversNotVisited],
  );
  const networkReport: NetworkReport = {
    serversNotVisited,
    serverToServerInfo,
    allServers: allDistinctServers.keys().toArray(),
  };

  networkReportStore.write(networkReport);

  log.info('Exporting network report to all nodes');
  for (const server of networkReport.allServers) {
    ns.scp(NETWORK_REPORT_STORE.location.path, server);
  }
});
