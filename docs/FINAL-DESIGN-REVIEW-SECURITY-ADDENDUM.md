# Final Design Review — Security Hardening Addendum

Status: **SECURITY DESIGN PASS — implementation gate remains CLOSED for unrelated final-review blockers and because security evidence does not exist before code**

This addendum records the final pre-code security-hardening pass requested before Mariage OS implementation begins.

## What changed during this pass

The earlier design already had project RLS, Storage RLS, Auth, MFA, private files, file validation, threat modeling, supply-chain controls and OWASP ASVS. The hardening pass identified controls that were too implicit for an implementation-ready/public-ready system and made them normative.

Added/frozen:

- comprehensive defense-in-depth baseline;
- stable traceable `SEC-*` security requirements;
- provider anti-brute-force/rate-limit review and 429 behavior;
- public CAPTCHA/Turnstile gate before open abuse-prone Auth/provisioning;
- PKCE/redirect/token handling requirements where applicable;
- runtime validation/canonicalization architecture;
- SQL injection prevention via parameterized/static SQL and allowlisted identifiers;
- no raw client SQL/WHERE/ORDER expressions;
- CSP + browser-security header contract;
- Trusted Types defense-in-depth where compatible;
- explicit CORS/CSRF/cookie rules if custom endpoints are introduced;
- prototype-pollution safeguards;
- ReDoS/pathological-input/resource bounds;
- secret classification/storage/rotation/revocation;
- secure coding primitive allow/deny list;
- no `Math.random()` for security tokens;
- no custom crypto/auth implementation;
- SSRF mandatory future gate if privileged server URL fetching appears;
- command-injection future gate if runtime process execution appears;
- expanded security/adversarial CI test contract;
- expanded ASVS traceability;
- mandatory `SEC-*` linkage in Feature Implementation Records.

## Attack-surface review conclusion

The following classes have an explicit design/control/test path:

- insecure transport/mixed content;
- Auth brute force/account enumeration;
- password/MFA/recovery/session/token issues;
- BOLA/IDOR/multi-tenant authorization;
- role/permission escalation;
- SQL/query injection;
- XSS/DOM injection;
- unsafe rich content;
- prototype pollution/object injection;
- ReDoS/parser/resource exhaustion;
- CSRF/CORS/open redirect/clickjacking;
- malicious files/macros/archive traversal/decompression bombs;
- spreadsheet formula injection;
- Storage authorization/link leakage;
- SSRF if future server fetch is introduced;
- command injection if future server execution is introduced;
- secret/token leakage;
- weak randomness/custom cryptography;
- offline/PWA/session-cache leakage;
- Realtime cross-tenant leakage;
- log/error privacy;
- dependency/CI/supply-chain compromise;
- public signup/provisioning/upload/import abuse;
- business-logic/race/replay/data-integrity abuse;
- security configuration/version drift.

No identified major applicable class is intentionally left without a governing contract.

## Important limitation

This conclusion means **the security architecture is specified**, not that an unimplemented product is proven secure.

Security proof requires later evidence:

- actual Supabase Auth/RLS/Storage/GRANT configuration;
- actual migrations/RPCs;
- runtime validators;
- actual Cloudflare CSP/headers/TLS behavior;
- dependency/build pipeline;
- automated adversarial tests;
- direct API/authorization tests;
- provider configuration review;
- production build/secret scan;
- manual security review before real-data cutover;
- renewed review/penetration assessment before public self-service activation.

## Security gate rule

A feature cannot reach `ACCEPTED` unless every applicable P0/P1 `SEC-*`/`AUTHZ-*` control has objective evidence or a documented, reviewed N/A rationale.

A release is blocked by any known:

- cross-project data leak;
- permission escalation;
- protected-auth/MFA bypass;
- SQL/code injection;
- high-privilege secret exposure;
- private Storage bypass;
- silent critical-data corruption/loss;
- fail-open security path;
- applicable Critical/High exploitable vulnerability under the release policy.

## New attack surface rule

The security design is not frozen forever. Any feature adding a materially new trust boundary/attack surface automatically reopens focused security design. Examples: new OAuth provider, public API/webhook, rich HTML renderer, server-side web fetch/OCR, new file parser, payment integration, platform impersonation, runtime third-party script, cryptography or process execution.
