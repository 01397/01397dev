import path from 'node:path';

import type { BuildConfig } from '../builder/main.js';

const config: BuildConfig = {
  directories: {
    pages: {
      distribution: path.resolve(import.meta.dirname, '../dist'),
      source: path.resolve(import.meta.dirname, '../src/pages'),
    },
    public: {
      distribution: path.resolve(import.meta.dirname, '../dist'),
      source: path.resolve(import.meta.dirname, '../src/public'),
    },
    styles: {
      distribution: path.resolve(import.meta.dirname, '../dist/styles'),
      source: path.resolve(import.meta.dirname, '../src/styles'),
    },
  },
};

export default config;
