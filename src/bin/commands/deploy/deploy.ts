import { typedMain } from 'lib/callables/typedCallable';
import { DEPLOY_COMMAND_CALLABLE } from 'bin/commands/deploy/models';
import { SAVE_LIB_CALLABLE, INSTALL_DATA_STORE } from 'lib/installs/models';
import { NETWORK_REPORT_STORE } from 'lib/reports/models';
import { Store } from 'lib/stores/store';
import { runCallableAndWait } from 'lib/callables/runAndWait';
import { createNiceError } from 'lib/utils/errors';

export const main = typedMain(DEPLOY_COMMAND_CALLABLE, async ({ ns, log }, args) => {
  const managedMode = args?.managed === undefined ? true : args.managed === 'managed';

  while (true) {
    log.info('Refreshing install data');
    const saveLibPid = await runCallableAndWait({ ns, callableDefinition: SAVE_LIB_CALLABLE });
    if (!saveLibPid) {
      throw createNiceError('deploy: failed to run save-lib');
    }

    const { filenameToInfo } = Store.openStore(ns, INSTALL_DATA_STORE).load();
    const report = Store.openStore(ns, NETWORK_REPORT_STORE).load();

    const libFiles = Object.keys(filenameToInfo);
    const hosts = Object.keys(report.serverToServerInfo).filter((h) => h !== 'home');

    log.info('Deploying library', ['fileCount', libFiles.length], ['hostCount', hosts.length]);

    for (const host of hosts) {
      log.debug('Copying lib to host', ['host', host]);
      ns.scp(libFiles, host, 'home');
    }

    log.info('Deployed library across all hosts');
    if (!managedMode) {
      break;
    }
    await ns.sleep(60_000);
  }
});
