// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { initRum } from '../src/index.js';

const handles = [];
let deliveries;

async function eventsFor(url = 'https://rum.example.com/collect') {
  const matches = deliveries.filter(([deliveryUrl]) => deliveryUrl === url);
  return Promise.all(matches.map(async ([, body]) => JSON.parse(await body.text())));
}

beforeEach(() => {
  history.replaceState({}, '', '/start');
  deliveries = [];
  vi.spyOn(navigator, 'sendBeacon').mockImplementation((url, body) => {
    deliveries.push([url, body]);
    return true;
  });
});

afterEach(() => {
  while (handles.length > 0) handles.pop().dispose();
  vi.restoreAllMocks();
});

describe('initRum', () => {
  it('sends one closed page view and page load for the initial page', async () => {
    const rum = initRum({ collectorUrl: 'https://rum.example.com' });
    handles.push(rum);
    await Promise.resolve();
    window.dispatchEvent(new Event('load'));

    const events = await eventsFor();
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ type: 'page_view', route: '/start' });
    expect(events[1]).toMatchObject({ type: 'page_load', route: '/start' });
    expect(Object.keys(events[1]).sort()).toEqual(['durationMs', 'route', 'type']);
  });

  it('tracks normalized SPA navigation only when the route changes', async () => {
    const rum = initRum({ collectorUrl: 'https://rum.example.com' });
    handles.push(rum);
    await Promise.resolve();
    const originalReplaceState = history.replaceState;

    history.pushState({}, '', '/orders/1?customer=private');
    history.pushState({}, '', '/orders/2');
    history.replaceState({}, '', '/checkout#private');
    originalReplaceState.call(history, {}, '', '/complete');
    window.dispatchEvent(new PopStateEvent('popstate'));

    const events = (await eventsFor()).filter((event) => event.type === 'page_view');
    expect(events).toEqual([
      { type: 'page_view', route: '/start' },
      { type: 'page_view', route: '/orders/:n' },
      { type: 'page_view', route: '/checkout' },
      { type: 'page_view', route: '/complete' },
    ]);
  });

  it('reduces browser errors to the closed error event', async () => {
    const rum = initRum({ collectorUrl: 'https://rum.example.com' });
    handles.push(rum);
    await Promise.resolve();

    window.dispatchEvent(new ErrorEvent('error', { message: 'private message' }));
    window.dispatchEvent(new Event('unhandledrejection'));

    const events = (await eventsFor()).filter((event) => event.type === 'js_error');
    expect(events).toEqual([
      { type: 'js_error', route: '/start' },
      { type: 'js_error', route: '/start' },
    ]);
  });

  it('shares global hooks and stops each disposed subscriber', async () => {
    const originalPushState = history.pushState;
    const first = initRum({ collectorUrl: 'https://one.example.com' });
    handles.push(first);
    const patchedPushState = history.pushState;
    const second = initRum({ collectorUrl: 'https://two.example.com' });
    handles.push(second);
    await Promise.resolve();

    expect(history.pushState).toBe(patchedPushState);
    first.dispose();
    first.dispose();
    history.pushState({}, '', '/after-first');

    expect(
      (await eventsFor('https://one.example.com/collect')).filter(
        (event) => event.route === '/after-first',
      ),
    ).toEqual([]);
    expect(
      (await eventsFor('https://two.example.com/collect')).filter(
        (event) => event.route === '/after-first',
      ),
    ).toEqual([{ type: 'page_view', route: '/after-first' }]);
    expect(history.pushState).not.toBe(originalPushState);

    second.dispose();
    expect(history.pushState).toBe(originalPushState);
  });
});
