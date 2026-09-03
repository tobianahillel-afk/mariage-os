# Versioning, Upgrade and Automated Update Delivery

Status: **Normative lifecycle/release architecture contract**

Purpose: ensure Mariage OS can evolve safely from `1.0.0` to `1.0.1`, `1.1.0`, `1.2.0`, `2.0.0` and later versions without losing wedding data, breaking offline clients, leaving stale interfaces active, or requiring undocumented manual production changes.

This document governs application versioning, cross-layer compatibility, automated release promotion, client update delivery, major-version migration and release rollback. It complements `RELEASE-PROCESS.md`, `MIGRATIONS.md`, `CI-CD.md`, `PWA-LIFECYCLE.md`, backup/recovery contracts and Quality Gates.

The implementation of the executable workflows belongs to Lot 0 and later production-readiness work. This document does **not** open the implementation gate.

---

# 1. Version model

Mariage OS uses Semantic Versioning-style releases:

`MAJOR.MINOR.PATCH`

Examples:

- `1.0.0` — initial V1 release;
- `1.0.1` — compatible bug/security fix;
- `1.1.0` — backward-compatible feature release;
- `1.2.0` — another compatible feature release;
- `2.0.0` — deliberate incompatible product/data contract evolution with an explicit migration program.

Pre-release channels use:

- `1.2.0-alpha.N`;
- `1.2.0-beta.N`;
- `1.2.0-rc.N`.

Version numbers are repository-controlled. Production versions are never inferred from deployment timestamps alone.

---

# 2. One release identity across every layer

Every production build has one immutable release identity containing at minimum:

- application version;
- Git commit SHA/build ID;
- release channel;
- build timestamp;
- frontend compatibility range;
- current/required cloud schema version range;
- IndexedDB/local schema version;
- sync protocol version where protocol semantics change;
- canonical import schema version;
- backup/container schema version;
- minimum supported application version for safe writes;
- release notes/changelog reference.

Lot 0 must generate a machine-readable release manifest such as `version.json`/`release-manifest.json` from repository metadata rather than maintaining contradictory hand-edited copies.

The UI Settings/Diagnostics surface must expose the application version/build identifier and relevant compatibility state without exposing secrets.

---

# 3. Versioned state layers

A release may affect one or more independent versioned layers:

1. static frontend/application shell;
2. PostgreSQL/Supabase schema;
3. RLS/GRANT/RPC/security policy implementation;
4. IndexedDB local schema;
5. synchronization protocol/operation envelope;
6. canonical import/export schema;
7. `.mariage` backup schema;
8. PWA/service-worker/cache format;
9. user settings/preferences persisted locally or remotely;
10. feature flags/capability metadata if later activated.

A release plan explicitly states which layers change. `No impact` must be deliberate, not assumed.

---

# 4. Compatibility contract

Every frontend build declares the backend/cloud schema range it supports.

Example conceptual metadata:

```text
appVersion: 1.2.0
cloudSchema: supports 14..15
localSchema: 8
syncProtocol: 3
importSchema: 2
backupSchema: 2
minSafeAppVersion: 1.1.0
```

The exact machine format is fixed during Lot 0.

Rules:

- a frontend outside the supported backend range must not perform unsafe writes;
- a backend migration must preserve an overlap window for the currently deployed frontend unless the release is an explicitly coordinated forced upgrade;
- old cached clients do not guess compatibility;
- a local schema migration cannot discard pending mutations;
- future import/backup schema unknown to an older client is rejected before mutation;
- compatibility failures preserve recoverable local work and explain the required action.

---

# 5. Expand-and-contract release rule

Schema/product changes prefer staged compatibility:

## Release A — expand

- add new fields/tables/RPCs while preserving old paths;
- backfill/migrate safely;
- deploy code able to coexist with old/new representation where required;
- verify old client overlap.

## Release B — switch

- make the new representation authoritative;
- migrate remaining data;
- verify all supported clients use it.

## Release C or later — contract

- remove obsolete structures only after no supported client/backup/migration path needs them;
- irreversible removal requires recovery evidence.

Do not couple destructive schema removal with the first frontend release that stops using it.

---

# 6. Environments and branch roles

The target lifecycle is:

```text
feature branch / PR
        ↓
preview build + synthetic/nonproduction tests
        ↓
main
        ↓
release candidate / staging promotion
        ↓
production migration gate
        ↓
production branch/tag promotion
        ↓
Cloudflare production deployment
        ↓
post-deploy verification / monitoring
```

Recommended branch/environment responsibilities:

### Feature/PR branches

