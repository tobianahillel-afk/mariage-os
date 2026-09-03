# Mariage OS — Agent / LLM Instructions

Status: **Normative repository entry point for AI agents and context-free contributors**

This file exists so an AI agent or developer arriving with **zero prior conversation context** can work safely without guessing the product, current phase, architecture or completion state.

## 0. First rule

Do **not** begin by reading random files or by coding from the user request alone.

Before any material change:

1. read `docs/roadmap/IMPLEMENTATION-STATUS.md`;
2. read `docs/START-HERE.md`;
3. read `docs/V1-FROZEN-MANIFEST.md`;
4. determine whether the implementation gate is open;
5. identify the current lot / checkpoint;
6. identify the Feature ID(s), Requirement ID(s) and Acceptance ID(s) affected;
7. read only the governing contracts for that task using the routing table below;
8. if implementation is requested for an entire Lot, read `docs/engineering/AI-LOT-ORCHESTRATION.md` **before writing production code**;
9. if material behavior is unspecified and not explicitly deferred, treat that as a documentation defect — **do not invent semantics silently**.

Chat history is supplementary. The repository is the handoff/source-of-truth mechanism.

---

## 1. Precedence when documents appear to conflict

Use this order unless a document explicitly states a narrower addendum precedence:

1. **Current work permission/state:** `docs/roadmap/IMPLEMENTATION-STATUS.md` + `docs/FINAL-DESIGN-REVIEW.md`.
2. **Frozen V1 manifest/precedence:** `docs/V1-FROZEN-MANIFEST.md`.
3. **Binding product/scope:** `docs/PRODUCT-SPECIFICATION.md`, its explicit addenda, `docs/roadmap/V1-SCOPE.md`, `docs/REQUIREMENTS-CATALOG.md`, explicit requirement extensions.
4. **Feature and acceptance contracts:** base + extension Feature Ledgers, `docs/features/*`, global + feature-specific acceptance suites.
5. **Specialized normative contracts:** architecture/domain/security/UX/import/quality/operations documents relevant to the behavior.
6. **ADRs:** architectural choices and rationale.
7. **Implementation/release governance:** `docs/engineering/*`, lot/checkpoint/release contracts.
8. **Supporting/non-normative material:** benchmarks, historical audit notes, low-fidelity wireframes when superseded by blueprints.
9. **Conversation/PR prose:** never overrides a normative repository contract by itself.

When a narrower `*-ADDENDUM.md` explicitly corrects/extends a named base document, the addendum controls that scope.

### Guest communications scope precedence

The V1 inventory is the union of:
- `docs/FEATURE-LEDGER.md` (FTR-001..104)
- `docs/FEATURE-LEDGER-GUEST-COMMUNICATIONS-EXTENSION.md` (FTR-105..120)

Any historical text saying `guest portal` or `automated email sending` is post-V1 is superseded by `docs/PRODUCT-SPECIFICATION-GUEST-COMMUNICATIONS-ADDENDUM.md`, `docs/roadmap/V1-SCOPE.md` and `docs/V1-FROZEN-MANIFEST.md`.

The phrase `freeze candidate` in the historical header of `docs/domain/PHYSICAL-SCHEMA-V1.md` is **not a competing status or permission signal**. That document remains a normative implementation schema reference; its explicit addenda control narrower corrected scopes.

After code exists, code/migrations show the **current implemented state**; normative docs still define the **intended state**. A mismatch is a defect to reconcile, not permission to silently change the product.

---

## 2. Minimal cold-start reading

Start with:

1. `README.md`
2. `docs/roadmap/IMPLEMENTATION-STATUS.md`
3. `docs/START-HERE.md`
4. `docs/V1-FROZEN-MANIFEST.md`
5. this file (`AGENTS.md`)

Then route by task.

### Product / feature work

