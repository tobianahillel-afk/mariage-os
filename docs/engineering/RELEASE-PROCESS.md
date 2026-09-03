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
  → Cloudflare Pages production deploy
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
- all changed user interfaces identified.

## Release candidate

Build one immutable candidate from an exact commit SHA.

Deploy the exact pending migrations and application build to staging/preview with synthetic/nonproduction data.

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
8. promote exact commit to protected production ref;
9. let Cloudflare deploy production static application;
10. verify release/version manifest;
11. run production smoke;
12. start post-release monitoring;
13. mark release `HEALTHY` only after verification;
14. perform destructive cleanup only in a later compatible release when safe.

Do not combine destructive schema removal with clients that may still depend on it.

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

Frontend rollback may use a previous successful Cloudflare production deployment/ref only if that frontend remains compatible with the current production backend.

Database rollback is not assumed. Prefer expand/contract + forward corrective migration. Destructive recovery requires tested backup/restore procedure.

A failed production DB migration before frontend promotion stops the release. A severe defect after frontend promotion may require write degradation, compatible frontend rollback, or forward DB/app hotfix depending on root cause.

## Monitoring

A deployment is not successful merely because hosting completed.

Observe applicable:

- application boot errors;
- Auth anomalies;
- DB migration/integrity state;
- RLS/security smoke;
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

## Production release blockers

See Quality Gates, Definition of Done and the release plan. P0/P1 known defects, incompatible migration state, failed required CI/security checks, unrecoverable data risk or unexplained severe post-deploy regression block/stop the release.

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
