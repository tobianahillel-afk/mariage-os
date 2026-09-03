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

Any BLOCKING/MAJOR finding returns the packet to `IN_PROGRESS` and invalidates previous acceptance evidence affected by the change.

### Pass C — ACCEPTANCE / RECONCILIATION

Goal: mechanically determine whether the packet is complete.

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

If Pass C changes production code to fix a defect, affected verification is rerun and the packet returns through review as necessary.

---

## 8. Work Packet states

Use exactly:

- `PLANNED`
- `READY`
- `IN_PROGRESS`
- `REVIEW_PENDING`
- `REVIEW_FAILED`
- `ACCEPTANCE_PENDING`
- `ACCEPTED`
- `BLOCKED`

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
- blocked packets/findings;
- next permitted action;
- latest full verification relevant to the current packet/lot.

Example:

```text
Current Lot: 6
Current Packet: WP-6.4
Packet State: REVIEW_PENDING
Next Action: Pass B — adversarial review of WP-6.4
Accepted Packets: WP-6.1, WP-6.2, WP-6.3
```

A new agent resumes the recorded pass. It does not restart the Lot and does not skip to the next packet.

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

Integration failures return the owning packet/Feature to the appropriate lifecycle state and invalidate Lot acceptance until repaired/reverified.

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

## 14. Recommended packet granularity by Lot risk

The orchestrator must be especially conservative for:

- Lot 2 Venues;
- Lot 4 Import/export;
- Lot 5 Budget/payments;
- Lot 6 Guests/RSVP/communications/seating;
- Lot 10 Offline/PWA;
- Lot 11 Backup/security/providers/production;
- Lot 12 migration/cutover.

These Lots must never be treated as one implementation context merely because the user requested the entire Lot.

---

## 15. Orchestration failure conditions

Stop and repair orchestration before continuing when:

- a Feature/current-lot responsibility has no packet;
- a packet exceeds sizing thresholds without accepted exception;
- packet dependencies form a cycle that prevents safe sequencing;
- more than one unrelated packet is left IN_PROGRESS;
- a packet is called complete without Pass B or Pass C;
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