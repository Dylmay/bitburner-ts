import { typedMain, AnyCallableDefinition } from 'lib/callables/typedCallable';
import { AUTO_COMMAND_CALLABLE } from 'bin/commands/auto/models';
import { NETWORK_REPORT_STORE } from 'lib/reports/models';
import { INSTALL_DATA_STORE } from 'lib/installs/models';
import { SNIFF_COMMAND_CALLABLE } from 'bin/commands/sniff/models';
import { SWARM_COMMAND_CALLABLE } from 'bin/commands/swarm/models';
import { DEPLOY_COMMAND_CALLABLE } from 'bin/commands/deploy/models';
import { execCallable } from 'lib/callables/exec';
import { Store } from 'lib/stores/store';
import { createNiceError } from 'lib/utils/errors';
import { spawnCallable } from 'lib/callables/spawn';

type ServiceDef = {
  name: string;
  callableDefinition: AnyCallableDefinition;
  args?: unknown;
};

const SERVICES: ServiceDef[] = [
  { name: 'sniff', callableDefinition: SNIFF_COMMAND_CALLABLE },
  {
    name: 'swarm',
    callableDefinition: SWARM_COMMAND_CALLABLE,
    args: { target: undefined, managed: true },
  },
];

export const main = typedMain(AUTO_COMMAND_CALLABLE, async ({ ns, log }) => {
  const report = Store.openStore(ns, NETWORK_REPORT_STORE).load();
  const { filenameToInfo } = Store.openStore(ns, INSTALL_DATA_STORE).load();

  const allRooted = Object.values(report.serverToServerInfo).filter(
    ({ unstable }) => unstable.hasRootAccess,
  );

  log.info(
    'Rooted servers',
    ['count', allRooted.length],
    ['hosts', allRooted.map((s) => s.hostname)],
  );

  const candidates = allRooted.filter(({ hostname }) => hostname !== 'home');

  log.info('Candidates (excl. home)', ['count', candidates.length]);
  for (const c of candidates) {
    log.debug('Candidate', ['host', c.hostname], ['ram', c.ram]);
  }

  const reservedRam = new Map<string, number>();

  for (const service of SERVICES) {
    const ram = filenameToInfo[service.callableDefinition.scriptPath.path]?.ramUsage;
    if (ram === undefined) {
      throw createNiceError('auto: RAM cost not found in install data', ['service', service.name]);
    }

    const host = candidates
      .map((server) => ({
        server,
        available: server.ram - (reservedRam.get(server.hostname) ?? 0),
      }))
      .filter(({ available }) => available >= ram)
      .sort((a, b) => a.available - b.available)[0]?.server;

    if (!host) {
      throw createNiceError('auto: no suitable host', ['service', service.name]);
    }

    reservedRam.set(host.hostname, (reservedRam.get(host.hostname) ?? 0) + ram);

    log.debug('Picked worker', ['service', service.name], ['host', host.hostname], ['ram', ram]);

    const hostname = host.hostname;

    log.info('Launching', ['service', service.name], ['host', hostname]);
    const pid = execCallable({
      ns,
      hostname,
      callableDefinition: service.callableDefinition,
      args: service.args,
    });
    if (!pid) {
      throw createNiceError(
        'auto: failed to launch',
        ['service', service.name],
        ['host', hostname],
      );
    }
  }

  spawnCallable({
    ns,
    callableDefinition: DEPLOY_COMMAND_CALLABLE,
    args: { managed: 'managed' },
  });
});
