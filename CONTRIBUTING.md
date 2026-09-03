# Contributing to Mariage OS

Mariage OS is specification-first. Do not implement material behavior from chat memory, intuition or an outdated document when a frozen normative contract exists.

AI agents and context-free contributors must start with root `AGENTS.md`. It defines precedence, task routing, stop conditions and the handoff protocol.

## Implementation gate

Do **not** hard-code the current gate state in this contributor guide. The canonical current permission/state is always:

- `docs/roadmap/IMPLEMENTATION-STATUS.md`;
- `docs/FINAL-DESIGN-REVIEW.md`.

At the time of the AI-lot-orchestration re-freeze, Lot 0 is intended to remain `READY / NOT_STARTED`; implementation still requires an explicit user kickoff. If the status board later changes, follow the status board rather than this historical sentence.

No Lot may start merely because a previous review once said `OPEN`.

## Current progress source

Always read `docs/roadmap/IMPLEMENTATION-STATUS.md` before starting material work.

It records:
- current phase;
- current lot;
- current Work Packet/pass while a Lot is active;
- checkpoint state;
- feature progress;
- blockers;
- next permitted action.

Do not infer progress solely from recent commits or chat history.

## Before writing code after the gate opens

Read:

1. `AGENTS.md`
2. `README.md`
3. `docs/START-HERE.md`
4. `docs/V1-FROZEN-MANIFEST.md`
5. `docs/roadmap/IMPLEMENTATION-STATUS.md`
6. governing product/scope/requirements for the task
7. both Feature Ledger files as applicable
8. `docs/engineering/IMPLEMENTATION-PLAYBOOK.md`
9. `docs/engineering/LLM-TASK-ROUTING.md`
10. `docs/engineering/CODING-STANDARDS.md`
11. `docs/engineering/CODEBASE-STRUCTURE.md`
12. `docs/engineering/MODULE-SIZE-COMPLEXITY.md`
13. relevant UX/architecture/domain/security/quality contracts
14. relevant feature contract
15. current base + applicable addendum Lot acceptance contracts
16. `docs/roadmap/INTEGRATION-CHECKPOINTS.md`
17. `docs/engineering/DEFINITION-OF-DONE.md`
18. when the user requested an entire Lot, `docs/engineering/AI-LOT-ORCHESTRATION.md` + `docs/templates/WORK-PACKET-RECORD.md`.

Do not load every document blindly for a small task; follow `AGENTS.md` / `LLM-TASK-ROUTING.md` and read the governing contracts for the affected Feature IDs.

If material behavior is not specified and is not explicitly deferred, treat it as a documentation defect and update spec/ADR/tests rather than inventing a hidden rule.

## Public repository safety

Never commit real wedding data, guest/contact details, private screenshots, ratings/notes, budgets/payments, contracts/invoices, payment evidence, private photos, `.mariage` backups, production dumps, PII-bearing diagnostics, auth tokens or secrets.

Use synthetic fixtures only. `.gitignore` is defense-in-depth, not authorization to skip review/secret scanning.

## Implementation sequence

Work follows Lots 0–12 in `docs/roadmap/LOTS.md` and base + applicable addendum Lot acceptance contracts.

Every V1 capability is tracked by the union of:

- `docs/FEATURE-LEDGER.md` — FTR-001..104;
- `docs/FEATURE-LEDGER-GUEST-COMMUNICATIONS-EXTENSION.md` — FTR-105..120.

Do not jump ahead around foundations. Domain features must use established project-isolation, repository/service, local-first, migration, UX and test primitives rather than bypassing them.

Mandatory integration checkpoints occur after:
- Lots 0–3;
- Lots 4–7;
- Lots 8–10;
- Lots 11–12.

Do not start the next normal lot group until the governing checkpoint passes.

## Whole-Lot AI execution

The human may simply request `Do/Fais Lot N`.

The agent must then apply `docs/engineering/AI-LOT-ORCHESTRATION.md` automatically:

1. compute the complete current-lot Feature/control responsibility inventory;
2. create a dependency-aware Lot Coverage Matrix;
3. split work into bounded Work Packets;
4. prove every required responsibility is assigned;
5. default to one Work Packet `IN_PROGRESS` at a time;
6. execute each packet through Pass A IMPLEMENT → Pass B ADVERSARIAL REVIEW → Pass C ACCEPTANCE;
7. persist current Lot/packet/pass/next action in Git-visible state;
8. after all packets, make `required - accepted/evidenced = ∅`;
9. run a separate Lot Integration Pass;
10. run Lot acceptance and any required Checkpoint.

The user does not need to manually command Work Packets.

A Lot is a milestone, not an AI context-size target.

## Feature/change workflow

1. Start from current `main` only when current status permits the work.
2. Read `IMPLEMENTATION-STATUS.md`.
3. Identify lot + Feature ID(s) + applicable requirement/acceptance/security IDs.
4. If inside an AI Work Packet, identify the packet/pass and update its Work Packet Record.
5. Complete/update the Feature Implementation Record required by `IMPLEMENTATION-PLAYBOOK.md`.
6. Read governing feature/domain/security/UX contracts using task routing.
7. Identify expected owning modules using `CODEBASE-STRUCTURE.md` before creating files.
8. Create focused branch.
9. Update specification first/alongside code if behavior changes.
10. Implement the smallest coherent vertical slice.
11. Keep files/functions within `MODULE-SIZE-COMPLEXITY.md`; split before accumulation becomes a god module.
12. Update applicable Feature Ledger state as implementation progresses.
13. Add every applicable test/evidence layer.
14. Perform UX/QIF review, not merely functional QA.
15. Run fast iteration tests.
16. Run complete verification before production-bound PR once Lot 0 provides it.
17. Open PR using `.github/pull_request_template.md`.
18. Resolve all blocking CI/review findings.
19. Packet acceptance requires Pass B and Pass C; feature/lot acceptance cannot bypass them for AI-orchestrated Lots.
20. Merge only when relevant packet/feature/lot criteria + Definition of Done are satisfied.
21. Update `IMPLEMENTATION-STATUS.md` before handoff/end of material work.

