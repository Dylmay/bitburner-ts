import { typedMain } from 'lib/callables/typedCallable';
import {
  SWARM_COMMAND_CALLABLE,
  ThreadAllocationStrategy,
  ThreadRequirementCalculator,
} from 'bin/commands/swarm/models';
import { ActionType, ACTION_TYPE_TO_CALLABLE } from 'lib/scripts/models';
import { execCallable } from 'lib/callables/exec';
import { HACK_OUTPUT_PORT, HackArgs } from 'lib/hacks/models';
import { NetworkReport, NETWORK_REPORT_STORE } from 'lib/reports/models';
import { ServerInfo } from 'lib/servers/models';
import { createNiceError } from 'lib/utils/errors';
import { PortHandle } from 'lib/utils/ports';
import { Store } from 'lib/stores/store';
import { INSTALL_DATA_STORE } from 'lib/installs/models';
import { getMaxMoneyPerTick } from 'lib/functions/getMaxMoneyPerTick';
import { getMoneyPerCycle } from 'lib/functions/getMoneyPerCycle';
import { Logger } from 'lib/utils/logging/logger';

const MIN_MONEY_PERCENTAGE = 0.8;
const MIN_SECURITY_PERCENTAGE = 0.8;
const MIN_MONEY_PER_CYCLE = 1; // $/ms — servers below this are not worth thread allocation

const ACTION_THREAD_CALCULATORS: Partial<Record<ActionType, ThreadRequirementCalculator>> = {
  grow: (ns, target) => {
    const { moneyAvailable } = target.unstable;
    if (moneyAvailable <= 0 || moneyAvailable >= target.maxMoney) return 0;
    const multiplier = target.maxMoney / moneyAvailable;
    return Math.ceil(ns.growthAnalyze(target.hostname, multiplier));
  },
  weaken: (ns, target) => {
    const excess = target.unstable.securityLevel - target.minSecurityLevel;
    if (excess <= 0) return 0;
    return Math.ceil(excess / ns.weakenAnalyze(1));
  },
  hack: (ns, target) => {
    const { moneyAvailable } = target.unstable;
    const floor = MIN_MONEY_PERCENTAGE * target.maxMoney;
    if (moneyAvailable <= floor) return 0;
    const stealFraction = (moneyAvailable - floor) / moneyAvailable;
    const perThread = ns.hackAnalyze(target.hostname);
    if (perThread <= 0) return 0;
    return Math.ceil(stealFraction / perThread);
  },
};

type DeploymentResult = {
  hostToProcess: Record<string, { pid: number; threads: number }>;
  gigsSpent: number;
  threadsSpent: number;
};

type TargetDeployment = {
  target: ServerInfo;
  action: ActionType;
  result: DeploymentResult;
};

const resolveThreads = (ns: NS, log: Logger, action: ActionType, target: ServerInfo): number => {
  const calculator = ACTION_THREAD_CALCULATORS[action];
  if (calculator) {
    const total = calculator(ns, target);
    log.info('Strategy: calculated budget', ['action', action], ['threads', total]);
    return total;
  }
  log.warn('No thread calculator for action, defaulting to 0', ['action', action]);
  return 0;
};

