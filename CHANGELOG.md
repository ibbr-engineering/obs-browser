# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-09-11

### Added

- Support `service` and `env` options in `initRum` configuration for multi-tenant RUM collector setups.
- Attach allowlisted `service` and `env` labels to beacon events while preserving PHI privacy constraints.

## [1.0.0] - 2026-08-24

### Added

- Privacy-safe page-view, page-load, and JavaScript-error events.
- Shared disposable instrumentation for page lifecycle and SPA navigation.
- HTTPS-only remote collector validation and isolated beacon delivery.
- Versioned ESM and IIFE release assets with minified variants and checksums.
