# Implementation Lot Acceptance Contracts

Status: **Binding implementation sequencing and exit criteria**

A lot is complete only when its deliverables, tests, security controls and documentation are complete. “UI appears to work” is not sufficient.

All lots inherit the global Definition of Done and Quality Gates.

---

## Lot 0 — Repository and tooling

### Goal
Create a reproducible development environment and verification pipeline before feature work.

### Deliverables
- Vite + TypeScript app skeleton.
- strict TypeScript configuration.
- lint/format scripts.
- Vitest unit/coverage harness.
- property-test harness.
- Playwright harness.
- mutation-test harness for future critical engines.
- local Supabase configuration.
- initial migration directory.
- synthetic seed/golden-project mechanism.
- `npm run dev`, `npm run test:fast`, `npm run verify` contracts.
- CI workflow skeleton.
- Cloudflare preview build configuration.
- environment-variable validation.

### Exit criteria
- fresh clone can bootstrap using documented commands;
- no production credentials are needed locally;
- clean app builds;
- synthetic smoke test passes;
- CI runs from clean checkout;
- public repository secret scans are clean.

---

## Lot 1 — Identity, project and secure foundation

### Goal
Establish the security boundary and project shell before storing meaningful wedding data.

### Deliverables
- Auth integration.
- profiles/project/project_members tables.
- owner invitation/join flow.
- RLS baseline.
- protected routing.
- application shell and responsive navigation.
- local database abstraction.
- repository/service/domain layering.
- initial sync-operation model.
- global sync indicator.
- diagnostics shell.

### Required tests
- anonymous deny tests;
- member allow tests;
- cross-project deny tests for every operation;
- owner membership invariants;
- session expiry/no-loss flow;
- route auth behavior;
- synthetic two-owner E2E.

### Exit criteria
No feature lot may store project data until project isolation is demonstrated at the database layer.

---

## Lot 2 — Venue core

### Goal
Deliver the first realistic end-user domain using existing venue research as validation material.

### Deliverables
- venue CRUD/quick add;
- stable UUID + human code;
- venue statuses/rejection reason;
- personal ratings/favorites;
- spaces/capacity model;
- configurable facts;
- observations/sources/confidence;
- remote media references and uploaded venue photos;
- summary/detail/gallery/table views;
- missing-information summary;
- basic comparison;
- history/activity;
- deep links.

### Required tests
- venue invariants;
- fact-state semantics;
- source-conflict retention;
- natural code sort;
- blocked criterion comparison;
- RLS on all venue-owned rows/media;
- venue create/edit/reject/restore E2E;
- mobile venue-detail smoke tests.

### Exit criteria
A synthetic venue with conflicting sources and multiple spaces can be created, compared, rejected/restored and fully recovered without unexplained data loss.

---

## Lot 3 — Tasks and decisions

### Goal
Make Mariage OS actionable and couple-aware.

### Deliverables
- task CRUD/status/owners;
- waiting/blocked state;
- dependencies;
- follow-up date;
- entity linking;
- joint decisions;
- require-both approval;
- rationale/alternatives;
- `discuss together` queue;
- deterministic next-action inputs.

### Required tests
- state-machine transitions;
- dependency/blocking behavior;
- independent partner approval behavior;
- concurrent approval/update behavior;
- waiting-vs-personal-work behavior;
- E2E joint-decision flow.

### Exit criteria
The application can distinguish “I must act”, “we must decide”, “we are blocked”, and “we are waiting for someone else”.

---

## Lot 4 — Import/export foundation

### Goal
Eliminate repetitive manual entry and establish open data portability.

### Deliverables
- canonical JSON v1 schema;
- CSV parser/exporter;
- XLSX parser/exporter;
- clipboard/pasted JSON entry where planned;
- schema/type detection;
- mapping engine;
- validation engine;
- duplicate detector;
- merge planner;
- preview UI;
- import provenance/history;
- rollback engine;
- research-missing-data export;
- round-trip fixtures.

### Required tests
- repeated import idempotence;
- missing rows do not delete;
- strong evidence not overwritten by weak data;
- guest ambiguous-name no-auto-merge;
- venue strong matching rules;
- malformed/hostile spreadsheets;
- CSV formula-injection export protection;
- rollback after later edits;
- schema future-version rejection;
- round-trip.

### Exit criteria
The same venue/guest import can be safely repeated, previewed and rolled back without silent destructive behavior.

---

## Lot 5 — Budget and payments

### Goal
Provide trustworthy financial decision support.

### Deliverables
- budget categories/items;
- pricing calculation types;
- estimate/quote/contract states;
- payment schedule;
- refundable deposits;
- cash-flow view;
- guest-count/date scenario inputs;
- minimum/probable/max model where configured;
- venue/vendor financial links.

### Required tests
- exact-money invariants;
- rounding rules;
- fixed/per-unit/per-guest/per-table/per-hour calculations;
- deposits/refunds;
- partial payments;
- scenario recomputation;
- property-based monotonicity where applicable;
- migration/export round-trip.

