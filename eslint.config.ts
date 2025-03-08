import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import perfectionist from 'eslint-plugin-perfectionist';
import react from 'eslint-plugin-react';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import ts from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  {
    languageOptions: {
      globals: globals.node,
      parser: tsParser,
      parserOptions: { project: true, sourceType: 'module' },
    },
    rules: { 'react/react-in-jsx-scope': 'off' },
  },
  js.configs.recommended,
  ...ts.configs.strictTypeChecked,
  ...ts.configs.stylisticTypeChecked,
  unicorn.configs.recommended,
  react.configs.flat['recommended'],
  { settings: { react: { version: 'detect' } } },
  perfectionist.configs['recommended-natural'],
  { rules: { 'no-console': 'warn' } }, // added custom rule for unresolved imports
];
