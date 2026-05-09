import { createNiceError } from 'lib/utils/errors';

type PrimitiveName = 'string' | 'number' | 'boolean' | 'bigint' | 'symbol' | 'undefined';

type PrimitiveMap = {
  string: string;
  number: number;
  boolean: boolean;
  bigint: bigint;
  symbol: symbol;
  undefined: undefined;
};

type AnyConstructor = (abstract new (...args: never[]) => unknown) & { readonly name: string };

const GUARD = Symbol('guard');
const GUARD_CHECK = Symbol('guardCheck');
const OPTIONAL = Symbol('optional');
const ARRAY_FIELD = Symbol('arrayField');

export type GuardFailure = { path: string[]; reason: string };
export type CheckResult<R> = { ok: true; value: R } | { ok: false; failures: GuardFailure[] };

export type Guard<T, R extends T = T> = {
  readonly [GUARD]: (arg: T) => arg is R;
  readonly [GUARD_CHECK]: (arg: unknown) => CheckResult<R>;
};

type OptionalDef = { readonly [OPTIONAL]: true; inner: TypeArg };
type ArrayDef = { readonly [ARRAY_FIELD]: true; inner: TypeArg } | { readonly [ARRAY_FIELD]: true };
type FieldDef = TypeArg | OptionalDef | ArrayDef;

type GuardShape = {
  readonly [GUARD]: (arg: unknown) => boolean;
  readonly [GUARD_CHECK]: (arg: unknown) => CheckResult<unknown>;
};

type TypeArg = PrimitiveName | AnyConstructor | GuardShape;

type GuardResult<A> = A extends Guard<infer T, infer R> ? R & T : never;

type GuardInput<A> = A extends Guard<infer T, infer R> ? T | Extract<R, T> : unknown;

type Resolve<A> = A extends keyof PrimitiveMap
  ? PrimitiveMap[A]
  : A extends GuardShape
    ? GuardResult<A>
    : A extends StringConstructor
      ? string
      : A extends NumberConstructor
        ? number
        : A extends BooleanConstructor
          ? boolean
          : A extends BigIntConstructor
            ? bigint
            : A extends SymbolConstructor
              ? symbol
              : A extends abstract new (...args: never[]) => infer U
                ? U
                : never;

type ResolveInput<A> = A extends GuardShape ? GuardInput<A> : unknown;

type MaybeCompatibleInput<T, Expected> = NonNullable<T> extends Expected ? T : never;

const primitiveConstructors = new Map<unknown, PrimitiveName>([
  [String, 'string'],
  [Number, 'number'],
  [Boolean, 'boolean'],
  [BigInt, 'bigint'],
  [Symbol, 'symbol'],
]);

function isGuardType(typeArg: TypeArg): typeArg is GuardShape {
  return typeof typeArg === 'object' && typeArg !== null && GUARD in typeArg;
}

function isConstructorType(typeArg: TypeArg): typeArg is AnyConstructor {
  return typeof typeArg === 'function';
}

function isInstanceable(value: unknown): value is object {
  return (typeof value === 'object' && value !== null) || typeof value === 'function';
}

function matchesConstructor(value: object, typeArg: AnyConstructor): value is AnyConstructor {
  return value instanceof typeArg;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isOptionalDef(def: FieldDef): def is OptionalDef {
  return typeof def === 'object' && def !== null && OPTIONAL in def;
}

function isArrayDef(def: FieldDef): def is ArrayDef {
  return typeof def === 'object' && def !== null && ARRAY_FIELD in def;
}

function resolveTypeName(typeArg: TypeArg): string {
  if (typeof typeArg === 'string') return typeArg;
  if (isGuardType(typeArg)) return 'guard';
  const primitive = primitiveConstructors.get(typeArg);
  if (primitive !== undefined) return primitive;
  if (isConstructorType(typeArg)) return typeArg.name || 'unknown';
  return 'unknown';
}

function resolveActualType(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value !== 'object') return typeof value;
  return Object.prototype.toString.call(value).slice(8, -1) || 'object';
}

function checkFieldDef(obj: Record<string, unknown>, fieldName: string, def: FieldDef): GuardFailure[] {
  if (isOptionalDef(def)) {
    if (!(fieldName in obj) || obj[fieldName] === undefined) return [];
    return checkFieldDef(obj, fieldName, def.inner);
  }

  if (isArrayDef(def)) {
    if (!(fieldName in obj)) return [{ path: [fieldName], reason: 'missing required field' }];
    const value = obj[fieldName];
    if (!isUnknownArray(value))
      return [{ path: [fieldName], reason: `expected array, got ${resolveActualType(value)}` }];
    if (!('inner' in def)) return [];
    const failures: GuardFailure[] = [];
    for (let i = 0; i < value.length; i++) {
      const elemFailures = checkFieldDef({ [String(i)]: value[i] }, String(i), def.inner);
      failures.push(...elemFailures.map(f => ({ ...f, path: [fieldName, ...f.path] })));
    }
    return failures;
  }

  // def is TypeArg — narrowed after OptionalDef and ArrayDef branches
  if (!(fieldName in obj)) return [{ path: [fieldName], reason: 'missing required field' }];
  const value = obj[fieldName];

  if (isGuardType(def)) {
    const result = def[GUARD_CHECK](value);
    return result.ok ? [] : result.failures.map(f => ({ ...f, path: [fieldName, ...f.path] }));
  }

  if (typeIs(value, def)) return [];
  return [{ path: [fieldName], reason: `expected ${resolveTypeName(def)}, got ${resolveActualType(value)}` }];
}

