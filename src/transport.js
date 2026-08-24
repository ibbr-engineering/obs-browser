export function send(collectUrl, event) {
  let body;
  try {
    body = JSON.stringify(event);
  } catch {
    return;
  }

  try {
    const sendBeacon = globalThis.navigator?.sendBeacon;
    if (
      typeof sendBeacon === 'function' &&
      sendBeacon.call(
        globalThis.navigator,
        collectUrl,
        new Blob([body], { type: 'application/json' }),
      ) === true
    ) {
      return;
    }
  } catch {
    // Fetch handles beacon rejection.
  }

  try {
    const delivery = globalThis.fetch(collectUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    Promise.resolve(delivery).catch(() => {});
  } catch {
    // Transport failures stay isolated from the host application.
  }
}
