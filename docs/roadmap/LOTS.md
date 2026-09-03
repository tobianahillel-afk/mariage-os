# Development Lots

Status: **Frozen V1 implementation sequence — not yet authorized to start**

Detailed exit criteria live in `LOT-ACCEPTANCE.md`. Binding scope lives in `V1-SCOPE.md`. Feature-level progress lives in `../FEATURE-LEDGER.md`. Cross-lot reviews live in `INTEGRATION-CHECKPOINTS.md`.

A later lot cannot weaken security, integrity, UX, code architecture, maintainability, import, offline or recovery guarantees established earlier.

## Documentation/design phase

Runs 1–3 are merged. Run 4 contains the frozen V1 specification plus final pre-implementation review.

**No implementation lot starts until `FINAL-DESIGN-REVIEW.md` declares the gate OPEN and Run 4 is merged.**

---

## Lot 0 — Repository and tooling

Build the reproducible engineering environment only:

- Vite + strict TypeScript;
- canonical `src/` / `tests/` / `supabase/` structure from `engineering/CODEBASE-STRUCTURE.md`;
- path aliases/composition-root convention without bypassing dependency boundaries;
- lint/format tooling;
- automated layer/import-cycle enforcement;
- automated file/function/complexity/parameter/dead-code/TODO guardrails equivalent to `engineering/MODULE-SIZE-COMPLEXITY.md` where tooling is reliable;
- unit/property/coverage harness using frozen test-placement convention;
- Playwright;
- mutation-test harness;
- local Supabase;
- direct DB/RLS test harness;
- synthetic/golden multi-project seed project;
- CI/preview build;
- documentation/link validation;
- environment/secret safeguards;
- `npm run dev`, `npm run test:fast`, `npm run verify` or documented equivalents.

Lot 0 acceptance must prove a deliberately violating fixture/example is caught by the relevant architecture/complexity check where practical (for example forbidden cross-layer import or cycle), so the rules are not merely configured but ineffective.

No production wedding feature/data.

## Lot 1 — Identity, project and secure foundation

- Supabase Auth integration;
- controlled single-couple bootstrap;
- secure partner invitation flow;
- profiles/projects/members/invitations;
- permission/role model foundation;
- RLS + same-project relational integrity baseline;
- protected shell/navigation;
- IndexedDB/repository/service foundations;
- sync operation/status primitives;
- diagnostics/security setup shell;
- safe logout/cache policy.

No later domain may bypass these primitives.

## Lot 2 — Venues core

- venue CRUD/quick add;
- code/status/rejection/history;
- member ratings/favorites;
- spaces/capacity/dimensions;
- facts/observations/sources/value typing;
- criterion evaluation/missing information;
- offers/availability basics;
- photos/documents basics;
- access origins/routes basics;
- gallery/table/detail/compare/visit;
- deep links.

## Lot 3 — Tasks, decisions and Inbox

- tasks/owners/status/dependencies/waiting/blockers;
- joint decisions/approvals/rationale/history;
- discuss-together queue;
- Inbox capture and idempotent conversion;
- deterministic next-action inputs;
- links to existing project entities.

### Mandatory Checkpoint A after Lot 3

Before normal Lot 4 work starts, perform `INTEGRATION-CHECKPOINTS.md` **Checkpoint A — Foundation & Core Decision Loop**.

Review all Lots 0–3 together for product fidelity, UX architecture, code architecture/complexity, data/security boundaries, offline behavior, cross-feature coherence and Feature Ledger completeness.

Repeat/update `reviews/DOCUMENTATION-SYSTEM-SCORECARD.md` using implementation evidence.

Checkpoint A must PASS with no unresolved BLOCKING/MAJOR finding.

---

## Lot 4 — Import/export foundation

- canonical JSON v1 + addendum machine schema;
- CSV/XLSX/clipboard/pasted JSON;
- parent-scoped nested external IDs;
- mapping profiles;
- validation/dedup/merge/preview;
- provenance/history/rollback;
- categories/tags import behavior;
- research-missing-data export;
- round-trip/hostile-file tests.

## Lot 5 — Budget, scenarios and payments

- budget categories/items;
- exact pricing engine;
- estimate/quote/approved/contracted semantics;
- named scenarios with date/venue/guest/package assumptions;
- tax treatment;
- payment/deposit/refund/credit/final-balance semantics;
- cash-flow views;
- financial links and exports.

## Lot 6 — Guests, households and structured seating

- household/person/category model;
- priority/probability/RSVP;
- relationships/logistics;
- expected/cumulative statistics;
- bulk actions and legacy spreadsheet migration;
- seating sections/tables/capacity/assignments;
- seating validation/export.

