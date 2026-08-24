const subscribers = new Set();
let installed;

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

  targetHistory.pushState = function (...args) {
    const result = originalPushState.apply(this, args);
    onNavigate();
    return result;
  };
  targetHistory.replaceState = function (...args) {
    const result = originalReplaceState.apply(this, args);
    onNavigate();
    return result;
  };
  targetWindow.addEventListener('load', onLoad);
  targetWindow.addEventListener('popstate', onNavigate);
  targetWindow.addEventListener('error', onError);
  targetWindow.addEventListener('unhandledrejection', onError);

  installed = {
    targetWindow,
    targetHistory,
    originalPushState,
    originalReplaceState,
    onLoad,
    onNavigate,
    onError,
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
    onError,
  } = installed;
  targetHistory.pushState = originalPushState;
  targetHistory.replaceState = originalReplaceState;
  targetWindow.removeEventListener('load', onLoad);
  targetWindow.removeEventListener('popstate', onNavigate);
  targetWindow.removeEventListener('error', onError);
  targetWindow.removeEventListener('unhandledrejection', onError);
  installed = undefined;
}

export function observe(subscriber) {
  if (subscribers.size === 0) install();
  subscribers.add(subscriber);
  let active = true;

  if (globalThis.document.readyState === 'complete') {
    subscriber.onLoad?.();
  }

  return function dispose() {
    if (!active) return;
    active = false;
    subscribers.delete(subscriber);
    if (subscribers.size === 0) uninstall();
  };
}
