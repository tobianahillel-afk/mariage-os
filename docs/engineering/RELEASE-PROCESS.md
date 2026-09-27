# Release Process

Status: **Normative release execution contract**

The full cross-layer lifecycle is defined by `VERSIONING-UPDATE-DELIVERY.md`. This file is the operational release summary.

## Versioning

Use semantic application versions:

- major: incompatible product/data contract evolution requiring deliberate migration program;
- minor: backward-compatible feature set;
- patch: backward-compatible fixes/security hardening.

Pre-release versions may use `-alpha.N`, `-beta.N`, `-rc.N`.

Every build has one immutable release identity tying version to commit SHA, build ID and cloud/local/import/backup compatibility metadata.

## Branch / environment model

Target production flow:

```text
feature / PR
  → preview + CI
main
  → immutable release candidate + staging
production migration gate
  → protected production ref
  → Cloudflare production deploy of the exact approved runtime candidate
  → smoke + monitoring
```

`main` is integration truth. The Cloudflare production ref/branch must not be promoted until database/security migration prerequisites are satisfied. This prevents a new frontend from racing ahead of an incompatible production schema.

## Before a release candidate

- feature specifications/ADRs current;
- target version and release plan identified;
- migrations complete and tested;
- compatibility matrix complete;
- full CI green;
- architecture/complexity guardrails green;
- coverage and mutation targets satisfied;
- security scans/RLS tests green;
- changelog draft complete;
- synthetic migration/backup fixtures green;
- all changed user interfaces identified;
- security-critical runtime routes and their required non-secret/secret binding names identified; private documents use Workers Static Assets ingress plus the private Durable Object host.

## Release candidate

Build one immutable candidate from an exact commit SHA.

Deploy the exact pending migrations and application build to staging/preview with synthetic/nonproduction data. The private-document candidate includes its Workers Static Assets ingress and private Durable Object host from the same exact commit. Independently approved `functions/` routes remain part of their own Pages candidate where applicable. A static-only `dist/` upload is not equivalent deployment evidence.

Perform:

- full automated verification;
- desktop browser smoke;
- real/supported mobile smoke where possible;
- offline/reconnect/update smoke;
- import/export smoke;
- backup/restore verification;
- old-client/new-backend overlap tests where schema changed;
- IndexedDB historical upgrade tests;
- security configuration/header review;
- free-tier usage/config review;
- deployed runtime route/binding smoke where security-critical routes are present, including the private-document Worker ingress;
- visual/accessibility review for changed screens.

Any change to candidate code/migrations invalidates previous candidate evidence.

## Production migration order

Prefer backward-compatible staged changes.

Ordinary compatible release:

1. acquire deployment/migration concurrency lock;
2. verify exact approved commit/version;
3. verify production migration history;
4. verify recovery point/backup according to risk;
5. apply backward-compatible DB/RLS migration;
6. run DB/RLS/integrity health checks;
7. stop if migration checks fail;
8. verify required production runtime bindings/secrets exist without printing values;
9. promote exact commit to protected production ref;
10. deploy the private Durable Object host before the Workers Static Assets ingress, with static assets from that exact ref; deploy independently approved Pages routes only when separately in scope;
11. verify release/version manifest;
12. run production smoke, including security-critical Worker ingress deny/static checks;
13. start post-release monitoring;
14. mark release `HEALTHY` only after verification;
15. perform destructive cleanup only in a later compatible release when safe.

Do not combine destructive schema removal with clients that may still depend on it.

## Private-document Workers Static Assets release gate

ADR 0010 freezes `/api/private-document-promote` as a security-critical same-origin bodyless browser boundary. ADR 0012 moves trusted lifecycle execution into the private `PrivateDocumentLifecycle` Durable Object. ADR 0013 supersedes the Pages-specific ingress with Workers Static Assets. Any release containing this boundary must deploy the private Durable Object host first, then the exact-candidate public ingress Worker with static assets, Worker-first `/api/*` and the external `PRIVATE_DOCUMENT_LIFECYCLE` binding. The release is invalid if either runtime is absent, misbound or replaced by fallback content.

Required configuration metadata:

- `SUPABASE_URL` points to the intended Supabase environment;
- `SUPABASE_PUBLISHABLE_KEY` or the supported non-secret anon-equivalent is available to verify/use the caller session;
- `PRIVATE_DOCUMENT_ADMIN_KEY` is present only as an encrypted secret on the private Worker/Durable Object host for that environment; the ingress Worker and its static assets do not receive it;
- `PRIVATE_DOCUMENT_LIFECYCLE` points only to the intended SQLite-backed `PrivateDocumentLifecycle` namespace exported by the non-public Worker, and the superseded `PRIVATE_DOCUMENT_PROMOTION_WORKER` Service Binding is absent;
- no secret value appears in Git, build output, release manifest, logs, screenshots or smoke output.

The legacy Supabase promotion route must remain absent: `supabase/functions/private-document-ingest` is not deployable, `supabase/config.toml` must not enable it, application code must not invoke it, and release scripts must not recreate or deploy it.

### Production smoke

Production smoke for this route is deliberately deny-oriented and safe for real production data. It must prove, without uploading private wedding content or printing credentials, that:

