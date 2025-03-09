import { transform } from 'lightningcss';
import fs from 'node:fs';
import path from 'node:path';

import type { DirectoryMapItem } from './main.js';

/**
 * Build all styles in the source directory and save them to the distribution directory
 * @param pathMap
 */
export async function buildAllStyles(pathMap: DirectoryMapItem) {
  const { distribution: distributionDirectory, source: sourceDirectory } = pathMap;
  const files = await fs.promises.readdir(sourceDirectory, { withFileTypes: true });

  await Promise.all(
    files
      .filter((file) => file.isFile() && file.name.endsWith('.css'))
      .map(async (file) => {
        const sourcePath = path.join(sourceDirectory, file.name);
        await processCSS({
          distributionDirectory,
          sourcePath,
        });
      })
  );
}

export async function processCSS({
  distributionDirectory,
  sourcePath,
}: {
  distributionDirectory: string;
  sourcePath: string;
}) {
  const cssBuffer = await fs.promises.readFile(sourcePath);
  const fileName = path.basename(sourcePath);

  const { code } = transform({
    code: cssBuffer,
    filename: fileName,
    minify: false,
    sourceMap: false,
  });

  await fs.promises.writeFile(path.join(distributionDirectory, fileName), code);
  console.log(`Processed ${fileName}`);
}
