import { transform } from 'lightningcss';
import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import MainPage from '../src/pages/index.js';

const config = {
  directories: {
    distribution: path.resolve(import.meta.dirname, '../dist'),
    public: path.resolve(import.meta.dirname, '../src/public'),
    styles: path.resolve(import.meta.dirname, '../src/styles'),
  },
  pages: [{ component: <MainPage />, route: '/index.html' }],
}

async function copyAssets() {
  await fs.promises.cp(config.directories.public, config.directories.distribution, { recursive: true });
}

async function generatePage({ component, route }: { component: React.ReactNode; route: string; }) {
  const outPath = route.endsWith('/') ? route + 'index.html' : route;
  console.log(`Generating ${outPath}...`);

  // Render component to HTML
  const htmlContent = `<!DOCTYPE html>${renderToStaticMarkup(component)}`;
  // Format HTML content
  const formattedCode = await prettier.format(htmlContent, { parser: 'html' });
  // Write to file
  await fs.promises.writeFile(path.join(config.directories.distribution, outPath), formattedCode);

  console.log(`Generated ${outPath}`);
}

async function initDistributionDirectory() {
  await fs.promises.rm(config.directories.distribution, { force: true, recursive: true });
  await fs.promises.mkdir(config.directories.distribution, { recursive: true });
}

async function processCSS() {
  const cssFilePath = path.join(config.directories.styles, 'style.css');
  const cssBuffer = await fs.promises.readFile(cssFilePath);

  const { code } = transform({
    code: cssBuffer,
    filename: 'style.css',
    minify: false,
    sourceMap: false,
  });

  await fs.promises.writeFile(path.join(config.directories.distribution, 'style.css'), code);
  console.log('Processed CSS with LightningCSS');
}

try {
  await initDistributionDirectory();
  await Promise.all(config.pages.map((page) => generatePage(page)));
  await processCSS();
  await copyAssets();
  console.log('✅ Static site generated!');
} catch (error) {
  console.error('❌ Error generating static site:', error);
}
