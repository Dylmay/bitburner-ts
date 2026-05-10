import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { ServerInfo, UnstableServerInfo, serverInfoGuard } from 'lib/servers/models';
import { createTempPath, Path } from 'lib/utils/files/paths';
import * as files from 'lib/utils/files/files';
import { BUILD_SERVER_INFO_STEPS, BUILD_UNSTABLE_STEPS, BuilderArgs } from 'lib/servers/steps/models';

export const buildServerInfoLocally = async (
  ns: NS,
  targetHost: string,
  executor: (
    callableDefinition: TypedCallableDefinition<BuilderArgs>,
    args: BuilderArgs,
  ) => Promise<void>,
): Promise<[ServerInfo, Path]> => {
  const tempPath = createTempPath();

  files.writeJson(ns, tempPath, { hostname: targetHost });

  // TODO(dmayor): tidy up server info building
  for (const step of BUILD_SERVER_INFO_STEPS.slice(1, -1)) {
    await executor(step, { outputPath: tempPath });
  }

  return [files.loadJson(ns, tempPath, serverInfoGuard), tempPath];
};

export const buildUnstableServerInfoLocally = async (
  ns: NS,
  existingServerInfo: ServerInfo,
  executor: (
    callableDefinition: TypedCallableDefinition<BuilderArgs>,
    args: BuilderArgs,
  ) => Promise<void>,
): Promise<[UnstableServerInfo, Path]> => {
  const tempPath = createTempPath();

  files.writeJson(ns, tempPath, existingServerInfo);

  for (const step of BUILD_UNSTABLE_STEPS) {
    await executor(step, { outputPath: tempPath });
  }

  return [files.loadJson(ns, tempPath, serverInfoGuard).unstable, tempPath];
};
