# Mariage OS — Comprehensive Security Control Baseline

Status: **Normative pre-code security baseline**

Purpose: define the minimum security controls that must exist across the entire Mariage OS stack. Security is not a separate feature to add after development. Every applicable control is designed, implemented and verified as part of the feature/lot that introduces the relevant attack surface.

This baseline complements, and does not replace, the more specialized documents under `docs/security/`, `docs/quality/` and the OWASP ASVS 5.0 matrix.

## Security model

Mariage OS uses defense in depth:

```text
Internet / untrusted device / untrusted file
        ↓
HTTPS/TLS + security headers + anti-abuse
        ↓
Supabase Auth + verified identity + MFA where required
        ↓
current membership + permission + resource relationship
        ↓
PostgreSQL GRANT + RLS + same-project constraints + narrow RPC
        ↓
runtime validation + domain invariants + state machines
        ↓
private Storage + file validation
        ↓
privacy-safe logs + backup/recovery + continuous tests
```

No single control is treated as sufficient on its own.

---

# 1. Secure transport and protocol baseline

Production requirements:

- HTTPS only for app, API, Auth, Storage and deployment endpoints;
- HTTP redirects to HTTPS where a public HTTP listener exists;
- current provider-supported TLS configuration; obsolete SSL/TLS protocol versions/ciphers are not intentionally enabled by application configuration;
- HSTS after production hostname/HTTPS behavior is verified;
- no mixed active content;
- external application endpoints use HTTPS except a deliberately stored/public source URL where HTTP is necessary and never carries secrets/private data;
- WebSocket/Realtime uses secure transport (`wss`) through provider-supported client behavior;
- no passwords, auth tokens, invite secrets, backup passwords or private project payloads in URLs.

Provider TLS termination is trusted only within the documented Cloudflare/Supabase deployment architecture. A future custom proxy/Worker/server must receive a fresh threat/config review before becoming a security boundary.

---

# 2. Authentication and brute-force resistance

Authentication uses Supabase Auth rather than custom password hashing/session cryptography.

Required controls:

- verified email identity;
- separate account per human;
- provider rate limits remain enabled and are deliberately reviewed/configured before production/public launch;
- CAPTCHA/Turnstile is required before public self-service signup/recovery surfaces are enabled when abuse risk warrants it;
- TOTP MFA is mandatory for the two real V1 owners before real-data cutover;
- critical operations require recent/strong authentication;
- generic authentication/recovery errors do not provide useful account-enumeration detail;
- repeated auth failures are not handled by custom insecure lockout logic that creates trivial denial-of-service;
- logs never contain passwords, OTPs, MFA seeds, access/refresh tokens or raw invite tokens.

If password auth is selected:

- configure a strong provider-supported minimum password policy;
- do not implement custom password storage/hashing;
- encourage long unique passwords/password-manager use;
- password change/recovery follows provider reauthentication/verified-email flows;
- leaked-password checking may be enabled when the chosen provider tier supports it, but V1 security must not depend on a paid-only control.

Rate limiting is not only an Auth concern. Public provisioning, invitation, import, upload, expensive search/export and future server-side endpoints require abuse budgets/limits appropriate to the operation.

---

# 3. Session and token security

- browser authentication uses only Supabase-supported browser flows;
- if a redirect/code flow is selected, PKCE is preferred/required according to the chosen provider-supported flow and documented implementation;
- OAuth/OIDC additions require state/nonce/PKCE and exact redirect URI validation according to provider standards;
- client-side code never manually verifies JWTs for authorization decisions that the backend must enforce;
- access/refresh tokens are never logged, embedded into application URLs, analytics, error reports or exports;
- membership/permissions are checked from current server-side project state, not trusted permanently from stale client role claims;
- explicit logout follows pending-work-safe local purge semantics;
- revoked membership blocks new cloud access even if a browser has an older session token;
- critical commands re-check current membership/permission and assurance level at execution time.

A browser session is evidence of identity, not evidence of authorization to a project.

---

# 4. Authorization

Authorization is deny-by-default and governed by:

- active project membership;
- stable permission keys;
- resource/project relationship;
- subject/ownership relation where relevant;
- domain state/preconditions;
- recent/strong-auth requirement where applicable.

The frontend is not the authority. Direct REST/RPC/Realtime/Storage calls must be denied when the same UI action would be forbidden.

