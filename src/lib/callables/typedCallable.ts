import { parseJsonArgs, parseJsonArgsCallableOptions } from 'lib/args/jsonArgs';
import { SERVER_INFO_STORE, ServerInfo } from 'lib/servers/models';
import { createPortLoggingConsumer } from 'lib/utils/logging/consumers/portLoggingConsumer';
import { Logger, LogLevel } from 'lib/utils/logging/logger';
import { LoggingPort } from 'lib/utils/logging/portLogger';
import { Port, PortHandle } from 'lib/utils/ports';
import { Store } from 'lib/stores/store';
import { Path } from 'lib/utils/files/paths';

export type AnyCallableDefinition = { readonly scriptPath: Path };

export type TypedCallableDefinition<TArg, TPortOutput = never> = AnyCallableDefinition & {
  readonly scriptPath: Path;
  readonly __phantom?: TArg;
  readonly outputPort?: Port<TPortOutput>;
};

export type CallableOptions = {
  logLevel?: LogLevel;
  loggingPort?: LoggingPort;
};

export type ScriptContext<TPortOutput = never> = {
  ns: NS;
  log: Logger;
  localServerInfo: ServerInfo | undefined;
  outputPort?: PortHandle<TPortOutput>;
};

export type Callable<T, TPortOutput = never> = (
  ctx: ScriptContext<TPortOutput>,
  args?: T,
) => Promise<void>;

export type CallableFor<TDef> =
  TDef extends TypedCallableDefinition<infer TArg, infer TPortOutput>
    ? Callable<TArg, TPortOutput>
    : never;

export type ArgOf<TDef> = TDef extends TypedCallableDefinition<infer TArg, infer _> ? TArg : never;

export const asCommandCallable = <T>(
  def: AnyCallableDefinition,
): TypedCallableDefinition<T, never> => ({
  scriptPath: def.scriptPath,
});

export type PortOutputOf<TDef> =
  TDef extends TypedCallableDefinition<infer _, infer TPortOutput> ? TPortOutput : never;

/**
 * Usage:
 * export const main = typedMain(
 *   typedCallableDefinition, // must be exportable to clients
 *   ({ ns, logger }, args) => {
 *
 *   },
 * );
 *
 */
export const typedMain =
  <T, TPortOutput>(
    definition: TypedCallableDefinition<T, TPortOutput>,
    main: Callable<T, TPortOutput>,
  ) =>
  async (ns: NS) => {
    const callableOptions = parseJsonArgsCallableOptions(ns);

    const localServerInfo = Store.openStore(ns, SERVER_INFO_STORE).tryLoad();

    const log = Logger.getLogger(ns, definition.scriptPath)
      .disablingDefaultNsLogging()
      .withMinimumLogLevel(LogLevel.INFO);

    if (callableOptions !== undefined) {
      if (callableOptions.logLevel !== undefined) {
        log.withMinimumLogLevel(callableOptions.logLevel);
      }
      if (callableOptions.loggingPort !== undefined) {
        log.withConsumer(createPortLoggingConsumer(ns, callableOptions.loggingPort));
      }
    }

    if (localServerInfo !== undefined) {
      log.withLoggingContext(['localhost', localServerInfo.hostname]);
    }

    log.trace('Fetched callable options', ['callableOptions', callableOptions]);

    const ctx: ScriptContext<TPortOutput> = {
      ns,
      log,
      localServerInfo,
      ...(definition.outputPort
        ? { outputPort: PortHandle.connectToPort(ns, definition.outputPort, log) }
        : {}),
    };

    // It's generally fine to cast here. The expectation is any typed main callable is called through the equivalent
    // {exec|run|spawn}Callable which will do it's own type checking
    await main(ctx, parseJsonArgs(ns) as T | undefined);
  };
