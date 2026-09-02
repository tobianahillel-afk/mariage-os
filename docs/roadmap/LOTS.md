# Development Lots

This roadmap organizes delivery by dependency and risk. Detailed lot exit criteria live in [`LOT-ACCEPTANCE.md`](LOT-ACCEPTANCE.md). Binding V1 scope lives in [`V1-SCOPE.md`](V1-SCOPE.md).

A later lot must not weaken security, integrity, import, offline or recovery guarantees established by an earlier lot.

---

## Documentation/design phase — COMPLETE after Run 4 merge

The design phase was intentionally executed in four review runs.

### Run 1 — Foundation ✅

Delivered:

- product definition;
- principles and non-goals;
- architecture overview/stack;
- trust boundaries/data ownership;
- local-first/sync/offline model;
- navigation/interaction states;
- Definition of Done;
- initial implementation sequence.

### Run 2 — Domain/data model ✅

Delivered:

- conceptual ERD;
- data-dictionary conventions;
- identifiers;
- money/date/time semantics;
- state machines;
- 50 domain invariants;
- venue/vendor/guest/task/decision/budget/document models;
- facts/provenance/confidence/freshness;
- derived data;
- deletion/retention.

### Run 3 — Security/quality/operations ✅

Delivered:

- security architecture/threat model;
- Auth/MFA/session policy;
- RLS authorization contract;
- file/frontend/privacy/supply-chain security;
- OWASP ASVS matrix framework;
- unit/property/integration/RLS/security/E2E testing strategy;
- 100% in-scope coverage policy;
- mutation testing;
- CI/CD quality gates;
- backups/disaster recovery;
- free-tier operations;
- incident/release process.

### Run 4 — Feature contracts/implementation readiness ✅ pending merge

Delivered in the Run 4 branch:

- master product specification/cahier des charges;
- requirements catalog;
- dashboard/venues/map/vendors/guests/budget/tasks/decisions/planning/documents feature contracts;
- import/export contracts;
- user flows/wireframes/design system/forms;
- PWA/storage/dependency architecture;
- coding/error/migration/diagnostic contracts;
- accessibility/performance/browser support;
- existing-data migration/cutover;
- ADRs;
- V1 boundary;
- per-lot acceptance contracts;
- implementation-readiness/deferred-decision registers.

After Run 4 is merged, specification work changes from a design phase into normal versioned product documentation maintained alongside code.

---

# Implementation roadmap

## Lot 0 — Repository and tooling

Build the reproducible engineering environment:

- Vite + TypeScript;
- strict typecheck/lint/format;
- Vitest/coverage/property testing;
- mutation-test harness;
- Playwright;
- local Supabase;
- synthetic/golden seed project;
- CI skeleton;
- preview deployment;
- environment/secret safeguards.

**No production feature data yet.**

## Lot 1 — Identity, project and secure foundation

- authentication;
- project membership/invitation;
- RLS baseline;
- app shell/navigation;
- repository/service/domain architecture;
- local IndexedDB abstraction;
- sync primitives/status;
- diagnostics shell.

No later domain should bypass these primitives.

## Lot 2 — Venues core

- venue CRUD/quick add;
- status/history/rejection;
- partner ratings/favorites;
- spaces/capacity;
- facts/observations/sources;
- images/documents basics;
- gallery/table/detail;
- missing-info summary;
- comparison;
- deep links.

Venue comes early because current research provides strong validation data.

## Lot 3 — Tasks and decisions

- task ownership/status/dependencies;
- waiting/blocked states;
- joint decisions;
- both-partner approvals;
- rationale/alternatives;
- discuss-together queue;
- next-action primitives.

## Lot 4 — Import/export foundation

- canonical JSON schema v1;
- CSV/XLSX parsing/export;
- clipboard/pasted JSON where specified;
- mapping/validation;
- duplicate detection;
- merge planning;
- preview;
- provenance/history;
- rollback;
- research-missing-data export;
- round-trip tests.

## Lot 5 — Budget and payments

- budget model;
- fixed/variable calculations;
- quotes/contracts;
- payment schedule;
- deposits/refunds;
- scenarios;
- cash-flow summary.

## Lot 6 — Guests and households

- household/person model;
- priority/probability;
- RSVP;
- expected/cumulative statistics;
- bulk operations;
- legacy spreadsheet migration/export.

## Lot 7 — Vendors

- generic vendor model/types;
- contacts/interactions;
- quote lifecycle;
- packages/inclusions;
- caterer details;
- venue compatibility;
- files/follow-up workflow.

## Lot 8 — Dashboard and planning

- milestones/phases;
- weighted progress;
- blockers;
- waiting items;
- next action;
- joint-decision summary;
- upcoming deadlines/payments;
- partner activity;
- phase-aware dashboard.

## Lot 9 — Map and access

- coordinates;
- map pins/filters;
- route links;
- TGV/accessibility facts;
- graceful map failure/offline behavior.

## Lot 10 — Offline/PWA hardening

- service-worker lifecycle;
- IndexedDB migrations;
- durable queue/reconnect;
- conflict UX;
- media queue separation;
- offline pinning;
- PWA installation/update;
- real-device tests.

## Lot 11 — Backup, recovery and production readiness

- `.mariage` backup;
- full media archive option;
- integrity verification;
- restore;
- historical migration fixtures;
- production headers/security hardening;
- quota protection;
- release candidate gates.

## Lot 12 — Existing-data migration and V1 cutover

- migrate/reconcile current venue research;
- migrate/reconcile guest spreadsheet;
- migrate initial vendor research;
- validate critical statistics/financials;
- real-device acceptance;
- archive legacy source files;
- verify recovery export;
- formally declare Mariage OS source of truth.

---

## Post-V1 backlog

Post-V1 by default:

- visual seating-plan canvas;
- advanced transport/hotel allocation;
- dedicated wedding-day operations mode;
- controlled guest/vendor sharing;
- push notifications;
- AI/OCR-assisted document extraction;
- native mobile application;
- banking/payment integration;
- internal messaging.

Nothing enters V1 because it is attractive or easy. Scope changes require explicit spec/ADR review, dependencies, security/testing impact and revised cutover criteria.

---

## Rule for implementation

Before starting a lot, read its section in [`LOT-ACCEPTANCE.md`](LOT-ACCEPTANCE.md). Before considering it complete, demonstrate every exit criterion and all inherited Quality Gates.
