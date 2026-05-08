export type ErrorArg = [string, unknown];

export const createNiceErrorWithCause = (cause: unknown, message: string, ...args: ErrorArg[]): Error => new Error(formatError(message, args), { cause });

export const createNiceError = (message: string, ...args: ErrorArg[]): Error => new Error(formatError(message, args));

const formatError = (message: string, args: ErrorArg[]): string => {
    const argsToPrint = args
      .map(([argName, argValue]) => ' |-{' + argName + ': ' + JSON.stringify(argValue) + '}')
      .reduce((a, b) => a + '\n' + b, '');

    return message + argsToPrint;
};
