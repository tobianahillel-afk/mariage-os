# Security Architecture

Status: **Normative V1 + public-readiness security entry point**

Mariage OS handles private personal, financial, contractual and planning data. Security is therefore a core architectural property, not a feature added after UI development.

The project does not claim mathematical invulnerability. It requires layered prevention, least privilege, deny-by-default authorization, auditable controls, automated tests and recoverability.

## Security reading order

1. `THREAT-MODEL.md`
2. `AUTHENTICATION.md`
3. `AUTHORIZATION-MODEL.md`
4. `ROLE-PERMISSION-MATRIX.md`
5. `AUTHORIZATION-RLS.md`
6. `RLS-MATRIX-V1.md`
7. `RLS-PERMISSION-MAPPING.md`
8. `PRIVILEGED-OPERATIONS.md`
9. `STORAGE-RLS.md`
10. `FILE-SECURITY.md`
11. `FRONTEND-SECURITY.md`
12. `PRIVACY.md`
13. `PLATFORM-ADMIN-ACCESS.md`
14. `PUBLIC-ABUSE-PROTECTION.md`
15. `SUPPLY-CHAIN.md`
16. `ASVS-MATRIX.md`

## Security objectives

1. Only currently authorized project members can access project data.
2. One project's user cannot read/write/reference another project's data.
3. Authorization is permission-based and centrally enforced, not scattered role-name UI logic.
4. A member cannot impersonate another member's personal rating/approval/preference.
5. Sensitive data classes (guest-sensitive, finance, sensitive documents, backups) can be restricted more tightly than ordinary planning data.
6. Public frontend/repository disclosure reveals no production secrets/private wedding data.
7. Untrusted imported/external content is never executed as application code.
8. Critical changes are traceable/recoverable and may require recent MFA.
9. Stored private files are not publicly listable/readable.
10. A compromised/stale client cannot silently overwrite newer cloud truth or retain cloud rights after revocation.
11. Supply-chain/dependency risks are controlled.
12. Security controls are continuously tested, including multi-tenant deny cases.
13. Future platform support/admin capability cannot become a hidden universal tenant-access backdoor.

## Defense in depth

### Browser

- safe text rendering; no arbitrary HTML/code execution;
- CSP/security headers;
- URL protocol/referrer controls;
- private IndexedDB partitioning and safe logout purge;
- imported/file data treated as untrusted;
- UI permission awareness for usability only.

### Authentication

- Supabase Auth;
- verified identity;
- MFA/TOTP before real private-data cutover for owners;
- secure session/recovery;
- recent-auth/assurance for privileged operations.

### Authorization

Canonical model:

`identity + active project membership + explicit permission + relationship/attribute rule + domain invariant + assurance`.

- `project_members` remains canonical relationship;
- role is a permission bundle, not feature-code authority;
- application code calls centralized permission checks;
- DB/Storage remain authoritative;
- deny by default;
- role revocation/downgrade enforced from current DB state, not stale client claims.

### PostgreSQL/RLS

- RLS on every exposed private/project-scoped table;
- unnecessary grants revoked;
- operation-specific grants/policies;
- `WITH CHECK` on writes;
- same-project relational integrity in constraints/commands;
- field/system-state protection beyond row-level rules;
- narrow audited privileged commands for high-impact transitions.

### Storage

- private buckets/namespaces;
- project permission + data-class checks;
- object path never equals authority;
- short-lived authorized file access;
- sensitive documents/backups more restrictive than ordinary media.

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

### CI/repository

- secret/static/dependency scanning;
- synthetic fixtures only;
- pinned/controlled workflow actions;
- locked dependency versions;
- multi-tenant authorization/RLS test matrix;
- full quality gate before release.

## Security authority

The frontend is never the final authority.

A hidden or disabled button is not a security control. Direct REST/RPC/Storage access must receive the same denial.

## Secrets

Browser code may contain only public-client credentials explicitly safe under RLS (for example a Supabase publishable client key).

Never expose:

- service-role/secret keys;
- DB passwords;
- CI/deployment credentials;
- reusable invitation/auth tokens;
- backup passwords/derived secrets;
- platform/admin credentials.

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
- exposed secret;
- unreviewed blanket platform/support tenant access;
- known accepted Critical/High exploitable vulnerability (default: none accepted);
- broken private Storage authorization;
- untested RLS/RPC policy;
- silent data corruption/loss path;
- broken backup/restore integrity for supported private data.

## Reference standards

- OWASP ASVS 5.0 is the primary verification framework.
- Authorization follows least privilege, deny-by-default and per-request enforcement principles.
- Supabase RLS/grants are configured explicitly; policy presence does not substitute for correct grants and tests.

Applicable requirements are mapped to implementation/evidence in `ASVS-MATRIX.md`.