# Security Architecture

Status: **Normative V1 + public-readiness security entry point**

Mariage OS handles private personal, financial, contractual and planning data. Security is therefore a core architectural property, not a feature added after UI development.

The project does not claim mathematical invulnerability. It requires layered prevention, least privilege, deny-by-default authorization, safe runtime primitives, auditable controls, automated adversarial tests and recoverability.

## Security reading order

1. `SECURITY-CONTROL-BASELINE.md`
2. `THREAT-MODEL.md`
3. `AUTHENTICATION.md`
4. `AUTH-HARDENING.md`
5. `AUTHORIZATION-MODEL.md`
6. `ROLE-PERMISSION-MATRIX.md`
7. `AUTHORIZATION-RLS.md`
8. `RLS-MATRIX-V1.md`
9. `RLS-PERMISSION-MAPPING.md`
10. `PRIVILEGED-OPERATIONS.md`
11. `INPUT-VALIDATION.md`
12. `SECURE-DATABASE-QUERIES.md`
13. `WEB-PROTOCOL-SECURITY.md`
14. `FRONTEND-SECURITY.md`
15. `FILE-SECURITY.md`
16. `SECURE-CODING-PATTERNS.md`
17. `SECRET-MANAGEMENT.md`
18. `STORAGE-RLS.md`
19. `PRIVACY.md`
20. `PLATFORM-ADMIN-ACCESS.md`
21. `PUBLIC-ABUSE-PROTECTION.md`
22. `SUPPLY-CHAIN.md`
23. `ASVS-MATRIX.md`

## Security objectives

1. Only currently authorized project members can access project data.
2. One project's user cannot read/write/reference another project's data.
3. Authorization is permission-based and centrally enforced, not scattered role-name UI logic.
4. A member cannot impersonate another member's personal rating/approval/preference.
5. Sensitive data classes can be restricted more tightly than ordinary planning data.
6. Public frontend/repository disclosure reveals no production secrets/private wedding data.
7. Untrusted form/import/file/URL/network input cannot become executable code/query/control-plane input.
8. SQL/code/DOM injection classes are prevented by safe primitives, validation and restrictive browser/database policies.
9. Authentication surfaces have provider anti-brute-force/rate-limit controls and public anti-bot protection before open signup.
10. Critical changes are traceable/recoverable and may require recent MFA.
11. Stored private files are not publicly listable/readable.
12. A compromised/stale client cannot silently overwrite newer cloud truth or retain cloud rights after revocation.
13. Browser/network protocol/header configuration is hardened and tested.
14. Secrets/cryptographic material are minimized, scoped, rotatable and never leaked to browser/Git/logs.
15. Supply-chain/dependency risks are controlled.
16. Security controls are continuously tested, including multi-tenant deny cases.
17. Future platform support/admin capability cannot become a hidden universal tenant-access backdoor.

## Defense in depth

### Transport/browser

- HTTPS-only production and managed current TLS;
- HSTS after verified rollout;
- no mixed active content;
- restrictive CSP/security headers;
- Trusted Types where compatible;
- URL/referrer/open-redirect controls;
- deliberate CORS/CSRF behavior for any app-controlled endpoint architecture;
- private IndexedDB partitioning and safe logout purge.

### Authentication

- Supabase Auth rather than custom password/session crypto;
- verified identity;
- provider rate-limit/brute-force configuration review;
- CAPTCHA/Turnstile before public abuse-prone signup/recovery flows where applicable;
- MFA/TOTP before real private-data cutover for owners;
- provider-supported PKCE/redirect flows where chosen;
- recent-auth/assurance for privileged operations;
- recovery/session behavior explicitly tested.

### Authorization

Canonical model:

`identity + active project membership + explicit permission + relationship/attribute rule + domain invariant + assurance`.

- `project_members` remains canonical relationship;
- role is a permission bundle, not feature-code authority;
- application code calls centralized permission checks;
- DB/Storage remain authoritative;
- deny by default;
- role revocation/downgrade enforced from current DB state, not stale client claims.

### Runtime validation/business logic

- TypeScript is not treated as runtime validation;
- centralized boundary schemas/parsers;
- allowlists/ranges/size limits;
- field-specific canonicalization;
- server/database revalidation for critical invariants;
- exact money/date/null semantics;
- protected state transitions;
- conservative import/merge behavior.

### PostgreSQL/query layer

- RLS on every exposed private/project-scoped table;
- unnecessary grants revoked;
- operation-specific grants/policies;
- `WITH CHECK` on writes;
- same-project relational integrity in constraints/commands;
- parameterized/static SQL;
- no client-supplied raw SQL/WHERE/ORDER expressions;
- safe `SECURITY DEFINER` search path and explicit authorization;
- narrow audited privileged commands for high-impact transitions.

