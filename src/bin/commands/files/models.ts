import { CommandFor } from 'bin/commands/models';
import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { pathOf } from 'lib/utils/files/paths';
import { flag, parseFlags } from 'lib/utils/flags';

type LsArgs = {
  action: 'ls';
  search: string | undefined;
  fileType: string | undefined;
  notFileType: string | undefined;
};

type CatArgs = {
  action: 'cat';
  fuzzyPath: string;
  host: string | undefined;
};

export type FilesArgs = LsArgs | CatArgs;

const filesFlags = {
  type: flag.string({ desc: 'Only show files with this extension (e.g. js, txt)' }),
  notType: flag.string({ desc: 'Exclude files with this extension (e.g. js, txt)' }),
} as const;

export const FILES_CALLABLE: TypedCallableDefinition<FilesArgs> = {
  scriptPath: pathOf('bin/commands/files/files.ts'),
};

export type FilesCommand = { command: 'files' };

export const filesCommand: CommandFor<typeof FILES_CALLABLE> & FilesCommand = {
  command: 'files',
  description: 'List or read files across the network',
  definition: FILES_CALLABLE,
  flags: filesFlags,
  parseArgs: (args): FilesArgs => {
    const action = args[0];
    const rest = args.slice(1);

    if (action === 'cat') {
      const positionals = rest.filter((a) => typeof a === 'string') as string[];
      return {
        action: 'cat',
        fuzzyPath: String(positionals[0] ?? ''),
        host: positionals[1] ?? undefined,
      };
    }

    const { flags, rest: positionals } = parseFlags(rest, filesFlags);
    return {
      action: 'ls',
      search: positionals[0] ? String(positionals[0]) : undefined,
      fileType: flags.type,
      notFileType: flags.notType,
    };
  },
};
