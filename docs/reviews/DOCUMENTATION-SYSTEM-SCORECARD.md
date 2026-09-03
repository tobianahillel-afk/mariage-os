# Mariage OS — Documentation / LLM / Engineering Scorecard

Status: **Pre-implementation systematic review — living checkpoint reference**

Purpose: score whether the repository is sufficiently explicit, coherent, navigable and strict for a context-free developer/LLM to implement Mariage OS without drifting from the intended product.

This scorecard evaluates **documentation/design readiness**, not whether unimplemented code is already secure/correct.

## Scoring scale

- **10.0** — implementation can proceed without material guessing; objective enforcement/evidence path exists.
- **9.0–9.9** — very strong; only bounded implementation choices remain.
- **8.0–8.9** — good but meaningful interpretation remains; remediation preferred before dependent implementation.
- **7.0–7.9** — material ambiguity/weak enforcement; not acceptable for a critical foundation.
- **<7.0** — under-specified.

Critical LLM/onboarding, architecture, data-integrity and security criteria are reviewed more severely than cosmetic documentation polish.

---

# A. Context-free LLM / developer recoverability — reviewed first

| # | Criterion | Score /10 | Assessment |
|---:|---|---:|---|
| 1 | Zero-context entry point | **9.8** | Root `AGENTS.md` + README + START-HERE now provide an explicit cold-start sequence. |
| 2 | Current-state / next-action discoverability | **9.7** | `IMPLEMENTATION-STATUS.md` is canonical handoff and explicitly forbids inference from chat/recent commits. |
| 3 | Document precedence / conflict resolution | **9.8** | `AGENTS.md` defines precedence, addendum behavior and stop-on-ambiguity rule. |
| 4 | Task-specific context routing | **9.7** | `LLM-TASK-ROUTING.md` prevents blindly loading the entire documentation corpus. |
| 5 | Feature-level resumption / handoff | **9.6** | Feature lifecycle + FIR + ledger + status board provide durable continuation state; implementation evidence does not exist yet by design. |
| 6 | No-chat-memory dependency | **9.8** | Explicit repository-only handoff rule is repeated in AGENTS, playbook, DoD and status board. |

**LLM cold-start conclusion:** a context-free agent should be able to identify whether it may code, what it is allowed to change, which documents control the task, and what evidence it must leave behind. The remaining risk is corpus size, mitigated by task routing rather than by deleting useful specifications.

---

# B. Product specification / anti-scope-drift

| # | Criterion | Score /10 | Assessment |
|---:|---|---:|---|
| 7 | Product mission / user jobs | **9.8** | Decision/action system and couple mental model are explicit. |
| 8 | V1 vs post-V1 boundary | **9.8** | Frozen scope plus deferred-decision register and explicit post-V1 list. |
| 9 | Feature inventory completeness | **9.7** | 104 stable V1 capabilities in Feature Ledger. |
| 10 | Requirement traceability | **9.7** | Requirement→Feature→Acceptance→evidence model and matrices are defined. |
| 11 | Acceptance / edge-case specificity | **9.8** | 80 critical Given/When/Then scenarios plus feature/domain-specific tests/contracts. |
| 12 | Scope/change governance | **9.8** | Material change requires spec/feature/ADR/test impact; silent semantics prohibited. |

---

# C. Architecture / code organization / maintainability

| # | Criterion | Score /10 | Assessment |
|---:|---|---:|---|
| 13 | High-level architecture clarity | **9.7** | Cloud/browser/local responsibilities and trust boundaries are explicit. |
| 14 | Layer dependency direction | **9.7** | UI/domain/application/infrastructure/composition rules are frozen. |
| 15 | Physical folder/file architecture | **9.7** | `CODEBASE-STRUCTURE.md` now defines canonical roots, contexts and test placement. |
| 16 | Naming conventions / ownership discoverability | **9.8** | Kebab-case files, domain vocabulary, provider-specific adapters and vague-file prohibitions are explicit. |
| 17 | File/function size limits | **9.8** | Quantified file/function/complexity/nesting/parameter thresholds now exist with exception process. |
| 18 | Dependency cycles / boundary enforcement | **9.6** | Rules are explicit; actual lint/tool enforcement remains a Lot 0 implementation deliverable. |
| 19 | Secure coding / unsafe-pattern prohibition | **9.8** | SQL/DOM/crypto/token/regex/prototype/URL/etc. patterns are documented and traceable. |
| 20 | Dependency/supply-chain discipline | **9.7** | Dependency justification, lockfile, CI permissions, scanning and replacement reasoning are defined. |