See `AUTHORIZATION-MODEL.md`, `ROLE-PERMISSION-MATRIX.md`, `RLS-PERMISSION-MAPPING.md`, `PRIVILEGED-OPERATIONS.md` and `AUTHORIZATION-REQUIREMENTS.md`.

---

# 5. Runtime input validation

Every external boundary is untrusted even when TypeScript types appear correct:

- form values;
- route/query parameters;
- clipboard data;
- CSV/XLSX/JSON/import/archive data;
- browser Storage/IndexedDB state after version changes;
- Supabase/API responses crossing a version/trust boundary;
- URLs;
- file metadata;
- external provider responses.

Requirements:

- central runtime schemas/parsers for structured boundaries;
- allowlist syntax/types/ranges/enums where possible;
- semantic/domain validation after syntax validation;
- explicit maximum lengths/counts/nesting/size limits;
- canonicalization/normalization rules are field-specific and do not destructively alter human display values;
- validation failure returns safe errors and never falls through to a permissive default;
- server/database constraints repeat critical invariants rather than relying solely on client validation.

See `INPUT-VALIDATION.md`.

---

# 6. SQL/database injection prevention

Mariage OS must never construct executable SQL by concatenating untrusted values.

Requirements:

- use Supabase/PostgREST query APIs and parameter binding for ordinary runtime queries;
- PostgreSQL functions use static SQL wherever possible;
- where dynamic SQL is unavoidable, data values are bound via safe parameter mechanisms (`EXECUTE ... USING` in PL/pgSQL) and identifiers are selected from a strict allowlist/quoted as identifiers rather than passed from arbitrary user strings;
- no RPC accepts a raw SQL fragment, WHERE clause, ORDER BY expression, table name or column expression from the client;
- user-selected sort/filter keys map from stable allowlisted application keys to predefined query expressions;
- escaping user strings is never considered the primary SQL-injection defense;
- security-definer functions fix/validate `search_path` and validate authorization before acting.

See `SECURE-DATABASE-QUERIES.md`.

---

# 7. XSS/DOM injection prevention

- user/imported/external text renders as text by default;
- `textContent`/safe DOM APIs preferred;
- no `eval`, `new Function`, executable user HTML or untrusted inline SVG;
- rich HTML is not a V1 requirement; if introduced, one centralized audited sanitizer/policy is mandatory;
- restrictive CSP is release-tested;
- `unsafe-eval` is forbidden in production unless an explicit security exception/ADR is approved (default: no exception);
- `unsafe-inline` scripts are avoided;
- Trusted Types (`require-trusted-types-for 'script'` + allowlisted policies) should be enabled where browser/support/build compatibility permits and must never be the sole XSS defense;
- safe URL scheme allowlists prevent `javascript:` and equivalent executable navigation.

---

# 8. CSRF and cross-origin behavior

Current SPA/API architecture normally uses explicit bearer authorization rather than ambient project cookies for Supabase data APIs, reducing traditional CSRF exposure. This does **not** justify ignoring CSRF if architecture changes.

Rules:

- no custom state-changing endpoint may rely solely on a cross-site ambient cookie without CSRF protection;
- any future cookie-authenticated endpoint must use appropriate SameSite/Secure/HttpOnly cookie settings plus Origin/Referer validation and/or anti-CSRF tokens according to its architecture;
- CORS is explicit and minimal for any endpoint we control; `*` is not used with credentialed private endpoints;
- redirect URLs are allowlisted/exactly validated;
- GET/read routes must not perform destructive state changes.

See `WEB-PROTOCOL-SECURITY.md`.

---

# 9. Browser/security headers

Production baseline is tested, not assumed:

- Content-Security-Policy;
- Strict-Transport-Security after HTTPS readiness;
- X-Content-Type-Options: `nosniff`;
- Referrer-Policy;
- Permissions-Policy;
- `frame-ancestors` CSP / anti-clickjacking;
- deliberate form/connect/img/font/style/script sources;
- no unnecessary third-party origins.

Cross-origin isolation headers (`COOP`/`COEP`/`CORP`) are introduced only after compatibility/privacy analysis because the app intentionally displays some remote media and maps. Do not enable them blindly.

---

# 10. File/upload/archive safety

All files are untrusted.

