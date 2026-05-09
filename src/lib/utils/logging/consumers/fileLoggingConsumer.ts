import * as files from 'lib/utils/files';
import { LogConsumer, StructuredLogMessage } from 'lib/utils/logging/logger';
import { Path } from 'lib/utils/paths';

export const createFileLogConsumer =
  (ns: NS, path: Path): LogConsumer =>
  (logMessage: StructuredLogMessage) =>
    files.append(ns, path, logMessage);
