import { guard, typeIs } from 'lib/utils/typeGuard';

export type Path = {
  __path_type: 'path';
  path: string;
};

export const pathGuard = guard(
  (arg: unknown): arg is Path =>
    typeIs(arg, Object) &&
    '__path_type' in arg &&
    typeIs(arg.__path_type, 'string') &&
    arg.__path_type === 'path' &&
    'path' in arg &&
    typeIs(arg.path, 'string'),
);

export const pathOf = (path: string): Path => ({
  __path_type: 'path',
  path: path.startsWith('/') ? path : '/' + path,
});
