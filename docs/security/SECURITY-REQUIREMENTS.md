# Mariage OS — Traceable Security Requirements

Status: **Normative pre-code security requirement catalog**

Every applicable requirement must be linked to implementation/configuration/test evidence during development. A requirement is not `VERIFIED` merely because the design document exists.

Priority defaults:

- P0 — release-blocking security property;
- P1 — required hardening/reliability property;
- P2 — defense-in-depth/operational improvement unless threat model elevates it.

---

## Secure transport / browser protocol

- `SEC-NET-001` P0 — Production app/API/Auth/Storage communication uses HTTPS; no intentional insecure downgrade.
- `SEC-NET-002` P0 — No mixed active content is permitted in production.
- `SEC-NET-003` P1 — HSTS is enabled after production HTTPS/subdomain readiness is verified.
- `SEC-NET-004` P0 — Auth/session/invite/backup secrets are never transmitted in application URLs.
- `SEC-NET-005` P1 — Realtime uses provider-supported secure WebSocket transport.
- `SEC-NET-006` P1 — Production has a restrictive CSP matching actual required origins.
- `SEC-NET-007` P1 — `nosniff`, Referrer-Policy, Permissions-Policy and anti-framing controls are verified.
- `SEC-NET-008` P1 — CORS for app-controlled endpoints is explicit/minimal and never treated as authorization.
- `SEC-NET-009` P0 — Any future cookie-authenticated state-changing endpoint implements explicit CSRF protection.
- `SEC-NET-010` P1 — Redirect/callback destinations are strictly allowlisted; open redirects are rejected.

## Authentication / brute force / sessions

- `SEC-AUTH-001` P0 — Password/token/session cryptography is provider-managed; no custom password hashing/auth token implementation.
- `SEC-AUTH-002` P0 — Each human uses a separate verified identity/account.
- `SEC-AUTH-003` P0 — Real V1 owners complete TOTP MFA before source-of-truth cutover.
- `SEC-AUTH-004` P0 — Privileged operations verify required recent/strong authentication server-side.
- `SEC-AUTH-005` P1 — Provider authentication rate limits are deliberately reviewed/configured before release.
- `SEC-AUTH-006` P1 — Auth throttling/429 is handled without retry storms and with safe UX.
- `SEC-AUTH-007` P1 — Public self-service signup/recovery gets CAPTCHA/Turnstile or equivalent anti-bot controls before activation where required by abuse review.
- `SEC-AUTH-008` P1 — Password mode, if selected, uses strong provider-supported minimum policy and verified email.
- `SEC-AUTH-009` P1 — Security architecture does not depend on a paid-only leaked-password feature.
- `SEC-AUTH-010` P1 — Applicable redirect/code authentication uses provider-supported PKCE and exact redirect allowlists.
- `SEC-AUTH-011` P0 — Raw access/refresh/reset/OTP/MFA/invite tokens are excluded from logs, URLs, exports and redundant app storage.
- `SEC-AUTH-012` P0 — Session existence never substitutes for current project authorization.
- `SEC-AUTH-013` P0 — Revocation/role downgrade affects subsequent cloud authorization without requiring a fresh login.
- `SEC-AUTH-014` P0 — Explicit logout cannot silently discard pending work and cannot expose prior project cache to a new user.
- `SEC-AUTH-015` P1 — Account/MFA recovery path is tested before production cutover.
- `SEC-AUTH-016` P1 — Auth/recovery/invite responses avoid unnecessary account/project enumeration.

## Authorization / multi-tenancy

- `SEC-AUTHZ-001` P0 — Every project resource access requires active membership and required permission.
- `SEC-AUTHZ-002` P0 — Authorization is deny-by-default.
- `SEC-AUTHZ-003` P0 — Direct REST/RPC/Storage/Realtime cannot bypass UI permissions.
- `SEC-AUTHZ-004` P0 — Cross-project read/write/reference is impossible.
- `SEC-AUTHZ-005` P0 — Client cannot change protected `project_id`, role, audit or security fields arbitrarily.
- `SEC-AUTHZ-006` P0 — A member cannot write another member's personal opinion/approval row unless explicitly permitted by domain design.
- `SEC-AUTHZ-007` P0 — Database GRANT and RLS are both reviewed/configured; one is not assumed to replace the other.
- `SEC-AUTHZ-008` P0 — Privileged RPC validates identity, permission, same-project relations, assurance and state preconditions.
- `SEC-AUTHZ-009` P1 — `SECURITY DEFINER` functions use safe search path/object resolution and minimal EXECUTE grants.
- `SEC-AUTHZ-010` P0 — Platform admin/support privileges are separate from tenant membership; no hidden universal project owner.

## Runtime input validation

