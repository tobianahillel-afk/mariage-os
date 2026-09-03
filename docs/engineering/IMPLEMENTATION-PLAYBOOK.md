# Mariage OS — Implementation Playbook

Status: **Normative implementation governance contract**

Purpose: prevent the implementation phase from drifting away from the frozen V1 product, losing track of partially implemented behavior, or declaring features complete because one screen happens to work.

This playbook is mandatory once the implementation gate opens. It complements `REQUIREMENTS-CATALOG.md`, `roadmap/LOT-ACCEPTANCE.md`, the UX contracts and the Definition of Done.

---

## 1. Fundamental rule

Implementation is performed **feature by feature inside a lot**, not as an uncontrolled sequence of files/components.

Every implemented behavior must have a traceable chain:

```text
Product need
→ Feature ID
→ Requirement IDs
→ User flow / route
→ UX contract
→ Domain rule / invariant
→ Service / repository boundary
→ Cloud persistence / RLS
→ Local/offline behavior
→ Import/export impact
→ Tests / evidence
→ Documentation
→ Review / completion status
```

If one required link is unknown, the feature is not implementation-ready and the missing decision must be resolved in documentation before the implementation is considered complete.

---

## 2. Feature Implementation Record (FIR)

Every V1 feature from `FEATURE-LEDGER.md` receives one living implementation record, maintained in the implementing PR/issue or a repository tracking artifact.

Required fields:

| Field | Required content |
|---|---|
| Feature ID | stable `FTR-xxx` |
| Name | user-facing capability |
| Lot | implementation lot |
| Requirement IDs | all directly applicable PRD/IAM/etc. IDs |
| Acceptance IDs | applicable `ACC-xxx` scenarios |
| User flow | applicable `UF-xx` |
| Routes/screens | every route/dialog/sheet involved |
| Primary user job | one sentence: what the user is trying to achieve |
| Domain entities | authoritative entities/rows affected |
| Services | application/domain services used |
| Repositories/adapters | persistence boundaries used |
| Cloud schema | tables/views/RPCs/storage objects |
| Local schema | IndexedDB stores/cache/queue/drafts |
| Offline class | read / queueable edit / server-required / degraded |
| Authorization | roles + RLS/RPC policy |
| Invariants | relevant invariant numbers |
| Sync/conflict | merge class + conflict behavior |
| Import/export | supported/no impact + formats |
| Files/media | storage/privacy behavior if applicable |
| Derived data | recalculations/invalidation |
| UX states | loading/empty/offline/error/conflict/etc. |
| Accessibility | keyboard/focus/screen-reader constraints |
| Responsive behavior | mobile/tablet/desktop treatment |
| Security/privacy | threats/data-class handling |
| Tests | unit/property/integration/RLS/E2E/etc. |
| Performance | relevant budget/large-data behavior |
| Docs changed | exact docs touched |
| Known deferred choices | only items already allowed by Deferred Decisions |
| Status | lifecycle defined below |
| Evidence | PR/commit/test/report links |

A feature cannot be marked complete while required FIR fields contain `TBD` unless the corresponding choice is explicitly deferred and does not affect V1 semantics.

---

## 3. Feature lifecycle

Use exactly these implementation states:

### `SPECIFIED`
The feature exists in the frozen product/feature/UX/domain documentation and is assigned to a lot.

### `READY`
Its FIR is complete enough to implement, dependencies are satisfied, and no open BLOCKING/MAJOR design finding affects it.

### `IN_PROGRESS`
Implementation is actively changing code/schema/tests.

### `IMPLEMENTED`
Happy-path behavior and persistence exist, but full verification may still be incomplete. This state must never be presented as “done”.

### `VERIFIED`
All applicable automated/manual tests, security/RLS checks, responsive/accessibility states and acceptance criteria pass in isolation.

### `INTEGRATED`
The feature works together with already-completed features, cross-feature derived data/sync/navigation has been exercised, and the current integration checkpoint does not identify a regression.

### `ACCEPTED`
The feature satisfies the lot exit criteria and UX/product review. For real-data cutover features, this may still precede production cutover.

### `BLOCKED`
A dependency, defect or missing product decision prevents safe progress. The blocking reason is recorded; work is not hidden in `IN_PROGRESS` indefinitely.

No custom synonyms such as “almost done”, “basically finished” or “works locally” replace these states.

---

## 4. Definition of Ready for one feature

Before meaningful implementation starts:

- Feature ID exists.
- Requirements and acceptance scenarios are linked.
- User job and entry points are clear.
- Target screens/page pattern are defined.
- Data ownership is known.
- Cloud/local persistence is known where applicable.
- Offline behavior is classified.
- Authorization/security constraints are known.
- Domain invariants and state transitions are known.
- Dependencies on prior features/lots are available.
- Test approach is known.
- Any unresolved semantic decision is documented rather than guessed.

If these are not true, update the documentation first.

---

