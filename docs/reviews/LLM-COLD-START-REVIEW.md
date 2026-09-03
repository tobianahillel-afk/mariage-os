# LLM Cold-Start Review

Status: **Pre-implementation documentation simulation**

Purpose: test whether an AI agent with zero prior conversation history can safely navigate Mariage OS using repository instructions alone.

This is a documentation simulation, not an implementation test.

## Pass standard

For each scenario, a context-free agent must be able to determine:

1. whether work is currently permitted;
2. current lot/checkpoint;
3. owning Feature/Requirement/Acceptance IDs or how to find them;
4. governing UX/domain/security/architecture contracts;
5. expected physical code ownership/path;
6. applicable offline/data/security rules;
7. required tests/evidence;
8. what status/docs to update before handoff;
9. when it must stop and repair documentation instead of guessing.

---

## Scenario 1 — “Start coding Mariage OS now”

Expected route:

`AGENTS.md → IMPLEMENTATION-STATUS.md → FINAL-DESIGN-REVIEW.md`

Expected conclusion at current repository state:

**STOP. Implementation gate is CLOSED. Do not start Lot 0.**

Result: **PASS**.

The repository does not require conversation history to know that coding is currently forbidden.

---

## Scenario 2 — “When the gate opens, set up Lot 0”

Expected route:

- `AGENTS.md` tooling route;
- `LOTS.md` Lot 0;
- `LOT-ACCEPTANCE.md`;
- `STACK.md`;
- `CODING-STANDARDS.md`;
- `CODEBASE-STRUCTURE.md`;
- `MODULE-SIZE-COMPLEXITY.md`;
- quality/CI/security supply-chain contracts.

Agent can determine:

- Vite + strict TS/no React;
- canonical directories/layers;
- test placement;
- lint/boundary/complexity checks;
- required command contract;
- local Supabase/synthetic data only;
- no wedding feature code yet.

Result: **PASS** after engineering-structure remediation.

---

## Scenario 3 — “Implement venue detail”

Expected route:

- current status/lot;
- Feature Ledger venue rows;
- Venue feature/domain contracts;
- UX Architecture + Venue blueprint + route contract;
- facts/criteria/sources/access/media contracts;
- relevant security/offline contracts;
- FIR.

Expected physical ownership:

- route/screen under `src/ui/screens/venues/`;
- use cases/read models under `src/application/venues/`;
- rules under `src/domain/venues/` / facts context as governed;
- Supabase/IndexedDB implementations under infrastructure;
- UI must not query provider directly.

Result: **PASS**.

---

## Scenario 4 — “Fix a budget rounding bug”

Expected route:

- identify owning FIN requirement/Feature IDs;
- `domain/MONEY.md` + budget/payment contracts;
- find owning pure calculation module;
- reproduce with failing regression/property test first;
- preserve historical quote/payment semantics;
- run mutation policy if critical engine affected;
- update status/evidence if verification state changed.

Result: **PASS**.

No need to guess float/decimal behavior; exact money semantics are documented.

---

## Scenario 5 — “Add a new project-owned DB field”

Expected route:

- identify feature/semantic need first;
- physical schema/addenda + data dictionary + invariants;
- migrations;
- authorization/RLS mapping;
- local schema if offline-visible;
- import/export/backup compatibility;
- same-project integrity;
- no opportunistic undocumented field.

Result: **PASS**.

---

## Scenario 6 — “Add editor access to finance”

Expected route:

- security README;
- authorization model;
- role/permission matrix;
- permission→RLS mapping;
- privileged operations/data classification;
- direct allow/deny tests;
- search/export/read-model implications;
- current DB membership rather than UI role checks.

Result: **PASS**.

Agent is explicitly prohibited from scattering `if (role === 'editor')` through feature code.

---

## Scenario 7 — “Create a helper file for venue imports”

Expected route:

- import task routing;
- codebase structure + module limits;
- relevant import contract.

Expected conclusion:

Do **not** create vague `utils.ts`/`helpers.ts`. Name the module after the specific behavior and keep it in the owning import/context folder. Respect file/function/complexity limits.

Result: **PASS** after code-structure remediation.

---

## Scenario 8 — “The screen is getting to 500 lines; keep going to finish quickly”

Expected route:

`MODULE-SIZE-COMPLEXITY.md`.

Expected conclusion:

**STOP/REFACTOR.** 400 logical lines is the hard default maximum for hand-written production source; screen responsibilities must be split without moving business logic into UI. Any exception requires explicit PR rationale/review and cannot be justified by speed/LLM output.

Result: **PASS** after quantitative guardrail remediation.

---

## Scenario 9 — “Add an Internet image proxy in a Worker”

Expected route:

- security README;
- External Content Security;
- secure coding/SSRF trigger;
- public-readiness/Cloudflare boundary;
- feature/security review.

Expected conclusion:

This introduces privileged server-side URL fetch and therefore **reopens security design**. Do not simply `fetch(userUrl)`.

Result: **PASS**.

---

## Scenario 10 — “Finish work and hand it to another agent”

Expected route:

- implementation playbook end-of-session rule;
- Feature Ledger;
- `IMPLEMENTATION-STATUS.md`;
- FIR/evidence;
- checkpoint status if applicable.

Expected output:

Repository records explain current feature/lot, blockers, latest verify result and next permitted action. No essential explanation remains only in chat.

Result: **PASS**.

---

# Failure modes still possible

Documentation cannot technically force an agent to obey it. Remaining risks are behavioral:

- agent ignores `AGENTS.md`;
- agent loads an excessive context and loses precedence;
- agent edits code despite a closed gate;
- agent fails to update durable status/evidence;
- agent deliberately bypasses lint/CI/review controls.

Mitigations:

- root AGENTS entry point;
- task routing;
- branch protection/required CI after Lot 0;
- PR template;
- feature/checkpoint lifecycle;
- no merge on failing gates.

---

# Result

**Documentation cold-start result: PASS (design level).**

Score: **9.8 / 10**.

Why not 10.0 before implementation:

- automated lint/architecture/CI enforcement does not exist until Lot 0;
- code ownership cannot be proven against real source files that do not yet exist;
- current documentation PR still has final administrative review/merge work before implementation gate opens.

Repeat this review after Lot 0 and at every integration checkpoint using actual repository/code navigation rather than documentation-only simulation.