### Quantitative code guardrails now frozen

Default hand-written production-code limits:

- source file target ≤ 200 logical lines;
- review threshold > 250;
- hard default max 400;
- function target ≤ 30 logical lines;
- review threshold > 40;
- hard default max 60;
- cyclomatic complexity target ≤ 8, review threshold > 12;
- imperative nesting target ≤ 3;
- positional parameters target ≤ 4;
- >10 public methods / >5 injected dependencies triggers service/class review;
- no circular dependencies;
- untracked TODO/FIXME/HACK/TEMP prohibited.

Lot 0 must automate equivalent checks where tooling can do so reliably.

---

# D. Data / offline / import / recovery

| # | Criterion | Score /10 | Assessment |
|---:|---|---:|---|
| 21 | Physical data model / referential integrity | **9.6** | Detailed schema + normative addenda + same-project relations; historical header/precedence cleanup remains in final review. |
| 22 | Data semantics / invariants | **9.8** | Money/date/null/facts/confidence/state transitions and 100+ invariants are explicit. |
| 23 | Cloud ↔ local data parity | **9.7** | IndexedDB schema was reconciled with late V1 entities and project/account partitioning. |
| 24 | Sync/offline/conflict semantics | **9.7** | Per-action offline classes, revisions, idempotence and conflict behavior are defined. |
| 25 | Import/export/migration semantics | **9.8** | Canonical JSON, mapping, dedupe, protected truth, rollback, round-trip and hostile inputs are deeply specified. |
| 26 | Backup/recovery/portability | **9.8** | `.mariage`, integrity, encryption, migration, restore and disaster-recovery contracts are explicit. |

---

# E. Security / privacy / public readiness

| # | Criterion | Score /10 | Assessment |
|---:|---|---:|---|
| 27 | Authentication/session/brute-force design | **9.8** | Provider Auth, MFA, recovery, rate-limit, PKCE/token safety and anti-enumeration covered. |
| 28 | Authorization/multi-tenant isolation | **9.8** | Permission model, roles, relationship rules, RLS mapping, privileged operations and deny tests specified. |
| 29 | Injection/input/browser/file hardening | **9.8** | Runtime validation, SQL injection prevention, XSS, CSP, CSRF future rule, SSRF future rule, files/archive/formula protections documented. |
| 30 | Privacy / secrets / public-repo hygiene design | **9.7** | Strong rules exist; final branch-wide private-data/secret scan is still a pre-merge blocker. |
| 31 | Public SaaS readiness without rewrite | **9.8** | Project-scoped routes/services/cache/schema/tests and public-launch gate are explicit. |

---

# F. UX / visual / accessibility

| # | Criterion | Score /10 | Assessment |
|---:|---|---:|---|
| 32 | Information architecture / navigation | **9.8** | Screen taxonomy, one-job-per-screen, desktop/mobile hierarchy and workflow continuity are normative. |
| 33 | Screen/detail specificity | **9.7** | Blueprints/contracts cover primary screens/workflows; implementation screenshots will be evidence later. |
| 34 | Visual identity/design system | **9.7** | Multi-color domain palette, visual thesis, component/motion/image rules and anti-admin/anti-AI-generic guardrails exist. |
| 35 | Responsive/accessibility/performance | **9.5** | Explicit contracts/gates exist; real-device and actual render evidence necessarily waits for implementation. |

---

# G. Quality / governance / reviews

