# Requirements Traceability

## Purpose

Every important requirement should be traceable from specification to implementation and verification, so future work does not rely on conversation memory.

## Requirement IDs

Use stable prefixes:

- `PROD-` product/global
- `VEN-` venues
- `VND-` vendors
- `GST-` guests
- `BUD-` budget
- `TSK-` tasks
- `DEC-` decisions
- `PLN-` planning
- `DOC-` documents/media
- `IMP-` import/export
- `SYN-` sync/offline
- `SEC-` security
- `OPS-` operations/recovery
- `UX-` user experience/accessibility

Example:

`IMP-001: Import must preview changes before applying structured input.`

## Traceability row

Each critical requirement eventually maps:

| Requirement | Spec | Implementation | Test(s) | Security/ASVS | Status |
|---|---|---|---|---|---|

## Acceptance criteria

Critical workflows should be expressible using Given/When/Then semantics.

Example:

```text
SYN-004
Given a previously synchronized venue is available locally
And the device is offline
When the owner edits a note and reloads the app
Then the note remains locally present
And is marked pending
And synchronizes when connectivity returns.
```

## Code/test naming

Where practical, include requirement ID in test descriptions or metadata for critical requirements without making code unreadable.

## Changes

When behavior changes:

- update requirement/spec;
- update tests;
- update implementation;
- update traceability status;
- create ADR if architectural.

## No orphan implementation

A significant feature should not appear in production without a corresponding product/spec requirement.

## No paper-only requirement

A required V1 specification item is not `VERIFIED` until objective test/review evidence exists.

## Future implementation task

During implementation preparation, feature documents should be assigned concrete requirement IDs and a machine-/human-readable traceability matrix populated progressively.
