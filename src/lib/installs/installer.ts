import { Logger } from 'lib/utils/logging/logger';
import { INSTALL_DATA_STORE } from 'lib/installs/models';
import { Store } from 'lib/stores/store';

export const installLib = (ns: NS, hostname: string, log: Logger) => {
  const { filenameToInfo } = Store.openStore(ns, INSTALL_DATA_STORE).load();

  const filenames = Object.keys(filenameToInfo);
  log.info('Installing lib from lock', ['files', filenames]);
  ns.scp(filenames, hostname);
};
