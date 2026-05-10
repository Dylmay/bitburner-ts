import { typedMain } from 'lib/callables/typedCallable';
import { NETWORK_REPORT_STORE } from 'lib/reports/models';
import { Store } from 'lib/stores/store';
import { buildServerInfoLocally } from 'lib/servers/buildServerInfoLocal';
import { runCallableAndWait } from 'lib/callables/runAndWait';
import { createNiceError } from 'lib/utils/errors';
import { SNIFF_COMMAND_CALLABLE } from 'bin/commands/sniff/models';
import { INFIL_HOST_CALLABLE } from 'lib/scripts/models';
import { INSTALL_DATA_STORE } from 'lib/installs/models';
import { SERVER_INFO_STORE } from 'lib/servers/models';

export const main = typedMain(SNIFF_COMMAND_CALLABLE, async ({ ns, log }) => {
  const store = Store.openStore(ns, NETWORK_REPORT_STORE);
  while (true) {
    const report = store.load();

    const toSniff = new Set(
      Object.values(report.serverToServerInfo).flatMap((info) => info.connectableServers),
    )
      .keys()
      .toArray();

    log.info('sniffing servers', ['count', toSniff.length]);

    for (const hostname of toSniff) {
      log.debug('building server info', ['hostname', hostname]);
      const [serverInfo, serverInfoPath] = await buildServerInfoLocally(
        ns,
        hostname,
        async (step, args) => {
          const pid = await runCallableAndWait({ ns, callableDefinition: step, args });
          if (!pid) {
            throw createNiceError(
              'sniff: build step failed',
              ['hostname', hostname],
              ['step', step],
            );
          }
        },
      );
      const curHackLevel = ns.getPlayer().skills.hacking;

      report.serverToServerInfo[hostname] = serverInfo;

      ns.scp(serverInfoPath.path, hostname);
      ns.mv(hostname, serverInfoPath.path, SERVER_INFO_STORE.location.path);
      // would really like not to have this - maybe we ignore tmp instead
      ns.rm(serverInfoPath.path);

      if (!serverInfo.unstable.hasRootAccess && curHackLevel >= serverInfo.requiredHackingLevel) {
        log.info('infiltrating', ['hostname', hostname]);
        const pid = await runCallableAndWait({
          ns,
          callableDefinition: INFIL_HOST_CALLABLE,
          args: { hostname },
        });
        if (!pid) {
          throw createNiceError('unable to start infil');
        }
      } else if (hostname !== 'home') {
        log.debug('installing lib', ['hostname', hostname]);
        const { filenameToInfo } = Store.openStore(ns, INSTALL_DATA_STORE).load();
        ns.scp(Object.keys(filenameToInfo), hostname);
      }

      if (!report.allServers.includes(hostname)) {
        report.allServers.push(hostname);
      }
      log.info('set up server', ['hostname', ['hasRootAccess', serverInfo.unstable.hasRootAccess]]);
    }

    report.serversNotVisited = report.allServers.filter(
      (hostname) => !(hostname in report.serverToServerInfo),
    );

    log.info('Refreshing install data from home');
    const saveLibPid = await runCallableAndWait({ ns, callableDefinition: SAVE_LIB_CALLABLE });
    if (!saveLibPid) {
      throw createNiceError('sniff: failed to run save-lib');
    }

    log.info('Updating reports');
    store.write(report);
    // TODO(dmayor): We need a better way of sharing shared state like this
    for (const host of Object.keys(report.serverToServerInfo)) {
      log.debug('Pushing network report to host', ['hostname', host]);
      ns.scp(NETWORK_REPORT_STORE.location.path, host);
    }

    ns.toast('finished sniffing network');
    await ns.sleep(10_000);
  }
});
