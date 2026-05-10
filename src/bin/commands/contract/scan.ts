import { typedMain } from 'lib/callables/typedCallable';
import { runCallableAndWait } from 'lib/callables/runAndWait';
import { NETWORK_REPORT_STORE } from 'lib/reports/models';
import { CONTRACT_REPORT_STORE, ContractInfo } from 'lib/reports/contractModels';
import { Store } from 'lib/stores/store';
import { CONTRACT_SCAN_CALLABLE, CONTRACT_INFO_CALLABLE, buildCachePath } from 'bin/commands/contract/models';

export const main = typedMain(CONTRACT_SCAN_CALLABLE, async ({ ns, log }) => {
  const networkReportStore = Store.openStore(ns, NETWORK_REPORT_STORE);
  const contractReportStore = Store.openStore(ns, CONTRACT_REPORT_STORE);

  while (true) {
    const { serverToServerInfo } = networkReportStore.load();

    const allContracts = Object.entries(serverToServerInfo).flatMap(([hostname, serverInfo]) =>
      serverInfo.unstable.files
        .filter((f) => f.endsWith('.cct'))
        .map((filepath) => ({ hostname, filepath })),
    );

    log.info('Scanning contracts', ['count', allContracts.length]);

    for (const { hostname, filepath } of allContracts) {
      const pid = await runCallableAndWait({
        ns,
        callableDefinition: CONTRACT_INFO_CALLABLE,
        args: { hostname, filepath },
      });

      if (pid === undefined) {
        log.warn('Failed to run info callable', ['hostname', hostname], ['filepath', filepath]);
      }
    }

    const contracts: Record<string, ContractInfo> = {};

    for (const { hostname, filepath } of allContracts) {
      const cachePath = buildCachePath(hostname, filepath);
      const raw = ns.read(cachePath);

      if (!raw) continue;

      const info = JSON.parse(raw) as Partial<ContractInfo>;

      if (
        info.type &&
        info.description !== undefined &&
        info.data !== undefined &&
        info.tries !== undefined
      ) {
        const key = `${hostname}:${filepath}`;
        contracts[key] = {
          hostname,
          filepath,
          type: info.type,
          description: info.description,
          data: info.data,
          tries: info.tries,
        };
      }
    }

    contractReportStore.write({ contracts });
    log.info('Contract report written', ['count', Object.keys(contracts).length]);

    const allHosts = Object.keys(serverToServerInfo);

    for (const host of allHosts) {
      ns.scp(CONTRACT_REPORT_STORE.location.path, host);
    }

    await ns.sleep(10 * 60 * 1000);
  }
});
