# Work Packet Record — WP-0.5

## Identity

- Work Packet ID: `WP-0.5`
- Lot: `0`
- Name: CI, preview, secret and dependency security
- State: `ACCEPTED`
- Current pass: `C-ACCEPTANCE-COMPLETE`
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

Implemented evidence:

- consolidated `.github/workflows/ci.yml` running from clean checkout with full `npm ci`;
- read-only `contents: read` workflow permission and `persist-credentials: false` on checkout;
- GitHub actions pinned to immutable commit SHAs;
- environment validator requiring local/CI operation without production credentials;
- negative environment control proving a sensitive credential variable is rejected;
- version-controlled secret scanner plus deliberate secret-like negative fixture;
- dependency audit through `npm audit --audit-level=high`;
- Core job covering typecheck, static architecture/maintainability gates, deliberate quality/security negative controls, unit/property/coverage tests and production build;
- Local Supabase job covering start, deterministic reset/seed, direct DB/RLS verification and guaranteed stop;
- browser/mutation job covering Chromium, Firefox, WebKit, mobile Chromium smoke and Stryker mutation testing;
- privacy-safe static preview artifact containing build output only;
- obsolete temporary bootstrap/Supabase/Prettier probe workflows removed;
- obsolete Knip Supabase dependency ignore removed after Supabase became an active tool dependency;
- `npm run verify` upgraded to include dependency security and fail-safe DB/RLS orchestration with `db:stop` guaranteed in a `finally` path.

## Pass B — ADVERSARIAL REVIEW

Result: **PASS — no unresolved BLOCKING/MAJOR finding**.

Findings repaired during adversarial review:

1. workflow actions initially used mutable major tags → pinned to exact immutable SHAs;
2. checkout initially persisted workflow authentication → `persist-credentials: false` added everywhere;
3. environment validation lacked an explicit fail-closed proof → negative credential control added;
4. `actions/upload-artifact@v5` still targeted deprecated Node 20 → upgraded to the maintained v6 commit SHA;
5. `verify` initially omitted dependency audit and DB/RLS verification → replaced by a complete fail-safe orchestrator;
6. WP-0.2's temporary Knip ignore for Supabase remained after activation → removed and normal dead-code analysis remained green;
7. all one-shot diagnostic workflows were deleted so only the durable Lot 0 CI workflow remains.

No guardrail threshold, scanner scope, RLS rule or security expectation was weakened to obtain a green run.

## Pass C — ACCEPTANCE

Final exact-head verification: GitHub Actions run `33804821176` on commit `ac3799fee3dc49b1663d0b2e1a15d750c4b096ec`.

| Responsibility | Implemented evidence | Runtime/CI evidence | Result |
|---|---|---|---|
| clean reproducible CI | lockfile + `npm ci` + pinned Node | all jobs clean-checkout green | PASS |
| least privilege | `contents: read`, non-persisted checkout credentials | workflow job permissions/read-only execution | PASS |
| environment/no-prod-secret boundary | validator + negative credential control | both positive and negative controls green | PASS |
| secret scanning | tracked-file scanner + deliberate secret fixture | normal scan passes; deliberate fixture rejected | PASS |
| dependency security | high/critical npm audit | audit step green | PASS |
| static/unit/property/coverage/build | Core CI job | all Core steps green | PASS |
| local DB/RLS | Supabase job | start/reset/seed/RLS/stop all green | PASS |
| browser/mutation | Playwright + Stryker job | browsers and mutation smoke green | PASS |
| privacy-safe preview | static `dist/` artifact only | preview artifact job green | PASS |
| durable workflow hygiene | one consolidated CI workflow | temporary probes removed | PASS |
| full verify contract | fail-safe `verify` orchestrator | component responsibilities all green; exact single-command proof delegated to WP-0.6 integration | PASS |

Acceptance decision: **ACCEPTED**.

## Handoff

- Current state/pass: `ACCEPTED / C-ACCEPTANCE-COMPLETE`
- Accepted packets: `WP-0.1` through `WP-0.5`
- Final packet evidence: GitHub Actions `33804821176` — SUCCESS across Core, DB/RLS, browser/mutation and preview jobs
- Open BLOCKING/MAJOR findings: none
- Next permitted packet: `WP-0.6` Lot integration/reconciliation/acceptance only
