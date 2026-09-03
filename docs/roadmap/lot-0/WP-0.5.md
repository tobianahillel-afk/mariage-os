# Work Packet Record — WP-0.5

## Identity

- Work Packet ID: `WP-0.5`
- Lot: `0`
- Name: CI, preview, secret and dependency security
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
- Primary bounded context: engineering CI/security/reproducibility infrastructure
- Branch/PR: `lot-0/repository-tooling`

## Scope

- clean-checkout GitHub Actions quality pipeline;
- environment validation and no-secret safeguards;
- dependency audit;
- local Supabase DB job;
- browser/mutation/build verification;
- privacy-safe static preview artifact;
- least-privilege workflow permissions and concurrency;
- final `verify` command contract.

## Critical scope boundary

No production deployment, production credentials, production Supabase project, real wedding data, or Product Feature implementation belongs to WP-0.5.

## Pass A — IMPLEMENT

Required evidence:

- clean checkout + `npm ci`;
- static/type/unit/property/coverage/negative controls green;
- DB reset/seed/RLS tests green;
- Playwright and mutation smoke green;
- production build green;
- environment validation passes without production credentials;
- secret guard rejects deliberate secret-like fixture;
- dependency audit has no unhandled high/critical vulnerability;
- preview artifact contains build output only and no production/private data;
- workflow permissions are read-only except artifact upload capability supplied by GitHub;
- `verify` command is executable and documented in package scripts.

## Pass B — ADVERSARIAL REVIEW

Not started.

## Pass C — ACCEPTANCE

Not started.
