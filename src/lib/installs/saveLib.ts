import * as files from 'lib/utils/files';
import { InstallData, LIB_FILES_LOCK, LIB_FOLDER, SAVE_LIB_CALLABLE } from 'lib/installs/models';
import { typedMain } from 'lib/callables/typedCallable';

export const main = typedMain(SAVE_LIB_CALLABLE, async ({ ns }) => {
  const filenames = ns.ls('home', LIB_FOLDER);

  const installData: InstallData = {
    filenames,
  };

  files.writeJson(ns, LIB_FILES_LOCK, installData);
});
