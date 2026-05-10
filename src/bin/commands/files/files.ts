import { typedMain } from 'lib/callables/typedCallable';
import { NETWORK_REPORT_STORE } from 'lib/reports/models';
import { Store } from 'lib/stores/store';
import { FILES_CALLABLE } from 'bin/commands/files/models';

const matchesExt = (filepath: string, ext: string): boolean =>
  filepath.endsWith(ext.startsWith('.') ? ext : `.${ext}`);

const filterFiles = (
  files: string[],
  search: string | undefined,
  fileType: string | undefined,
  notFileType: string | undefined,
): string[] => {
  return files.filter((f) => {
    if (fileType && !matchesExt(f, fileType)) return false;
    if (notFileType && matchesExt(f, notFileType)) return false;
    if (search && !f.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
};

export const main = typedMain(FILES_CALLABLE, async ({ ns }, args) => {
  const networkReportStore = Store.openStore(ns, NETWORK_REPORT_STORE);
  const { serverToServerInfo } = networkReportStore.load();

  if (!args || args.action === 'ls') {
    const search = args?.search;
    const fileType = args?.fileType;
    const notFileType = args?.notFileType;

    const sections = Object.entries(serverToServerInfo)
      .map(([hostname, serverInfo]) => {
        const matched = filterFiles(serverInfo.unstable.files, search, fileType, notFileType);
        return { hostname, files: matched };
      })
      .filter(({ files }) => files.length > 0);

    if (sections.length === 0) {
      ns.alert('No files found matching the given filters.');
      return;
    }

    const output = sections
      .map(({ hostname, files }) => `[${hostname}]\n${files.map((f) => `  ${f}`).join('\n')}`)
      .join('\n\n');

    ns.alert(output);
    return;
  }

  // cat
  const { fuzzyPath, host } = args;

  const allFiles: { hostname: string; filepath: string }[] = Object.entries(serverToServerInfo)
    .filter(([hostname]) => !host || hostname === host)
    .flatMap(([hostname, serverInfo]) =>
      serverInfo.unstable.files.map((filepath) => ({ hostname, filepath })),
    );

  const matches = allFiles.filter(({ filepath }) =>
    filepath.toLowerCase().includes(fuzzyPath.toLowerCase()),
  );

  if (matches.length === 0) {
    ns.alert(`No files found matching: ${fuzzyPath}${host ? ` on ${host}` : ''}`);
    return;
  }

  if (matches.length > 1) {
    const list = matches.map(({ hostname, filepath }) => `  [${hostname}] ${filepath}`).join('\n');
    ns.alert(`Multiple matches — be more specific:\n${list}`);
    return;
  }

  const match = matches[0]!;
  const { hostname: sourceHost, filepath } = match;

  if (filepath.endsWith('.cct')) {
    ns.alert(`[${sourceHost}:${filepath}]\n\n(coding contracts cannot be read)`);
    return;
  }

  if (sourceHost !== ns.getHostname()) {
    ns.scp(filepath, ns.getHostname(), sourceHost);
  }

  const contents = ns.read(filepath);
  ns.alert(`[${sourceHost}:${filepath}]\n\n${contents}`);
});
