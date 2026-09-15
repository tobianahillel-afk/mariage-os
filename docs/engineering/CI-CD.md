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
- local Wrangler/workerd Pages Functions runtime where a function boundary is in scope;
- no production credentials;
- deterministic migration/reset behavior.

### Preview / PR

- Cloudflare preview application including static assets and Pages Functions when the candidate contains `functions/` routes;
- synthetic/demo backend mode or explicitly isolated nonproduction backend;
- Pages Function privileged bindings use isolated non-production values only when the preview requires a trusted-flow test;
- arbitrary/untrusted PR code never receives production `PRIVATE_DOCUMENT_ADMIN_KEY` or other privileged credentials;
- preview deployment linked to exact commit.

### Staging / release candidate

- production-like configuration with synthetic/nonproduction data;
- exact pending migrations;
- exact release candidate artifact/ref;
- Pages Functions and required non-production bindings deployed from that exact candidate when present;
- full migration/RLS/E2E/PWA/import/backup verification;
- no reuse of stale evidence after candidate changes.

### Production

- protected production ref/branch;
- Cloudflare Pages production deployment including both static assets and repository `functions/` routes;
- real Supabase project;
- production migration credentials held only by protected CI environment;
- Pages encrypted `PRIVATE_DOCUMENT_ADMIN_KEY` configured only in the production Pages environment when `/api/private-document-promote` is enabled;
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

A local static `dist/` artifact is useful build evidence but is not proof that Pages Functions deploy correctly. When a release candidate contains a security-critical Pages Function, preview/staging/release evidence must include the deployed function route and its bindings rather than treating a static artifact upload as deployment acceptance.

## Release-candidate jobs

From an exact commit/version:

1. validate version/changelog/release plan;
2. generate immutable release manifest;
3. build immutable static artifact and package the repository Pages Functions from the same commit;
4. inspect pending DB migrations and history;
5. run migration dry-run where supported;
6. apply migrations to staging;
7. deploy the exact application candidate, including Pages Functions, to staging/preview;
8. verify required Pages bindings/secrets are present in the target environment without printing their values;
9. run full `verify` equivalent;
10. run old-client/new-backend compatibility checks when relevant;
11. run historical IndexedDB/import/backup upgrade suites;
12. run browser/device smoke;
13. run security-critical Pages route deny/success smoke where applicable;
14. retain candidate evidence.

Any commit/migration change creates a new candidate identity and invalidates prior evidence.

## Production release jobs

Production workflow is serialized/concurrency-locked.

1. verify approved exact commit/version and CI state;
2. verify production migration history;
3. verify/create required recovery point;
4. apply backward-compatible production DB/RLS migrations;
5. run DB integrity/RLS health checks;
6. stop if migration checks fail;
7. verify required Cloudflare production bindings exist without exposing values;
8. promote exact commit to protected production ref;
9. wait for successful Cloudflare deployment of static assets **and Pages Functions** from that same ref;
10. verify release manifest/version;
11. run production smoke/deny/security checks designed for safe production execution;
12. enter post-deploy observation;
13. record final release state/evidence.

Destructive cleanup is a later controlled step, not bundled with the first new frontend that stops using old structure.

## Private-document Pages boundary

For WP-2.9C and any later release that retains this boundary, `/api/private-document-promote` is a security-critical Pages Functions route, not a static-path convenience.

Deployment/release automation must ensure:

- the route is built and deployed from the same exact commit as the frontend;
- `SUPABASE_URL` and the configured non-secret publishable/anon-equivalent key point to the intended environment;
- `PRIVATE_DOCUMENT_ADMIN_KEY` is supplied only as a Cloudflare encrypted secret for that environment;
- missing/invalid server configuration makes the route fail closed and never fall through to a static asset, SPA fallback or unprotected upstream origin;
- the removed Supabase `private-document-ingest` Edge Function is absent from deployable source/configuration and is not invoked or redeployed by a legacy script;
- production evidence records route outcome, deployment identity and configuration presence only, never secret values.

The legacy Supabase promotion route must remain absent. A second public privileged promotion implementation is a release blocker.

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

If a preview deploys `/api/private-document-promote`, it uses an isolated non-production Supabase project/credential and the Pages Function is deployed with the preview. An untrusted/fork PR without approved isolated secrets must not receive a privileged working route; it may build/test locally and remain fail-closed in hosted preview.

## Production deployment

Cloudflare production deployment is triggered only from the protected production ref/branch (or an equivalent release-controlled immutable ref), after production migration prerequisites are green.

Production deploys the application as a single exact candidate containing static assets plus any approved Pages Functions. For the private-document boundary, release tooling must not upload only `dist/` and declare success while omitting `functions/api/private-document-promote.ts`.

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
- `functions/` or Pages bindings → Pages runtime + deployment-contract + security smoke review;
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
- Pages deployment identity and non-secret binding-presence evidence;
- migration plans/results;
- security reports;
- release manifest;
- release plan/evidence.

Artifacts must not contain real production data/secrets.

## Failure

A failed required job blocks merge/release. Re-running is for infrastructure/transient diagnosis, not a substitute for fixing a reproducible failure.

A failed production migration stops frontend promotion. A missing or unhealthy security-critical Pages Function also blocks the release even if static assets deployed successfully. A severe post-deploy regression moves release to `DEGRADED`/`FAILED` and invokes the documented compatible rollback/forward-fix process.
