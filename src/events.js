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

function applyContext(payload, context) {
  if (context && typeof context === 'object') {
    if (typeof context.service === 'string') payload.service = context.service;
    if (typeof context.env === 'string') payload.env = context.env;
  }
  return Object.freeze(payload);
}

export function pageView(route, context) {
  const payload = { type: 'page_view', route: validateRoute(route) };
  return applyContext(payload, context);
}

export function pageLoad(route, durationMs, context) {
  if (typeof durationMs !== 'number' || !Number.isFinite(durationMs) || durationMs < 0) {
    throw new TypeError('durationMs must be a finite non-negative number');
  }
  const payload = {
    type: 'page_load',
    route: validateRoute(route),
    durationMs: Math.min(durationMs, 600_000),
  };
  return applyContext(payload, context);
}

export function jsError(route, context) {
  const payload = { type: 'js_error', route: validateRoute(route) };
  return applyContext(payload, context);
}
