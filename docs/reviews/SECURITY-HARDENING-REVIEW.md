# Mariage OS — Security Hardening Design Review

Status: **DESIGN REVIEW PASS — implementation/evidence pending**

Scope: security architecture from browser/network entry point through authentication, authorization, validation, database, files, offline storage, CI/supply chain and future public-SaaS surfaces.

This review does **not** claim that an unimplemented application is secure. It states that the major applicable attack classes have a documented design/control/test path before coding begins.

Rating vocabulary:

- `DESIGNED` — normative control exists;
- `TEST-REQUIRED` — implementation must provide objective automated evidence;
- `MANUAL-VERIFY` — production/provider/configuration evidence needed;
- `FUTURE-GATED` — not active in private V1; mandatory if attack surface is introduced;
- `N/A-V1` — no V1 attack surface, documented to prevent accidental future activation.

---

# 1. Network / secure protocols

| Control | Status | Governing contract |
|---|---|---|
| HTTPS-only app/API/Auth/Storage | DESIGNED + MANUAL-VERIFY | `WEB-PROTOCOL-SECURITY.md` |
| secure WebSocket/Realtime | DESIGNED + MANUAL-VERIFY | provider/`WEB-PROTOCOL-SECURITY.md` |
| obsolete TLS not app-enabled | DESIGNED + MANUAL-VERIFY | `SECURITY-CONTROL-BASELINE.md` |
| HSTS after safe rollout | DESIGNED + MANUAL-VERIFY | `WEB-PROTOCOL-SECURITY.md` |
| mixed active content forbidden | DESIGNED + TEST-REQUIRED | same |
| no secrets in URLs | DESIGNED + TEST-REQUIRED | same/Auth |

Design result: **PASS**.

---

# 2. Authentication / brute force / account recovery

| Control | Status |
|---|---|
| managed Auth, no custom password hashing | DESIGNED |
| verified identity | DESIGNED |
| provider Auth rate limits | DESIGNED + MANUAL-VERIFY |
| 429/backoff handling | TEST-REQUIRED |
| CAPTCHA/Turnstile before public abuse-prone self-service | FUTURE-GATED |
| strong password config if password mode selected | MANUAL-VERIFY |
| leaked-password protection not assumed if paid-only | DESIGNED |
| TOTP MFA for private V1 owners | DESIGNED + TEST-REQUIRED |
| recent/strong auth for critical operations | DESIGNED + TEST-REQUIRED |
| account-enumeration-resistant UX | DESIGNED + TEST-REQUIRED |
| recovery/lost factor path | DESIGNED + MANUAL-VERIFY |

Design result: **PASS**.

---

# 3. Token / session / OAuth safety

- no raw tokens in logs, URLs, diagnostics or duplicate app storage — DESIGNED/TEST-REQUIRED;
- provider-supported session refresh rather than home-grown token management — DESIGNED;
- PKCE for applicable redirect/code flows — DESIGNED/TEST-REQUIRED;
- exact redirect allowlist/open-redirect prevention — DESIGNED/TEST-REQUIRED;
- session expiry vs explicit logout behavior — DESIGNED/TEST-REQUIRED;
- stale token does not preserve revoked project permission — DESIGNED/TEST-REQUIRED;
- no client-side JWT role claim as permanent authorization truth — DESIGNED.

Design result: **PASS**.

---

# 4. Authorization / IDOR / privilege escalation

- project membership + explicit permission + relationship + state + assurance — DESIGNED;
- deny by default — DESIGNED;
- stable role→permission mapping — DESIGNED;
- direct REST/RPC/Storage denial — TEST-REQUIRED;
- cross-project composite/reference integrity — TEST-REQUIRED;
- own-vs-partner authored resource constraints — TEST-REQUIRED;
- role downgrade/revoke mid-session — TEST-REQUIRED;
- privileged operations through narrow commands — TEST-REQUIRED;
- platform admin separate/no hidden universal tenant backdoor — DESIGNED;
- future JIT support access requires separate review — FUTURE-GATED.

Design result: **PASS**.

---

# 5. SQL injection / database abuse

- parameterized/PostgREST queries — DESIGNED;
- static SQL preferred — DESIGNED;
- no raw SQL/WHERE/ORDER fragments from client — DESIGNED;
- dynamic PL/pgSQL data values use safe binding; identifiers allowlisted — DESIGNED;
- `SECURITY DEFINER` safe search path/auth/grants — DESIGNED/TEST-REQUIRED;
- malicious sort/search/query payload corpus — TEST-REQUIRED;
- database grants reviewed separately from RLS — TEST-REQUIRED.

