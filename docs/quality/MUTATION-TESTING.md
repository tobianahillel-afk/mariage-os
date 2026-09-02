# Mutation Testing Policy

## Purpose

Coverage proves execution, not assertion strength. Mutation testing deliberately alters business logic to ensure the test suite detects incorrect behavior.

## Critical mutation scope

Mutation testing is mandatory for high-risk pure/business engines such as:

- money/budget calculations;
- guest probability/statistics;
- import merge/dedup/rollback;
- synchronization merge/conflict rules;
- state-transition validation;
- decision/blocker calculations;
- backup/import integrity logic;
- migration transformation logic where tooling permits.

## Target

The desired policy for critical in-scope modules is that all non-equivalent meaningful mutants are killed.

Equivalent/unreachable mutants must be documented rather than ignored silently.

## Example mutations

- `>` changed to `>=`;
- addition changed to subtraction;
- boolean condition inverted;
- branch removed;
- returned enum/state changed;
- boundary constant altered;
- conflict detection bypassed.

If tests remain green after a meaningful mutation, test quality is inadequate.

## CI cadence

Mutation testing may be too expensive for every tiny local save. Recommended strategy:

- targeted mutation during feature development for critical modules;
- mandatory mutation gate on affected critical modules in PR/release CI;
- periodic/full critical-module mutation suite.

A later CI design may optimize runtime without weakening release assurance.

## Not a substitute

Mutation testing complements, not replaces:

- property tests;
- integration tests;
- RLS tests;
- E2E tests;
- manual exploratory testing.

## Reporting

Surviving mutants must be reviewed. Do not game the score by excluding difficult meaningful branches without justification.
