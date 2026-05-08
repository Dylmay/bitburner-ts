import { typedMain } from 'lib/callables/typedCallable';
import { SWARM_COMMAND_CALLABLE } from 'bin/commands/swarm/models';
import { ActionType, ACTION_TYPE_TO_CALLABLE } from 'lib/scripts/models';
import { execCallable } from 'lib/callables/exec';
import { HACK_OUTPUT_PORT, HackArgs } from 'lib/hacks/models';
import * as files from 'lib/utils/files';
import { NETWORK_REPORT_PATH, networkReportGuard, NetworkReport } from 'lib/reports/models';
import { ServerInfo } from 'lib/servers/models';
import { createNiceError } from 'lib/utils/errors';
import { FILES_LOCK, installDataGuard } from 'lib/installs/models';
import { PortHandle } from 'lib/utils/ports';

const MIN_MONEY_PERCENTAGE = 0.8;
const MIN_SECURITY_PERCENTAGE = 0.8;

export const main = typedMain(SWARM_COMMAND_CALLABLE, async ({ ns, log, localServerInfo }) => {
  // Returns a fresh NetworkReport loaded after sync completes — callers never touch a stale report.
  if (!localServerInfo) {
    throw createNiceError('No local server info. Unable to start swarm');
  }

  const hackListenerPort = PortHandle.connectToPort(ns, HACK_OUTPUT_PORT);
  hackListenerPort.clearPort();

  const { hostname: localhost } = localServerInfo;
  const scriptToRamCost = new Map(
    Object.entries(files.loadJson(ns, FILES_LOCK, installDataGuard).filenameToInfo)
      .filter(([_, fileInfo]) => fileInfo != null)
      .map(([filename, { ramUsage }]) => [filename, ramUsage]),
  );

  const deployAction = (
    action: ActionType,
    targetHost: string,
    report: NetworkReport,
  ): number[] => {
    const callable = ACTION_TYPE_TO_CALLABLE[action];

    const scriptRam = scriptToRamCost.get(callable.scriptPath);

    if (scriptRam === undefined) {
      throw createNiceError('Unable to fetch ram cost', ['scriptRam', scriptRam]);
    }

    const args: HackArgs = { target: targetHost };

    log.info('Deploying action', ['action', action], ['target', targetHost]);

    const pids = [];
    for (const [hostname, serverInfo] of Object.entries(report.serverToServerInfo)) {
      log.info('Checking host', ['hostname', hostname], ['serverInfo', serverInfo]);
      if (hostname === 'home' || hostname === localhost) {
        continue;
      }
      const threads = Math.floor(serverInfo.ram / scriptRam);

      if (threads <= 0) {
        continue;
      }

      const pid = execCallable({
        ns,
        hostname,
        callableDefinition: callable,
        runOptions: { threads },
        args,
        log,
      });

      if (pid !== undefined) {
        pids.push(pid);
      } else {
        log.warn('Unable to start callable', ['targetHost', hostname], ['callable', callable]);
      }
    }

    return pids;
  };

  let lastSpinLevel = ns.getPlayer().skills.hacking;

  log.info('Starting swarm');
  const runningReport = files.loadJson(ns, NETWORK_REPORT_PATH, networkReportGuard);
  let targetInfo = selectBestTarget(ns, runningReport);
  let currentAction = computeAction(targetInfo);
  let processPids = deployAction(currentAction, targetInfo.hostname, runningReport);

  while (true) {
    const { hacking } = ns.getPlayer().skills;
    const newAction = computeAction(targetInfo);

    if (newAction !== currentAction || hacking - lastSpinLevel >= 50) {
      log.info(
        'Re-spinning after hacking level gain',
        ['hackingLevel', hacking],
        ['lastSpinLevel', lastSpinLevel],
      );
      lastSpinLevel = hacking;
      // report = files.loadJson(ns, NETWORK_REPORT_PATH, networkReportGuard);
      targetInfo = selectBestTarget(ns, runningReport);
      currentAction = computeAction(targetInfo);

      for (const pid of processPids) {
        ns.kill(pid);
      }

      processPids = deployAction(currentAction, targetInfo.hostname, runningReport);
    }

    while (hackListenerPort.hasData()) {
      const data = hackListenerPort.read();
      if (data !== undefined) {
        log.debug('Hacker has completed cycle', ['cycle', data]);
        switch (data.type) {
          case 'grow':
            runningReport.serverToServerInfo[targetInfo.hostname]!.unstable.moneyAvailable *=
              data.growAmount;
            break;
          case 'weaken':
            runningReport.serverToServerInfo[targetInfo.hostname]!.unstable.securityLevel -=
              data.weakenAmount;
            break;
          case 'hack':
            runningReport.serverToServerInfo[targetInfo.hostname]!.unstable.moneyAvailable -=
              data.hackAmount;
            break;
          default: {
            const neverData: never = data;
            throw createNiceError('Unknown data type', ['data', neverData]);
          }
        }
      }
    }

    log.debug('Sleeping for 10 seconds');
    await ns.sleep(10_000);
  }
});

const selectBestTarget = (ns: NS, report: NetworkReport): ServerInfo => {
  const playerLevel = ns.getPlayer().skills.hacking;
  let best: ServerInfo | undefined;

  for (const info of Object.values(report.serverToServerInfo)) {
    if (
      info.requiredHackingLevel <= playerLevel &&
      info.maxMoney > 0 &&
      (best === undefined || info.maxMoney > best.maxMoney)
    ) {
      best = info;
    }
  }

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
