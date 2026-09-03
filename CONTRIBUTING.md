# Contributing to Mariage OS

Mariage OS is specification-first. Do not implement material behavior from chat memory, intuition or an outdated document when a frozen normative contract exists.

## Implementation gate

**Current state: CLOSED.**

No Lot 0 or feature code may begin until:

1. `docs/FINAL-DESIGN-REVIEW.md` reports no unresolved BLOCKING/MAJOR finding;
2. master spec/requirements/scope/architecture/UX/routes/lots agree;
3. PR review/merge blockers are resolved;
4. documentation Run 4 is merged into `main`.

After that, Lot 0 becomes the first permitted implementation lot. This gate is stronger than a sentence saying “documentation complete”.

## Current progress source

Always read `docs/roadmap/IMPLEMENTATION-STATUS.md` before starting material work.

It records:
- current phase;
- current lot;
- checkpoint state;
- feature progress;
- blockers;
- next permitted action.

Do not infer progress solely from recent commits or chat history.

## Before writing code after the gate opens

Read:

1. `README.md`
2. `docs/START-HERE.md`
3. `docs/roadmap/IMPLEMENTATION-STATUS.md`
4. `docs/PRODUCT-SPECIFICATION.md`
5. `docs/REQUIREMENTS-CATALOG.md`
6. `docs/FEATURE-LEDGER.md`
7. `docs/roadmap/V1-SCOPE.md`
8. `docs/FINAL-DESIGN-REVIEW.md`
9. `docs/DEFERRED-DECISIONS.md`
10. `docs/engineering/IMPLEMENTATION-PLAYBOOK.md`
11. relevant UX/architecture/domain/security/quality contracts
12. relevant feature contract
13. current `docs/roadmap/LOT-ACCEPTANCE.md`
14. `docs/roadmap/INTEGRATION-CHECKPOINTS.md`
15. `docs/engineering/DEFINITION-OF-DONE.md`

If material behavior is not specified and is not explicitly deferred, treat it as a documentation defect and update spec/ADR/tests rather than inventing a hidden rule.

## Public repository safety

Never commit real wedding data, guest/contact details, private screenshots, ratings/notes, budgets/payments, contracts/invoices, payment evidence, private photos, `.mariage` backups, production dumps, PII-bearing diagnostics, auth tokens or secrets.

Use synthetic fixtures only. `.gitignore` is defense-in-depth, not authorization to skip review/secret scanning.

## Implementation sequence

Work follows Lots 0–12 in `docs/roadmap/LOTS.md` and `LOT-ACCEPTANCE.md`.

Every V1 capability is tracked in `docs/FEATURE-LEDGER.md` using the lifecycle defined by `IMPLEMENTATION-PLAYBOOK.md`.

Do not jump ahead around foundations. Domain features must use established project-isolation, repository/service, local-first, migration, UX and test primitives rather than bypassing them.

Mandatory integration checkpoints occur after:
- Lots 0–3;
- Lots 4–7;
- Lots 8–10;
- Lots 11–12.

Do not start the next normal lot group until the governing checkpoint passes.

## Feature/change workflow

1. Start from current `main` after implementation gate is open.
2. Read `IMPLEMENTATION-STATUS.md`.
3. Identify lot + Feature ID(s) + applicable requirement/acceptance IDs.
4. Complete the Feature Implementation Record required by `IMPLEMENTATION-PLAYBOOK.md`.
5. Read governing feature/domain/security/UX contracts.
6. Create focused branch.
7. Update specification first/alongside code if behavior changes.
8. Implement the smallest coherent vertical slice.
9. Update Feature Ledger state as implementation progresses.
10. Add every applicable test/evidence layer.
11. Perform UX review, not merely functional QA.
12. Run fast iteration tests.
13. Run complete verification before production-bound PR once Lot 0 provides it.
14. Open PR with Feature IDs, requirements and impact sections.
15. Resolve all blocking CI/review findings.
16. Merge only when feature/lot criteria + Definition of Done are satisfied.
17. Update `IMPLEMENTATION-STATUS.md` before handoff/end of material work.

## UX implementation rule

UI work is governed by:

- `docs/ux/UX-ARCHITECTURE.md`;
- `docs/ux/NAVIGATION.md`;
- `docs/ux/SCREEN-BLUEPRINTS.md`;
- `docs/ux/SCREEN-CONTRACTS.md`;
- `docs/ux/DESIGN-SYSTEM.md`;
- `docs/ux/UX-REVIEW-CHECKLIST.md`.

Do not satisfy requirements by dumping every field onto one page or one universal table.

A feature can fail acceptance even when technically correct if:
- its page has no clear primary job;
- it resembles generic admin CRUD;
- mobile is merely squeezed desktop;
- information hierarchy is unclear;
- a table/form pattern is used because it is easier to code rather than appropriate for the task;
- navigation creates dead ends or loses useful context.

Major screen PRs should include synthetic-data desktop and mobile screenshots for UX review.

## Requirement and feature traceability

Implementation PRs list affected Requirement IDs, Acceptance IDs and Feature IDs, for example:

```text
Features: FTR-019, FTR-020, FTR-021
Requirements: VEN-005, FAC-002, FAC-004
Acceptance: ACC-007, ACC-009, ACC-010
```

Critical tests reference IDs where practical.

A P0/P1 requirement must not become “implemented somewhere” without a Feature ID or explicit cross-cutting control/evidence path.

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

A new field/table/status that changes semantics requires corresponding documentation/Feature Record review rather than appearing opportunistically in a migration.

## Local/offline changes

Changes to IndexedDB/sync/PWA review:

- local schema/migration;
- pending mutation preservation;
- conflict/idempotence;
- session/logout/project switch;
- per-workflow offline matrix;
- service-worker compatibility;
- Feature Record offline class.

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

- purpose/user job;
- Feature IDs;
- requirement/acceptance IDs;
- implementation lot;
- routes/screens/UX pattern;
- schema/migration impact;
- security/privacy impact;
- offline/sync impact;
- import/export/recovery impact;
- derived-data/invalidation impact;
- tests/full verification;
- synthetic desktop/mobile screenshots for visual feature changes;
- known limitations/deferred choices.

## Lot and checkpoint handoff

At lot completion:
- reconcile all Feature IDs assigned to the lot;
- run lot acceptance;
- update status board;
- retain evidence.

At checkpoint completion:
- create `docs/reviews/CHECKPOINT-*-REPORT.md`;
- review product fidelity, UX, architecture, security, data, offline, testing and documentation drift;
- close every BLOCKING/MAJOR finding before PASS.

## Public issue/PR hygiene

Never paste production logs containing PII/secrets. Use sanitized diagnostics + synthetic reproduction. Security vulnerabilities follow `SECURITY.md`.

## Definition of complete

A PR is complete only when behavior, Feature IDs, requirements, lot criteria, UX review, Definition of Done, security/data invariants, tests and documentation consistency all pass.
