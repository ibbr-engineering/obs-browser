import { heuristic } from './heuristic.js';

function send(collectUrl, payload) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(collectUrl, new Blob([body], { type: 'application/json' }));
      return;
    }
  } catch {
    // Fall back when the browser rejects the beacon payload.
  }
  fetch(collectUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // RUM delivery must not disrupt the host application.
  });
}

export function initRum(config) {
  const collectUrl = config.collectorUrl.replace(/\/$/, '') + '/collect';
  let lastRoute = heuristic(window.location.pathname);

  function currentRoute() {
    return heuristic(window.location.pathname);
  }

  function trackPageView(route) {
    lastRoute = route;
    send(collectUrl, { type: 'page_view', route });
  }

  window.addEventListener('load', () => {
    trackPageView(currentRoute());
    send(collectUrl, { type: 'page_load', route: lastRoute, durationMs: performance.now() });
  });

  function onNav() {
    const route = currentRoute();
    if (route === lastRoute) return;
    trackPageView(route);
  }
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    onNav();
  };
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    onNav();
  };
  window.addEventListener('popstate', onNav);

  window.addEventListener('error', () => {
    send(collectUrl, { type: 'js_error', route: currentRoute() });
  });
  window.addEventListener('unhandledrejection', () => {
    send(collectUrl, { type: 'js_error', route: currentRoute() });
  });
}
