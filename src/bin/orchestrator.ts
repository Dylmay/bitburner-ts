import { spawnCallable } from 'lib/callables/spawn';
import { guard, tryCast, typeIs } from 'lib/utils/typeGuard';
import { Command } from 'bin/commands/models';
import { analyticsCommand, AnalyticsCommand } from 'bin/commands/analytics/models';
import { hackCommand, HackCommand } from 'bin/commands/hack';
import { infilCommand, InfilCommand } from 'bin/commands/infil';
import { killCommand, KillCommand } from 'bin/commands/kill';
import { statsCommand, StatsCommand } from 'bin/commands/stats/models';
import { swarmCommand, SwarmCommand } from 'bin/commands/swarm/models';
import { spinCommand, SpinCommand } from 'bin/commands/spin/models';
import { syncCommand, SyncCommand } from 'bin/commands/sync/models';
import { sniffCommand, SniffCommand } from 'bin/commands/sniff/models';
import { EXEC_CALLABLE, ExecArgs } from 'lib/exec/models';
import { Logger } from 'lib/utils/logging/logger';
import { Path, pathOf } from 'lib/utils/files/paths';

export type AvailableCommands =
  | AnalyticsCommand
  | SwarmCommand
  | HackCommand
  | InfilCommand
  | KillCommand
  | StatsCommand
  | SpinCommand
  | SyncCommand
  | SniffCommand;

// export const allCommands: [CommandName, Command<unknown>][] = [
//   analyticsCommand,
//   hackCommand,
//   infilCommand,
//   killCommand,
//   statsCommand,
//   spinCommand,
//   syncCommand,
// ].map((command) => [command.command, command]);

export const COMMANDS: {
  [K in CommandName]: Command<unknown> & Extract<AvailableCommands, { command: K }>;
} = {
  analytics: analyticsCommand,
  swarm: swarmCommand,
  hack: hackCommand,
  infil: infilCommand,
  kill: killCommand,
  stats: statsCommand,
  spin: spinCommand,
  sync: syncCommand,
  sniff: sniffCommand,
};

export async function main(ns: NS) {
  const log = Logger.getLogger(ns, pathOf('bin/orchestrator.ts'));

  const { host, remaining } = extractHost(ns.args);
  const { portOutputPath, remaining: remainingArgs } = extractPortOutputPath(remaining);

  const [commandArg, ...rest] = remainingArgs;
  const commandName = tryCast(commandArg, commandNameGuard);

  log.info(
    'parsed args',
    ['commandName', commandName],
    ['commandArgs', rest],
    ['host', host],
    ['portOutputPath', portOutputPath],
  );

  if (!commandName || commandName === 'help') {
    printHelp(ns);
    return;
  }

  const command = COMMANDS[commandName];

  if (!command) {
    printHelp(ns);
    return;
  }

  const args = command.parseArgs(rest);

  if (host) {
    const execArgs: ExecArgs = {
      definition: command.definition,
      processArgs: args,
      hostToExecTo: host,
      ...(portOutputPath ? { writePortOutputTo: portOutputPath } : {}),
    };

    spawnCallable({
      ns,
      callableDefinition: EXEC_CALLABLE,
      args: execArgs,
    });
  }

  spawnCallable({
    ns,
    callableDefinition: command.definition,
    args,
  });
}

const extractHost = (args: ScriptArg[]): { host?: string; remaining: ScriptArg[] } => {
  const hostIdx = args.findIndex((a) => a === '--host');
  if (hostIdx === -1 || !typeIs(args[hostIdx + 1], 'string')) return { remaining: args };
  const remaining = args.filter((_, i) => i !== hostIdx && i !== hostIdx + 1);
  return { host: args[hostIdx + 1] as string, remaining };
};

const extractPortOutputPath = (
  args: ScriptArg[],
): { portOutputPath?: Path; remaining: ScriptArg[] } => {
  const hostIdx = args.findIndex((a) => a === '--port-output');
  if (hostIdx === -1 || !typeIs(args[hostIdx + 1], 'string')) return { remaining: args };
  const remaining = args.filter((_, i) => i !== hostIdx && i !== hostIdx + 1);
  return { portOutputPath: pathOf(args[hostIdx + 1] as string), remaining };
};

const printHelp = (ns: NS) => {
  const lines = (Object.entries(COMMANDS) as [string, { description: string }][])
    .map(([name, def]) => `  ${name.padEnd(8)} ${def.description}`)
    .join('\n');
  ns.alert(`Orchestrator Help:\nCommands:\n${lines}`);
};

type CommandName = Command<never, never>['command'];

const commandNameGuard = guard<CommandName | 'help'>((cmd) => {
  if (!typeIs(cmd, 'string'))
    return { ok: false, failures: [{ path: [], reason: `expected string, got ${typeof cmd}` }] };
  if (cmd === 'help' || Object.keys(COMMANDS).includes(cmd))
    return { ok: true, value: cmd as CommandName | 'help' };
  return { ok: false, failures: [{ path: [], reason: `"${cmd}" is not a valid command` }] };
});
