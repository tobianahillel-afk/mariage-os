# Lot 0 — Coverage Matrix and Work Packet Plan

Status: **IN_PROGRESS — user explicitly kicked off Lot 0**

Purpose: decompose Lot 0 into bounded, reviewable Work Packets before production/tooling implementation, as required by `docs/engineering/AI-LOT-ORCHESTRATION.md`.

## Lot 0 goal

Create a reproducible engineering environment and executable quality pipeline before feature work. No wedding-domain feature implementation is permitted in this Lot.

## Required responsibilities

| Required item | Owning contract/control | Packet(s) | Dependencies | Final evidence |
|---|---|---|---|---|
| Vite + framework-light TypeScript skeleton | LOT-ACCEPTANCE / CODEBASE-STRUCTURE / no-React ADR | WP-0.1 | none | clean build + smoke page |
| strict TypeScript and stable path aliases | CODING-STANDARDS / CODEBASE-STRUCTURE | WP-0.1, WP-0.2 | WP-0.1 | typecheck + architecture checks |
| reproducible npm install + committed lockfile | QUALITY-GATES / CI-CD | WP-0.1 | npm registry in CI | `npm ci` green from clean checkout |
| lint + formatting | QUALITY-GATES / MODULE-SIZE-COMPLEXITY | WP-0.2 | WP-0.1 | lint + format check green |
| layer-boundary + cycle checks | CODEBASE-STRUCTURE / MODULE-SIZE-COMPLEXITY | WP-0.2 | WP-0.1 | valid tree passes; deliberate violation fails |
| file/function/complexity/nesting/parameter guardrails | MODULE-SIZE-COMPLEXITY | WP-0.2 | WP-0.1 | static checks + negative fixture |
| dead-code / unused dependency safeguards | CODING-STANDARDS / QUALITY-GATES | WP-0.2 | WP-0.1 | static/dead-code check green |
| TODO/FIXME/HACK/TEMP policy | CODING-STANDARDS / MODULE-SIZE-COMPLEXITY | WP-0.2 | WP-0.1 | policy scanner green + negative fixture |
| Vitest unit + coverage harness | LOT-ACCEPTANCE / QUALITY-GATES | WP-0.3 | WP-0.1 | unit + 100% scaffold coverage green |
| property-test harness | LOT-ACCEPTANCE / TESTING-STRATEGY | WP-0.3 | WP-0.1 | fast-check property smoke green |
| Playwright E2E harness | LOT-ACCEPTANCE / E2E-TESTING | WP-0.3 | WP-0.1 | critical smoke E2E green in CI |
| mutation-testing harness | LOT-ACCEPTANCE / MUTATION-TESTING | WP-0.3 | WP-0.1 | Stryker smoke/config validation green |
| local Supabase config + migration/test directories | LOT-ACCEPTANCE / CI-CD | WP-0.4 | WP-0.1 | `supabase` config validates; local start/reset job green where Docker available |
| isolated synthetic seed/golden project | LOT-ACCEPTANCE / TEST-DATA | WP-0.4 | WP-0.1 | synthetic fixture only; no real wedding data |
| DB/RLS direct-test harness foundation | QUALITY-GATES / SECURITY-TESTING | WP-0.4 | local Supabase | DB test command/harness green |
| environment validation and no-secret safeguards | LOT-ACCEPTANCE / SECURITY | WP-0.5 | WP-0.1 | env validation + secret scan green |
| GitHub Actions clean-checkout CI | CI-CD / QUALITY-GATES | WP-0.5 | WP-0.1..0.4 | required jobs execute on PR/push |
| privacy-safe preview/build artifact | CI-CD / LOT-ACCEPTANCE | WP-0.5 | WP-0.1 | production build + preview artifact green |
| dependency/static security scanning | QUALITY-GATES | WP-0.5 | lockfile | dependency audit/security job green or explicit actionable failure |
| `dev`, `test:fast`, `verify` command contracts | LOT-ACCEPTANCE / CI-CD | WP-0.1..0.5 | all tooling | documented scripts execute |
| fresh-clone bootstrap with no production credentials | LOT-ACCEPTANCE exit | WP-0.6 | WP-0.1..0.5 | clean CI verification |
| Lot 0 negative-control proof | LOTS / MODULE-SIZE-COMPLEXITY | WP-0.6 | WP-0.2 | deliberate architecture/quality violation is caught |
| Lot 0 integration/reconciliation/acceptance | AI-LOT-ORCHESTRATION / DEFINITION-OF-DONE | WP-0.6 | all packets | required - evidenced = ∅; integration PASS |

Required current-lot responsibilities minus assigned packet responsibilities: **∅**.

## Work Packet plan

### WP-0.1 — Reproducible TypeScript/Vite bootstrap

State: `IN_PROGRESS`

Scope:
- package metadata and lockfile bootstrap;
- Node/npm contract;
- Vite framework-light skeleton;
- strict TypeScript configs;
- path aliases/composition-root-compatible roots;
- baseline app boot/build;
- core `dev`, `build`, `typecheck` commands.

Planning complexity: **6/10**.

### WP-0.2 — Static architecture and maintainability gates

State: `PLANNED`

Scope:
- ESLint + Prettier;
- dependency-cruiser layer/cycle rules;
- module/function/complexity/parameter/nesting checks;
- TODO/FIXME/HACK/TEMP policy;
- dead-code/unused dependency checks;
- explicit negative fixtures proving guardrails fail correctly.

Planning complexity: **8/10**.

### WP-0.3 — Test harnesses

State: `PLANNED`

Scope:
- Vitest + V8 coverage;
- fast-check property tests;
- Playwright browser smoke;
- Stryker mutation harness;
- synthetic test helpers/fixtures;
- fast vs full test command split.

Planning complexity: **7/10**.

### WP-0.4 — Supabase local / DB security-test foundation

State: `PLANNED`

Scope:
- Supabase CLI config;
- migration/test/seed structure;
- deterministic synthetic seed/golden project;
- direct DB/RLS test harness foundation;
- no production credentials/data.

Planning complexity: **7/10**.

### WP-0.5 — CI, preview, secrets and dependency security

State: `PLANNED`

Scope:
- GitHub Actions from clean checkout;
- static/unit/build/docs/security jobs;
- Playwright/browser job;
- Supabase local DB job where runner supports Docker;
- secret scanning and dependency audit;
- privacy-safe build/preview artifact;
- workflow permissions/concurrency/caching safeguards.

Planning complexity: **8/10**.

### WP-0.6 — Lot 0 integration, adversarial review and acceptance

State: `PLANNED`

Scope:
- execute full `verify` from clean CI evidence;
- verify no production secrets/data are required;
- verify deliberate violating fixture is rejected;
- reconcile every Lot 0 responsibility;
- perform separate Lot Integration Pass;
- update status/review evidence;
- PR exact-head review and Lot acceptance decision.

Planning complexity: **6/10**.

## Sequencing

```text
WP-0.1
  ↓
WP-0.2 ──┐
WP-0.3 ──┼─→ WP-0.5 → WP-0.6
WP-0.4 ──┘
```

Default execution remains sequential for implementation/review evidence even where CI jobs later run in parallel.

## Explicitly out of Lot 0

- Auth/project/member implementation;
- real RLS business policies;
- any venue/vendor/guest/budget/task/etc. domain implementation;
- real Email/SMS/WhatsApp provider integration;
- real wedding data;
- production Supabase/Cloudflare cutover;
- Feature implementation from Lots 1–12.
