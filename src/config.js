function isLoopback(hostname) {
  return hostname === 'localhost' || hostname === '[::1]' || /^127(?:\.\d{1,3}){3}$/.test(hostname);
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

  let service;
  if (config.service !== undefined && config.service !== null) {
    if (typeof config.service !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(config.service)) {
      throw new TypeError('service must be an alphanumeric string');
    }
    service = config.service;
  }

  let env;
  if (config.env !== undefined && config.env !== null) {
    if (typeof config.env !== 'string' || !/^[a-zA-Z0-9_-]{1,32}$/.test(config.env)) {
      throw new TypeError('env must be a valid environment identifier');
    }
    env = config.env;
  }

  const path = url.pathname.replace(/\/+$/, '').replace(/\/collect$/, '');
  url.pathname = `${path}/collect`;
  const result = { collectUrl: url.href };
  if (service) result.service = service;
  if (env) result.env = env;
  return result;
}
