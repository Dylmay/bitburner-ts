import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import noIgnoredExecResult from './eslint-rules/no-ignored-exec-result.mjs';
import callableScriptPath from './eslint-rules/callable-script-path.mjs';

export default defineConfig(eslint.configs.recommended, tseslint.configs.recommendedTypeChecked, {
  plugins: {
    local: {
      rules: {
        'no-ignored-exec-result': noIgnoredExecResult,
        'callable-script-path': callableScriptPath,
      },
    },
  },
  languageOptions: {
    parserOptions: {
      projectService: true,
    },
  },
  rules: {
    'local/no-ignored-exec-result': 'error',
    'local/callable-script-path': 'error',
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['./*', './**/*', '../*', '../**/*'],
            message: 'Use absolute imports instead of relative imports.',
          },
          {
            group: ['**/*.ts'],
            message: 'Do not include .ts extensions in import paths.',
          },
        ],
      },
    ],
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/no-redundant-type-constituents': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
  },
});
