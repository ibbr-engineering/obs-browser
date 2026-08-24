import { mkdir, readFile, rm } from 'node:fs/promises';

import { build } from 'esbuild';

const packageMetadata = JSON.parse(await readFile(new URL('./package.json', import.meta.url), 'utf8'));
const banner = `/*! ${packageMetadata.name} v${packageMetadata.version} | SPDX-License-Identifier: Apache-2.0 */`;
const outputDirectory = new URL('./dist/', import.meta.url);

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const variant of [
  { format: 'esm', file: 'obs-browser.esm.js', minify: false },
  { format: 'esm', file: 'obs-browser.esm.min.js', minify: true },
  { format: 'iife', file: 'obs-browser.iife.js', minify: false },
  { format: 'iife', file: 'obs-browser.iife.min.js', minify: true },
]) {
  await build({
    entryPoints: [new URL('./src/index.js', import.meta.url).pathname],
    outfile: new URL(variant.file, outputDirectory).pathname,
    bundle: true,
    platform: 'browser',
    target: 'es2020',
    format: variant.format,
    globalName: variant.format === 'iife' ? 'IbbrObs' : undefined,
    minify: variant.minify,
    sourcemap: 'external',
    sourcesContent: true,
    legalComments: 'inline',
    banner: { js: banner },
  });
}
