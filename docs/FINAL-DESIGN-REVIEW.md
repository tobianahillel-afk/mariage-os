# Mariage OS — Final Design Review

Status: **IN PROGRESS — implementation gate CLOSED**

Purpose: final pre-code review of the frozen V1 specification, including product fidelity, UX/visual architecture, data architecture, security, offline behavior, implementation governance and documentation coherence.

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
- coherent with intended UX/navigation/visual identity;
- assigned to implementation lot/Feature ID;
- reviewable later without relying on chat memory.

Overall PASS requires **zero unresolved BLOCKING or MAJOR findings**.

---

# 2. Review dimensions

| # | Dimension | Current state |
|---:|---|---|
| 1 | Product mission / couple jobs | REVIEWED |
| 2 | V1 / post-V1 scope | REVIEWED |
| 3 | Feature inventory / traceability | REVIEWED / mapped |
| 4 | User flows / acceptance scenarios | REVIEWED / mapped |
| 5 | UX information architecture | REVIEWED / strengthened |
| 6 | Navigation / route discoverability | REVIEWED / mapped |
| 7 | Screen composition / progressive disclosure | REVIEWED / strengthened |
| 8 | Visual identity / color system | REVIEWED / frozen |
| 9 | Motion / dynamic table-list behavior | REVIEWED / frozen |
| 10 | Image delivery / metadata / private SEO | REVIEWED / frozen |
| 11 | Mobile/tablet/desktop behavior | REVIEWED; implementation evidence later |
| 12 | Accessibility | REVIEWED; implementation evidence later |
| 13 | Cloud architecture | REVIEWED |
| 14 | Local-first / IndexedDB parity | REVIEWED / corrected |
| 15 | Synchronization / conflicts | REVIEWED |
| 16 | Offline capability classification | REVIEWED / corrected |
| 17 | Database / same-project integrity | REVIEWED / corrected |
| 18 | Facts/evidence/criteria | REVIEWED / corrected |
| 19 | Money / budget / payments | REVIEWED / corrected |
| 20 | Guests / households / seating | REVIEWED |
| 21 | Venues / access / vendors | REVIEWED |
| 22 | Tasks / decisions / Inbox / Search | REVIEWED |
| 23 | Planning / timeline | REVIEWED / corrected |
| 24 | Documents / contract readiness / media | REVIEWED / corrected |
| 25 | Import / external IDs / rollback | REVIEWED / corrected |
| 26 | Backup / restore / encryption | REVIEWED |
| 27 | Auth / invitation / RLS | REVIEWED / corrected |
| 28 | Privacy / external content / files | REVIEWED / corrected |
| 29 | Testing / quality gates | REVIEWED |
| 30 | Free-tier / operations / recovery | REVIEWED |
| 31 | Development anti-drift governance | REVIEWED / strengthened |
| 32 | Lot/checkpoint sequencing | REVIEWED / strengthened |
| 33 | Documentation precedence / stale wording | FINAL SCAN IN PROGRESS |
| 34 | PR review threads | REVIEWED / resolved |
| 35 | PR mergeability | BLOCKED / investigation required |
| 36 | Public repository hygiene | FINAL SCAN PENDING |

---

# 3. Findings register

## FDR-001 — No durable feature-by-feature implementation ledger

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: `FEATURE-LEDGER.md` with 104 V1 capabilities, lifecycle states, Feature Implementation Record template and living `IMPLEMENTATION-STATUS.md`.

## FDR-002 — No mandatory reset/integration review every few lots

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: mandatory Checkpoints A/B/C/D after Lots 0–3 / 4–7 / 8–10 / 11–12, with blocking finding policy and report template.

## FDR-003 — UX contracts allowed too much freedom in page composition

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: `UX-ARCHITECTURE.md`, `SCREEN-BLUEPRINTS.md`, route/job matrix, screen contracts and UX review gate now prohibit mega-pages/generic CRUD and define page/tab/drawer/dialog/table/mobile patterns.

## FDR-004 — Visual quality bar too abstract

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution:
  - `VISUAL-SYSTEM.md` becomes visual entry point;
  - `VISUAL-IDENTITY.md` freezes brand direction;
  - `COLOR-SYSTEM.md` freezes warm neutral, brand, domain and semantic palette architecture;
  - `DESIGN-SYSTEM.md` reconciled to frozen palette;
  - `VISUAL-REVIEW-CHECKLIST.md` makes commercial visual quality blockable;
  - major UI PRs require synthetic desktop/mobile visual evidence.

## FDR-005 — Requirements traceability did not include a stable Feature layer

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: Requirement → Feature → Acceptance/Evidence model, `REQUIREMENT-FEATURE-MATRIX.md`, `ACCEPTANCE-FEATURE-MATRIX.md`, Feature IDs in PR/checkpoint process.

## FDR-006 — Cloud/local model parity had gaps for later V1 objects

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: local schema reconciled for late-added V1 objects and offline classes.

## FDR-007 — Dependency graph did not cover late V1 dependencies

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: dependency/invalidation contract expanded for dates/origins/criteria/scenarios/seating/timeline/contracts.

## FDR-008 — Offline behavior insufficiently classified per action

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: explicit cached-read / queueable-edit / server-required / degraded behavior classification.

## FDR-009 — Trust/session/logout wording conflicted across docs

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: session expiry vs explicit logout/cache-purge semantics reconciled.

