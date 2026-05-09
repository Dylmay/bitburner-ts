import { cast, Guard } from 'lib/utils/typeGuard';
import { createNiceErrorWithCause } from 'lib/utils/errors';
import { Path } from 'lib/utils/files/paths';

export const LOG_NAME = 'logger.ts';

export const writeJson = <T extends object>(ns: NS, { path }: Path, data: T) => {
  const stringifiedData = JSON.stringify(data, null, 2);

  ns.write(path, stringifiedData, 'w');
};

export const append = <T>(ns: NS, { path }: Path, data: T) => {
  const stringifiedData = typeof data === 'string' ? data : JSON.stringify(data);

  ns.write(path, stringifiedData, 'a');
};

export const loadJson = <T extends object>(ns: NS, { path }: Path, guard: Guard<unknown, T>): T => {
  const loadedData = ns.read(path);

  try {
    return cast(JSON.parse(loadedData) as unknown, guard);
  } catch (exc) {
    throw createNiceErrorWithCause(exc, 'failed to load data', ['path', path]);
  }
};

export const tryLoadJson = <T extends object>(
  ns: NS,
  path: Path,
  guard: Guard<unknown, T>,
): T | undefined => {
  try {
    return loadJson(ns, path, guard);
  } catch {
    return undefined;
  }
};

export const clone = ({
  ns,
  path: { path },
  outputPath: { path: outputPath },
}: {
  ns: NS;
  path: Path;
  outputPath: Path;
}) => {
  const rawData = ns.read(path);
  ns.write(outputPath, rawData, 'w');
};
