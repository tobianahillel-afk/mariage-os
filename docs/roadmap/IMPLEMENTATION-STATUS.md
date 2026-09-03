# Mariage OS — Implementation Status Board

Status: **Living repository source of truth for development progress**

Purpose: answer “where exactly are we?” without relying on chat history, memory or interpretation of recent commits.

This file is updated whenever a material feature/lot/checkpoint changes state.

---

# Current phase

**Documentation/design finalization. Implementation gate: CLOSED.**

Lot 0 has not started.

Gate opens only when `FINAL-DESIGN-REVIEW.md` passes with no unresolved BLOCKING/MAJOR finding and documentation Run 4 is merged to `main`.

---

# Lot status

Allowed lot states:
- `NOT_STARTED`
- `READY`
- `IN_PROGRESS`
- `LOT_REVIEW`
- `CHECKPOINT_REVIEW`
- `ACCEPTED`
- `BLOCKED`

| Lot | Name | State | Feature range / focus | Exit evidence |
|---:|---|---|---|---|
| 0 | Repository & tooling | NOT_STARTED | engineering foundation | — |
| 1 | Identity/project foundation | NOT_STARTED | FTR-002..012 | — |
| 2 | Venues core | NOT_STARTED | FTR-013..028 + file basics | — |
| 3 | Tasks/decisions/Inbox | NOT_STARTED | FTR-029..035 | — |
| 4 | Import/export foundation | NOT_STARTED | FTR-036..044 | — |
| 5 | Budget/payments | NOT_STARTED | FTR-045..053 | — |
| 6 | Guests/households/seating | NOT_STARTED | FTR-054..063 | — |
| 7 | Vendors/contracts | NOT_STARTED | FTR-064..068, 089..093 as assigned | — |
| 8 | Dashboard/planning/timeline/search | NOT_STARTED | FTR-069..078 | — |
| 9 | Map/access | NOT_STARTED | FTR-079..082 | — |
| 10 | Offline/PWA hardening | NOT_STARTED | FTR-083..088 | — |
| 11 | Backup/recovery/production | NOT_STARTED | FTR-094..099 + hardening | — |
| 12 | Existing data/cutover | NOT_STARTED | FTR-100..104 | — |

---

# Cross-lot checkpoints

| Checkpoint | Lots | State | Report |
|---|---|---|---|
| A — Foundation & Core Decision Loop | 0–3 | NOT_STARTED | `reviews/CHECKPOINT-A-REPORT.md` when executed |
| B — Data Intake & Operational Core | 4–7 | NOT_STARTED | `reviews/CHECKPOINT-B-REPORT.md` |
| C — Product Control & Offline | 8–10 | NOT_STARTED | `reviews/CHECKPOINT-C-REPORT.md` |
| D — Recovery & Cutover | 11–12 | NOT_STARTED | `reviews/CHECKPOINT-D-REPORT.md` |

See `INTEGRATION-CHECKPOINTS.md`.

---

# Feature status summary

Authoritative feature rows: `../FEATURE-LEDGER.md`.

Before implementation:
- 104 V1 Feature IDs: `SPECIFIED`;
- `READY`: 0;
- `IN_PROGRESS`: 0;
- `IMPLEMENTED`: 0;
- `VERIFIED`: 0;
- `INTEGRATED`: 0;
- `ACCEPTED`: 0;
- `BLOCKED`: 0 unless final design review identifies a feature-specific blocker.

During development this summary must be reconciled against the ledger; do not manually claim percentages that are not derivable from feature/lot states.

---

# Current blockers / review work

Current pre-code items:

1. complete final UX/product/architecture documentation review;
2. create/finalize `FINAL-DESIGN-REVIEW.md`;
3. reconcile documentation index/entry points with new governance + UX docs;
4. inspect PR review threads/mergeability;
5. confirm public repository contains no real wedding data/secrets;
6. merge Run 4 only after review PASS.

---

# Progress update protocol

After each material implementation session or PR, update:

- current phase;
- lot state;
- affected Feature IDs/statuses;
- new/resolved blockers;
- latest verification evidence;
- checkpoint state if applicable;
- next permitted action.

Do not record progress as a vague percentage unless the calculation method is stated. Prefer counts such as:

```text
Lot 2: 9/16 features VERIFIED, 5 IN_PROGRESS, 2 READY
Checkpoint A: not yet eligible
Open MAJOR findings: 1
```

---

# Handoff summary template

At the end of a long development/review run, append/update a concise handoff section:

```text
Last reviewed commit:
Current lot:
Current feature(s):
Last feature accepted:
Pending feature(s):
Open blockers:
Last full verify result:
Last UX review:
Last checkpoint:
Next permitted action:
```

The repository status board is the canonical handoff. Chat is supplementary only.
