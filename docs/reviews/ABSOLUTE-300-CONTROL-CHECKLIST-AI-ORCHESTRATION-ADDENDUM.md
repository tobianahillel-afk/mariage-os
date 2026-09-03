# Mariage OS — Absolute 300-Control Checklist: AI Orchestration Addendum

Status: **Normative interpretation addendum — no new control IDs**

Purpose: extend the existing 300-control framework after introduction of Work Packet / three-pass Lot orchestration **without changing the invariant that the checklist contains exactly C001..C300**.

This addendum does not create C301+. It clarifies the evidence now required for existing controls affected by AI execution governance.

## Cold-start controls

### C002 — current status

When a Lot is active, `IMPLEMENTATION-STATUS.md` must include:
- current Lot;
- current Work Packet;
- packet state/pass;
- accepted packets;
- blockers;
- next permitted action.

### C004 — context routing

A whole-Lot request must route through `engineering/AI-LOT-ORCHESTRATION.md` before implementation.

### C008 — handoff

An interrupted Lot is not handoff-complete unless exact packet/pass state is durable.

### C009/C010 — cold-start simulations

Cold-start governance simulations must include at least:
- `Fais le Lot 1`;
- a large functional Lot such as Lot 2 or Lot 6;
- a high-risk systems/production Lot such as Lot 11;
- interruption/resume mid-packet;
- false Lot-completion attempt.

## Feature/traceability controls

### C028/C029

Feature impact/evidence now includes the owning Work Packet(s) and Pass A/B/C evidence where work was AI-orchestrated.

## Maintainability controls

### C080

Maintainability review is run at packet acceptance as applicable, again at Lot integration/acceptance, and again at checkpoints. Packet boundaries do not permit over-limit files/functions.

## Documentation / PR / review governance controls

### C271

README/START-HERE/INDEX/AGENTS/CONTRIBUTING must agree not only on gate/precedence but also that whole-Lot AI requests use Work Packet orchestration.

### C272

Stale normative wording includes:
- obsolete gate state;
- base-only Feature Ledger wording that ignores FTR-105..120;
- old Lot 6 wording omitting Invitations/RSVP/Communications;
- any statement implying one AI pass may complete an entire large Lot.

### C274

PR template evidence includes current Lot + Work Packet/pass and packet-level review/acceptance fields for AI-orchestrated work.

### C276

FIRs must link owning Work Packet/pass evidence where applicable.

### C277

Implementation Status updates after material work and while a Lot is active tracks the current packet/pass cursor.

### C278

Lot acceptance reconciliation now means all of the following:

1. complete current-lot Feature/control responsibility inventory exists;
2. every responsibility is assigned to at least one Work Packet before implementation;
3. every required packet completed Pass A IMPLEMENT, Pass B ADVERSARIAL REVIEW and Pass C ACCEPTANCE;
4. `required responsibilities - accepted/evidenced responsibilities = ∅`;
5. no elapsed Feature/current-lot responsibility remains unexplained;
6. separate Lot Integration Pass is green;
7. base + applicable addendum Lot acceptance is green.

A simple list of completed Feature IDs is insufficient C278 evidence.

### C279

Checkpoints review accumulated Work Packet/Lot evidence in addition to product/UX/architecture/security/data/testing/docs.

### C280

Major governance changes such as introduction/modification of the Lot Orchestrator require:
- cold-start simulations;
- systematic score review;
- stale wording scan;
- exact-head re-freeze evidence before implementation resumes.

## Final interpretation

The exact checklist remains **300 controls**. A future 300/300 claim must use this addendum when evaluating the controls above.

This design addendum itself does not mark runtime controls PASS. Actual packet execution, CI, tests and checkpoint evidence remain future implementation proof.