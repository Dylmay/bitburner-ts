import { StructuredLogMessage, structuredLogMessageGuard } from 'lib/utils/logging/logger';
import { Port } from 'lib/utils/ports';

export type LoggingPort = Port<StructuredLogMessage>;

export const createPortLogger = (port: number): LoggingPort => ({
  port,
  guard: structuredLogMessageGuard,
});
