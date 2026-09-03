# Frontend Security Controls

Status: **Normative V1 browser-security contract**

Read with `SECURITY-CONTROL-BASELINE.md`, `INPUT-VALIDATION.md`, `WEB-PROTOCOL-SECURITY.md`, `SECURE-CODING-PATTERNS.md` and `SECRET-MANAGEMENT.md`.

## Rendering

User/imported/external text is rendered as text by default.

Prefer safe DOM APIs (`textContent`, DOM node creation, validated property/attribute APIs) over string-concatenated HTML.

V1 does not require arbitrary rich HTML.

If rich content is ever introduced:

- one centralized sanitizer/policy boundary;
- strict allowlist of tags/attributes/protocols;
- Trusted Types integration where supported;
- sanitizer bypass/adversarial tests;
- no scattered raw-HTML escape hatches.

## Forbidden dynamic execution

Production code must not use:

- `eval`;
- `new Function`;
- string-to-code execution;
- dynamically executed user-provided scripts;
- untrusted inline HTML/SVG;
- user-controlled script/import URL;
- executable event-handler attributes derived from input.

## DOM/prototype safety

Imported objects never flow directly into arbitrary object merges or DOM property maps.

- runtime schema validation constructs explicit domain objects;
- prototype-pollution keys (`__proto__`, `constructor`, `prototype`) are rejected where relevant;
- user strings are not compiled directly into regular expressions;
- security-sensitive helpers avoid unsafe dynamic property/code resolution.

## Content Security Policy

Production uses a restrictive CSP compatible with the actual bundle and required Supabase/map/image endpoints.

Target principles:

- `default-src 'self'`;
- scripts from self only except deliberately reviewed exceptions;
- no `unsafe-eval`;
- avoid `unsafe-inline` script execution by design;
- `object-src 'none'`;
- `base-uri 'self'` or stricter where compatible;
- `frame-ancestors 'none'` for private app;
- restricted `form-action`;
- explicit `connect-src` for required Auth/API/Realtime endpoints;
- deliberate `img-src`, `font-src`, `style-src`, `worker-src`.

Trusted Types should be enabled/tested where browser/build compatibility permits:

- `require-trusted-types-for 'script'`;
- explicit allowlist of policy names;
- preferably no custom policy if unsafe sinks are absent.

Trusted Types is defense in depth, not permission to use unsafe DOM APIs.

Final CSP is tested against the production bundle rather than copied blindly.

## Security headers

Cloudflare Pages production headers include/validate as applicable:

- Content-Security-Policy;
- Strict-Transport-Security after HTTPS rollout is verified;
- X-Content-Type-Options: `nosniff`;
- Referrer-Policy;
- Permissions-Policy;
- anti-framing through CSP.

Do not enable COOP/COEP/CORP blindly because remote media/maps may require deliberate cross-origin compatibility.

## Forms/input

Form validation uses centralized runtime schemas; HTML input attributes alone are never the authoritative validation/security layer.

Requirements:

- type/range/length/enum validation;
- no trusting disabled/hidden/read-only controls;
- server/database revalidation of critical invariants;
- safe rendering of validation errors;
- unknown fields do not become permission/config data accidentally;
- route/query values are validated before domain lookup.

## External navigation

Links to external sources/maps:

- parse with standards-aware URL API;
- allowlist protocols;
- prevent open redirect/opener abuse;
- no private data/token in external URL;
- use privacy-safe referrer behavior.

## Tokens and secrets

Do not persist high-privilege secrets in source, browser Storage or client bundle.

Use provider-supported browser session storage/flow. Do not copy auth tokens into extra localStorage/IndexedDB records.

Never log raw auth/invite/MFA/reset tokens in diagnostics.

## CSRF/CORS

Current Supabase data API use is bearer-token oriented rather than custom ambient-cookie session APIs, but any future custom cookie-authenticated endpoint requires explicit CSRF protection and reviewed CORS/SameSite/Origin semantics.

See `WEB-PROTOCOL-SECURITY.md`.

## Error handling

User-visible errors do not reveal SQL, auth tokens, internal policy text, secret values or private stack traces.

Diagnostic IDs/technical summaries may be available in privacy-scrubbed diagnostic export.

Security failures do not fall back to permissive behavior.

## Local data

IndexedDB cache is private application data on the device.

- project/account namespaces remain isolated;
- sensitive data is not unnecessarily duplicated into other browser stores;
- explicit logout safely purges private project cache after pending-work handling;
- session expiry/offline behavior follows the frozen distinction in Auth/Offline docs.

## Service worker

The service worker must not cache authenticated API responses indiscriminately or create cross-user leakage.

- application shell cache is separate from project data;
- private project data belongs in controlled local persistence;
- versioned activation/migration cannot discard pending work;
- cache keys/routes do not mix projects/users.

## Clickjacking/phishing

The private application should not be frameable by arbitrary sites. Authentication branding clearly identifies Mariage OS and the intended flow. Sensitive actions cannot be confirmed through a hidden/embedded frame.

## Third-party scripts

Core application behavior does not load arbitrary runtime CDN JavaScript. Exceptional third-party script introduction requires CSP/supply-chain/privacy/security review and SRI where an immutable externally hosted resource is genuinely necessary.

## Accessibility versus security

Security dialogs/re-authentication/MFA flows remain keyboard/screen-reader accessible. Security theater or inaccessible custom controls are forbidden.

## Tests

At minimum:

- XSS/DOM payloads in names/notes/imports/captions/search;
- Trusted Types/CSP regression where enabled;
- prototype-pollution payloads;
- pathological regex input where regex is used on user data;
- malicious/encoded URL schemes and open redirects;
- form bypass/direct API mutation;
- no secret in bundle/source maps;
- external link/referrer/opener behavior;
- clickjacking blocked;
- session-expiry/logout cache behavior;
- service-worker cross-project/cache privacy;
- production header verification.
