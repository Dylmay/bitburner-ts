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
  ns.mv(to.destinationHost, at.path.path, to.path.path);
};
