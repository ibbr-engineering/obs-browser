function validateRoute(route) {
  if (
    typeof route !== 'string' ||
    !route.startsWith('/') ||
    route.includes('?') ||
    route.includes('#')
  ) {
    throw new TypeError('route must be a normalized path');
  }
  return route;
}

export function pageView(route) {
  return Object.freeze({ type: 'page_view', route: validateRoute(route) });
}

export function pageLoad(route, durationMs) {
  if (typeof durationMs !== 'number' || !Number.isFinite(durationMs) || durationMs < 0) {
    throw new TypeError('durationMs must be a finite non-negative number');
  }
  return Object.freeze({
    type: 'page_load',
    route: validateRoute(route),
    durationMs: Math.min(durationMs, 600_000),
  });
}

export function jsError(route) {
  return Object.freeze({ type: 'js_error', route: validateRoute(route) });
}
