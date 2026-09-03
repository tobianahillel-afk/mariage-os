# Implementation Lot Acceptance Contracts

Status: **Binding V1 sequencing and exit criteria — current execution permission is controlled by IMPLEMENTATION-STATUS + FINAL-DESIGN-REVIEW**

A lot is complete only when deliverables, tests, security controls, migrations and documentation are complete. “UI appears to work” is never sufficient.

All lots inherit the Definition of Done, Quality Gates, frozen requirements, `engineering/AI-LOT-ORCHESTRATION.md`, and all prior-lot invariants.

This document does **not** grant permission to start a Lot. Before any implementation lot begins, `FINAL-DESIGN-REVIEW.md` must declare the implementation gate **OPEN**, the current lot must be permitted by `IMPLEMENTATION-STATUS.md`, and the user must explicitly kick off that lot. A historical/open gate statement elsewhere never overrides the current status board.

The authoritative V1 Feature inventory is the union of `../FEATURE-LEDGER.md` (FTR-001..104) and `../FEATURE-LEDGER-GUEST-COMMUNICATIONS-EXTENSION.md` (FTR-105..120).

Every Lot requested from an AI is internally executed through Work Packets and the mandatory three-pass protocol in `engineering/AI-LOT-ORCHESTRATION.md`. A Lot cannot close until its Work Packets are accepted, its feature/control reconciliation is empty, and its separate Lot Integration Pass is green.

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
- Invitations & RSVP onboarding/settings foundation hooks.
- public guest-capability route/shell boundary without implementing outbound providers early.

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
- synthetic two-owner E2E;
- `/app/p/:projectId/**` and public `/rsvp/:token` trust boundaries cannot be confused;
- no provider SDK/secret is introduced into UI/domain as a shortcut.

### Exit
No feature lot may persist meaningful project data until project isolation is demonstrated directly at DB/Storage boundaries. Lot 1 additions from `LOT-ACCEPTANCE-GUEST-COMMUNICATIONS-ADDENDUM.md` are binding.

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
- round-trip fixtures;
- guest contact import safeguards where applicable.

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
- lossless round-trip where claimed;
- imported contact data never triggers invitation dispatch automatically.

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

## Lot 6 — Guests, households, invitations/RSVP, communications and structured seating

This section must be read together with `LOT-ACCEPTANCE-GUEST-COMMUNICATIONS-ADDENDUM.md`; the addendum is part of Lot 6 acceptance, not optional follow-up work.

### Guest planning core deliverables
- categories/households/guests;
- priority/probability/RSVP core;
- relationships and limited logistics;
- expected/cumulative statistics;
- bulk actions/import/export.

### Invitations / RSVP / communications deliverables
- household contact points;
- secure invitation-link lifecycle;
- no-account mobile RSVP portal;
- person-by-person attendance and controlled +1/children;
- configurable RSVP questions/deadline/edit policy;
- RSVP history/idempotency/invalidation;
- link copy/share/QR fallback;
- Invitations & RSVP workspace and household communication detail;
- provider-neutral campaign/template/audience/preflight engine;
- Email/SMS/WhatsApp provider ports with deterministic fake/test adapters;
- delivery state normalization and webhook adapter contracts;
- reminders/information campaigns;
- scheduled/manual send model, selective retry and suppression;
- QIF usability review for couple and guest flows.

Production sender/domain/provider credentials and real-channel production cutover evidence remain Lot 11 responsibilities.

### Seating deliverables
- seating sections/tables/capacities/assignments;
- unassigned/over-capacity checks and seating export;
- RSVP changes invalidate seating readiness correctly.

### Required verification
Base guest/seating verification plus every applicable requirement in `LOT-ACCEPTANCE-GUEST-COMMUNICATIONS-ADDENDUM.md`, including cross-household capability denial, token expiry/revocation/rotation, server-side +1 allowance, frozen audience, idempotent sends/retries, fake-provider webhook tests, QR/manual fallback, QIF mobile/couple flows and integration with statistics/seating/budget/dashboard/import/export/backup boundaries.