1. the deployed route exists on the Workers Static Assets ingress and does not resolve to SPA/static fallback;
2. an unsupported method is rejected;
3. a bodyless promotion request without a bearer token is rejected generically;
4. a framed/non-zero-body request is rejected according to the bodyless ingress contract;
5. cross-origin invocation is not granted wildcard CORS;
6. missing/invalid trusted server configuration makes the route **fail closed** rather than falling through to an unprotected origin or static response;
7. the legacy Supabase promotion route remains absent/not deployed;
8. ordinary static application assets still serve normally after the ingress Worker deployment; unknown `/api/*` paths fail closed rather than becoming SPA content.

A positive trusted promotion proof uses staging/release-candidate synthetic data unless production-safe synthetic fixtures are explicitly provisioned. Production smoke must not create or mutate a real couple's document merely to prove deployment health.

Failure of any private-document route smoke keeps the release in `PRODUCTION_VERIFYING` or moves it to `FAILED`; static hosting success alone cannot override it.

## PWA/service-worker release

Every release handles cached/open clients safely:

- application/service-worker caches are versioned;
- running clients detect new release metadata;
- compatible update is surfaced without destroying active edits;
- pending local work is durable before reload;
- IndexedDB migrations are sequential/transactional;
- cloud compatibility is verified after update;
- obsolete incompatible clients stop unsafe writes and enter `Update required` state;
- no stale client silently writes a payload outside its supported backend range.

See `architecture/PWA-LIFECYCLE.md`.

## User-interface reconciliation

A release that changes domain semantics is not complete until all affected user-facing surfaces are reviewed, including Dashboard, Search, Inbox, list/card/table summaries, detail, compare, mobile, desktop, offline/error/conflict states, imports, exports and Settings/Diagnostics.

Use `architecture/DEPENDENCY-GRAPH.md`, Feature Implementation Records and the release plan template.

## V1 → V2

A major upgrade is not a single large deployment.

Before `2.0.0`:

- freeze V2 specification/scope delta;
- classify every V1 feature as unchanged/changed/deprecated/replaced/removed;
- preserve historical Feature/Requirement/Acceptance traceability;
- implement and test PostgreSQL, IndexedDB, sync, import and backup migration chains;
- migrate persisted settings/preferences;
- define old-client compatibility/forced-update boundary;
- test a representative complete synthetic V1 project upgraded in place;
- prove supported V1 backups restore/migrate into V2;
- prove pending offline work survives or receives an explicit recoverable resolution path;
- complete major security/UX/accessibility review;
- rehearse production recovery;
- delay irreversible cleanup until V2 is healthy.

See `VERSIONING-UPDATE-DELIVERY.md`.

## Changelog

Maintain user-relevant changes:

- Added
- Changed
- Fixed
- Security
- Deprecated
- Removed when applicable
- Migration notes
- Update-required notes when applicable.

## Rollback / forward fix

Frontend rollback may use a previous successful Cloudflare production deployment/ref only if that frontend remains compatible with the current production backend and includes compatible security-critical runtime routes. Private-document rollback must retain the Workers Static Assets ingress, matching private Durable Object binding and safe secret placement.

Database rollback is not assumed. Prefer expand/contract + forward corrective migration. Destructive recovery requires tested backup/restore procedure.

A failed production DB migration before frontend promotion stops the release. A severe defect after frontend promotion may require write degradation, compatible frontend rollback, or forward DB/app hotfix depending on root cause.

A private-document route rollback must never restore the removed browser-reachable Supabase Edge promotion route or the superseded Pages ingress as a shortcut. If no compatible secure ingress/host deployment is available, document promotion remains fail-closed while a forward fix is prepared.

## Monitoring

A deployment is not successful merely because hosting completed.

Observe applicable:

- application boot errors;
- Auth anomalies;
- DB migration/integrity state;
- RLS/security smoke;
- ingress Worker and private Durable Object invocation errors/resource-limit outcomes for private documents; Pages Function outcomes for independently approved routes;
- sync queue failures/conflicts;
- IndexedDB migration failures;
- PWA/update failures;
- incompatible-client events;
- import/backup errors;
- quota/resource pressure;
- performance regressions;
- critical user-flow smoke.

Monitoring must not log private wedding content unnecessarily.

## Release plan

Use `docs/templates/RELEASE-PLAN.md` for every minor/major and high-risk patch release.

For releases containing the private-document Workers Static Assets boundary, the release plan records the exact deployment SHA, ingress Worker and private host deployment IDs/versions, environment, binding names/presence, legacy-route absence check, production smoke result and the Workers Free two-surface CPU evidence identifier. No secret values are recorded.

## Production release blockers

See Quality Gates, Definition of Done and the release plan. P0/P1 known defects, incompatible migration state, failed required CI/security checks, unrecoverable data risk or unexplained severe post-deploy regression block/stop the release.

For the private-document boundary, missing Workers Static Assets ingress or private Durable Object host, missing/incorrect `PRIVATE_DOCUMENT_LIFECYCLE` binding, missing host `PRIVATE_DOCUMENT_ADMIN_KEY`, any static/origin fallthrough, reappearance of the legacy Supabase or superseded Pages promotion route, failed deny/static smoke, or unproven required Free-runtime feasibility is a release blocker.

## V1 real-data cutover

V1 is special:

1. run beta with synthetic project;
2. import representative non-sensitive/controlled test data;
3. verify workflows on both owners' real supported devices;
4. prepare migration inputs from existing spreadsheets/research;
5. export/archive legacy source files;
6. import/reconcile into production;
7. create verified full backup;
8. only then declare Mariage OS operational source of truth.
