import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { StoreDef } from 'lib/stores/store';
import { pathOf } from 'lib/utils/paths';
import { guard, typeIs } from 'lib/utils/typeGuard';

export const LIB_FOLDER = 'lib';
export const BIN_FOLDER = 'bin';

export type FileInfo = {
  ramUsage: number | undefined;
};

export type InstallData = {
  filenameToInfo: Record<string, FileInfo>;
};

export const installDataGuard = guard(
  (arg: unknown): arg is InstallData =>
    typeIs(arg, Object) && 'filenameToInfo' in arg && typeIs(arg.filenameToInfo, Object),
);

export const INSTALL_DATA_STORE: StoreDef<InstallData> = {
  location: pathOf('lib/.files.lock.json'),
  loadGuard: installDataGuard,
};

export const SAVE_LIB_CALLABLE: TypedCallableDefinition<void> = {
  scriptPath: pathOf('lib/installs/saveLib.ts'),
};
