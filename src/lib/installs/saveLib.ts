import {
  FileInfo,
  LIB_FOLDER,
  SAVE_LIB_CALLABLE,
  BIN_FOLDER,
  INSTALL_DATA_STORE,
} from 'lib/installs/models';
import { typedMain } from 'lib/callables/typedCallable';
import { Store } from 'lib/stores/store';

const FOLDERS_TO_SYNC = [LIB_FOLDER, BIN_FOLDER];

export const main = typedMain(SAVE_LIB_CALLABLE, async ({ ns }) => {
  const filenames = FOLDERS_TO_SYNC.flatMap((folder) => ns.ls('home', folder));

  const installDataStore = Store.openStore(ns, INSTALL_DATA_STORE);

  const filenameToInfo: Record<string, FileInfo> = {};
  for (const filename of filenames) {
    const ramUsage = filename.endsWith('.ts') ? ns.getScriptRam(filename) : undefined;

    const fileInfo: FileInfo = {
      ramUsage,
    };

    filenameToInfo[filename] = fileInfo;
  }

  installDataStore.write({
    filenameToInfo,
  });
});
