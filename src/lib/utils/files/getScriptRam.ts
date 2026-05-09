import { isScript } from 'lib/utils/files/fileTypes';
import { Path } from 'lib/utils/files/paths';

export const getScriptRam = (ns: NS, scriptPath: Path): number | undefined => {
  if (!isScript(scriptPath)) {
    return undefined;
  }

  const scriptRam = ns.getScriptRam(scriptPath.path);

  return scriptRam === 0 ? undefined : scriptRam;
};