### Frontend/code execution

- safe text rendering; no arbitrary HTML/code execution;
- no `eval`/`new Function`;
- no untrusted inline SVG/HTML;
- prototype-pollution and ReDoS-safe patterns;
- standards-aware URL parsing;
- UI permission awareness for usability only.

### Storage/files/imports

- private buckets/namespaces;
- project permission + data-class checks;
- object path never equals authority;
- allowlisted file types and bounded sizes/counts;
- MIME/signature validation where practical;
- no macro/active execution;
- archive traversal/decompression protection;
- spreadsheet formula-injection-safe export;
- no privileged arbitrary server-side URL fetch in V1; future SSRF controls are mandatory if introduced.

### Secrets/cryptography

- service-role/database/deployment secrets are server/ops-only;
- approved secret stores, least privilege and rotation/revocation inventory;
- no secret duplication into client/storage/logs;
- cryptographically secure randomness for bearer secrets;
- no custom cryptography;
- authenticated encrypted-backup contract only through documented standard primitives.

### Local-first/offline

- cached permissions are UX state, not cloud authorization;
- server denial wins after role revocation;
- multi-project/account caches are partitioned;
- explicit logout purges private project data after pending-work safety;
- stolen offline-device residual risk is documented rather than hidden.

### Platform operations

- platform/operator privileges are separate from project membership;
- no support account is silently owner of all weddings;
- service-role/database-owner capabilities are server/ops-only and minimized;
- real customer data is not copied into public development artifacts;
- future privileged support access requires separate JIT/audit/security design.

### CI/repository/supply chain

- secret/static/dependency scanning;
- synthetic fixtures only;
- pinned/controlled workflow actions;
- committed lockfile / reproducible `npm ci`;
- minimal dependencies;
- no runtime CDN JavaScript for core behavior;
- untrusted PR code receives no production secrets;
- production bundle/source-map scan;
- multi-tenant authorization/RLS/adversarial input test matrix;
- full quality gate before release.

## Security authority

The frontend is never the final authority.

A hidden or disabled button is not a security control. HTML form validation is not authorization. A client-side TypeScript type is not runtime validation. Escaping strings is not the primary SQL-injection defense.

The database/storage/backend must reject unauthorized or invalid direct requests even if an attacker bypasses/changes the UI.

## Secrets

Browser code may contain only public-client credentials explicitly safe under RLS, such as a Supabase publishable client key.

Never expose:

- service-role/secret keys;
- DB passwords;
- CI/deployment credentials;
- reusable invitation/auth/reset/MFA tokens;
- backup passwords/derived secrets;
- platform/admin credentials.

See `SECRET-MANAGEMENT.md`.

## Secure coding review triggers

Mandatory dedicated security review when adding:

- new authentication provider/flow;
- raw/dynamic SQL or `SECURITY DEFINER` function;
- rich HTML/Markdown renderer;
- server-side arbitrary URL fetch;
- file/archive parser;
- cryptography;
- public API/webhook;
- runtime third-party script/CDN;
- custom Worker/backend;
- platform support impersonation;
- payment integration;
- runtime command/process execution.

## Authorization tests are mandatory

At minimum test:

- owner/editor/viewer permission matrix;
- anonymous/outsider/other-project/revoked denial;
- guessed IDs and cross-project links;
- own-vs-partner authored rows;
- role downgrade mid-session;
- field-level privilege escalation attempts;
- direct API/RPC/Storage access;
- Realtime isolation;
- sensitive export/backup denial;
- multi-project user switch/cache isolation.

A missing deny test for a sensitive access path blocks release.

## Security release policy

No release may knowingly ship with:

- cross-project authorization bypass;
- project permission escalation;
- authentication/MFA bypass affecting protected operations;
- exposed high-privilege secret;
- SQL/code/DOM injection;
- unsafe public auth surface lacking required brute-force/abuse controls;
- unreviewed blanket platform/support tenant access;
- known accepted Critical/High exploitable vulnerability (default: none accepted);
- broken private Storage authorization;
- untested RLS/RPC policy;
- silent critical data corruption/loss;
- fail-open behavior caused by a security/provider outage.

## Reference standards

- OWASP ASVS 5.0 is the primary verification framework.
- Authorization follows least privilege, deny-by-default and per-request enforcement.
- SQL injection prevention uses parameterized/static queries plus strict allowlists for unavoidable identifiers.
- Input validation follows allowlist/syntax+semantic validation and resource bounds.
- Supabase grants/RLS/Auth provider protections are configured explicitly and tested rather than assumed from defaults.

Applicable controls are mapped to implementation/evidence in `ASVS-MATRIX.md` and quality/security test suites.