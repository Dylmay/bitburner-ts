import { objectGuard, literal } from 'lib/utils/typeGuard';

export type Path = {
  __path_type: 'path';
  path: string;
};

export const pathGuard = objectGuard<Path>({
  __path_type: literal('path'),
  path: 'string',
});

export const pathOf = (path: string): Path => ({
  __path_type: 'path',
  path: path.startsWith('/') ? path : '/' + path,
});

const TEMP_FOLDER = pathOf('/tmp');

export const createTempPath = (): Path =>
  pathOf(TEMP_FOLDER.path + '/' + crypto.randomUUID() + '.txt');
