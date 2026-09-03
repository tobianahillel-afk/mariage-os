# Mariage OS — Agent / LLM Instructions

Status: **Normative repository entry point for AI agents and context-free contributors**

This file exists so an AI agent or developer arriving with **zero prior conversation context** can work safely without guessing the product, current phase, architecture or completion state.

## 0. First rule

Do **not** begin by reading random files or by coding from the user request alone.

Before any material change:

1. read `docs/roadmap/IMPLEMENTATION-STATUS.md`;
2. read `docs/START-HERE.md`;
3. determine whether the implementation gate is open;
4. identify the current lot / checkpoint;
5. identify the Feature ID(s), Requirement ID(s) and Acceptance ID(s) affected;
6. read only the governing contracts for that task using the routing table below;
7. if material behavior is unspecified and not explicitly deferred, treat that as a documentation defect — **do not invent semantics silently**.

Chat history is supplementary. The repository is the handoff/source-of-truth mechanism.

---

## 1. Precedence when documents appear to conflict

Use this order unless a document explicitly states a narrower addendum precedence:

1. **Current work permission/state:** `docs/roadmap/IMPLEMENTATION-STATUS.md` + `docs/FINAL-DESIGN-REVIEW.md`.
2. **Binding product/scope:** `docs/PRODUCT-SPECIFICATION.md`, its explicit addenda, `docs/roadmap/V1-SCOPE.md`, `docs/REQUIREMENTS-CATALOG.md`.
3. **Feature and acceptance contracts:** `docs/FEATURE-LEDGER.md`, `docs/features/*`, `docs/ACCEPTANCE-SCENARIOS.md`.
4. **Specialized normative contracts:** architecture/domain/security/UX/import/quality/operations documents relevant to the behavior.
5. **ADRs:** architectural choices and rationale.
6. **Implementation governance:** `docs/engineering/*`, lot/checkpoint contracts.
7. **Supporting/non-normative material:** benchmarks, historical audit notes, low-fidelity wireframes when superseded by blueprints.
8. **Conversation/PR prose:** never overrides a normative repository contract by itself.

When a narrower `*-ADDENDUM.md` explicitly corrects/extends a named base document, the addendum controls that scope.

After code exists, code/migrations show the **current implemented state**; normative docs still define the **intended state**. A mismatch is a defect to reconcile, not permission to silently change the product.

---

## 2. Minimal cold-start reading

Do not read all documentation blindly. Start with:

1. `README.md`
2. `docs/roadmap/IMPLEMENTATION-STATUS.md`
3. `docs/START-HERE.md`
4. this file (`AGENTS.md`)

Then route by task.

### Product / feature work

Read:
- relevant row(s) in `docs/FEATURE-LEDGER.md`;
- mapped requirements/acceptance scenarios;
- relevant `docs/features/<FEATURE>.md`;
- route/screen blueprint + UX/design contracts;
- relevant domain + security + offline contracts;
- current lot acceptance criteria;
- `docs/templates/FEATURE-IMPLEMENTATION-RECORD.md`.

### UI / UX work

Read in this order:
- `docs/ux/VISUAL-SYSTEM.md`;
- `docs/ux/UX-ARCHITECTURE.md`;
- `docs/ux/NAVIGATION.md`;
- `docs/ux/SCREEN-BLUEPRINTS.md`;
- `docs/ux/SCREEN-CONTRACTS.md` + project-scope addendum;
- `docs/ux/COLOR-SYSTEM.md`;
- `docs/ux/DESIGN-SYSTEM.md`;
- `docs/ux/MOTION-INTERACTION.md`;
- applicable feature contract.

Never replace a specified workflow with a generic CRUD/table UI for implementation convenience.

### Domain / data / database work

Read:
- relevant `docs/domain/<DOMAIN>.md`;
- `docs/domain/ERD.md`;
- `docs/domain/PHYSICAL-SCHEMA-V1.md` + addenda;
- `docs/domain/INVARIANTS.md`;
- `docs/domain/DATA-DICTIONARY.md`;
- `docs/architecture/LOCAL-DATA-SCHEMA.md` if offline/local state is involved;
- `docs/architecture/SYNC.md` / `OFFLINE.md` as applicable;
- migrations + RLS contracts.

### Security / Auth / permissions

Start at `docs/security/README.md` and follow its reading order. Do not create a table, RPC, file path or privileged workflow without its permission/deny-test design.

### Import / export / backup

Read all governing files under `docs/import-export/`, then relevant domain/security/backup/migration contracts. Never treat absence as deletion unless an explicitly destructive workflow says so.

### Tooling / tests / CI

