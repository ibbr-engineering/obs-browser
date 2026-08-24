import { readFile } from 'node:fs/promises';

const packageMetadata = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const license = await readFile(new URL('../LICENSE', import.meta.url), 'utf8');

if (packageMetadata.license !== 'Apache-2.0') {
  throw new Error('package license must be Apache-2.0');
}
if (Object.hasOwn(packageMetadata, 'publishConfig')) {
  throw new Error('package registry configuration is not allowed');
}
if (!license.includes('Apache License') || !license.includes('Version 2.0')) {
  throw new Error('Apache-2.0 license text is missing');
}
