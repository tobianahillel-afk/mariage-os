# Mariage OS — AI Lot Orchestration

Status: **Normative implementation execution contract**

Purpose: allow a human to give the simple command `Do Lot N` while preventing an AI agent from treating a large implementation lot as one giant context window, skipping capabilities, declaring partial work complete, or losing its place across sessions.

This contract does **not** change the product Lots. Lots remain product/architecture milestones. It defines the mandatory internal execution granularity used by AI agents inside each Lot.

---

## 1. User command contract

The user may simply request:

> `Do Lot N.`

The user is not required to manually enumerate sub-tasks, Feature IDs, Work Packets, review passes or evidence.

The executing agent must translate that command into the orchestration protocol below before implementation begins.

A request to `Do Lot N` never means `implement the whole lot in one uncontrolled pass`.

---

## 2. Lot Orchestrator responsibilities

At lot kickoff the agent must:

1. read `AGENTS.md`, `IMPLEMENTATION-STATUS.md`, `V1-FROZEN-MANIFEST.md`, the Lot definition and Lot acceptance contracts;
2. compute the complete set of Feature IDs whose current-lot responsibility belongs to this Lot, including both V1 ledgers;
3. include cross-cutting engineering controls that have no standalone Feature ID but are mandatory for Lot exit;
4. read dependency information and identify ordering constraints;
5. construct an explicit Work Packet plan before production implementation;
6. prove every required Feature/current-lot responsibility is covered by at least one packet;
7. prove every packet maps back to Feature/Requirement/Acceptance/Security IDs where applicable;
8. record the plan and current packet in durable repository state;
9. execute packets sequentially by default;
10. reconcile the complete Lot before Lot acceptance.

A missing Feature assignment is a blocking orchestration defect.

---

## 3. Work Packet definition

A **Work Packet (WP)** is the maximum normal implementation unit given to one AI execution/review cycle.

A Work Packet is smaller than a Lot and normally covers:

- **1–3 primary Feature IDs or one tightly coupled cross-cutting foundation concern**;
- one primary bounded context;
- one coherent user/system objective;
- one understandable vertical slice or small family of closely coupled vertical slices;
- a test/evidence set that can be reviewed as a whole.

A Work Packet is an implementation-control unit, not a new product-scope unit. It may not change Feature semantics or create new V1 scope by itself.

---

## 4. Packet sizing / split rules

The agent must split a proposed packet when independent review would become difficult.

### Normal target

A packet should normally stay within:

- 1–3 primary Feature IDs;
- 1 primary bounded context;
- 0–3 important user-facing surfaces;
- 0–5 new persistent entities/tables;
- a localized architecture/security boundary;
- one reviewable migration/RLS/API change family.

These are review triggers, not permission to hide complexity inside one Feature.

### Complexity points

Before implementation, estimate complexity using the following planning points:

| Change type | Points |
|---|---:|
| new/meaningfully changed bounded domain | 3 |
| new persistent entity/table | 1 |
| new migration family | 1 |
| new RPC/public endpoint/capability command | 2 |
| new/changed RLS or privileged authorization boundary | 2 |
| new major UI route/workflow | 1 |
| public/unauthenticated capability surface | 2 |
| external provider integration | 3 |
| offline/sync semantics | 2 |
| security-sensitive token/crypto boundary | 2 |
| financial/calculation critical engine | 3 |
| backup/import/version migration semantics | 2 |

Target packet size: **≤ 8 points**.

**9–10 points** requires an explicit cohesion review before work begins.

**> 10 points** must be split unless a documented atomicity/safety reason makes splitting materially worse.

The point system is a planning guardrail. It does not replace code-size/complexity limits.

---

## 5. Packet completeness map

Before the first packet begins, create a Lot Coverage Matrix containing at least:

| Required item | Owning Feature/Control | Packet(s) | Dependencies | Final evidence |
|---|---|---|---|---|

The orchestrator must validate:

```text
Required current-lot responsibilities - Assigned packet responsibilities = ∅
```

If the difference is non-empty, implementation does not start.

One Feature may legitimately span multiple Lots. Only the responsibility explicitly assigned to the current Lot is required for that Lot's reconciliation.