- Cloudflare preview deployment;
- synthetic or isolated nonproduction backend only;
- no production secrets/data;
- full affected CI/quality checks.

### `main`

- integration truth;
- immutable release candidate can be built from a specific SHA;
- successful merge does **not** by itself mean production database migration has happened;
- production release orchestration starts only after release gates are satisfied.

### Staging/release-candidate environment

- production-like schema/config with synthetic data;
- apply exact pending migrations;
- execute migration, RLS, E2E, PWA, import/export/backup and visual smoke checks;
- prove artifact/commit that will be promoted.

### `production`

- protected deployment branch or equivalent immutable production ref;
- updated only by release automation after production migration/preconditions pass;
- Cloudflare Pages production branch points here (or an equivalent explicitly controlled release ref).

This separates automatic web deployment from database migration ordering. A merge to `main` cannot race an incompatible frontend ahead of its required production schema.

---

# 7. Automatic pull-request pipeline

Every PR must automatically perform applicable checks, including at minimum:

1. clean dependency install;
2. format/lint/typecheck;
3. dependency-boundary/cycle checks;
4. file/function/complexity guardrails;
5. unit/property/coverage;
6. mutation testing where triggered;
7. local Supabase migration/reset tests;
8. RLS allow/deny/adversarial tests;
9. IndexedDB migration tests;
10. import/export/round-trip tests;
11. backup migration/restore tests where affected;
12. offline/sync/PWA tests where affected;
13. security/secret/dependency scanning;
14. accessibility/performance checks where applicable;
15. production build;
16. documentation link/traceability/staleness checks;
17. version/migration impact validation;
18. preview deployment with synthetic data;
19. required visual evidence for material UI changes.

Path-based optimization may skip provably irrelevant expensive suites, but the skip decision itself is deterministic, auditable and conservative. Security/data/schema changes must never be incorrectly classified as low impact.

---

# 8. Release-candidate pipeline

A release candidate is created from an exact immutable commit SHA.

The pipeline:

1. determines/validates target version;
2. verifies changelog/release plan;
3. creates immutable build artifact/release manifest;
4. computes pending PostgreSQL migrations;
5. checks migration history consistency;
6. performs production migration dry-run where supported;
7. deploys exact migrations to staging;
8. builds/deploys exact frontend candidate to staging/preview;
9. runs full `verify` suite;
10. runs staging E2E/real-browser smoke;
11. tests old-client/new-backend overlap if schema changed;
12. tests new-client/old-backend failure/degraded behavior where relevant;
13. tests sequential IndexedDB upgrades from supported historical versions;
14. tests supported import and backup migrations;
15. records candidate evidence.

An RC that changes after evidence is invalidated and receives a new RC/build identity.

---

# 9. Production release orchestration

Production promotion is one controlled transaction-like sequence across systems; it is not a blind static-site deployment.

For an ordinary compatible release:

1. acquire release/deployment lock so two releases cannot migrate concurrently;
2. verify target commit/tag is still approved and CI-green;
3. verify production migration history matches repository expectation;
4. create/verify recovery point according to release risk;
5. apply backward-compatible production database/RLS migrations;
6. execute post-migration DB integrity/RLS health checks;
7. if checks fail, stop before frontend promotion and execute recovery/forward-fix procedure;
8. promote the exact release commit to the protected production ref;
9. Cloudflare deploys the exact static artifact/ref;
10. wait for successful deployment status;
11. run production smoke checks using privacy-safe test paths/account/project as designed;
12. verify release manifest/version endpoint;
13. verify Auth, read, permitted write, deny case, sync, PWA shell and critical navigation as applicable;
14. mark release `HEALTHY` only after verification;
15. start post-deployment observation window;
16. publish/retain release evidence and changelog.

Destructive contract migrations occur only in later release steps after the old client dependency has been retired.

---

# 10. Release states

Use machine-visible lifecycle states equivalent to:

- `PLANNED`
- `CANDIDATE_BUILDING`
- `CANDIDATE_VERIFYING`
- `READY_FOR_PRODUCTION`
- `PRODUCTION_MIGRATING`
- `PRODUCTION_DEPLOYING`
- `PRODUCTION_VERIFYING`
- `HEALTHY`
- `DEGRADED`
- `FAILED`
- `ROLLING_BACK`
- `ROLLED_BACK`
- `SUPERSEDED`

Do not call a release successful merely because Cloudflare returned a deployment URL.

---

# 11. Browser/PWA automatic update delivery

Mariage OS is web/PWA software; there is no App Store approval required for ordinary frontend releases.

After production deployment:

