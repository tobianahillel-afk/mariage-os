# Contributing to Mariage OS

## Before you write code

Read:

1. `docs/START-HERE.md`
2. `docs/PRODUCT.md`
3. `docs/PRINCIPLES.md`
4. relevant feature/domain/security documents
5. `docs/engineering/DEFINITION-OF-DONE.md`
6. `docs/quality/QUALITY-GATES.md`

Do not rely on prior chat context.

## Repository safety

This repository is public.

Never commit real wedding data, private screenshots, guest names/contact details, budgets, contracts, invoices, `.mariage` backups, production dumps or secrets.

Use synthetic fixtures only.

## Workflow

1. Start from current `main`.
2. Create a focused branch.
3. Update specification first if behavior changes.
4. Implement the smallest coherent change.
5. Add/update all applicable tests.
6. Run local verification.
7. Open PR with requirement/spec references.
8. Resolve all required CI failures.
9. Merge only when Definition of Done is met.

## Planned commands

Implementation phase should provide at least:

```text
npm run dev
npm run test:fast
npm run verify
```

`npm run verify` must reproduce the required clean quality gate as closely as practical.

## Database changes

All schema/policy changes use versioned migrations under `supabase/migrations/`.

Do not make undocumented production dashboard changes that cannot be reproduced from Git.

## Dependencies

Before adding a package, justify its need, security/maintenance cost and browser/build impact. Keep dependencies minimal.

## Tests

No feature is complete without applicable tests. Critical data/security logic requires stronger verification than UI happy-path tests.

## Documentation

Documentation changes ship with behavior changes. If a no-context developer cannot understand expected behavior from the repository, the change is incomplete.

## PR description

Include:

- purpose;
- affected requirements/specs;
- data/schema impact;
- security/privacy impact;
- offline/sync impact;
- import/export impact;
- tests added/run;
- screenshots using synthetic/demo data if useful;
- migration/rollback notes where relevant.

## Public issue/PR hygiene

Never paste production logs containing PII/secrets. Use sanitized diagnostic IDs and synthetic reproduction.
