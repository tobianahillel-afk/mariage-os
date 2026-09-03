# Migration Strategy

Status: **Normative engineering contract**

See also `VERSIONING-UPDATE-DELIVERY.md` for release sequencing and V1→V2 upgrades.

Mariage OS has multiple versioned state/contract layers:

1. PostgreSQL/Supabase schema;
2. RLS/RPC/security contract where semantics change;
3. IndexedDB local schema;
4. synchronization protocol/operation envelope where semantics change;
5. canonical import/export schemas;
6. `.mariage` backup schema;
7. persisted user settings/preferences where shape changes;
8. PWA/cache version;
9. app version/build.

They evolve deliberately and compatibly. No layer silently assumes that every device opened every intermediate application version.

## Database migrations

All production schema changes are represented as ordered files under `supabase/migrations/`.

Rules:

- no undocumented manual production schema drift;
- migrations are reviewed in Git;
- production migration history is compared with repository history before release;
- destructive changes require explicit migration/data-retention plan;
- migrations run against synthetic/current/historical fixtures before production;
- RLS policies/grants/RPC changes are migration-controlled where practical;
- rollback/recovery strategy exists before destructive migration;
- production migrations are serialized through release concurrency control;
- normal production deployment occurs through protected CI/release automation rather than an arbitrary developer machine.

## Expand-and-contract preference

For incompatible field/contract changes prefer:

1. add new structure;
2. write/backfill/migrate data;
3. deploy compatible code reading both if necessary;
4. verify old/new client overlap;
5. make new structure authoritative;
6. remove obsolete structure only in a later controlled release.

Avoid destructive one-step column changes when data can be preserved more safely.

## IndexedDB migrations

Local DB uses monotonically increasing schema version.

A migration:

- runs transactionally where browser storage allows;
- is sequential/version-aware so a client can upgrade through several skipped app releases;
- preserves pending mutations;
- does not discard cached authoritative/recovery-relevant state silently;
- migrates persisted preferences/drafts when their schema changes;
- records migration success/failure;
- leaves a recoverable error state if migration fails;
- never treats `clear database` as the default repair while unsynced work may exist.

## Sync protocol migrations

If mutation envelope, command semantics or conflict rules change incompatibly:

- assign explicit protocol/version semantics;
- define which client/backend combinations may coexist;
- preserve/rewrite queued historical operations safely or surface recoverable resolution;
- reject unknown unsafe operation versions rather than guessing;
- test pending operations created by supported old clients across upgrade.

## App/backend compatibility

Each app build declares supported backend schema/version range and minimum safe app version is release-controlled.

If backend is too new for current frontend:

- stop unsafe writes;
- prompt/require update;
- retain local data/pending operations;
- avoid attempting guessed compatibility.

If new frontend encounters an older backend during staged deployment, it must either remain compatible by contract or enter an explicit temporary unavailable/update state rather than corrupt data.

## Import/backup schemas

Canonical JSON and `.mariage` manifest include explicit schema versions.

For each historically supported version, migration functions/fixtures transform data sequentially to the current version.

A future schema version unknown to the current app is rejected before mutation.

Major releases retain enough historical fixtures to prove prior-major backup/import upgrade promises.

## Migration tests

CI maintains representative historical fixtures.

Every relevant schema change tests:

- fresh DB from zero;
- previous release → current;
- every supported prior release/schema path required by policy;
- supported backup schema fixtures → current;
- local IndexedDB historical version(s) → current;
- queued pending-operation compatibility where protocol/local shape changed;
- persisted settings/preferences migration where applicable;
- no invariant violations after migration;
- export after migration remains valid;
- RLS still enforces project isolation;
- old supported frontend/new backend overlap when required;
- new frontend/old backend behavior when release ordering could expose it.

## Staging / dry-run procedure

Before significant production migration:

1. verify migration history consistency;
2. inspect pending migration set;
3. run supported dry-run/planning step;
4. apply exact migrations to staging/release-candidate environment;
5. run DB integrity/RLS checks;
6. deploy exact candidate frontend;
7. run full compatibility/E2E/backup/local-migration checks;
8. preserve candidate evidence tied to exact commit/build.

## Production migration procedure

For significant migrations:

1. full Quality Gate green;
2. exact approved release/commit identified;
3. deployment/migration lock acquired;
4. production migration history verified;
5. recovery point/backup verified per risk policy;
6. apply backward-compatible migration;
7. run post-migration integrity/RLS smoke checks;
8. if checks fail, stop before frontend promotion and recover/forward-fix;
9. promote/activate compatible frontend;
10. verify release manifest/client compatibility;
11. monitor diagnostics;
12. only later execute irreversible cleanup if required.

## V1 → V2 migration rule

A major-version migration must explicitly cover:

- V1 PostgreSQL/RLS/RPC → V2;
- V1 IndexedDB → V2;
- V1 pending sync operations → V2-compatible semantics;
- V1 import schema → V2;
- V1 backup schema → V2 restore/migration;
- V1 persisted settings/preferences → V2;
- V1 cached/service-worker state → V2 safe activation;
- V1 user-facing data semantics → V2 interfaces.

A representative full synthetic V1 project must upgrade in place before V2 production. Supported V1 backups must restore/migrate into V2. Irreversible V1 structure cleanup waits until V2 is healthy and no supported client/recovery path requires it.

## Forbidden shortcuts

- manually editing production tables without corresponding migration;
- concurrent uncoordinated production `db push` operations;
- deleting a field/table containing potentially needed data without retention assessment;
- changing enum/state meaning without state-machine migration;
- making old supported backups unreadable without intentional version-policy change;
- resetting IndexedDB as the default solution to a migration bug while unsynced edits may exist;
- deploying a frontend that assumes a production migration which has not yet passed its release gate;
- marking a migration successful because SQL applied while post-migration integrity/RLS/compatibility checks failed.
