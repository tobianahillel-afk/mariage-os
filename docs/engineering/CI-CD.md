# CI/CD Pipeline

## Goals

- every change is reproducibly tested from a clean environment;
- preview builds are isolated from production data;
- production deploy follows reviewed/merged code;
- no untrusted pull request receives production secrets;
- required quality gates cannot be silently skipped.

## Branch flow

```text
feature/docs branch
      ↓
Pull Request
      ↓
CI quality gates
      ↓
review
      ↓
merge to main
      ↓
production/static deployment when implementation phase is active
```

## Environments

### Local/test

- local Supabase stack;
- synthetic seeded project;
- no production credentials.

### Preview

- Cloudflare preview/static build;
- synthetic/demo backend mode or explicitly isolated nonproduction backend if needed;
- never connect arbitrary PR code to production database using privileged credentials.

### Production

- Cloudflare Pages production deployment;
- real Supabase project;
- public client configuration only in frontend;
- platform-held deployment secrets where required.

## CI jobs

Logical jobs may include:

- `static`: format/lint/typecheck;
- `unit`: unit/property/coverage;
- `db`: local Supabase migrations/constraints/RLS;
- `integration`;
- `security`;
- `e2e`;
- `mutation-critical`;
- `build-pwa`;
- `docs` link/spec validation.

They may run in parallel after dependency/cache setup.

## Reproducibility

CI uses:

- documented Node version;
- committed lockfile;
- `npm ci`;
- deterministic seeds;
- fresh database state.

## Workflow permissions

GitHub Actions permissions follow least privilege. Third-party actions are minimized and preferably pinned immutably for sensitive steps.

## Secrets

- no production secrets in pull-request logs/artifacts;
- forks/untrusted PRs do not receive secrets;
- service-role/database credentials limited to controlled jobs/environments if ever needed;
- frontend build contains only public-client config.

## Preview deployment

Preview URLs aid UX review but must not expose production data. They should use demo fixtures or isolated environment.

## Production deployment

After implementation begins, `main` is the deployment source. Deployment may be automatic after required checks/merge, with release process controlling migration order.

## Database migrations

Production DB migrations are versioned and reviewed. A static frontend requiring a new schema must not be deployed before compatible migration strategy is satisfied.

Prefer backward-compatible staged migrations when possible.

## PWA updates

Release pipeline must account for service-worker cache versioning so a deployed new app does not leave old incompatible cached clients silently operating.

## Artifacts

CI may retain:

- coverage reports;
- synthetic E2E traces/screenshots;
- test results;
- build artifact;
- security reports.

Artifacts must not contain real production data/secrets.

## Failure

A failed required job blocks merge/release. Re-running is for infrastructure/transient diagnosis, not a substitute for fixing a reproducible failure.
