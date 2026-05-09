import { ServerCrawler } from 'lib/crawler/crawler';
import { HACK_CRAWLER_CALLABLE } from 'lib/scripts/models';
import {
  HACK_ALL_CALLABLE,
  HACK_MONEY_CALLABLE,
  GROW_MONEY_CALLABLE,
  WEAKEN_SECURITY_CALLABLE,
  HackAllArgs,
  HackArgs,
} from 'lib/hacks/models';
import { CallableFor, typedMain } from 'lib/callables/typedCallable';
import { execCallable } from 'lib/callables/exec';

const hackCrawler: CallableFor<typeof HACK_CRAWLER_CALLABLE> = async ({ ns, log }, maybeArgs) => {
  const { action, targetHost } = maybeArgs ?? { action: 'spin' };

  const crawler = ServerCrawler.builder(ns, 'hack-all', log)
    .ignoringServer('home')
    .visitDepthFirst()
    .calling(HACK_CRAWLER_CALLABLE, maybeArgs);

  const callableDefinition =
    action === 'spin'
      ? HACK_ALL_CALLABLE
      : action === 'grow'
        ? GROW_MONEY_CALLABLE
        : action === 'weaken'
          ? WEAKEN_SECURITY_CALLABLE
          : HACK_MONEY_CALLABLE;

  log.info('Starting crawl');

  await crawler.crawl(async ({ hostToVisit }) => {
    const ram = ns.getServerMaxRam(hostToVisit);
    const ramToBeUsed = ns.getScriptRam(callableDefinition.scriptPath.path);
    const numThreads = Math.floor(ram / ramToBeUsed);

    log.info(
      'Running script on node',
      ['action', action],
      ['runningScript', callableDefinition],
      ['target', targetHost],
      ['hostToHack', hostToVisit],
      ['maxRam', ram],
      ['ramToBeUsed', ramToBeUsed],
      ['numThreads', numThreads],
    );

    if (action === 'spin') {
      const args: HackAllArgs = {
        target: targetHost,
      };

      execCallable({
        ns,
        hostname: hostToVisit,
        runOptions: { threads: numThreads },
        args,
        callableDefinition: HACK_ALL_CALLABLE,
      });
    } else {
      const args: HackArgs = {
        target: targetHost,
      };

      execCallable({
        ns,
        hostname: hostToVisit,
        runOptions: { threads: numThreads },
        args,
        callableDefinition,
      });
    }
  });
};

export const main = typedMain(HACK_CRAWLER_CALLABLE, hackCrawler);
