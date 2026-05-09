import { pathOf } from 'lib/utils/files/paths';
import { objectGuard, extendGuard, optional, array } from 'lib/utils/typeGuard';

export const SERVER_INFO_BUILDER_PATH = pathOf('info/builder.server.json');

export type ServerInfoBuilderHostname = {
  hostname: string;
};

export type ServerInfoBuilderIp = {
  ip?: string;
} & ServerInfoBuilderRequiredHackingLevel;

export type ServerInfoBuilderRam = {
  ram: number;
} & ServerInfoBuilderHostname;

export type ServerInfoBuilderConnectableServers = {
  connectableServers: string[];
} & ServerInfoBuilderRam;

export type ServerInfoBuilderMaxMoney = {
  maxMoney: number;
} & ServerInfoBuilderRam;

export type ServerInfoBuilderMinSecurityLevel = {
  minSecurityLevel: number;
} & ServerInfoBuilderMaxMoney;

export type ServerInfoBuilderBaseSecurityLevel = {
  baseSecurityLevel: number;
} & ServerInfoBuilderMinSecurityLevel;

export type ServerInfoBuilderGrowthLevel = {
  growthLevel: number;
} & ServerInfoBuilderBaseSecurityLevel;

export type ServerInfoBuilderRequiredHackingLevel = {
  requiredHackingLevel: number;
} & ServerInfoBuilderGrowthLevel;

export type UnstableServerInfoBuilderFiles = {
  unstable: {
    files: string[];
  };
} & ServerInfoBuilderRequiredHackingLevel;

export type UnstableServerInfoBuilderMoneyAvailable = {
  unstable: {
    moneyAvailable: number;
  };
} & UnstableServerInfoBuilderFiles;

export type UnstableServerInfoBuilderSecurityLevel = {
  unstable: {
    securityLevel: number;
  };
} & UnstableServerInfoBuilderMoneyAvailable;

export type CompleteServerInfoBuilder = ServerInfoBuilderConnectableServers &
  ServerInfoBuilderBaseSecurityLevel &
  UnstableServerInfoBuilderSecurityLevel;

export const serverInfoBuilderHostnameGuard = objectGuard<ServerInfoBuilderHostname>({
  hostname: 'string',
});

export const serverInfoBuilderRamGuard = extendGuard<ServerInfoBuilderRam>(
  serverInfoBuilderHostnameGuard,
  { ram: 'number' },
);

export const serverInfoBuilderConnectableServersGuard =
  extendGuard<ServerInfoBuilderConnectableServers>(serverInfoBuilderRamGuard, {
    connectableServers: array(),
  });

export const serverInfoBuilderMaxMoneyGuard = extendGuard<ServerInfoBuilderMaxMoney>(
  serverInfoBuilderRamGuard,
  { maxMoney: 'number' },
);

export const serverInfoBuilderMinSecurityLevelGuard =
  extendGuard<ServerInfoBuilderMinSecurityLevel>(serverInfoBuilderMaxMoneyGuard, {
    minSecurityLevel: 'number',
  });

export const serverInfoBuilderBaseSecurityLevelGuard =
  extendGuard<ServerInfoBuilderBaseSecurityLevel>(serverInfoBuilderMinSecurityLevelGuard, {
    baseSecurityLevel: 'number',
  });

export const serverInfoBuilderGrowthLevelGuard = extendGuard<ServerInfoBuilderGrowthLevel>(
  serverInfoBuilderBaseSecurityLevelGuard,
  { growthLevel: 'number' },
);

export const serverInfoBuilderRequiredHackingLevelGuard =
  extendGuard<ServerInfoBuilderRequiredHackingLevel>(serverInfoBuilderGrowthLevelGuard, {
    requiredHackingLevel: 'number',
  });

export const serverInfoBuilderIpGuard = extendGuard<ServerInfoBuilderIp>(
  serverInfoBuilderRequiredHackingLevelGuard,
  { ip: optional('string') },
);

export const unstableServerInfoBuilderFilesGuard = extendGuard<UnstableServerInfoBuilderFiles>(
  serverInfoBuilderIpGuard,
  { unstable: objectGuard<{ files: string[] }>({ files: array() }) },
);

export const unstableServerInfoBuilderMoneyAvailableGuard =
  extendGuard<UnstableServerInfoBuilderMoneyAvailable>(unstableServerInfoBuilderFilesGuard, {
    unstable: objectGuard<{ moneyAvailable: number }>({ moneyAvailable: 'number' }),
  });

export const unstableServerInfoBuilderSecurityLevelGuard =
  extendGuard<UnstableServerInfoBuilderSecurityLevel>(unstableServerInfoBuilderMoneyAvailableGuard, {
    unstable: objectGuard<{ securityLevel: number }>({ securityLevel: 'number' }),
  });

export type UnstableServerInfoBuilderHasRootAccess = {
  unstable: {
    hasRootAccess: boolean;
  };
} & UnstableServerInfoBuilderSecurityLevel;

export const unstableServerInfoBuilderHasRootAccessGuard =
  extendGuard<UnstableServerInfoBuilderHasRootAccess>(unstableServerInfoBuilderSecurityLevelGuard, {
    unstable: objectGuard<{ hasRootAccess: boolean }>({ hasRootAccess: 'boolean' }),
  });