function runShapeCheck(obj: Record<string, unknown>, shape: Record<string, FieldDef>): GuardFailure[] {
  const failures: GuardFailure[] = [];
  for (const [fieldName, def] of Object.entries(shape)) {
    failures.push(...checkFieldDef(obj, fieldName, def));
  }
  return failures;
}

export function guard<R>(check: (arg: unknown) => CheckResult<R>): Guard<unknown, R> {
  return {
    [GUARD]: (arg: unknown): arg is R => check(arg).ok,
    [GUARD_CHECK]: check,
  };
}

export function check<T, R extends T>(g: Guard<T, R>, arg: unknown): CheckResult<R> {
  return g[GUARD_CHECK](arg);
}

export function objectGuard<T>(shape: Record<string, FieldDef>): Guard<unknown, T> {
  return guard<T>((arg) => {
    if (!isRecord(arg))
      return { ok: false, failures: [{ path: [], reason: 'expected object' }] };
    const failures = runShapeCheck(arg, shape);
    if (failures.length > 0) return { ok: false, failures };
    return { ok: true, value: arg as T };
  });
}

export function extendGuard<T>(
  base: Guard<unknown, unknown>,
  shape: Record<string, FieldDef>,
): Guard<unknown, T> {
  return guard<T>((arg) => {
    const baseResult = check(base, arg);
    if (!baseResult.ok) return baseResult;
    if (!isRecord(arg))
      return { ok: false, failures: [{ path: [], reason: 'expected object' }] };
    const failures = runShapeCheck(arg, shape);
    if (failures.length > 0) return { ok: false, failures };
    return { ok: true, value: arg as T };
  });
}

export function enumGuard<T extends string>(values: readonly T[]): Guard<unknown, T> {
  return guard<T>((arg) => {
    if (typeof arg !== 'string')
      return { ok: false, failures: [{ path: [], reason: `expected string, got ${typeof arg}` }] };
    const match = values.find(v => v === arg);
    if (match === undefined)
      return {
        ok: false,
        failures: [{ path: [], reason: `"${arg}" is not one of: ${values.join(', ')}` }],
      };
    return { ok: true, value: match };
  });
}

export function literal<T extends string | number | boolean>(value: T): Guard<unknown, T> {
  return guard<T>((arg) => {
    if (arg === value) return { ok: true, value };
    return {
      ok: false,
      failures: [{ path: [], reason: `expected ${JSON.stringify(value)}, got ${JSON.stringify(arg)}` }],
    };
  });
}

export function optional(inner: TypeArg): OptionalDef {
  return { [OPTIONAL]: true, inner };
}

export function array(inner?: TypeArg): ArrayDef {
  if (inner !== undefined) return { [ARRAY_FIELD]: true, inner };
  return { [ARRAY_FIELD]: true };
}

export function typeIs<A extends TypeArg, T>(
  arg: MaybeCompatibleInput<T, ResolveInput<A>>,
  typeArg: A,
): arg is MaybeCompatibleInput<T, ResolveInput<A>> & Resolve<A> {
  if (typeof typeArg === 'string') {
    return typeof arg === typeArg;
  }

  if (isGuardType(typeArg)) {
    return arg == null ? false : typeArg[GUARD](arg);
  }

  const primitiveType = primitiveConstructors.get(typeArg);

  if (primitiveType !== undefined) {
    return typeof arg === primitiveType;
  }

  if (!isConstructorType(typeArg) || !isInstanceable(arg)) {
    return false;
  }

  return matchesConstructor(arg, typeArg);
}

function getCheckFailures(value: unknown, typeArg: TypeArg): GuardFailure[] {
  if (isGuardType(typeArg)) {
    const result = typeArg[GUARD_CHECK](value);
    return result.ok ? [] : result.failures;
  }
  return [{ path: [], reason: `expected ${resolveTypeName(typeArg)}, got ${resolveActualType(value)}` }];
}

export const cast = <A extends TypeArg, T>(
  arg: MaybeCompatibleInput<T, ResolveInput<A>>,
  typeArg: A,
): MaybeCompatibleInput<T, ResolveInput<A>> & Resolve<A> => {
  if (typeIs(arg, typeArg)) return arg;

  const failures = getCheckFailures(arg, typeArg);
  const failureLines = failures
    .map(f => `  - ${f.path.length > 0 ? f.path.join('.') + ': ' : ''}${f.reason}`)
    .join('\n');

  throw createNiceError(`Cast failed:\n${failureLines}`);
};