Read:
- current lot 0/quality contracts;
- `docs/quality/*` applicable files;
- `docs/engineering/CI-CD.md`;
- `docs/engineering/CODING-STANDARDS.md`;
- `docs/engineering/CODEBASE-STRUCTURE.md`;
- `docs/engineering/MODULE-SIZE-COMPLEXITY.md`;
- `docs/engineering/DEFINITION-OF-DONE.md`.

### Bug / regression

Before patching:
1. identify the owning Feature ID and requirement/invariant;
2. reproduce with a failing regression test at the correct layer;
3. check whether the bug reveals a spec mismatch or implementation defect;
4. fix the smallest correct layer, not only the visible symptom;
5. update evidence/status if the defect changes verification state.

---

## 3. Mandatory implementation discipline

Once the implementation gate is open, every material feature follows:

`SPECIFIED → READY → IN_PROGRESS → IMPLEMENTED → VERIFIED → INTEGRATED → ACCEPTED`

Do not use informal synonyms such as “basically done”.

Every material feature/change must have a Feature Implementation Record (FIR) or equivalent durable structured record covering:

- Feature/Requirement/Acceptance IDs;
- user job + routes;
- UX blueprint/state behavior;
- domain entities/invariants;
- services/repositories;
- cloud/local persistence;
- authorization + security requirements;
- offline/sync/conflict behavior;
- import/export/backup impact;
- tests/evidence;
- public-readiness/project isolation;
- status/limitations.

No required `TBD` is allowed outside an explicitly deferred decision.

---

## 4. Code architecture rules

Canonical physical structure and dependency boundaries are in:

- `docs/engineering/CODEBASE-STRUCTURE.md`
- `docs/engineering/MODULE-SIZE-COMPLEXITY.md`
- `docs/engineering/CODING-STANDARDS.md`

Non-negotiable summary:

- UI never directly owns business truth or provider authorization.
- Domain code is pure where possible and must not depend on DOM/Supabase/IndexedDB.
- Application services depend on domain + ports, not concrete infrastructure.
- Infrastructure implements ports; UI does not import Supabase adapters directly.
- Composition root wires concrete adapters.
- No circular dependencies.
- No generic god files such as `utils.ts`, `helpers.ts`, `app.ts` accumulating unrelated behavior.
- File/function complexity thresholds trigger refactor or documented exception.
- New dependencies require explicit justification.

---

## 5. Security rules

Security is design + implementation + evidence. At minimum:

- treat all external/user/imported data as untrusted;
- use centralized runtime validation at trust boundaries;
- no concatenated SQL/user query fragments;
- no `eval`, `new Function`, unsafe untrusted HTML/SVG execution;
- no custom crypto/password/token logic when platform primitives exist;
- no service-role/private secrets in browser/public repo;
- current project membership + permission + relationship + invariant checks are authoritative server-side;
- direct API/RPC/Storage deny tests are required;
- multi-project isolation is mandatory even though first real deployment is one couple;
- relevant `SEC-*` and `AUTHZ-*` requirements must appear in feature evidence.

Start with `docs/security/README.md`.

---

## 6. Tests and quality

A green UI demo is not completion.

Use applicable layers from `docs/quality/TESTING-STRATEGY.md` and `docs/engineering/DEFINITION-OF-DONE.md`, including as relevant:

- unit/domain;
- property-based;
- mutation testing for critical engines;
- integration/local persistence;
- PostgreSQL/RLS allow + deny;
- security/adversarial;
- import/export/round-trip;
- offline/reconnect/conflict;
- migration/backup/restore;
- Playwright E2E;
- accessibility;
- performance/reference dataset;
- synthetic mobile/desktop visual evidence.

In-scope coverage targets do not replace meaningful assertions.

---

## 7. End-of-session / handoff protocol

Before ending material work:

1. update Feature Ledger status for affected features;
2. update `docs/roadmap/IMPLEMENTATION-STATUS.md` when progress materially changed;
3. record blockers and next permitted action;
4. ensure tests/evidence are committed;
5. update docs/ADR if behavior or architecture changed;
6. leave no essential explanation only in chat.

A future agent should be able to resume by reading repository state alone.

---

## 8. Stop conditions

Stop implementation and resolve documentation/review first if:

- the implementation gate is closed;
- two normative contracts materially disagree;
- a required user behavior/security/data semantic is unspecified;
- a P0/P1 requirement would be changed without approved scope/spec update;
- a new architecture dependency/boundary is needed without ADR/review;
- security review is required by `docs/security/README.md` for a new attack surface;
- the current lot/checkpoint does not permit the work.

Do not optimize for finishing the current prompt at the cost of violating the repository contract.
