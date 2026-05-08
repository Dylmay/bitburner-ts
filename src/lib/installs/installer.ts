import { Logger } from 'lib/utils/logging/logger';
import { LIB_FILES_LOCK, installDataGuard } from 'lib/installs/models';
import * as files from 'lib/utils/files';

export const installLib = (ns: NS, hostname: string, log: Logger) => {
  const filesToWrite = files.loadJson(ns, LIB_FILES_LOCK, installDataGuard);

  log.info('Installing lib from lock', ['files', filesToWrite.filenames]);
  ns.scp(filesToWrite.filenames, hostname);
};
