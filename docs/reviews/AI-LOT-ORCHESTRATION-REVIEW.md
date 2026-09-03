# Mariage OS — AI Lot Orchestration Review

Status: **FINAL PRE-MERGE DESIGN REVIEW — AI EXECUTION GOVERNANCE**

Purpose: verify that a human can safely use simple commands such as `Fais le Lot 1`, `Fais le Lot 2`, etc. without manually decomposing work, while preventing an AI from skipping capabilities, overloading one context, leaving hidden partial work or advancing to the next Lot before objective completion.

This review is pre-code. It evaluates the **execution design**, not runtime implementation evidence.

---

## 1. Review question

Can a context-free AI receive only:

> `Fais le Lot N`

and safely determine:

- what must be implemented;
- how to split the Lot into bounded work;
- what order to use;
- what current packet/pass is active;
- what proves each packet complete;
- what proves the Lot complete;
- when the next Lot is forbidden;
- how another AI resumes if the session stops?

### Result

**PASS — after the orchestration changes in this branch.**

---

## 2. Problems found before this review

### AIO-001 — Lot was a milestone but no explicit maximum AI execution unit

Severity before fix: **MAJOR**

Existing playbook correctly said feature-by-feature, but a naive agent could still treat `Do Lot 6` as a long monolithic implementation effort.

Resolution:
- normative `engineering/AI-LOT-ORCHESTRATION.md`;
- Work Packet as maximum normal AI implementation unit;
- packet complexity/sizing rules;
- lot-level sanity ranges.

Status: **RESOLVED**.

### AIO-002 — No mandatory independent three-pass packet review

Severity before fix: **MAJOR**

Feature verification/PR review existed, but no universal contract forced separate implementation, adversarial review and mechanical acceptance for each bounded execution unit.

Resolution:
- Pass A IMPLEMENT;
- Pass B ADVERSARIAL REVIEW;
- Pass C ACCEPTANCE / RECONCILIATION;
- packet cannot self-promote from implementation to accepted;
- BLOCKING/MAJOR review finding returns packet to implementation.

Status: **RESOLVED**.

### AIO-003 — No mechanical whole-Lot set reconciliation

Severity before fix: **MAJOR**

Feature Ledger rules prevented unexplained missing rows, but the exact required-vs-evidenced set operation was not a named mandatory orchestration step.

Resolution:

```text
Required current-lot Feature/control responsibilities
MINUS
Accepted/evidenced responsibilities
= ∅
```

is now mandatory before Lot closure.

Status: **RESOLVED**.

### AIO-004 — Accepted packets could still fail as an integrated Lot

Severity before fix: **MAJOR**

Individual feature/packet success does not prove cross-packet flows/invalidation work together.

Resolution:
- separate mandatory Lot Integration Pass after packet reconciliation and before Lot acceptance.

Status: **RESOLVED**.

### AIO-005 — Session interruption had feature handoff but no explicit packet/pass cursor

Severity before fix: **MAJOR**

A future AI could know the Lot but not exactly whether it should implement, review or accept the current sub-work.

Resolution:
`IMPLEMENTATION-STATUS.md` must record current Lot, Work Packet, packet state/pass, accepted packets, blockers and next action while a Lot is active.

Status: **RESOLVED**.

### AIO-006 — Coarse decomposition could technically satisfy “use packets”

Severity before fix: **MAJOR**

An AI might create only 2–3 giant packets for Lot 6 or Lot 11.

Resolution:
- per-packet target ≤8 planning points;
- 9–10 requires cohesion review;
- >10 normally requires split;
- lot-level sanity ranges;
- lower-than-range plan requires `COARSE-PACKET JUSTIFICATION`;
- explicit warning that Lot 6/11 cannot collapse into three giant pseudo-packets without exceptional rationale.

Status: **RESOLVED**.

### AIO-007 — Active contributor guide had stale implementation gate

Severity before fix: **MAJOR for context-free navigation**

`CONTRIBUTING.md` still said `Current state: CLOSED` after the main status had become OPEN/READY.

Resolution:
- contributor guide no longer hard-codes the gate as permanent truth;
- current status is explicitly delegated to `IMPLEMENTATION-STATUS.md` + `FINAL-DESIGN-REVIEW.md`.