---

## 6. Default sequential execution

Default rule: **one Work Packet IN_PROGRESS per implementing agent/session**.

Do not keep several unrelated packets partially implemented simultaneously.

Parallel packets are allowed only when all are documented:

- interfaces between them are already stable;
- they do not modify the same critical schema/migration/security boundary;
- they do not depend on each other's unfinished behavior;
- integration responsibility is assigned;
- separate durable state/evidence exists for each.

Parallelism is an optimization, never the default completion strategy.

---

## 7. Mandatory three-pass protocol

Every Work Packet has three distinct passes.

### Pass A — IMPLEMENT

Goal: implement the packet as a complete vertical slice.

Required outcomes as applicable:

- code;
- migrations/schema;
- authorization/RLS;
- local/offline behavior;
- UI/UX/QIF;
- tests;
- FIR updates;
- traceability/status evidence.

At the end of Pass A the packet state is `REVIEW_PENDING`, never `ACCEPTED` merely because the implementing agent believes it is complete.

### Pass B — ADVERSARIAL REVIEW

Goal: search for omissions and defects rather than confirm the implementation author's assumptions.

The review must reconstruct expected behavior from repository contracts and compare it to code/tests.

Review specifically for:

- missing Feature/Requirement/Acceptance/Security behavior;
- happy-path-only implementation;
- authorization/RLS/cross-project/capability leakage;
- missing edge/error/loading/offline/conflict states;
- idempotency/retry/race defects;
- import/export/backup/versioning consequences;
- mobile/accessibility/QIF regressions;
- architecture/layer/provider leakage;
- oversized files/functions/god services;
- tests that only mirror implementation rather than prove behavior;
- undocumented TODO/stubs/deferred behavior;
- unintended product/spec drift.

Where the execution environment supports it, Pass B should be performed with a fresh/cold context or separate reviewing agent. If not, the reviewer must explicitly re-read the packet contracts before review and must not rely on Pass A's conclusion.

Findings are classified at least `BLOCKING`, `MAJOR`, `MINOR` or `PASS`.

- If Pass B finds a BLOCKING/MAJOR defect, record the packet as `REVIEW_FAILED`. The durable next action is remediation; when remediation actively begins, transition back to `IN_PROGRESS`. Affected prior verification is invalidated and must be rerun.
- If Pass B has no unresolved BLOCKING/MAJOR defect, transition to `ACCEPTANCE_PENDING`. The durable next action is Pass C.
- MINOR findings may remain only when the governing feature/Lot/DoD permits them, with explicit disposition; they do not silently disappear.

### Pass C — ACCEPTANCE / RECONCILIATION

Goal: mechanically determine whether the packet is complete.

Pass C begins only from `ACCEPTANCE_PENDING`.

For every covered Feature/current-lot responsibility, compare:

```text
EXPECTED
vs
IMPLEMENTED
vs
VERIFIED
```

Pass C verifies:

- all packet Feature/Control responsibilities accounted for;
- required FIR fields complete;
- required tests/evidence green;
- no BLOCKING/MAJOR finding remains;
- code architecture/complexity gates green;
- documentation/status updated;
- integration prerequisites for the next packet are explicit.

Only Pass C may mark the Work Packet `ACCEPTED`.

If Pass C finds a correctable implementation/evidence defect, transition to `IN_PROGRESS`, fix it, and rerun affected Pass A/B/C evidence as required. If safe progress cannot continue because of an external dependency or unresolved design/security issue, transition to `BLOCKED` with the reason and next resolution condition recorded.

If Pass C changes production code to fix a defect, affected verification is rerun and the packet returns through review rather than being accepted from stale evidence.

---

## 8. Work Packet states and transitions

Use exactly:

- `PLANNED`
- `READY`
- `IN_PROGRESS`
- `REVIEW_PENDING`
- `REVIEW_FAILED`
- `ACCEPTANCE_PENDING`
- `ACCEPTED`
- `BLOCKED`

Canonical normal transition path:

