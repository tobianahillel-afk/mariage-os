# Repository and Service Contracts

Status: **Normative V1 application-layer architecture reference**

Mariage OS keeps domain behavior independent from arbitrary UI/Supabase calls so offline behavior, synchronization, security testing and future backend portability remain centralized.

```text
View / routed screen
      ↓
Application service / pure domain engine / read model
      ↓
Repository interface
      ↓
Local store + sync coordinator
      ↓
Supabase/PostgreSQL/Storage/Auth adapter
```

Views may call services/read-model helpers; they must not scatter raw backend queries or mutate tables directly.

## 1. Common repository semantics

Repositories expose typed domain forms and explicit outcomes. Typical semantics include get/list/create/update/soft-delete/restore and fresh-vs-cached reads.

Mutation context carries as applicable:

- operation ID;
- project ID;
- actor/user;
- device ID;
- expected/base revision;
- offline eligibility;
- correlation/diagnostic ID.

A service must distinguish locally accepted/pending, remotely confirmed, validation failure, authorization failure, conflict and retryable failure. UI does not infer business state from HTTP codes alone.

## 2. Command vs read separation

Read models may assemble local cached state immediately and refresh in background.

Critical transitions use explicit domain commands rather than uncontrolled generic field mutation. Examples: accept invitation, finalize joint decision, resolve retained fact, record payment/refund, apply import, restore backup, permanently purge project.

## 3. Required V1 service boundaries

### `ProjectService`

- project settings/date options/reference origins;
- controlled bootstrap status;
- membership-safe project operations;
- project lifecycle/archive/purge handoff;
- member activity cursor/preferences where shared/member-scoped.

Initial project creation/partner invitation acceptance are network/auth-required operations and do not pretend to be ordinary offline-safe edits.

### `AuthMembershipService`

- sign-in/session/MFA handoff;
- controlled first-owner bootstrap;
- invitation creation/status/acceptance/revocation;
- recent-auth checks for critical operations;
- safe logout/project-switch coordination with local data layer.

It never exposes service-role credentials or raw reusable token material to unrelated storage/logs.

### `VenueService`

- venue CRUD/lifecycle/rejection;
- spaces/capacities;
- member ratings/favorites;
- offers/availability;
- summary/compare inputs;
- missing-info/criterion readiness;
- photos/documents/source links.

### `AccessService`

- project reference origins;
- venue route observations by origin/mode;
- TGV/access summaries;
- default-origin derived convenience values;
- external directions link construction with privacy constraints.

### `FactService`

- fact definitions and value-type validation;
- observations and multi-source links;
- retained-value resolution;
- conflict/freshness/revalidation;
- criterion evaluation-rule configuration.

### `CompatibilityEngine`

Pure deterministic engine producing blocking status, weighted score, completeness/evidence readiness and explanations from facts/definitions/project criteria/scenario dependencies.

### `VendorService`

- vendor lifecycle;
- contacts/interactions;
- offers/packages/components;
- caterer specialization;
- venue compatibility;
- waiting/follow-up integration.

### `GuestService`

- guest categories/households/guests;
- relationship integrity;
- priority/probability/RSVP;
- logistics;
- statistics through pure engines.

### `SeatingService`

- sections/tables;
- capacities;
- guest assignment/move/unassign;
- validation (duplicate assignment, capacity, project integrity);
- seating summary/export input.

No graphical canvas assumptions enter the service API.

### `TaskService`

- task state machine;
- dependencies/cycle checks;
- waiting/follow-up;
- entity links;
- priority/next-action inputs.

### `DecisionService`

- options/approvals;
- require-both;
- finalize/reopen/lock;
- rationale/history;
- linked evidence/entities.

### `InboxService`

- capture text/link/file-reference;
- classification/status;
- idempotent conversion to supported target command;
- preservation of original capture/provenance.

### `BudgetService`

- budget categories/items;
- exact calculations;
- named scenario CRUD/selection/assumptions;
- offer applicability;
- tax semantics;
- payments/deposits/refunds/credits/cash flow;
- links/documents.

### `PlanningService`

- phases/milestones;
- milestone dependencies/completion rules;
- relative/fixed target-date behavior;
- weighted progress inputs;
- blockers and phase context.

### `TimelineService`