const deployAction = (
  ns: NS,
  log: Logger,
  localhost: string,
  scriptToRamCost: Map<string, number | undefined>,
  action: ActionType,
  targetHost: string,
  report: NetworkReport,
  strategy: ThreadAllocationStrategy,
): DeploymentResult => {
  const callable = ACTION_TYPE_TO_CALLABLE[action];

  // TODO(dmayor): Make the store allow kv pairs
  const scriptRam = scriptToRamCost.get(callable.scriptPath.path);

  if (scriptRam === undefined) {
    throw createNiceError('Unable to fetch ram cost', ['scriptPath', callable.scriptPath]);
  }

  const hackArgs: HackArgs = { target: targetHost };

  log.info(
    'Deploying action',
    ['action', action],
    ['target', targetHost],
    ['strategy', strategy],
  );

  const ownedScriptPaths = new Set(
    Object.values(ACTION_TYPE_TO_CALLABLE).map(({ scriptPath }) => scriptPath.path),
  );

  const hostToProcess: Record<string, { pid: number; threads: number }> = {};
  let gigsSpent = 0;
  let threadsSpent = 0;
  let remaining = strategy.total;

  const totalRamNeeded = strategy.total * scriptRam;
  const eligibleServers = Object.entries(report.serverToServerInfo)
    .filter(([hostname, serverInfo]) => {
      if (hostname === 'home' || hostname === localhost) return false;
      if (!serverInfo.unstable.hasRootAccess) {
        log.debug('Do not have root access on this node. Skipping', ['hostname', hostname]);
        return false;
      }
      const foreignProcess = ns.ps(hostname).find(({ filename }) => !ownedScriptPaths.has(filename));
      if (foreignProcess) {
        log.debug('Skipping node — foreign process running', ['hostname', hostname], ['process', foreignProcess.filename]);
        return false;
      }
      return true;
    })
    .map(([hostname, serverInfo]) => ({ hostname, availableRam: serverInfo.ram - ns.getServerUsedRam(hostname) }))
    .filter(({ availableRam }) => availableRam >= scriptRam)
    .sort((a, b) => {
      const aFits = a.availableRam >= totalRamNeeded;
      const bFits = b.availableRam >= totalRamNeeded;
      if (aFits && bFits) return a.availableRam - b.availableRam; // best fit: smallest that holds all
      if (aFits !== bFits) return aFits ? -1 : 1;                 // servers that fit come first
      return b.availableRam - a.availableRam;                     // FFD for overflow remainder
    });

  for (const { hostname, availableRam } of eligibleServers) {
    if (remaining <= 0) break;

    const maxThreads = Math.floor(availableRam / scriptRam);
    const threads = Math.min(maxThreads, remaining);

    remaining -= threads;
    threadsSpent += threads;
    gigsSpent += scriptRam * threads;

    const pid = execCallable({
      ns,
      hostname,
      callableDefinition: callable,
      runOptions: { threads },
      args: hackArgs,
    });

    if (pid !== undefined) {
      hostToProcess[hostname] = { pid, threads };
      log.debug(
        'Assigned threads to host',
        ['hostname', hostname],
        ['threads', threads],
        ['pid', pid],
      );
    } else {
      log.warn('Unable to start callable', ['targetHost', hostname], ['callable', callable]);
    }
  }

  log.info(
    'Deployment complete',
    ['action', action],
    ['hosts', Object.keys(hostToProcess).length],
    ['threadsSpent', threadsSpent],
    ['gigsSpent', gigsSpent],
  );

  return { hostToProcess, threadsSpent, gigsSpent };
};

const killDeployments = (ns: NS, deployments: TargetDeployment[]): void => {
  for (const { result } of deployments) {
    for (const { pid } of Object.values(result.hostToProcess)) {
      ns.kill(pid);
    }
  }
};

const getStaleDeployments = (targets: ServerInfo[], current: TargetDeployment[]): TargetDeployment[] => {
  const targetByHost = new Map(targets.map(t => [t.hostname, t]));

  return current.filter(({ target: deployed, action: deployedAction }) => {
    const fresh = targetByHost.get(deployed.hostname);
    return !fresh || computeAction(fresh) !== deployedAction;
  });
};

const buildDesiredDeployments = (
  ns: NS,
  log: Logger,
  localhost: string,
  scriptToRamCost: Map<string, number | undefined>,
  targets: ServerInfo[],
  report: NetworkReport,
): TargetDeployment[] => {
  const deployments: TargetDeployment[] = [];

  for (const target of targets) {
    const action = computeAction(target);
    const total = resolveThreads(ns, log, action, target);
    if (total === 0) continue;

    const strategy: ThreadAllocationStrategy = { kind: 'budget', total };
    const result = deployAction(ns, log, localhost, scriptToRamCost, action, target.hostname, report, strategy);
    if (result.threadsSpent === 0) break;

    deployments.push({ target, action, result });
  }

  return deployments;
};

