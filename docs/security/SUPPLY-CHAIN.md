# Supply-Chain Security

## Principle

Mariage OS intentionally minimizes external dependencies because every package, CI action and hosted third-party script increases attack and maintenance surface.

## npm dependencies

- justify each production dependency;
- prefer built-in browser/platform capabilities where clear;
- commit the lockfile;
- CI uses `npm ci`;
- review maintenance activity, license and security posture before adding important dependencies;
- remove unused dependencies promptly.

## Versioning

Production dependency ranges may exist in `package.json`, but the committed lockfile defines reproducible CI installations.

Do not casually regenerate lockfiles without review.

## Dependency scanning

CI/repository should enable or run:

- GitHub dependency/dependency-review capabilities where available;
- Dependabot alerts/PRs;
- `npm audit` or equivalent supplementary scanner;
- CodeQL/static analysis where applicable.

A dependency update is code change: it must pass the full required test suite.

## GitHub Actions

Minimize third-party actions.

Where practical for sensitive workflows, pin actions to immutable commit SHA rather than only floating tags.

Workflow permissions follow least privilege.

Untrusted pull-request code must not receive production secrets.

## CDN scripts

Avoid runtime third-party CDN JavaScript for core application behavior. Prefer bundled audited dependencies to reduce uncontrolled script changes and strengthen CSP.

## Build reproducibility

A clean checkout plus documented tool versions and lockfile must reproduce the application build and tests.

## Secrets

Production deployment/Supabase secrets live in authorized platform secret stores, never repository files or test fixtures.

Secret scanning should block or alert on accidental credentials.

## Public repository risk

Because the repository is public:

- issues/screenshots/fixtures must not contain real wedding data;
- debugging examples use synthetic entities;
- no production dumps;
- no private URLs/tokens.

## Package addition checklist

Before adding a material dependency:

1. What problem does it solve?
2. Can platform/local code solve it safely with lower lifetime cost?
3. Is it actively maintained?
4. Is its license acceptable?
5. What does it add to bundle size?
6. Does it process private data?
7. Does it require network/CDN access?
8. What new CSP permissions does it require?
9. How is it tested?
10. How would we replace it?

## Tests/controls

CI should fail or flag according to the quality-gate policy on critical/high dependency vulnerabilities, secret detection or unexpected lockfile integrity problems.
