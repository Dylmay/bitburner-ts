import { ServerInfo } from 'lib/servers/models';

export const getMaxMoneyPerTick = (
  ns: NS,
  { minSecurityLevel, baseSecurityLevel, hostname, maxMoney }: ServerInfo,
): number => {
  const hackTime = ns.getHackTime(hostname);
  const hackTimeAtMinSecurity = (hackTime / baseSecurityLevel) * minSecurityLevel;

  return maxMoney / hackTimeAtMinSecurity;
};
