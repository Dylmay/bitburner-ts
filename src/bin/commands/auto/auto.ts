import { typedMain } from 'lib/callables/typedCallable';
import { AUTO_COMMAND_CALLABLE } from 'bin/commands/auto/models';
import { NETWORK_REPORT_STORE } from 'lib/reports/models';
import { INSTALL_DATA_STORE } from 'lib/installs/models';
import { SNIFF_COMMAND_CALLABLE } from 'bin/commands/sniff/models';
import { SWARM_COMMAND_CALLABLE } from 'bin/commands/swarm/models';
import { execCallable } from 'lib/callables/exec';
import { Store } from 'lib/stores/store';
import { ServerInfo } from 'lib/servers/models';
import { createNiceError } from 'lib/utils/errors';

export const main = typedMain(AUTO_COMMAND_CALLABLE, async ({ ns, log }) => {
  const report = Store.openStore(ns, NETWORK_REPORT_STORE).load();
  const { filenameToInfo } = Store.openStore(ns, INSTALL_DATA_STORE).load();

  const sniffRam = filenameToInfo[SNIFF_COMMAND_CALLABLE.scriptPath.path]?.ramUsage;
  const swarmRam = filenameToInfo[SWARM_COMMAND_CALLABLE.scriptPath.path]?.ramUsage;

  if (sniffRam === undefined) {
    throw createNiceError('auto: RAM cost for sniff not found in install data');
  }
  if (swarmRam === undefined) {
    throw createNiceError('auto: RAM cost for swarm not found in install data');
  }

  const allRooted = Object.values(report.serverToServerInfo).filter(
    ({ unstable }) => unstable.hasRootAccess,
  );

  log.info('Rooted servers', ['count', allRooted.length], ['hosts', allRooted.map((s) => s.hostname)]);

  const candidates = allRooted
    .filter(({ hostname }) => hostname !== 'home')
    .sort((a, b) => a.maxMoney - b.maxMoney);

  log.info('Candidates (excl. home)', ['count', candidates.length], ['sniffRam', sniffRam], ['swarmRam', swarmRam]);
  for (const c of candidates) {
    log.debug('Candidate', ['host', c.hostname], ['maxMoney', c.maxMoney], ['ram', c.ram]);
  }

  const reservedRam = new Map<string, number>();

  const pickHost = (minRam: number): ServerInfo | undefined => {
    const host = candidates.find(({ hostname, ram }) => {
      const used = reservedRam.get(hostname) ?? 0;
      return ram - used >= minRam;
    });
    if (host) {
      reservedRam.set(host.hostname, (reservedRam.get(host.hostname) ?? 0) + minRam);
    }
    return host;
  };

  const sniffHost = pickHost(sniffRam);
  const swarmHost = pickHost(swarmRam);

  if (!sniffHost) {
    throw createNiceError('auto: no suitable host for sniff');
  }
  if (!swarmHost) {
    throw createNiceError('auto: no suitable host for swarm');
  }

  log.info('Launching sniff', ['host', sniffHost.hostname]);
  const sniffPid = execCallable({
    ns,
    hostname: sniffHost.hostname,
    callableDefinition: SNIFF_COMMAND_CALLABLE,
  });
  if (!sniffPid) {
    throw createNiceError('auto: failed to launch sniff', ['host', sniffHost.hostname]);
  }

  log.info('Launching swarm', ['host', swarmHost.hostname]);
  const swarmPid = execCallable({
    ns,
    hostname: swarmHost.hostname,
    callableDefinition: SWARM_COMMAND_CALLABLE,
    args: { target: undefined, managed: true },
  });
  if (!swarmPid) {
    throw createNiceError('auto: failed to launch swarm', ['host', swarmHost.hostname]);
  }
});
