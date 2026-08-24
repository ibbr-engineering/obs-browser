import { validateConfig } from './config.js';
import { jsError, pageLoad, pageView } from './events.js';
import { heuristic } from './heuristic.js';
import { observe } from './lifecycle.js';
import { send } from './transport.js';

export function initRum(config) {
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
    },
  });

  return Object.freeze({
    dispose() {
      if (disposed) return;
      disposed = true;
      stopObserving();
    },
  });
}
