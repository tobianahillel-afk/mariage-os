# Disaster Recovery

## Goal

For each plausible failure, Mariage OS must know what data remains, what can be recovered and what the user should do.

## Scenario: temporary Supabase/backend outage

Expected behavior:

- cached essential data remains viewable;
- safe edits queue locally;
- UI states cloud unavailability clearly;
- retry/reconnect occurs without duplicate operations;
- no destructive fallback.

## Scenario: Cloudflare/static app unavailable

Recovery:

- source remains in GitHub;
- static site can be redeployed to another compatible host;
- project data remains in Supabase;
- portable backup remains independent.

## Scenario: lost/broken device

Recovery:

- sign in from another device;
- shared cloud state restores synchronized data;
- unsynchronized edits existing only on lost device may be unrecoverable, which is why pending state must synchronize promptly when possible;
- revoke compromised sessions/access where appropriate.

## Scenario: owner loses MFA factor

Follow documented Supabase/account recovery process and backup-factor policy. This procedure must be validated before production cutover.

## Scenario: accidental deletion

- ordinary entities: restore from trash;
- recent bulk action: rollback/snapshot where supported;
- severe logical loss: restore validated backup to clean/recovery project, then reconcile.

## Scenario: bad migration

Before destructive migration:

- validated backup/checkpoint;
- migration tested against old fixtures;
- rollback/forward-fix plan.

If production fails, stop incompatible frontend release, restore/forward-fix according to migration runbook. Never improvise destructive SQL against sole production copy.

## Scenario: logical data corruption

1. Stop further destructive operations.
2. Export current state if safe for forensic comparison.
3. Record diagnostic/version/time.
4. Reproduce with synthetic/local copy.
5. Identify affected operation/migration/import.
6. Restore or repair through tested script.
7. Run integrity checks.
8. Document incident/regression test.

## Scenario: Supabase free project unavailable long-term / vendor migration

Portability requirements allow export of:

- structured project JSON;
- media/documents;
- schema/migrations.

Repository/service abstractions reduce frontend coupling. A future migration adapter can target another PostgreSQL/backend if needed.

## Scenario: backup corruption

Backup verifier detects checksum/archive/version failure before destructive restore. Keep more than one historical external backup periodically.

## Scenario: account compromise

- revoke sessions/reset credentials;
- verify member list;
- inspect activity history for sensitive changes/exports;
- restore/repair if tampering occurred;
- rotate any affected platform secret through provider if applicable.

## Recovery objectives

Primary objective is **no silent data loss**. Exact RPO/RTO are not enterprise SLAs, but the architecture prioritizes:

- immediate local durability of user edits;
- prompt cloud sync;
- recoverable soft deletion;
- portable verified backups.

## Test requirement

Disaster scenarios involving supported restore/migration paths must have automated synthetic tests and documented manual runbooks before real-data cutover.
