# Contributing

## Development setup

Use Node.js 20 or later and install the locked development dependencies:

```bash
npm ci
npx playwright install chromium
```

Before submitting a change, run:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test -- --run
npm run test:browser
git diff --check
```

Write a failing behavior test before changing runtime behavior. Keep public API
changes backward compatible within `1.x` and update the changelog with their
consumer impact.

The event field allowlist is a privacy boundary. Adding a payload field,
accepting application-provided metadata, weakening collector URL validation,
or forwarding browser error details requires an approved design change before
implementation.

Release distribution uses immutable Git tags and draft GitHub Releases. Do not
add registry credentials or package-registry release configuration.
