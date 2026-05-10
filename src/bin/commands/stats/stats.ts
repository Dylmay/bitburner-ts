import { typedMain } from 'lib/callables/typedCallable';
import { NETWORK_REPORT_STORE, ServerName } from 'lib/reports/models';
import { createNiceError } from 'lib/utils/errors';
import { STATS_CALLABLE } from 'bin/commands/stats/models';
import { ServerInfo } from 'lib/servers/models';
import { Store } from 'lib/stores/store';

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
  ip: string | undefined; // TODO(dmayor): either drop ip again or make it so we can set it from another node
  unstableServerMetrics: UnstableServerMetrics;
};

export const main = typedMain(STATS_CALLABLE, async ({ ns }, args) => {
  const networkReportStore = Store.openStore(ns, NETWORK_REPORT_STORE);

  const { serverToServerInfo } = networkReportStore.load();

  const orderBy = args?.orderBy ?? 'growth';
  const onlyRoot = args?.onlyRoot ?? false;

  const orderedEntries = Object.entries(serverToServerInfo)
    .filter(([, serverInfo]) => !onlyRoot || serverInfo.unstable.hasRootAccess)
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
        case 'perTick':
          return getMaxMoneyPerTick(ns, serverInfoA) - getMaxMoneyPerTick(ns, serverInfoB);
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

const getMaxMoneyPerTick = (
  ns: NS,
  { minSecurityLevel, baseSecurityLevel, hostname, maxMoney }: ServerInfo,
): number => {
  const hackTime = ns.getHackTime(hostname);
  const hackTimeAtMinSecurity = (hackTime / baseSecurityLevel) * minSecurityLevel;

  return maxMoney / hackTimeAtMinSecurity;
};