Status: **RESOLVED**.

### AIO-008 — Base Lot acceptance still described old Lot 6

Severity before fix: **MAJOR**

The guest-communications addendum was correct, but base `LOT-ACCEPTANCE.md` still presented Lot 6 primarily as Guests + Seating, increasing the chance of an agent ignoring RSVP/communications.

Resolution:
- base Lot 6 now explicitly includes Guests + Invitations/RSVP + Communications + Seating;
- addendum is explicitly mandatory and non-optional.

Status: **RESOLVED**.

### AIO-009 — Active implementation docs referred only to base Feature Ledger

Severity before fix: **MAJOR for FTR-105..120 handoff**

`IMPLEMENTATION-PLAYBOOK.md`, `DEFINITION-OF-DONE.md` and `CONTRIBUTING.md` contained singular/base-ledger wording.

Resolution:
- active execution docs explicitly use the union FTR-001..104 + FTR-105..120.

Status: **RESOLVED**.

### AIO-010 — PR/FIR lacked packet/pass traceability

Severity before fix: **MODERATE**

Resolution:
- Work Packet/pass fields added to PR review template;
- FIR links packet/pass and Pass A/B/C evidence;
- Work Packet Record template added.

Status: **RESOLVED**.

---

## 3. New execution hierarchy

```text
User: "Fais le Lot N"
        ↓
Lot kickoff
        ↓
Complete current-lot responsibility inventory
        ↓
Dependency graph / Lot Coverage Matrix
        ↓
Bounded Work Packet plan
        ↓
WP-N.1
  A IMPLEMENT
  B ADVERSARIAL REVIEW
  C ACCEPTANCE
        ↓
WP-N.2 ... WP-N.k
        ↓
Mechanical Lot reconciliation = empty
        ↓
Lot Integration Pass
        ↓
Base + addendum Lot Acceptance
        ↓
Checkpoint if required
        ↓
Only then next dependent Lot
```

The human is never required to manually request packets.

---

## 4. Packet sizing review

Normal packet target:

- 1–3 primary Feature IDs or one tightly coupled foundation concern;
- one primary bounded context;
- 0–3 important UI surfaces;
- 0–5 persistent entities/tables;
- localized architecture/security boundary;
- one reviewable migration/RLS/API family;
- ≤8 planning complexity points target.

The packet count ranges are planning sentries, not quotas.

High-risk examples:

- Lot 2: 8–12 typical packets;
- Lot 4: 7–10;
- Lot 5: 6–9;
- Lot 6: **15–25**;
- Lot 10: 6–9;
- Lot 11: **10–15**;
- Lot 12: 6–10.

Result: **PASS**. The protocol now makes a 2–3-packet Lot 6/11 plan suspicious by construction.

---

## 5. Simulation — `Fais le Lot 1`

Expected agent behavior:

1. read current gate/status;
2. inventory FTR-002..012 current-lot responsibilities + guest-capability/settings foundation hooks + Lot 1 cross-cutting security controls;
3. produce approximately 6–9 packets such as Auth/session, project/member model, partner invitation, RLS/same-project integrity, protected shell, repository/local foundation, sync/logout, settings/capability hooks, integration;
4. assign every responsibility;
5. execute one packet at a time through A/B/C;
6. reconcile and run Lot 1 integration;
7. Lot 1 cannot close if project isolation/invite/session/local boundary evidence is missing.

Could an agent legitimately jump to Lot 2 because the UI shell exists? **NO**.

Result: **PASS**.

---

## 6. Simulation — `Fais le Lot 2`

Lot 2 contains venue lifecycle, facts/evidence, spaces, offers, ratings, media/documents, access and multiple UI surfaces.

Expected planning range: 8–12 packets.

A plan such as `WP-2.1 Backend venues`, `WP-2.2 Frontend venues` would violate vertical-slice guidance and likely exceed complexity limits.

The Lot Integration Pass must demonstrate a synthetic venue with conflicting evidence, multiple spaces, route observations, offers and independent partner ratings across create/compare/reject/restore/export behavior.

Result: **PASS**.

---

## 7. Simulation — `Fais le Lot 6`

This is the primary stress test.

