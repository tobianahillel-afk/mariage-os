# Development Lots

Status: **Frozen V1 implementation sequence — not yet authorized to start**

Detailed exit criteria live in `LOT-ACCEPTANCE.md`. Binding scope lives in `V1-SCOPE.md`.

A later lot cannot weaken security, integrity, import, offline or recovery guarantees established earlier.

## Documentation/design phase

Runs 1–3 are merged. Run 4 contains the frozen V1 specification plus final pre-implementation review.

**No implementation lot starts until `FINAL-DESIGN-REVIEW.md` declares the gate OPEN and Run 4 is merged.**

---

## Lot 0 — Repository and tooling

Build the reproducible engineering environment only:

- Vite + TypeScript;
- strict type/lint/format;
- unit/property/coverage harness;
- Playwright;
- mutation-test harness;
- local Supabase;
- synthetic/golden seed project;
- CI/preview build;
- environment/secret safeguards.

No production wedding feature/data.

## Lot 1 — Identity, project and secure foundation

- Supabase Auth integration;
- controlled single-couple bootstrap;
- secure partner invitation flow;
- profiles/projects/members/invitations;
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

---

## Explicit post-V1 examples

- graphical/automatic seating optimization;
- advanced transport/hotel allocation;
- live wedding-day command-center mode;
- guest portal/vendor temporary sharing;
- push notifications;
- AI/OCR document extraction;
- automatic Internet research inside app;
- internal messaging;
- native mobile app;
- banking/payment integration;
- automated email/calendar-provider sync.

## Scope-change rule

Nothing moves into/out of V1 silently. Scope changes require product/spec/requirement update, dependency/security/data/test review and updated lot/cutover criteria.
