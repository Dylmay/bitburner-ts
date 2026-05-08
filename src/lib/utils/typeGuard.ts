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

type AnyConstructor = abstract new (...args: never[]) => unknown;

const GUARD = Symbol('guard');

export type Guard<T, R extends T = T> = { readonly [GUARD]: (arg: T) => arg is R };

export function guard<U, R extends U>(fn: (arg: U) => arg is R): Guard<U, R> {
  return {
    [GUARD]: fn,
  };
}

type GuardShape = { readonly [GUARD]: unknown };

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

function isGuardType(typeArg: TypeArg): typeArg is { readonly [GUARD]: (arg: unknown) => boolean } {
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

export const tryCast = <A extends TypeArg, T>(
  arg: MaybeCompatibleInput<T, ResolveInput<A>>,
  typeArg: A,
): (MaybeCompatibleInput<T, ResolveInput<A>> & Resolve<A>) | undefined =>
  typeIs(arg, typeArg) ? arg : undefined;

export const cast = <A extends TypeArg, T>(
  arg: MaybeCompatibleInput<T, ResolveInput<A>>,
  typeArg: A,
): MaybeCompatibleInput<T, ResolveInput<A>> & Resolve<A> => {
  const casted = tryCast(arg, typeArg);

  if (!casted) {
    throw createNiceError('Arg type does not match', ['arg', arg]);
  }

  return casted;
};