- allowlisted file types only;
- extension + declared MIME + magic/signature where practical;
- bounded size, dimensions, record count, sheet count, archive entries and decompressed size;
- no macro execution;
- no executable HTML/JS/SVG rendering;
- PDF/image preview must not grant active application privileges;
- archive traversal/symlink/decompression-bomb protections;
- private Storage and project-scoped authorization;
- uncommitted/orphan upload cleanup;
- filenames are metadata, not trusted Storage paths/HTML;
- exports mitigate spreadsheet formula injection;
- derivatives can strip sensitive EXIF metadata.

---

# 11. SSRF/server-side URL fetch rule

V1 does not require a privileged server to fetch arbitrary user-provided URLs. If future functionality adds server-side URL fetching/OCR/web research/webhook callbacks:

- treat URLs as SSRF attack input;
- restrict schemes;
- block loopback/private/link-local/cloud-metadata/internal network destinations;
- resolve/validate DNS/IP safely and account for redirects/rebinding;
- enforce response/time/size limits;
- never attach project/service credentials to arbitrary destinations;
- isolate parser/fetch privileges;
- add SSRF tests before activation.

This rule is public-SaaS readiness, even if no V1 endpoint currently needs it.

---

# 12. Secrets and cryptography

- secret/service-role/database/deployment credentials live only in approved secret stores;
- browser bundle contains only credentials designed to be public-client credentials;
- secret scanning covers repository and CI;
- secrets are scoped least-privilege and rotatable;
- documented rotation/revocation procedure exists before real production secrets are introduced;
- never invent custom encryption/authentication algorithms;
- client backup encryption uses the frozen authenticated encryption/KDF contract;
- cryptographic random tokens/nonces use platform/provider cryptographically secure randomness;
- hashes used for integrity/dedup are not treated as passwords/authentication secrets.

---

# 13. Dependency/build security

- minimal dependencies;
- committed lockfile and `npm ci`;
- dependency review/audit/scanning;
- CodeQL/static analysis where appropriate;
- GitHub Actions least privilege and pinned immutable SHAs where practical;
- untrusted fork/PR code never receives production secrets;
- no runtime CDN JavaScript for core application code;
- Subresource Integrity is required if an exceptional externally hosted immutable script/style is approved, but preferred design is bundled/self-hosted code;
- build/source-map/public artifact scan for secrets/private data.

---

# 14. Logging/error privacy

Never log:

- passwords;
- raw access/refresh tokens;
- OTP/MFA seeds;
- backup password/key material;
- raw invitation bearer token;
- service-role secret;
- sensitive full file content;
- unnecessary guest/financial PII.

Logs use stable event/correlation IDs and safe metadata. User-facing errors do not expose SQL, stack traces, storage paths containing PII, internal policy expressions or secrets.

Security-relevant events should be auditable where appropriate: authentication/MFA changes, membership/role changes, sensitive exports, backup restore, project deletion and failed privileged operations without storing secret payloads.

---

# 15. Anti-automation/resource exhaustion

Every expensive operation receives explicit budgets where relevant:

- auth requests;
- invitation generation/acceptance;
- public provisioning;
- imports/archives;
- uploads;
- search/filter/export;
- backup/restore;
- future email/webhook endpoints.

Defenses may include provider rate limits, CAPTCHA/Turnstile for public surfaces, per-project/user quotas, concurrency limits, bounded pagination, request body limits and idempotency keys.

Rate limiting complements authorization; it never substitutes for it.

---

# 16. Secure defaults and fail-closed behavior

- unauthenticated/private data access denied by default;
- missing permission mapping denies rather than grants;
- unknown role does not inherit Owner;
- invalid state/unsupported schema/future backup version rejects safely;
- validation/parsing failure does not partially apply sensitive operations;
- unknown tax/fact state remains unknown rather than guessed;
- security feature/provider outage does not silently bypass MFA/authorization;
- feature flags default off for incomplete security-sensitive functionality.

---

# 17. Verification requirement

A control is not considered present because this document mentions it.

Evidence must include, as applicable:

- configuration inspection;
- runtime unit/property tests;
- database constraint tests;
- direct RLS allow/deny tests;
- authorization privilege tests;
- adversarial input/XSS/SQL-injection tests;
- file/archive abuse tests;
- auth/rate-limit/MFA/recovery tests;
- production header/CSP/TLS inspection;
- dependency/secret/static analysis;
- manual bypass review;
- public-launch penetration/security review before open signup.

Any discovered vulnerability receives a regression test where technically reproducible.

No known cross-project leak, privilege escalation, exposed high-privilege secret, SQL/code injection, auth bypass or silent critical-data corruption is acceptable for release.