1. the new versioned static shell becomes the production version;
2. browsers discover the updated Service Worker/assets;
3. the running app checks release/version metadata on startup and when returning to foreground, plus a conservative periodic check during long-running sessions;
4. if a compatible update exists and no unsafe unsaved transition is active, show a clear update-ready action;
5. preserve durable local drafts/pending operations before reload;
6. activate the new shell;
7. run sequential IndexedDB migration transactionally;
8. verify cloud compatibility;
9. resume pending synchronization only after compatibility succeeds.

For a security-critical or backend-incompatible obsolete client:

- reads may remain available where safe;
- unsafe writes are blocked;
- local pending work is preserved;
- UI enters an explicit `Update required` state;
- reload/update is required before normal writes resume.

A service worker must never silently reload a user mid-edit and lose input.

---

# 12. Updating every interface

A feature/version change that alters user-visible semantics must reconcile all affected surfaces, not only the screen where the change originated.

Release impact review includes:

- Dashboard/read models;
- global search;
- Inbox/conversion;
- collection/list/table/card summaries;
- entity detail;
- comparison views;
- mobile and desktop variants;
- Settings/Diagnostics;
- offline/conflict/error states;
- import mapping/preview/report;
- exports/print/frozen snapshots;
- notifications/status indicators if introduced;
- accessibility names/help text;
- documentation/help/release notes.

`DEPENDENCY-GRAPH.md` plus the Feature Implementation Record drive this review.

A backend field/state addition is incomplete if existing UI can silently misrepresent it.

---

# 13. V1 → V2 major-upgrade program

A major version is treated as a migration program, not a large ordinary PR.

Before `2.0.0` production release:

1. create a `V2` product/scope specification and explicit delta from V1;
2. assign new/changed Requirement/Feature/Acceptance IDs while preserving historical traceability;
3. classify every V1 feature as unchanged / changed / deprecated / replaced / removed;
4. create cloud schema migration plan;
5. create local IndexedDB migration chain;
6. create sync-protocol compatibility plan;
7. create import/export schema migration plan;
8. create backup schema migration/restore plan;
9. create UI route/screen migration map;
10. create user-setting/preference migration plan;
11. define minimum supported old app version and forced-update boundary;
12. retain V1 historical fixtures;
13. prove direct/sequential upgrade of every supported V1.x state to V2;
14. prove backup from supported V1 can restore/migrate into V2;
15. prove no pending offline mutation is silently discarded during upgrade;
16. run complete security/threat-model review for new surfaces;
17. run UX/accessibility/responsive review for all changed routes;
18. run staging rehearsal using a representative synthetic V1 project upgraded in place;
19. run production backup/recovery rehearsal;
20. obtain major-release approval/gate evidence;
21. execute expand/migrate/promote sequence;
22. monitor post-upgrade health;
23. delay irreversible cleanup until V2 is proven healthy.

The migration chain must support users who skipped intermediate patch/minor frontend releases when technically safe. IndexedDB/backup/data migrations are sequential/version-aware rather than assuming every device opened each intermediate version.

---

# 14. Minor and patch upgrades

## Patch `1.2.0 → 1.2.1`

Expected characteristics:

- no intentional breaking product/data contract;
- migration optional but backward-compatible;
- full affected regression/security checks;
- automated promotion after required gates.

## Minor `1.2.x → 1.3.0`

Expected characteristics:

- additive/backward-compatible features;
- new schema typically expand-first;
- all new Feature/Requirement/UX/permission/test evidence required;
- older supported client overlap explicitly tested if backend changes.

No release receives a lower verification standard because its version number is small.

---

# 15. Rollback and forward recovery

Frontend and database rollback have different semantics.

## Frontend

A previous successful Cloudflare production deployment/production ref may be restored rapidly if its backend compatibility range still includes the current production schema.

Before frontend rollback, automation verifies this compatibility. Never roll an old UI back against a backend it cannot safely use.

## Database

Prefer forward fixes and expand/contract recovery. Do not assume every migration is safely reversible.

If a database migration fails before frontend promotion:

- stop release;
- preserve evidence;
- execute tested rollback/recovery where safe or a forward corrective migration;
- do not promote frontend.

If a production defect appears after frontend promotion:

- classify frontend-only vs backend/data defect;
- block dangerous writes if necessary;
- rollback frontend only when schema compatibility permits;
- otherwise deploy a forward hotfix/recovery migration.

No rollback deletes user data merely to restore an older application version.

---

# 16. Production monitoring after each update

Each release has an observation window whose evidence includes, as applicable:

- deployment/build status;
- release manifest/version correctness;
- Auth success/failure anomalies;
- database migration status;
- database constraint/RLS health probes;
- application boot failures;
- unhandled error/diagnostic counts;
- sync queue failure/conflict trends;
- IndexedDB migration failures;
- Service Worker update failures;
- incompatible-client/update-required events;
- import/backup errors;
- storage/quota pressure;
- performance regressions;
- critical user-flow smoke results.

Monitoring must follow privacy/PII minimization rules. Do not solve observability by logging private wedding content.

A release with unexplained severe regression becomes `DEGRADED`/`FAILED`; it is not left marked healthy because deployment technically completed.

---

# 17. Change surveillance before release

CI classifies changed paths and semantic impact so a change cannot silently bypass required review.

Examples:

- `supabase/migrations/**` → DB migration + RLS + historical fixture + compatibility checks;
- `src/domain/**` → unit/property/coverage + affected Feature/Requirement evidence;
- `src/infrastructure/supabase/**` → integration/RLS/security checks;
- `src/infrastructure/indexeddb/**` → local migration/offline/restart checks;
- `src/ui/**` → UX/accessibility/mobile/visual evidence;
- `src/import-export/**` → hostile-file/idempotence/round-trip/migration checks;
- service-worker/PWA files → update/cache/offline compatibility suite;
- security/auth/permission files → direct deny/adversarial review;
- version/release files → release-manifest consistency checks;
- docs governing behavior → traceability/staleness validation.

If classification is ambiguous, choose the broader test/review set.

---

# 18. Release plan artifact

Every minor/major release and any high-risk patch has a durable release plan/evidence record containing:

- target version;
- exact commit SHA;
- included Feature/Requirement IDs;
- schema/local/import/backup versions before/after;
- compatibility matrix;
- migrations;
- rollout sequence;
- release blockers;
- security/privacy impact;
- UX surfaces changed;
- test evidence;
- recovery/rollback plan;
- staging result;
- production result;
- post-release monitoring result;
- known limitations;
- final release status.

A template lives under `docs/templates/RELEASE-PLAN.md`.

---

# 19. Version support and forced upgrades

The application does not allow an indefinitely stale browser to mutate evolving production data.

Each release manifest defines compatibility, not an arbitrary assumption that all old clients work forever.

When a client falls below `minSafeAppVersion`:

- do not discard its local pending state;
- disable incompatible server writes;
- explain that an update is required;
- preserve/export/recover local work as defined;
- refresh to a supported app version;
- run local migrations;
- resume only after compatibility check.

For a future public SaaS deployment, rollout/cohort controls may progressively expose new features, but data/schema compatibility remains authoritative and is not replaced by UI feature flags.

---

# 20. Release automation security

Release automation is privileged infrastructure.

Rules:

- production deployment/migration credentials exist only in protected CI environments;
- untrusted PRs never receive them;
- least-privilege GitHub Actions permissions;
- immutable/pinned third-party actions where practical;
- production environment protection/approval for high-risk or major release;
- one migration/deployment lock at a time;
- no production secrets in artifacts/logs;
- no user-provided release metadata evaluated as code;
- exact commit/build provenance retained;
- deployment from arbitrary local developer machine is not normal production procedure.

---

# 21. Lot 0 executable deliverables

Once the implementation gate opens, Lot 0 must implement the foundations required by this contract, including equivalents of:

- application version/build generation;
- release manifest generation/validation;
- PR CI workflow;
- preview build integration;
- dependency/architecture/complexity checks;
- migration dry-run/test tooling;
- protected environment placeholders/config contracts;
- staging/production release workflow skeleton;
- release lock/concurrency controls;
- deployment provenance/commit capture;
- generated changelog/version consistency checks;
- PWA version/update test harness.

Production credentials and real production rollout are introduced only at the appropriate secure deployment/release stage.

---

# 22. Definition of update-system completeness

The update system is not complete until repository evidence proves:

- a PR automatically receives preview + required checks;
- a merge cannot bypass migration/compatibility review;
- staging rehearses exact production artifact/migrations;
- production database migration is ordered safely before dependent UI activation;
- the exact release is automatically delivered to web/PWA clients;
- open clients detect updates without losing work;
- stale incompatible clients cannot corrupt data;
- IndexedDB upgrades preserve pending work;
- V1 backups/imports migrate as promised;
- production health is checked after deployment;
- frontend rollback is compatibility-checked;
- DB recovery is tested;
- release evidence ties version → commit → migrations → tests → deployment;
- V1 → V2 upgrade is rehearsed using historical V1 fixtures;
- no essential release step depends on undocumented manual memory.
