# CI/CD Pipeline

Status: **Normative CI/CD architecture contract**

Full release/version semantics live in `VERSIONING-UPDATE-DELIVERY.md` and `RELEASE-PROCESS.md`.

## Goals

- every change is reproducibly tested from a clean environment;
- preview builds are isolated from production data;
- production promotion is ordered safely with database migrations;
- no untrusted pull request receives production secrets;
- required quality gates cannot be silently skipped;
- every production deployment is traceable to one exact version/commit/build;
- clients can receive updates safely without stale-schema corruption.

## Branch / promotion flow

```text
feature/docs branch
      ↓
Pull Request
      ↓
CI quality gates + preview deployment
      ↓
review
      ↓
merge to main
      ↓
immutable release candidate
      ↓
staging migrations + exact candidate deployment
      ↓
full verification
      ↓
production migration/recovery gate
      ↓
protected production ref/branch promotion
      ↓
Cloudflare production deployment
      ↓
production smoke + observation
```

`main` is integration truth; it must not cause an incompatible frontend to race ahead of required production schema changes. The Cloudflare production branch/ref is promoted only by the release workflow after required database/security prerequisites pass.

## Environments

### Local/test

- local Supabase stack;
- synthetic seeded project;
- no production credentials;
- deterministic migration/reset behavior.

### Preview / PR

- Cloudflare preview/static build;
- synthetic/demo backend mode or explicitly isolated nonproduction backend;
- no arbitrary PR code connected to production using privileged credentials;
- preview deployment linked to exact commit.

### Staging / release candidate

- production-like configuration with synthetic/nonproduction data;
- exact pending migrations;
- exact release candidate artifact/ref;
- full migration/RLS/E2E/PWA/import/backup verification;
- no reuse of stale evidence after candidate changes.

### Production

- protected production ref/branch;
- Cloudflare Pages production deployment;
- real Supabase project;
- production migration credentials held only by protected CI environment;
- public client configuration only in frontend;
- exact release manifest/version exposed for diagnostics.

## Pull-request jobs

Logical required/conditional jobs include:

- `static`: format/lint/typecheck;
- `architecture`: dependency direction/cycles/module-size-complexity;
- `unit`: unit/property/coverage;
- `db`: local Supabase migrations/constraints/RLS;
- `local`: IndexedDB/local migration tests;
- `integration`;
- `security`;
- `import-export`;
- `backup-migration` where applicable;
- `offline-pwa` where applicable;
- `e2e`;
- `accessibility`;
- `performance` where applicable;
- `mutation-critical`;
- `build-pwa`;
- `docs`: links/spec/traceability/staleness;
- `version-impact`: release/schema/version consistency;
- `secret-scan`;
- `dependency-scan`;
- `preview`.

They may run in parallel after dependency/cache setup. Path-based optimization is allowed only when deterministic and conservative; ambiguous impact chooses the broader check set.

## Release-candidate jobs

From an exact commit/version:

1. validate version/changelog/release plan;
2. generate immutable release manifest;
3. build immutable artifact;
4. inspect pending DB migrations and history;
5. run migration dry-run where supported;
6. apply migrations to staging;
7. deploy exact app candidate to staging/preview;
8. run full `verify` equivalent;
9. run old-client/new-backend compatibility checks when relevant;
10. run historical IndexedDB/import/backup upgrade suites;
11. run browser/device smoke;
12. retain candidate evidence.

Any commit/migration change creates a new candidate identity and invalidates prior evidence.

## Production release jobs

Production workflow is serialized/concurrency-locked.

1. verify approved exact commit/version and CI state;
2. verify production migration history;
3. verify/create required recovery point;
4. apply backward-compatible production DB/RLS migrations;
5. run DB integrity/RLS health checks;
6. stop if migration checks fail;
7. promote exact commit to protected production ref;
8. wait for successful Cloudflare deployment;
9. verify release manifest/version;
10. run production smoke/deny/security checks designed for safe production execution;
11. enter post-deploy observation;
12. record final release state/evidence.

Destructive cleanup is a later controlled step, not bundled with the first new frontend that stops using old structure.

## Reproducibility

CI uses:

- documented Node version;
- committed lockfile;
- `npm ci`;
- deterministic seeds;
- fresh database state;
- versioned migration fixtures;
- exact commit/build provenance.

## Workflow permissions / release security

GitHub Actions permissions follow least privilege.

- third-party actions minimized and pinned immutably where practical;
- production environments hold production deployment/migration credentials;
- untrusted PRs/forks never receive them;
- one production migration/release runs at a time;
- arbitrary local developer machines are not the normal production deployment path;
- artifacts/logs contain no production secrets or private wedding data.

## Preview deployment

Preview URLs aid UX review and are automatically associated with PR/branch commits. They use synthetic fixtures or isolated environment and never production private data.

## Production deployment

Cloudflare production deployment is triggered only from the protected production ref/branch (or an equivalent release-controlled immutable ref), after production migration prerequisites are green.

A successful hosting build is not enough: the release remains `PRODUCTION_VERIFYING` until production smoke/compatibility checks pass.

## Database migrations

Production DB migrations are versioned and reviewed. CI verifies migration history and, where supported, performs dry-run/staging rehearsal before production. Never edit production schema manually outside controlled migrations.

Prefer backward-compatible expand/switch/contract sequences.

## PWA updates

Release pipeline generates/exposes version identity and tests Service Worker/update behavior so:

- old open clients detect updates;
- pending local work is preserved;
- local schema upgrades safely;
- incompatible obsolete clients stop unsafe writes;
- stale caches do not run indefinitely against incompatible backend state.

## Change surveillance

CI classifies changed paths to trigger required review/tests, including:

- schema/migrations → migration + RLS + historical compatibility;
- domain → unit/property/mutation + dependent features;
- Supabase adapters → integration/RLS/security;
- IndexedDB → local migration/offline/restart;
- UI → UX/accessibility/mobile/visual evidence;
- import/export → hostile-file/idempotence/round-trip;
- PWA/service worker → update/cache/offline suite;
- auth/security → direct adversarial/deny review;
- version/release metadata → release-manifest consistency;
- normative docs → traceability/staleness validation.

## Artifacts

CI/release may retain:

- coverage/mutation reports;
- synthetic E2E traces/screenshots;
- test results;
- immutable build artifact metadata;
- migration plans/results;
- security reports;
- release manifest;
- release plan/evidence.

Artifacts must not contain real production data/secrets.

## Failure

A failed required job blocks merge/release. Re-running is for infrastructure/transient diagnosis, not a substitute for fixing a reproducible failure.

A failed production migration stops frontend promotion. A severe post-deploy regression moves release to `DEGRADED`/`FAILED` and invokes the documented compatible rollback/forward-fix process.
