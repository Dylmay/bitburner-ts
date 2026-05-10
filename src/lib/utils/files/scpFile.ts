import { Path } from 'lib/utils/files/paths';

export const scpFile = ({
  ns,
  at,
  to,
}: {
  ns: NS;
  at: { path: Path; sourceHost?: string };
  to: { path: Path; destinationHost: string };
}) => {
  ns.scp(at.path.path, to.destinationHost, at.sourceHost);
  ns.mv(at.path.path, to.destinationHost, to.destinationHost);
};
