import { afterEach, describe, expect, it, vi } from 'vitest';

import { send } from '../src/transport.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('send', () => {
  it('uses a successful beacon without fetching', async () => {
    const sendBeacon = vi.fn(() => true);
    const fetch = vi.fn();
    vi.stubGlobal('navigator', { sendBeacon });
    vi.stubGlobal('fetch', fetch);

    expect(send('https://rum.example.com/collect', { type: 'page_view', route: '/' })).toBeUndefined();

    expect(sendBeacon).toHaveBeenCalledOnce();
    expect(sendBeacon.mock.calls[0][0]).toBe('https://rum.example.com/collect');
    expect(await sendBeacon.mock.calls[0][1].text()).toBe('{"type":"page_view","route":"/"}');
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['returns false', 'throws'])('falls back to isolated fetch when sendBeacon %s', (behavior) => {
    const sendBeacon = vi.fn(() => {
      if (behavior === 'throws') throw new Error('quota exceeded');
      return false;
    });
    const fetch = vi.fn(() => Promise.resolve(new Response()));
    vi.stubGlobal('navigator', { sendBeacon });
    vi.stubGlobal('fetch', fetch);

    expect(() =>
      send('https://rum.example.com/collect', { type: 'js_error', route: '/checkout' }),
    ).not.toThrow();
    expect(fetch).toHaveBeenCalledWith('https://rum.example.com/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"type":"js_error","route":"/checkout"}',
      keepalive: true,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
  });

  it('isolates synchronous and asynchronous fetch failures', async () => {
    vi.stubGlobal('navigator', {});
    const fetch = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('offline');
      })
      .mockRejectedValueOnce(new Error('offline'));
    vi.stubGlobal('fetch', fetch);

    expect(() => send('https://rum.example.com/collect', { type: 'page_view', route: '/' })).not.toThrow();
    expect(() => send('https://rum.example.com/collect', { type: 'page_view', route: '/' })).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});
