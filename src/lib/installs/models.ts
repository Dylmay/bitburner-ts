import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { guard, typeIs } from 'lib/utils/typeGuard';

export const LIB_FOLDER = 'lib';
export const BIN_FOLDER = 'bin';
export const FILES_LOCK = 'lib/.files.lock.txt';

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

export const SAVE_LIB_CALLABLE: TypedCallableDefinition<void> = {
  scriptPath: 'lib/installs/saveLib.ts',
};
