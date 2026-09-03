# Mariage OS — Final Design Review

Status: **IN PROGRESS — implementation gate CLOSED**

Purpose: final pre-code review of the frozen V1 specification, including product fidelity, UX architecture, data architecture, security, offline behavior, implementation governance and documentation coherence.

This file is the only document allowed to declare the pre-code implementation gate OPEN.

Current decision: **DO NOT START LOT 0.**

---

# 1. Review standard

A design area is not considered ready merely because a document exists. It must be:

- specific enough to implement without material guessing;
- consistent with master V1 scope;
- traceable to user need and verification;
- represented in cloud/local architecture where applicable;
- safe across security/privacy/offline/failure states;
- coherent with the intended UX/navigation;
- assigned to implementation lot/Feature ID;
- reviewable later without relying on chat memory.

Overall PASS requires **zero unresolved BLOCKING or MAJOR findings**.

---

# 2. Review dimensions

| # | Dimension | Current state |
|---:|---|---|
| 1 | Product mission / couple jobs | REVIEWED |
| 2 | V1 / post-V1 scope | REVIEWED |
| 3 | Feature inventory / traceability | REVIEW IN PROGRESS |
| 4 | User flows / acceptance scenarios | REVIEWED, reconciliation pending |
| 5 | UX information architecture | REVIEWED / strengthened |
| 6 | Navigation / route discoverability | REVIEWED, final inventory pending |
| 7 | Screen composition / progressive disclosure | REVIEWED / strengthened |
| 8 | Visual/design-system quality | REVIEWED / strengthened |
| 9 | Mobile/tablet/desktop behavior | REVIEWED, final route sample audit pending |
| 10 | Accessibility | REVIEWED, implementation evidence later |
| 11 | Cloud architecture | REVIEWED |
| 12 | Local-first / IndexedDB parity | REVIEWED / corrected |
| 13 | Synchronization / conflicts | REVIEWED |
| 14 | Offline capability classification | REVIEWED / corrected |
| 15 | Database / same-project integrity | REVIEWED / corrected |
| 16 | Facts/evidence/criteria | REVIEWED / corrected |
| 17 | Money / budget / payments | REVIEWED / corrected |
| 18 | Guests / households / seating | REVIEWED |
| 19 | Venues / access / vendors | REVIEWED |
| 20 | Tasks / decisions / Inbox / Search | REVIEWED |
| 21 | Planning / timeline | REVIEWED / corrected |
| 22 | Documents / contract readiness / media | REVIEWED / corrected |
| 23 | Import / external IDs / rollback | REVIEWED / corrected |
| 24 | Backup / restore / encryption | REVIEWED |
| 25 | Auth / invitation / RLS | REVIEWED / corrected |
| 26 | Privacy / external content / files | REVIEWED / corrected |
| 27 | Testing / quality gates | REVIEWED |
| 28 | Free-tier / operations / recovery | REVIEWED |
| 29 | Development anti-drift governance | REVIEWED / newly strengthened |
| 30 | Lot/checkpoint sequencing | REVIEWED / newly strengthened |
| 31 | Documentation precedence / stale wording | FINAL SCAN PENDING |
| 32 | PR review threads / mergeability | PENDING |
| 33 | Public repository hygiene | FINAL SCAN PENDING |

---

# 3. Findings register

## FDR-001 — No durable feature-by-feature implementation ledger

- Severity: **MAJOR**
- Area: Implementation governance
- Status: **RESOLVED**
- Problem: lots/requirements existed, but implementation could still lose track of individual user capabilities or call partially implemented behavior “done”.
- Resolution:
  - added `FEATURE-LEDGER.md` with 104 V1 capabilities;
  - standardized feature lifecycle;
  - added Feature Implementation Record requirements;
  - added living `IMPLEMENTATION-STATUS.md`.
- Verification: `IMPLEMENTATION-PLAYBOOK.md`, `FEATURE-LEDGER.md`, `IMPLEMENTATION-STATUS.md`.

## FDR-002 — No mandatory reset/integration review every few lots

- Severity: **MAJOR**
- Area: Development process / architecture drift
- Status: **RESOLVED**
- Problem: lots could individually pass while cross-feature architecture/UX gradually drifted.
- Resolution:
  - Checkpoint A after Lots 0–3;
  - Checkpoint B after Lots 4–7;
  - Checkpoint C after Lots 8–10;
  - Checkpoint D after Lots 11–12;
  - downstream groups blocked until checkpoint PASS.
