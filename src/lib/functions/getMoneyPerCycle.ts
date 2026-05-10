import { ServerInfo } from 'lib/servers/models';

export const getMoneyPerCycle = (
  ns: NS,
  { minSecurityLevel, baseSecurityLevel, hostname, maxMoney }: ServerInfo,
): number => {
  const scale = minSecurityLevel / baseSecurityLevel;
  const hackTimeAtMinSecurity = ns.getHackTime(hostname) * scale;
  const growTimeAtMinSecurity = ns.getGrowTime(hostname) * scale;

  return maxMoney / (hackTimeAtMinSecurity + growTimeAtMinSecurity);
};
