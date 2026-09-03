# Mariage OS — Implementation Status Board

Status: **Living repository source of truth for development progress**

Purpose: answer “where exactly are we?” without relying on chat history, memory or interpretation of recent commits.

## Current phase

**Pre-code V1 documentation/design: COMPLETE / FROZEN.**

**Expanded V1 guest RSVP + Email/SMS/WhatsApp scope: REVIEWED / MERGED / FROZEN.**

**AI Lot Orchestration / bounded Work Packet governance: REVIEWED / MERGED / FROZEN.**

**Final Design Review: PASS.**

**Implementation gate: OPEN.**

**Lot 0: READY / NOT_STARTED.**

No application/tooling implementation work has started.

PR #6 merged the AI Lot Orchestration change from exact sealed head:

`d72f1d025d8e5f7b6cab696aa5886fa3a432c70a`

Merge commit:

`8c879f9fd2e7e7427b3fef98247028d0dc163e8c`

The merge used exact-head protection. Any future Lot begins only after an explicit user kickoff and must follow the frozen orchestration protocol.

## Frozen V1 feature inventory

The authoritative V1 feature set is the union of:

- `../FEATURE-LEDGER.md` — `FTR-001..104`;
- `../FEATURE-LEDGER-GUEST-COMMUNICATIONS-EXTENSION.md` — `FTR-105..120`.

Total: **120 V1 capabilities**, all still design-level `SPECIFIED`.

Implementation counts:

- `READY`: 0 Feature IDs unless explicitly promoted during a future lot kickoff;
- `IN_PROGRESS`: 0;
- `IMPLEMENTED`: 0;
- `VERIFIED`: 0;
- `INTEGRATED`: 0;
- `ACCEPTED`: 0;
- `BLOCKED`: 0.

Documentation completion never counts as feature implementation.

## Frozen AI Lot execution model

A user may simply request:

```text
Fais le Lot N
```

The user does not need to manually enumerate Work Packets.

When the current Lot is permitted, the AI must internally execute:

```text
complete current-lot Feature/control inventory
→ dependency-aware Lot Coverage Matrix
→ bounded Work Packet plan
→ Pass A IMPLEMENT
→ Pass B ADVERSARIAL REVIEW
→ Pass C ACCEPTANCE
→ next packet
→ mechanical required - accepted/evidenced reconciliation = ∅
→ separate Lot Integration Pass
→ base + applicable addendum Lot acceptance
→ Checkpoint when applicable
```

Default: one Work Packet `IN_PROGRESS` at a time.

Every Work Packet uses the canonical state machine from `../engineering/AI-LOT-ORCHESTRATION.md`, with durable state/pass evidence in `../templates/WORK-PACKET-RECORD.md`.

Normal path:

```text
PLANNED
→ READY
→ IN_PROGRESS
→ REVIEW_PENDING
→ ACCEPTANCE_PENDING
→ ACCEPTED
```

A failed adversarial review uses `REVIEW_FAILED` and explicit `REMEDIATION`; Pass C cannot be entered without `ACCEPTANCE_PENDING`.

During an active Lot this status board must persist:

- current Lot;
- Lot state;
- Work Packet plan/reference;
- current packet;
- packet state;
- current/next pass;
- accepted packets;
- review-failed/blocked packets and findings;
- latest relevant verification;
- next permitted action.

A session may not silently skip an unfinished packet or infer Lot completion from chat history.

## Packet sizing safeguards

Work Packet normal target:

- 1–3 primary Feature IDs or one tightly coupled foundation concern;
- one primary bounded context;
- ≤8 planning complexity points target;
- 9–10 points requires cohesion review;
- >10 points normally requires split.

Lot-level planning sentries include:

- Lot 2: 8–12 typical packets;
- Lot 4: 7–10;
- Lot 5: 6–9;
- Lot 6: **15–25**;
- Lot 10: 6–9;
- Lot 11: **10–15**;
- Lot 12: 6–10.

These ranges are sanity checks, not quotas. A coarse plan below range requires explicit justification; complexity limits still govern every packet.

## Final pre-Lot 0 review evidence