- Verification: `roadmap/INTEGRATION-CHECKPOINTS.md`, `roadmap/LOTS.md`, `templates/CHECKPOINT-REPORT.md`.

## FDR-003 — UX contracts allowed too much freedom in actual page composition

- Severity: **MAJOR**
- Area: UX
- Status: **RESOLVED**
- Problem: route contracts/wireframes named content but did not sufficiently prevent giant forms/tables, poor page boundaries or generic CRUD implementation.
- Resolution:
  - `UX-ARCHITECTURE.md` defines screen taxonomy, one-screen/one-job, progressive disclosure, page/tab/drawer/dialog rules and anti-patterns;
  - `SCREEN-BLUEPRINTS.md` defines major page composition;
  - `UX-REVIEW-CHECKLIST.md` makes UX a blocking acceptance dimension;
  - `NAVIGATION.md` and `WIREFRAMES.md` reconciled.

## FDR-004 — Visual quality bar too abstract

- Severity: **MAJOR**
- Area: Visual design
- Status: **RESOLVED**
- Problem: “calm/elegant” alone was insufficient to prevent a technically correct but generic interface.
- Resolution:
  - strengthened `DESIGN-SYSTEM.md` with surface hierarchy, density, photography, typography, action hierarchy, tables/cards, motion and visual evidence rules;
  - major screen PRs require synthetic desktop/mobile review evidence.

## FDR-005 — Requirements traceability did not include a stable Feature layer

- Severity: **MAJOR**
- Area: Traceability
- Status: **RESOLVED**
- Problem: requirement→lot→test existed conceptually, but user capability progress could still be ambiguous.
- Resolution:
  - explicit Requirement → Feature → Evidence model;
  - updated `REQUIREMENTS-TRACEABILITY.md`;
  - Feature IDs required in PRs and checkpoint reconciliation.

## FDR-006 — Cloud/local model parity had gaps for later V1 objects

- Severity: **MAJOR**
- Area: Architecture/offline
- Status: **RESOLVED**
- Problem: frozen cloud model had objects not fully represented in local/offline architecture.
- Resolution: local schema reconciled for date options, origins/routes, personal state, scenarios, seating, Inbox, timeline, tags, mapping/evidence and document review metadata.

## FDR-007 — Dependency graph did not cover all late-added V1 dependencies

- Severity: **MAJOR**
- Area: Derived data
- Status: **RESOLVED**
- Resolution: dependency/invalidation contract expanded for dates/origins/criteria/scenarios/seating/timeline/contracts.

## FDR-008 — Offline behavior insufficiently classified per action

- Severity: **MAJOR**
- Area: Offline/security/data integrity
- Status: **RESOLVED**
- Resolution: explicit distinction between cached read, queueable edit, server-required protected action and degraded behavior.

## FDR-009 — Trust/session/logout wording conflicted across docs

- Severity: **MAJOR**
- Area: Security/offline UX
- Status: **RESOLVED**
- Resolution: explicit session-expiry vs explicit logout model and cache rules.

## FDR-010 — External ID rules could reintroduce nested-child collisions

- Severity: **MAJOR**
- Area: Import/data identity
- Status: **RESOLVED**
- Resolution: type + namespace + parent-scoped nested external IDs made normative across schema/identifier/import docs.

## FDR-011 — Money representation had more than one permitted authoritative strategy

- Severity: **MAJOR**
- Area: Finance/data semantics
- Status: **RESOLVED**
- Resolution: V1 authoritative money frozen to integer minor units + explicit currency.

## FDR-012 — Null/missing/unknown semantics could diverge across forms/imports

- Severity: **MAJOR**
- Area: Data semantics
- Status: **RESOLVED**
- Resolution: data dictionary aligned with canonical import/fact-state semantics.

## FDR-013 — Final Requirement ↔ Feature ↔ Acceptance reconciliation not yet mechanically reviewed

- Severity: **MAJOR**
- Area: Traceability
- Status: **OPEN**
- Required work:
  1. verify every P0/P1 maps to Feature IDs or a documented cross-cutting control;
  2. verify every Feature ID has at least one requirement/flow/acceptance or explicit engineering-control justification;
  3. identify missing acceptance coverage;
  4. resolve orphan/duplicate mappings before gate opens.

