# Quality Gates

Status: **Normative quality/release gate contract**

A required gate failing blocks merge/release. No “temporary” bypass without an explicit documented emergency process, and security/data-integrity blockers are not bypassable for convenience.

See `../engineering/VERSIONING-UPDATE-DELIVERY.md` for automated release/update sequencing.

## Pull-request gate

Target checks:

1. dependency install reproducible (`npm ci`)
2. formatting check
3. ESLint
4. TypeScript strict typecheck
5. architecture/dependency-cycle check
6. module-size/function-complexity check
7. unit tests
8. coverage thresholds
9. property tests
10. mutation tests where triggered
11. integration tests
12. database migration tests
13. RLS allow/deny tests
14. IndexedDB/local migration tests where applicable
15. import/export tests
16. sync/offline tests applicable to changed foundation
17. backup/restore tests where applicable
18. security/adversarial tests
19. E2E critical suite
20. automated accessibility checks
21. performance checks where applicable
22. production build
23. PWA/manifest/service-worker/update checks
24. secret scanning
25. dependency/static security scanning
26. documentation links/traceability/staleness checks
27. release/version/schema-impact consistency check
28. privacy-safe preview deployment where applicable

CI may parallelize gates, but required results remain equivalent to a clean full verification.

## Coverage gate

In-scope business/application code:

- lines 100%
- statements 100%
- functions 100%
- branches 100%

Documented legitimate exclusions only.

## Maintainability gate

Production code must satisfy `engineering/CODEBASE-STRUCTURE.md` and `engineering/MODULE-SIZE-COMPLEXITY.md`.

Unapproved forbidden dependency, cycle, god file, over-limit function/file or complexity exception blocks feature acceptance/merge according to severity.

## Vulnerability gate

Default release policy:

- Critical: 0 accepted known
- High: 0 accepted known

Medium/Low are reviewed with risk, exploitability, applicability and remediation plan; they are not ignored automatically.

## RLS gate

Any change to schema/access requires direct authorization tests. A missing required deny test blocks completion.

## Migration gate

Every migration applies successfully from clean schema and every historically supported fixture required by policy.

For production-bound releases:

- repository/remote migration history must agree;
- exact pending migration set is known;
- staging rehearsal passes;
- migration/release ordering is compatible with current and target frontend;
- destructive migration has tested recovery/retention plan;
- failed DB/RLS health check prevents frontend production promotion.

## Local/PWA migration gate

A release changing IndexedDB, sync envelope, Service Worker/cache semantics or persisted settings proves:

- supported old local versions migrate sequentially;
- pending mutations/drafts survive;
- failed migration has recoverable state;
- stale incompatible app stops unsafe writes;
- open-tab/update behavior does not lose work;
- skipped intermediate app versions behave according to compatibility policy.

## Backup gate

A release that changes portable data format/schema must keep supported backup/restore/migration tests green.

Major-version release additionally proves supported prior-major backup → current restore/migration.

## Import/export gate

Any changed import/export contract keeps applicable:

- idempotent reimport;
- protected truth;
- duplicate safety;
- hostile-file handling;
- formula-safe exports;
- supported old schema migration;
- claimed round trip.

## E2E gate

Critical journeys must pass. Known flaky critical tests block release until resolved.

## Mutation gate

Changed critical business engines require mutation policy compliance. Meaningful surviving mutants indicate inadequate tests.

## Documentation gate

Behavior/schema/security/UX/release changes update their governing specification/ADR/test traceability. Documentation drift is a defect.

Normative entry points must not disagree on current gate, scope, architecture precedence or release state.

## Version/release gate

Every production candidate must have:

- valid SemVer-style version;
- exact immutable commit/build identity;
- generated/validated release manifest;
- changelog/release plan as required;
- cloud/local/sync/import/backup compatibility matrix;
- minimum safe app version where needed;
- no unexplained changed interface omitted from release impact review.

A candidate change invalidates evidence from the prior candidate build.

## Staging release gate

Before production promotion:

- exact candidate migrations applied to staging;
- exact candidate frontend deployed;
- full required verification green;
- migration/RLS/integrity checks green;
- browser/device smoke green;
- PWA update path green;
- historical local/import/backup migration tests green where affected;
- security/visual/accessibility reviews green where affected.

## Production promotion gate

Before protected production ref is promoted:

- release/deployment lock acquired;
- exact approved commit/version still green;
- production migration history verified;
- required recovery point verified;
- backward-compatible DB/RLS migrations applied;
- post-migration DB/RLS health checks green.

If any check fails, frontend production promotion does not proceed.

## Post-deployment health gate

A deployment is not `HEALTHY` until:

- Cloudflare/hosting deployment succeeds;
- release manifest/version is correct;
- application boot/smoke passes;
- Auth and critical authorized path smoke passes;
- applicable deny/security smoke passes;
- app/backend compatibility is correct;
- update/PWA discovery behaves correctly;
- severe monitoring regressions are absent or explained.

Severe unexplained regression marks release `DEGRADED`/`FAILED` and triggers rollback/forward-fix procedure.

## Major-version / V1→V2 gate

Before a major release:

- approved product/scope delta exists;
- every prior-major feature is reconciled;
- cloud schema migration chain passes;
- IndexedDB sequential migration passes;
- sync-protocol migration passes where changed;
- import schema migration passes;
- prior-major backup restore/migration passes;
- persisted settings migration passes;
- changed routes/interfaces are UX/accessibility reviewed;
- representative complete synthetic prior-major project upgrades in place;
- production recovery rehearsal passes;
- minimum safe old-client/forced-update boundary is defined;
- irreversible cleanup is deferred until new major version is healthy.

## Manual production-readiness gate

Before major production cutover/release:

- security advisor/checks reviewed;
- real-device smoke test;
- backup verified;
- free-tier usage healthy;
- production config variables reviewed;
- no debug/test data in production;
- changelog/release notes ready;
- rollback/forward-fix plan reviewed.

## Release blockers regardless of test status

- known silent data loss;
- incorrect supported financial/guest/seating calculation;
- cross-project authorization/reference leak;
- exposed secret/private production artifact;
- unrecoverable migration;
- broken restore of supported backup;
- unsolved critical corruption race;
- incompatible stale PWA cache/client that can corrupt data;
- production schema ahead/behind release expectation without approved recovery;
- target frontend incompatible with post-migration backend;
- failed required CI/security/RLS check;
- unresolved BLOCKING/MAJOR checkpoint/release finding;
- severe post-deployment regression with unknown impact.
