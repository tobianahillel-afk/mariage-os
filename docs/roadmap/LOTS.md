# Development Lots

Status: **Frozen V1 implementation sequence — includes Invitations / RSVP / Communications scope and AI Work-Packet orchestration**

Detailed exit criteria live in `LOT-ACCEPTANCE.md`. Binding scope lives in `V1-SCOPE.md` plus the guest-communications scope addendum. Feature-level progress is the union of `../FEATURE-LEDGER.md` and `../FEATURE-LEDGER-GUEST-COMMUNICATIONS-EXTENSION.md`. Cross-lot reviews live in `INTEGRATION-CHECKPOINTS.md`. AI execution inside a Lot is governed by `../engineering/AI-LOT-ORCHESTRATION.md`.

A later lot cannot weaken security, integrity, UX/QIF, code architecture, maintainability, import, offline, recovery or communication-provider boundaries established earlier.

## Documentation/design phase

Runs 1–4 and the guest-communications V1 scope change are merged and re-frozen. The pre-Lot 0 design gate is PASS.

**Lot 0 is READY / NOT_STARTED until explicit kickoff. This orchestration/documentation change does not start implementation.**

A user may simply request `Do Lot N`. The executing AI must internally decompose that Lot into bounded Work Packets, run the mandatory three-pass packet protocol, perform Lot reconciliation and a separate Lot Integration Pass before Lot acceptance.

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

Lot 0 acceptance must prove a deliberately violating fixture/example is caught by the relevant architecture/complexity check where practical.

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
- safe logout/cache policy;
- project Settings hooks for Invitations & RSVP intent;
- guest-capability/public-shell architectural boundary (no outbound provider implementation yet).

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

Review all Lots 0–3 together for product fidelity, UX architecture, code architecture/complexity, data/security boundaries, offline behavior, cross-feature coherence, Feature Ledger completeness and Work-Packet/Lot reconciliation evidence.

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

Guest contact import is supported, but import MUST NOT activate/send invitations automatically.

## Lot 5 — Budget, scenarios and payments

- budget categories/items;
- exact pricing engine;
- estimate/quote/approved/contracted semantics;
- named scenarios with date/venue/guest/package assumptions;
- tax treatment;
- payment/deposit/refund/credit/final-balance semantics;
- cash-flow views;
- financial links and exports.

## Lot 6 — Guests, households, invitations/RSVP, communications and structured seating

### Guest planning core

- household/person/category model;
- priority/probability/RSVP;
- relationships/logistics;
- expected/cumulative statistics;
- bulk actions and legacy spreadsheet migration.

### Guest invitations / RSVP

- normalized guest/household contact points;
- secure invitation-link create/activate/rotate/revoke/expire;
- no-account mobile RSVP portal;
- person-by-person attendance;
- controlled +1/children creation;
- configurable RSVP questions/deadline/edit policy;
- RSVP submission history/idempotency;
- link copy/share/QR fallback;
- Household Communication & RSVP detail;
- Invitations & RSVP workspace.

### Outbound communications

- provider-neutral campaign/template/audience/preflight engine;
- safe allowlisted personalization;
- email/SMS/WhatsApp provider ports and test/sandbox adapters;
- communication status normalization;
- webhook adapter contract/test harness;
- reminders/information campaigns;
- scheduled/manual send model;
- selective retry/suppression;
- QIF usability review for couple and guest flows.

Production sender/domain/provider credentials and real-channel cutover evidence remain Lot 11 responsibilities.

### Seating

- seating sections/tables/capacity/assignments;
- seating validation/export;
- RSVP changes invalidate/recalculate seating readiness correctly.

Graphical drag/drop seating remains post-V1.

Lot 6 is specifically classified as a **high-risk large Lot** for AI execution and must be decomposed conservatively under `AI-LOT-ORCHESTRATION.md`; it must never be treated as one implementation context.

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

This checkpoint verifies especially that Import, Budget, Guests, Invitations/RSVP, Communications, Seating and Vendors form one usable workflow rather than separate tables/modules.

Additional mandatory Checkpoint B evidence:

- FTR-105..119 reconciled;
- Work Packet/Lot reconciliation evidence complete for elapsed Lots;
- QIF couple-side campaign review PASS;
- QIF mobile guest RSVP review PASS;
- token/cross-household/idempotency security tests PASS;
- campaign preview/frozen-audience/duplicate-send tests PASS;
- manual link/QR fallback works without paid providers;
- no provider-specific SDK leaks into domain/application layers.

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
- phase-aware dashboard;
- invitation/RSVP actionable summaries without turning Dashboard into a communications console.

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

Guest-facing public RSVP is network-dependent for authoritative submission in V1 unless a later explicit design adds guest-offline submission. Couple-side communication drafts/previews may be locally durable but provider sends require server connectivity.

Lot 10 is a high-risk systems Lot and must be decomposed into reviewable migration/sync/PWA/security Work Packets rather than one broad implementation pass.

### Mandatory Checkpoint C after Lot 10

Before production-readiness Lot 11 proceeds normally, perform **Checkpoint C — Product Control, Spatial UX & Offline Hardening** across the complete implemented product.

Checkpoint C must prove Mariage OS now behaves as one coherent wedding OS: Dashboard/Search/Inbox/Planning/Timeline/Map/offline navigation must simplify rather than fragment the product, while code/module boundaries remain navigable and maintainable.

Repeat/update the systematic scorecard with implemented evidence.

Checkpoint C must PASS with no unresolved BLOCKING/MAJOR finding.

---

## Lot 11 — Backup, recovery, communication-provider hardening and production readiness

- structured/full `.mariage` export;
- encrypted backup format implementation;
- checksums/integrity verification;
- restore/migrations;
- production headers/security hardening;
- complete RLS/security evidence;
- quota protection;
- incident diagnostics;
- release candidate gates;
- real email provider/domain configuration with SPF/DKIM/DMARC readiness evidence if email enabled;
- real SMS provider configuration/callback evidence if SMS enabled;
- real WhatsApp Business-compatible provider/template/webhook evidence if WhatsApp enabled;
- webhook signature/replay/dedup evidence;
- production communication cost/send caps;
- communication-provider health diagnostics;
- suppression/bounce/failure handling;
- FTR-113..117 and FTR-120 production evidence for enabled channels.

A channel not configured for production is shown as unavailable; its absence must not break secure link/QR RSVP.

Lot 11 is a high-risk production/security Lot and must be split aggressively. Backup/recovery, platform security, provider-specific production hardening and release readiness must not be compressed into one AI pass.

## Lot 12 — Existing-data migration and V1 cutover

- venue research migration/reconciliation;
- guest spreadsheet/contact migration/reconciliation;
- vendor initial-data migration/reconciliation;
- budget/statistical validation;
- invitation/contact data quality review;
- real-device partner acceptance;
- guest RSVP acceptance on representative mobile devices;
- legacy archival exports;
- recovery export/restore drill;
- formal source-of-truth declaration.

Lot 12 uses bounded migration/reconciliation/cutover Work Packets and preserves a separate final cutover decision; no AI may infer source-of-truth acceptance merely because migration code ran.

### Mandatory Checkpoint D after Lot 12

Perform **Checkpoint D — Recovery, Real Data & V1 Cutover**.

This is the final cutover gate. The final scorecard/review uses actual implementation, devices and recovery evidence rather than documentation-only scores.

If automatic outbound channels are enabled, Checkpoint D includes a controlled real-channel send/callback test with synthetic/test recipients before any real guest campaign.

No declaration that Mariage OS is the operational source of truth occurs before Checkpoint D PASS.

---

## Per-lot progress rule

Every lot uses `engineering/IMPLEMENTATION-PLAYBOOK.md` and `engineering/AI-LOT-ORCHESTRATION.md`:

- compute the complete current-lot Feature/control responsibility inventory;
- build a dependency-aware Work Packet plan before implementation;
- prove every required responsibility is packet-assigned;
- default to one packet `IN_PROGRESS` at a time;
- execute every packet through Pass A IMPLEMENT → Pass B ADVERSARIAL REVIEW → Pass C ACCEPTANCE;
- maintain Work Packet Records and Feature Implementation Records;
- implement feature by feature/vertical slice inside packets;
- follow canonical code structure/complexity rules;
- update both V1 Feature Ledger files as applicable;
- persist current Lot/packet/pass/next action in `IMPLEMENTATION-STATUS.md`;
- perform UX/QIF review for affected user-facing features;
- perform mechanical Lot reconciliation after all packets;
- perform a separate Lot Integration Pass;
- no unexplained elapsed `SPECIFIED`/`READY`/`IN_PROGRESS`/`IMPLEMENTED`/`BLOCKED` responsibility at lot acceptance;
- no unexplained maintainability/architecture exception accumulation.

Lot completion is not measured by file count, LOC, context consumed or percentage of UI mocked. It is measured by accepted packet responsibilities, Feature IDs, integration evidence and objective lot criteria.

---

## Explicit post-V1 examples

- graphical/automatic seating optimization;
- advanced transport/hotel allocation;
- live wedding-day command-center mode;
- vendor temporary sharing portal;
- arbitrary self-registration of uninvited guests;
- push notifications;
- AI/OCR document extraction;
- automatic Internet venue research inside app;
- internal messaging/social chat;
- native mobile app;
- banking/payment integration;
- automatic Gmail/calendar-provider inbox sync.

**Secure invited-household RSVP portal and email/SMS/WhatsApp invitation/reminder communications are V1, not post-V1.**

## Scope-change rule

Nothing moves into/out of V1 silently. Scope changes require product/spec/requirement update, Feature Ledger impact, dependency/security/data/UX/code-architecture/test review and updated lot/cutover criteria.