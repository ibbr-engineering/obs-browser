import { describe, expect, it } from 'vitest';

import { jsError, pageLoad, pageView } from '../src/events.js';

describe('closed RUM events', () => {
  it('creates frozen page-view events with allowlisted fields', () => {
    const event = pageView('/orders/:n', { userId: 'secret' });

    expect(event).toEqual({ type: 'page_view', route: '/orders/:n' });
    expect(Object.isFrozen(event)).toBe(true);
  });

  it('creates page-load events and caps excessively long durations', () => {
    expect(pageLoad('/checkout', 700_000)).toEqual({
      type: 'page_load',
      route: '/checkout',
      durationMs: 600_000,
    });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])(
    'rejects unsafe page-load duration %s',
    (durationMs) => {
      expect(() => pageLoad('/checkout', durationMs)).toThrow(TypeError);
    },
  );

  it('creates error events without error details', () => {
    const event = jsError('/checkout', {
      message: 'card declined',
      stack: 'private stack',
      userId: 'user-1',
    });

    expect(event).toEqual({ type: 'js_error', route: '/checkout' });
    expect(JSON.stringify(event)).not.toContain('private');
  });

  it.each(['', 'orders', '/orders?user=1', '/orders#user-1', null])(
    'rejects unsafe route %j',
    (route) => {
      expect(() => pageView(route)).toThrow(TypeError);
    },
  );
});