- event timeline items;
- time/day-offset validation;
- dependencies/cycle checks;
- venue/space/vendor/contact links;
- chronological read model;
- frozen export snapshot generation input.

### `MediaService` / `DocumentService`

- metadata;
- upload lifecycle;
- remote refs;
- link associations;
- versions/supersession;
- deletion/retention;
- safe authorized URLs;
- derivatives/dedup.

### `ContractReadinessService`

- factual checklist template/answers/status;
- links to document/offer/vendor/venue;
- missing/unknown/conflicting checklist items;
- completion/readiness summary.

It must not claim legal validity or give legal advice.

### `TagService`

- project-scoped tag definitions;
- entity-tag links;
- safe import creation/merge semantics.

### `SearchService`

Search is a query service/read model, not a privileged bypass. It searches only authorized project data, applies archive/deletion/privacy rules, supports bounded offline cached search and never puts unnecessary PII into URLs.

### `ImportService`

Internal responsibilities:

- detect/parse;
- mapping/profile selection;
- normalize/validate;
- duplicate matching including parent-scoped external IDs;
- merge planning;
- preview;
- transactional commit;
- provenance/history;
- rollback/reconciliation.

Parsing never mutates canonical repositories.

### `BackupService`

- export graph;
- manifest/checksums;
- optional binary inclusion;
- encrypted-container generation;
- validation;
- restore plan;
- migration/transactional commit.

Wrong password/tamper/future schema fail before canonical mutation.

### `SyncService`

- pending queue;
- send/retry/idempotence receipts;
- remote refresh/realtime reconciliation;
- conflict creation/resolution/rebase;
- project/account scope transition;
- sync-state summary.

## 4. Pure deterministic engines

Implement as pure modules where practical:

- guest expected/cumulative statistics;
- budget/scenario calculations;
- payment/cash-flow derivation;
- compatibility criterion evaluation;
- fact value/type normalization;
- freshness/evidence ranking where deterministic;
- next-action ranking;
- milestone progress;
- seating validation summaries;
- timeline ordering/time offsets;
- import normalization/merge-plan calculation;
- date/offer applicability;
- backup manifest/checksum planning.

Critical engines receive mutation/property tests.

## 5. Provider adapters

Supabase/Auth/Storage adapters:

- translate repository commands/queries;
- preserve revision/operation semantics;
- translate provider failures to typed app errors;
- enforce no secret/service-role exposure in browser;
- keep provider types out of domain engines.

Direct Supabase SDK calls in arbitrary views/domain engines are prohibited by architecture/lint/review convention.

## 6. Local data responsibilities

Local store handles cached entities, durable accepted offline edits, pending queue, drafts, conflicts, offline pins and unsynced binary refs.

Local storage never invents authorization; remote authorization remains authoritative. Project/account switch clears visible context before another namespace renders.

## 7. Required read models

Complex screens use typed read-model assemblers, including at least conceptually:

- `DashboardReadModel`;
- `VenueSummaryReadModel`;
- `VenueComparisonReadModel`;
- `GuestStatsReadModel`;
- `SeatingReadModel`;
- `CashFlowReadModel`;
- `BudgetScenarioComparisonReadModel`;
- `PlanningReadModel`;
- `EventTimelineReadModel`;
- `SearchResultsReadModel`;
- `ContractReadinessReadModel`.

Read models are derived presentation state, never new authoritative truth.

## 8. Transaction boundaries

Use DB transaction/RPC or explicitly designed atomic command when partial success would violate invariants, including:

- first-owner project bootstrap;
- invitation acceptance/membership creation;
- final-owner protection/ownership changes;
- joint decision finalization;
- retained fact resolution where multiple rows change;
- seating multi-assignment/bulk move where partial state is invalid;
- import commit/rollback;
- payment/refund linked state updates;
- backup restore;
- permanent purge workflows.

Sequential unrelated client calls must not simulate atomicity for critical invariants.

## 9. Test doubles and integration reality

Repository interfaces may use deterministic in-memory adapters for unit tests, but local Supabase/IndexedDB/provider integration and direct RLS tests remain mandatory. Fake repositories cannot prove authorization, SQL constraints, Storage policy or real migration behavior.

## 10. Portability

Domain/service APIs expose business types, not Supabase response types. A future backend migration should replace provider/repository/storage/auth adapters without rewriting venue, guest, budget, criteria, seating or planning engines.
