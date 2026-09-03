# Web Protocol, Header, CORS and CSRF Security

Status: **Normative V1/public-ready browser/network security contract**

## 1. HTTPS/TLS

Production is HTTPS-only.

- Cloudflare Pages and Supabase endpoints use HTTPS/TLS.
- No application feature deliberately downgrades API/Auth/Storage/Realtime to insecure transport.
- HTTP requests to the public application origin redirect to HTTPS where applicable.
- HSTS is enabled only after the production hostname and all required subdomains/resources are verified HTTPS-safe; then it is kept deliberate and tested.
- Mixed active content is forbidden.
- Realtime uses provider-supported secure WebSockets.
- No sensitive bearer token/password/backup secret is carried in a URL.

The application relies on current managed provider TLS rather than implementing TLS itself. If a custom reverse proxy/Worker/backend is later inserted, its protocol/cipher/header configuration becomes a separately reviewed security boundary.

## 2. Security header target

Cloudflare Pages production responses should enforce/test a policy based on actual bundle needs.

Required categories:

- `Content-Security-Policy`;
- `Strict-Transport-Security` after safe rollout;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy`;
- `Permissions-Policy`;
- clickjacking protection through CSP `frame-ancestors`;
- deliberate caching policy for sensitive/public responses where custom endpoints exist.

### CSP target principles

- `default-src 'self'`;
- `script-src 'self'` plus only reviewed hashes/nonces/policies if unavoidable;
- no `unsafe-eval`;
- avoid `unsafe-inline` script execution;
- `object-src 'none'`;
- `base-uri 'self'` or stricter where compatible;
- `frame-ancestors 'none'` for private app unless a reviewed embedding feature is introduced;
- `form-action` restricted to intended destinations;
- `connect-src` only application/backend/auth/realtime endpoints actually required;
- `img-src` includes only deliberate self/blob/data/HTTPS needs and documented remote images/maps;
- font/style/worker sources minimized;
- `upgrade-insecure-requests` may be used if appropriate to the final deployment but must not hide intentional bad external URL handling.

Trusted Types should be evaluated/enabled in production builds where supported:

- `require-trusted-types-for 'script'`;
- allowlist named Trusted Types policies;
- preferably zero custom policy if app uses no unsafe DOM sinks.

Trusted Types is an additional DOM-XSS barrier, not permission to use unsafe HTML APIs casually.

## 3. Referrer privacy

Private app routes should use a restrictive referrer policy. External marketing images/source links must not receive private route/query/project data through Referer.

Remote image loads additionally follow the dedicated image privacy/no-referrer design where applicable.

## 4. Permissions Policy

Disable browser capabilities the app does not require. Allow required capabilities only for self and only when a documented feature needs them.

Examples to review:

- camera — needed only for user-initiated visit/media capture if enabled;
- geolocation — not required merely to store venue coordinates; enable only if a user feature genuinely needs current location;
- microphone — deny unless future explicit feature;
- payment — deny unless future payment integration;
- USB/Bluetooth/serial — deny;
- fullscreen/clipboard/share — set deliberately based on actual UX needs.

## 5. CORS

For endpoints under our control:

- allowed origins are explicit;
- credentialed private endpoints never use `Access-Control-Allow-Origin: *`;
- allowed methods/headers are minimal;
- preflight behavior is tested;
- CORS is not considered authorization: authenticated cross-origin access still requires real permission checks.

Provider-managed Supabase CORS/client behavior follows supported provider configuration; new Workers/APIs must receive explicit CORS design.

## 6. CSRF

Current browser data APIs normally use explicit Authorization bearer tokens rather than ambient project cookies, so traditional cookie CSRF is not the principal V1 data-API threat.

Still:

- state-changing GET routes are forbidden;
- redirect/callback destinations are allowlisted;
- OAuth/OIDC/redirect flows use provider-supported anti-forgery/PKCE/state mechanisms as applicable;
- any future custom endpoint authenticated through cookies must implement CSRF defenses such as Secure/HttpOnly/SameSite cookie settings plus Origin/Referer verification and/or synchronizer/double-submit tokens appropriate to its design;
- disabling CORS is not a CSRF defense;
- SameSite alone is defense-in-depth, not a reason to ignore request-origin semantics for critical cookie-authenticated commands.

A migration from bearer-auth APIs to ambient-cookie APIs requires security review.

## 7. Cookies if introduced

Mariage OS does not invent custom session cookies for V1. If an app-controlled cookie is ever introduced:

- `Secure` for production auth/sensitive cookies;
- `HttpOnly` when JavaScript access is unnecessary;
- deliberate `SameSite`;
- narrow Path/Domain;
- no private/auth value exposed to unrelated subdomains;
- short lifetime for sensitive transient state;
- rotation/invalidation behavior documented.

## 8. OAuth/redirect security

If social/OAuth/OIDC providers are enabled:

- use provider-supported Authorization Code + PKCE where appropriate;
- exact/allowlisted redirect URIs;
- state/nonce verification according to protocol/provider flow;
- do not accept arbitrary `returnTo` external URLs;
- strip one-time authorization codes/tokens from normal browser history after successful exchange where feasible;
- no tokens in analytics/logs/referrers.

## 9. External links/downloads

- parse/validate URL protocol;
- external new-tab links prevent opener control where browser behavior requires it;
- downloads use safe content disposition/type behavior if served through an app-controlled endpoint;
- private signed URLs are short-lived/authorized and not inserted into permanent public pages/logs.

## 10. Cross-origin isolation

Do not enable COOP/COEP/CORP blindly. They can improve isolation but can also break remote images/maps/third-party resources.

If a feature requires cross-origin isolation (for example a future browser API needing it), perform a dedicated compatibility/security review and proxy/self-host only resources that can be done safely and lawfully.

## 11. Tests

Production/header tests verify:

- HTTPS redirect and no mixed active content;
- expected CSP and absence of forbidden script execution;
- Trusted Types behavior where enabled;
- clickjacking blocked;
- correct `nosniff`/referrer/permissions policies;
- external link privacy;
- CORS denial/allow behavior for app-controlled endpoints;
- malicious/open redirect attempts;
- state-changing GET absence;
- no sensitive token in URL/history/referrer;
- cookie flags if any cookie-authenticated app endpoint is ever introduced.
