# Mariage OS — Final Design Review

Status: **IN PROGRESS — implementation gate CLOSED**

Purpose: final pre-code review of the frozen V1 specification, including product fidelity, UX/visual architecture, public-SaaS readiness, data architecture, security, offline behavior, code maintainability, context-free agent recoverability, implementation governance and documentation coherence.

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
- compatible with frozen public-ready multi-tenant architecture even though real V1 deployment is private;
- assigned to implementation lot/Feature/cross-cutting requirement;
- physically placeable in a predictable code architecture with enforceable maintainability guardrails;
- reviewable/resumable later without relying on chat memory.

Overall PASS requires **zero unresolved BLOCKING or MAJOR findings**.

---

# 2. Review dimensions

| # | Dimension | Current state |
|---:|---|---|
| 1 | Product mission / couple jobs | REVIEWED |
| 2 | V1 / post-V1 scope | REVIEWED |
| 3 | Private-V1 vs public-SaaS readiness boundary | REVIEWED / strengthened |
| 4 | Multi-tenant tenancy/project context | REVIEWED / frozen |
| 5 | Feature inventory / traceability | REVIEWED / mapped |
| 6 | User flows / acceptance scenarios | REVIEWED / mapped |
| 7 | UX information architecture | REVIEWED / strengthened |
| 8 | Navigation / route discoverability | REVIEWED / project-scoped addendum |
| 9 | Screen composition / progressive disclosure | REVIEWED / strengthened |
| 10 | Visual identity / color system | REVIEWED / frozen |
| 11 | Motion / dynamic table-list behavior | REVIEWED / frozen |
| 12 | Image delivery / metadata / private SEO | REVIEWED / frozen |
| 13 | Public web shell / future marketing SEO boundary | REVIEWED / frozen |
| 14 | Mobile/tablet/desktop behavior | REVIEWED; implementation evidence later |
| 15 | Accessibility | REVIEWED; implementation evidence later |
| 16 | Cloud architecture | REVIEWED |
| 17 | Local-first / IndexedDB parity | REVIEWED / corrected |
| 18 | Synchronization / conflicts | REVIEWED |
| 19 | Offline capability classification | REVIEWED / corrected |
| 20 | Database / same-project integrity | REVIEWED / corrected |
| 21 | Facts/evidence/criteria | REVIEWED / corrected |
| 22 | Money / budget / payments | REVIEWED / corrected |
| 23 | Guests / households / seating | REVIEWED |
| 24 | Venues / access / vendors | REVIEWED |
| 25 | Tasks / decisions / Inbox / Search | REVIEWED |
| 26 | Planning / timeline | REVIEWED / corrected |
| 27 | Documents / contract readiness / media | REVIEWED / corrected |
| 28 | Import / external IDs / rollback | REVIEWED / corrected |
| 29 | Backup / restore / encryption | REVIEWED |
| 30 | Auth / invitation / authorization / RLS | REVIEWED / strengthened |
| 31 | Future public signup/abuse/launch boundary | REVIEWED / specified, activation post-V1 |
| 32 | Privacy / external content / files | REVIEWED / corrected |
| 33 | Testing / quality gates | REVIEWED |
| 34 | Free-tier / operations / recovery | REVIEWED |
| 35 | Development anti-drift governance | REVIEWED / strengthened |
| 36 | Lot/checkpoint sequencing | REVIEWED / strengthened |
| 37 | Documentation precedence / stale wording | FINAL SCAN IN PROGRESS |
| 38 | PR review threads | REVIEWED / resolved |
| 39 | PR mergeability | REVIEWED / verified mergeable |
| 40 | Public repository hygiene | FINAL SCAN IN PROGRESS |
| 41 | Context-free LLM/developer takeover | REVIEWED / 9.8 design-level cold-start PASS |
| 42 | Physical codebase structure / ownership | REVIEWED / frozen |
| 43 | File/function complexity guardrails | REVIEWED / quantified; automation Lot 0 |
| 44 | PR/FIR/DoD maintainability enforcement | REVIEWED / design-level complete; automation Lot 0 |

