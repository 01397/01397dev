import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type { DirectoryMapItem } from './main.js';

/**
 * Build all pages in the source directory and save them to the distribution directory
 * @param pathMap
 */
export async function buildAllPages(pathMap: DirectoryMapItem) {
  const { distribution: distributionDirectory, source: sourceDirectory } = pathMap;
  const files = await fs.promises.readdir(sourceDirectory, { withFileTypes: true });
  await Promise.all(
    files
      .filter((file) => file.isFile() && file.name.endsWith('.tsx'))
      .map(async (file) => {
        const sourcePath = path.join(sourceDirectory, file.name);
        await generatePage({
          distributionDirectory,
          sourcePath,
        });
      })
  );
}

export async function generatePage({
  distributionDirectory,
  sourcePath,
}: {
  distributionDirectory: string;
  sourcePath: string;
}) {
  const { default: componentDefinition } = (await import(`${sourcePath}?t=${Date.now().toString()}`)) as {
    default: () => React.JSX.Element;
  };
  const component = createElement(componentDefinition);

  const fileName = path.basename(sourcePath);
  const outPath = path.join(distributionDirectory, fileName.replace('.tsx', '.html'));

  // Render component to HTML
  const htmlContent = `<!DOCTYPE html>${renderToStaticMarkup(component)}`;
  // Format HTML content
  const formattedCode = await prettier.format(htmlContent, { parser: 'html' });
  // Write to file
  await fs.promises.writeFile(outPath, formattedCode);

  console.log(`Generated ${outPath}`);
}
