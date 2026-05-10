import { Path } from 'lib/utils/files/paths';
import { objectGuard, array } from 'lib/utils/typeGuard';

export type LogArg = [string, unknown];

export type LogConsumer = (logMessage: StructuredLogMessage) => void;

export type StructuredLogMessage = {
  message: string;
  args: LogArg[];
  context: LogArg[];
  scriptName: string;
  logLevel: LogLevel;
  time: Date;
};

export const structuredLogMessageGuard = objectGuard<StructuredLogMessage>({
  message: 'string',
  args: array(),
  context: array(),
  scriptName: 'string',
  logLevel: 'number',
});

export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}

enum LogLevelString {
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export const logLevelToLogLevelString = (logLevel: LogLevel): LogLevelString => {
  switch (logLevel) {
    case LogLevel.TRACE:
      return LogLevelString.TRACE;

    case LogLevel.DEBUG:
      return LogLevelString.DEBUG;

    case LogLevel.INFO:
      return LogLevelString.INFO;

    case LogLevel.WARN:
      return LogLevelString.WARN;

    case LogLevel.ERROR:
      return LogLevelString.ERROR;
  }
};
const createDefaultLogConsumer =
  (ns: NS) =>
  ({ logLevel, time, args, message, context, scriptName }: StructuredLogMessage) => {
    args.unshift(['scriptName', scriptName]);

    const argsToPrint = [...context, ...args]
      .map(([argName, argValue]) => '   |-{' + argName + ': ' + JSON.stringify(argValue) + '}')
      .reduce((a, b) => a + '\n' + b, '');

    const stringifiedMessage =
      logLevelToLogLevelString(logLevel) +
      ': [' +
      time.toUTCString() +
      ']\n' +
      '  ' +
      message +
      argsToPrint;
    ns.print(stringifiedMessage);
  };

export class Logger {
  private constructor(
    private scriptName: string,
    private logConsumers: LogConsumer[],
    private loggingContext: LogArg[],
    private minimumLogLevel: LogLevel,
    private ns: NS,
  ) {}

  static getLogger(ns: NS, filePath: Path) {
    return new Logger(filePath.path, [createDefaultLogConsumer(ns)], [], LogLevel.INFO, ns);
  }

  public withConsumer(logConsumer: LogConsumer): Logger {
    this.logConsumers.push(logConsumer);
    return this;
  }

  public disablingDefaultNsLogging(): Logger {
    this.ns.disableLog('ALL');
    return this;
  }

  public withMinimumLogLevel(level: LogLevel): Logger {
    this.minimumLogLevel = level;
    return this;
  }

  public withLoggingContext(contextArg: LogArg) {
    this.loggingContext.push(contextArg);
    return this;
  }

  public trace(message: string, ...logArgs: LogArg[]) {
    this.consumeMessage(LogLevel.TRACE, message, logArgs);
  }

  public debug(message: string, ...logArgs: LogArg[]) {
    this.consumeMessage(LogLevel.DEBUG, message, logArgs);
  }

  public info(message: string, ...logArgs: LogArg[]) {
    this.consumeMessage(LogLevel.INFO, message, logArgs);
  }

  public warn(message: string, ...logArgs: LogArg[]) {
    this.consumeMessage(LogLevel.WARN, message, logArgs);
  }

  public error(message: string, ...logArgs: LogArg[]) {
    this.consumeMessage(LogLevel.ERROR, message, logArgs);
  }

  private consumeMessage(logLevel: LogLevel, message: string, args: LogArg[]) {
    if (logLevel < this.minimumLogLevel) {
      return;
    }

    const structuredLogMessage: StructuredLogMessage = {
      logLevel,
      message,
      args,
      context: this.loggingContext,
      scriptName: this.scriptName,
      time: new Date(),
    };

    this.logConsumers.forEach((consumer) => consumer(structuredLogMessage));
  }
}
