import { typedMain } from 'lib/callables/typedCallable';
import { SWARM_COMMAND_CALLABLE } from 'bin/commands/swarm/models';
import { ActionType, ACTION_TYPE_TO_CALLABLE } from 'lib/scripts/models';
import { execCallable } from 'lib/callables/exec';
import { HACK_OUTPUT_PORT, HackArgs } from 'lib/hacks/models';
import { NetworkReport, NETWORK_REPORT_STORE } from 'lib/reports/models';
import { ServerInfo } from 'lib/servers/models';
import { createNiceError } from 'lib/utils/errors';
import { PortHandle } from 'lib/utils/ports';
import { Store } from 'lib/stores/store';
import { INSTALL_DATA_STORE } from 'lib/installs/models';

const MIN_MONEY_PERCENTAGE = 0.8;
const MIN_SECURITY_PERCENTAGE = 0.8;

export const main = typedMain(
  SWARM_COMMAND_CALLABLE,
  async ({ ns, log, localServerInfo }, args) => {
    // Returns a fresh NetworkReport loaded after sync completes — callers never touch a stale report.
    if (!localServerInfo) {
      throw createNiceError('No local server info. Unable to start swarm');
    }
    // next goals:
    // 1. figure out the total amount of ram we have available on the network
    // 2. figure out how many threads exactly keeps us in a stable state as close to 100% as possible
    // 3. focus on the max feasible node first, remove threads from nodes that are no longer generating the same level of income
    // 4. have a min $ per second for threads
    // 5. Use max threads to grow and weaken nodes to reach 100%, before leaving a skeleton crew

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

    const deployAction = (
      action: ActionType,
      targetHost: string,
      report: NetworkReport,
    ): {
      hostToProcess: Record<string, { pid: number; threads: number }>;
      gigsSpent: number;
      threadsSpent: number;
    } => {
      const callable = ACTION_TYPE_TO_CALLABLE[action];

      // TODO(dmayor): Make the store allow kv pairs
      const scriptRam = scriptToRamCost.get(callable.scriptPath.path);

      if (scriptRam === undefined) {
        throw createNiceError('Unable to fetch ram cost', ['scriptPath', callable.scriptPath]);
      }

      const args: HackArgs = { target: targetHost };

      log.info('Deploying action', ['action', action], ['target', targetHost]);

      const hostToProcess: Record<string, { pid: number; threads: number }> = {};
      let gigsSpent = 0;
      let threadsSpent = 0;
      for (const [hostname, serverInfo] of Object.entries(report.serverToServerInfo)) {
        log.trace('Checking host', ['hostname', hostname], ['serverInfo', serverInfo]);
        if (hostname === 'home' || hostname === localhost) {
          continue;
        }
        if (!serverInfo.unstable.hasRootAccess) {
          log.debug('Do not have root access on this node. Skipping', ['hostname', hostname]);
          continue;
        }

        // ram should never be undefined but a failure was spotted...
        const threads = Math.floor(serverInfo.ram / scriptRam) ?? 0;

        threadsSpent += threads;
        gigsSpent += scriptRam * threads;

        if (threads <= 0) {
          continue;
        }

        const pid = execCallable({
          ns,
          hostname,
          callableDefinition: callable,
          runOptions: { threads },
          args,
        });

        if (pid !== undefined) {
          hostToProcess[hostname] = {
            pid,
            threads,
          };
        } else {
          log.warn('Unable to start callable', ['targetHost', hostname], ['callable', callable]);
        }
      }

      return {
        hostToProcess,
        threadsSpent,
        gigsSpent,
      };
    };

    log.info('Starting swarm');
    let runningReport = networkReportStore.load();
    let targetInfo = args?.target
      ? runningReport.serverToServerInfo[args.target]!
      : selectBestTarget(ns, runningReport);
    let currentAction = computeAction(targetInfo);
    let deployInfo = deployAction(currentAction, targetInfo.hostname, runningReport);

    while (true) {
      const { hacking } = ns.getPlayer().skills;
      const newAction = computeAction(targetInfo);

      if (newAction !== currentAction) {
        log.info(
          'Re-spinning after action change',
          ['hackingLevel', hacking],
          ['previousAction', currentAction],
          ['newAction', newAction],
        );
        // report = files.loadJson(ns, NETWORK_REPORT_PATH, networkReportGuard);
        targetInfo = args?.target
          ? runningReport.serverToServerInfo[args.target]!
          : selectBestTarget(ns, runningReport);
        currentAction = computeAction(targetInfo);

        for (const pid of Object.values(deployInfo.hostToProcess).map(({ pid }) => pid)) {
          ns.kill(pid);
        }

        deployInfo = deployAction(currentAction, targetInfo.hostname, runningReport);
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
              ['target', targetInfo.hostname],
              ['host', data.hostname],
              ['growAmount', data.growAmount],
            );
            // runningReport.serverToServerInfo[targetInfo.hostname]!.unstable.moneyAvailable *=
            //   data.growAmount;

            // const securityGrow = ns.growthAnalyzeSecurity(
            //   deployInfo.hostToProcess[data.hostname]!.threads,
            //   targetInfo.hostname,
            // );

            // runningReport.serverToServerInfo[targetInfo.hostname]!.unstable.securityLevel +=
            //   securityGrow;
            break;
          }
          case 'weaken':
            log.debug(
              'Completed weaken on node',
              ['target', targetInfo.hostname],
              ['host', data.hostname],
              ['weakenAmount', data.weakenAmount],
            );
            // runningReport.serverToServerInfo[targetInfo.hostname]!.unstable.securityLevel -=
            //   data.weakenAmount;
            break;
          case 'hack': {
            log.debug(
              'Completed hack on node',
              ['target', targetInfo.hostname],
              ['host', data.hostname],
              ['hackAmount', data.hackAmount],
            );
            // runningReport.serverToServerInfo[targetInfo.hostname]!.unstable.moneyAvailable -=
            //   data.hackAmount;

            // const securityHackGrow = ns.hackAnalyzeSecurity(
            //   deployInfo.hostToProcess[data.hostname]!.threads,
            //   targetInfo.hostname,
            // );

            // runningReport.serverToServerInfo[targetInfo.hostname]!.unstable.securityLevel +=
            //   securityHackGrow;
            break;
          }
          default: {
            const neverData: never = data;
            throw createNiceError('Unknown data type', ['data', neverData]);
          }
        }

        if (args?.managed) {
          runningReport = networkReportStore.load();
        } else {
          networkReportStore.write(runningReport);
          for (const host of Object.keys(runningReport.serverToServerInfo)) {
            ns.scp(NETWORK_REPORT_STORE.location.path, host);
          }
        }

        await ns.sleep(100);
      }

      log.trace('Sleeping for 60 seconds');
      await ns.sleep(60_000);
    }
  },
);

const selectBestTarget = (ns: NS, report: NetworkReport): ServerInfo => {
  const playerLevel = ns.getPlayer().skills.hacking;

  const getMaxMoneyPerTick = ({
    minSecurityLevel,
    baseSecurityLevel,
    hostname,
    maxMoney,
  }: ServerInfo): number => {
    const hackTime = ns.getHackTime(hostname);
    const hackTimeAtMinSecurity = (hackTime / baseSecurityLevel) * minSecurityLevel;

    return maxMoney / hackTimeAtMinSecurity;
  };

  const sortedBestTargets = Object.values(report.serverToServerInfo)
    .filter(
      ({ maxMoney, requiredHackingLevel, unstable }) =>
        maxMoney > 0 && requiredHackingLevel <= playerLevel && unstable.hasRootAccess,
    )
    .sort((a, b) => getMaxMoneyPerTick(a) - getMaxMoneyPerTick(b));
  // get best potential hacking times

  const best = sortedBestTargets.at(0);
  if (!best) {
    throw createNiceError('swarm: no hackable server found in network report');
  }

  return best;
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