```text
PLANNED
→ READY
→ IN_PROGRESS          # Pass A
→ REVIEW_PENDING       # Pass A complete; Pass B next
→ ACCEPTANCE_PENDING   # Pass B passed
→ ACCEPTED             # Pass C passed
```

Failure/remediation transitions:

```text
REVIEW_PENDING
→ REVIEW_FAILED        # Pass B found BLOCKING/MAJOR
→ IN_PROGRESS          # remediation starts

ACCEPTANCE_PENDING
→ IN_PROGRESS          # Pass C found correctable defect

ANY NON-TERMINAL STATE
→ BLOCKED              # external/design/security dependency prevents safe progress

BLOCKED
→ READY or IN_PROGRESS # only after recorded blocker is resolved; choose based on whether implementation must resume
```

`ACCEPTED` is terminal for the packet unless later integration/checkpoint/regression evidence invalidates it. In that case the owning Feature/packet is explicitly reopened to the appropriate non-terminal state; acceptance history is retained rather than rewritten.

The separate `current pass` field must agree with state. Examples:

- `IN_PROGRESS` → `A-IMPLEMENT` or explicit remediation;
- `REVIEW_PENDING` → `B-ADVERSARIAL-REVIEW` is next/running;
- `REVIEW_FAILED` → review failed, remediation is next;
- `ACCEPTANCE_PENDING` → `C-ACCEPTANCE` is next/running;
- `ACCEPTED` → `COMPLETE`.

Do not use `mostly done`, `almost complete` or similar language as durable state.

---

## 9. Session/handoff persistence

The repository must make an interrupted Lot resumable without chat context.

`IMPLEMENTATION-STATUS.md` must record while a Lot is active:

- current Lot;
- Lot state;
- Work Packet plan/reference;
- current packet;
- current packet state/pass;
- accepted packets;
- blocked/review-failed packets/findings;
- next permitted action;
- latest full verification relevant to the current packet/lot.

Example:

```text
Current Lot: 6
Current Packet: WP-6.4
Packet State: REVIEW_PENDING
Current/Next Pass: B-ADVERSARIAL-REVIEW
Next Action: perform adversarial review of WP-6.4
Accepted Packets: WP-6.1, WP-6.2, WP-6.3
```

A new agent resumes the recorded state/pass. It does not restart the Lot and does not skip to the next packet.

---

## 10. Lot reconciliation

After every planned Work Packet is `ACCEPTED`, perform a separate Lot reconciliation.

Mechanically compute:

```text
Required current-lot Feature/control responsibilities
MINUS
Accepted/evidenced responsibilities
```

The result must be empty.

Also verify:

- no unexplained Feature remains `SPECIFIED`, `READY`, `IN_PROGRESS`, `IMPLEMENTED`, `BLOCKED` for responsibility that should have elapsed in this Lot;
- every accepted packet has durable evidence;
- no packet introduced an unreviewed dependency/architecture exception;
- all temporary stubs required only for intermediate packet sequencing are removed or explicitly governed.

A non-empty reconciliation result blocks Lot closure.

---

## 11. Lot integration pass

Packet acceptance does not prove the Lot works as one system.

After reconciliation, run an end-to-end Lot Integration Pass that exercises the important cross-packet workflows and derived/invalidation behavior.

Integration tests/review must cover the Lot's real dependency chains rather than only individual packet happy paths.

Example for guest communications:

```text
household/contact
→ invitation capability
→ campaign/manual share
→ guest RSVP
→ guest statistics
→ seating readiness
→ budget/next-action invalidation
```

Integration failures reopen the owning packet/Feature to the appropriate lifecycle state and invalidate Lot acceptance until repaired/reverified.

---

## 12. Lot acceptance

Only after:

1. all Work Packets ACCEPTED;
2. Lot Coverage reconciliation empty;
3. Lot Integration Pass green;
4. base + applicable addendum Lot acceptance criteria green;
5. feature lifecycle/status reconciled;
6. no unresolved BLOCKING/MAJOR finding;
7. required full verification green;

may the Lot become `ACCEPTED`.

If the Lot ends a checkpoint group, it remains in `CHECKPOINT_REVIEW` until that checkpoint passes.

