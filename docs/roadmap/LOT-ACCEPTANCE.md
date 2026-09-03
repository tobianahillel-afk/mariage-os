# Implementation Lot Acceptance Contracts

Status: **Binding V1 sequencing and exit criteria — implementation gate currently CLOSED**

A lot is complete only when deliverables, tests, security controls, migrations and documentation are complete. “UI appears to work” is never sufficient.

All lots inherit the Definition of Done, Quality Gates, frozen requirements and all prior-lot invariants.

Before any implementation lot begins, `FINAL-DESIGN-REVIEW.md` must declare the implementation gate **OPEN** and Run 4 must be merged.

---

## Lot 0 — Repository and tooling

### Goal
Create a reproducible engineering environment and executable quality pipeline before feature work.

### Deliverables
- Vite + TypeScript skeleton using the frozen no-React V1 ADR.
- strict TypeScript.
- lint/format.
- Vitest unit/coverage.
- property-test harness.
- Playwright.
- mutation-testing harness.
- local Supabase config/migration directory.
- isolated synthetic seed/golden project.
- environment validation/no-secret safeguards.
- `dev`, fast-test and full-verify command contracts.
- CI from clean checkout.
- Cloudflare preview build.

### Exit
Fresh clone can bootstrap with no production credentials; build/tests/CI smoke/secret checks are green. No wedding feature code is required.

---

## Lot 1 — Identity, project and secure foundation

### Deliverables
- Auth integration.
- controlled initial-owner bootstrap.
- secure identity-bound partner invitation.
- profiles/projects/project_members/project_invitations.
- RLS and same-project FK/polymorphic validation foundation.
- protected shell/routes.
- repository/service/domain boundaries.
- local DB abstraction/project-scoped cache.
- operation IDs/revisions/sync indicator.
- safe session-expiry/logout/pending-work behavior.
- diagnostics/security setup shell.

### Required verification
- anonymous deny;
- member allow;
- cross-project CRUD deny;
- mixed-project FK injection denied;
- invite wrong identity/replay/expiry denied;
- unrelated user cannot create production project;
- final-owner invariant;
- session expiry and logout do not lose pending work;
- cross-project local cache not shown;
- synthetic two-owner E2E.

### Exit
No feature lot may persist meaningful project data until project isolation is demonstrated directly at DB/Storage boundaries.

---

## Lot 2 — Venue core

### Deliverables
- venue CRUD/quick add/code/status/rejection/history;
- member-scoped ratings/favorites;
- spaces/capacity/dimensions;
- fact definitions/types/evaluation rules;
- observations/multiple sources/confidence/freshness;
- missing-info and compatibility explanation;
- venue offers/availability basics;
- reference origins/access routes basics;
- remote/private photos and document basics;
- summary/gallery/table/detail/compare/visit/deep links.

### Required verification
- fact state/type invariants;
- multi-source conflict retention;
- blocked criterion always visible;
- natural code sort;
- parent/child same-project constraints;
- route-origin observations remain contextual;
- personal ratings independent;
- remote image privacy safeguards;
- venue create/edit/reject/restore/compare/visit E2E.

### Exit
A synthetic complex venue with conflicting evidence, multiple spaces, route observations, offers and two independent partner ratings can be safely created/compared/rejected/restored/exported.

---

## Lot 3 — Tasks, decisions and Inbox

### Deliverables
- task lifecycle/owners/dependencies/waiting/blockers/follow-up;
- entity links;
- decisions/options/approvals/require-both/rationale/lock/reopen;
- discuss-together queue;
- Inbox capture and conversion;
- deterministic next-action factors.

### Verification
- transition/dependency/cycle tests;
- waiting vs actionable behavior;
- both-owner approval;
- concurrent approval/update;
- Inbox conversion idempotence/provenance;
- cross-project link denials;
- joint-decision E2E.

### Exit
The application correctly distinguishes “I must act”, “we must decide”, “blocked”, “waiting external” and “captured but not classified”.

---

## Lot 4 — Import/export foundation

### Deliverables
- machine-readable canonical JSON v1 + addendum schema/validators;
- CSV/XLSX/clipboard/pasted JSON;
- stable namespaced external IDs including parent-scoped nested IDs;
- mapping engine and stored mapping profiles;
- locale/value normalization;
- duplicate detection/merge planning;
- preview/protected-field behavior;
- category/tag creation review;
- provenance/import change history;
- intelligent rollback;
- missing/stale-research export;
- round-trip fixtures.

### Verification
- repeat import idempotence;
- child external ID reuse across different parents;
- missing rows do not delete;
- stronger evidence preserved;
- ambiguous guests never name-auto-merge;
- malformed/hostile spreadsheets;
- formula-injection-safe export;
- rollback protects later edits;
- future-schema rejection;
- lossless round-trip where claimed.

### Exit
Supported files can be analyzed, previewed, committed, repeated and rolled back without silent destructive behavior.

---

## Lot 5 — Budget, scenarios and payments

### Deliverables
- budget categories/items;
- exact calculation engine;
- estimate/quote/approved/contracted states;
- named scenarios with date/venue/guest/offers/components;
- one explicit active scenario;
- tax treatment;
- payment schedule/status/type;
- deposits/refunds/credits/deposit returns/final balance;
- cash flow and derived totals;
- source/document/entity links.