export const main = typedMain(
  SWARM_COMMAND_CALLABLE,
  async ({ ns, log, localServerInfo }, args) => {
    if (!localServerInfo) {
      throw createNiceError('No local server info. Unable to start swarm');
    }

    const hackListenerPort = PortHandle.connectToPort(ns, HACK_OUTPUT_PORT);
    hackListenerPort.clearPort();

    const installDataStore = Store.openStore(ns, INSTALL_DATA_STORE);
    const networkReportStore = Store.openStore(ns, NETWORK_REPORT_STORE);

    const { hostname: localhost } = localServerInfo;
    const scriptToRamCost = new Map(
      Object.entries(installDataStore.load().filenameToInfo).map<[string, number | undefined]>(
        ([filename, { ramUsage }]) => [filename, ramUsage],
      ),
    );

    log.info('Starting swarm');

    let allDeployments: TargetDeployment[] = [];

    while (true) {
      const report = networkReportStore.load();
      const targets = selectTargets(ns, report);

      const stale = getStaleDeployments(targets, allDeployments);
      if (allDeployments.length === 0) {
        log.info('Starting initial deployment', ['hackingLevel', ns.getPlayer().skills.hacking]);
        allDeployments = buildDesiredDeployments(ns, log, localhost, scriptToRamCost, targets, report);
      } else if (stale.length > 0) {
        log.info('Re-spinning stale targets', ['count', stale.length], ['hackingLevel', ns.getPlayer().skills.hacking]);
        killDeployments(ns, stale);
        const staleHostnames = new Set(stale.map(d => d.target.hostname));
        allDeployments = allDeployments.filter(d => !staleHostnames.has(d.target.hostname));
        allDeployments.push(
          ...buildDesiredDeployments(ns, log, localhost, scriptToRamCost,
            targets.filter(t => staleHostnames.has(t.hostname)), report),
        );
      } else {
        for (const { target, action, result } of allDeployments) {
          const freshInfo = report.serverToServerInfo[target.hostname];
          log.info(
            'Deployments unchanged',
            ['action', action],
            ['target', target.hostname],
            ['threadsAssigned', result.threadsSpent],
            ['hosts', Object.keys(result.hostToProcess).length],
            ['securityLevel', freshInfo?.unstable.securityLevel ?? target.unstable.securityLevel],
            ['minSecurityLevel', target.minSecurityLevel],
            ['moneyAvailable', freshInfo?.unstable.moneyAvailable ?? target.unstable.moneyAvailable],
            ['maxMoney', target.maxMoney],
          );
        }
      }

      while (hackListenerPort.hasData()) {
        const data = hackListenerPort.read();

        if (data === undefined) {
          log.warn('Unable to read data on hack listener port');
          break;
        }

        log.debug('Hacker has completed cycle', ['cycle', data]);
        switch (data.type) {
          case 'grow': {
            log.debug(
              'Completed grow on node',
              ['target', data.target],
              ['host', data.hostname],
              ['growAmount', data.growAmount],
            );
            break;
          }
          case 'weaken':
            log.debug(
              'Completed weaken on node',
              ['target', data.target],
              ['host', data.hostname],
              ['weakenAmount', data.weakenAmount],
            );
            break;
          case 'hack': {
            log.debug(
              'Completed hack on node',
              ['target', data.target],
              ['host', data.hostname],
              ['hackAmount', data.hackAmount],
            );
            break;
          }
          default: {
            const neverData: never = data;
            throw createNiceError('Unknown data type', ['data', neverData]);
          }
        }

        if (!args?.managed) {
          networkReportStore.write(report);
          for (const host of Object.keys(report.serverToServerInfo)) {
            ns.scp(NETWORK_REPORT_STORE.location.path, host);
          }
        }

        await ns.sleep(100);
      }

      log.trace('Sleeping for 15 seconds');
      await ns.sleep(15_000);
    }
  },
);

const selectTargets = (ns: NS, report: NetworkReport): ServerInfo[] => {
  const playerHackingLevel = ns.getPlayer().skills.hacking;

  const sorted = Object.values(report.serverToServerInfo)
    .filter(
      ({ maxMoney, requiredHackingLevel, unstable }) =>
        maxMoney > 0 && requiredHackingLevel <= playerHackingLevel && unstable.hasRootAccess,
    )
    .filter((server) => getMoneyPerCycle(ns, server) >= MIN_MONEY_PER_CYCLE)
    .sort((a, b) => getMaxMoneyPerTick(ns, a) - getMaxMoneyPerTick(ns, b))
    .reverse();

  if (sorted.length === 0) {
    throw createNiceError('swarm: no hackable server found in network report');
  }

  return sorted;
};

const computeAction = (info: ServerInfo): ActionType => {
  const { securityLevel, moneyAvailable } = info.unstable;
  if (info.minSecurityLevel / securityLevel < MIN_SECURITY_PERCENTAGE) {
    return 'weaken';
  }

  if (moneyAvailable / info.maxMoney < MIN_MONEY_PERCENTAGE) {
    return 'grow';
  }

  return 'hack';
};
