# Contributing to Mariage OS

Mariage OS is specification-first. Do not implement material behavior from chat memory, intuition or an outdated document when a frozen normative contract exists.

## Implementation gate

**Current state: CLOSED.**

No Lot 0 or feature code may begin until:

1. `docs/FINAL-DESIGN-REVIEW.md` reports no unresolved BLOCKING/MAJOR finding;
2. master spec/requirements/scope/architecture/routes/lots agree;
3. PR review/merge blockers are resolved;
4. documentation Run 4 is merged into `main`.

After that, Lot 0 becomes the first permitted implementation lot. This gate is stronger than a sentence saying “documentation complete”.

## Before writing code after the gate opens

Read:

1. `README.md`
2. `docs/START-HERE.md`
3. `docs/PRODUCT-SPECIFICATION.md`
4. `docs/REQUIREMENTS-CATALOG.md`
5. `docs/roadmap/V1-SCOPE.md`
6. `docs/FINAL-DESIGN-REVIEW.md`
7. `docs/DEFERRED-DECISIONS.md`
8. relevant architecture/domain/security/quality docs
9. relevant feature/route contracts
10. current `docs/roadmap/LOT-ACCEPTANCE.md`
11. `docs/engineering/DEFINITION-OF-DONE.md`

If material behavior is not specified and is not explicitly deferred, treat it as a documentation defect and update spec/ADR/tests rather than inventing a hidden rule.

## Public repository safety

Never commit real wedding data, guest/contact details, private screenshots, ratings/notes, budgets/payments, contracts/invoices, payment evidence, private photos, `.mariage` backups, production dumps, PII-bearing diagnostics, auth tokens or secrets.

Use synthetic fixtures only. `.gitignore` is defense-in-depth, not authorization to skip review/secret scanning.

## Implementation sequence

Work follows Lots 0–12 in `docs/roadmap/LOTS.md` and `LOT-ACCEPTANCE.md`.

Do not jump ahead around foundations. Domain features must use the established project-isolation, repository/service, local-first, migration and test primitives rather than bypassing them.

## Feature/change workflow

1. Start from current `main` after implementation gate is open.
2. Identify lot + applicable requirement IDs.
3. Read governing feature/domain/security contracts.
4. Create focused branch.
5. Update specification first/alongside code if behavior changes.
6. Implement the smallest coherent behavior.
7. Add every applicable test/evidence layer.
8. Run fast iteration tests.
9. Run complete verification before production-bound PR once Lot 0 provides it.
10. Open PR with requirements and impact sections.
11. Resolve all blocking CI/review findings.
12. Merge only when lot exit criteria + Definition of Done are satisfied.

## Requirement traceability

Implementation PRs list affected IDs from `docs/REQUIREMENTS-CATALOG.md`, for example:

```text
Requirements: VEN-003, FAC-004, SEC-011, QLT-004
```

Critical tests reference requirement/acceptance IDs where practical.

## Planned command contract

Lot 0 must provide at least equivalents of:

```text
npm run dev
npm run test:fast
npm run verify
```

`verify` is the local full production-bound quality approximation, not a substitute for hosted policy/security checks when needed.

## Database changes

All schema/grant/policy changes are versioned migrations.

Governed by:

- `docs/domain/PHYSICAL-SCHEMA-V1.md`
- `docs/domain/PHYSICAL-SCHEMA-V1-ADDENDUM.md`
- `docs/domain/INVARIANTS.md`
- `docs/security/RLS-MATRIX-V1.md`
- `docs/engineering/MIGRATIONS.md`

No undocumented production-dashboard schema/policy changes.

## Local/offline changes

Changes to IndexedDB/sync/PWA review:

- local schema/migration;
- pending mutation preservation;
- conflict/idempotence;
- session/logout/project switch;
- per-workflow offline matrix;
- service-worker compatibility.

Never “fix” local migration by clearing storage while unsynced work may exist.

## Imports/exports/backups

Any change reviews:

- format/schema version;
- mapping/external identity;
- duplicate matching;
- merge/protected truth;
- provenance;
- rollback;
- old fixture migration;
- round-trip where claimed;
- file security;
- recovery compatibility.

Ordinary import never treats absence as delete. Wrong/tampered/unsupported backup never partially mutates target.

## Dependencies

Before adding a dependency justify problem, alternatives, maintenance/security, bundle/build impact, license and verification implications. Keep dependencies minimal and reproducibly locked.

## Tests

Applicable layers include:

- unit;
- property-based;
- mutation testing;
- integration/local Supabase/IndexedDB;
- RLS allow+deny;
- adversarial/security;
- import/export;
- migration/backup;
- Playwright E2E;
- offline/reconnect/PWA;
- accessibility;
- performance/real-device.

100% in-scope coverage is a gate, never a substitute for meaningful assertions.

## PR description

Include as applicable:

- purpose;
- requirement/acceptance IDs;
- implementation lot;
- schema/migration impact;
- security/privacy impact;
- offline/sync impact;
- import/export/recovery impact;
- tests/full verification;
- synthetic-only screenshots;
- known limitations/deferred choices.

## Public issue/PR hygiene

Never paste production logs containing PII/secrets. Use sanitized diagnostics + synthetic reproduction. Security vulnerabilities follow `SECURITY.md`.

## Definition of complete

A PR is complete only when behavior, requirement IDs, lot criteria, Definition of Done, security/data invariants, tests and documentation consistency all pass.
