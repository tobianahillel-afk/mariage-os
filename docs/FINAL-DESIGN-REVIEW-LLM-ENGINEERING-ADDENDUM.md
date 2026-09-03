# Final Design Review — LLM / Engineering Maintainability Addendum

Status: **Design review addendum — findings below resolved unless stated otherwise**

Purpose: record the systematic review requested for context-free LLM takeover, physical code organization, maintainability thresholds and development-rule enforceability.

This addendum does **not** open the implementation gate. Overall gate state remains controlled by `FINAL-DESIGN-REVIEW.md`.

---

## FDR-LLM-001 — No root agent-specific entry point

Severity: **MAJOR**

Status: **RESOLVED**

Resolution:

- root `AGENTS.md` added;
- defines first reads, precedence, task routing, stop conditions, security summary and handoff protocol;
- explicitly prohibits semantic guessing and chat-memory dependence.

Evidence: `reviews/LLM-COLD-START-REVIEW.md`.

---

## FDR-LLM-002 — Documentation corpus could overload an LLM context

Severity: **MAJOR**

Status: **RESOLVED**

Resolution:

- `engineering/LLM-TASK-ROUTING.md` defines task-specific minimal authoritative context;
- START-HERE now distinguishes comprehensive map from per-task reading;
- AGENTS precedence avoids equal-weight reading of all documents.

---

## FDR-ENG-001 — Physical source-code layout under-specified

Severity: **MAJOR**

Status: **RESOLVED**

Resolution:

- `engineering/CODEBASE-STRUCTURE.md` freezes canonical `src/`, `tests/`, `supabase/` organization;
- defines UI/domain/application/infrastructure/import/PWA ownership;
- defines dependency direction and composition root;
- defines test placement and naming;
- prohibits parallel architectures and vague dumping-ground files.

---

## FDR-ENG-002 — “Small/cohesive functions/files” was qualitative only

Severity: **MAJOR**

Status: **RESOLVED**

Resolution: `engineering/MODULE-SIZE-COMPLEXITY.md` freezes measurable guardrails:

- file target ≤200 logical lines;
- review >250;
- hard default max 400;
- function target ≤30;
- review >40;
- hard default max 60;
- cyclomatic target ≤8 / review >12;
- nesting target ≤3;
- positional parameters target ≤4;
- service/class/import-list review triggers;
- exception process;
- Lot 0 automation requirement.

---

## FDR-ENG-003 — Test placement could differ between implementers

Severity: **MINOR → material for LLM consistency**

Status: **RESOLVED**

Resolution:

- unit/domain/property tests colocated;
- integration/security/E2E/fixtures have canonical test roots;
- former Lot 0 test-layout deferral removed.

---

## FDR-ENG-004 — Code architecture rules not enforced in PR workflow

Severity: **MAJOR**

Status: **RESOLVED at design level**

Resolution:

- `.github/pull_request_template.md` added;
- FIR updated with module ownership, dependency, complexity and static-check evidence;
- CONTRIBUTING and Definition of Done updated;
- Lot 0 must implement static enforcement.

Implementation evidence is necessarily deferred until Lot 0.

---

## FDR-ENG-005 — Context-free ownership of a feature could remain ambiguous

Severity: **MAJOR**

Status: **RESOLVED at design level**

Resolution:

A feature can now be traced:

`Requirement → Feature → Acceptance → UX route/blueprint → domain → application service/port → cloud/local persistence → security → tests → modules → status/evidence`.

The FIR explicitly records expected/actual owning modules.

---

## FDR-ENG-006 — No explicit repeated documentation/maintainability score at checkpoints

Severity: **MINOR**

Status: **RESOLVED**

Resolution:

- `reviews/DOCUMENTATION-SYSTEM-SCORECARD.md` created;
- DoD/Lots require scorecard repetition at A/B/C/D using actual implementation evidence;
- critical dimensions below 9.0 require a finding/remediation regardless of overall average.

---

# Review scores after remediation

- Documentation content quality: **~97/100**.
- LLM context-free documentation readiness: **~98/100**.
- LLM cold-start simulation: **9.8/10 PASS**.
- Physical code-structure specification: **9.7/10**.
- Maintainability/complexity specification: **9.8/10**.

These are **documentation/design** scores, not code-quality/security verification scores.

---

# Why not 10/10 yet

Before implementation:

- lint/boundary/complexity rules are not yet executable;
- no real source tree exists to prove adherence;
- no CI branch-protection evidence exists yet;
- final documentation PR administrative blockers remain controlled by the main final review.

After Lot 0, repeat the cold-start and scorecard against the actual generated repository/source tree.

---

# Gate statement

This review removes LLM/code-organization ambiguity as a reason to keep the documentation gate closed.

It does **not** supersede unresolved overall final-review blockers (for example final repo hygiene/mergeability/precedence checks). The implementation gate remains CLOSED until `FINAL-DESIGN-REVIEW.md` explicitly opens it.
