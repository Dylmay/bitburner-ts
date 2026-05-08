import { Port } from 'lib/utils/ports';
import { guard, typeIs } from 'lib/utils/typeGuard';

const portLoggingGuard = guard((arg: unknown): arg is string => typeIs(arg, 'string'));

export type LoggingPort = Port<string>;

export const createPortLogger = (port: number): LoggingPort => ({ port, guard: portLoggingGuard });
