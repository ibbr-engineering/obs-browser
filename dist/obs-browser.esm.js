/*! @ibbr-engineering/observability-browser v1.0.1 | SPDX-License-Identifier: Apache-2.0 */

// src/config.js
function isLoopback(hostname) {
  return hostname === "localhost" || hostname === "[::1]" || /^127(?:\.\d{1,3}){3}$/.test(hostname);
}
function validateConfig(config) {
  if (!config || typeof config.collectorUrl !== "string" || config.collectorUrl.length === 0) {
    throw new TypeError("collectorUrl is required");
  }
  let url;
  try {
    url = new URL(config.collectorUrl);
  } catch {
    throw new TypeError("collectorUrl must be an absolute URL");
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.protocol === "http:" && !isLoopback(url.hostname)) {
    throw new TypeError("collectorUrl must be a safe HTTPS URL");
  }
  const path = url.pathname.replace(/\/+$/, "").replace(/\/collect$/, "");
  url.pathname = `${path}/collect`;
  return { collectUrl: url.href };
}

// src/events.js
function validateRoute(route) {
  if (typeof route !== "string" || !route.startsWith("/") || route.includes("?") || route.includes("#")) {
    throw new TypeError("route must be a normalized path");
  }
  return route;
}
function pageView(route) {
  return Object.freeze({ type: "page_view", route: validateRoute(route) });
}
function pageLoad(route, durationMs) {
  if (typeof durationMs !== "number" || !Number.isFinite(durationMs) || durationMs < 0) {
    throw new TypeError("durationMs must be a finite non-negative number");
  }
  return Object.freeze({
    type: "page_load",
    route: validateRoute(route),
    durationMs: Math.min(durationMs, 6e5)
  });
}
function jsError(route) {
  return Object.freeze({ type: "js_error", route: validateRoute(route) });
}

// src/heuristic.js
var SEGMENT_RULES = [
  [/^[0-9a-f]{24}$/i, ":id"],
  [/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, ":uuid"],
  [/^\d{4}-\d{2}-\d{2}$/, ":date"],
  [/^\d+$/, ":n"],
  [/^[A-Za-z0-9_-]{40,}$/, ":token"]
];
function heuristic(path) {
  const pathname = path.split(/[?#]/, 1)[0];
  return pathname.split("/").map((segment) => {
    if (segment === "") return segment;
    for (const [re, replacement] of SEGMENT_RULES) {
      if (re.test(segment)) return replacement;
    }
    return segment;
  }).join("/") || "/";
}

// src/lifecycle.js
var subscribers = /* @__PURE__ */ new Set();
var installed;
function fanOut(callback) {
  for (const subscriber of [...subscribers]) callback(subscriber);
}
function install() {
  const targetWindow = globalThis.window;
  const targetHistory = targetWindow.history;
  const originalPushState = targetHistory.pushState;
  const originalReplaceState = targetHistory.replaceState;
  const onLoad = () => fanOut((subscriber) => subscriber.onLoad?.());
  const onNavigate = () => fanOut((subscriber) => subscriber.onNavigate?.());
  const onError = () => fanOut((subscriber) => subscriber.onError?.());
  targetHistory.pushState = function(...args) {
    const result = originalPushState.apply(this, args);
    onNavigate();
    return result;
  };
  targetHistory.replaceState = function(...args) {
    const result = originalReplaceState.apply(this, args);
    onNavigate();
    return result;
  };
  targetWindow.addEventListener("load", onLoad);
  targetWindow.addEventListener("popstate", onNavigate);
  targetWindow.addEventListener("error", onError);
  targetWindow.addEventListener("unhandledrejection", onError);
  installed = {
    targetWindow,
    targetHistory,
    originalPushState,
    originalReplaceState,
    onLoad,
    onNavigate,
    onError
  };
}
function uninstall() {
  const {
    targetWindow,
    targetHistory,
    originalPushState,
    originalReplaceState,
    onLoad,
    onNavigate,
    onError
  } = installed;
  targetHistory.pushState = originalPushState;
  targetHistory.replaceState = originalReplaceState;
  targetWindow.removeEventListener("load", onLoad);
  targetWindow.removeEventListener("popstate", onNavigate);
  targetWindow.removeEventListener("error", onError);
  targetWindow.removeEventListener("unhandledrejection", onError);
  installed = void 0;
}
function observe(subscriber) {
  if (subscribers.size === 0) install();
  subscribers.add(subscriber);
  let active = true;
  if (globalThis.document.readyState === "complete") {
    subscriber.onLoad?.();
  }
  return function dispose() {
    if (!active) return;
    active = false;
    subscribers.delete(subscriber);
    if (subscribers.size === 0) uninstall();
  };
}

// src/transport.js
function send(collectUrl, event) {
  let body;
  try {
    body = JSON.stringify(event);
  } catch {
    return;
  }
  try {
    const sendBeacon = globalThis.navigator?.sendBeacon;
    if (typeof sendBeacon === "function" && sendBeacon.call(
      globalThis.navigator,
      collectUrl,
      new Blob([body], { type: "application/json" })
    ) === true) {
      return;
    }
  } catch {
  }
  try {
    const delivery = globalThis.fetch(collectUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit",
      referrerPolicy: "no-referrer"
    });
    Promise.resolve(delivery).catch(() => {
    });
  } catch {
  }
}

// src/index.js
function initRum(config) {
  const { collectUrl } = validateConfig(config);
  let lastRoute = heuristic(window.location.pathname);
  let initialSent = false;
  let pageViewSent = false;
  let disposed = false;
  const currentRoute = () => heuristic(window.location.pathname);
  const trackPageView = (route) => {
    lastRoute = route;
    pageViewSent = true;
    send(collectUrl, pageView(route));
  };
  const sendInitial = () => {
    if (initialSent || disposed) return;
    initialSent = true;
    const route = currentRoute();
    if (!pageViewSent) trackPageView(route);
    send(collectUrl, pageLoad(route, performance.now()));
  };
  const stopObserving = observe({
    onLoad: sendInitial,
    onNavigate() {
      const route = currentRoute();
      if (route !== lastRoute) trackPageView(route);
    },
    onError() {
      send(collectUrl, jsError(currentRoute()));
    }
  });
  return Object.freeze({
    dispose() {
      if (disposed) return;
      disposed = true;
      stopObserving();
    }
  });
}
export {
  initRum
};
