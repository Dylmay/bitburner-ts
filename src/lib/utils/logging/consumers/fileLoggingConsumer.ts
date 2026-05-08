import * as files from 'lib/utils/files';
import { LogConsumer } from 'lib/utils/logging/logger';

export const createFileLogConsumer =
  (ns: NS, path: files.Path): LogConsumer =>
  (message: string) =>
    files.append(ns, path, message);
