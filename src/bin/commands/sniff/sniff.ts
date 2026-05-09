import { typedMain } from 'lib/callables/typedCallable';
import { NETWORK_REPORT_STORE } from 'lib/reports/models';
import { Store } from 'lib/stores/store';
import { buildServerInfoLocally } from 'lib/servers/buildServerInfoLocal';
import { runCallableAndWait } from 'lib/callables/runAndWait';
import { createNiceError } from 'lib/utils/errors';
import { SNIFF_COMMAND_CALLABLE } from 'bin/commands/sniff/models';
import { INFIL_HOST_CALLABLE } from 'lib/scripts/models';

export const main = typedMain(SNIFF_COMMAND_CALLABLE, async ({ ns }) => {
  const store = Store.openStore(ns, NETWORK_REPORT_STORE);
  while (true) {
    const report = store.load();

    const toSniff = new Set(
      Object.values(report.serverToServerInfo).flatMap((info) => info.connectableServers),
    )
      .keys()
      .toArray();

    for (const hostname of toSniff) {
      const serverInfo = await buildServerInfoLocally(ns, hostname, async (step, args) => {
        const pid = await runCallableAndWait({ ns, callableDefinition: step, args });
        if (!pid) {
          throw createNiceError('sniff: build step failed', ['hostname', hostname], ['step', step]);
        }
      });

      report.serverToServerInfo[hostname] = serverInfo;

      if (!serverInfo.unstable.hasRootAccess) {
        const pid = await runCallableAndWait({
          ns,
          callableDefinition: INFIL_HOST_CALLABLE,
          args: { hostname },
        });
        if (!pid) {
          throw createNiceError('unable to start infil');
        }
      }

      if (!report.allServers.includes(hostname)) {
        report.allServers.push(hostname);
      }
    }

    report.serversNotVisited = report.allServers.filter(
      (hostname) => !(hostname in report.serverToServerInfo),
    );

    store.write(report);

    await ns.sleep(10_000);
  }
});
