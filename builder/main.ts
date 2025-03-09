import chokidar from 'chokidar';
import fs from 'node:fs';

import { buildAllPages, generatePage } from './pages.js';
import { buildAllStyles, processCSS } from './styles.js';

export interface BuildConfig {
  directories: Record<DirectoryMapKey, DirectoryMapItem>;
}

export interface DirectoryMapItem {
  distribution: string;
  source: string;
}

type DirectoryMapKey = 'pages' | 'public' | 'styles';

async function copyAllAssets(config: BuildConfig) {
  const { distribution, source } = config.directories.public;
  await fs.promises.cp(source, distribution, { recursive: true });
}

async function initDistributionDirectory(config: BuildConfig) {
  await fs.promises.rm(config.directories.pages.distribution, { force: true, recursive: true });
  await fs.promises.mkdir(config.directories.pages.distribution, { recursive: true });
  if (config.directories.styles.distribution !== config.directories.pages.distribution) {
    await fs.promises.mkdir(config.directories.styles.distribution, { recursive: true });
  }
  if (config.directories.public.distribution !== config.directories.pages.distribution) {
    await fs.promises.mkdir(config.directories.public.distribution, { recursive: true });
  }
}

export const build = async (config: BuildConfig) => {
  try {
    await initDistributionDirectory(config);
    await buildAllStyles(config.directories.styles);
    console.log('✅ Styles built!');
    await buildAllPages(config.directories.pages);
    console.log('✅ Pages built!');
    await copyAllAssets(config);
    console.log('✅ Assets copied!');
    console.log('🎉 Build completed!');
  } catch (error) {
    console.error('❌ Error generating static site:', error);
    throw error;
  }
};

const createWatcher = ({
  buildFunction,
  directories,
  unlinkFunction,
}: {
  buildFunction: (path: string) => Promise<void>;
  directories: DirectoryMapItem;
  unlinkFunction: (path: string) => Promise<void>;
}) => {
  const watcher = chokidar.watch(directories.source);
  const buildHandler = (path: string) => {
    buildFunction(path)
      .then(() => {
        console.log('✅ Files built!');
      })
      .catch((error: unknown) => {
        console.error('❌ Error generating static site:', error);
      });
  };
  watcher.on('ready', () => {
    watcher.on('change', (path) => {
      console.log(`🔄 File changed: ${path}`);
      buildHandler(path);
    });
    watcher.on('add', (path) => {
      console.log(`✨ File added: ${path}`);
      buildHandler(path);
    });
    watcher.on('unlink', (path) => {
      console.log(`❌ File removed: ${path}`);
      unlinkFunction(path)
        .then(() => {
          console.log('✅ File removed!');
        })
        .catch((error: unknown) => {
          console.error('❌ Error generating static site:', error);
        });
    });
  });
};

export const watch = (config: BuildConfig) => {
  console.log('👀 Watching for changes...');
  createWatcher({
    buildFunction: (path) =>
      generatePage({ distributionDirectory: config.directories.pages.distribution, sourcePath: path }),
    directories: config.directories.pages,
    unlinkFunction: async (path) => {
      const outPath = path
        .replace(config.directories.pages.source, config.directories.pages.distribution)
        .replace('.tsx', '.html');
      await fs.promises.rm(outPath);
    },
  });
  createWatcher({
    buildFunction: (path) =>
      processCSS({ distributionDirectory: config.directories.styles.distribution, sourcePath: path }),
    directories: config.directories.styles,
    unlinkFunction: async (path) => {
      const outPath = path
        .replace(config.directories.styles.source, config.directories.styles.distribution)
        .replace('.scss', '.css');
      await fs.promises.rm(outPath);
    },
  });
  createWatcher({
    buildFunction: () => copyAllAssets(config),
    directories: config.directories.public,
    unlinkFunction: async (path) => {
      const outPath = path.replace(config.directories.public.source, config.directories.public.distribution);
      await fs.promises.rm(outPath);
    },
  });
};
