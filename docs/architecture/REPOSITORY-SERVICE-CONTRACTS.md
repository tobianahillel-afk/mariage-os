# Repository and Service Contracts

Status: **Normative application-layer architecture reference**

Mariage OS must keep domain behavior independent from direct UI/Supabase calls so offline behavior, synchronization, testing and future backend portability remain centralized.

## Layer contract

```text
View / component
      ↓
Application service / domain engine
      ↓
Repository interface
      ↓
Local store + sync coordinator
      ↓
Supabase adapter / storage adapter
```

A view may call a service or a query/read-model helper, but must not scatter raw table queries/mutations across UI code.

---

## 1. Common repository semantics

Repositories operate on typed domain DTO/entity forms and expose explicit outcomes/errors.

Common concepts:

- `getById(projectId,id)`
- `list(query/filter)`
- `create(input,operationContext)`
- `update(id,patch,expectedRevision,operationContext)`
- `softDelete(id,expectedRevision)`
- `restore(id,expectedRevision)` where allowed
- local read vs required-fresh read when behavior differs

Exact method names may evolve in Lot 0/1, but semantics must remain centralized.

Every mutation context can carry:

- operation ID;
- project ID;
- actor/user;
- device ID;
- expected/base revision;
- offline eligibility.

## 2. Query vs mutation

Reads may come from local cache immediately and synchronize/revalidate in the background.

Mutations follow local durability + queue/sync rules. The service layer must distinguish:

- locally accepted/pending;
- remotely confirmed;
- validation failure;
- authorization failure;
- conflict;
- retryable remote failure.

UI should never infer these solely from HTTP status.

---

## 3. Domain services

Recommended service boundaries:

### `ProjectService`

- project settings;
- membership-safe project operations;
- owner invitation handoff to Auth/project adapter;
- project lifecycle actions.

### `VenueService`

- venue lifecycle/status;
- spaces;
- favorites/ratings through user/member-specific storage;
- venue summaries;
- comparison input assembly;
- missing-info request generation;
- links to facts/media/docs/offers.

### `FactService`

- fact definitions;
- observations;
- retained-value resolution;
- conflict/freshness state;
- source linkage;
- revalidation flags.

### `VendorService`

- vendor lifecycle;
- contacts/interactions;
- vendor offers/packages;
- venue compatibility.

### `GuestService`

- household/guest CRUD;
- relationship integrity;
- priority/probability/RSVP;
- attendance statistics via pure calculation engine.

### `TaskService`

- task state machine;
- dependencies;
- waiting/follow-up;
- links;
- priority inputs.

### `DecisionService`

- options;
- approvals;
- both-owner rules;
- finalize/reopen/lock;
- rationale/history.

### `BudgetService`

- budget items;
- exact amount calculations;
- quote/contract transitions;
- scenario assembly;
- payments/cash-flow.

### `MediaService` / `DocumentService`

- metadata;
- upload lifecycle;
- remote references;
- source/link associations;
- deletion/retention;
- safe access URLs.

### `ImportService`

Split responsibilities internally:

- detector/parser;
- mapping;
- validation;
- duplicate matching;
- merge planning;
- preview;
- commit transaction;
- rollback/provenance.

Parsing must not mutate canonical repositories.

### `BackupService`

- export graph;
- archive/manifest;
- checksums;
- encryption option;
- validation;
- restore plan/commit.

### `SyncService`

- pending queue;
- send/retry;
- server receipt/idempotence;
- remote refresh;
- conflict creation;
- resolution/rebase;
- status summary.

---

## 4. Pure engines

The following should be implemented as pure/deterministic functions or modules as far as practical:

- guest probability/cumulative stats;
- budget calculation/scenarios;
- compatibility/criterion evaluation;
- freshness calculation;
- retained-value evidence ranking where deterministic;
- next-action ranking;
- weighted progress;
- import mapping normalization;
- merge-plan calculation;
- date/offer applicability.

Pure engines are mutation-tested where critical.

---

## 5. Supabase adapters

Provider adapter responsibilities:

- translate typed repository query/mutation into Supabase calls;
- preserve operation/revision semantics;
- translate backend errors into typed application errors;
- never leak service-role secrets to browser;
- keep provider-specific details out of domain calculations.

Direct Supabase SDK imports in arbitrary views/domain engines are prohibited by lint/code-review convention where enforceable.

---

## 6. Local repositories/store

Local store responsibilities:

- cached entity read;
- durable local accepted edits;
- optimistic view state grounded in persisted local mutation;
- pending queue;
- drafts;
- conflict persistence;
- offline pin/cache metadata.

The local data layer must not invent authorization. Remote/server authorization remains authoritative; cached records are only those previously authorized to that session/device.

---

## 7. Read models

For complex screens such as Dashboard or Venue Summary, build typed read-model/query assemblers rather than embedding ten unrelated queries in the component.

Examples:

- `DashboardReadModel`
- `VenueSummaryReadModel`
- `VenueComparisonReadModel`
- `GuestStatsReadModel`
- `CashFlowReadModel`

Read models contain derived presentation-ready data, not new authoritative truth.

---

## 8. Transaction boundaries

Operations that must be atomic/consistent should use database transactions/RPC or designed local transaction + server commit strategy.

Examples:

- finalize joint decision + final option consistency;
- remove final owner prohibition;
- import structured batch commit;
- rollback import changes;
- payment/status invariant updates when multiple rows must change together.

Do not simulate atomicity by sequential unrelated client calls when partial success would violate invariants.

---

## 9. Test doubles

Repository interfaces should support deterministic in-memory/fake adapters for unit/component tests without weakening integration tests against local Supabase.

Unit tests do not replace RLS/database integration tests.

---

## 10. Portability rule

The domain/service API must not expose Supabase-specific response types as business types.

A future provider migration should require replacing/adapting repository/storage/auth infrastructure rather than rewriting venue/budget/guest business logic.
