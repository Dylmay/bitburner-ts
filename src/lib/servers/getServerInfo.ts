import { typedMain } from 'lib/callables/typedCallable';
import { GET_SERVER_INFO_CALLABLE } from 'lib/servers/models';
import { createNiceError } from 'lib/utils/errors';

export const main = typedMain(GET_SERVER_INFO_CALLABLE, async ({ outputPort, localServerInfo }) => {
  if (!outputPort) {
    throw createNiceError('getServerInfo needs a configured output port');
  }

  if (!localServerInfo) {
    throw createNiceError('no local server info provided');
  }

  outputPort.write({ host: localServerInfo.hostname, serverInfo: localServerInfo });
});