## Code structure / maintainability

Binding engineering contracts:

- `docs/engineering/CODING-STANDARDS.md`
- `docs/engineering/CODEBASE-STRUCTURE.md`
- `docs/engineering/MODULE-SIZE-COMPLEXITY.md`

Key rules:

- canonical layer/folder architecture may not be replaced with a parallel style for convenience;
- domain/application do not depend on concrete infrastructure;
- UI does not directly perform provider persistence calls;
- no circular dependencies;
- production filenames are specific/kebab-case, not dumping grounds such as `utils.ts`/`helpers.ts`;
- source-file/function/complexity thresholds are review/enforcement gates;
- untracked TODO/FIXME/HACK/TEMP is prohibited;
- size/complexity exceptions must be explicit in the PR and approved.

Lot 0 must implement automated checks for equivalent boundaries/thresholds where reliable tooling exists.

## UX implementation rule

UI work is governed by the current UX/visual contracts and applicable feature/addendum blueprints.

Do not satisfy requirements by dumping every field onto one page or one universal table.

A feature can fail acceptance even when technically correct if:
- its page has no clear primary job;
- it resembles generic admin CRUD;
- mobile is merely squeezed desktop;
- information hierarchy is unclear;
- a table/form pattern is used because it is easier to code rather than appropriate for the task;
- navigation creates dead ends or loses useful context;
- frozen color/visual identity is replaced with a generic one-accent template;
- QIF-required flows are not quick/intuitive.

Major screen PRs should include synthetic-data desktop and mobile screenshots for UX/visual review.

## Requirement and feature traceability

Implementation PRs list affected Requirement IDs, Acceptance IDs, Feature IDs and applicable Security/Authorization IDs, plus Work Packet/pass for AI-orchestrated lot work.

Critical tests reference IDs where practical.

A P0/P1 requirement must not become “implemented somewhere” without a Feature ID or explicit cross-cutting control/evidence path.

## Planned command contract

Lot 0 must provide at least equivalents of:

```text
npm run dev
npm run test:fast
npm run verify
```

`verify` is the local full production-bound quality approximation, not a substitute for hosted policy/security checks when needed.

## Database changes

All schema/grant/policy changes are versioned migrations.

Governed by physical schema/addenda, invariants, RLS mapping and migrations contracts.

No undocumented production-dashboard schema/policy changes.

A new field/table/status that changes semantics requires corresponding documentation/Feature Record review rather than appearing opportunistically in a migration.

## Local/offline changes

Changes to IndexedDB/sync/PWA review:

- local schema/migration;
- pending mutation preservation;
- conflict/idempotence;
- session/logout/project switch;
- per-workflow offline matrix;
- service-worker compatibility;
- Feature Record offline class.

Never “fix” local migration by clearing storage while unsynced work may exist.

## Imports/exports/backups

Any change reviews:

- format/schema version;
- mapping/external identity;
- duplicate matching;
- merge/protected truth;
- provenance;
- rollback;
- old fixture migration;
- round-trip where claimed;
- file security;
- recovery compatibility.

Ordinary import never treats absence as delete. Wrong/tampered/unsupported backup never partially mutates target.

## Dependencies

Before adding a dependency justify problem, alternatives, maintenance/security, bundle/build impact, license, private-data/network implications, verification and replacement implications. Keep dependencies minimal and reproducibly locked.

## Tests

Applicable layers include:

- unit;
- property-based;
- mutation testing;
- integration/local Supabase/IndexedDB;
- RLS allow+deny;
- capability/provider/webhook tests where applicable;
- adversarial/security;
- import/export;
- migration/backup;
- Playwright E2E;
- offline/reconnect/PWA;
- accessibility;
- performance/real-device.

100% in-scope coverage is a gate, never a substitute for meaningful assertions.

## PR description

Use `.github/pull_request_template.md`.

It records as applicable:

- purpose/user job;
- Feature/Requirement/Acceptance/Security IDs;
- implementation lot;
- Work Packet/pass;
- routes/screens/UX pattern;
- modules/layer boundaries;
- size/complexity exceptions;
- schema/migration impact;
- security/privacy impact;
- offline/sync impact;
- import/export/recovery impact;
- derived-data/invalidation impact;
- dependency impact;
- tests/full verification;
- synthetic desktop/mobile screenshots;
- known limitations/deferred choices.

## Lot and checkpoint handoff

At lot completion:
- prove all planned Work Packets are accepted;
- mechanically reconcile all current-lot Feature/control responsibilities;
- run the Lot Integration Pass;
- run base + applicable addendum Lot acceptance;
- update status board;
- retain evidence.

At checkpoint completion:
- create/update the checkpoint report;
- review product fidelity, UX, architecture, security, data, offline, testing, code maintainability and documentation drift;
- repeat/update the documentation/system scorecard using implemented evidence;
- close every BLOCKING/MAJOR finding before PASS.

## Public issue/PR hygiene

Never paste production logs containing PII/secrets. Use sanitized diagnostics + synthetic reproduction. Security vulnerabilities follow `SECURITY.md`.

## Definition of complete

A PR is complete only when behavior, Feature IDs, requirements, Work Packet/pass where applicable, lot criteria, UX/visual review, code-structure/complexity rules, Definition of Done, security/data invariants, tests and documentation consistency all pass.