export type StringFlagDef = { type: 'string'; default?: string; desc?: string };
export type BooleanFlagDef = { type: 'boolean'; default: boolean; desc?: string };
export type NumberFlagDef = { type: 'number'; default?: number; desc?: string };

export type AnyFlagDef = StringFlagDef | BooleanFlagDef | NumberFlagDef;

export type FlagSchema = Record<string, AnyFlagDef>;

type FlagValue<T extends AnyFlagDef> = T extends BooleanFlagDef
  ? boolean
  : T extends StringFlagDef
    ? string | undefined
    : number | undefined;

export type ParsedFlags<TSchema extends FlagSchema> = {
  [K in keyof TSchema]: FlagValue<TSchema[K]>;
};

export const flag = {
  string: (opts?: Omit<StringFlagDef, 'type'>): StringFlagDef => ({ type: 'string', ...opts }),
  boolean: (opts?: Omit<BooleanFlagDef, 'type' | 'default'>): BooleanFlagDef => ({ type: 'boolean', default: false, ...opts }),
  number: (opts?: Omit<NumberFlagDef, 'type'>): NumberFlagDef => ({ type: 'number', ...opts }),
};

export function parseFlags<TSchema extends FlagSchema>(
  args: ScriptArg[],
  schema: TSchema,
): { flags: ParsedFlags<TSchema>; rest: ScriptArg[] } {
  const result: Record<string, unknown> = {};
  const consumed = new Set<number>();

  for (const [key, def] of Object.entries(schema)) {
    result[key] = def.default;
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (typeof arg !== 'string' || !arg.startsWith('--')) continue;

    const flagName = arg.slice(2);
    const def = schema[flagName];
    if (!def) continue;
    consumed.add(i);

    if (def.type === 'boolean') {
      result[flagName] = true;
    } else {
      const next = args[i + 1];
      if (next !== undefined) {
        consumed.add(i + 1);
        result[flagName] = def.type === 'number' ? Number(next) : String(next);
        i++;
      }
    }
  }

  const rest = args.filter((_, i) => !consumed.has(i));
  return { flags: result as ParsedFlags<TSchema>, rest };
}

export function flagsHelp(schema: FlagSchema): string {
  return Object.entries(schema)
    .map(([name, def]) => {
      const label = def.type === 'boolean' ? `--${name}` : `--${name} <${def.type}>`;
      const defaultNote =
        def.default !== undefined && def.default !== false ? ` (default: ${def.default})` : '';
      const desc = def.desc ? `  ${def.desc}${defaultNote}` : defaultNote;
      return `    ${label.padEnd(22)}${desc}`.trimEnd();
    })
    .join('\n');
}
