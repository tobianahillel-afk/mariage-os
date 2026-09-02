# Browser and Device Support Matrix

Status: **Normative V1 support policy**

Mariage OS is a web/PWA product. The product must not rely on one browser-only capability for critical workflows without a fallback.

## Supported browser families

V1 targets current mainstream supported releases at time of release of:

- Chromium-based Chrome/Edge on desktop;
- Chrome on Android;
- Safari on iPhone/iPad;
- Firefox desktop;
- Safari macOS where available for validation.

Exact minimum version numbers are locked during Lot 0/first beta based on required Web APIs and documented in this file.

## Tiering

### Tier A — required production validation

- modern Chromium desktop;
- modern iPhone Safari;
- modern Android Chrome.

All core V1 workflows must pass.

### Tier B — supported compatibility

- Firefox desktop;
- Safari macOS/iPad where not covered by Tier A device.

Core workflows must function; install/PWA or advanced file APIs may vary with browser platform.

## Capability detection

Feature behavior uses capability detection rather than browser-name assumptions where possible.

Examples:

- File System Access API may have browser-specific availability; fallback is standard download/upload.
- Web Share API is optional; fallback is copy/download.
- Service-worker/PWA install UX varies; normal browser use remains possible.
- HEIC preview support varies; original can be preserved even when preview generation requires alternate path.

## Critical feature fallback rule

No P0/P1 workflow may become impossible solely because a non-standard/limited browser API is missing when a practical standard fallback exists.

Examples:

- `Save to file handle` unavailable → download export.
- map unavailable → textual venue/access details remain.
- camera capture unavailable → choose existing file.
- PWA install unavailable → use normal HTTPS site.

## Real-device V1 validation

Before cutover, perform at minimum:

- one real iPhone/Safari session;
- one real Android/Chrome session if available to the couple/test pool;
- one desktop Chromium session;
- keyboard desktop test;
- tablet/iPad layout smoke test where practical.

Test:

- authentication/MFA;
- venue browsing/editing/photos;
- tasks/decisions;
- guest list basic operations;
- budget;
- import small file;
- offline/reconnect;
- PWA install/update where supported;
- backup download.

## Responsive breakpoints

Implementation may choose concrete CSS breakpoints, but behavior is defined semantically:

- **mobile**: one-handed priority, cards/stacked content, bottom navigation;
- **tablet**: expanded detail with touch interactions;
- **desktop**: sidebar navigation, tables/comparison, denser information.

No essential data exists exclusively in hover state.

## Browser test automation

Playwright CI covers Chromium, Firefox and WebKit for representative core flows. Real devices remain necessary because emulation does not prove every PWA/file/mobile-browser behavior.

## Unsupported/old browser behavior

If required platform APIs are missing beyond supported baseline:

- show a clear unsupported/update-browser message for the specific unavailable capability;
- never silently corrupt data;
- allow safe export/read access when technically possible.
