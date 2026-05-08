import { typeIs, tryCast, guard } from 'lib/utils/typeGuard';
import { createNiceError } from 'lib/utils/errors';
import { ActionType, HACK_CRAWLER_CALLABLE } from 'lib/scripts/models';
import { CommandFor } from 'bin/commands/models';

export type HackCommand = {
  command: 'hack';
};

export const hackCommand: CommandFor<typeof HACK_CRAWLER_CALLABLE> & HackCommand = {
  command: 'hack',
  description: 'Collect/grow/weaken money from nodes - hack spin|hack|grow|weaken [host]',
  definition: HACK_CRAWLER_CALLABLE,
  parseArgs: ([actionArg, targetArg]) => {
    const action = tryCast(actionArg, hackActionGuard);
    if (!action)
      throw createNiceError(
        'hack: invalid action',
        ['available', validHackActions],
        ['got', actionArg],
      );
    if (targetArg !== undefined && !typeIs(targetArg, 'string'))
      throw createNiceError('hack: expected string hostname', ['got', targetArg]);

    return {
      action,
      ...(typeIs(targetArg, 'string') ? { target: targetArg } : {}),
    };
  },
};

export const validHackActions = [
  'grow',
  'weaken',
  'hack',
  'spin',
] as const satisfies readonly ActionType[];

export const hackActionGuard = guard(
  (action: ScriptArg): action is ActionType =>
    typeIs(action, 'string') && (validHackActions as readonly string[]).includes(action),
);
