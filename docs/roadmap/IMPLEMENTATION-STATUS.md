# Mariage OS — Implementation Status Board

Status: **Living repository source of truth for development progress**

Purpose: answer “where exactly are we?” without relying on chat history, memory or interpretation of recent commits.

## Current phase

**Pre-code V1 documentation/design: COMPLETE / FROZEN.**

**Expanded V1 guest RSVP + Email/SMS/WhatsApp scope: REVIEWED / MERGED / FROZEN.**

**Implementation gate: OPEN.**

**Lot 0: READY / NOT_STARTED.**

No application/tooling implementation work has started.

PR #5 merged the reviewed scope change from exact sealed head `96b18f04e6b2af9f21614751096cca7db00a88ea` into `main` (merge commit `7088d4c48aa9043733bbc015235a538ee4c06120`). The post-merge Final Design Review is PASS.

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

## Final pre-Lot 0 evidence

- `../FINAL-DESIGN-REVIEW.md` — PASS / gate open;
- `../V1-FROZEN-MANIFEST.md` — frozen V1 composition/precedence;
- `../reviews/PRE-LOT0-36-CRITERIA-CERTIFICATION.md` — 36/36 criteria at 100/100 for the expanded V1;
- `../reviews/V1-GUEST-COMMUNICATIONS-SCOPE-CHANGE-REVIEW.md` — scope-change coherence audit;
- `../reviews/LLM-GUEST-COMMUNICATIONS-COLD-START-REVIEW.md` — no-context agent takeover review;
- `../quality/GUEST-COMMUNICATIONS-ACCEPTANCE.md` — 60 dedicated guest-communication acceptance scenarios;
- PR #5 exact-head sentry comment + successful exact-head merge;
- `../reviews/ABSOLUTE-300-CONTROL-CHECKLIST.md` — cross-phase maturity controls;
- `../reviews/100-PERCENT-GAP-PLAN.md` — design → implementation → production → V2 maturity path.

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

`READY` is permission to start after explicit kickoff, not evidence of work performed.

## Cross-lot checkpoints

| Checkpoint | Lots | State | Key expanded-V1 focus |
|---|---|---|---|
| A | 0–3 | NOT_STARTED | foundations, capability/provider boundaries |
| B | 4–7 | NOT_STARTED | import + guests + RSVP + communications + seating + QIF/security integration |
| C | 8–10 | NOT_STARTED | dashboard/search/offline/PWA communication coherence |
| D | 11–12 | NOT_STARTED | real providers, recovery, costs, deliverability, real-device/QIF and cutover evidence |

## Current blockers

**Pre-Lot 0 design blockers: 0.**

No known unresolved BLOCKING or MAJOR pre-code design finding remains.

Runtime/tooling evidence intentionally does not exist yet because Lot 0 and all implementation lots are still unstarted.

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
- mark any Feature ID implemented.

## Handoff summary

```text
V1 design: COMPLETE / FROZEN
Guest RSVP + communications scope: MERGED / FROZEN
Frozen Feature IDs: 120
Final Design Review: PASS
36 pre-Lot 0 criteria: 36/36 at 100/100
Implementation gate: OPEN
Lot 0: READY / NOT_STARTED
Features IMPLEMENTED: 0
Open pre-code BLOCKING/MAJOR findings: 0
Next permitted action: explicit future Lot 0 kickoff only
```

The repository is the canonical handoff. Chat history is supplementary only.