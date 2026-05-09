import { AnyCallableDefinition, TypedCallableDefinition } from 'lib/callables/typedCallable';
import { pathOf } from 'lib/utils/paths';

export type ExecCommand = {
  command: 'exec';
};

export type ExecArgs = {
  definition: AnyCallableDefinition;
  processArgs?: unknown;
  hostToExecTo: string;
};

export const EXEC_CALLABLE: TypedCallableDefinition<ExecArgs> = {
  scriptPath: pathOf('lib/exec/exec.ts'),
};
