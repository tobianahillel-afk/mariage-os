# Migration Strategy

Status: **Normative engineering contract**

Mariage OS has multiple versioned state layers:

1. PostgreSQL/Supabase schema;
2. IndexedDB local schema;
3. canonical import/export schemas;
4. `.mariage` backup schema;
5. app version/build.

They must evolve deliberately and compatibly.

## Database migrations

All production schema changes are represented as ordered files under `supabase/migrations/`.

Rules:

- no undocumented manual production schema drift;
- migrations are reviewed in Git;
- destructive changes require explicit migration/data-retention plan;
- migrations run against synthetic/current/historical fixtures before production;
- RLS policies/grants are migration-controlled where practical;
- rollback/recovery strategy exists before destructive migration.

## Expand-and-contract preference

For incompatible field changes prefer:

1. add new structure;
2. write/migrate data;
3. deploy compatible code reading both if necessary;
4. verify;
5. remove obsolete structure only in later controlled migration.

Avoid destructive one-step column changes when data can be preserved more safely.

## IndexedDB migrations

Local DB uses monotonically increasing schema version.

A migration:

- runs transactionally where browser storage allows;
- preserves pending mutations;
- does not discard cached authoritative/recovery-relevant state silently;
- records migration success/failure;
- leaves a recoverable error state if migration fails.

## App/backend compatibility

Each app build declares supported backend schema/version range.

If backend is too new for current frontend:

- stop unsafe writes;
- prompt update;
- retain local data/pending operations;
- avoid attempting guessed compatibility.

## Import/backup schemas

Canonical JSON and `.mariage` manifest include explicit schema versions.

For each historically supported version, migration functions/fixtures transform data sequentially to the current version.

A future schema version unknown to the current app is rejected before mutation.

## Migration tests

CI maintains representative historical fixtures.

Every relevant schema change tests:

- fresh DB from zero;
- previous release → current;
- all supported backup schema fixtures → current;
- local IndexedDB old → current;
- no invariant violations after migration;
- export after migration remains valid;
- RLS still enforces project isolation.

## Production migration procedure

For significant migrations:

1. full Quality Gate green;
2. recovery point/backup per risk policy;
3. preview/staging/local migration validation;
4. apply migration;
5. run post-migration integrity/RLS smoke checks;
6. deploy/activate compatible frontend;
7. monitor diagnostics;
8. only later execute irreversible cleanup if required.

## Forbidden shortcuts

- manually editing production tables without corresponding migration;
- deleting a field/table containing potentially needed data without retention assessment;
- changing enum/state meaning without state-machine migration;
- making old backups unreadable without intentional version-policy change;
- resetting IndexedDB as the default solution to a migration bug while unsynced edits may exist.