- `SEC-VAL-001` P0 — Every untrusted runtime boundary is schema/type validated; TypeScript alone is insufficient.
- `SEC-VAL-002` P0 — Critical security/domain validation is repeated server/database-side as appropriate.
- `SEC-VAL-003` P1 — User strings/collections have explicit length/count/resource bounds.
- `SEC-VAL-004` P1 — Enum/sort/filter/protocol/schema-version inputs are allowlisted.
- `SEC-VAL-005` P0 — Money/date/probability/count parsing rejects invalid, overflow, NaN/Infinity and ambiguous authoritative values.
- `SEC-VAL-006` P1 — Canonicalization is field-specific; raw human display values are not destructively normalized.
- `SEC-VAL-007` P0 — Dangerous URL schemes are rejected through standards-aware URL parsing.
- `SEC-VAL-008` P0 — Validation failure does not fall through to permissive defaults.
- `SEC-VAL-009` P1 — Old local/API/import data is revalidated when crossing incompatible/new trust-version boundaries.
- `SEC-VAL-010` P1 — Validation errors are safely rendered and do not expose internal security/SQL details.

## SQL / query injection

- `SEC-INJ-001` P0 — No executable SQL is built by concatenating untrusted values.
- `SEC-INJ-002` P0 — Ordinary queries use provider parameterization/query APIs or reviewed typed RPC.
- `SEC-INJ-003` P0 — No client endpoint accepts raw SQL, WHERE, ORDER BY, table or column expression.
- `SEC-INJ-004` P0 — Dynamic PL/pgSQL data values use safe binding; dynamic identifiers use strict allowlists/identifier-safe construction.
- `SEC-INJ-005` P0 — Escaping is never the primary SQL-injection defense.
- `SEC-INJ-006` P1 — Search wildcard/operator behavior is deliberate and safely handled.
- `SEC-INJ-007` P0 — Malicious sort/filter keys are rejected rather than interpolated.
- `SEC-INJ-008` P1 — Dynamic/raw SQL introduction triggers mandatory security review and adversarial tests.

## XSS / DOM / object injection

- `SEC-XSS-001` P0 — User/imported/external content renders as text by default.
- `SEC-XSS-002` P0 — `eval`, `new Function` and user-controlled executable script/template paths are forbidden.
- `SEC-XSS-003` P0 — Arbitrary user HTML/SVG is not executed/rendered as trusted app content.
- `SEC-XSS-004` P1 — If future rich HTML exists, one centralized audited sanitizer + Trusted Types boundary is mandatory.
- `SEC-XSS-005` P1 — Trusted Types is enabled where compatible and tested, but never treated as sole XSS defense.
- `SEC-XSS-006` P0 — Untrusted objects cannot prototype-pollute application/config/security objects.
- `SEC-XSS-007` P1 — Arbitrary user regex compilation is forbidden; pathological-input ReDoS tests apply where regex is used.
- `SEC-XSS-008` P0 — Untrusted values cannot control dynamic module/script imports.

## Files / archive / storage

- `SEC-FILE-001` P0 — Uploaded/imported files are always untrusted.
- `SEC-FILE-002` P0 — File types are allowlisted; extension/MIME/signature are cross-checked where practical.
- `SEC-FILE-003` P0 — Active macros/scripts/HTML/JS/SVG are not executed as application content.
- `SEC-FILE-004` P1 — File bytes/dimensions/record counts/sheets/archive entries/decompressed size are bounded.
- `SEC-FILE-005` P0 — Archive extraction rejects path traversal/absolute paths/symlinks according to backup policy.
- `SEC-FILE-006` P0 — Archive/decompression bomb attacks are bounded/rejected.
- `SEC-FILE-007` P1 — CSV/XLSX export mitigates formula injection.
- `SEC-FILE-008` P0 — Private Storage access requires project/data-class permission; knowing an object key is insufficient.
- `SEC-FILE-009` P1 — Incomplete/orphan upload cleanup cannot cross project boundaries.
- `SEC-FILE-010` P1 — Derived/public exports can strip sensitive EXIF metadata according to privacy policy.

## SSRF / command execution future gates

- `SEC-SRV-001` P0 — V1 has no privileged arbitrary server-side URL fetch.
- `SEC-SRV-002` P0 — Any future server URL fetch blocks loopback/private/link-local/metadata destinations, redirect/DNS rebinding and resource abuse before activation.
- `SEC-SRV-003` P0 — Server fetch never forwards project/service credentials to arbitrary destinations.
- `SEC-SRV-004` P0 — V1 runtime has no user-controlled shell/process execution.
- `SEC-SRV-005` P0 — Any future process execution uses non-shell parameterization/allowlists and security review.

## Secrets / cryptography

