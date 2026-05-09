import { ServerInfo } from 'lib/servers/models';
import { StoreDef } from 'lib/stores/store';
import { pathOf } from 'lib/utils/files/paths';
import { objectGuard, array } from 'lib/utils/typeGuard';

export type ServerName = string;

export type NetworkReport = {
  serverToServerInfo: Record<ServerName, ServerInfo>;
  allServers: string[];
  serversNotVisited: string[];
};

export const networkReportGuard = objectGuard<NetworkReport>({
  serverToServerInfo: Object,
  allServers: array(),
  serversNotVisited: array(),
});

export const NETWORK_REPORT_STORE: StoreDef<NetworkReport> = {
  location: pathOf('report/network.report.json'),
  loadGuard: networkReportGuard,
};
