// eslint.config.js for a modern TypeScript/Node/Discord.js project


const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
        ecmaVersion: 2021,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
    },
    rules: {
      'no-unused-vars': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
  'import/order': 'off',
      'no-console': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      'cache/',
      '*.d.ts',
      'tests/'
    ],
  },
];