Detailed scoring: `reviews/DOCUMENTATION-SYSTEM-SCORECARD.md`.
Context-free simulation: `reviews/LLM-COLD-START-REVIEW.md`.
LLM/engineering findings: `FINAL-DESIGN-REVIEW-LLM-ENGINEERING-ADDENDUM.md`.

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
- Resolution: `UX-ARCHITECTURE.md`, `SCREEN-BLUEPRINTS.md`, route/job matrix, screen contracts and UX review gate prohibit mega-pages/generic CRUD and define page/tab/drawer/dialog/table/mobile patterns.

## FDR-004 — Visual quality bar too abstract

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution:
  - `VISUAL-SYSTEM.md` is visual entry point;
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
- Implementation-time requirement: populate code/test evidence as features move through lifecycle.

## FDR-014 — Route / blueprint / feature inventory reconciliation

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: route→job→Feature→UX-pattern mapping added; screen blueprints and auth blueprints cover primary V1 surfaces and mobile paths.

## FDR-015 — Onboarding/auth composition under-specified

- Severity: **MINOR**
- Status: **RESOLVED**
- Resolution: blueprint-level flows cover first owner, invitation acceptance, wrong identity/expiry, MFA/recovery, session expiry and safe logout with pending work.

## FDR-016 — Final stale-wording / precedence scan

- Severity: **MAJOR**
- Status: **OPEN**
- Progress:
  - old 40-scenario wording removed;
  - old future-threat wording removed;
  - old immediate `merge → Lot 0` wording removed from normative entry points and PR description;
  - old seating/timeline deferrals corrected;
  - palette deferral corrected;
  - private single-couple wording has explicit public-readiness addendum/precedence;
  - agent/code-structure/maintainability entry points reconciled.
- Known remaining exception: `PHYSICAL-SCHEMA-V1.md` header contains historical `freeze candidate`; normative precedence of schema + addendum must be explicitly finalized without risking accidental schema rewrite.
- Required work: finish branch-wide sentry scan and record acceptable non-semantic exceptions.

## FDR-017 — Existing GitHub P1 review threads

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: all five P1 threads (same-project FKs, weekday mapping, payment model, nested external IDs, named scenarios) were rechecked, answered with normative evidence and marked resolved.

## FDR-018 — PR mergeability / branch state

- Severity: **MAJOR**
- Status: **RESOLVED**
- Evidence:
  - branch compare reports `ahead_by: 245`, `behind_by: 0` at investigation time with `main` as merge base;
  - updated GitHub PR metadata reports `mergeable: true`;
  - no branch/base divergence requiring conflict resolution remains.
- Remaining final-review requirement: record final reviewed HEAD after all hygiene/precedence remediation, then merge only after gate PASS.

## FDR-019 — Public repository final secret/private-data scan

- Severity: **BLOCKING**
- Status: **OPEN / scan in progress**
- Progress:
  - changed-file inventory contains documentation/config only, no wedding spreadsheets/backups/private images/production dumps;
  - `.gitignore` explicitly excludes private/runtime import/export/backup/credential file classes;
  - scan identified one real-name mapping example and it was replaced with synthetic `Owner-A`;
  - additional secret/token/PII sentry checks still need final recording against final HEAD.
- Required work: finish final branch/diff scan for real guest data, private screenshots/files, secrets/tokens/backups/production identifiers. Any prohibited artifact must be removed before merge.

## FDR-020 — Implementation governance not reflected in secondary docs

- Severity: **MINOR**
- Status: **RESOLVED**
- Resolution: README, START-HERE, CONTRIBUTING, LOTS, completeness/readiness, Definition of Done and traceability reference Feature Ledger/Playbook/checkpoints/UX review.

## FDR-021 — Exact visual palette previously deferred

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: palette architecture and concrete core tokens are frozen in `COLOR-SYSTEM.md`; `DEFERRED-DECISIONS.md` defers font family/implementation-level tonal mechanics, not V1 color identity.