Design result: **PASS**.

---

# 6. Runtime validation / form security

- centralized runtime schemas — DESIGNED;
- client forms not authoritative — DESIGNED;
- server/DB critical validation repeated — DESIGNED;
- allowlisted enum/sort/filter/protocol/schema versions — DESIGNED;
- length/count/nesting/resource bounds — DESIGNED/TEST-REQUIRED;
- money/date/null semantics — DESIGNED/TEST-REQUIRED;
- route/query param validation — DESIGNED/TEST-REQUIRED;
- field-specific Unicode/canonicalization rules — DESIGNED.

Design result: **PASS**.

---

# 7. XSS / DOM injection / template execution

- text-by-default rendering — DESIGNED;
- no `eval`/`new Function` — DESIGNED/STATIC-CHECK;
- no arbitrary user HTML/SVG — DESIGNED;
- centralized sanitizer only if rich HTML ever introduced — FUTURE-GATED;
- restrictive CSP — DESIGNED/TEST-REQUIRED;
- Trusted Types where compatible — DESIGNED/TEST-REQUIRED;
- malicious URL scheme tests — TEST-REQUIRED;
- no dynamic script/template execution from user data — DESIGNED.

Design result: **PASS**.

---

# 8. Prototype pollution / unsafe deserialization

- explicit schema-built domain objects — DESIGNED;
- reject dangerous prototype keys where relevant — DESIGNED/TEST-REQUIRED;
- no generic deep merge of untrusted input into config/security objects — DESIGNED;
- JSON only, no arbitrary class/code deserialization — DESIGNED;
- unsupported future schema rejects safely — DESIGNED/TEST-REQUIRED.

Design result: **PASS**.

---

# 9. ReDoS / algorithmic resource abuse

- user input does not become arbitrary regex — DESIGNED;
- bounded input before expensive matching — DESIGNED;
- pathological regex/long-input tests — TEST-REQUIRED;
- bulk/pagination/import/export limits — DESIGNED/TEST-REQUIRED.

Design result: **PASS**.

---

# 10. CSRF / CORS / open redirect / clickjacking

- current bearer-token SPA reduces traditional cookie-CSRF surface — ARCHITECTURE FACT;
- state-changing GET forbidden — DESIGNED;
- future cookie endpoint requires CSRF/SameSite/Origin protections — FUTURE-GATED;
- CORS minimal and not treated as authorization — DESIGNED;
- redirect allowlist — DESIGNED/TEST-REQUIRED;
- `frame-ancestors` anti-clickjacking — DESIGNED/TEST-REQUIRED.

Design result: **PASS**.

---

# 11. Security headers / browser capabilities

- CSP — DESIGNED/TEST-REQUIRED;
- HSTS — MANUAL-VERIFY;
- nosniff — TEST-REQUIRED;
- Referrer-Policy — TEST-REQUIRED;
- Permissions-Policy — DESIGNED/TEST-REQUIRED;
- external referrer privacy — TEST-REQUIRED;
- COOP/COEP/CORP not blindly enabled — DESIGNED.

Design result: **PASS**.

---

# 12. File upload / archive / spreadsheet safety

- allowlisted formats — DESIGNED;
- extension/MIME/signature validation — DESIGNED/TEST-REQUIRED;
- size/record/dimension limits — DESIGNED/TEST-REQUIRED;
- macro/active content execution forbidden — DESIGNED/TEST-REQUIRED;
- path traversal/symlink/zip bomb — DESIGNED/TEST-REQUIRED;
- CSV/XLSX formula injection — DESIGNED/TEST-REQUIRED;
- private Storage + RLS — DESIGNED/TEST-REQUIRED;
- interrupted/orphan upload cleanup — DESIGNED/TEST-REQUIRED;
- EXIF privacy for derivatives/third-party exports — DESIGNED.

Design result: **PASS**.

---

# 13. SSRF

V1 has no privileged server-side arbitrary URL fetch.

Status: **N/A-V1 with FUTURE-GATED controls documented**.

Any future server fetch/OCR/research/webhook feature must implement private/loopback/metadata/redirect/DNS-rebinding/size/time/credential controls before activation.

Design result: **PASS**.

---

# 14. Command injection

V1 runtime has no shell/process execution.

Status: **N/A-V1 with FUTURE-GATED controls documented**.

Any future runtime command execution is a mandatory security-review event; untrusted data cannot enter shell strings.

Design result: **PASS**.

---

# 15. Secrets / key management

