# Agents & Architecture

This codebase automates hack/grow/weaken cycles in Bitburner using a distributed agent framework. Scripts coordinate across the game's simulated network via typed callable definitions, a self-replicating crawler, and port-based IPC.

---

## Entry Point

**`src/bin/orchestrator.ts`** — the only script you run directly from home. It accepts a single command string as its first argument.

| Command | Description |
|---------|-------------|
| `kill` | Kill all running scripts across all nodes |
| `sync` | Rebuild server info locally, save lib, install on all nodes |
| `infil` | sync + nuke all accessible servers (bruteSSH, ftpCrack) |
| `spin` | Continuous loop: kill → infil → sync → hack, re-spins every 10 hacking levels |
| `hack <action> [host]` | Run hack/grow/weaken crawlers; actions: `spin`, `hack`, `grow`, `weaken` |
| `report` | Generate a stats report sorted by maxMoney |
| `help` | Show command menu |

---

## Core Abstractions

### Callables (`src/lib/callables/`)

A type-safe RPC layer for spawning/executing scripts. Each script is described by a `TypedCallableDefinition<TArgs, TPortOutput>` constant. The `typedMain()` wrapper parses args and wires up logging.

```
TypedCallableDefinition<TArgs>
  scriptPath: string
  outputPort?: Port<TPortOutput>    // optional typed result port
```

**Invocation functions:**

| Function | Runs on | Blocks? |
|----------|---------|---------|
| `runCallable` | home | no |
| `runCallableAndWait` | home | yes |
| `execCallable` | remote host | no |
| `execCallableAndWait` | remote host | yes |
| `spawnCallable` | home | no (fire-and-forget) |

Args are serialized as a JSON envelope (`src/lib/args/jsonArgs.ts`) so they survive Bitburner's `ScriptArg[]` boundary.

---

### Server Crawler (`src/lib/crawler/`)

A self-replicating distributed agent. Each crawler instance:
1. Acquires a lock (`crawler.lock.json`) on the current server to prevent re-visits.
2. Runs the configured callable on that server.
3. Spawns itself on the next server in the traversal.

```typescript
const crawler = ServerCrawler.builder(ns, 'job-name', log)
  .ignoringServer('home')
  .visitDepthFirst()
  .calling(MY_CALLABLE, args);

await crawler.crawl(async ({ hostToVisit }) => {
  execCallable({ ns, hostname: hostToVisit, callableDefinition: MY_CALLABLE, args });
});
```

Pre-built crawlers (defined in `src/lib/scripts/models.ts`):

| Callable | Purpose |
|----------|---------|
| `KILL_CRAWLER_CALLABLE` | Kill all processes on every node |
| `INSTALL_CRAWLER_CALLABLE` | Copy the library to every node |
| `INFIL_CRAWLER_CALLABLE` | Nuke servers (open ports + NUKE) |
| `HACK_CRAWLER_CALLABLE` | Coordinate hack/grow/weaken per node |

---

### Scripts (`src/lib/scripts/`)

Higher-level operations driven by the crawler:

| File | What it does |
|------|-------------|
| `install.ts` | Saves library files to a remote server |
| `scan.ts` | Collects `ServerInfo` for every node, writes `NetworkReport` |
| `hack.ts` | Calculates available threads and spawns hack actions |
| `infil.ts` | Opens ports and NUKEs a server |
| `kill.ts` | Kills all scripts on a server |
| `report.ts` | Reads `NetworkReport`, formats stats output |

---

### Hacks (`src/lib/hacks/`)

Leaf-level scripts spawned by the hack crawler, one per server:

| Callable | Action |
|----------|--------|
| `HACK_ALL_CALLABLE` | Simultaneous hack + grow + weaken |
| `HACK_MONEY_CALLABLE` | `ns.hack()` — steal money |
| `GROW_MONEY_CALLABLE` | `ns.grow()` — increase funds |
| `WEAKEN_SECURITY_CALLABLE` | `ns.weaken()` — reduce security |

---

### Server Info Pipeline (`src/lib/servers/`)

Builds a `ServerInfo` object through 11 sequential steps stored in `src/lib/servers/steps/`. Steps write to an incremental builder file; the final `assemble` step creates the complete record. Results flow back to the caller via port `2346`.

Steps (in order): `setHostname` → `setRam` → `setConnectableServers` → `setMaxMoney` → `setMinSecurityLevel` → `setBaseSecurityLevel` → `setGrowthLevel` → `setFiles` → `setMoneyAvailable` → `setSecurityLevel` → `assemble`

---

## Supporting Systems

### Port Communication (`src/lib/utils/ports.ts`)

Typed wrapper around Bitburner's port system. Every port is defined as `Port<T> = { port: number; guard: Guard<unknown, T> }`.

```typescript
const handle = PortHandle.connectToPort(ns, port, log);
handle.write(data);            // write with type assertion
const data = handle.read();    // returns T | undefined, validated by guard
await handle.awaitRead();      // block until data is available
```

### Type Guards (`src/lib/utils/typeGuard.ts`)

Runtime validation that integrates with TypeScript narrowing:

```typescript
const myGuard = guard((x: unknown): x is MyType => /* validation */);

typeIs(x, myGuard)    // boolean + narrows type in if-branch
tryCast(x, myGuard)   // T | undefined
cast(x, myGuard)      // T or throws
```

Guards are used at every IPC boundary: port reads, file loads, callable args.

### Logging (`src/lib/utils/logging/`)

```typescript
const log = Logger.getLogger(ns, 'script-name')
  .disablingDefaultNsLogging()
  .withMinimumLogLevel(LogLevel.DEBUG)
  .withConsumer(createPortLoggingConsumer(ns, loggingPort));

log.info('message', ['key', value]);
```

Log levels: `TRACE < DEBUG < INFO < WARN < ERROR`. Consumers: `ns.print`, file, port.

---

## Adding a New Script

1. Define a `TypedCallableDefinition` constant in the relevant `models.ts`.
2. Implement the script with `typedMain(MY_CALLABLE, async ({ ns, log }, args) => { ... })`.
3. If it needs to run on remote servers, create a crawler that calls it.
4. Wire it into `orchestrator.ts` if it needs a top-level command.

---

## Code Style

- **Always use braces for if statements** — no single-line `if (x) return y;`. Every branch must have a `{}` block.
- **Space is a virtue** — add blank lines between logical sections within functions, between statements that represent distinct steps, and after variable declaration groups. Err on the side of more whitespace.

---

## File Conventions

- `src/bin/` — orchestrator and top-level bin scripts
- `src/lib/callables/` — invocation primitives
- `src/lib/crawler/` — distributed agent runtime
- `src/lib/scripts/` — mid-level crawler-based operations
- `src/lib/hacks/` — leaf hack/grow/weaken scripts
- `src/lib/servers/` — server info collection pipeline
- `src/lib/utils/` — ports, type guards, logging, errors, files
- `src/lib/installs/` — library packaging and installation
- `src/lib/reports/` — `NetworkReport` / `ServerName` types

Import paths are absolute from `src/` with no leading slash and no extension (e.g. `import { foo } from 'lib/utils/ports'`).