## FDR-010 — External ID rules could reintroduce nested-child collisions

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: type + namespace + parent-scoped nested external IDs normative across schema/import/identifier docs and acceptance tests.

## FDR-011 — Money representation had multiple authoritative strategies

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: integer minor units + explicit currency frozen for authoritative V1 money.

## FDR-012 — Null/missing/unknown semantics could diverge

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: data dictionary aligned with canonical import/fact-state semantics.

## FDR-013 — Requirement ↔ Feature ↔ Acceptance reconciliation

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: requirement/feature matrix plus acceptance/feature matrix added. Cross-cutting controls are represented explicitly rather than forced into arbitrary user features.
- Remaining implementation-time requirement: populate code/test evidence as features move through lifecycle.

## FDR-014 — Route / blueprint / feature inventory reconciliation

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: route→job→Feature→UX-pattern mapping added; screen blueprints and auth blueprints cover primary V1 surfaces and mobile paths.

## FDR-015 — Onboarding/auth composition under-specified

- Severity: **MINOR**
- Status: **RESOLVED**
- Resolution: blueprint-level flows now cover first owner, invitation acceptance, wrong identity/expiry, MFA/recovery, session expiry and safe logout with pending work.

## FDR-016 — Final stale-wording / precedence scan

- Severity: **MAJOR**
- Status: **OPEN**
- Progress:
  - old 40-scenario wording removed;
  - old future-threat wording removed;
  - old immediate `merge → Lot 0` wording removed from normative entry points;
  - old seating/timeline deferrals corrected;
  - palette deferral corrected.
- Known remaining exception: `PHYSICAL-SCHEMA-V1.md` header still contains historical `freeze candidate`; normative precedence of schema + addendum must be explicitly finalized without risking accidental schema rewrite.
- Required work: finish branch-wide sentry scan and record acceptable non-semantic exceptions.

## FDR-017 — Existing GitHub P1 review threads

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: all five P1 threads (same-project FKs, weekday mapping, payment model, nested external IDs, named scenarios) were rechecked, answered with normative evidence and marked resolved.

## FDR-018 — PR mergeability / branch state

- Severity: **MAJOR**
- Status: **OPEN**
- Current evidence: GitHub reports PR #4 `mergeable: false`.
- Required work: diagnose branch/base divergence or conflict, resolve it, then re-run final review against actual resulting head.

## FDR-019 — Public repository final secret/private-data scan

- Severity: **BLOCKING**
- Status: **OPEN**
- Required work: inspect final branch/diff for real names, guest data, private screenshots/files, secrets/tokens/backups/production identifiers. Any prohibited artifact must be removed before merge.

## FDR-020 — Implementation governance not reflected in secondary docs

- Severity: **MINOR**
- Status: **RESOLVED**
- Resolution: README, START-HERE, CONTRIBUTING, LOTS, completeness/readiness, Definition of Done and traceability now reference Feature Ledger/Playbook/checkpoints/UX review.

## FDR-021 — Exact visual palette previously deferred

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: palette architecture and concrete core tokens are frozen in `COLOR-SYSTEM.md`; `DEFERRED-DECISIONS.md` now defers only font family and implementation-level tonal mechanics, not the V1 color identity.

## FDR-022 — Motion/table dynamics were not sufficiently specified

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: `MOTION-INTERACTION.md` defines timing roles, route continuity, table/list sort/filter behavior, optimistic/sync transitions, image transitions, reduced-motion requirements and performance constraints.

## FDR-023 — SEO/image requirements risked being interpreted as public dynamic indexing

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: `SEO-METADATA-IMAGES.md` explicitly separates private app from optional public landing, keeps private routes non-index-oriented, forbids private OG metadata, and defines responsive image/privacy/performance behavior.

## FDR-024 — Visual benchmarking not documented

- Severity: **MINOR**
- Status: **RESOLVED**
- Resolution: `VISUAL-BENCHMARKS.md` records lessons from wedding products and strong data/productivity interfaces, with explicit originality/no-copy rule.

---

# 4. Current gate blockers

Implementation gate remains CLOSED because:

- **FDR-016** — branch-wide stale wording/precedence scan not fully closed;
- **FDR-018** — PR #4 currently non-mergeable;
- **FDR-019** — public repository privacy/secret scan not yet closed.

Lot 0 must not start while any remains OPEN.

---

# 5. Final PASS criteria

Before this document may state `IMPLEMENTATION GATE: OPEN`:

- [ ] all BLOCKING findings RESOLVED;
- [ ] all MAJOR findings RESOLVED;
- [ ] any remaining MINOR finding explicitly non-semantic/safe with owner/follow-up;
- [x] Requirement ↔ Feature ↔ Acceptance map reconciled;
- [x] Route ↔ UX blueprint ↔ Feature map reconciled;
- [x] visual identity/color/motion/image rules frozen enough to prevent generic implementation drift;
- [ ] master spec/scope/schema/local schema/security/lots final sentry scan agrees;
- [ ] public branch contains no prohibited private artifact/secret;
- [x] PR review threads resolved/responded;
- [ ] PR mergeability verified;
- [ ] final reviewed head SHA recorded;
- [ ] Run 4 merged into `main`.

Only after merge should this status be updated to record that the implementation gate is OPEN and `IMPLEMENTATION-STATUS.md` move Lot 0 from `NOT_STARTED` to `READY`.

Until then, the next permitted work is **documentation/review remediation only**.
