import { typedMain } from 'lib/callables/typedCallable';
import { spawnCallable } from 'lib/callables/spawn';
import { NETWORK_REPORT_STORE } from 'lib/reports/models';
import { Store } from 'lib/stores/store';
import {
  CONTRACT_CALLABLE,
  CONTRACT_INFO_CALLABLE,
  CONTRACT_ATTEMPT_CALLABLE,
} from 'bin/commands/contract/models';

export const main = typedMain(CONTRACT_CALLABLE, async ({ ns }, args) => {
  const networkReportStore = Store.openStore(ns, NETWORK_REPORT_STORE);
  const { serverToServerInfo } = networkReportStore.load();

  const action = args?.action ?? 'ls';

  if (action === 'ls') {
    const search = args?.action === 'ls' ? args.search : undefined;

    const sections = Object.entries(serverToServerInfo)
      .map(([hostname, serverInfo]) => ({
        hostname,
        files: serverInfo.unstable.files
          .filter((f) => f.endsWith('.cct'))
          .filter((f) => !search || f.toLowerCase().includes(search.toLowerCase())),
      }))
      .filter(({ files }) => files.length > 0);

    if (sections.length === 0) {
      ns.alert('No coding contracts found.');
      return;
    }

    const output = sections
      .map(({ hostname, files }) => `[${hostname}]\n${files.map((f) => `  ${f}`).join('\n')}`)
      .join('\n\n');

    ns.alert(output);
    return;
  }

  if (action === 'types') {
    const types = ns.codingcontract.getContractTypes();
    ns.alert(`Available contract types:\n${types.map((t) => `  ${t}`).join('\n')}`);
    return;
  }

  const { fuzzyPath, host } = args as {
    action: 'info' | 'attempt';
    fuzzyPath: string;
    host: string | undefined;
  };

  const allCcts = Object.entries(serverToServerInfo)
    .filter(([hostname]) => !host || hostname === host)
    .flatMap(([hostname, serverInfo]) =>
      serverInfo.unstable.files
        .filter((f) => f.endsWith('.cct'))
        .map((filepath) => ({ hostname, filepath })),
    );

  const matches = allCcts.filter(({ filepath }) =>
    filepath.toLowerCase().includes(fuzzyPath.toLowerCase()),
  );

  if (matches.length === 0) {
    ns.alert(`No contracts found matching: ${fuzzyPath}${host ? ` on ${host}` : ''}`);
    return;
  }

  if (matches.length > 1) {
    const list = matches.map(({ hostname, filepath }) => `  [${hostname}] ${filepath}`).join('\n');
    ns.alert(`Multiple matches — be more specific:\n${list}`);
    return;
  }

  const match = matches[0]!;

  if (action === 'info') {
    spawnCallable({
      ns,
      callableDefinition: CONTRACT_INFO_CALLABLE,
      args: { hostname: match.hostname, filepath: match.filepath },
    });

    return;
  }

  const answer = args?.action === 'attempt' ? args.answer : '';

  spawnCallable({
    ns,
    callableDefinition: CONTRACT_ATTEMPT_CALLABLE,
    args: { hostname: match.hostname, filepath: match.filepath, answer },
  });
});
