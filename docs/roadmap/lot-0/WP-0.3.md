# Work Packet Record — WP-0.3

## Identity

- Work Packet ID: `WP-0.3`
- Lot: `0`
- Name: Unit, property, E2E and mutation test harnesses
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
- Primary bounded context: engineering test infrastructure
- Branch/PR: `lot-0/repository-tooling`

## Scope

- Vitest unit-test harness;
- V8 coverage with 100% scaffold threshold;
- fast-check property-test smoke;
- Playwright browser smoke across representative engines/viewport;
- Stryker + Vitest mutation harness;
- synthetic-only test data/helpers;
- fast versus full test command split.

No wedding-domain Feature IDs are implemented.

## Governing contracts

- `docs/quality/TESTING-STRATEGY.md`
- `docs/quality/E2E-TESTING.md`
- `docs/quality/MUTATION-TESTING.md`
- `docs/quality/QUALITY-GATES.md`
- `docs/roadmap/LOT-ACCEPTANCE.md`
- `docs/engineering/CODEBASE-STRUCTURE.md`

## Sizing

Planning complexity: **7/10 — within normal target**.

## Pass A — IMPLEMENT

In progress.

Exit evidence must include:
- unit/scaffold tests green;
- 100% scaffold statements/branches/functions/lines coverage green;
- fast-check property smoke green;
- Playwright real-browser smoke green;
- Stryker dry run/mutation smoke green;
- no real wedding data/credentials in tests;
- test commands are deterministic and non-order-dependent.

## Pass B — ADVERSARIAL REVIEW

Not started.

## Pass C — ACCEPTANCE

Not started.

## Handoff

- Current state/pass: `IN_PROGRESS / A-IMPLEMENT`
- Accepted prior packets: `WP-0.1`, `WP-0.2`
- Next action: implement and prove the test harnesses
