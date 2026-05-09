import { Path, pathOf } from 'lib/utils/files/paths';

export const listFiles = (ns: NS, host: string, subPath: Path): Path[] =>
  ns.ls(host, subPath.path).map((filename) => pathOf(filename));
