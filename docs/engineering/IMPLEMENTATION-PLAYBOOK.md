# Mariage OS — Implementation Playbook

Status: **Normative implementation governance contract**

Purpose: prevent implementation from drifting away from the frozen V1 product, losing track of partially implemented behavior, accumulating unmaintainable generated code, or declaring features complete because one screen happens to work.

This playbook is mandatory once the implementation gate opens. It complements `REQUIREMENTS-CATALOG.md`, `roadmap/LOT-ACCEPTANCE.md`, `CODING-STANDARDS.md`, `CODEBASE-STRUCTURE.md`, `MODULE-SIZE-COMPLEXITY.md`, UX contracts and the Definition of Done.

AI/context-free contributors additionally follow root `AGENTS.md` and `LLM-TASK-ROUTING.md`.

---

## 1. Fundamental rule

Implementation is performed **feature by feature inside a lot**, not as an uncontrolled sequence of files/components.

Every implemented behavior has a traceable chain:

```text
Product need
→ Feature ID
→ Requirement / Acceptance / Security IDs
→ User flow / route
→ UX contract
→ Domain rule / invariant
→ Owning code module / layer
→ Service / port / repository boundary
→ Cloud persistence / authorization
→ Local/offline behavior
→ Import/export/recovery impact
→ Tests / evidence
→ Documentation
→ Review / completion status
```

If one required link is unknown, the feature is not implementation-ready and the missing decision is resolved in documentation before semantic implementation continues.

---

## 2. Feature Implementation Record (FIR)

Every V1 feature from `FEATURE-LEDGER.md` receives one living implementation record, using `../templates/FEATURE-IMPLEMENTATION-RECORD.md` or an equivalent durable structure linked from the ledger.

Required categories include:

| Category | Required content |
|---|---|
| Identity | Feature ID, name, lot, owner/reviewer, branch/PR, status |
| Product traceability | Requirement, Acceptance, User Flow, `PUB-*`, `SEC-*`, `AUTHZ-*` IDs as applicable |
| User job | entry point, success outcome, natural next step |
| UX | routes, screen type, blueprint, primary action, states, desktop/mobile/tablet |
| Domain | entities, invariants, transitions, derived data, money/date/null semantics |
| Code ownership | expected/actual folders/modules, services, pure engines, ports, adapters, composition wiring |
| Cloud | tables/views/RPC/Storage/Realtime/migrations |
| Local | IndexedDB, pending mutations, offline class, conflicts, restart/session/project switch |
| Authorization/security | permissions/RLS/GRANT/strong auth/input/query/DOM/file/token/threat controls |
| Public readiness | explicit project context, multi-project isolation, no unscoped cache/subscription |
| Import/export/recovery | external IDs, merge/protected truth, backup/migrations/rollback |
| Tests/evidence | all applicable quality layers, visual evidence and static maintainability checks |
| Deviations | spec/architecture/security exceptions or approved deferred choices |

A feature cannot be marked complete while required FIR fields contain `TBD` unless the corresponding choice is explicitly deferred and does not affect V1 semantics.

---

## 3. Feature lifecycle

Use exactly these implementation states:

### `SPECIFIED`
The feature exists in frozen product/feature/UX/domain documentation and is assigned to a lot.

### `READY`
Its FIR is complete enough to implement, dependencies are satisfied, code ownership is identified, test/security strategy is known and no open BLOCKING/MAJOR design finding affects it.

### `IN_PROGRESS`
Implementation is actively changing code/schema/tests.

### `IMPLEMENTED`
Happy-path behavior and persistence exist, but full verification may still be incomplete. Never present this state as “done”.

### `VERIFIED`
All applicable automated/manual tests, security/RLS checks, static code-architecture/complexity gates, responsive/accessibility states and acceptance criteria pass in isolation.

### `INTEGRATED`
The feature works together with already-completed features; cross-feature derived data/sync/navigation/permissions have been exercised; no architecture boundary was bypassed; the current integration review has no blocking regression.

### `ACCEPTED`
The feature satisfies lot exit criteria and UX/product/code-quality review. For real-data cutover features, this may still precede production cutover.