- `SEC-SEC-001` P0 — Service-role/database/deployment/admin secrets never ship in browser/public Git.
- `SEC-SEC-002` P0 — Privileged secrets use approved secret stores and least privilege.
- `SEC-SEC-003` P1 — Every privileged production secret has documented rotation/revocation metadata.
- `SEC-SEC-004` P0 — Exposed secret is treated as compromised and rotated/revoked; deletion alone is insufficient.
- `SEC-SEC-005` P0 — Security tokens/nonces use cryptographically secure randomness, never `Math.random()`.
- `SEC-SEC-006` P0 — Mariage OS does not invent custom cryptographic algorithms.
- `SEC-SEC-007` P0 — Encrypted backup uses authenticated encryption/KDF contract and rejects tamper/wrong password before mutation.
- `SEC-SEC-008` P0 — Backup password/key material is never uploaded/stored for recovery convenience.

## Local-first / PWA

- `SEC-LOC-001` P0 — Account/project local state is partitioned and cannot leak on project/account switch.
- `SEC-LOC-002` P0 — Cached authorization is not cloud authority.
- `SEC-LOC-003` P0 — Service worker does not indiscriminately cache private authenticated API responses.
- `SEC-LOC-004` P0 — Revoked member/offline queue cannot sync after reauthorization fails.
- `SEC-LOC-005` P0 — PWA/local migration cannot silently lose pending confirmed local work.
- `SEC-LOC-006` P1 — Static shell cache is separated from private project data.

## Logging / privacy

- `SEC-LOG-001` P0 — Password/token/MFA/invite/backup secrets are never logged.
- `SEC-LOG-002` P0 — Logs/diagnostics minimize guest/financial/private data.
- `SEC-LOG-003` P1 — Privileged membership/security/export/restore/delete events are auditable without secret payloads.
- `SEC-LOG-004` P1 — User errors avoid SQL/policy/stack/secret disclosure.
- `SEC-LOG-005` P1 — Diagnostics use safe correlation IDs/structured redacted metadata.

## Supply chain / build

- `SEC-SUP-001` P1 — Dependencies are minimized/justified and lockfile committed.
- `SEC-SUP-002` P0 — CI uses reproducible install (`npm ci`) and dependency vulnerability review.
- `SEC-SUP-003` P0 — Secret scanning runs on repository/build workflow.
- `SEC-SUP-004` P1 — Static analysis/CodeQL runs where applicable.
- `SEC-SUP-005` P0 — Untrusted PR code cannot access production secrets.
- `SEC-SUP-006` P1 — GitHub Actions permissions are least privilege and sensitive actions pinned to immutable versions/SHAs where practical.
- `SEC-SUP-007` P1 — Core app does not depend on runtime third-party CDN JavaScript.
- `SEC-SUP-008` P1 — Exceptional immutable remote script/style requires SRI/CSP/privacy review.
- `SEC-SUP-009` P0 — Production bundle/source-map/public-artifact scan contains no privileged secret/private wedding data.

## Anti-abuse / resource exhaustion

- `SEC-ABUSE-001` P1 — Expensive operations have bounded input/concurrency/pagination/resource limits.
- `SEC-ABUSE-002` P0 — Public project provisioning cannot be performed through unrestricted client CRUD.
- `SEC-ABUSE-003` P1 — Public signup/project creation/upload/import receives rate/quota/anti-bot controls before public activation.
- `SEC-ABUSE-004` P1 — Idempotency keys protect retryable expensive/privileged commands where duplicate execution is harmful.
- `SEC-ABUSE-005` P1 — Security throttles do not replace authorization and do not create silent fail-open behavior.

## Security verification

- `SEC-VER-001` P0 — Direct allow **and deny** authorization tests exist for every exposed project-scoped resource.
- `SEC-VER-002` P0 — Adversarial SQL/XSS/object/file/archive/auth/session tests run in CI where applicable.
- `SEC-VER-003` P0 — Production CSP/headers/TLS/Auth/RLS/Storage configuration is manually inspected before real-data cutover.
- `SEC-VER-004` P0 — Applicable OWASP ASVS controls have implementation/evidence status before release.
- `SEC-VER-005` P0 — Any discovered security defect gains a regression test where technically reproducible.
- `SEC-VER-006` P0 — No known cross-project leak, privilege escalation, auth bypass, exposed high-privilege secret, SQL/code injection or silent critical-data corruption is acceptable for release.
- `SEC-VER-007` P1 — Security provider/config/dependency assumptions are re-reviewed for each major/public release rather than treated as permanently true.

---

# Implementation tracking rule

Every Feature Implementation Record must list the applicable `SEC-*` IDs and evidence. A feature cannot become `ACCEPTED` when a P0/P1 security requirement applicable to its attack surface has no implementation/test/configuration evidence.
