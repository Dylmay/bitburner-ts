import { AnyCallableDefinition, typedMain } from 'lib/callables/typedCallable';
import { runCallableAndWait } from 'lib/callables/runAndWait';
import {
  CONTRACT_INFO_CALLABLE,
  CONTRACT_GET_TYPE_CALLABLE,
  CONTRACT_GET_DESC_CALLABLE,
  CONTRACT_GET_DATA_CALLABLE,
  CONTRACT_GET_TRIES_CALLABLE,
  ContractInfoSubArgs,
  buildCachePath,
} from 'bin/commands/contract/models';

type ContractInfoCache = {
  type?: string;
  description?: string;
  data?: unknown;
  tries?: number;
};

const readCache = (ns: NS, cachePath: string): ContractInfoCache => {
  const raw = ns.read(cachePath);
  return raw ? (JSON.parse(raw) as ContractInfoCache) : {};
};

export const main = typedMain(CONTRACT_INFO_CALLABLE, async ({ ns }, args) => {
  if (!args) {
    ns.alert('No contract specified.');
    return;
  }

  const { hostname, filepath } = args;
  const cachePath = buildCachePath(hostname, filepath);
  const subArgs: ContractInfoSubArgs = { hostname, filepath, cachePath };

  const runStep = async (callableDefinition: AnyCallableDefinition) => {
    const pid = await runCallableAndWait({ ns, callableDefinition, args: subArgs });
    if (pid === undefined) {
      throw new Error(`Failed to start callable: ${callableDefinition.scriptPath.path}`);
    }
  };

  let cache = readCache(ns, cachePath);

  if (!cache.type) {
    await runStep(CONTRACT_GET_TYPE_CALLABLE);
  }

  if (!cache.description) {
    await runStep(CONTRACT_GET_DESC_CALLABLE);
  }

  if (cache.data === undefined) {
    await runStep(CONTRACT_GET_DATA_CALLABLE);
  }

  await runStep(CONTRACT_GET_TRIES_CALLABLE);

  cache = readCache(ns, cachePath);

  ns.alert(
    `[${hostname}:${filepath}]\nType: ${cache.type}\nTries remaining: ${cache.tries}\n\n${cache.description}\n\nData:\n${JSON.stringify(cache.data, null, 2)}`,
  );
});
