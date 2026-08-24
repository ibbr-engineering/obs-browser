import { describe, expect, it } from 'vitest';

import { heuristic } from '../src/heuristic.js';

describe('heuristic', () => {
  it.each([
    ['/users/507f1f77bcf86cd799439011', '/users/:id'],
    ['/orders/123e4567-e89b-12d3-a456-426614174000', '/orders/:uuid'],
    ['/reports/2026-08-24', '/reports/:date'],
    ['/orders/42', '/orders/:n'],
    ['/reset/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN', '/reset/:token'],
  ])('replaces private dynamic segments in %s', (path, expected) => {
    expect(heuristic(path)).toBe(expected);
  });

  it('removes query strings and fragments', () => {
    expect(heuristic('/orders/42?email=user@example.com#receipt')).toBe('/orders/:n');
    expect(heuristic('/orders/42#receipt')).toBe('/orders/:n');
  });

  it('keeps the root route stable', () => {
    expect(heuristic('/')).toBe('/');
  });
});