## FDR-014 — Final route / blueprint / feature inventory reconciliation pending

- Severity: **MAJOR**
- Area: UX/product discoverability
- Status: **OPEN**
- Required work:
  - enumerate every V1 primary route;
  - map route → primary user job → Feature IDs → feature contract → blueprint pattern;
  - ensure no feature is reachable only through an obscure route;
  - ensure no duplicate route creates parallel truth;
  - ensure mobile path exists.

## FDR-015 — Detailed onboarding/auth screen composition still less rich than core planning screens

- Severity: **MINOR**
- Area: UX
- Status: **OPEN**
- Required work: add/review blueprint-level composition for login, partner invite acceptance, first-owner setup, MFA/recovery and safe logout/pending-work sheet.
- Rationale for MINOR: functional/auth/security contract is already detailed; this is visual/flow refinement rather than missing security semantics.

## FDR-016 — Final stale-wording / precedence scan pending

- Severity: **MAJOR**
- Area: Documentation coherence
- Status: **OPEN**
- Required work: scan branch for obsolete normative phrases such as old V1 deferrals, “future” docs that now exist, outdated lot-next wording, old navigation names, old scenario counts and superseded schema statements.

## FDR-017 — Existing GitHub PR review threads not yet formally closed/responded

- Severity: **MAJOR**
- Area: Review governance
- Status: **OPEN**
- Required work: verify each P1 review finding is covered by committed correction, reply with evidence, resolve thread if appropriate.

## FDR-018 — PR mergeability / branch state final verification pending

- Severity: **MAJOR**
- Area: Repository readiness
- Status: **OPEN**
- Required work: determine why PR currently reports non-mergeable if still true, resolve conflicts/branch divergence, then re-run final review against actual head SHA.

## FDR-019 — Public repository final secret/private-data scan pending

- Severity: **BLOCKING**
- Area: Privacy/repository hygiene
- Status: **OPEN**
- Required work: inspect final branch/public diff for real names/guest data/private files/secrets/tokens/backups/production identifiers that must not be public; any such artifact must be removed safely before merge.

## FDR-020 — Implementation governance documents not yet reflected in every secondary process doc

- Severity: **MINOR**
- Area: Documentation integration
- Status: **PARTIALLY RESOLVED**
- Already integrated into README, START-HERE, INDEX, CONTRIBUTING, LOTS, completeness and readiness.
- Remaining check: Definition of Done / Lot Acceptance / CI-CD references where useful, without duplicating entire contracts.

## FDR-021 — Exact visual palette/font remains intentionally deferred

- Severity: **NOTE**
- Area: Visual design
- Status: **ACCEPTED DEFERRED**
- Reason: choosing exact accessible tokens after implementation begins is legitimate as long as `DESIGN-SYSTEM.md`, UX architecture and review criteria remain binding.

---

# 4. Current gate blockers

Implementation gate remains CLOSED because the following unresolved findings are not MINOR-only:

- FDR-013 — full traceability reconciliation;
- FDR-014 — full route/blueprint/feature reconciliation;
- FDR-016 — stale wording/precedence scan;
- FDR-017 — PR review threads;
- FDR-018 — mergeability;
- FDR-019 — repository privacy/secret scan.

Lot 0 must not start while any remains OPEN.

---

# 5. Final PASS criteria

Before this document may state `IMPLEMENTATION GATE: OPEN`:

- [ ] all BLOCKING findings RESOLVED;
- [ ] all MAJOR findings RESOLVED;
- [ ] any remaining MINOR finding explicitly non-semantic/safe with owner/follow-up;
- [ ] Requirement ↔ Feature ↔ Acceptance map reconciled;
- [ ] Route ↔ UX blueprint ↔ Feature map reconciled;
- [ ] master spec/scope/schema/local schema/security/lots agree;
- [ ] public branch contains no prohibited private artifact/secret;
- [ ] PR review threads resolved/responded;
- [ ] PR mergeability verified;
- [ ] final reviewed head SHA recorded;
- [ ] Run 4 merged into `main`.

Only after merge should this status be updated to record that the implementation gate is OPEN and `IMPLEMENTATION-STATUS.md` move Lot 0 from `NOT_STARTED` to `READY`.

Until then, the next permitted work is **documentation/review remediation only**.
