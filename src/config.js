function isLoopback(hostname) {
  return (
    hostname === 'localhost' ||
    hostname === '[::1]' ||
    /^127(?:\.\d{1,3}){3}$/.test(hostname)
  );
}

export function validateConfig(config) {
  if (!config || typeof config.collectorUrl !== 'string' || config.collectorUrl.length === 0) {
    throw new TypeError('collectorUrl is required');
  }

  let url;
  try {
    url = new URL(config.collectorUrl);
  } catch {
    throw new TypeError('collectorUrl must be an absolute URL');
  }

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol === 'http:' && !isLoopback(url.hostname))
  ) {
    throw new TypeError('collectorUrl must be a safe HTTPS URL');
  }

  const path = url.pathname.replace(/\/+$/, '').replace(/\/collect$/, '');
  url.pathname = `${path}/collect`;
  return { collectUrl: url.href };
}
