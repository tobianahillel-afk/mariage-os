# Work Packet Record — WP-0.2

## Identity

- Work Packet ID: `WP-0.2`
- Lot: `0`
- Name: Static architecture and maintainability gates
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
- Primary bounded context: engineering static quality enforcement
- Branch/PR: `lot-0/repository-tooling`

## Scope

- ESLint strict/static maintainability checks;
- Prettier format check;
- dependency-cycle and layer-boundary enforcement;
- file/function size, complexity, nesting and parameter limits;
- unused/dead-code checks;
- TODO/FIXME/HACK/TEMP policy;
- deliberate negative fixtures proving the guardrails reject violations.

No product Feature IDs are implemented.

## Governing contracts

- `docs/engineering/CODEBASE-STRUCTURE.md`
- `docs/engineering/CODING-STANDARDS.md`
- `docs/engineering/MODULE-SIZE-COMPLEXITY.md`
- `docs/quality/QUALITY-GATES.md`
- `docs/engineering/AI-LOT-ORCHESTRATION.md`

## Sizing

Planning complexity: **8/10 — within normal target**.

## Pass A — IMPLEMENT

In progress.

Exit evidence must include:
- normal source passes all static gates;
- a deliberate circular/layer violation is rejected;
- a deliberate complexity/size/TODO violation is rejected;
- no violation fixture is included in normal production analysis as if it were real code.

## Pass B — ADVERSARIAL REVIEW

Not started.

## Pass C — ACCEPTANCE

Not started.

## Handoff

- Current state/pass: `IN_PROGRESS / A-IMPLEMENT`
- Accepted prior packet: `WP-0.1`
- Next action: implement static quality configuration and negative-control harness
