import fs from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import MainPage from '../src/pages/index.js';
import React from 'react';
import prettier from 'prettier';

const pages = [{ route: '/index.html', component: <MainPage /> }];
const distDir = path.resolve(import.meta.dirname, '../dist');
const publicDir = path.resolve(import.meta.dirname, '../src/public');

async function initDistDir() {
  await fs.promises.rm(distDir, { recursive: true, force: true });
  await fs.promises.mkdir(distDir, { recursive: true });
}

async function generatePage({ route, component }: { route: string; component: React.ReactNode }) {
  const outPath = route.endsWith('/') ? route + 'index.html' : route;
  console.log(`Generating ${outPath}...`);

  // Render component to HTML
  const htmlContent = `<!DOCTYPE html>${renderToStaticMarkup(component)}`;
  // Format HTML content
  const formattedCode = await prettier.format(htmlContent, { parser: 'html' });
  // Write to file
  await fs.promises.writeFile(path.join(distDir, outPath), formattedCode);

  console.log(`Generated ${outPath}`);
}

async function copyAssets() {
  await fs.promises.cp(publicDir, distDir, { recursive: true });
}

try {
  await initDistDir();
  await Promise.all(pages.map(generatePage));
  await copyAssets();
  console.log('✅ Static site generated!');
} catch (err) {
  console.error('❌ Error generating static site:', err);
}