### Verification
- cent-exact arithmetic/rounding;
- fixed/per-unit/per-guest/per-table/per-hour/minimum-variable;
- historical quote immutable under scenario change;
- partial payment/refund/deposit return;
- tax unknown is never assumed;
- scenario coexistence/switch/recompute;
- property/mutation tests for critical financial engine.

### Exit
All supported calculations match independent fixtures and financially distinct states remain distinguishable.

---

## Lot 6 — Guests, households and structured seating

### Deliverables
- categories/households/guests;
- priority/probability/RSVP;
- relationships and limited logistics;
- expected/cumulative statistics;
- bulk actions/import/export;
- seating sections/tables/capacities/assignments;
- unassigned/over-capacity checks and seating export.

### Verification
- reference probability/priority totals;
- RSVP precedence;
- household invariants;
- ambiguous duplicate protection;
- PII-log checks;
- seating same-project integrity;
- duplicate assignment/capacity/unassigned rules;
- keyboard/mobile seating usability without drag/drop.

### Exit
Legacy-style guest statistics reconcile exactly and a complete non-visual seating assignment can be created/exported safely.

---

## Lot 7 — Vendors, commercial documents and contract readiness

### Deliverables
- vendor types/CRUD/status;
- contacts/interactions;
- quote/request/clarification/follow-up;
- offers/packages/components;
- caterer facts;
- venue compatibility;
- document version/supersession;
- contract-readiness checklist;
- linked tasks/budget/files.

### Verification
- vendor lifecycle and package semantics;
- waiting/follow-up;
- venue-vendor cross-project denial;
- document private access/version lineage;
- contract checklist factual-state behavior;
- no presentation of checklist as legal approval/advice.

### Exit
A caterer/other provider can be compared and commercially tracked from research through reviewed contract readiness without parallel manual tracking.

---

## Lot 8 — Dashboard, planning, event timeline and search

### Deliverables
- phases/milestones/dependencies/completion rules;
- weighted progress;
- blockers/waiting/joint-decision summaries;
- member activity cursor;
- deterministic next action;
- structured event timeline and dependencies/vendor links;
- frozen timeline export;
- global authorized/offline-aware search;
- phase-aware dashboard.

### Verification
- milestone dependency/date recalculation;
- no fake progress from microtasks;
- next-action explainability;
- after-midnight timeline order;
- timeline dependency cycles rejected;
- frozen export immutability;
- search RLS/privacy/archive rules;
- partner “since last visit” cursor behavior.

### Exit
A partner can understand project state and next action quickly, and the wedding-day plan/search are usable without introducing advanced post-V1 command-center behavior.

---

## Lot 9 — Map and access

### Deliverables
- stored coordinates;
- pins/status/region filters;
- selected venue card;
- external directions;
- multi-origin route presentation/TGV/access facts;
- external-request privacy/referrer handling;
- map/network fallback.

### Verification
- coordinate validation;
- contextual origin/mode correctness;
- no private data in external route/image query URLs;
- map outage never blocks venue data;
- safe external navigation.

### Exit
Map improves spatial decision-making but is never a dependency for core records.

---

## Lot 10 — Offline/PWA hardening

### Deliverables
- versioned app-shell/service-worker lifecycle;
- IndexedDB migrations;
- durable queue/reconnect/conflict UX;
- media queue separation;
- offline pins/recent data;
- install/update flow;
- cross-account/project cache isolation;
- real-device support validation.

### Verification
- close/reopen offline;
- reconnect/out-of-order/duplicate retry;
- same-field conflict;
- delete/edit race;
- session expiry;
- service-worker update with pending mutations;
- old app/new schema incompatibility;
- logout/purge;
- real-device smoke.

### Exit
No supported offline/update/session scenario silently loses confirmed structured work or reveals another project cache.

---

## Lot 11 — Backup, recovery and production readiness

### Deliverables
- structured/full `.mariage` export;
- encrypted container implementation;
- manifest/checksums;
- restore/verification/migrations;
- historical fixtures;
- complete RLS/Storage evidence;
- CSP/security headers;
- quota protections;
- incident/diagnostic readiness;
- release-candidate pipeline.

### Verification
- backup→restore semantic equality;
- wrong password/tamper detection before mutation;
- corrupt binary detection;
- future-schema rejection;
- historical migration;
- complete security/RLS matrix;
- quota-pressure behavior;
- ASVS applicable evidence.

### Exit
A golden project is recoverable from verified portable backup and all applicable P0 production-readiness gates pass.

---

## Lot 12 — Existing-data migration and V1 cutover

### Deliverables
- venue research migration/reconciliation;
- guest spreadsheet migration/reconciliation;
- vendor migration/reconciliation;
- critical budget/statistical validation;
- corrections retaining provenance;
- both-owner real-device acceptance;
- pre-cutover legacy archive;
- production recovery export;
- formal source-of-truth declaration.

### Verification
- critical real-data reconciliation;
- guest totals/cumulative priorities;
- venue status/rejection/source data;
- vendor quote/contact state;
- backup restore drill via safe procedure;
- supported mobile/desktop walkthrough.

### Exit
Both owners explicitly accept Mariage OS as source of truth and the V1 cutover evidence package is complete.

---

## Cross-lot rule

No later lot may weaken frozen security, data-integrity, financial, offline, import/export or recovery semantics. Material architectural changes require reviewed spec/requirements, ADR when applicable, migration impact and updated tests.
