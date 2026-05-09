import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { StoreDef } from 'lib/stores/store';
import { pathOf } from 'lib/utils/files/paths';
import { objectGuard } from 'lib/utils/typeGuard';

export const LIB_FOLDER = pathOf('lib/');
export const BIN_FOLDER = pathOf('bin/');

export type FileInfo = {
  ramUsage: number | undefined;
};

export type InstallData = {
  filenameToInfo: Record<string, FileInfo>;
};

export const installDataGuard = objectGuard<InstallData>({
  filenameToInfo: Object,
});

export const INSTALL_DATA_STORE: StoreDef<InstallData> = {
  location: pathOf('lib/.files.lock.json'),
  loadGuard: installDataGuard,
};

export const SAVE_LIB_CALLABLE: TypedCallableDefinition<void> = {
  scriptPath: pathOf('lib/installs/saveLib.ts'),
};
