# Deletion, Retention and Archival

Status: **Normative V1 deletion/retention contract**

## Principle

Default behavior favors recoverability and privacy minimization. Rejection, archival, soft deletion and permanent purge are distinct operations.

## Soft deletion

Most user-created entities first receive `deleted_at` and disappear from ordinary views while remaining recoverable.

Examples:

- venue/vendor;
- task/Inbox item;
- media/document metadata;
- custom category/tag where safe.

Domain-specific rows whose historical value matters may use archive/superseded status instead of deletion.

## Rejection is not deletion

A rejected venue/vendor remains searchable planning history with rejection reason, sources and decision context.

## Trash

V1 provides a recoverable trash view for applicable soft-deleted entities.

### Retention rule

Default purge-eligibility threshold: **30 days after `deleted_at`** unless a stricter domain/privacy rule applies.

Thirty days means “eligible for permanent purge”, **not** a promise that a server daemon deletes the row at the exact second the period expires.

Because V1 intentionally has no always-on custom backend/scheduler, purge can occur through:

- explicit owner `Empty trash` / permanent-delete action;
- safe opportunistic maintenance invoked during authenticated application use;
- project-deletion workflow;
- future scheduled mechanism only if later added without violating zero-cost constraints.

No core correctness/privacy assumption depends on an exact background cron execution time.

## Restore

Restore clears soft-delete state only if required unique/integrity constraints still permit restoration. If a conflicting replacement entity now exists, UI must present conflict rather than corrupt or merge silently.

## Permanent purge

Purge must:

- require appropriate authorization;
- require strong confirmation for high-impact scopes;
- delete dependent/link rows in a controlled order;
- delete private Storage originals/derivatives when no retained relationship requires them;
- clear orphaned external identifiers/mappings according to import-history policy;
- preserve only minimal audit information explicitly justified by the product/security design;
- never cross project boundaries.

## Project destruction

Separate critical workflow:

- recent strong authentication/MFA;
- explicit typed/strong confirmation;
- recommend/create portable backup before deletion;
- no shortcut via owner removal;
- delete all project-scoped database rows and Storage objects;
- revoke/delete project invitations/memberships;
- report completion/fail-safe state;
- test that no project data remains accessible afterward.

Downloaded backups remain outside cloud control and are not deleted automatically.

## Member removal

Revocation stops future cloud access but does not rewrite historical authorship. Personal UI preferences/opinions belonging to removed member are retained or removed according to explicit owner/privacy cleanup policy; history can preserve a stable author display snapshot where necessary.

## Post-wedding privacy cleanup

Provide guided cleanup/archive after event for data no longer operationally useful, especially:

- guest addresses;
- phone/email where no longer needed;
- dietary/health-related logistics;
- transport/accommodation details;
- temporary access instructions;
- obsolete remote media copies.

The couple explicitly chooses archive vs deletion where legitimate personal value remains.

## Evidence/history

Fact observations, contractual history, payments and locked decision evidence are not treated like disposable notes. Corrections use supersession/audit semantics rather than silent deletion unless project-level permanent destruction occurs.

## Media/document retention

Remote URL reference and private archived copy are separate. Removing one must not accidentally destroy the other. Purging an eliminated venue may offer cleanup of bulky nonessential archived media while preserving rejection history/source metadata.

## Import rollback retention

Import/change records remain long enough for documented rollback/recovery. Rollback may not overwrite later independent user changes.

## Tests

- soft delete → hidden ordinary view;
- restore;
- restore with uniqueness conflict;
- 30-day eligibility calculation;
- explicit/opportunistic purge idempotence;
- storage derivative cleanup;
- no orphan/cross-project authorization path;
- rejection distinct from deletion;
- evidence/financial history protections;
- project permanent destruction;
- deleted project inaccessible to former owners;
- rollback/deletion interactions.