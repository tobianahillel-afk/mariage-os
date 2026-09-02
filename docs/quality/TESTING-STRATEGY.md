# Testing Strategy

## Goal

Mariage OS uses layered automated testing to make regressions difficult to introduce and easy to detect. Coverage percentage alone is not considered proof of correctness.

## Test pyramid/layers

### 1. Unit tests

Fast deterministic tests for domain functions, parsers, state transitions and validation.

Examples:

- guest statistics;
- money calculations;
- score explanations;
- state-machine transitions;
- freshness rules;
- task prioritization;
- import normalization.

### 2. Property-based tests

Generate broad input ranges and verify invariants.

Examples:

- re-importing same canonical entity never duplicates it;
- per-guest cost does not decrease when guest count increases under a linear rule;
- export/import round-trip preserves semantic data;
- probability aggregate remains within mathematical bounds.

### 3. Integration tests

Exercise multiple modules/repositories together against realistic local infrastructure.

### 4. Database tests

Use local Supabase/PostgreSQL for constraints, migrations, functions and RLS.

### 5. Authorization/security tests

Directly test allow/deny behavior rather than relying on UI visibility.

### 6. Import/export tests

Fixtures cover formats, errors, deduplication, merge, rollback, formulas, encoding, malformed content and version compatibility.

### 7. Sync/offline tests

Simulate multiple clients, network loss, delayed/out-of-order changes, retries and conflicts.

### 8. Migration/backup tests

Old fixtures migrate to current schema; project backup restores into clean test project and compares semantically.

### 9. E2E tests

Playwright verifies real critical user journeys across supported browser/device profiles.

### 10. Accessibility tests

Automated scanning plus manual/keyboard checks for critical workflows.

### 11. Performance tests

Representative synthetic data sets verify that target scale remains usable.

### 12. Mutation testing

Critical business engines must prove tests fail when important logic is deliberately mutated.

## Full regression rule

Developers may run targeted fast tests while coding. Before PR merge/release, the complete required suite runs from a clean environment.

No “only changed tests” mechanism replaces the full release gate.

## Critical modules

Higher assurance is required for:

- BudgetEngine;
- guest statistics;
- Import/Merge/Rollback;
- Sync/Conflict handling;
- backup/restore;
- migration engine;
- authorization/RLS;
- decision/blocking rules;
- financial/date parsing.

## Test isolation

Tests must not depend on execution order. E2E/database tests use isolated deterministic projects/users/fixtures and reset state as required.

## No production data

Automated tests never use real wedding data. Fixtures are synthetic.

## Failure policy

A flaky failing test is a defect. It must be fixed or deterministically redesigned, not repeatedly rerun until green.

## Test naming

Names should describe behavior and expected result, not implementation detail.

Example:

`rejects cross-project venue update even when UUID is known`

rather than

`test rls 3`.

## Evidence

CI artifacts/reports should make failures diagnosable without exposing production secrets or personal data.
