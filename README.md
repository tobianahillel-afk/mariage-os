# Mariage OS

Mariage OS is a private, collaborative wedding-planning application for a couple. It centralizes venues, vendors, guests, seating, budget, documents, tasks, decisions, evidence, planning and the wedding-day timeline while staying focused on one question: **what matters next?**

## Project status

**V1 design baseline is frozen; final cross-document architecture/product review is in progress. Implementation gate is CLOSED.**

Do **not** start Lot 0 merely because the specification is frozen or because PR #4 exists. Implementation becomes authorized only after:

1. `docs/FINAL-DESIGN-REVIEW.md` closes every BLOCKING/MAJOR finding;
2. all documentation entry points agree;
3. PR review comments/merge blockers are resolved;
4. documentation Run 4 is merged into `main`.

This documentation task deliberately stops before Lot 0.

## Product objective

Either partner should quickly understand:

- where the wedding stands;
- what is decided;
- what is unknown/stale/conflicting;
- what blocks progress or waits on someone else;
- what action matters next and who owns it;
- what requires both partners;
- what is estimated, quoted, contracted, paid and still due;
- why important decisions were made;
- whether local/cloud state is synchronized and recoverable.

Mariage OS is a **decision-and-action system**, not merely a database/inspiration site.

## Hard constraints

- Cloud-accessible from supported phone/tablet/desktop.
- Two primary partner owners.
- Controlled single-couple production bootstrap; not open public project signup.
- Normal operation targets **€0/month**.
- Responsive PWA with explicit offline/pending/conflict behavior.
- Supabase = shared cloud truth; IndexedDB = local working/offline state.
- PostgreSQL/Storage RLS + same-project integrity enforce isolation.
- Public GitHub contains code/docs/tests/synthetic fixtures only.
- Real wedding data/secrets/backups never belong in GitHub.
- Important facts retain evidence/confidence/freshness/conflicts.
- Financial/date/import semantics are exact and explicit.
- No silent destructive import, conflict overwrite or confirmed-data loss.
- Portable verified recovery is first-class.

## Chosen architecture

- **Frontend:** Vite + TypeScript, no React in V1.
- **Hosting:** Cloudflare Pages free tier target.
- **Backend:** Supabase Auth/PostgreSQL/Storage/Realtime free tier target.
- **Authorization:** PostgreSQL/Storage RLS plus same-project relational validation.
- **Local/offline:** project/account-scoped IndexedDB + durable mutation queue.
- **PWA:** versioned Service Worker + Web App Manifest.
- **Files:** private Supabase Storage + privacy-safe external media references.
- **Repository:** public GitHub with no production/private wedding data.

> **GitHub stores the application. Supabase stores the synchronized wedding. IndexedDB protects temporary local work. Verified `.mariage` backups preserve portability/recovery.**

## Documentation — start here

Mandatory entry point: [`docs/START-HERE.md`](docs/START-HERE.md).

Key gates/contracts:

- [`docs/PRODUCT-SPECIFICATION.md`](docs/PRODUCT-SPECIFICATION.md) — frozen V1 master specification.
- [`docs/REQUIREMENTS-CATALOG.md`](docs/REQUIREMENTS-CATALOG.md) — traceable requirements.
- [`docs/roadmap/V1-SCOPE.md`](docs/roadmap/V1-SCOPE.md) — frozen V1/post-V1 boundary.
- [`docs/DOCUMENTATION-AUDIT.md`](docs/DOCUMENTATION-AUDIT.md) — freeze audit findings.
- [`docs/FINAL-DESIGN-REVIEW.md`](docs/FINAL-DESIGN-REVIEW.md) — final implementation gate.
- [`docs/IMPLEMENTATION-READINESS.md`](docs/IMPLEMENTATION-READINESS.md) — readiness criteria.
- [`docs/INDEX.md`](docs/INDEX.md) — full documentation map.
- [`docs/roadmap/LOTS.md`](docs/roadmap/LOTS.md) and [`LOT-ACCEPTANCE.md`](docs/roadmap/LOT-ACCEPTANCE.md) — implementation sequence after gate opens.

## Security/privacy

Never commit real guest/contact data, private notes/ratings, budgets/payments, quotes/contracts/invoices, payment evidence, private photos, production dumps, `.mariage` backups, tokens or secret/service-role keys.

Security documentation under `docs/security/` is normative. Browser/UI is not an authorization boundary.

## Quality

A feature is not complete because it works once. The project requires applicable:

- strict TypeScript/lint/format;
- deterministic unit/property/integration tests;
- 100% defined in-scope business-code lines/statements/functions/branches gate;
- mutation testing for critical engines;
- database/RLS allow+deny/adversarial tests;
- Playwright critical journeys;
- offline/reconnect/session/PWA tests;
- import/rollback/round-trip/hostile-file tests;
- backup/encryption/restore/migration tests;
- accessibility/performance/browser-device validation;
- no accepted known exploitable Critical/High release vulnerability;
- documentation/requirements traceability.

Coverage is a gate, not proof of correctness by itself.

## V1 cutover

Mariage OS becomes the operational source of truth only after the V1 cutover evidence package is complete: security/RLS gates, real-device partner acceptance, reconciled existing venue/guest/vendor data, validated guest/finance calculations, tested backup→restore, MFA/recovery readiness and a production recovery export.

Until then, existing wedding spreadsheets/research remain authoritative legacy sources.

## Current next step

**Finish and pass the final design review. Do not start Lot 0.**

After that review passes and Run 4 is merged, Lot 0 becomes the first permitted implementation lot; it is not part of this documentation/freeze step.
