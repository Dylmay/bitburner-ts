import { TypedCallableDefinition } from 'lib/callables/typedCallable';
import { StoreDef } from 'lib/stores/store';
import { pathOf } from 'lib/utils/files/paths';
import { objectGuard, optional, array } from 'lib/utils/typeGuard';

export const RUN_FOLDER = 'hacked';
export const LATEST_RUN_FILENAME = RUN_FOLDER + '/' + 'latest-run.txt';

export type RunLock = string;

export type RunLockFile = {
  lock: RunLock;
};

export const runLockFileGuard = objectGuard<RunLockFile>({ lock: 'string' });

export type RunInfo = {
  serverName: string;
  serversConnectedTo: string[];
  serverFailures: string[];
  moneyAvailable: number;
};

export const runInfoGuard = objectGuard<RunInfo>({
  serverName: 'string',
  serversConnectedTo: array(),
  serverFailures: array(),
  moneyAvailable: 'number',
});

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

export const serverInfoGuard = objectGuard<ServerInfo>({
  hostname: 'string',
  ip: optional('string'),
  ram: 'number',
  connectableServers: array(),
  maxMoney: 'number',
  minSecurityLevel: 'number',
  baseSecurityLevel: 'number',
  growthLevel: 'number',
  requiredHackingLevel: 'number',
  unstable: objectGuard<UnstableServerInfo>({
    files: array(),
    moneyAvailable: 'number',
    securityLevel: 'number',
    hasRootAccess: 'boolean',
  }),
});

export const SERVER_INFO_STORE: StoreDef<ServerInfo> = {
  location: pathOf('info/server.json'),
  loadGuard: serverInfoGuard,
};

export type GetServerInfoOutputPortArgs = {
  host: string;
  serverInfo: ServerInfo;
};

const getServerInfoOutputPortGuard = objectGuard<GetServerInfoOutputPortArgs>({
  host: 'string',
  serverInfo: serverInfoGuard,
});

export const GET_SERVER_INFO_CALLABLE: TypedCallableDefinition<void, GetServerInfoOutputPortArgs> =
  {
    scriptPath: pathOf('lib/servers/getServerInfo.ts'),
    outputPort: {
      port: 2346,
      guard: getServerInfoOutputPortGuard,
    },
  };
