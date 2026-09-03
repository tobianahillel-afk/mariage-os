# OWASP ASVS Verification Matrix

Status: **Normative security-verification framework**

## Standard

Mariage OS uses **OWASP ASVS 5.0** as the primary application-security verification reference.

During implementation/security hardening, each applicable ASVS requirement is mapped to concrete implementation and objective verification evidence.

Internal stable controls are identified in:

- `SECURITY-REQUIREMENTS.md` (`SEC-*`);
- `AUTHORIZATION-REQUIREMENTS.md` (`AUTHZ-*`).

The ASVS matrix must link external ASVS requirements to those internal IDs, implementation/configuration and verification evidence.

## Status values

- `PLANNED`
- `IMPLEMENTED`
- `VERIFIED`
- `N/A`
- `BLOCKED`

`N/A` requires written rationale.

## Required columns

| ASVS ID | Requirement summary | Applicable? | `SEC-*` / `AUTHZ-*` | Mariage OS implementation/configuration | Verification/test | Status | Notes |
|---|---|---|---|---|---|---|---|

## Priority domains

### Encoding / sanitization / XSS

- safe output context and DOM APIs;
- no arbitrary executable user HTML/SVG;
- CSP;
- Trusted Types where compatible;
- external URL protocol/referrer controls;
- centralized sanitizer only if rich content is ever introduced.

### Validation / business logic

- runtime boundary schemas;
- allowlist syntax and semantic validation;
- numeric/date/money/null semantics;
- resource/count/nesting limits;
- state-machine/invariant enforcement;
- replay/idempotency/race handling;
- fail-closed behavior.

### Architecture / threat modeling

- trust boundaries;
- multi-tenant isolation;
- least privilege / deny by default;
- private-deployment vs public-ready boundary;
- separation of environments;
- platform-admin trust domain separated from project membership;
- SSRF/command-execution attack surfaces explicitly gated if absent in V1.

### Authentication

- Supabase Auth configuration;
- verified identity;
- provider brute-force/rate-limit review;
- password policy if password mode selected;
- PKCE/redirect safety where applicable;
- MFA/TOTP for owners before real-data cutover;
- session security;
- recovery;
- recent/strong authentication for privileged operations;
- public CAPTCHA/anti-bot before open self-service where required.

### Session management / tokens

- access/refresh token storage and secrecy;
- no tokens in URL/logs/diagnostics;
- provider-supported refresh/expiry;
- logout/local-cache semantics;
- role revoke/downgrade reauthorization;
- no stale JWT role as permanent project authority.

### Authorization / access control

Evidence must reference:

- `AUTHORIZATION-MODEL.md`;
- `ROLE-PERMISSION-MATRIX.md`;
- `AUTHORIZATION-RLS.md`;
- `RLS-MATRIX-V1.md`;
- `RLS-PERMISSION-MAPPING.md`;
- `PRIVILEGED-OPERATIONS.md`;
- `PLATFORM-ADMIN-ACCESS.md`.

Verification covers at minimum:

- explicit permission catalog and centralized evaluation;
- active project membership;
- deny-by-default behavior;
- PostgreSQL grants **and** RLS policies;
- same-project relational integrity;
- owner/editor/viewer built-in permission bundles;
- relationship-based author checks for ratings/preferences/approvals;
- protected membership/security/system columns;
- direct REST/RPC authorization independent of UI;
- Storage authorization;
- Realtime isolation;
- role downgrade/revocation during active session;
- viewer/editor denial of owner-only privileged operations;
- cross-project BOLA/IDOR attempts;
- Search/export filtering by effective permission;
- guest-sensitive/finance/sensitive-document restrictions;
- platform/support access not implemented as universal hidden project membership.

A feature or table is not authorization-verified if only the happy-path owner test exists. Direct negative tests are required.

### API / SQL injection / web service

- direct Supabase API authorization;
- parameterized/static SQL and safe dynamic SQL identifiers;
- no raw SQL/WHERE/ORDER fragments from client;
- safe `SECURITY DEFINER` search path/grants;
- replay/idempotency where needed;
- narrow privileged RPCs;
- no service-role exposure;
- no client-trusted project role claim;
- request/resource bounds.

### File handling

- allowlists;
- MIME/signature checks;
- upload limits;
- macro/active-content non-execution;
- archive traversal/symlink/decompression controls;
- safe previews;
- private signed access;
- spreadsheet formula injection.

### Web frontend / browser protocol

- HTTPS/TLS and no mixed active content;
- CSP/Trusted Types where applicable;
- HSTS after safe rollout;
- nosniff/referrer/permissions policies;
- clickjacking protection;
- CORS/CSRF design if app-controlled cookie endpoints are introduced;
- service-worker/local cache privacy;
- external resource/navigation safety.

### Cryptography / secrets

- no home-grown cryptography;
- secure randomness;
- authenticated backup encryption/KDF;
- wrong-password/tamper rejection;
- secret stores/least privilege;
- rotation/revocation inventory;
- no privileged secret in browser/Git/logs/build artifacts.

### Data protection

- project isolation;
- guest/financial/document data classification;
- local device cache;
- backups;
- export allowlists;
- logs/diagnostics;
- project-switch/cache isolation;
- platform support/admin boundaries.

### Error / logging

- no secret/PII leakage;
- safe permission-denied behavior without unnecessary existence disclosure;
- diagnostic correlation IDs;
- privileged-security event auditing;
- fail-closed security errors.

### Supply chain / secure coding

- minimal dependencies;
- reproducible lockfile install;
- dependency/static/secret scanning;
- CI secret isolation and least privilege;
- no runtime core CDN JS;
- prototype-pollution/ReDoS-safe code patterns;
- no `eval`/`new Function`;
- future server-side URL fetch/command execution gated by dedicated controls.

## Verification rule

A requirement is not `VERIFIED` because documentation says it exists. It needs objective evidence such as:

- unit/property/security tests;
- direct RLS/RPC/Storage allow+deny tests;
- injection/adversarial fixtures;
- E2E multi-project/session tests;
- configuration/grant inspection;
- production CSP/header/TLS/Auth review;
- dependency/static/secret scans;
- manual security verification where automation is inadequate.

`SEC-*` and `AUTHZ-*` IDs provide the stable trace from requirement to Feature Implementation Record, migration/configuration and test evidence.

## Authorization release blocker

Any of these blocks real-data/public release:

- cross-project read/write/reference path;
- role/permission escalation;
- missing deny test for sensitive permission;
- public/private Storage bypass;
- service-role/browser exposure;
- stale role still authorizing cloud write after revocation;
- viewer/editor access to owner-only privileged action;
- support/platform identity silently bypassing tenant boundaries.

## General security release blockers

Also block release:

- authentication/MFA bypass on protected action;
- SQL/code/DOM injection;
- privileged secret exposure;
- unsafe public auth surface missing required brute-force/abuse control;
- fail-open security behavior;
- known cross-tenant/private-data leak;
- broken backup confidentiality/integrity;
- known exploitable Critical/High issue accepted without an explicit exceptional process (default: none accepted).

## Release policy

Applicable high-priority controls required by the deployed architecture must be implemented and verified before production real-data cutover.

Before public self-service activation, the ASVS matrix is re-reviewed for the enlarged signup/provisioning/marketing/support/abuse/API attack surface.

Deferred/N/A items must be explicit and justified.