- `../FINAL-DESIGN-REVIEW.md` — PASS / implementation gate OPEN;
- `../V1-FROZEN-MANIFEST.md` — frozen V1 composition/precedence;
- `../reviews/PRE-LOT0-36-CRITERIA-CERTIFICATION.md` — **36/36 criteria at 100/100 design**;
- `../reviews/AI-LOT-ORCHESTRATION-REVIEW.md` — execution-governance review;
- `../reviews/AI-LOT-ORCHESTRATION-PR-FINDINGS-ADDENDUM.md` — final PR findings AIO-011..013;
- `../reviews/ABSOLUTE-300-CONTROL-CHECKLIST.md` + AI-orchestration addendum — cross-phase maturity controls;
- PR #6 exact-head seal + successful exact-head merge.

Final orchestration review resolved 13 design/governance findings, including the two GitHub review threads and the final Work Packet template/state-machine consistency issue.

## Lot status

Allowed lot states:
- `NOT_STARTED`
- `READY`
- `IN_PROGRESS`
- `LOT_REVIEW`
- `CHECKPOINT_REVIEW`
- `ACCEPTED`
- `BLOCKED`

| Lot | Name | State | Feature range / focus |
|---:|---|---|---|
| 0 | Repository & tooling | **READY / NOT_STARTED** | engineering foundation |
| 1 | Identity/project foundation | NOT_STARTED | FTR-002..012 + guest-comms foundation hooks |
| 2 | Venues core | NOT_STARTED | FTR-013..028 + file basics |
| 3 | Tasks/decisions/Inbox | NOT_STARTED | FTR-029..035 |
| 4 | Import/export foundation | NOT_STARTED | FTR-036..044 + contact import safeguards |
| 5 | Budget/payments | NOT_STARTED | FTR-045..053 |
| 6 | Guests/invitations/RSVP/communications/seating | NOT_STARTED | FTR-054..063 + FTR-105..119 |
| 7 | Vendors/contracts | NOT_STARTED | FTR-064..068, FTR-089..093 as assigned |
| 8 | Dashboard/planning/timeline/search | NOT_STARTED | FTR-069..078 + RSVP actionable summaries |
| 9 | Map/access | NOT_STARTED | FTR-079..082 |
| 10 | Offline/PWA hardening | NOT_STARTED | FTR-083..088 + communication draft/send boundaries |
| 11 | Backup/recovery/providers/production | NOT_STARTED | FTR-094..099 + production provider evidence incl. FTR-120 |
| 12 | Existing data/cutover | NOT_STARTED | FTR-100..104 + contact/RSVP/provider cutover evidence |

`READY` is permission to begin only after explicit kickoff; it is not evidence of work already performed.

## Cross-lot checkpoints

| Checkpoint | Lots | State | Key expanded-V1 focus |
|---|---|---|---|
| A | 0–3 | NOT_STARTED | foundations, capability/provider boundaries + packet/lot evidence |
| B | 4–7 | NOT_STARTED | import + guests + RSVP + communications + seating + QIF/security integration + packet reconciliation |
| C | 8–10 | NOT_STARTED | dashboard/search/offline/PWA coherence + implementation maintainability |
| D | 11–12 | NOT_STARTED | real providers, recovery, costs, deliverability, real-device/QIF and cutover evidence |

## Current blockers

**Pre-Lot 0 design blockers: 0.**

No known unresolved BLOCKING or MAJOR pre-code design finding remains.

Runtime/tooling evidence intentionally does not exist yet because Lot 0 and all implementation Lots are still unstarted.

## Next permitted action

**Wait for an explicit Lot 0 kickoff request.**

Until then, do not:

- initialize Vite/TypeScript;
- create `package.json`, lockfile or toolchain;
- create GitHub Actions workflows;
- implement CI/CD;
- create Supabase migrations/configuration;
- create application source code;
- integrate provider SDKs/webhooks;
- send real Email/SMS/WhatsApp messages;
- mark any Feature ID implemented;
- create active Lot 0 Work Packets as if implementation had begun.

## Handoff summary

```text
V1 design: COMPLETE / FROZEN
Guest RSVP + communications: MERGED / FROZEN
AI Lot Orchestration: MERGED / FROZEN
Frozen Feature IDs: 120
Final Design Review: PASS
36 pre-Lot 0 criteria: 36/36 at 100/100 design
Implementation gate: OPEN
Lot 0: READY / NOT_STARTED
Features IMPLEMENTED: 0
Open pre-code BLOCKING/MAJOR findings: 0
Next permitted action: explicit future Lot 0 kickoff only
```

The repository is the canonical handoff. Chat history is supplementary only.