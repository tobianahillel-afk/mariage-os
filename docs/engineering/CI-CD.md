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
- local Wrangler/workerd runtime for the approved boundary; the private-document path uses Workers Static Assets ingress plus the private Durable Object host;
- no production credentials;
- deterministic migration/reset behavior.

### Preview / PR

- Cloudflare preview application including static assets and any independently approved Pages Functions; the private-document candidate uses a Workers Static Assets ingress and private Durable Object host;
- synthetic/demo backend mode or explicitly isolated nonproduction backend;
- the private-document ingress Worker binds `PRIVATE_DOCUMENT_LIFECYCLE` only to the isolated non-production Durable Object namespace when trusted-flow testing is enabled; the privileged Supabase admin credential is not an ingress binding;
- arbitrary/untrusted PR code never receives `PRIVATE_DOCUMENT_ADMIN_KEY` or other privileged credentials; that key exists only on the private Worker/Durable Object host;
- preview deployment linked to exact commit.

### Staging / release candidate

- production-like configuration with synthetic/nonproduction data;
- exact pending migrations;
- exact release candidate artifact/ref;
- approved runtime routes and required non-production bindings deployed from that exact candidate; for private documents this means Workers Static Assets ingress plus the private Durable Object host;
- full migration/RLS/E2E/PWA/import/backup verification;
- no reuse of stale evidence after candidate changes.

### Production

- protected production ref/branch;
- Cloudflare Workers Static Assets production deployment for the private-document application boundary, with independently approved Pages routes only where separately applicable;
- real Supabase project;
- production migration credentials held only by protected CI environment;
- the ingress Worker's `PRIVATE_DOCUMENT_LIFECYCLE` is bound only to the intended private Durable Object namespace when `/api/private-document-promote` is enabled; `PRIVATE_DOCUMENT_ADMIN_KEY` is encrypted only on the private Worker/Durable Object host;
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

A local static `dist/` artifact is useful build evidence but does not prove a trusted runtime route. For private documents, preview/staging/release evidence must prove the deployed Workers Static Assets ingress, Worker-first `/api/*` routing, exact external Durable Object binding and private-host secret metadata; a static upload alone is insufficient. Independently approved Pages Functions require their own deployed-route proof.

## Release-candidate jobs

From an exact commit/version:

1. validate version/changelog/release plan;
2. generate immutable release manifest;
3. build the immutable static artifact and package the approved runtime routes from the same commit, including both private-document Workers when this boundary is enabled;
4. inspect pending DB migrations and history;
5. run migration dry-run where supported;
6. apply migrations to staging;
7. deploy the exact application candidate to staging/preview, private Durable Object host first and Workers Static Assets ingress second for the private-document boundary;
8. verify required runtime bindings/secrets are present in the target environment without printing their values;
9. run full `verify` equivalent;
10. run old-client/new-backend compatibility checks when relevant;
11. run historical IndexedDB/import/backup upgrade suites;
12. run browser/device smoke;
13. run security-critical route deny/success smoke on the actual deployed runtime, including the private-document Worker ingress where applicable;
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
9. wait for successful Cloudflare deployment of static assets and approved runtime routes from that same ref; for private documents verify both private host and Workers Static Assets ingress identities;
10. verify release manifest/version;
11. run production smoke/deny/security checks designed for safe production execution;
12. enter post-deploy observation;
13. record final release state/evidence.

Destructive cleanup is a later controlled step, not bundled with the first new frontend that stops using old structure.

## Private-document Workers Static Assets boundary

For WP-2.9C and any later release that retains this boundary, `/api/private-document-promote` is a security-critical Workers Static Assets ingress route, not a static-path convenience. ADR 0013 supersedes the historical Pages-specific ADR 0010/0012 ingress while preserving their same-origin/bodyless security semantics.

Deployment/release automation must ensure:

- the route is built and deployed from the same exact commit as the frontend;
- the ingress Worker serves `dist/`, uses Worker-first `/api/*`, rejects unknown API paths without SPA fallback, declares the `PRIVATE_DOCUMENT_LIFECYCLE` external Durable Object binding for the exact private Worker class and carries no `PRIVATE_DOCUMENT_ADMIN_KEY`;
- the private Worker/Durable Object host holds the environment's encrypted `PRIVATE_DOCUMENT_ADMIN_KEY` plus its Supabase configuration; deployment publishes the Worker/namespace before the ingress caller and retains Worker-held secrets with `--keep-vars`;
- the superseded `PRIVATE_DOCUMENT_PROMOTION_WORKER` Service Binding is absent after ADR 0012 cutover;
- missing/invalid server configuration or Durable Object binding makes the route fail closed and never fall through to a static asset, SPA fallback or unprotected upstream origin;
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

If a preview deploys `/api/private-document-promote`, the Workers Static Assets ingress uses the isolated `PRIVATE_DOCUMENT_LIFECYCLE` namespace binding and the private Worker/Durable Object host uses the isolated non-production Supabase credential. An untrusted/fork PR does not receive that privileged Worker secret or a working trusted route; it may build/test locally and remain fail-closed in hosted preview.

## Production deployment

Cloudflare production deployment is triggered only from the protected production ref/branch (or an equivalent release-controlled immutable ref), after production migration prerequisites are green.

Production deploys one exact candidate across its required runtime units. For the private-document boundary, release tooling deploys the private Durable Object host first and the Workers Static Assets ingress with the same exact built `dist/` candidate second; it must not upload only static assets, route to the historical Pages Function, or declare success before binding and deny/static smoke pass. Worker-first `/api/*` and unknown-API fail-closed routing are required.

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
- `functions/`, `workers/` or Pages/Worker bindings → paired runtime + deployment-contract + security smoke review;
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
- Cloudflare runtime deployment identities and non-secret binding-presence evidence, including both private-document Workers when applicable;
- migration plans/results;
- security reports;
- release manifest;
- release plan/evidence.

Artifacts must not contain real production data/secrets.

## Failure

A failed required job blocks merge/release. Re-running is for infrastructure/transient diagnosis, not a substitute for fixing a reproducible failure.

A failed production migration stops frontend promotion. A missing or unhealthy security-critical runtime route, including the private-document ingress Worker or private host, blocks the release even if static assets deployed successfully. A severe post-deploy regression moves release to `DEGRADED`/`FAILED` and invokes the documented compatible rollback/forward-fix process.