### Exit criteria
All supported calculations match independently computed fixture expectations and mutation tests kill non-equivalent arithmetic mutants.

---

## Lot 6 — Guests and households

### Goal
Replace the existing guest spreadsheet without losing its probabilistic/priority logic.

### Deliverables
- household/person model;
- priority/category;
- attendance probability;
- RSVP;
- partner/child grouping;
- expected counts;
- cumulative priority calculations;
- bulk actions;
- import mapping for legacy spreadsheet;
- export.

### Required tests
- existing spreadsheet-style fixture totals;
- zero/25/75/100% probability cases;
- household behavior;
- RSVP override/derived-statistic rules;
- ambiguous duplicate protection;
- PII logging checks;
- import rollback.

### Exit criteria
Synthetic and reconciled legacy-reference statistics match exactly for every supported cumulative view.

---

## Lot 7 — Vendors

### Goal
Track service providers and commercial follow-up in one consistent model.

### Deliverables
- vendor CRUD/types;
- contacts/interactions;
- quote/request status;
- offers/packages/inclusions;
- caterer-specific facts;
- venue compatibility links;
- documents;
- waiting/follow-up task integration.

### Required tests
- vendor lifecycle;
- package calculations/semantics;
- wait/follow-up flows;
- venue-vendor link RLS;
- documents private-access tests.

### Exit criteria
A caterer can be compared on actual included package and linked to venue compatibility without separate manual tracking.

---

## Lot 8 — Dashboard and planning

### Goal
Turn stored information into prioritized project control.

### Deliverables
- phases/milestones;
- weighted progress;
- blockers;
- next-action ranking;
- waiting summary;
- joint-decision summary;
- upcoming deadlines/payments;
- meaningful partner activity;
- phase-aware dashboard rules.

### Required tests
- deterministic prioritization;
- no fake progress from low-value task volume;
- phase-aware rendering;
- blocker propagation;
- explainability.

### Exit criteria
A partner opening the app can identify current project state and next useful action within the product's 30-second objective.

---

## Lot 9 — Map and access

### Goal
Provide spatial venue decision support without making maps a critical dependency.

### Deliverables
- stored coordinates;
- map pins/status filters;
- selected venue card;
- external directions link;
- accessibility/TGV facts;
- map network-error fallback.

### Required tests
- coordinate validation;
- status filtering;
- no-network behavior;
- deep link to venue;
- external-link safety.

### Exit criteria
Map outage never blocks venue decision data.

---

## Lot 10 — Offline/PWA hardening

### Goal
Make local-first behavior production trustworthy on real devices.

### Deliverables
- application shell cache/versioning;
- IndexedDB migrations;
- offline pinning/recent cache policy;
- durable mutation queue;
- reconnect process;
- conflict UX;
- media queue separation;
- installability;
- update prompt/version lifecycle.

### Required tests
- close/reopen while offline;
- reconnect after multiple remote changes;
- same-field conflict;
- session expiration;
- service-worker update;
- old cache/new schema safety;
- real-device smoke tests.

### Exit criteria
No supported offline test scenario loses a confirmed local structured edit silently.

---

## Lot 11 — Backup, recovery and production readiness

### Goal
Prove the system can fail safely and recover.

### Deliverables
- `.mariage` export;
- optional full media archive;
- checksums;
- restore workflow;
- backup verification;
- historic schema fixtures/migrations;
- security header deployment;
- quota protection;
- incident diagnostics;
- release-candidate pipeline.

### Required tests
- backup→destroy→restore equivalence;
- corrupt-file detection;
- future-schema rejection;
- historical migrations;
- RLS complete matrix;
- security scanning;
- quota-pressure behavior.

### Exit criteria
A validated portable backup can restore a golden project and all P0 release gates pass.

---

## Lot 12 — Existing-data migration and V1 cutover

### Goal
Move real wedding operations into Mariage OS safely.

### Deliverables
- venue research migration package;
- guest spreadsheet migration package;
- initial vendor migration package;
- reconciliation reports;
- corrections without provenance loss;
- partner acceptance on real devices;
- pre-cutover archival export;
- production recovery export;
- formal source-of-truth declaration.

### Required verification
- manual reconciliation of critical real data;
- guest totals and priority cumulative figures;
- venue status/rejection reasons;
- source URLs/confidence where imported;
- vendor contact/quote state;
- production backup restore drill using safe procedure;
- real-device mobile/desktop walkthrough.

### Exit criteria
Both partners explicitly accept Mariage OS as source of truth and the V1 cutover evidence package defined in `V1-SCOPE.md` is complete.

---

## Cross-lot rule

No later lot is allowed to weaken security, data integrity, offline guarantees, import semantics or test coverage established by earlier lots. Any architectural change requires an ADR and migration/security/test impact review.