| # | Criterion | Score /10 | Assessment |
|---:|---|---:|---|
| 36 | Test strategy / coverage / mutation / E2E | **9.8** | Multi-layer suite + 100% in-scope coverage gate + mutation rules + hostile/security/offline tests. |
| 37 | CI/CD / quality gates | **9.6** | Required logical gates and clean reproducibility are specified; actual workflows remain Lot 0. |
| 38 | Feature-by-feature implementation governance | **9.8** | FIR, lifecycle, Feature Ledger, PR template and status board strongly prevent vague progress. |
| 39 | Cross-lot review / regression control | **9.8** | Mandatory A/B/C/D checkpoints every 3–4 lots with no BLOCKING/MAJOR allowed. |
| 40 | ADR/deferred-decision governance | **9.8** | Architecture changes/deferred implementation choices are explicit and cannot override product semantics. |
| 41 | Error handling / observability / diagnostics | **9.5** | Detailed contracts exist; operational evidence waits for code. |
| 42 | Documentation discoverability / indexing | **9.6** | Strong index/start-here; corpus is large, mitigated by AGENTS/task-routing. |
| 43 | Documentation coherence/staleness controls | **9.5** | Audits/sentry scans/final review exist; final stale-wording/precedence scan is not yet closed. |
| 44 | PR/review operational closure | **8.6** | Known P1 threads were resolved, but PR #4 mergeability/final merge state remains an open final-design-review item. |

---

# Scores

## Documentation content quality

**97 / 100** (approximately 9.7/10 average across the substantive design criteria).

Meaning: the repository is already unusually detailed and implementation-directed. The largest previous gaps — cold-start LLM routing and quantitative code-structure constraints — were remediated in this review.

## LLM context-free implementation readiness

**98 / 100 for documentation navigation/specification quality**, conditional on obeying `AGENTS.md` and the implementation gate.

The primary residual risk is not missing product information; it is an agent ignoring the routing/precedence rules or attempting to ingest the entire corpus without task scoping.

## Administrative pre-code readiness

**Not yet PASS.** This is intentionally scored separately from documentation content.

Open final-gate work remains controlled by `FINAL-DESIGN-REVIEW.md`, especially:

- final stale wording/precedence scan;
- final public-repository private-data/secret scan;
- PR #4 mergeability/conflict resolution;
- final reviewed HEAD SHA;
- merge of Run 4 to `main`.

Therefore this scorecard does **not** authorize Lot 0.

---

# Major improvements made during this review

## DR-SCORE-001 — Cold-start agent entry point

**Before:** good README/START-HERE, but no root agent-specific control file.

**After:** `AGENTS.md` defines first actions, precedence, task routing, stop conditions, handoff and minimal-context strategy.

## DR-SCORE-002 — Context overload risk

**Before:** START-HERE had a comprehensive but long reading order.

**After:** `LLM-TASK-ROUTING.md` defines task-specific minimum authoritative document sets.

## DR-SCORE-003 — Physical code architecture

**Before:** conceptual layers were clear, but physical directory/file placement could vary by implementer.

**After:** `CODEBASE-STRUCTURE.md` freezes root/layer/context/test placement and import boundaries.

## DR-SCORE-004 — God-file/function ambiguity

**Before:** “prefer small modules/functions” was qualitative.

**After:** `MODULE-SIZE-COMPLEXITY.md` defines numeric thresholds, refactor triggers and exception rules.

## DR-SCORE-005 — PR enforcement

**Before:** CONTRIBUTING described required PR content but no concrete GitHub template enforced the review surface.

**After:** `.github/pull_request_template.md` requires traceability, UX, architecture, security, offline, testing and size/complexity evidence.

## DR-SCORE-006 — Test-layout ambiguity

**Before:** test placement was explicitly deferred to Lot 0.

**After:** test placement is frozen in `CODEBASE-STRUCTURE.md`; `DEFERRED-DECISIONS.md` now defers only exact tooling, not the convention.

---

# Review rule for future checkpoints

Repeat this scorecard at Checkpoints A/B/C/D using **implemented evidence**, not only documentation.

A future score must decrease if implementation diverges from the documented architecture even when more code/features exist.

Any score below **9.0** in one of these critical dimensions requires a checkpoint finding:

- context-free resumption;
- data integrity;
- authorization/security;
- offline/sync durability;
- backup/recovery;
- feature traceability;
- code architecture/maintainability;
- core UX/navigation.

Any BLOCKING/MAJOR defect overrides the numerical average.
