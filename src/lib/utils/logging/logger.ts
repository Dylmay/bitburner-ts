export type LogArg = [string, unknown];

export type LogConsumer = (message: string) => void;

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

const logLevelToLogLevelString = (logLevel: LogLevel): LogLevelString => {
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

export class Logger {
  private constructor(
    private scriptName: string,
    private logConsumers: LogConsumer[],
    private loggingContext: LogArg[],
    private minimumLogLevel: LogLevel,
    private ns: NS,
  ) {}

  static getLogger(ns: NS, filename: string) {
    const defaultLogConsumer = (message: string) => ns.print(message);
    return new Logger(filename, [defaultLogConsumer], [], LogLevel.INFO, ns);
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
    this.printAndFormatMessage(LogLevel.TRACE, message, logArgs);
  }

  public debug(message: string, ...logArgs: LogArg[]) {
    this.printAndFormatMessage(LogLevel.DEBUG, message, logArgs);
  }

  public info(message: string, ...logArgs: LogArg[]) {
    this.printAndFormatMessage(LogLevel.INFO, message, logArgs);
  }

  public warn(message: string, ...logArgs: LogArg[]) {
    this.printAndFormatMessage(LogLevel.WARN, message, logArgs);
  }

  public error(message: string, ...logArgs: LogArg[]) {
    this.printAndFormatMessage(LogLevel.ERROR, message, logArgs);
  }

  private printAndFormatMessage(level: LogLevel, message: string, args: LogArg[]) {
    if (level < this.minimumLogLevel) {
      return;
    }

    args.unshift(['scriptName', this.scriptName]);

    const argsToPrint = [...this.loggingContext, ...args]
      .map(([argName, argValue]) => ' |-{' + argName + ': ' + JSON.stringify(argValue) + '}')
      .reduce((a, b) => a + '\n' + b, '');

    const stringifiedMessage = logLevelToLogLevelString(level) + ': ' + message + argsToPrint;
    this.logConsumers.forEach((consumer) => consumer(stringifiedMessage));
  }
}
