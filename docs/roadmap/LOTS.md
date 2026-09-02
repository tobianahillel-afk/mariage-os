# Development Lots

This roadmap organizes delivery by dependency and risk. Each lot must satisfy the Definition of Done before the next dependent lot is considered complete.

## Documentation Runs

The current design/documentation phase is executed in four review runs of roughly 20–25 areas each.

### Run 1 — Foundation

- product definition;
- principles and non-goals;
- architecture overview;
- chosen stack;
- trust boundaries;
- data ownership;
- local-first interaction;
- synchronization model;
- offline model;
- navigation and interaction states;
- Definition of Done;
- initial delivery structure.

### Run 2 — Data and domain specification

Planned:

- ERD;
- data dictionary;
- money/date/time rules;
- state machines;
- domain invariants;
- venue/vender/guest/task/decision/budget models;
- facts/provenance model;
- freshness/confidence model;
- derived-data dependency graph;
- deletion/retention semantics.

### Run 3 — Security, quality and operations

Planned:

- threat model;
- ASVS matrix;
- auth/MFA/session policy;
- RLS authorization matrix;
- storage/file security;
- frontend security/CSP;
- test strategy;
- coverage/mutation policy;
- E2E/accessibility/performance testing;
- CI/CD quality gates;
- backups/disaster recovery;
- free-tier/quota operations;
- incident/release process.

### Run 4 — Feature contracts and implementation readiness

Planned:

- feature specifications for dashboard, venues, map, vendors, guests, budget, tasks, decisions, planning, documents;
- import/export contracts;
- wireframe/state specifications;
- initial migration plan from existing wedding data;
- acceptance criteria and requirement traceability;
- ADR set;
- developer bootstrap/contributing docs;
- finalized implementation backlog.

## Implementation Lots

The implementation roadmap is separate from the four documentation runs.

### Lot 0 — Repository and tooling

- TypeScript/Vite project;
- lint/format/typecheck;
- testing harness;
- local Supabase bootstrap;
- CI skeleton;
- synthetic seed project.

### Lot 1 — Identity, project and secure foundation

- authentication;
- project membership;
- RLS baseline;
- application shell/navigation;
- local store;
- sync primitives;
- diagnostics skeleton.

### Lot 2 — Venues core

- venue CRUD;
- status/history;
- facts/sources;
- spaces;
- photos/remote references;
- gallery/table/detail;
- basic compare;
- quick add.

This lot is intentionally early because existing venue research provides realistic product validation.

### Lot 3 — Tasks and decisions

- owners;
- waiting/blocked states;
- joint decisions;
- next-action primitives;
- links to venues/vendors/etc.

### Lot 4 — Import/export foundation

- canonical JSON;
- CSV/XLSX basic import;
- preview/mapping;
- duplicate detection;
- provenance;
- rollback;
- export.

### Lot 5 — Budget and payments

- fixed/variable pricing;
- estimates/quotes/contracts;
- payments and due dates;
- scenario calculations;
- cash-flow summary.

### Lot 6 — Guests and households

- Excel migration support;
- priorities/probabilities;
- RSVP;
- cumulative statistics;
- household model.

### Lot 7 — Vendors

- generic vendor model;
- caterer-specific facts;
- quotes/contacts/documents;
- follow-up workflow.

### Lot 8 — Dashboard and planning

- next best action;
- blockers;
- waiting items;
- weighted progress;
- milestones;
- phase-aware dashboard.

### Lot 9 — Map and access

- venue coordinates;
- map pins/status filters;
- routing links;
- graceful offline/map failure.

### Lot 10 — Offline/PWA hardening

- offline pinning;
- queue/reconnect conflict UX;
- service-worker lifecycle;
- real-device testing.

### Lot 11 — Backup, recovery and production readiness

- `.mariage` backup;
- restore/integrity verification;
- migrations from old fixtures;
- security hardening;
- full release gates;
- beta with synthetic data.

### Lot 12 — Existing-data migration and V1 cutover

- import existing venue research;
- import existing guest spreadsheet;
- import initial vendor research;
- reconcile inconsistencies;
- export pre-cutover backup;
- declare Mariage OS source of truth only after verification.

## Post-V1 candidates

- visual seating plan;
- advanced transport/hotel allocation;
- day-of mode;
- controlled sharing;
- optional push notifications;
- optional assisted document extraction.

Nothing enters an implementation lot without specification, acceptance criteria and test/security implications.