Graphical drag/drop seating remains post-V1.

## Lot 7 — Vendors, commercial documents and contract readiness

- generic vendor/types;
- contacts/interactions;
- quote lifecycle/offers/packages/components;
- caterer-specific facts/inclusions;
- venue compatibility;
- document supersession/version links;
- contract readiness checklist;
- waiting/follow-up integration.

### Mandatory Checkpoint B after Lot 7

Before normal Lot 8 work starts, perform **Checkpoint B — Data Intake & Operational Planning Core** across Lots 0–7.

This checkpoint verifies especially that Import, Budget, Guests, Seating and Vendors form one usable workflow rather than separate tables/modules, and that feature growth has not produced god services/files or architectural boundary erosion.

Repeat/update the systematic scorecard with implemented evidence.

Checkpoint B must PASS with no unresolved BLOCKING/MAJOR finding.

---

## Lot 8 — Dashboard, planning, timeline and search

- phases/milestones/dependencies;
- weighted progress;
- blockers/waiting/joint decisions;
- partner activity cursor;
- next-action ranking;
- structured wedding-day timeline;
- frozen timeline export;
- global authorized search;
- phase-aware dashboard.

Dedicated advanced live day-of mode remains post-V1.

## Lot 9 — Map and access

- venue coordinates;
- pins/status filters;
- selected venue card;
- external directions;
- multi-origin access presentation/TGV facts;
- external-content privacy safeguards;
- graceful map failure/offline fallback.

## Lot 10 — Offline/PWA hardening

- service-worker lifecycle;
- IndexedDB migrations;
- durable queue/reconnect;
- conflict UX;
- media queue separation;
- offline venue pinning;
- install/update UX;
- cross-project cache isolation;
- real-device tests.

### Mandatory Checkpoint C after Lot 10

Before production-readiness Lot 11 proceeds normally, perform **Checkpoint C — Product Control, Spatial UX & Offline Hardening** across the complete implemented product.

Checkpoint C must prove Mariage OS now behaves as one coherent wedding OS: Dashboard/Search/Inbox/Planning/Timeline/Map/offline navigation must simplify rather than fragment the product, while code/module boundaries remain navigable and maintainable.

Repeat/update the systematic scorecard with implemented evidence.

Checkpoint C must PASS with no unresolved BLOCKING/MAJOR finding.

---

## Lot 11 — Backup, recovery and production readiness

- structured/full `.mariage` export;
- encrypted backup format implementation;
- checksums/integrity verification;
- restore/migrations;
- production headers/security hardening;
- complete RLS/security evidence;
- quota protection;
- incident diagnostics;
- release candidate gates.

## Lot 12 — Existing-data migration and V1 cutover

- venue research migration/reconciliation;
- guest spreadsheet migration/reconciliation;
- vendor initial-data migration/reconciliation;
- budget/statistical validation;
- real-device partner acceptance;
- legacy archival exports;
- recovery export/restore drill;
- formal source-of-truth declaration.

### Mandatory Checkpoint D after Lot 12

Perform **Checkpoint D — Recovery, Real Data & V1 Cutover**.

This is the final cutover gate. The final scorecard/review uses actual implementation, devices and recovery evidence rather than documentation-only scores.

No declaration that Mariage OS is the operational source of truth occurs before Checkpoint D PASS.

---

## Per-lot progress rule

Every lot uses `engineering/IMPLEMENTATION-PLAYBOOK.md`:

- implement feature by feature;
- maintain Feature Implementation Records;
- follow canonical code structure/complexity rules;
- update `FEATURE-LEDGER.md` states;
- update `IMPLEMENTATION-STATUS.md`;
- perform UX review for user-facing features;
- no unexplained `IN_PROGRESS`/`IMPLEMENTED` rows at lot acceptance;
- no unexplained maintainability/architecture exception accumulation.

Lot completion is not measured by file count, LOC or percentage of UI mocked. It is measured by accepted Feature IDs and objective lot criteria.

---

## Explicit post-V1 examples

- graphical/automatic seating optimization;
- advanced transport/hotel allocation;
- live wedding-day command-center mode;
- guest portal/vendor temporary sharing;
- push notifications;
- AI/OCR document extraction;
- automatic Internet venue research inside app;
- internal messaging;
- native mobile app;
- banking/payment integration;
- automated email/calendar-provider sync.

## Scope-change rule

Nothing moves into/out of V1 silently. Scope changes require product/spec/requirement update, Feature Ledger impact, dependency/security/data/UX/code-architecture/test review and updated lot/cutover criteria.
