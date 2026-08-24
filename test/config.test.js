import { describe, expect, it } from 'vitest';

import { validateConfig } from '../src/config.js';

describe('validateConfig', () => {
  it.each([
    'https://rum.example.com',
    'https://rum.example.com/base/',
    'http://localhost:4318',
    'http://127.0.0.9:4318/',
    'http://[::1]:4318',
  ])('accepts safe collector URL %s', (collectorUrl) => {
    const expected = collectorUrl.replace(/\/$/, '').replace(/\/collect$/, '') + '/collect';

    expect(validateConfig({ collectorUrl })).toEqual({ collectUrl: expected });
  });

  it('does not append the collection path twice', () => {
    expect(validateConfig({ collectorUrl: 'https://rum.example.com/collect/' })).toEqual({
      collectUrl: 'https://rum.example.com/collect',
    });
  });

  it.each([
    undefined,
    null,
    {},
    { collectorUrl: '' },
    { collectorUrl: 'http://rum.example.com' },
    { collectorUrl: 'ftp://rum.example.com' },
    { collectorUrl: 'https://user:secret@rum.example.com' },
    { collectorUrl: 'https://rum.example.com#private' },
    { collectorUrl: 'https://rum.example.com?private=1' },
  ])('rejects unsafe configuration %#', (config) => {
    expect(() => validateConfig(config)).toThrow(TypeError);
  });
});
