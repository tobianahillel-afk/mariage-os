# Feature Implementation Record — FTR-XXX

Status: `READY | IN_PROGRESS | IMPLEMENTED | VERIFIED | INTEGRATED | ACCEPTED | BLOCKED`

> Copy this template for each implemented V1 capability or maintain equivalent structured content in a PR/issue that remains durably linked from the Feature Ledger.

## Identity

- Feature ID: `FTR-XXX`
- Name:
- Lot:
- Owner/reviewer:
- Branch/PR:
- Current status:
- Last updated:

## User purpose

- Primary user job:
- Entry point(s):
- Success outcome:
- Next natural user step after completion:

## Product traceability

- Requirement IDs:
- Acceptance scenario IDs:
- User Flow IDs:
- Product spec section:
- Feature contract:
- V1 scope section:

## UX contract

- Screen type from `UX-ARCHITECTURE.md`:
- Route(s):
- Blueprint section:
- Primary action:
- Secondary actions:
- Information Level 1:
- Information Level 2:
- Information Level 3:
- Desktop behavior:
- Mobile behavior:
- Tablet behavior if materially different:
- Empty state:
- Loading/cached state:
- Offline/pending state:
- Error state:
- Permission/not-found state:
- Conflict state if applicable:
- Destructive/undo behavior:
- UX review result/evidence:

## Domain/data

- Domain entities:
- Invariant IDs/numbers:
- State-machine transitions:
- Source vs derived data:
- Derived-data invalidations:
- Date/time semantics:
- Money semantics:
- Null/unknown/conflict semantics:

## Application architecture

- Application/domain service(s):
- Pure engine(s):
- Repository interface(s):
- Read model(s):
- Provider adapter(s):
- External dependency/provider:

## Cloud persistence

- PostgreSQL tables/views:
- RPC/privileged command(s):
- Storage objects/buckets:
- Realtime subscription(s):
- Migration(s):

## Local/offline

- IndexedDB store(s):
- Offline capability class:
- Pending mutation type(s):
- Merge class:
- Conflict behavior:
- Restart behavior:
- Session-expiry behavior:
- PWA/update impact:

## Authorization/security/privacy

- Allowed role/user:
- RLS policies/tests:
- Same-project constraints:
- Protected fields/transitions:
- Data classification:
- PII/financial/sensitive-document impact:
- External-link/content/file risks:
- Threat-model items:
- Security test evidence:

## Import/export/recovery

- Import support:
- Export support:
- External ID semantics:
- Merge/protected truth behavior:
- Backup inclusion:
- Migration compatibility impact:
- Rollback/recovery:

## Tests/evidence

### Unit/domain
- [ ]

### Property/mutation where applicable
- [ ]

### Integration/local persistence
- [ ]

### Database/RLS
- [ ]

### Sync/offline
- [ ]

### Import/export/migration/backup where applicable
- [ ]

### E2E
- [ ]

### Accessibility
- [ ]

### Performance/reference dataset
- [ ]

### Visual evidence
- [ ] desktop synthetic screenshot
- [ ] mobile synthetic screenshot
- [ ] important empty/error/offline state screenshot where applicable

## Dependency check

Depends on Feature IDs:
- ...

Features/read models affected by this change:
- Dashboard:
- Search:
- Activity:
- Planning/progress:
- Budget:
- Guest/seating:
- Timeline:
- Import/export/backup:
- Diagnostics:

## Deviations / decisions

- Spec deviation: `NONE` or linked approved change/ADR
- Deferred choice used:
- New dependency justified:
- Known limitation:

## Verification summary

- `npm run verify` / equivalent:
- RLS/security result:
- UX review result:
- Checkpoint impact:

## Acceptance checklist

- [ ] No required `TBD` remains outside approved deferred decisions.
- [ ] Requirements/Feature/Acceptance IDs agree.
- [ ] UX blueprint/route implemented.
- [ ] Cloud/local semantics agree.
- [ ] Security/RLS evidence exists.
- [ ] Offline behavior matches matrix.
- [ ] All applicable tests pass.
- [ ] Documentation updated.
- [ ] Feature Ledger status updated.
- [ ] Implementation Status updated if materially changing progress.

Final status:
Evidence links:
Reviewer:
