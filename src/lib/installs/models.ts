import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { guard, typeIs } from 'lib/utils/typeGuard';

export const LIB_FOLDER = 'lib';
export const LIB_FILES_LOCK = 'lib/.files.lock.txt';

export type FileInfo = {
  ramUsage: string;
};

export type InstallData = {
  filenames: string[];
};

export const installDataGuard = guard(
  (arg: unknown): arg is InstallData => typeIs(arg, Object) && 'filenames' in arg,
);

export const SAVE_LIB_CALLABLE: TypedCallableDefinition<void> = {
  scriptPath: 'lib/installs/saveLib.ts',
};
