import {
  RunInfo,
  RunLock,
  LATEST_RUN_FILENAME,
  getRunFolder,
  runInfoGuard,
  runLockFileGuard,
} from 'lib/servers/models';
import * as files from 'lib/utils/files';

export type LatestRunInfo = {
  lock: RunLock;
  runs: RunInfo[];
};

export const getLatestRun = (ns: NS): LatestRunInfo => {
  const { lock } = files.loadJson(ns, LATEST_RUN_FILENAME, runLockFileGuard);

  const hostname = ns.getHostname();

  const runs = ns
    .ls(hostname, getRunFolder(lock))
    .map((run) => files.loadJson(ns, run, runInfoGuard));

  return {
    lock,
    runs,
  };
};
