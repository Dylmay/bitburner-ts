import { Path } from 'lib/utils/files/paths';

const VALID_SCRIPT_SUFFIX = ['.js', '.jsx', '.ts', '.tsx'];

export const isScript = (path: Path): boolean =>
  VALID_SCRIPT_SUFFIX.find((scriptSuffix) => path.path.endsWith(scriptSuffix)) !== undefined;
