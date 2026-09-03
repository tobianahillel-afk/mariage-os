# Mariage OS

Mariage OS is a private, collaborative wedding-planning application for a couple. It centralizes venues, vendors, guests, seating, budget, documents, tasks, decisions, evidence, planning and the wedding-day timeline while staying focused on one question: **what matters next?**

> **AI/coding agents arriving without conversation context must start with [`AGENTS.md`](AGENTS.md), then the current [`IMPLEMENTATION-STATUS`](docs/roadmap/IMPLEMENTATION-STATUS.md).**

## Project status

**V1 design baseline is frozen; final cross-document architecture/product/UX/engineering review is in progress. Implementation gate is CLOSED.**

Do **not** start Lot 0 merely because the specification is frozen or because PR #4 exists. Implementation becomes authorized only after:

1. `docs/FINAL-DESIGN-REVIEW.md` closes every BLOCKING/MAJOR finding;
2. all documentation entry points agree;
3. PR review comments/merge blockers are resolved;
4. documentation Run 4 is merged into `main`.

Current exact progress and next permitted action live in [`docs/roadmap/IMPLEMENTATION-STATUS.md`](docs/roadmap/IMPLEMENTATION-STATUS.md).

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

The UX must remain simpler than the data model: purposeful screens, progressive detail, readable mobile flows and a calm/elegant visual hierarchy instead of giant forms or universal admin tables.

## Hard constraints

- Cloud-accessible from supported phone/tablet/desktop.
- Two primary partner owners in first deployment, with multi-tenant/public-ready core architecture.
- Controlled single-couple production bootstrap; not open public project signup in V1.
- Normal private-V1 operation targets **€0/month**.
- Responsive PWA with explicit offline/pending/conflict behavior.
- Supabase = shared cloud truth; IndexedDB = local working/offline state.
- PostgreSQL/Storage RLS + same-project integrity enforce isolation.
- Public GitHub contains code/docs/tests/synthetic fixtures only.
- Real wedding data/secrets/backups never belong in GitHub.
- Important facts retain evidence/confidence/freshness/conflicts.
- Financial/date/import semantics are exact and explicit.
- No silent destructive import, conflict overwrite or confirmed-data loss.
- Portable verified recovery is first-class.
- User-facing implementation must conform to UX/visual architecture and cannot satisfy requirements by dumping all fields into one page/table.
- Code must follow canonical layer/folder/dependency/size/complexity rules; a working god file is not an acceptable implementation.

## Chosen architecture

- **Frontend:** Vite + TypeScript, no React in V1.
- **Hosting:** Cloudflare Pages free-tier target for private V1.
- **Backend:** Supabase Auth/PostgreSQL/Storage/Realtime free-tier target.
- **Authorization:** centralized permissions + PostgreSQL/Storage RLS + same-project relational validation.
- **Local/offline:** project/account-scoped IndexedDB + durable mutation queue.
- **PWA:** versioned Service Worker + Web App Manifest.
- **Files:** private Supabase Storage + privacy-safe external media references.
- **Repository:** public GitHub with no production/private wedding data.

> **GitHub stores the application. Supabase stores the synchronized wedding. IndexedDB protects temporary local work. Verified `.mariage` backups preserve portability/recovery.**

## Documentation — start here

For humans: [`docs/START-HERE.md`](docs/START-HERE.md).

For AI/context-free contributors: [`AGENTS.md`](AGENTS.md) + [`docs/engineering/LLM-TASK-ROUTING.md`](docs/engineering/LLM-TASK-ROUTING.md).

Key product/governance contracts:

- [`docs/PRODUCT-SPECIFICATION.md`](docs/PRODUCT-SPECIFICATION.md) — frozen V1 master specification.
- [`docs/REQUIREMENTS-CATALOG.md`](docs/REQUIREMENTS-CATALOG.md) — traceable requirements.
- [`docs/FEATURE-LEDGER.md`](docs/FEATURE-LEDGER.md) — 104 V1 capabilities tracked feature by feature.
- [`docs/roadmap/V1-SCOPE.md`](docs/roadmap/V1-SCOPE.md) — frozen V1/post-V1 boundary.
- [`docs/FINAL-DESIGN-REVIEW.md`](docs/FINAL-DESIGN-REVIEW.md) — final implementation gate.
- [`docs/reviews/DOCUMENTATION-SYSTEM-SCORECARD.md`](docs/reviews/DOCUMENTATION-SYSTEM-SCORECARD.md) — systematic 44-criterion documentation/LLM/engineering scorecard.
- [`docs/reviews/LLM-COLD-START-REVIEW.md`](docs/reviews/LLM-COLD-START-REVIEW.md) — context-free takeover simulation.
- [`docs/INDEX.md`](docs/INDEX.md) — full documentation map.