- privileged secrets excluded from browser/Git — DESIGNED/SCAN-REQUIRED;
- approved secret stores — DESIGNED;
- least privilege — DESIGNED;
- rotation/revocation inventory — DESIGNED/MANUAL-VERIFY;
- exposed secret treated as compromised — DESIGNED;
- build/source-map scan — TEST-REQUIRED;
- secure token randomness — DESIGNED/TEST-REQUIRED.

Design result: **PASS**.

---

# 16. Cryptography

- no crypto invented by app — DESIGNED;
- provider Auth crypto — DESIGNED;
- Web Crypto/platform primitive for client backup — DESIGNED;
- authenticated encryption for backup — DESIGNED/TEST-REQUIRED;
- secure randomness — DESIGNED/TEST-REQUIRED;
- backup wrong-password/tamper rejection — TEST-REQUIRED;
- no hard-coded keys/nonces — DESIGNED/STATIC-REVIEW.

Design result: **PASS**.

---

# 17. Offline/PWA/browser storage

- private project/account partition — DESIGNED/TEST-REQUIRED;
- cache never authorizes cloud access — DESIGNED;
- explicit logout purge — TEST-REQUIRED;
- session-expiry pending-work safety — TEST-REQUIRED;
- service worker does not indiscriminately cache private API data — DESIGNED/TEST-REQUIRED;
- version migration cannot lose pending work — TEST-REQUIRED;
- stale/revoked user cannot sync — TEST-REQUIRED.

Design result: **PASS**.

---

# 18. Realtime

- project authorization required — DESIGNED/TEST-REQUIRED;
- event receipt is treated as data access — DESIGNED;
- project switch unsubscribes/partitions — TEST-REQUIRED;
- Realtime is hint, not durability/source of truth — DESIGNED.

Design result: **PASS**.

---

# 19. Logs/errors/audit

- no secrets/PII payload dumps — DESIGNED/TEST-REQUIRED;
- safe correlation IDs — DESIGNED;
- user error hides SQL/stack/secret internals — DESIGNED/TEST-REQUIRED;
- membership/security/export/restore/delete events auditable — DESIGNED;
- logs not treated as secure storage for data — DESIGNED.

Design result: **PASS**.

---

# 20. Supply chain / build / CI

- minimal dependencies — DESIGNED;
- lockfile + `npm ci` — DESIGNED/CI-REQUIRED;
- dependency scanning/Dependabot — DESIGNED/CI-REQUIRED;
- CodeQL/static analysis where applicable — DESIGNED/CI-REQUIRED;
- Actions least privilege/pinning — DESIGNED/REVIEW-REQUIRED;
- untrusted PR gets no production secret — DESIGNED/CI-REQUIRED;
- no runtime CDN JS for core behavior — DESIGNED;
- SRI required for exceptional immutable remote resources — DESIGNED;
- public build/private-data scan — DESIGNED/CI-REQUIRED.

Design result: **PASS**.

---

# 21. Anti-abuse / public SaaS readiness

Private V1 is closed, but future public readiness covers:

- CAPTCHA/Turnstile;
- signup/provisioning rate limits;
- project/member/storage/import/upload quotas;
- expensive operation throttling;
- email abuse controls;
- support/admin separation;
- public launch security review/penetration assessment.

Status: **FUTURE-GATED, architecture prepared**.

---

# 22. Business logic / integrity

- payment/refund/tax/scenario exactness;
- selected date atomicity;
- joint decision approvals;
- seating uniqueness/capacity;
- timeline after-midnight/dependency validation;
- import evidence precedence/no deletion by absence;
- replay/idempotency/conflict handling.

Status: **DESIGNED + TEST-REQUIRED**.

Design result: **PASS**.

---

# 23. Security configuration/version drift

Before each production/public release, verify current:

- Supabase Auth/RLS/Storage configuration;
- provider rate limits;
- enabled Auth providers/redirect URLs;
- Cloudflare headers/TLS/deployment settings;
- dependency advisories;
- supported browser security behavior;
- CSP/Trusted Types compatibility;
- OWASP ASVS matrix/applicable control status.

Security configuration is not assumed permanent merely because it was correct in an earlier release.

Design result: **PASS**.

---

# Final design conclusion

No currently identified major applicable web/PWA/Supabase attack class is left **undocumented by design**.

Remaining work is implementation and evidence, not permission to assume security:

1. implement controls;
2. write direct adversarial tests;
3. verify provider/deployment settings;
4. run static/dependency/secret scanners;
5. perform manual direct-API/security review before real-data cutover;
6. repeat expanded security review before public self-service launch.

Any future feature that introduces a new attack surface (server-side fetch, webhook, rich HTML, payment, public API, support impersonation, runtime command execution, new Auth provider) automatically reopens security design review for that surface.
