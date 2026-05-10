import { typedMain } from 'lib/callables/typedCallable';
import { CONTRACT_GET_TYPE_CALLABLE } from 'bin/commands/contract/models';

export const main = typedMain(CONTRACT_GET_TYPE_CALLABLE, async ({ ns }, args) => {
  if (!args) return;

  const { hostname, filepath, cachePath } = args;

  const raw = ns.read(cachePath);
  const cache = raw ? JSON.parse(raw) : {};

  cache.type = ns.codingcontract.getContractType(filepath, hostname);

  ns.write(cachePath, JSON.stringify(cache), 'w');
});