## 5. Definition of Verified for one feature

A feature reaches `VERIFIED` only when all applicable layers pass:

1. domain/unit behavior;
2. boundary/input validation;
3. property tests for rule-heavy calculation where applicable;
4. local persistence/migration behavior;
5. cloud/database constraints;
6. RLS allow and deny tests;
7. synchronization/idempotence/conflict behavior;
8. import/export/round-trip where applicable;
9. E2E user flow;
10. loading/empty/error/offline/permission/conflict states;
11. mobile + desktop responsive behavior;
12. keyboard/focus/accessibility checks;
13. security/adversarial cases;
14. performance behavior at the defined reference dataset where relevant;
15. documentation/traceability update.

Passing unit coverage alone never moves a feature to `VERIFIED`.

---

## 6. One primary job per screen

Implementation must follow the UX architecture:

- a screen has one dominant user job;
- a detail screen summarizes first and progressively reveals detail;
- a dense table is a specialized analysis/bulk-work mode, never the default representation of the entire application;
- creation is minimal first, enrichment later;
- actions that change context significantly navigate to a dedicated workflow/page;
- small reversible edits may use inline controls/drawers;
- high-risk or multi-step operations use explicit workflows;
- mobile is not a squeezed desktop table.

A PR that satisfies data requirements by putting every field onto one page fails UX review even if technically functional.

---

## 7. Vertical-slice rule

Prefer a thin, complete feature slice over implementing all UI first, then all DB later.

A coherent slice normally includes:

```text
route / UI state
→ application service
→ domain validation
→ repository/local persistence
→ Supabase/RLS if shared
→ sync state
→ tests
```

Temporary stubs are allowed only when explicitly tracked and cannot masquerade as a completed feature.

---

## 8. Cross-feature dependency review

Before marking a feature `INTEGRATED`, review whether it changes:

- dashboard/read models;
- global search;
- tags/links;
- activity history;
- missing-information engine;
- budget scenarios;
- guest counts/capacity;
- seating readiness;
- timeline warnings;
- milestone/progress/next action;
- import/export/backup graph;
- offline pin/cache requirements;
- permissions/RLS matrix;
- diagnostics.

Use `architecture/DEPENDENCY-GRAPH.md`; absence of an obvious visual change does not imply “no integration impact”.

---

## 9. Anti-drift review in every PR

Every implementation PR explicitly answers:

- Which Feature IDs does this implement/change?
- Which frozen requirement is satisfied?
- Did behavior differ from the spec? If yes, where is the approved spec/ADR change?
- Did a new table/field/status appear? Why is it not an invented semantic?
- Did a new route/component pattern appear? Why does an existing pattern not apply?
- Did offline behavior change?
- Did authorization/RLS change?
- Did import/export/backup shape change?
- Did any user-facing workflow become longer or denser?
- Could this change create duplicate truth?
- What proves the feature works on mobile as well as desktop where applicable?

A PR with an unapproved product divergence cannot be merged merely because tests pass.

---

## 10. Lot execution sequence

Within each implementation lot:

1. **Lot kickoff** — review dependencies, applicable Feature IDs, risks and acceptance contract.
2. **Order features** — infrastructure/dependency-heavy behavior before surface polish.
3. **Implement vertical slices** — maintain FIR for each.
4. **Continuous integration** — do not wait until end of lot to combine features.
5. **Lot internal audit** — feature ledger has no unexplained `IN_PROGRESS`/TBD.
6. **Lot acceptance** — satisfy `LOT-ACCEPTANCE.md`.
7. **Checkpoint review if this lot closes a checkpoint group** — see `roadmap/INTEGRATION-CHECKPOINTS.md`.
8. Only then begin dependent work.

---

## 11. Required implementation artifacts

By the time a feature is accepted, repository evidence must make it possible to answer without chat history:

- what was implemented;
- what requirement caused it;
- what code/schema owns it;
- how it behaves offline;
- how authorization works;
- what tests prove it;
- what limitations remain;
- whether the implementation intentionally changed the product contract.

Recommended evidence locations are PR description, requirement-linked tests, feature ledger status, architecture/ADR changes and release/checkpoint reports.

---

## 12. Abandoned or deferred implementation

If work begins but is intentionally stopped:

- set feature to `BLOCKED` or leave `SPECIFIED`/`READY` as appropriate;
- remove dead half-wired production paths unless a documented feature flag/stub is needed;
- record what remains;
- do not claim lot completion while a P0/P1 Feature ID assigned to that lot is incomplete unless V1 scope is formally changed.

---

## 13. End-of-session / handoff rule

A future developer or AI agent must be able to resume from repository state alone.

Before ending a material development session/PR:

- update Feature Ledger statuses;
- record unresolved blocker/reason;
- ensure tests/evidence are committed;
- update lot progress;
- update checkpoint status if applicable;
- do not leave the only explanation in chat.

The repository, not conversation memory, is the handoff mechanism.