Read:
- relevant row(s) in both Feature Ledger files as applicable;
- mapped requirements/acceptance scenarios;
- relevant `docs/features/<FEATURE>.md`;
- route/screen blueprint + UX/design contracts;
- relevant domain + security + offline contracts;
- current lot acceptance criteria;
- `docs/templates/FEATURE-IMPLEMENTATION-RECORD.md`.

### Whole-Lot implementation request

If the user says `Do Lot N`, `Implement Lot N`, `Fais le Lot N` or equivalent:

1. do **not** implement the Lot as one giant task;
2. read `docs/engineering/AI-LOT-ORCHESTRATION.md`;
3. compute the complete current-lot Feature/control responsibility inventory from both Feature Ledgers + cross-cutting Lot controls;
4. create a dependency-aware bounded Work Packet plan;
5. prove every required responsibility is assigned;
6. record the plan/current packet in durable repository state;
7. default to one packet `IN_PROGRESS` at a time;
8. execute every packet through **Pass A IMPLEMENT → Pass B ADVERSARIAL REVIEW → Pass C ACCEPTANCE**;
9. after all packets, perform mechanical Lot reconciliation;
10. run a separate Lot Integration Pass;
11. only then apply Lot acceptance and any required Checkpoint.

The user is not required to ask for individual Work Packets. Work Packets are internal execution units, not new product Lots.

Use `docs/templates/WORK-PACKET-RECORD.md` for durable packet evidence.

### Guest invitation / RSVP / Email / SMS / WhatsApp work

Mandatory task route:

1. `docs/V1-FROZEN-MANIFEST.md`
2. `docs/FEATURE-LEDGER-GUEST-COMMUNICATIONS-EXTENSION.md`
3. `docs/requirements/GUEST-COMMUNICATIONS-REQUIREMENTS.md`
4. `docs/features/GUESTS.md`
5. `docs/features/GUEST-RSVP-PORTAL.md` and/or `docs/features/COMMUNICATIONS.md`
6. `docs/ux/GUEST-COMMUNICATIONS-BLUEPRINTS.md`
7. `docs/ux/ROUTE-FEATURE-GUEST-COMMUNICATIONS-ADDENDUM.md`
8. `docs/domain/PHYSICAL-SCHEMA-GUEST-COMMUNICATIONS-ADDENDUM.md`
9. `docs/domain/DEPENDENCY-GRAPH-GUEST-COMMUNICATIONS-ADDENDUM.md`
10. `docs/security/GUEST-COMMUNICATIONS-SECURITY.md`
11. `docs/security/GUEST-COMMUNICATIONS-AUTHORIZATION.md`
12. `docs/architecture/COMMUNICATION-PROVIDER-PORTS.md` for provider/integration work
13. `docs/operations/COMMUNICATION-PROVIDER-OPERATIONS.md` for real provider/scheduling/production work
14. `docs/quality/GUEST-COMMUNICATIONS-ACCEPTANCE.md`
15. current Lot/Checkpoint contracts.

Do not implement WhatsApp Web/personal-account automation. Do not expose provider secrets to the browser. Do not implement guest links as broad anonymous CRUD/RLS access.

### UI / UX work

Read in this order:
- `docs/ux/VISUAL-SYSTEM.md`;
- `docs/ux/UX-ARCHITECTURE.md`;
- `docs/ux/NAVIGATION.md`;
- `docs/ux/SCREEN-BLUEPRINTS.md`;
- relevant route/screen addenda;
- `docs/ux/COLOR-SYSTEM.md`;
- `docs/ux/DESIGN-SYSTEM.md`;
- `docs/ux/MOTION-INTERACTION.md`;
- applicable feature contract.

For onboarding/invitations/guest RSVP, `QIF — Quick & Intuitive Flow` is a normative internal acceptance criterion. Never replace a specified workflow with a generic CRUD/table UI for implementation convenience.

### Domain / data / database work

