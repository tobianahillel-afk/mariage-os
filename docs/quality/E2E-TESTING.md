# End-to-End Testing

## Tool

Playwright is the target E2E framework unless an ADR changes it.

## Philosophy

E2E tests verify behavior from the user's perspective against realistic application boundaries. They do not replace narrower unit/integration tests.

## Browser/device matrix

Minimum automated profiles should include:

- Chromium desktop;
- Firefox desktop;
- WebKit desktop/mobile-representative;
- representative mobile viewport/touch profiles.

Critical PWA/mobile behavior should additionally receive real-device exploratory validation before production cutover.

## Critical V1 journeys

### Authentication/project

- invited owner signs in and opens project;
- unauthorized/other-project user is denied;
- expired session recovers safely.

### Venue

- create venue;
- add/edit sourced fact;
- add space;
- add rating;
- reject and restore;
- compare candidates;
- attach/reference media;
- quote workflow.

### Task/decision

- assign task;
- waiting external;
- complete/reopen;
- joint decision requiring both approvals.

### Guest

- import/create household/guests;
- probabilities/statistics;
- RSVP update.

### Budget

- create fixed/per-guest item;
- guest-count change recalculates scenario;
- payment recorded;
- remaining balance/cash-flow updates.

### Import

- valid import preview/apply;
- same file imported twice without duplicates;
- duplicate/conflict resolution;
- rollback.

### Offline/sync

- edit while offline;
- reload;
- local change persists;
- reconnect and sync;
- conflict surfaced safely.

### Backup/restore

- export test project;
- restore to clean project/environment;
- critical data equivalent.

## Isolation

Tests create/use deterministic synthetic accounts/projects and clean them/reset environment as needed. No test depends on the previous test's side effects.

## Selectors

Prefer accessible roles/labels/test IDs designed for stable behavior. Do not bind E2E tests to fragile visual CSS structure unnecessarily.

## Network simulation

Test:

- offline;
- delayed response;
- failed upload;
- session expiry;
- backend unavailable;
- retry/reconnect.

## Screenshots/traces

CI may preserve failure traces/screenshots using synthetic test data only.

## Flakiness policy

A flaky test is treated as a bug. Automatic retries may aid diagnosis but cannot be used as evidence that an intermittently failing required scenario is healthy.

## Release gate

All critical E2E tests must pass before production release.
