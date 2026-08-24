# obs-browser

`obs-browser` is a small, dependency-free browser RUM client for page timing,
SPA navigation, and JavaScript error counts. It sends a closed, privacy-safe
event schema to an HTTPS collector and never forwards application payloads or
browser error details.

## Install from a release

Production consumers should pin an immutable semantic-version tag and verify
the downloaded file against `SHA256SUMS` from the matching draft-approved
GitHub Release.

```text
https://github.com/ibbr-engineering/obs-browser/releases/download/v1.0.0/obs-browser.esm.min.js
https://github.com/ibbr-engineering/obs-browser/releases/download/v1.0.0/SHA256SUMS
```

This project is distributed as release files and Git tags. It is not sent to
an npm-compatible package registry.

## ESM

Copy a release asset into your application and import the pinned local file.

```html
<script type="module">
  import { initRum } from '/vendor/obs-browser.esm.min.js';

  const rum = initRum({ collectorUrl: 'https://rum.example.com' });

  // Call this when the application shell is permanently torn down.
  window.addEventListener('app:dispose', () => rum.dispose(), { once: true });
</script>
```

## IIFE

The IIFE bundle exposes `IbbrObs.initRum`.

```html
<script src="/vendor/obs-browser.iife.min.js"></script>
<script>
  const rum = IbbrObs.initRum({ collectorUrl: 'https://rum.example.com' });
</script>
```

After a public tag-hosted artifact path is available, the equivalent
version-pinned jsDelivr URL will be:

```text
https://cdn.jsdelivr.net/gh/ibbr-engineering/obs-browser@v1.0.0/dist/obs-browser.iife.min.js
```

Do not use an unpinned branch or a URL without a version.

## Configuration

`initRum({ collectorUrl })` accepts one absolute collector URL. Remote
collectors must use HTTPS. Plain HTTP is accepted only for `localhost`, the
IPv4 loopback range, and IPv6 `::1`. Credentials, query strings, and fragments
in collector URLs are rejected. `/collect` is appended exactly once.

The returned handle has an idempotent `dispose()` method. Multiple active
clients share one set of History API patches and browser listeners. The final
disposer restores the original `history.pushState` and `history.replaceState`
functions and removes all listeners.

## Events and privacy

Only these JSON objects can be emitted:

| Event            | Fields                                     |
| ---------------- | ------------------------------------------ |
| Page view        | `type: "page_view"`, `route`               |
| Page load        | `type: "page_load"`, `route`, `durationMs` |
| JavaScript error | `type: "js_error"`, `route`                |

Routes omit query strings and fragments. Object IDs, UUIDs, ISO dates,
integers, and long token-like segments are replaced with templates. Page-load
duration is capped at 600,000 ms. Error messages, stack traces, user
identifiers, cookies, credentials, and arbitrary fields are never included.

Delivery first attempts `navigator.sendBeacon`. A rejected or unavailable
beacon falls back to credential-free `fetch` with `keepalive` and a no-referrer
policy. Transport failures are contained and do not throw into the host app.

## SPA and browser support

The client observes `pushState`, `replaceState`, and `popstate`, so it works
without a router-specific adapter. Navigation is emitted only when the
normalized route changes. Modern evergreen browsers supporting ES2020,
`sendBeacon`, or `fetch` are supported.

Your Content Security Policy must permit the collector host:

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; connect-src 'self' https://rum.example.com
```

## Development

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test -- --run
npm run test:browser
npm run build
```

The build creates ESM and IIFE files, minified variants, and external source
maps in `dist/`. See [CONTRIBUTING.md](./CONTRIBUTING.md) for change rules and
[SECURITY.md](./SECURITY.md) for vulnerability reporting.

## License

Apache-2.0. See [LICENSE](./LICENSE).
