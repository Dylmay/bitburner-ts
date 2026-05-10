import { typedMain } from 'lib/callables/typedCallable';
import { SWARM_COMMAND_CALLABLE, ThreadRequirementCalculator } from 'bin/commands/swarm/models';
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
import { Logger } from 'lib/utils/logging/logger';
import { RamReservation } from 'lib/servers/ramReservation';
import { pathOf } from 'lib/utils/files/paths';

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

type WorkerInfo = {
  hostname: string;
  availableRam: number;
};

const MIN_MONEY_PERCENTAGE = 0.8;
const MIN_SECURITY_PERCENTAGE = 0.8;
const OWNED_SCRIPT_PATHS = new Set(
  Object.values(ACTION_TYPE_TO_CALLABLE).map(({ scriptPath }) => scriptPath.path),
);

const ACTION_THREAD_CALCULATORS: Partial<Record<ActionType, ThreadRequirementCalculator>> = {
  grow: (ns, target) => {
    const { moneyAvailable } = target.unstable;

    if (moneyAvailable <= 0 || moneyAvailable >= target.maxMoney) {
      return 0;
    }

    const multiplier = target.maxMoney / moneyAvailable;

    return Math.ceil(ns.growthAnalyze(target.hostname, multiplier));
  },

  weaken: (ns, target) => {
    const excess = target.unstable.securityLevel - target.minSecurityLevel;

    if (excess <= 0) {
      return 0;
    }

    return Math.ceil(excess / ns.weakenAnalyze(1));
  },

  hack: (ns, target) => {
    const { moneyAvailable } = target.unstable;
    const floor = MIN_MONEY_PERCENTAGE * target.maxMoney;

    if (moneyAvailable <= floor) {
      return 0;
    }

    const stealFraction = (moneyAvailable - floor) / moneyAvailable;
    const perThread = ns.hackAnalyze(target.hostname);

    if (perThread <= 0) {
      return 0;
    }

    return Math.ceil(stealFraction / perThread);
  },
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

        allDeployments = buildDesiredDeployments(
          ns,
          log,
          localhost,
          scriptToRamCost,
          targets,
          report,
          new RamReservation(),
        );
      } else if (stale.length > 0) {
        log.info(
          'Re-spinning stale targets',
          ['count', stale.length],
          ['hackingLevel', ns.getPlayer().skills.hacking],
        );

        killDeployments(ns, stale);

        const staleHostnames = new Set(stale.map((d) => d.target.hostname));
        const nonStaleDeployments = allDeployments.filter(
          (d) => !staleHostnames.has(d.target.hostname),
        );
        const nonStaleHostnames = new Set(nonStaleDeployments.map((d) => d.target.hostname));
        const targetByHostname = new Map(targets.map((t) => [t.hostname, t]));
        const ramReservation = new RamReservation();

        // Re-deploy stale targets + any newly eligible targets not yet running, in priority order
        const freshDeployments = buildDesiredDeployments(
          ns,
          log,
          localhost,
          scriptToRamCost,
          targets.filter((t) => !nonStaleHostnames.has(t.hostname)),
          report,
          ramReservation,
        );

        // Fill up non-stale targets using remaining freed RAM
        const { workers: fillWorkers } = buildWorkerPool(
          ns,
          log,
          localhost,
          report,
          ramReservation,
        );

        const mergedNonStale = nonStaleDeployments.map((existing) => {
          const fresh = targetByHostname.get(existing.target.hostname);

          if (!fresh) {
            return existing;
          }

          const gap = computeThreads(ns, existing.action, fresh) - existing.result.threadsSpent;

          if (gap <= 0) {
            return existing;
          }

          const fillResult = deployOnWorkers(
            ns,
            log,
            scriptToRamCost,
            existing.action,
            fresh.hostname,
            fillWorkers,
            gap,
            ramReservation,
          );

          if (fillResult.threadsSpent === 0) {
            return existing;
          }

          log.info(
            'Fill-up threads added',
            ['target', fresh.hostname],
            ['threads', fillResult.threadsSpent],
          );

          return {
            ...existing,
            result: {
              hostToProcess: { ...existing.result.hostToProcess, ...fillResult.hostToProcess },
              threadsSpent: existing.result.threadsSpent + fillResult.threadsSpent,
              gigsSpent: existing.result.gigsSpent + fillResult.gigsSpent,
            },
          };
        });

        allDeployments = [...mergedNonStale, ...freshDeployments];
      } else {
        for (const { target, action, result } of allDeployments) {
          const freshInfo = report.serverToServerInfo[target.hostname];

          log.debug(
            'Deployments unchanged',
            ['action', action],
            ['target', target.hostname],
            ['threadsAssigned', result.threadsSpent],
            ['hosts', Object.keys(result.hostToProcess).length],
            ['securityLevel', freshInfo?.unstable.securityLevel ?? target.unstable.securityLevel],
            ['minSecurityLevel', target.minSecurityLevel],
            [
              'moneyAvailable',
              freshInfo?.unstable.moneyAvailable ?? target.unstable.moneyAvailable,
            ],
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
          case 'weaken': {
            log.debug(
              'Completed weaken on node',
              ['target', data.target],
              ['host', data.hostname],
              ['weakenAmount', data.weakenAmount],
            );
            break;
          }
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

const computeThreads = (ns: NS, action: ActionType, target: ServerInfo): number =>
  ACTION_THREAD_CALCULATORS[action]?.(ns, target) ?? 0;

const resolveThreads = (ns: NS, log: Logger, action: ActionType, target: ServerInfo): number => {
  const total = computeThreads(ns, action, target);

  if (ACTION_THREAD_CALCULATORS[action]) {
    log.info('Strategy: calculated budget', ['action', action], ['threads', total]);
  } else {
    log.warn('No thread calculator for action, defaulting to 0', ['action', action]);
  }

  return total;
};

const buildWorkerPool = (
  ns: NS,
  log: Logger,
  localhost: string,
  report: NetworkReport,
  ramReservation: RamReservation,
): { workers: WorkerInfo[]; excludedNoRoot: number; excludedForeignProcess: number } => {
  let excludedNoRoot = 0;
  let excludedForeignProcess = 0;

  const workers = Object.entries(report.serverToServerInfo)
    .filter(([hostname, serverInfo]) => {
      if (hostname === 'home' || hostname === localhost) {
        return false;
      }

      if (!serverInfo.unstable.hasRootAccess) {
        log.debug('No root access, skipping', ['hostname', hostname]);
        excludedNoRoot++;
        return false;
      }

      // TODO(dmayor): Sets and other types are pretty sketchy here.
      // A pretty bad bug fell through due to filepaths not always starting with '/'
      // causing incorrect misses
      const foreignProcess = ns
        .ps(hostname)
        .find(({ filename }) => !OWNED_SCRIPT_PATHS.has(pathOf(filename).path));

      if (foreignProcess) {
        log.warn(
          'Foreign process running, skipping',
          ['hostname', hostname],
          ['process', foreignProcess.filename],
        );
        excludedForeignProcess++;
        return false;
      }

      return true;
    })
    .map(([hostname, serverInfo]) => ({
      hostname,
      availableRam:
        serverInfo.ram - ns.getServerUsedRam(hostname) - ramReservation.reservedFor(hostname),
    }))
    .filter(({ availableRam }) => availableRam > 0);

  return { workers, excludedNoRoot, excludedForeignProcess };
};

const deployOnWorkers = (
  ns: NS,
  log: Logger,
  scriptToRamCost: Map<string, number | undefined>,
  action: ActionType,
  targetHost: string,
  workers: WorkerInfo[],
  threadsNeeded: number,
  ramReservation: RamReservation,
): DeploymentResult => {
  const callable = ACTION_TYPE_TO_CALLABLE[action];
  const scriptRam = scriptToRamCost.get(callable.scriptPath.path);

  if (scriptRam === undefined) {
    throw createNiceError('Unable to fetch ram cost', ['scriptPath', callable.scriptPath]);
  }

  const hackArgs: HackArgs = { target: targetHost };
  const totalRamNeeded = threadsNeeded * scriptRam;

  const eligible = workers
    .filter(({ availableRam }) => availableRam >= scriptRam)
    .sort((a, b) => {
      const aFits = a.availableRam >= totalRamNeeded;
      const bFits = b.availableRam >= totalRamNeeded;

      if (aFits && bFits) {
        return a.availableRam - b.availableRam; // best fit: smallest that holds all
      }

      if (aFits !== bFits) {
        return aFits ? -1 : 1; // servers that fit come first
      }

      return b.availableRam - a.availableRam; // FFD for overflow remainder
    });

  const hostToProcess: Record<string, { pid: number; threads: number }> = {};
  let gigsSpent = 0;
  let threadsSpent = 0;
  let remaining = threadsNeeded;

  for (const worker of eligible) {
    if (remaining <= 0) {
      break;
    }

    const threads = Math.min(Math.floor(worker.availableRam / scriptRam), remaining);
    const pid = execCallable({
      ns,
      hostname: worker.hostname,
      callableDefinition: callable,
      runOptions: { threads },
      args: hackArgs,
    });

    if (pid !== undefined) {
      remaining -= threads;
      threadsSpent += threads;
      gigsSpent += scriptRam * threads;
      worker.availableRam -= scriptRam * threads;
      ramReservation.reserve(worker.hostname, scriptRam * threads);
      hostToProcess[worker.hostname] = { pid, threads };
      log.debug(
        'Assigned threads to host',
        ['hostname', worker.hostname],
        ['threads', threads],
        ['pid', pid],
      );
    } else {
      log.warn('Unable to start callable', ['hostname', worker.hostname], ['callable', callable]);
    }
  }

  return { hostToProcess, threadsSpent, gigsSpent };
};

const killDeployments = (ns: NS, deployments: TargetDeployment[]): void => {
  for (const { result } of deployments) {
    for (const { pid } of Object.values(result.hostToProcess)) {
      ns.kill(pid);
    }
  }
};

const getStaleDeployments = (
  targets: ServerInfo[],
  current: TargetDeployment[],
): TargetDeployment[] => {
  const targetByHost = new Map(targets.map((t) => [t.hostname, t]));

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
  ramReservation: RamReservation,
): TargetDeployment[] => {
  const { workers, excludedNoRoot, excludedForeignProcess } = buildWorkerPool(
    ns,
    log,
    localhost,
    report,
    ramReservation,
  );
  const totalRam = workers.reduce((sum, { availableRam }) => sum + availableRam, 0);

  log.info(
    'Worker pool',
    ['workers', workers.length],
    ['totalRam', totalRam],
    ['excludedNoRoot', excludedNoRoot],
    ['excludedForeignProcess', excludedForeignProcess],
  );

  const deployments: TargetDeployment[] = [];

  for (const target of targets) {
    const action = computeAction(target);
    const total = resolveThreads(ns, log, action, target);

    if (total === 0) {
      continue;
    }

    log.info(
      'Deploying action',
      ['action', action],
      ['target', target.hostname],
      ['threads', total],
    );

    const result = deployOnWorkers(
      ns,
      log,
      scriptToRamCost,
      action,
      target.hostname,
      workers,
      total,
      ramReservation,
    );

    if (result.threadsSpent === 0) {
      const remainingRamAtBreak = workers.reduce((sum, { availableRam }) => sum + availableRam, 0);

      log.warn(
        'No threads deployed — network capacity exhausted',
        ['target', target.hostname],
        ['action', action],
        ['threadsNeeded', total],
        ['remainingNetworkRam', remainingRamAtBreak],
      );

      break;
    }

    if (result.threadsSpent < total) {
      log.warn(
        'Partial deployment — ran out of capacity mid-target',
        ['target', target.hostname],
        ['action', action],
        ['threadsNeeded', total],
        ['threadsDeployed', result.threadsSpent],
      );
    }

    log.info(
      'Deployment complete',
      ['action', action],
      ['hosts', Object.keys(result.hostToProcess).length],
      ['threadsSpent', result.threadsSpent],
      ['gigsSpent', result.gigsSpent],
    );

    deployments.push({ target, action, result });
  }

  const remainingRam = workers.reduce((sum, { availableRam }) => sum + availableRam, 0);

  log.info(
    'Round complete',
    ['targets', deployments.length],
    ['ramUsed', totalRam - remainingRam],
    ['ramRemaining', remainingRam],
  );

  return deployments;
};

const selectTargets = (ns: NS, report: NetworkReport): ServerInfo[] => {
  const playerHackingLevel = ns.getPlayer().skills.hacking;

  const sorted = Object.values(report.serverToServerInfo)
    .filter(
      ({ maxMoney, requiredHackingLevel, unstable }) =>
        maxMoney > 0 && requiredHackingLevel <= playerHackingLevel && unstable.hasRootAccess,
    )
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
