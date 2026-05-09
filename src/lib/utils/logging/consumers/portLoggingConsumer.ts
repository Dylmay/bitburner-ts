import { PortHandle } from 'lib/utils/ports';
import { LogConsumer, StructuredLogMessage } from 'lib/utils/logging/logger';
import { LoggingPort } from 'lib/utils/logging/portLogger';

export const createPortLoggingConsumer = (ns: NS, loggingPort: LoggingPort): LogConsumer => {
  const portHandle = PortHandle.connectToPort(ns, loggingPort);

  return (logMessage: StructuredLogMessage) => portHandle.write(logMessage);
};
