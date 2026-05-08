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
import { EXEC_CALLABLE, ExecArgs } from 'lib/exec/models';
import * as files from 'lib/utils/files';

export type AvailableCommands =
  | AnalyticsCommand
  | SwarmCommand
  | HackCommand
  | InfilCommand
  | KillCommand
  | StatsCommand
  | SpinCommand
  | SyncCommand;

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
};

export async function main(ns: NS) {
  const [commandArg, ...rest] = ns.args;
  const commandName = tryCast(commandArg, commandNameGuard);
  if (!commandName || commandName === 'help') {
    printHelp(ns);
    return;
  }

  const command = COMMANDS[commandName];

  if (!command) {
    printHelp(ns);
    return;
  }

  const { host, remaining } = extractHost(rest);
  const { portOutputPath, remaining: serviceArgs } = extractPortOutputPath(remaining);
  const args = command.parseArgs(serviceArgs);

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
): { portOutputPath?: files.Path; remaining: ScriptArg[] } => {
  const hostIdx = args.findIndex((a) => a === '--port-output');
  if (hostIdx === -1 || !typeIs(args[hostIdx + 1], 'string')) return { remaining: args };
  const remaining = args.filter((_, i) => i !== hostIdx && i !== hostIdx + 1);
  return { portOutputPath: args[hostIdx + 1] as string, remaining };
};

const printHelp = (ns: NS) => {
  const lines = (Object.entries(COMMANDS) as [string, { description: string }][])
    .map(([name, def]) => `  ${name.padEnd(8)} ${def.description}`)
    .join('\n');
  ns.alert(`Orchestrator Help:\nCommands:\n${lines}`);
};

type CommandName = Command<never, never>['command'];

const commandNameGuard = guard(
  (cmd: ScriptArg): cmd is CommandName =>
    typeIs(cmd, 'string') && (cmd === 'help' || Object.keys(COMMANDS).includes(cmd)),
);