## FDR-022 — Motion/table dynamics were not sufficiently specified

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: `MOTION-INTERACTION.md` defines timing roles, route continuity, table/list sort/filter behavior, optimistic/sync transitions, image transitions, reduced-motion and performance constraints.

## FDR-023 — SEO/image requirements risked public dynamic indexing

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: `SEO-METADATA-IMAGES.md` separates private app from optional public landing, keeps private routes non-index-oriented, forbids private OG metadata and defines responsive image/privacy/performance behavior.

## FDR-024 — Visual benchmarking not documented

- Severity: **MINOR**
- Status: **RESOLVED**
- Resolution: `VISUAL-BENCHMARKS.md` records lessons from wedding products and strong data/productivity interfaces with originality/no-copy rule.

## FDR-025 — Private V1 deployment could be mistaken for single-tenant architecture

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution:
  - product public-readiness addendum separates private launch policy from multi-tenant core;
  - `architecture/PUBLIC-SAAS-READINESS.md` freezes multi-project service/route/cache/provisioning abstractions;
  - `domain/TENANCY-MODEL.md` freezes user/project/membership semantics;
  - authenticated route family is project-scoped;
  - `PUB-*` requirements and checkpoint tests prevent single-couple shortcuts.

## FDR-026 — Future public signup/abuse/legal layer was not separated from domain CRUD

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution:
  - public abuse contract defines CAPTCHA/rate-limit/provisioning/invite/storage/import/admin abuse requirements;
  - public launch gate blocks activation until capacity/security/legal/SEO/support evidence exists;
  - public web shell separates marketing/Auth from private app;
  - private bootstrap uses provisioning-policy boundary rather than permanent one-project invariant.

## FDR-027 — Context-free agent routing and physical code architecture under-specified

- Severity: **MAJOR**
- Status: **RESOLVED**
- Resolution: see `FINAL-DESIGN-REVIEW-LLM-ENGINEERING-ADDENDUM.md`:
  - root `AGENTS.md`;
  - `LLM-TASK-ROUTING.md`;
  - `CODEBASE-STRUCTURE.md`;
  - `MODULE-SIZE-COMPLEXITY.md`;
  - PR template/FIR/DoD/Lots integration;
  - documentation scorecard and cold-start simulation.

---

# 4. Current gate blockers

Implementation gate remains CLOSED because:

- **FDR-016** — branch-wide stale wording/precedence scan not fully closed;
- **FDR-019** — final public repository privacy/secret scan not yet closed;
- final reviewed HEAD SHA still must be recorded after those remediations;
- Run 4 is not yet merged.

`FDR-018` mergeability is resolved; PR #4 currently reports mergeable.

Lot 0 must not start while a BLOCKING/MAJOR review item remains OPEN or before Run 4 merge.

---

# 5. Final PASS criteria

Before this document may state `IMPLEMENTATION GATE: OPEN`:

- [ ] all BLOCKING findings RESOLVED;
- [ ] all MAJOR findings RESOLVED;
- [ ] any remaining MINOR finding explicitly non-semantic/safe with owner/follow-up;
- [x] Requirement ↔ Feature ↔ Acceptance map reconciled;
- [x] Route ↔ UX blueprint ↔ Feature map reconciled;
- [x] visual identity/color/motion/image rules frozen enough to prevent generic implementation drift;
- [x] private V1 deployment separated from multi-tenant/public-ready core architecture;
- [x] future public activation has separate abuse/security/legal/SEO/operations gate;
- [x] context-free LLM/developer routing/precedence/handoff is specified;
- [x] physical code architecture/test placement/naming/complexity guardrails are specified;
- [ ] master spec/scope/schema/local schema/security/lots final sentry scan agrees;
- [ ] public branch contains no prohibited private artifact/secret;
- [x] PR review threads resolved/responded;
- [x] PR mergeability verified;
- [ ] final reviewed head SHA recorded;
- [ ] Run 4 merged into `main`.

Only after merge should this status be updated to record that the implementation gate is OPEN and `IMPLEMENTATION-STATUS.md` move Lot 0 from `NOT_STARTED` to `READY`.

Until then, the next permitted work is **documentation/review remediation only**.
