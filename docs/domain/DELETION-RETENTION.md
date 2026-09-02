# Deletion, Retention and Archival

## Principle

The default behavior favors recoverability and data minimization. “Delete” is not one universal operation.

## Soft deletion

Most user-created entities first move to a recoverable deleted/archived state.

Examples:

- venue;
- vendor;
- task;
- note;
- media/document metadata.

Soft-deleted entities are excluded from normal views but remain recoverable until purge.

## Rejection versus deletion

A rejected venue/vendor is not deleted. Rejection is meaningful planning history and preserves reason, comparison context and alternatives.

## Corbeille / trash

V1 should provide a trash view for recoverable deletions.

Initial retention target: 30 days unless domain/security policy requires otherwise.

## Permanent purge

Permanent purge must:

- require explicit high-impact confirmation;
- respect authorization requirements;
- clean dependent rows safely;
- clean private storage objects/derivatives;
- preserve only the minimum audit metadata legally/operationally justified, if any;
- never leave cross-project orphaned private objects.

## Project deletion

Project destruction is a separate critical workflow.

Requirements:

- recent strong authentication/MFA;
- explicit confirmation;
- recommendation/export option before deletion;
- no accidental trigger from ordinary settings;
- removal of project-scoped database data and Storage objects according to implementation plan;
- no last-owner removal shortcut that bypasses this workflow.

## User/member removal

Removing a member revokes future cloud access but does not rewrite historical authorship. Historical records may preserve a stable author identity reference/display snapshot as appropriate.

## Post-wedding privacy cleanup

The product should eventually support a guided cleanup of personal data that no longer serves a purpose.

Examples that may be candidates for deletion/anonymization after the event:

- guest addresses;
- phone numbers;
- dietary/health-related logistics;
- transport details;
- temporary access information.

The couple chooses what to archive versus remove.

## Media retention

Remote promotional references and private archived copies are separate. Purging a venue can optionally preserve decision-history metadata while removing large nonessential private media.

## Import rollback retention

Rollback metadata must survive long enough to support the documented rollback window. Later changes must not be overwritten blindly.

## Activity history

Human-meaningful decision history should generally survive ordinary entity archiving/rejection. Permanent project destruction removes project history according to the destruction policy.

## Backup retention

Portable backups are outside application-controlled cloud retention after download. The application should clearly tell the user that deleting a project does not delete copies they previously downloaded.

## Tests

Deletion tests must verify:

- soft delete and restore;
- rejection preserved separately;
- dependent entity behavior;
- storage cleanup;
- no orphan authorization path;
- project deletion boundaries;
- rollback interaction;
- permanent purge cannot cross project boundaries.
