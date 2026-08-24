import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

test('IIFE tracks navigation and stops after disposal', async ({ page }) => {
  const html = await readFile(new URL('./browser.html', import.meta.url), 'utf8');
  await page.route('https://app.example.test/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: html }),
  );
  await page.addInitScript(() => {
    window.rumEvents = [];
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value(url, body) {
        body.text().then((text) => window.rumEvents.push({ url, event: JSON.parse(text) }));
        return true;
      },
    });
  });
  await page.goto('https://app.example.test/start');
  await page.addScriptTag({
    path: new URL('../dist/obs-browser.iife.js', import.meta.url).pathname,
  });

  await page.evaluate(() => {
    window.rum = window.IbbrObs.initRum({
      collectorUrl: 'https://rum.example.com',
    });
    history.pushState({}, '', '/orders/42?customer=private');
  });
  await expect.poll(() => page.evaluate(() => window.rumEvents.length)).toBe(3);

  const beforeDispose = await page.evaluate(() => window.rumEvents);
  expect(beforeDispose.map(({ event }) => event)).toEqual([
    { type: 'page_view', route: '/start' },
    expect.objectContaining({ type: 'page_load', route: '/start' }),
    { type: 'page_view', route: '/orders/:n' },
  ]);
  expect(JSON.stringify(beforeDispose)).not.toContain('customer');

  await page.evaluate(() => {
    window.rum.dispose();
    history.pushState({}, '', '/stopped');
  });
  await page.waitForTimeout(50);
  await expect.poll(() => page.evaluate(() => window.rumEvents.length)).toBe(3);
});
