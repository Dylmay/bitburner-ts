import { AnyCallableDefinition, TypedCallableDefinition } from 'lib/callables/typedCallable';

export type ExecCommand = {
  command: 'exec';
};

export type ExecArgs = {
  definition: AnyCallableDefinition;
  processArgs?: unknown;
  hostToExecTo: string;
};

export const EXEC_CALLABLE: TypedCallableDefinition<ExecArgs> = {
  scriptPath: 'lib/exec/exec.ts',
};
