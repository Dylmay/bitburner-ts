import { ServerInfo } from 'lib/servers/models';
import { guard, typeIs } from 'lib/utils/typeGuard';

export const NETWORK_REPORT_PATH = 'report/network.report.json';

export type ServerName = string;

export type NetworkReport = {
  serverToServerInfo: Record<ServerName, ServerInfo>;
  allServers: string[];
  serversNotVisited: string[];
};

export const networkReportGuard = guard(
  (arg: unknown): arg is NetworkReport =>
    typeIs(arg, Object) && 'serverToServerInfo' in arg && typeIs(arg.serverToServerInfo, Object),
);
