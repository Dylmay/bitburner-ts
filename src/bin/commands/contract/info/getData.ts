import { typedMain } from 'lib/callables/typedCallable';
import { CONTRACT_GET_DATA_CALLABLE } from 'bin/commands/contract/models';

export const main = typedMain(CONTRACT_GET_DATA_CALLABLE, async ({ ns }, args) => {
  if (!args) return;

  const { hostname, filepath, cachePath } = args;

  const raw = ns.read(cachePath);
  const cache = raw ? JSON.parse(raw) : {};

  cache.data = ns.codingcontract.getData(filepath, hostname);

  ns.write(cachePath, JSON.stringify(cache), 'w');
});
