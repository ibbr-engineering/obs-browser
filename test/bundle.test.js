import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';

import { describe, expect, it } from 'vitest';

const artifacts = [
  'obs-browser.esm.js',
  'obs-browser.esm.min.js',
  'obs-browser.iife.js',
  'obs-browser.iife.min.js',
];

describe('browser bundles', () => {
  it.each(artifacts)('produces %s with a source map and license banner', async (artifact) => {
    const source = await readFile(new URL(`../dist/${artifact}`, import.meta.url), 'utf8');
    const sourceMap = await readFile(new URL(`../dist/${artifact}.map`, import.meta.url), 'utf8');

    expect(source).toContain('SPDX-License-Identifier: Apache-2.0');
    expect(source).not.toMatch(/from\s+["']node:|require\s*\(/);
    expect(JSON.parse(sourceMap).version).toBe(3);
  });

  it('exports initRum from the ESM bundle', async () => {
    const bundleUrl = pathToFileURL(new URL('../dist/obs-browser.esm.js', import.meta.url).pathname);
    const bundle = await import(`${bundleUrl.href}?test=${Date.now()}`);

    expect(bundle).toEqual(expect.objectContaining({ initRum: expect.any(Function) }));
  });

  it('exposes initRum through the IIFE global', async () => {
    const source = await readFile(new URL('../dist/obs-browser.iife.js', import.meta.url), 'utf8');
    const context = {};
    context.window = context;
    context.globalThis = context;

    vm.runInNewContext(source, context);

    expect(context.IbbrObs).toEqual(expect.objectContaining({ initRum: expect.any(Function) }));
  });
});
