import { HACK_ALL_CALLABLE } from 'lib/hacks/models';
import { CallableFor, typedMain } from 'lib/callables/typedCallable';
import { createNiceError } from 'lib/utils/errors';

const MIN_MONEY_AVAILABLE_PERCENTAGE = 0.8;
const MIN_SECURITY_DIFFERENCE_PERCENTAGE = 0.8;

const hackAll: CallableFor<typeof HACK_ALL_CALLABLE> = async (
  { ns, log, localServerInfo },
  args,
) => {
  if (!localServerInfo) {
    throw createNiceError('No local server info provided');
  }

  const {
    hostname: localhost,
    maxMoney: localMaxMoney,
    minSecurityLevel: localSecurityLevel,
  } = localServerInfo;

  const target = args?.target ?? localhost;
  const maxMoney = args?.maxMoney ?? localMaxMoney;
  const minSecurityLevel = args?.minSecurityLevel ?? localSecurityLevel;

  while (true) {
    const securityLevel = ns.getServerSecurityLevel(target);
    const percentageOfSecurityLevel = minSecurityLevel / securityLevel;
    const moneyAvailable = ns.getServerMoneyAvailable(target);
    const percentageOfMaxAvailable = moneyAvailable / maxMoney;

    log.debug(
      'Calculating whether to hack',
      ['target', target],
      ['minSecurityLevel', minSecurityLevel],
      ['securityLevel', ns.getServerSecurityLevel(target)],
      ['percentageLost', percentageOfSecurityLevel],
      ['maxMoney', maxMoney],
      ['availableMoney', moneyAvailable],
      ['percentageAvailable', percentageOfMaxAvailable],
    );

    if (percentageOfSecurityLevel < MIN_SECURITY_DIFFERENCE_PERCENTAGE) {
      log.info(
        'current security level is above ' +
          MIN_SECURITY_DIFFERENCE_PERCENTAGE * 100 +
          '%. Weakening server',
        ['target', target],
        ['minSecurityLevel', minSecurityLevel],
        ['securityLevel', securityLevel],
        ['percentageLost', percentageOfSecurityLevel],
      );

      await ns.weaken(target);
      continue;
    }

    if (percentageOfMaxAvailable < MIN_MONEY_AVAILABLE_PERCENTAGE) {
      log.info(
        'total money available is below ' +
          MIN_MONEY_AVAILABLE_PERCENTAGE * 100 +
          '%. Growing server',
        ['target', target],
        ['maxMoney', maxMoney],
        ['availableMoney', moneyAvailable],
        ['percentageAvailable', percentageOfMaxAvailable],
      );

      await ns.grow(target);
      continue;
    }

    log.info('Other conditions fulfilled, hacking', ['target', target]);

    await ns.hack(target);
  }
};

export const main = typedMain(HACK_ALL_CALLABLE, hackAll);
