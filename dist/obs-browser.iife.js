/*! @ibbr-engineering/observability-browser v1.1.0 | SPDX-License-Identifier: Apache-2.0 */
var IbbrObs = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.js
  var index_exports = {};
  __export(index_exports, {
    initRum: () => initRum
  });

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
    let service;
    if (config.service !== void 0 && config.service !== null) {
      if (typeof config.service !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(config.service)) {
        throw new TypeError("service must be an alphanumeric string");
      }
      service = config.service;
    }
    let env;
    if (config.env !== void 0 && config.env !== null) {
      if (typeof config.env !== "string" || !/^[a-zA-Z0-9_-]{1,32}$/.test(config.env)) {
        throw new TypeError("env must be a valid environment identifier");
      }
      env = config.env;
    }
    const path = url.pathname.replace(/\/+$/, "").replace(/\/collect$/, "");
    url.pathname = `${path}/collect`;
    const result = { collectUrl: url.href };
    if (service) result.service = service;
    if (env) result.env = env;
    return result;
  }

  // src/events.js
  function validateRoute(route) {
    if (typeof route !== "string" || !route.startsWith("/") || route.includes("?") || route.includes("#")) {
      throw new TypeError("route must be a normalized path");
    }
    return route;
  }
  function applyContext(payload, context) {
    if (context && typeof context === "object") {
      if (typeof context.service === "string") payload.service = context.service;
      if (typeof context.env === "string") payload.env = context.env;
    }
    return Object.freeze(payload);
  }
  function pageView(route, context) {
    const payload = { type: "page_view", route: validateRoute(route) };
    return applyContext(payload, context);
  }
  function pageLoad(route, durationMs, context) {
    if (typeof durationMs !== "number" || !Number.isFinite(durationMs) || durationMs < 0) {
      throw new TypeError("durationMs must be a finite non-negative number");
    }
    const payload = {
      type: "page_load",
      route: validateRoute(route),
      durationMs: Math.min(durationMs, 6e5)
    };
    return applyContext(payload, context);
  }
  function jsError(route, context) {
    const payload = { type: "js_error", route: validateRoute(route) };
    return applyContext(payload, context);
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
    const { collectUrl, service, env } = validateConfig(config);
    const context = service || env ? { service, env } : void 0;
    let lastRoute = heuristic(window.location.pathname);
    let initialSent = false;
    let pageViewSent = false;
    let disposed = false;
    const currentRoute = () => heuristic(window.location.pathname);
    const trackPageView = (route) => {
      lastRoute = route;
      pageViewSent = true;
      send(collectUrl, pageView(route, context));
    };
    const sendInitial = () => {
      if (initialSent || disposed) return;
      initialSent = true;
      const route = currentRoute();
      if (!pageViewSent) trackPageView(route);
      send(collectUrl, pageLoad(route, performance.now(), context));
    };
    const stopObserving = observe({
      onLoad: sendInitial,
      onNavigate() {
        const route = currentRoute();
        if (route !== lastRoute) trackPageView(route);
      },
      onError() {
        send(collectUrl, jsError(currentRoute(), context));
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
  return __toCommonJS(index_exports);
})();
