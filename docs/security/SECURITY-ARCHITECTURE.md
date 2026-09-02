# Security Architecture

## Objective

Mariage OS handles private personal, financial, contractual and planning data. Security is therefore a core architectural property.

The project does **not** claim mathematical invulnerability. Instead, it requires layered prevention, least privilege, auditable controls, automated security tests and recoverability.

## Security objectives

1. Only authorized project members can access project data.
2. One project's member cannot access another project's data.
3. Public frontend/repository disclosure reveals no production secrets or private wedding data.
4. Untrusted imported/external content is never executed as application code.
5. Critical changes are traceable and recoverable.
6. Stored private files are not publicly listable/readable.
7. A compromised/stale client cannot silently overwrite newer cloud truth.
8. Sensitive operations require stronger assurance than ordinary edits.
9. Supply-chain/dependency risks are controlled.
10. Security controls are verified continuously, not only manually before release.

## Defense in depth

### Browser layer

- TypeScript validation and safe UI rendering;
- no `eval`/`new Function`;
- no arbitrary user HTML;
- URL protocol validation;
- CSP and security headers;
- local data handled as private;
- safe file parsing and size/type limits.

### Authentication layer

- Supabase Auth;
- owner MFA/TOTP before production readiness;
- secure session handling;
- recent-auth requirement for critical project administration/export/deletion where practical.

### Authorization layer

- PostgreSQL RLS for all exposed private structured tables;
- Storage RLS/policies for private objects;
- project membership checked at data layer;
- client-visible IDs treated as non-secret.

### Data layer

- database constraints for critical invariants;
- exact financial types;
- immutable project ownership references where appropriate;
- migrations only through versioned files;
- no direct service-role usage from browser.

### File layer

- private bucket;
- allowlisted formats;
- MIME/signature/extension checks where practical;
- no active-content execution;
- quarantined/incomplete upload lifecycle;
- hash-based duplicate/integrity support.

### CI/repository layer

- secret scanning;
- static analysis;
- dependency scanning;
- pinned/controlled CI actions;
- locked dependency versions;
- full quality gates before merge/release.

## Security authority

The frontend is never the final security authority.

A hidden button is not a permission.

The database/storage backend must reject an unauthorized direct API request even if the attacker bypasses/changes the UI.

## Secrets

The browser may contain only credentials explicitly designed for public-client use (for example the Supabase publishable/anon-equivalent client key under RLS).

Never expose:

- Supabase service-role key;
- secret keys that bypass RLS;
- private CI/deployment credentials;
- database passwords;
- encryption recovery secrets.

## Security release policy

No release may knowingly ship with:

- cross-project authorization bypass;
- exposed secret;
- known Critical/High vulnerability without an explicit exceptional security decision (default policy: none accepted);
- broken backup/restore for supported data;
- untested new RLS/storage policy;
- known silent data-corruption path.

## Reference standard

OWASP ASVS 5.0 is the main verification framework. Applicable requirements will be mapped to implementation and tests in the ASVS matrix.