### `BLOCKED`
A dependency, defect or missing product/security/architecture decision prevents safe progress. The reason is recorded; work is not hidden in `IN_PROGRESS` indefinitely.

No custom synonyms such as “almost done”, “basically finished” or “works locally” replace these states.

---

## 4. Definition of Ready for one feature

Before meaningful implementation starts:

- Feature ID exists;
- Requirements/Acceptance/Security IDs are linked;
- User job/entry points are clear;
- Target screens/page pattern are defined;
- authoritative data ownership is known;
- expected physical code owners/folders are identified using `CODEBASE-STRUCTURE.md`;
- cloud/local persistence is known where applicable;
- offline behavior is classified;
- authorization/security constraints are known;
- domain invariants/state transitions are known;
- dependencies on prior features/lots are available;
- test approach is known;
- expected maintainability/static-analysis implications are known;
- any unresolved semantic decision is documented rather than guessed.

If these are not true, update documentation first.

---

## 5. Definition of Verified for one feature

A feature reaches `VERIFIED` only when all applicable layers pass:

1. domain/unit behavior;
2. boundary/input validation;
3. property tests for rule-heavy calculation where applicable;
4. local persistence/migration behavior;
5. cloud/database constraints;
6. RLS/authorization allow and deny tests;
7. synchronization/idempotence/conflict behavior;
8. import/export/round-trip where applicable;
9. E2E user flow;
10. loading/empty/error/offline/permission/conflict states;
11. mobile + desktop responsive behavior;
12. keyboard/focus/accessibility checks;
13. security/adversarial cases;
14. performance behavior at the defined reference dataset where relevant;
15. static code architecture/cycle/complexity/size/dead-code checks;
16. documentation/traceability/handoff update.

Passing unit coverage alone never moves a feature to `VERIFIED`.

---

## 6. Code ownership before code creation

Before adding a production source file, identify:

- bounded context;
- layer (`ui`, `domain`, `application`, `infrastructure`, import/export/PWA/shared);
- owning feature/use case;
- allowed dependency direction;
- whether the behavior should be pure/domain-owned or provider-specific.

Use `CODEBASE-STRUCTURE.md`.

Do not create a new generic architectural category because an individual task is inconvenient. A material new category/boundary requires documentation/ADR review.

Do not create vague dumping grounds such as `utils.ts`/`helpers.ts` to avoid deciding ownership.

---

## 7. Continuous size / complexity discipline

Do not wait until PR review to discover that a screen/service became a god file.

During implementation:

- monitor file/function size as code is written;
- extract cohesive responsibilities before hard limits are crossed;
- keep business rules out of UI extraction merely to make screen LOC smaller;
- keep provider logic out of application/domain extraction merely to make adapters smaller;
- treat repeated exceptions as architecture smell.

Binding thresholds/exception rules live in `MODULE-SIZE-COMPLEXITY.md`.

An LLM-generated 500-line screen is a refactoring trigger, not an acceptable shortcut.

---

## 8. One primary job per screen

Implementation follows UX architecture:

- a screen has one dominant user job;
- a detail screen summarizes first and progressively reveals detail;
- a dense table is a specialized analysis/bulk-work mode, never the default representation of the whole application;
- creation is minimal first, enrichment later;
- significant context change navigates to a dedicated workflow/page;
- small reversible edits may use inline controls/drawers;
- high-risk/multi-step operations use explicit workflows;
- mobile is not a squeezed desktop table.

A PR that satisfies data requirements by putting every field onto one page fails UX review even if technically functional.

---

## 9. Vertical-slice rule

Prefer a thin, complete feature slice over implementing all UI first and all DB later.

A coherent slice normally includes:

```text
route / UI state
→ application command/query/read model
→ domain validation/rules
→ abstract port
→ local/cloud adapter
→ RLS/authorization where shared
→ sync/offline state
→ tests/evidence
```

Temporary stubs are allowed only when explicitly tracked and cannot masquerade as a completed feature.

---

