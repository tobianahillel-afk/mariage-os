# Definition of Done

This document defines when work is considered complete. “It works on my machine” is not sufficient.

## Feature-level Definition of Done

A feature is complete only when all applicable items are satisfied.

### Specification

- behavior is documented;
- user-visible states are documented;
- data/state transitions are documented;
- acceptance criteria exist;
- failure and edge cases are specified;
- privacy/security implications are reviewed;
- offline/sync implications are reviewed;
- import/export implications are reviewed where applicable.

### Implementation

- TypeScript strict mode passes;
- no unexplained unsafe type escape in critical business logic;
- validation is implemented at appropriate boundaries;
- domain behavior is not duplicated across screens;
- authorization is not delegated solely to frontend code;
- destructive behavior is explicit/recoverable according to policy.

### Tests

All applicable tests exist and pass:

- unit;
- branch/error-path;
- property-based where valuable;
- integration;
- database/RLS;
- import/export;
- offline/sync;
- migration;
- backup/restore;
- E2E;
- accessibility;
- security/adversarial.

Coverage policy is defined separately; in-scope business code targets 100% thresholds for statements, branches, functions and lines.

### Security

- no new Critical or High known vulnerability accepted;
- no secret/personal production data added to Git;
- RLS/storage policies updated and deny tests added when data access changes;
- file/input handling follows allowlist and validation policy;
- no raw executable user content introduced;
- security headers/CSP remain compatible;
- threat model/ASVS traceability updated when materially affected.

### UX

- desktop behavior verified;
- mobile behavior verified;
- loading/empty/error/offline/permission/conflict states handled as applicable;
- keyboard/accessibility basics verified;
- errors are actionable and human-readable;
- no critical action depends on color alone.

### Documentation

- user/product docs updated;
- architecture/ADR updated if needed;
- schema/import contracts updated if needed;
- changelog/release notes updated when user-facing.

### CI

The complete required verification pipeline passes from a clean environment. Required checks may not be bypassed for convenience.

## Release blockers

The following block a release regardless of schedule:

- known data loss or silent corruption path;
- cross-project authorization leak;
- broken RLS on private data;
- secret exposure;
- incorrect financial calculation on a supported path;
- backup that cannot be restored;
- migration that breaks supported existing data;
- critical offline queue losing acknowledged/local pending work;
- unresolved Critical/High security vulnerability;
- required CI gate failing.

## V1 exit criteria

Before V1 becomes the operational source of truth for the real wedding:

1. Two separate owners can securely access one project.
2. Venue data can be created, edited, sourced, compared, rejected/restored and tracked historically.
3. Tasks, decisions, budget and guests meet their V1 acceptance criteria.
4. Import preview/fusion/rollback works for supported core formats.
5. Offline venue/task/note workflow survives restart and later synchronizes.
6. RLS denial tests confirm one project cannot access another.
7. A complete project backup can be exported, validated and restored into an empty test project.
8. Old supported schema fixtures migrate successfully.
9. Critical E2E flows pass on supported desktop/mobile browser profiles.
10. The project is tested with synthetic/beta data before real-data migration.
11. The real-data migration plan is reviewed.
12. A recovery/export exists before Mariage OS becomes the new operational source of truth.

## Documentation completeness rule

If a developer with no conversation history cannot understand how a feature is supposed to behave from the repository, the feature is not fully documented.
