# Frontend Security Controls

## Rendering

User/imported/external text is rendered as text by default.

Prefer safe DOM APIs (`textContent`, attribute APIs) over string-concatenated HTML.

If rich content is ever introduced, sanitization must be explicit, centralized, reviewed and tested.

## Forbidden dynamic execution

Production code must not use:

- `eval`;
- `new Function`;
- dynamically executed user-provided scripts;
- untrusted inline HTML/SVG.

## Content Security Policy

Production should use a restrictive CSP compatible with the actual bundle and Supabase endpoints.

Target principles:

- `default-src 'self'`;
- scripts from self only where practical;
- avoid `unsafe-eval`;
- avoid `unsafe-inline` by design;
- `object-src 'none'`;
- `base-uri 'self'`;
- `frame-ancestors 'none'`;
- explicit `connect-src` for Supabase/backend endpoints;
- deliberate `img-src` supporting self/blob/data/approved HTTPS needs.

Final policy is tested against production build rather than copied blindly.

## Security headers

Cloudflare Pages production headers should include/validate:

- Content-Security-Policy;
- X-Content-Type-Options;
- Referrer-Policy;
- Permissions-Policy;
- HSTS as appropriate for HTTPS production;
- anti-framing via CSP.

## External navigation

Links to external sources/maps:

- validate protocol;
- use safe target behavior;
- prevent opener abuse where applicable;
- never leak sensitive query data unnecessarily.

## Tokens and secrets

Do not persist high-privilege secrets in source, local storage or client bundle.

Session handling follows Supabase-supported browser patterns. Never log raw auth tokens in diagnostics.

## Error handling

User-visible errors do not reveal SQL, auth tokens, internal secrets or stack traces containing private data.

Diagnostic IDs/technical summaries may be available in a privacy-scrubbed diagnostic export.

## Local data

IndexedDB cache is private application data on the device. Sensitive data should not be duplicated into unnecessary browser storage mechanisms.

## Service worker

The service worker must not cache authenticated API responses indiscriminately in a way that leaks private data between browser contexts. Project data belongs in the controlled local data layer.

## Clickjacking/phishing

The app should not be frameable by arbitrary sites. Authentication branding should clearly identify Mariage OS/project flow.

## Accessibility versus security

Security dialogs/re-authentication flows must remain accessible; do not use inaccessible custom controls as security theater.

## Tests

- XSS payloads in notes, names, imported columns and captions;
- malicious protocols;
- CSP regression against production build;
- no secret in bundle/source map;
- external link opener behavior;
- session-expiry error handling;
- service-worker cache privacy.
