import { AnyCallableDefinition, TypedCallableDefinition } from 'lib/callables/typedCallable';
import {
  GROW_MONEY_CALLABLE,
  HACK_ALL_CALLABLE,
  HACK_MONEY_CALLABLE,
  WEAKEN_SECURITY_CALLABLE,
} from 'lib/hacks/models';
import { ServerInfo, serverInfoGuard } from 'lib/servers/models';
import { pathOf } from 'lib/utils/files/paths';
import { objectGuard } from 'lib/utils/typeGuard';

export type ActionType = 'spin' | 'grow' | 'weaken' | 'hack';

export type HackCrawlerArgs = {
  action: ActionType;
  targetHost?: string | undefined;
};

export const ACTION_TYPE_TO_CALLABLE: { [K in ActionType]: AnyCallableDefinition } = {
  spin: HACK_ALL_CALLABLE,
  grow: GROW_MONEY_CALLABLE,
  weaken: WEAKEN_SECURITY_CALLABLE,
  hack: HACK_MONEY_CALLABLE,
};

export const HACK_CRAWLER_CALLABLE: TypedCallableDefinition<HackCrawlerArgs> = {
  scriptPath: pathOf('lib/scripts/hack.ts'),
};

export type InstallCrawlerOutputPortArgs = {
  host: string;
  serverInfo: ServerInfo;
};

const installCrawlerOutputPortGuard = objectGuard<InstallCrawlerOutputPortArgs>({
  host: 'string',
  serverInfo: serverInfoGuard,
});

export const INSTALL_CRAWLER_CALLABLE: TypedCallableDefinition<void, InstallCrawlerOutputPortArgs> =
  {
    scriptPath: pathOf('lib/scripts/install.ts'),
    outputPort: {
      port: 2345,
      guard: installCrawlerOutputPortGuard,
    },
  };

export type KillCrawlerArgs = {
  excludedServers: string[];
};

export const KILL_CRAWLER_CALLABLE: TypedCallableDefinition<KillCrawlerArgs | undefined> = {
  scriptPath: pathOf('lib/scripts/kill.ts'),
};

export const INFIL_CRAWLER_CALLABLE: TypedCallableDefinition<void> = {
  scriptPath: pathOf('lib/scripts/infil.ts'),
};

export type InfilHostArgs = { hostname: string };

export const INFIL_HOST_CALLABLE: TypedCallableDefinition<InfilHostArgs> = {
  scriptPath: pathOf('lib/scripts/infilHost.ts'),
};

export const REPORT_CRAWLER_CALLABLE: TypedCallableDefinition<void> = {
  scriptPath: pathOf('lib/scripts/report.ts'),
};

export const SCAN_CALLABLE: TypedCallableDefinition<void> = {
  scriptPath: pathOf('lib/scripts/scan.ts'),
};
