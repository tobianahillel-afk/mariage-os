# Import Rollback

## Goal

An import should be reversible without erasing legitimate changes made after the import.

## Import operation log

Each applied import records enough information to identify:

- created entities;
- fields changed from value A to B;
- relationships added;
- new categories/definitions;
- file/document links added;
- import provenance;
- base/result revisions.

## Immediate rollback

Immediately after an import, UI offers `Undo import` while the exact operation set is known and before extensive later edits.

## Later rollback

For each imported change:

### Safe reverse

Current value/revision still corresponds to the import result → revert automatically to pre-import state.

### Later user edit

Current value differs because it was changed after import → do not overwrite automatically. Present conflict/review or leave it intact according to rollback plan.

### Entity created by import

If still untouched/unreferenced beyond import, soft-delete safely.

If later edited/linked, require review rather than destroying later work.

## Categories/definitions

A category created by import is removed automatically only if no later data uses it. Otherwise keep it.

## Binary files

Files added by import can be removed only if not referenced by later independent records and according to trash/storage policy.

## Atomic rollback

For critical imports, rollback plan should execute transactionally where feasible. If complete safe rollback is impossible due to later edits, provide preview and partial-safe plan rather than silent force.

## Preview

Before a delayed rollback show:

- changes safely reversible;
- later edits that will be preserved;
- conflicts needing decision;
- entities/files affected.

## Audit

Rollback itself is an auditable operation linked to the original import.

## Backup interaction

Large/high-risk imports may create a safety snapshot before apply. Snapshot restore is a separate heavier recovery path, not the default rollback tool.

## Tests

Cover immediate rollback, later manual edits, created entity later modified, new category later reused, file relationship later added, conflict handling and repeated rollback idempotency.