Key UX contracts:

- [`docs/ux/VISUAL-SYSTEM.md`](docs/ux/VISUAL-SYSTEM.md) — visual-design entry point.
- [`docs/ux/UX-ARCHITECTURE.md`](docs/ux/UX-ARCHITECTURE.md) — page model, progressive disclosure and anti-overload rules.
- [`docs/ux/SCREEN-BLUEPRINTS.md`](docs/ux/SCREEN-BLUEPRINTS.md) — detailed screen composition.
- [`docs/ux/SCREEN-CONTRACTS.md`](docs/ux/SCREEN-CONTRACTS.md) — route/actions/states.
- [`docs/ux/DESIGN-SYSTEM.md`](docs/ux/DESIGN-SYSTEM.md) — visual/component consistency.

Key engineering contracts:

- [`docs/engineering/IMPLEMENTATION-PLAYBOOK.md`](docs/engineering/IMPLEMENTATION-PLAYBOOK.md) — feature lifecycle/FIR/anti-drift workflow.
- [`docs/engineering/CODING-STANDARDS.md`](docs/engineering/CODING-STANDARDS.md) — binding coding rules.
- [`docs/engineering/CODEBASE-STRUCTURE.md`](docs/engineering/CODEBASE-STRUCTURE.md) — canonical physical source/test/module architecture.
- [`docs/engineering/MODULE-SIZE-COMPLEXITY.md`](docs/engineering/MODULE-SIZE-COMPLEXITY.md) — quantitative file/function/complexity guardrails.
- [`.github/pull_request_template.md`](.github/pull_request_template.md) — required PR evidence surface.
- [`docs/roadmap/LOTS.md`](docs/roadmap/LOTS.md) and [`docs/roadmap/LOT-ACCEPTANCE.md`](docs/roadmap/LOT-ACCEPTANCE.md) — implementation sequence/exit criteria.
- [`docs/roadmap/INTEGRATION-CHECKPOINTS.md`](docs/roadmap/INTEGRATION-CHECKPOINTS.md) — whole-product reviews after Lots 0–3, 4–7, 8–10 and 11–12.
- [`docs/roadmap/IMPLEMENTATION-STATUS.md`](docs/roadmap/IMPLEMENTATION-STATUS.md) — living progress/handoff state.

## Security/privacy

Never commit real guest/contact data, private notes/ratings, budgets/payments, quotes/contracts/invoices, payment evidence, private photos, production dumps, `.mariage` backups, tokens or secret/service-role keys.

Security work starts at [`docs/security/README.md`](docs/security/README.md). Browser/UI is not an authorization boundary.

## Quality

A feature is not complete because it works once. The project requires applicable:

- strict TypeScript/lint/format and architecture/complexity checks;
- deterministic unit/property/integration tests;
- 100% defined in-scope business-code lines/statements/functions/branches gate;
- mutation testing for critical engines;
- database/RLS allow+deny/adversarial tests;
- Playwright critical journeys;
- offline/reconnect/session/PWA tests;
- import/rollback/round-trip/hostile-file tests;
- backup/encryption/restore/migration tests;
- accessibility/performance/browser-device validation;
- synthetic desktop/mobile UX evidence for major screen changes;
- no accepted known exploitable Critical/High release vulnerability;
- requirement/Feature/Security/documentation traceability.

Coverage is a gate, not proof of correctness by itself.

## Development control after the gate opens

Implementation is tracked capability by capability, not by vague percentage, LOC or file count.

Every V1 feature follows:

`SPECIFIED → READY → IN_PROGRESS → IMPLEMENTED → VERIFIED → INTEGRATED → ACCEPTED`

with a Feature Implementation Record linking requirements, routes, UX, module ownership, domain model, cloud/local storage, security, offline behavior, tests and evidence.

Every 3–4 lots, a mandatory integration checkpoint re-reviews the whole implemented product for product fidelity, UX, architecture/maintainability, security, data integrity, offline behavior and documentation drift. The systematic scorecard is repeated with real implementation evidence.

## V1 cutover

Mariage OS becomes the operational source of truth only after the V1 cutover evidence package is complete: security/RLS gates, real-device partner acceptance, reconciled existing venue/guest/vendor data, validated guest/finance calculations, tested backup→restore, MFA/recovery readiness and a production recovery export.

Until then, existing wedding spreadsheets/research remain authoritative legacy sources.

## Current next step

**Finish and pass the final design review. Do not start Lot 0.**

After that review passes and Run 4 is merged, Lot 0 becomes the first permitted implementation lot; it is not part of this documentation/freeze step.
