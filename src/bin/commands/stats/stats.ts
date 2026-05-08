import { typedMain } from 'lib/callables/typedCallable';
import * as files from 'lib/utils/files';
import { NETWORK_REPORT_PATH, networkReportGuard, ServerName } from 'lib/reports/models';
import { createNiceError } from 'lib/utils/errors';
import { STATS_CALLABLE } from 'bin/commands/stats/models';

type UnstableServerMetrics = {
  moneyAvailable: number;
  percentageMoneyAvailable: number;
  percentageSecurityLevel: number;
};

type ServerReport = {
  maxMoney: number;
  growthLevel: number;
  baseSecurityLevel: number;
  ram: number;
  requiredHackingLevel: number;
  ip: string;
  unstableServerMetrics: UnstableServerMetrics;
};

export const main = typedMain(STATS_CALLABLE, async ({ ns }, args) => {
  const { serverToServerInfo } = files.loadJson(ns, NETWORK_REPORT_PATH, networkReportGuard);

  const orderBy = args?.orderBy ?? 'growth';

  const orderedEntries = Object.entries(serverToServerInfo)
    .sort(([_serverNameA, serverInfoA], [_serverNameB, serverInfoB]) => {
      switch (orderBy) {
        case 'growth':
          return serverInfoA.growthLevel - serverInfoB.growthLevel;
        case 'maxMoney':
          return serverInfoA.maxMoney - serverInfoB.maxMoney;
        case 'moneyAvailable':
          return serverInfoA.unstable.moneyAvailable - serverInfoB.unstable.moneyAvailable;
        case 'ramAvailable':
          return serverInfoA.ram - serverInfoB.ram;
        default: {
          const cannotOrderBy: never = orderBy;
          throw createNiceError('Unsupported ordering', ['orderBy', cannotOrderBy]);
        }
      }
    })
    .reverse();

  const report = orderedEntries.map(([serverName, serverInfo]): [ServerName, ServerReport] => {
    const unstableServerMetrics: UnstableServerMetrics = {
      moneyAvailable: serverInfo.unstable.moneyAvailable,
      percentageMoneyAvailable: serverInfo.unstable.moneyAvailable / serverInfo.maxMoney,
      percentageSecurityLevel: serverInfo.minSecurityLevel / serverInfo.unstable.securityLevel,
    };

    const serverReport: ServerReport = {
      maxMoney: serverInfo.maxMoney,
      unstableServerMetrics,
      baseSecurityLevel: serverInfo.baseSecurityLevel,
      ram: serverInfo.ram,
      growthLevel: serverInfo.growthLevel,
      ip: serverInfo.ip,
      requiredHackingLevel: serverInfo.requiredHackingLevel,
    };

    return [serverName, serverReport];
  });

  const stringifiedReports = report
    .map(([serverName, serverReport]) => {
      return `\
    ----------------------------------
    Report for server: ${serverName}
    ${JSON.stringify(serverReport, undefined, 2)}
    ----------------------------------
    `;
    })
    .reduce((a, b) => a + '\n' + b, '');

  ns.alert(`Reports ordered by ${orderBy}\n` + stringifiedReports);
});
