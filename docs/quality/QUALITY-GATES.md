# Quality Gates

A required gate failing blocks merge/release. No “temporary” bypass without an explicit documented emergency process, and security/data-integrity blockers are not bypassable for convenience.

## Pull-request gate

Target checks:

1. dependency install reproducible (`npm ci`)
2. formatting check
3. ESLint
4. TypeScript strict typecheck
5. unit tests
6. coverage thresholds
7. property tests
8. integration tests
9. database migration tests
10. RLS allow/deny tests
11. import/export tests
12. sync/offline tests applicable to changed foundation
13. backup/restore tests where applicable
14. security/adversarial tests
15. E2E critical suite
16. automated accessibility checks
17. production build
18. PWA/manifest/service-worker checks
19. secret scanning
20. dependency/static security scanning

CI may parallelize gates, but required results remain equivalent to a clean full verification.

## Coverage gate

In-scope business/application code:

- lines 100%
- statements 100%
- functions 100%
- branches 100%

Documented legitimate exclusions only.

## Vulnerability gate

Default release policy:

- Critical: 0 accepted known
- High: 0 accepted known

Medium/Low are reviewed with risk, exploitability, applicability and remediation plan; they are not ignored automatically.

## RLS gate

Any change to schema/access requires direct authorization tests. A missing required deny test blocks completion.

## Migration gate

Every migration applies successfully from supported previous schema fixtures and clean schema. Destructive migration requires tested backup/rollback strategy.

## Backup gate

A release that changes portable data format/schema must keep supported backup/restore tests green.

## E2E gate

Critical journeys must pass. Known flaky critical tests block release until resolved.

## Mutation gate

Changed critical business engines require mutation policy compliance. Meaningful surviving mutants indicate inadequate tests.

## Documentation gate

Behavior/schema/security changes update their governing specification/ADR/test traceability. Documentation drift is a defect.

## Manual production-readiness gate

Before major production cutover/release:

- security advisor/checks reviewed;
- real-device smoke test;
- backup verified;
- free-tier usage healthy;
- production config variables reviewed;
- no debug/test data in production;
- changelog/release notes ready.

## Release blockers regardless of test status

- known silent data loss;
- incorrect supported financial calculation;
- cross-project authorization leak;
- exposed secret;
- unrecoverable migration;
- broken restore of supported backup;
- unsolved critical corruption race;
- incompatible stale PWA cache that can corrupt data.
