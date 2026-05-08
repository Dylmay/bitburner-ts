import { Logger } from 'lib/utils/logging/logger';
import { FILES_LOCK, installDataGuard } from 'lib/installs/models';
import * as files from 'lib/utils/files';

export const installLib = (ns: NS, hostname: string, log: Logger) => {
  const filesToWrite = files.loadJson(ns, FILES_LOCK, installDataGuard);

  const filenames = Object.keys(filesToWrite.filenameToInfo);
  log.info('Installing lib from lock', ['files', files]);
  ns.scp(filenames, hostname);
};
