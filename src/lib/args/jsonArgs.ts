import { guard, typeIs, Guard, cast } from 'lib/utils/typeGuard';
import { InternalServerCrawlerArgs } from 'lib/crawler/models';
import { CallableOptions } from 'lib/callables/typedCallable';
import { createNiceError } from 'lib/utils/errors';

const JSON_ARG_POS = 0;

type JsonArgs<T> = {
  argType: 'json';
  args: T | undefined;
  crawlerArgs?: InternalServerCrawlerArgs;
  callableOptions?: CallableOptions;
};

export const validateAndParseJsonArgs = <T>(
  ns: NS,
  typeValidator: Guard<unknown, T>,
): T | undefined => cast(parseJsonArgs(ns), typeValidator);

const parseJsonArgsEnvelope = (ns: NS): JsonArgs<unknown> | undefined => {
  const maybeJsonArg = ns.args.at(JSON_ARG_POS);

  if (maybeJsonArg === undefined) {
    return;
  }

  if (!typeIs(maybeJsonArg, 'string')) {
    throw createNiceError('Arg passed is not a json arg', ['arg', maybeJsonArg]);
  }

  const json: unknown = JSON.parse(maybeJsonArg);

  return cast(json, jsonArgGuard);
};

export const parseJsonArgs = (ns: NS): unknown | undefined => parseJsonArgsEnvelope(ns)?.args;

export const parseCrawlerJsonArgs = (ns: NS): InternalServerCrawlerArgs | undefined =>
  parseJsonArgsEnvelope(ns)?.crawlerArgs;

export const parseJsonArgsCallableOptions = (ns: NS): CallableOptions | undefined =>
  parseJsonArgsEnvelope(ns)?.callableOptions;

export const toJsonArgs = <T>(
  args: T | undefined,
  crawlerArgs?: InternalServerCrawlerArgs,
  callableOptions?: CallableOptions,
): string => {
  const wrappedArgs: JsonArgs<T> = {
    argType: 'json',
    args: args,
    ...(crawlerArgs !== undefined && { crawlerArgs }),
    ...(callableOptions !== undefined && { callableOptions }),
  };

  return JSON.stringify(wrappedArgs);
};

const jsonArgGuard = guard(
  (json: unknown): json is JsonArgs<unknown> =>
    typeIs(json, Object) &&
    'argType' in json &&
    typeIs(json.argType, 'string') &&
    json.argType === 'json',
);
