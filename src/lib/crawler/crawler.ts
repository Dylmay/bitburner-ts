import * as files from 'lib/utils/files';
import { Logger } from 'lib/utils/logging/logger';
import { SERVER_INFO_PATH, serverInfoGuard } from 'lib/servers/models';
import { tryCast, typeIs, guard } from 'lib/utils/typeGuard';
import { execCallableAndWait } from 'lib/callables/execAndWait';
import { ArgOf, AnyCallableDefinition, CallableOptions } from 'lib/callables/typedCallable';
import { parseCrawlerJsonArgs, parseJsonArgsCallableOptions } from 'lib/args/jsonArgs';
import { createNiceError } from 'lib/utils/errors';
import {
  CrawlerKey,
  InternalServerCrawlerArgs,
  LockId,
  serverCrawlerArgsGuard,
} from 'lib/crawler/models';

export type ServerVisitor = ({
  currentHost,
  hostToVisit,
}: {
  currentHost: string;
  hostToVisit: string;
}) => Promise<void>;

type ServerLockfile = {
  locks: { [key: CrawlerKey]: LockId };
};

const serverLockfileGuard = guard(
  (arg: unknown): arg is ServerLockfile =>
    typeIs(arg, Object) && 'locks' in arg && typeIs(arg.locks, Object),
);

const SERVER_LOCK_FILE_PATH = 'crawler/crawler.lock.json.txt';

export class ServerCrawler<TDef extends AnyCallableDefinition> {
  constructor(
    private ns: NS,
    private serversToIgnore: Set<string>,
    private log: Logger,
    private callableToLaunch: TDef,
    private depthFirst: boolean,
    private crawlerArgs: InternalServerCrawlerArgs,
    private args: ArgOf<TDef> | undefined,
    private callableOptions: CallableOptions | undefined,
  ) {}

  public static builder(ns: NS, crawlerKey: string, log: Logger): ServerCrawlerBuilder {
    return ServerCrawlerBuilder.init(ns, crawlerKey, log);
  }

  public async crawl(visitor: ServerVisitor) {
    const serverInfo = files.tryLoadJson(this.ns, SERVER_INFO_PATH, serverInfoGuard);

    if (serverInfo == null) {
      throw createNiceError('Server scanner has not ran on this node. Cannot run crawler');
    }

    const { hostname, connectableServers: servers } = serverInfo;

    const { crawlerKey, lockId } = this.crawlerArgs;

    const maybeLockfile = files.tryLoadJson(this.ns, SERVER_LOCK_FILE_PATH, serverLockfileGuard);

    if (maybeLockfile?.locks[crawlerKey] === lockId) {
      this.log.info(
        'Already visited host this run. Skipping crawl',
        ['hostname', hostname],
        ['crawlerKey', crawlerKey],
        ['lockId', lockId],
      );

      return;
    }

    const updatedLockfile = maybeLockfile ?? { locks: {} };
    updatedLockfile.locks[crawlerKey] = lockId;
    files.writeJson(this.ns, SERVER_LOCK_FILE_PATH, updatedLockfile);

    this.log.debug('Visiting host', ['hostname', hostname], ['visitableServers', servers]);
    for (const server of servers) {
      this.log.debug('Visiting server', ['servername', server]);

      if (this.serversToIgnore.has(server)) {
        this.log.info('Ignoring server', ['servername', server]);
        continue;
      }

      try {
        this.log.debug(this.depthFirst ? 'Starting dfs' : 'Starting bfs');
        this.log.debug(
          'Visiting next node',
          ['callable', this.callableToLaunch],
          ['nextHost', server],
          ['userArgs', this.args],
          ['crawlerArgs', this.crawlerArgs],
        );

        const visit = () => visitor({ currentHost: hostname, hostToVisit: server });

        const exec = async () => {
          this.log.info('Attempting to exec');
          const pid = await execCallableAndWait({
            ns: this.ns,
            hostname: server,
            callableDefinition: this.callableToLaunch,
            args: this.args,
            crawlerArgs: this.crawlerArgs,
            ...(this.callableOptions !== undefined
              ? { callableOptions: this.callableOptions }
              : {}),
          });

          // TODO(dmayor): This possibly means undefined behaviour on the visitor
          if (!pid) {
            throw createNiceError(
              'Unable to launch callable. Possibly not enough memory',
              ['definition', this.callableToLaunch],
              ['hostname', server],
            );
          }
        };

        const [first, second] = this.depthFirst ? [exec, visit] : [visit, exec];
        this.log.debug('Visiting first');
        await first();
        this.log.debug('Visiting second');
        await second();
      } catch (exc) {
        this.log.error(
          'Unable to visit server',
          ['currentHost', hostname],
          ['hostToVisit', server],
          ['Exception', exc],
        );
      }
    }
  }
}

class ServerCrawlerBuilder {
  constructor(
    private ns: NS,
    private serversToIgnore: Set<string>,
    private crawlerKey: CrawlerKey,
    private depthFirst: boolean,
    private log: Logger,
  ) {}

  public static init(ns: NS, crawlerKey: string, log: Logger): ServerCrawlerBuilder {
    return new ServerCrawlerBuilder(ns, new Set(), crawlerKey, false, log);
  }

  public ignoringServer(serverName: string): ServerCrawlerBuilder {
    this.serversToIgnore.add(serverName);
    return this;
  }

  public visitDepthFirst(): ServerCrawlerBuilder {
    this.depthFirst = true;
    return this;
  }

  public calling<TDef extends AnyCallableDefinition>(
    callableToLaunch: TDef,
    args?: ArgOf<TDef>,
  ): ServerCrawler<TDef> {
    const crawlerArgs = tryCast(parseCrawlerJsonArgs(this.ns), serverCrawlerArgsGuard) ?? {
      __type: 'serverCrawlerArgs',
      lockId: crypto.randomUUID(),
      crawlerKey: this.crawlerKey,
    };

    if (crawlerArgs.crawlerKey != this.crawlerKey) {
      throw createNiceError(
        'Unexpexcted difference in crawler keys',
        ['expected', this.crawlerKey],
        ['given', crawlerArgs.crawlerKey],
      );
    }

    const callableOptions = parseJsonArgsCallableOptions(this.ns);

    return new ServerCrawler(
      this.ns,
      this.serversToIgnore,
      this.log,
      callableToLaunch,
      this.depthFirst,
      crawlerArgs,
      args,
      callableOptions,
    );
  }
}
