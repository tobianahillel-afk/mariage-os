# Mariage OS — Implementation Status Board

Status: **Living repository source of truth for development progress**

Purpose: answer “where exactly are we?” without relying on chat history, memory or interpretation of recent commits.

## Current phase

**Pre-code V1 documentation/design: COMPLETE / previously FROZEN.**

**AI Lot Orchestration governance enhancement: REVIEW / RE-FREEZE IN PROGRESS on this branch.**

The product V1 scope is unchanged: 120 Feature IDs. This change strengthens how a simple user request such as `Fais le Lot N` is executed safely by AI agents.

**Implementation gate for starting Lot 0 from this branch: HOLD until orchestration review/re-certification is merged and post-merge status is resealed.**

**Lot 0 remains READY / NOT_STARTED. Do not start it during this documentation re-freeze.**

No application/tooling implementation work has started.

## Frozen V1 feature inventory

The authoritative V1 feature set remains the union of:

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

## AI Lot Orchestration change under review

Normative additions/updates include:

- `../engineering/AI-LOT-ORCHESTRATION.md` — Lot Orchestrator, packet sizing, sanity ranges, three-pass review, reconciliation and integration;
- `../templates/WORK-PACKET-RECORD.md` — durable packet/pass evidence;
- `../engineering/IMPLEMENTATION-PLAYBOOK.md` — Work Packets mandatory inside Lots;
- `../engineering/DEFINITION-OF-DONE.md` — packet/lot completion gates;
- `LOT-ACCEPTANCE.md` — current gate wording + complete Lot 6 scope + packet closure rules;
- `LOTS.md` — current frozen state + high-risk Lot decomposition guidance;
- root `AGENTS.md`, `START-HERE.md`, `V1-FROZEN-MANIFEST.md`, `CONTRIBUTING.md`, LLM routing and PR template — discoverability/handoff enforcement.

## Intended execution model after re-freeze

A user may simply request:

```text
Fais le Lot N
```

The AI must internally execute:

```text
Lot inventory
→ complete responsibility coverage map
→ bounded Work Packets
→ Pass A IMPLEMENT
→ Pass B ADVERSARIAL REVIEW
→ Pass C ACCEPTANCE
→ mechanical Lot reconciliation
→ Lot Integration Pass
→ Lot acceptance
→ Checkpoint if applicable
```

Default: one Work Packet `IN_PROGRESS` at a time. During an active Lot this status board must persist current Lot, packet, pass, accepted packets, blockers and next action.

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
| 0 | Repository & tooling | **READY / HOLD / NOT_STARTED** | engineering foundation; explicit kickoff forbidden during re-freeze |
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

## Cross-lot checkpoints

| Checkpoint | Lots | State | Key expanded-V1 focus |
|---|---|---|---|
| A | 0–3 | NOT_STARTED | foundations, capability/provider boundaries + packet/lot evidence |
| B | 4–7 | NOT_STARTED | import + guests + RSVP + communications + seating + QIF/security integration + packet reconciliation |
| C | 8–10 | NOT_STARTED | dashboard/search/offline/PWA coherence + implementation maintainability |
| D | 11–12 | NOT_STARTED | real providers, recovery, costs, deliverability, real-device/QIF and cutover evidence |

## Current review tasks before orchestration re-freeze

1. verify user can request only `Fais le Lot N` and agent owns safe decomposition;
2. verify packet size/complexity limits prevent giant hidden sub-lots;
3. verify all required Feature/control responsibilities must be covered before code starts;
4. verify mandatory Pass A/B/C cannot be bypassed;
5. verify session interruption resumes exact packet/pass;
6. verify Lot closure requires empty mechanical reconciliation + integration pass;
7. verify base/addendum Lot acceptance and checkpoints remain higher-level gates;
8. remove stale gate/ledger/scope wording from active normative docs;
9. re-run 36-criterion pre-Lot 0 design certification;
10. final sentry/repository hygiene + exact-head review, then merge/reseal `main`.

## Next permitted action

**Documentation/review/re-freeze only. Do not start Lot 0.**

Forbidden during this phase:

- Vite/TypeScript initialization;
- package/toolchain creation;
- GitHub Actions implementation;
- Supabase migrations/configuration implementation;
- application source code;
- provider SDK integration;
- real Email/SMS/WhatsApp send;
- Feature ID implementation.

## Handoff summary

```text
V1 product design: COMPLETE / scope unchanged
Frozen Feature IDs: 120
Current change: AI Lot Orchestrator + Work Packets + 3-pass execution
Orchestration review: IN PROGRESS
Implementation gate for Lot 0 kickoff: HOLD on this branch
Lot 0: READY / NOT_STARTED
Features IMPLEMENTED: 0
Next permitted action: documentation coherence review + 36-criterion re-certification only
```

The repository is the canonical handoff. Chat history is supplementary only.