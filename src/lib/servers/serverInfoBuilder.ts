import { pathOf } from 'lib/utils/paths';
import { guard, typeIs } from 'lib/utils/typeGuard';

export const SERVER_INFO_BUILDER_PATH = pathOf('info/builder.server.json');

export type ServerInfoBuilderHostname = {
  hostname: string;
};

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

export type ServerInfoBuilderIp = {
  ip: string;
} & ServerInfoBuilderRequiredHackingLevel;

export type UnstableServerInfoBuilderFiles = {
  unstable: {
    files: string[];
  };
} & ServerInfoBuilderIp;

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

export const serverInfoBuilderHostnameGuard = guard(
  (arg: unknown): arg is ServerInfoBuilderHostname =>
    typeIs(arg, Object) && 'hostname' in arg && typeIs(arg.hostname, 'string'),
);

export const serverInfoBuilderRamGuard = guard(
  (arg: unknown): arg is ServerInfoBuilderRam =>
    typeIs(arg, serverInfoBuilderHostnameGuard) && 'ram' in arg && typeIs(arg.ram, 'number'),
);

export const serverInfoBuilderConnectableServersGuard = guard(
  (arg: unknown): arg is ServerInfoBuilderConnectableServers =>
    typeIs(arg, serverInfoBuilderRamGuard) &&
    'connectableServers' in arg &&
    Array.isArray(arg.connectableServers),
);

export const serverInfoBuilderMaxMoneyGuard = guard(
  (arg: unknown): arg is ServerInfoBuilderMaxMoney =>
    typeIs(arg, serverInfoBuilderRamGuard) && 'maxMoney' in arg && typeIs(arg.maxMoney, 'number'),
);

export const serverInfoBuilderMinSecurityLevelGuard = guard(
  (arg: unknown): arg is ServerInfoBuilderMinSecurityLevel =>
    typeIs(arg, serverInfoBuilderMaxMoneyGuard) &&
    'minSecurityLevel' in arg &&
    typeIs(arg.minSecurityLevel, 'number'),
);

export const serverInfoBuilderBaseSecurityLevelGuard = guard(
  (arg: unknown): arg is ServerInfoBuilderBaseSecurityLevel =>
    typeIs(arg, serverInfoBuilderMinSecurityLevelGuard) &&
    'baseSecurityLevel' in arg &&
    typeIs(arg.baseSecurityLevel, 'number'),
);

export const serverInfoBuilderGrowthLevelGuard = guard(
  (arg: unknown): arg is ServerInfoBuilderGrowthLevel => {
    if (!typeIs(arg, serverInfoBuilderBaseSecurityLevelGuard)) return false;
    return 'growthLevel' in arg && typeIs(arg.growthLevel, 'number');
  },
);

export const serverInfoBuilderRequiredHackingLevelGuard = guard(
  (arg: unknown): arg is ServerInfoBuilderRequiredHackingLevel =>
    typeIs(arg, serverInfoBuilderGrowthLevelGuard) &&
    'requiredHackingLevel' in arg &&
    typeIs(arg.requiredHackingLevel, 'number'),
);

export const serverInfoBuilderIpGuard = guard(
  (arg: unknown): arg is ServerInfoBuilderIp =>
    typeIs(arg, serverInfoBuilderRequiredHackingLevelGuard) &&
    'ip' in arg &&
    typeIs(arg.ip, 'string'),
);

export const unstableServerInfoBuilderFilesGuard = guard(
  (arg: unknown): arg is UnstableServerInfoBuilderFiles => {
    if (!typeIs(arg, serverInfoBuilderIpGuard)) return false;
    if (!('unstable' in arg) || !typeIs(arg.unstable, Object)) return false;
    return 'files' in arg.unstable && Array.isArray(arg.unstable.files);
  },
);

export const unstableServerInfoBuilderMoneyAvailableGuard = guard(
  (arg: unknown): arg is UnstableServerInfoBuilderMoneyAvailable => {
    if (!typeIs(arg, unstableServerInfoBuilderFilesGuard)) return false;
    return 'moneyAvailable' in arg.unstable && typeIs(arg.unstable.moneyAvailable, 'number');
  },
);

export const unstableServerInfoBuilderSecurityLevelGuard = guard(
  (arg: unknown): arg is UnstableServerInfoBuilderSecurityLevel => {
    if (!typeIs(arg, unstableServerInfoBuilderMoneyAvailableGuard)) return false;
    return 'securityLevel' in arg.unstable && typeIs(arg.unstable.securityLevel, 'number');
  },
);
