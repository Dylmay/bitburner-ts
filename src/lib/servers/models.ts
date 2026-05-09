import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { StoreDef } from 'lib/stores/store';
import { pathOf } from 'lib/utils/files/paths';
import { guard, typeIs } from 'lib/utils/typeGuard';

export const RUN_FOLDER = 'hacked';
export const LATEST_RUN_FILENAME = RUN_FOLDER + '/' + 'latest-run.txt';

export type RunLock = string;

export type RunLockFile = {
  lock: RunLock;
};

export const runLockFileGuard = guard(
  (arg: unknown): arg is RunLockFile =>
    typeIs(arg, Object) && 'lock' in arg && typeIs(arg.lock, 'string'),
);

export type RunInfo = {
  serverName: string;
  serversConnectedTo: string[];
  serverFailures: string[];
  moneyAvailable: number;
};

export const runInfoGuard = guard(
  (arg: unknown): arg is RunInfo =>
    typeIs(arg, Object) &&
    'serverName' in arg &&
    typeIs(arg.serverName, 'string') &&
    'serversConnectedTo' in arg &&
    'serverFailures' in arg &&
    'moneyAvailable' in arg &&
    typeIs(arg.moneyAvailable, 'number'),
);

export type UnstableServerInfo = {
  files: string[];
  moneyAvailable: number;
  securityLevel: number;
  hasRootAccess: boolean;
};

// export type StringDate = {
//   __type: 'stringDate';
//   date: string;
// };

export type ServerInfo = {
  hostname: string;
  ip: string | undefined;
  ram: number;
  connectableServers: string[];
  maxMoney: number;
  minSecurityLevel: number;
  baseSecurityLevel: number;
  growthLevel: number;
  requiredHackingLevel: number;
  unstable: UnstableServerInfo;
  // collectedAt: StringDate;
};

export const serverInfoGuard = guard((arg: unknown): arg is ServerInfo => {
  if (!typeIs(arg, Object)) return false;
  if (!('hostname' in arg) || !typeIs(arg.hostname, 'string')) return false;
  if ('ip' in arg && !typeIs(arg.ip, 'string')) return false;
  if (!('ram' in arg) || !typeIs(arg.ram, 'number')) return false;
  if (!('connectableServers' in arg) || !Array.isArray(arg.connectableServers)) return false;
  if (!('maxMoney' in arg) || !typeIs(arg.maxMoney, 'number')) return false;
  if (!('minSecurityLevel' in arg) || !typeIs(arg.minSecurityLevel, 'number')) return false;
  if (!('baseSecurityLevel' in arg) || !typeIs(arg.baseSecurityLevel, 'number')) return false;
  if (!('unstable' in arg) || !typeIs(arg.unstable, Object)) return false;
  if (!('growthLevel' in arg) || !typeIs(arg.growthLevel, 'number')) return false;
  if (!('requiredHackingLevel' in arg) || !typeIs(arg.requiredHackingLevel, 'number')) return false;

  const { unstable } = arg;
  if (!('files' in unstable) || !Array.isArray(unstable.files)) return false;
  if (!('moneyAvailable' in unstable) || !typeIs(unstable.moneyAvailable, 'number')) return false;
  if (!('securityLevel' in unstable) || !typeIs(unstable.securityLevel, 'number')) return false;
  if (!('hasRootAccess' in unstable) || !typeIs(unstable.hasRootAccess, 'boolean')) return false;
  return true;
});

export const SERVER_INFO_STORE: StoreDef<ServerInfo> = {
  location: pathOf('info/server.json'),
  loadGuard: serverInfoGuard,
};

export type GetServerInfoOutputPortArgs = {
  host: string;
  serverInfo: ServerInfo;
};

const getServerInfoOutputPortGuard = guard(
  (arg: unknown): arg is GetServerInfoOutputPortArgs =>
    typeIs(arg, Object) &&
    'host' in arg &&
    typeIs(arg.host, 'string') &&
    'serverInfo' in arg &&
    typeIs(arg.serverInfo, serverInfoGuard),
);

export const GET_SERVER_INFO_CALLABLE: TypedCallableDefinition<void, GetServerInfoOutputPortArgs> =
  {
    scriptPath: pathOf('lib/servers/getServerInfo.ts'),
    outputPort: {
      port: 2346,
      guard: getServerInfoOutputPortGuard,
    },
  };