## 10. Cross-feature dependency review

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
- diagnostics;
- project/public-readiness assumptions;
- shared code/module boundaries.

Use `architecture/DEPENDENCY-GRAPH.md`; absence of an obvious visual change does not imply “no integration impact”.

---

## 11. Anti-drift review in every PR

Use `.github/pull_request_template.md`.

Every implementation PR explicitly answers, as applicable:

- Which Feature/Requirement/Acceptance/Security IDs does this change?
- Did behavior differ from frozen spec? Where is approved spec/ADR change?
- Which canonical modules/layers own the implementation?
- Did a new table/field/status appear? Why is it not invented semantics?
- Did a new route/component pattern appear? Why does an existing pattern not apply?
- Did offline behavior change?
- Did authorization/RLS change?
- Did import/export/backup shape change?
- Did any workflow become longer/denser?
- Could this create duplicate truth?
- Did a file/function exceed a maintainability threshold?
- Did a new dependency or architectural boundary appear?
- What proves mobile/desktop/accessibility where applicable?

A PR with unapproved product/architecture divergence cannot merge merely because tests pass.

---

## 12. Lot execution sequence

Within each implementation lot:

1. **Lot kickoff** — review dependencies, Feature IDs, risks, code architecture and acceptance contract.
2. **Order features** — dependency-heavy behavior before surface polish.
3. **Implement vertical slices** — maintain FIR for each.
4. **Continuous integration** — do not wait until end of lot to combine features.
5. **Continuous maintainability** — keep modules within structure/complexity rules.
6. **Lot internal audit** — ledger has no unexplained `IN_PROGRESS`/TBD/architecture exceptions.
7. **Lot acceptance** — satisfy `LOT-ACCEPTANCE.md`.
8. **Checkpoint review if this lot closes a checkpoint group** — see `roadmap/INTEGRATION-CHECKPOINTS.md`.
9. Only then begin dependent work.

---

## 13. Required implementation artifacts

By feature acceptance, repository evidence must let a context-free developer/LLM answer:

- what was implemented;
- which requirement caused it;
- what code/schema owns it;
- where those modules live physically;
- what they may depend on;
- how authorization works;
- how it behaves offline;
- what tests prove it;
- what size/complexity exception exists, if any;
- what limitations remain;
- whether implementation intentionally changed product/architecture contract.

Evidence locations include FIR, PR description, requirement-linked tests, Feature Ledger, status board, ADRs and checkpoint/release reports.

---

## 14. Abandoned / deferred implementation

If work begins but is intentionally stopped:

- set feature `BLOCKED` or leave `SPECIFIED`/`READY` as appropriate;
- remove dead half-wired production paths unless a documented feature flag/stub is needed;
- record what remains;
- do not leave untracked TODO/FIXME/HACK/TEMP markers;
- do not claim lot completion while a P0/P1 feature assigned to the lot is incomplete unless V1 scope is formally changed.

---

## 15. End-of-session / handoff rule

A future developer or AI agent must be able to resume from repository state alone.

Before ending material development/review work:

- update Feature Ledger statuses;
- record unresolved blocker/reason;
- ensure tests/evidence are committed;
- update FIR/module ownership if changed;
- update lot/current progress in `IMPLEMENTATION-STATUS.md`;
- update checkpoint state if applicable;
- record latest full verification/UX/security result if relevant;
- do not leave the only explanation in chat.

The repository, not conversation memory, is the handoff mechanism.

---

## 16. Checkpoint reset / systematic review

Every 3–4 lots, the governing checkpoint re-reviews the **whole implemented product**, not only the latest lot.

It includes:

- Feature/Requirement reconciliation;
- product/scope fidelity;
- UX/navigation/visual coherence;
- cloud/local/data integrity;
- authorization/security;
- offline/PWA;
- import/export/backup;
- code architecture, cycles, file/function complexity and exception accumulation;
- performance/accessibility;
- documentation/handoff quality.

Repeat/update `reviews/DOCUMENTATION-SYSTEM-SCORECARD.md` using actual code evidence. Any critical dimension below 9.0 becomes a checkpoint finding even if the arithmetic average remains high.
