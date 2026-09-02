# Contributing to Mariage OS

Mariage OS is specification-first. Do not implement behavior from prior chat memory or personal intuition when a normative contract exists.

## Before you write code

Mandatory base reading:

1. `README.md`
2. `docs/START-HERE.md`
3. `docs/PRODUCT-SPECIFICATION.md`
4. `docs/REQUIREMENTS-CATALOG.md`
5. `docs/PRINCIPLES.md`
6. `docs/NON-GOALS.md`
7. `docs/roadmap/V1-SCOPE.md`
8. relevant architecture/domain/security/quality documents
9. relevant feature contract
10. current lot section in `docs/roadmap/LOT-ACCEPTANCE.md`
11. `docs/engineering/DEFINITION-OF-DONE.md`

If the desired behavior is not specified, check `docs/DEFERRED-DECISIONS.md`. If it is not intentionally deferred, update the specification/ADR rather than inventing a hidden rule.

## Repository safety

This repository is public.

Never commit real wedding data, private screenshots, guest names/contact details, budgets, contracts, invoices, payment evidence, `.mariage` backups, production dumps, private photos, authentication tokens or secrets.

Use synthetic fixtures only.

`.gitignore` is defense-in-depth, not permission to skip review/secret scanning.

## Implementation sequence

Work follows Lots 0–12 in `docs/roadmap/LOTS.md` and the objective exit criteria in `docs/roadmap/LOT-ACCEPTANCE.md`.

Do not jump ahead in a way that bypasses foundations from an earlier lot. In particular, domain features must not bypass project isolation, repository/service boundaries, local-first primitives or required test infrastructure.

## Feature workflow

1. Start from current `main`.
2. Identify the implementation lot and relevant requirement IDs.
3. Create a focused branch.
4. Update specification first/alongside code if behavior changes.
5. Implement the smallest coherent behavior.
6. Add/update every applicable test layer.
7. Run fast local tests while iterating.
8. Run the full verification command before push once Lot 0 provides it.
9. Open a PR listing requirement IDs and impacts.
10. Resolve all blocking CI/review findings.
11. Merge only when the Definition of Done and lot exit criteria are met.

## Requirement traceability

PRs implementing normative behavior should list affected requirement IDs from `docs/REQUIREMENTS-CATALOG.md`.

Example:

```text
Requirements: VEN-003, FAC-004, SEC-003, QLT-004
```

Tests for critical behavior should reference requirement IDs where practical.

## Planned commands

Lot 0 must provide at least:

```text
npm run dev
npm run test:fast
npm run verify
```

`npm run verify` is the local approximation of the complete production-bound Quality Gate.

## Database changes

All schema, grants and policy changes are versioned under `supabase/migrations/`.

Physical behavior is constrained by:

- `docs/domain/PHYSICAL-SCHEMA-V1.md`
- `docs/security/AUTHORIZATION-RLS.md`
- `docs/engineering/MIGRATIONS.md`

Do not make undocumented production-dashboard schema/policy changes.

## Local/offline changes

Changes to IndexedDB, sync queue, conflict semantics or service-worker behavior must update/review:

- local schema;
- migration compatibility;
- offline/reconnect tests;
- session-expiry behavior;
- PWA lifecycle where applicable.

Never fix a local migration bug by clearing all browser data when unsynced edits may exist.

## Imports/exports

Any importer/exporter change must evaluate:

- schema version;
- mapping behavior;
- duplicate matching;
- merge precedence;
- provenance;
- protected fields;
- rollback;
- old fixture compatibility;
- round-trip behavior.

Ordinary imports never infer deletion from a missing row.

## Dependencies

Before adding a runtime/development dependency, justify:

- problem solved;
- why existing platform/small implementation is insufficient;
- security/maintenance status;
- bundle/build impact;
- licensing;
- testing implications.

Keep dependencies minimal and lock versions reproducibly.

## Tests

A feature is incomplete without applicable verification. Depending on behavior this includes:

- unit;
- property-based;
- mutation testing;
- integration/local Supabase;
- RLS allow + deny;
- adversarial/security;
- import/export;
- migration/backup;
- Playwright E2E;
- offline/reconnect;
- accessibility;
- performance/real-device checks.

100% in-scope coverage is a gate, not a substitute for meaningful assertions.

## PR description

Include as applicable:

- purpose;
- requirement IDs/spec links;
- implementation lot;
- data/schema impact;
- migration/rollback impact;
- security/privacy impact;
- offline/sync impact;
- import/export impact;
- tests added and full verification result;
- screenshots using synthetic/demo data only;
- known limitations/deferred decisions.

## Public issue/PR hygiene

Never paste production logs containing PII/secrets. Use sanitized diagnostic IDs and synthetic reproduction.

Security vulnerabilities should follow `SECURITY.md`, not public exploit disclosure.

## Definition of complete

A PR is not complete merely because its code works locally. It must satisfy the relevant requirement IDs, lot acceptance criteria, Definition of Done, required quality gates and documentation consistency.