A successful UI demo, high coverage or large commit count is not Lot completion evidence.

---

## 13. Checkpoints remain higher-level gates

The Work Packet protocol does not replace Checkpoints A/B/C/D.

Hierarchy:

```text
Feature/FIR
→ Work Packet three-pass acceptance
→ Lot reconciliation
→ Lot integration
→ Lot acceptance
→ Checkpoint global review when applicable
```

Checkpoint review re-evaluates the complete product implemented so far, including regressions in earlier Lots.

---

## 14. Lot-level packet-count sanity ranges

The exact Work Packet plan is created at lot kickoff from current dependencies and responsibility scope. The ranges below are **sanity ranges, not quotas**. They exist to catch implausibly coarse decomposition.

| Lot | Typical planning range | Risk note |
|---:|---:|---|
| 0 | 4–7 packets | tooling/CI/static-analysis concerns should remain separable |
| 1 | 6–9 packets | Auth/RLS/project/local/shell foundations must not be collapsed |
| 2 | 8–12 packets | venue facts/evidence/offers/media/UI/access form several distinct slices |
| 3 | 4–6 packets | tasks/decisions/Inbox + integration |
| 4 | 7–10 packets | parsers/mapping/dedupe/merge/rollback/security are independently risky |
| 5 | 6–9 packets | exact money, scenarios, payments, UI/integration need separate proof |
| 6 | **15–25 packets** | guests + RSVP + public capability + campaigns/providers + seating is the largest functional Lot |
| 7 | 5–8 packets | vendors/offers/documents/readiness/integration |
| 8 | 6–9 packets | planning/dashboard/timeline/search and cross-domain derived state |
| 9 | 3–5 packets | map/access/privacy/fallback |
| 10 | 6–9 packets | IndexedDB/sync/conflicts/SW/update/session/device behavior |
| 11 | **10–15 packets** | backup/recovery/security/providers/release readiness; high production risk |
| 12 | 6–10 packets | migrations/reconciliation/device acceptance/recovery/cutover |

A plan below the lower bound is not automatically wrong, but requires an explicit **COARSE-PACKET JUSTIFICATION** explaining why responsibilities are still independently reviewable and remain within per-packet complexity limits.

A plan far above the upper bound triggers a **FRAGMENTATION REVIEW** to ensure packets are real coherent slices rather than tiny file-level tasks that create orchestration overhead.

No packet-count range can override the hard rule that a packet >10 complexity points must normally be split.

Especially:

- Lot 6 may not be reduced to “Guests / Communications / Seating” as three giant packets without an approved exceptional rationale;
- Lot 11 may not be reduced to “Backup / Security / Providers” as three giant packets;
- Lot 2, 4, 5, 10 and 12 also require conservative decomposition.

---

## 15. Orchestration failure conditions

Stop and repair orchestration before continuing when:

- a Feature/current-lot responsibility has no packet;
- a packet exceeds sizing thresholds without accepted exception;
- a Lot plan is implausibly coarse against the sanity range without explicit justification;
- packet dependencies form a cycle that prevents safe sequencing;
- more than one unrelated packet is left IN_PROGRESS;
- a packet is called complete without Pass B or Pass C;
- packet state/current-pass combination is inconsistent or cannot tell a cold-start agent what to do next;
- a reviewer relies only on the implementing agent's summary instead of repository contracts;
- lot reconciliation is non-empty;
- Lot acceptance is attempted before integration pass;
- a session ends without durable current packet/pass state.

---

## 16. Relationship to other contracts

This document complements and is mandatory with:

- `AGENTS.md`
- `engineering/IMPLEMENTATION-PLAYBOOK.md`
- `engineering/DEFINITION-OF-DONE.md`
- `engineering/CODING-STANDARDS.md`
- `engineering/CODEBASE-STRUCTURE.md`
- `engineering/MODULE-SIZE-COMPLEXITY.md`
- `roadmap/LOTS.md`
- `roadmap/LOT-ACCEPTANCE.md` and applicable addenda
- both V1 Feature Ledgers
- checkpoint contracts.

If a future implementation process materially changes these orchestration rules, update this contract and re-review development governance before using the new process.