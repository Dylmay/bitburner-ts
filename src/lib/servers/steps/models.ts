import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { Path, pathOf } from 'lib/utils/files/paths';

export type BuilderArgs = {
  outputPath: Path;
};

export const SET_HOSTNAME_CALLABLE: TypedCallableDefinition<BuilderArgs> = {
  scriptPath: pathOf('lib/servers/steps/setHostname.ts'),
};

export const SET_IP_CALLABLE: TypedCallableDefinition<BuilderArgs> = {
  scriptPath: pathOf('lib/servers/steps/setIp.ts'),
};

export const SET_RAM_CALLABLE: TypedCallableDefinition<BuilderArgs> = {
  scriptPath: pathOf('lib/servers/steps/setRam.ts'),
};

export const SET_CONNECTABLE_SERVERS_CALLABLE: TypedCallableDefinition<BuilderArgs> = {
  scriptPath: pathOf('lib/servers/steps/setConnectableServers.ts'),
};

export const SET_MAX_MONEY_CALLABLE: TypedCallableDefinition<BuilderArgs> = {
  scriptPath: pathOf('lib/servers/steps/setMaxMoney.ts'),
};

export const SET_MIN_SECURITY_LEVEL_CALLABLE: TypedCallableDefinition<BuilderArgs> = {
  scriptPath: pathOf('lib/servers/steps/setMinSecurityLevel.ts'),
};

export const SET_BASE_SECURITY_LEVEL_CALLABLE: TypedCallableDefinition<BuilderArgs> = {
  scriptPath: pathOf('lib/servers/steps/setBaseSecurityLevel.ts'),
};

export const SET_FILES_CALLABLE: TypedCallableDefinition<BuilderArgs> = {
  scriptPath: pathOf('lib/servers/steps/setFiles.ts'),
};

export const SET_MONEY_AVAILABLE_CALLABLE: TypedCallableDefinition<BuilderArgs> = {
  scriptPath: pathOf('lib/servers/steps/setMoneyAvailable.ts'),
};

export const SET_SECURITY_LEVEL_CALLABLE: TypedCallableDefinition<BuilderArgs> = {
  scriptPath: pathOf('lib/servers/steps/setSecurityLevel.ts'),
};

export const SET_GROWTH_LEVEL_CALLABLE: TypedCallableDefinition<BuilderArgs> = {
  scriptPath: pathOf('lib/servers/steps/setGrowthLevel.ts'),
};

export const SET_REQUIRED_HACKING_LEVEL_CALLABLE: TypedCallableDefinition<BuilderArgs> = {
  scriptPath: pathOf('lib/servers/steps/setRequiredHackingLevel.ts'),
};

export const HAS_ROOT_ACCESS_CALLABLE: TypedCallableDefinition<BuilderArgs> = {
  scriptPath: pathOf('lib/servers/steps/hasRootAccess.ts'),
};

export const ASSEMBLE_CALLABLE: TypedCallableDefinition<BuilderArgs> = {
  scriptPath: pathOf('lib/servers/steps/assemble.ts'),
};

export const BUILD_UNSTABLE_STEPS: TypedCallableDefinition<BuilderArgs>[] = [
  SET_FILES_CALLABLE,
  SET_MONEY_AVAILABLE_CALLABLE,
  SET_SECURITY_LEVEL_CALLABLE,
  HAS_ROOT_ACCESS_CALLABLE,
];

export const BUILD_SERVER_INFO_STEPS: TypedCallableDefinition<BuilderArgs>[] = [
  SET_HOSTNAME_CALLABLE,
  SET_IP_CALLABLE,
  SET_RAM_CALLABLE,
  SET_CONNECTABLE_SERVERS_CALLABLE,
  SET_MAX_MONEY_CALLABLE,
  SET_MIN_SECURITY_LEVEL_CALLABLE,
  SET_BASE_SECURITY_LEVEL_CALLABLE,
  SET_GROWTH_LEVEL_CALLABLE,
  SET_REQUIRED_HACKING_LEVEL_CALLABLE,
  SET_FILES_CALLABLE,
  SET_MONEY_AVAILABLE_CALLABLE,
  SET_SECURITY_LEVEL_CALLABLE,
  HAS_ROOT_ACCESS_CALLABLE,
  ASSEMBLE_CALLABLE,
];
