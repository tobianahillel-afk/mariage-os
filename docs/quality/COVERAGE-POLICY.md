# Coverage Policy

## Target

For in-scope executable business/application code, CI coverage thresholds target:

- statements: **100%**
- branches: **100%**
- functions: **100%**
- lines: **100%**

Thresholds should be enforced globally and, where tooling supports it reliably, per file for in-scope code.

## What coverage means

100% coverage means every measured code path was executed by tests. It does **not** prove assertions are correct or all requirements are covered.

Therefore coverage is combined with mutation, property, integration, RLS, security and E2E testing.

## In-scope examples

- domain services;
- parsers/normalizers;
- calculation engines;
- state-machine logic;
- repositories/adapters with executable behavior;
- sync/merge/conflict logic;
- import/export transformations;
- authorization helper logic that is not solely DB policy;
- UI state reducers/controllers with logic.

## Legitimate exclusions

Potential exclusions must contain no meaningful executable logic, for example:

- TypeScript type-only declarations;
- generated code explicitly covered by upstream/source schema;
- static constants where execution coverage is meaningless;
- framework/bootstrap glue only when a stronger E2E test is the appropriate verification and the exclusion is documented.

Blanket directory exclusions to “make 100% easier” are forbidden.

## Exclusion review

Every nontrivial coverage exclusion must be:

- explicit;
- documented with reason;
- reviewed in PR;
- periodically reevaluated.

## Branch coverage

Branch coverage is especially important. A function tested only on the happy path is not complete when error/unknown/conflict branches exist.

## Generated reports

CI should generate machine-readable and human-readable coverage output. Coverage artifacts must contain synthetic/test data only.

## Regression

Any PR reducing required coverage below threshold fails the quality gate.

## Test quality

A meaningless assertion solely to hit a line is unacceptable. Mutation testing and review are used to detect weak tests in critical areas.
