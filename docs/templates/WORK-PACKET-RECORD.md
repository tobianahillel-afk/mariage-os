# Work Packet Record

Status: **Implementation execution record template**

Use one record per Work Packet when implementation begins. The record is durable repository state and must be understandable without chat context.

`State` and `Current pass` must agree with the canonical state machine in `../engineering/AI-LOT-ORCHESTRATION.md`. If they disagree, the packet is not safely resumable and work must stop until the record is repaired.

## Identity

- Work Packet ID:
- Lot:
- Name:
- State: `PLANNED | READY | IN_PROGRESS | REVIEW_PENDING | REVIEW_FAILED | ACCEPTANCE_PENDING | ACCEPTED | BLOCKED`
- Current pass: `PLAN | A-IMPLEMENT | B-ADVERSARIAL-REVIEW | REMEDIATION | C-ACCEPTANCE | COMPLETE`
- Primary bounded context:
- Branch/PR:
- Implementer/reviewer if relevant:

## Scope

### Primary Feature IDs

- 

### Current-lot responsibilities covered

- 

### Requirements / Acceptance / Security IDs

- 

### Explicitly out of scope for this packet

- 

## Dependency / sequencing

- Required prior packets/features:
- Downstream packets blocked by this packet:
- Shared interfaces/contracts relied on:

## Sizing review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| new/changed bounded domain |  | 3 |  |
| persistent entity/table |  | 1 |  |
| migration family |  | 1 |  |
| RPC/public endpoint/capability command |  | 2 |  |
| RLS/privileged authorization boundary |  | 2 |  |
| major UI route/workflow |  | 1 |  |
| public/unauthenticated capability surface |  | 2 |  |
| external provider integration |  | 3 |  |
| offline/sync semantics |  | 2 |  |
| security-sensitive token/crypto boundary |  | 2 |  |
| financial/calculation critical engine |  | 3 |  |
| backup/import/version migration semantics |  | 2 |  |
| **Total** |  |  |  |

- 9–10 point cohesion rationale if applicable:
- >10 point atomicity/safety exception if applicable:

## Expected vertical slice

- UI/route:
- application command/query/service:
- domain rules/invariants:
- ports/interfaces:
- infrastructure adapters:
- cloud persistence/RLS:
- local/offline behavior:
- import/export/backup/versioning impact:
- UX/QIF/accessibility impact:

## Pass A — IMPLEMENT

### Implementation evidence

- code/modules:
- migrations/schema:
- tests added:
- FIRs updated:
- docs/status updated:

### Pass A exit

- [ ] intended vertical slice exists
- [ ] applicable tests written
- [ ] no known untracked stub/TODO
- [ ] packet moved from `IN_PROGRESS` to `REVIEW_PENDING`
- [ ] current/next pass recorded as `B-ADVERSARIAL-REVIEW`

## Pass B — ADVERSARIAL REVIEW

Review source of truth used:

- 

Findings:

| Severity | Finding | Owning Feature/Control | Resolution |
|---|---|---|---|

Review checks:

- [ ] missing requirement/acceptance behavior searched
- [ ] auth/RLS/cross-project/capability abuse searched
- [ ] edge/error/offline/conflict/race paths searched
- [ ] import/export/backup/version impacts searched
- [ ] mobile/accessibility/QIF searched
- [ ] architecture/provider/layer drift searched
- [ ] size/complexity/god-file drift searched
- [ ] weak/mirroring tests searched
- [ ] undocumented stubs/TODOs searched

### Pass B decision

Choose exactly one durable result:

- [ ] `PASS` — no unresolved BLOCKING/MAJOR finding; packet moved to `ACCEPTANCE_PENDING`; current/next pass is `C-ACCEPTANCE`.
- [ ] `FAIL` — BLOCKING/MAJOR finding exists; packet moved to `REVIEW_FAILED`; current/next pass is `REMEDIATION`.

If remediation begins after `REVIEW_FAILED`, move state to `IN_PROGRESS`, keep current pass `REMEDIATION`, resolve the findings, rerun affected implementation/tests, then return through `REVIEW_PENDING` and Pass B. Do not skip directly to Pass C.

## Pass C — ACCEPTANCE / RECONCILIATION

### Entry gate

- [ ] packet entered Pass C from `ACCEPTANCE_PENDING`
- [ ] current pass is `C-ACCEPTANCE`
- [ ] no unresolved BLOCKING/MAJOR Pass B finding exists

| Responsibility | Expected | Implemented evidence | Verified evidence | Result |
|---|---|---|---|---|

Acceptance checks:

- [ ] all packet responsibilities reconciled
- [ ] applicable FIR fields complete
- [ ] required automated/manual evidence green
- [ ] no BLOCKING/MAJOR finding open
- [ ] architecture/complexity/static gates green
- [ ] documentation/status/handoff updated
- [ ] downstream prerequisites clearly recorded

Final packet decision — choose a real state, not a pseudo-status:

- `ACCEPTED | IN_PROGRESS | BLOCKED`

If Pass C returns the packet to `IN_PROGRESS`, record current pass as `REMEDIATION`, fix the defect, and rerun affected A/B/C evidence before acceptance.

## Handoff

- Current state:
- Current/next pass:
- Last green verification:
- Remaining blocker/finding:
- Next permitted action:
