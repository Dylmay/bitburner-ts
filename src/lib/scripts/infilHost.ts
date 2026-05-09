import { typedMain } from 'lib/callables/typedCallable';
import { Logger } from 'lib/utils/logging/logger';
import { INFIL_HOST_CALLABLE } from 'lib/scripts/models';
import { createNiceError } from 'lib/utils/errors';

export const infilHost = async (ns: NS, log: Logger, hostname: string): Promise<void> => {
  try {
    log.info('Attempting to infiltrate host', ['hostname', hostname]);

    const completedBrute = ns.brutessh(hostname);
    const completedFtpCrack = ns.ftpcrack(hostname);
    const completedNuke = ns.nuke(hostname);
    const completedSmtp = ns.relaysmtp(hostname);

    log.info(
      'Completed infiltration',
      ['bruteSshSuccessful', completedBrute],
      ['ftpCrackSuccessful', completedFtpCrack],
      ['nukeSuccessful', completedNuke],
      ['smtpSuccessful', completedSmtp],
    );
  } catch (exc) {
    log.warn('Unable to infiltrate host', ['hostname', hostname], ['exception', exc]);
  }
};

export const main = typedMain(INFIL_HOST_CALLABLE, async ({ ns, log }, args) => {
  if (!args) {
    throw createNiceError('infilHost: missing args');
  }

  await infilHost(ns, log, args.hostname);
});