Read:
- relevant `docs/domain/<DOMAIN>.md`;
- `docs/domain/ERD.md`;
- `docs/domain/PHYSICAL-SCHEMA-V1.md` + all applicable addenda;
- `docs/domain/INVARIANTS.md`;
- `docs/domain/DATA-DICTIONARY.md`;
- `docs/architecture/LOCAL-DATA-SCHEMA.md` if offline/local state is involved;
- `docs/architecture/SYNC.md` / `OFFLINE.md` as applicable;
- migrations + RLS contracts.

### Security / Auth / permissions

Start at `docs/security/README.md` and follow its reading order. Do not create a table, RPC, capability endpoint, webhook, file path or privileged workflow without its permission/deny-test design.

### Import / export / backup

Read all governing files under `docs/import-export/`, including guest-communications portability when contact/campaign data is involved, then relevant domain/security/backup/migration contracts. Never treat absence as deletion unless an explicitly destructive workflow says so.

### Tooling / tests / CI

Read:
- current Lot 0/quality contracts;
- `docs/engineering/AI-LOT-ORCHESTRATION.md` when executing/reviewing a Lot;
- `docs/quality/*` applicable files;
- `docs/engineering/CI-CD.md`;
- `docs/engineering/CODING-STANDARDS.md`;
- `docs/engineering/CODEBASE-STRUCTURE.md`;
- `docs/engineering/MODULE-SIZE-COMPLEXITY.md`;
- `docs/engineering/DEFINITION-OF-DONE.md`;
- `docs/engineering/VERSIONING-UPDATE-DELIVERY.md` when CI/deployment/version behavior is affected.

### Release / deployment / version update

Read:
- `docs/engineering/VERSIONING-UPDATE-DELIVERY.md`;
- `docs/engineering/RELEASE-PROCESS.md`;
- `docs/engineering/CI-CD.md`;
- `docs/engineering/MIGRATIONS.md`;
- `docs/architecture/PWA-LIFECYCLE.md`;
- `docs/quality/QUALITY-GATES.md`;
- `docs/templates/RELEASE-PLAN.md`;
- relevant security/backup/operations contracts.

For enabled automatic communication channels, include provider readiness, webhook verification, cost caps and synthetic real-channel smoke evidence in production release/cutover review.

Do not deploy a frontend that assumes a production migration which has not passed its database/RLS compatibility gate. `main` is integration truth; production promotion follows the release orchestration contract.

### Major version V1 → V2

In addition to release documents:
- read accepted V1 scope/spec + both Feature Ledgers as historical baseline;
- create/consult explicit V2 specification/scope delta;
- classify every V1 feature as unchanged/changed/deprecated/replaced/removed;
- map cloud, IndexedDB, sync, import, backup, settings, guest capability and communication-provider migration impacts;
- preserve historical Requirement/Feature/Acceptance traceability;
- use V1→V2 controls in `docs/reviews/ABSOLUTE-300-CONTROL-CHECKLIST.md`.

A major version is a migration program, not a large ordinary feature PR.

### Bug / regression

Before patching:
1. identify owning Feature ID and requirement/invariant;
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
- QIF evidence where applicable;
- status/limitations.

Every Work Packet additionally has a Work Packet Record and cannot become `ACCEPTED` without the three-pass protocol.

No required `TBD` is allowed outside an explicitly deferred decision.

---

## 4. Code architecture rules

Canonical physical structure and dependency boundaries are in:

- `docs/engineering/CODEBASE-STRUCTURE.md`
- `docs/engineering/MODULE-SIZE-COMPLEXITY.md`
- `docs/engineering/CODING-STANDARDS.md`

Non-negotiable summary:

- UI never directly owns business truth or provider authorization.
- Domain code is pure where possible and must not depend on DOM/Supabase/IndexedDB/provider SDKs.
- Application services depend on domain + ports, not concrete infrastructure.
- Infrastructure implements ports; UI does not import Supabase/provider adapters directly.
- Composition root wires concrete adapters.
- No circular dependencies.
- No generic god files such as `utils.ts`, `helpers.ts`, `app.ts` accumulating unrelated behavior.
- File/function complexity thresholds trigger refactor or documented exception.
- New dependencies require explicit justification.

