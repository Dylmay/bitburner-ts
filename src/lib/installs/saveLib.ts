import {
  FileInfo,
  LIB_FOLDER,
  SAVE_LIB_CALLABLE,
  BIN_FOLDER,
  INSTALL_DATA_STORE,
} from 'lib/installs/models';
import { typedMain } from 'lib/callables/typedCallable';
import { Store } from 'lib/stores/store';
import { listFiles } from 'lib/utils/files/listFiles';
import { getScriptRam } from 'lib/utils/files/getScriptRam';

const FOLDERS_TO_SYNC = [LIB_FOLDER, BIN_FOLDER];

export const main = typedMain(SAVE_LIB_CALLABLE, async ({ ns, log }) => {
  const filePaths = FOLDERS_TO_SYNC.flatMap((folder) => listFiles(ns, 'home', folder));

  const installDataStore = Store.openStore(ns, INSTALL_DATA_STORE);

  const filenameToInfo: Record<string, FileInfo> = {};
  for (const filePath of filePaths) {
    const ramUsage = getScriptRam(ns, filePath);

    filenameToInfo[filePath.path] = { ramUsage };
  }

  log.debug('writing to store', ['filenameToInfo', filenameToInfo]);
  installDataStore.write({
    filenameToInfo,
  });
});