Required responsibilities include base guest/seating features plus FTR-105..119 and cross-cutting RSVP/COM/QIF/security/offline/import/backup integration controls.

Expected planning range: **15–25 packets**.

A valid plan may include separate packets for household/person domain, probability/statistics, contact points, invitation capability lifecycle, public guest DTO/endpoint, mobile RSVP, +1/questions, history/invalidation, QR/manual fallback, campaign core, template personalization, provider ports/fakes, Email test adapter, SMS test adapter, WhatsApp test adapter, webhook normalization, retry/suppression/scheduling model, couple workspace/QIF, seating, and cross-domain integration.

The agent cannot close the Lot merely because one WhatsApp sandbox send succeeds or the guest table renders.

Required Lot Integration chain includes:

```text
household/contact
→ invitation
→ share/campaign
→ RSVP
→ statistics
→ seating readiness
→ budget/dashboard invalidation
```

Result: **PASS**.

---

## 8. Simulation — `Fais le Lot 11`

Primary risk: compression of backup/recovery, security hardening, providers and release readiness.

Expected planning range: **10–15 packets**.

A three-packet plan `Backup / Security / Providers` is explicitly considered implausibly coarse without exceptional proof.

Provider-specific production configuration, webhook evidence, cost caps, backup/restore, RLS/security matrix and release readiness remain separately reviewable.

Result: **PASS**.

---

## 9. Session interruption simulation

State before interruption:

```text
Current Lot: 6
Current Packet: WP-6.8
Packet State: REVIEW_PENDING
Accepted: WP-6.1..WP-6.7
Next: Pass B adversarial review WP-6.8
```

New context-free agent must resume Pass B of WP-6.8. It cannot restart Lot 6 or advance to WP-6.9 merely from chat wording.

Result: **PASS**.

---

## 10. “False completion” attack simulation

Scenario: implementing agent says “Lot 6 is done” after implementing 18/22 planned responsibilities.

Required controls reject closure because:

- some packets are not accepted;
- `required - accepted/evidenced ≠ ∅`;
- affected Feature statuses remain unreconciled;
- Lot Integration Pass/Acceptance cannot start cleanly.

Result: **PASS**.

---

## 11. Architecture/quality interaction

Work Packets do not weaken existing code rules:

- file target ≤200 logical lines; hard default 400;
- function target ≤30; hard default 60;
- cyclomatic target ≤8;
- nesting target ≤3;
- positional parameters target ≤4;
- cycles forbidden;
- layer boundaries frozen;
- generic utility dumping grounds forbidden;
- TODO/FIXME/HACK/TEMP tracked or rejected.

A small Work Packet that generates a god file still fails.

Result: **PASS**.

---

## 12. Review independence

Pass B is designed to reduce self-confirmation bias:

- fresh/cold context or separate reviewer when environment supports it;
- otherwise explicit contract re-read required;
- reviewer searches for omissions/adversarial cases rather than confirming author summary.

Pass C is a distinct mechanical reconciliation step.

Result: **PASS at design level**. Actual separate-agent/cold-context automation, where supported, will be implementation/process evidence during Lots.

---

## 13. Remaining runtime-only evidence

Not claimable pre-code:

- whether CI actually enforces every quality rule;
- whether implementation agents follow packet states correctly in practice;
- actual average packet size/complexity;
- actual cold-review defect discovery rate;
- runtime tests/coverage/RLS/security/accessibility;
- production release/cutover evidence.

These are not design defects. They must be measured during implementation/checkpoints.

---

## 14. Final scores for AI execution governance

| Dimension | Before review | After remediation |
|---|---:|---:|
| Development-rule specificity | 96/100 | **100/100 design** |
| Feature omission protection | 94/100 | **100/100 design** |
| Lot direct executability from simple user command | 60/100 | **100/100 design** |
| Session resumability | 95/100 | **100/100 design** |
| Independent review / self-confirmation resistance | 82/100 | **100/100 design** |
| Mechanical Lot completion proof | 88/100 | **100/100 design** |

Overall AI-lot execution design result: **PASS — 100/100 pre-code design readiness**.

This does not claim runtime implementation perfection; it certifies that the repository now specifies how to obtain and prove it.