---

## 5. Security rules

Security is design + implementation + evidence. At minimum:

- treat all external/user/imported/provider data as untrusted;
- use centralized runtime validation at trust boundaries;
- no concatenated SQL/user query fragments;
- no `eval`, `new Function`, unsafe untrusted HTML/SVG execution;
- no custom crypto/password/token logic when platform primitives exist;
- no service-role/private/provider secrets in browser/public repo;
- current project membership + permission + relationship + invariant checks are authoritative server-side;
- guest capability tokens receive only narrow household-scoped guest-safe operations;
- provider webhooks are authenticated and deduplicated before trusted state mutation;
- direct API/RPC/Storage/capability deny tests are required;
- multi-project isolation is mandatory even though first real deployment is one couple;
- relevant `SEC-*`, `AUTHZ-*`, `RSVP-*`, `COM-*` requirements appear in feature evidence;
- release/deployment credentials exist only in protected CI/runtime environments and never in untrusted PRs.

Start with `docs/security/README.md`.

---

## 6. Tests and quality

A green UI demo or successful hosting deployment is not completion.

Use applicable layers from `docs/quality/TESTING-STRATEGY.md`, `docs/quality/QUALITY-GATES.md`, `docs/quality/GUEST-COMMUNICATIONS-ACCEPTANCE.md` and `docs/engineering/DEFINITION-OF-DONE.md`.

Applicable evidence may include:

- unit/domain;
- property-based;
- mutation testing for critical engines;
- integration/local persistence;
- PostgreSQL/RLS allow + deny;
- guest capability/cross-household/adversarial;
- provider webhook/idempotency/error contract tests;
- security/adversarial;
- import/export/round-trip;
- offline/reconnect/conflict;
- migration/backup/restore;
- release/version compatibility;
- PWA/update migration;
- Playwright E2E;
- QIF usability scenarios;
- accessibility;
- performance/reference dataset;
- synthetic mobile/desktop visual evidence;
- post-deployment release/provider health evidence.

In-scope coverage targets do not replace meaningful assertions.

The exhaustive cross-phase control set is `docs/reviews/ABSOLUTE-300-CONTROL-CHECKLIST.md`. Documentation does not masquerade as runtime verification.

---

## 7. End-of-session / handoff protocol

Before ending material work:

1. update both Feature Ledger files for affected features;
2. update `docs/roadmap/IMPLEMENTATION-STATUS.md` when progress materially changed;
3. while a Lot is active, persist current Lot, Work Packet, packet state/pass, accepted packets, blockers and next action;
4. ensure tests/evidence are committed;
5. update docs/ADR if behavior or architecture changed;
6. update release plan/status when release work changed;
7. leave no essential explanation only in chat.

A future agent should be able to resume by reading repository state alone.

---

## 8. Stop conditions

Stop implementation/release and resolve documentation/review first if:

- implementation gate is closed;
- two normative contracts materially disagree;
- required user behavior/security/data semantic is unspecified;
- a P0/P1 requirement would be changed without approved scope/spec update;
- a new architecture dependency/boundary is needed without ADR/review;
- security review is required for a new public endpoint/provider/webhook/attack surface;
- current lot/checkpoint does not permit the work;
- a whole-Lot request has not been decomposed/reconciled under `AI-LOT-ORCHESTRATION.md`;
- a Work Packet is being marked complete without Pass B and Pass C;
- Lot reconciliation is non-empty or Lot Integration Pass has not succeeded;
- production migration/compatibility/recovery prerequisites are not green;
- obsolete client cannot safely coexist with target backend and no update-required path exists;
- a communication send path cannot prove audience freeze/idempotency/authorization/provider readiness.

Do not optimize for finishing the current prompt at the cost of violating the repository contract.