### Exit
Legacy-style guest statistics reconcile exactly; a complete non-visual seating assignment can be created/exported safely; secure invited-household RSVP works without an account; manual link/QR works without a paid provider; and the non-production communication engine passes the dedicated Lot 6 addendum. No real guest campaign is required or allowed merely to prove Lot 6 acceptance.

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
- phase-aware dashboard;
- actionable invitation/RSVP summaries without turning Dashboard into a communications console.

### Verification
- milestone dependency/date recalculation;
- no fake progress from microtasks;
- next-action explainability;
- after-midnight timeline order;
- timeline dependency cycles rejected;
- frozen export immutability;
- search RLS/privacy/archive rules;
- partner “since last visit” cursor behavior;
- RSVP/communication summary signals reflect current authorized state without exposing private guest/provider internals.

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
- real-device support validation;
- communication-draft persistence boundaries without client-authoritative dispatch.

### Verification
- close/reopen offline;
- reconnect/out-of-order/duplicate retry;
- same-field conflict;
- delete/edit race;
- session expiry;
- service-worker update with pending mutations;
- old app/new schema incompatibility;
- logout/purge;
- real-device smoke;
- queued/local communication state cannot silently become provider send;
- guest RSVP authoritative submit remains network/server validated in V1.

### Exit
No supported offline/update/session scenario silently loses confirmed structured work, reveals another project cache or produces a false send/RSVP confirmation.

---

## Lot 11 — Backup, recovery, communication-provider hardening and production readiness

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
- release-candidate pipeline;
- production Email/SMS/WhatsApp provider configuration/evidence for each channel enabled;
- authenticated/replay-safe provider webhook evidence;
- send/cost caps and communication-provider health diagnostics;
- suppression/bounce/failure handling.

### Verification
- backup→restore semantic equality;
- wrong password/tamper detection before mutation;
- corrupt binary detection;
- future-schema rejection;
- historical migration;
- complete security/RLS matrix;
- quota-pressure behavior;
- ASVS applicable evidence;
- real/test provider callbacks, idempotency and replay handling where enabled;
- no provider secret in client bundle/log/repo;
- restored historical campaign state cannot auto-send;
- secure link/QR remains usable when automatic channels are unavailable.

### Exit
A golden project is recoverable from verified portable backup and all applicable P0 production-readiness gates pass. Enabled automatic channels additionally satisfy `LOT-ACCEPTANCE-GUEST-COMMUNICATIONS-ADDENDUM.md` Lot 11 requirements.

---

## Lot 12 — Existing-data migration and V1 cutover

### Deliverables
- venue research migration/reconciliation;
- guest spreadsheet/contact migration/reconciliation;
- vendor migration/reconciliation;
- critical budget/statistical validation;
- invitation/contact data-quality review;
- corrections retaining provenance;
- both-owner real-device acceptance;
- representative mobile guest RSVP acceptance;
- pre-cutover legacy archive;
- production recovery export;
- formal source-of-truth declaration.

### Verification
- critical real-data reconciliation;
- guest totals/cumulative priorities;
- venue status/rejection/source data;
- vendor quote/contact state;
- backup restore drill via safe procedure;
- supported mobile/desktop walkthrough;
- controlled synthetic/test-recipient real-channel smoke for every automatic channel enabled before any real guest campaign.

### Exit
Both owners explicitly accept Mariage OS as source of truth and the V1 cutover evidence package is complete. Checkpoint D and the guest-communications cutover additions must pass.

---

## Cross-lot rule

No later lot may weaken frozen security, data-integrity, financial, offline, import/export, recovery, QIF or communication-provider semantics. Material architectural changes require reviewed spec/requirements, ADR when applicable, migration impact and updated tests.

No Lot may be executed as one uncontrolled AI pass. The Work Packet plan, three-pass packet acceptance, Lot reconciliation, Lot Integration Pass and Lot acceptance are mandatory evidence.