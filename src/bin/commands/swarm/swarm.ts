import { AnyCallableDefinition, typedMain } from 'lib/callables/typedCallable';
import { SWARM_COMMAND_CALLABLE } from 'bin/commands/swarm/models';
import {
  KILL_CRAWLER_CALLABLE,
  INFIL_CRAWLER_CALLABLE,
  SCAN_CALLABLE,
  ActionType,
  ACTION_TYPE_TO_CALLABLE,
} from 'lib/scripts/models';
import { execCallable, ExecCallableArgs } from 'lib/callables/exec';
import {
  HackArgs,
} from 'lib/hacks/models';
import * as files from 'lib/utils/files';
import { NETWORK_REPORT_PATH, networkReportGuard, NetworkReport } from 'lib/reports/models';
import { ServerInfo } from 'lib/servers/models';
import { createNiceError } from 'lib/utils/errors';
import { execCallableAndWait } from 'lib/callables/execAndWait';

const MIN_MONEY_PERCENTAGE = 0.8;
const MIN_SECURITY_PERCENTAGE = 0.8;

export const main = typedMain(SWARM_COMMAND_CALLABLE, async ({ ns, log, localServerInfo }) => {
  // Returns a fresh NetworkReport loaded after sync completes — callers never touch a stale report.
  if (!localServerInfo) {
    throw createNiceError('No local server info. Unable to start swarm');
  }

  const { hostname: localhost } = localServerInfo;

  const fullSpin = async (): Promise<NetworkReport> => {
    await throwOrWait({ ns, hostname: localhost, callableDefinition: KILL_CRAWLER_CALLABLE });
    await throwOrWait({ ns, hostname: localhost, callableDefinition: INFIL_CRAWLER_CALLABLE });
    await throwOrWait({ ns, hostname: localhost, callableDefinition: SCAN_CALLABLE });
    return files.loadJson(ns, NETWORK_REPORT_PATH, networkReportGuard);
  };

  const deployAction = (action: ActionType, targetHost: string, report: NetworkReport) => {
    const callable = ACTION_TYPE_TO_CALLABLE[action];

    const scriptRam = ns.getScriptRam(callable.scriptPath);
    const args: HackArgs = { target: targetHost };

    log.info('Deploying action', ['action', action], ['target', targetHost]);

    for (const [hostname, serverInfo] of Object.entries(report.serverToServerInfo)) {
      if (hostname === 'home') continue;
      const threads = Math.floor(serverInfo.ram / scriptRam);
      if (threads <= 0) continue;
      execCallable({
        ns,
        hostname,
        callableDefinition: callable,
        runOptions: { threads },
        args,
        log,
      });
    }
  };

  let lastSpinLevel = ns.getPlayer().skills.hacking;

  log.info('Starting swarm');
  let report = await fullSpin();
  let targetInfo = selectBestTarget(ns, report);
  let currentAction = computeAction(ns, targetInfo);
  deployAction(currentAction, targetInfo.hostname, report);

  while (true) {
    const { hacking } = ns.getPlayer().skills;
    const newAction = computeAction(ns, targetInfo);

    if (newAction !== currentAction || hacking - lastSpinLevel >= 50) {
      log.info(
        'Re-spinning after hacking level gain',
        ['hackingLevel', hacking],
        ['lastSpinLevel', lastSpinLevel],
      );
      lastSpinLevel = hacking;
      report = await fullSpin();
      targetInfo = selectBestTarget(ns, report);
      currentAction = computeAction(ns, targetInfo);
      deployAction(currentAction, targetInfo.hostname, report);
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

const computeAction = (ns: NS, info: ServerInfo): ActionType => {
  const { securityLevel, moneyAvailable } = info.unstable;
  if (info.minSecurityLevel / securityLevel < MIN_SECURITY_PERCENTAGE) {
    return 'weaken';
  }

  if (moneyAvailable / info.maxMoney < MIN_MONEY_PERCENTAGE) {
    return 'grow';
  }

  return 'hack';
};

const throwOrWait = async (callableArgs: ExecCallableArgs<AnyCallableDefinition>) => {
  const pid = await execCallableAndWait(callableArgs);
  if (!pid) {
    throw createNiceError('Unable to start callable', [
      'definition',
      callableArgs.callableDefinition,
    ]);
  }
};
