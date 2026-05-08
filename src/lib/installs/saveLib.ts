import * as files from 'lib/utils/files';
import {
  FileInfo,
  InstallData,
  FILES_LOCK,
  LIB_FOLDER,
  SAVE_LIB_CALLABLE,
  BIN_FOLDER,
} from 'lib/installs/models';
import { typedMain } from 'lib/callables/typedCallable';

const FOLDERS_TO_SYNC = [LIB_FOLDER, BIN_FOLDER];

export const main = typedMain(SAVE_LIB_CALLABLE, async ({ ns }) => {
  const filenames = FOLDERS_TO_SYNC.flatMap((folder) => ns.ls('home', folder));

  const filenameToInfo: Record<string, FileInfo> = {};
  for (const filename of filenames) {
    const ramUsage = filename.endsWith('.ts') ? ns.getScriptRam(filename) : undefined;

    const fileInfo: FileInfo = {
      ramUsage,
    };

    filenameToInfo[filename] = fileInfo;
  }

  const installData: InstallData = {
    filenameToInfo,
  };

  files.writeJson(ns, FILES_LOCK, installData);
});
