# Work Packet Record — WP-0.1

## Identity

- Work Packet ID: `WP-0.1`
- Lot: `0`
- Name: Reproducible TypeScript/Vite bootstrap
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
- Primary bounded context: engineering bootstrap/toolchain
- Branch/PR: `lot-0/repository-tooling`

## Scope

### Primary Feature IDs

- None. Lot 0 is cross-cutting engineering foundation work and must not mark product Features implemented.

### Current-lot responsibilities covered

- framework-light Vite skeleton;
- strict TypeScript;
- npm package metadata + reproducible lockfile;
- stable path aliases;
- baseline build/boot;
- core `dev`, `build`, `typecheck` command contracts.

### Governing contracts

- `docs/roadmap/LOT-ACCEPTANCE.md` — Lot 0
- `docs/roadmap/LOTS.md` — Lot 0
- `docs/engineering/CODEBASE-STRUCTURE.md`
- `docs/engineering/CODING-STANDARDS.md`
- `docs/engineering/AI-LOT-ORCHESTRATION.md`
- `docs/quality/QUALITY-GATES.md`
- `docs/engineering/CI-CD.md`

### Explicitly out of scope

- lint/static architecture enforcement beyond bootstrap hooks (WP-0.2);
- full test harnesses (WP-0.3);
- Supabase local foundation (WP-0.4);
- CI/preview/security workflows (WP-0.5);
- Lot integration/acceptance (WP-0.6);
- all product Feature implementation.

## Dependency / sequencing

- Required prior packets/features: none
- Downstream packets blocked by this packet: WP-0.2, WP-0.3, WP-0.4, WP-0.5
- Shared interfaces/contracts relied on: canonical roots and aliases from `CODEBASE-STRUCTURE.md`

## Sizing review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| new/changed bounded domain | 1 | 3 | 3 |
| persistent entity/table | 0 | 1 | 0 |
| migration family | 0 | 1 | 0 |
| RPC/public endpoint/capability command | 0 | 2 | 0 |
| RLS/privileged authorization boundary | 0 | 2 | 0 |
| major UI route/workflow | 1 | 1 | 1 |
| public/unauthenticated capability surface | 0 | 2 | 0 |
| external provider integration | 0 | 3 | 0 |
| offline/sync semantics | 0 | 2 | 0 |
| security-sensitive token/crypto boundary | 0 | 2 | 0 |
| financial/calculation critical engine | 0 | 3 | 0 |
| backup/import/version migration semantics | 0 | 2 | 0 |
| package/reproducibility bootstrap complexity allowance | 1 | 2 | 2 |
| **Total** |  |  | **6** |

## Expected vertical slice

- UI/route: minimal framework-light engineering bootstrap page only
- application command/query/service: none
- domain rules/invariants: none
- ports/interfaces: none
- infrastructure adapters: none
- cloud persistence/RLS: none
- local/offline behavior: none
- import/export/backup/versioning impact: none
- UX/QIF/accessibility impact: minimal semantic bootstrap page; not a product screen

## Pass A — IMPLEMENT

### Implementation evidence

- code/modules: pending
- package/lock/config: pending
- tests added: smoke verification only in this packet; full harness WP-0.3
- docs/status updated: yes

### Pass A exit

- [ ] intended bootstrap exists
- [ ] strict typecheck command exists
- [ ] production build command exists
- [ ] package lock is committed and `npm ci` is designed to be reproducible
- [ ] no known untracked stub/TODO
- [ ] packet moved from `IN_PROGRESS` to `REVIEW_PENDING`
- [ ] current/next pass recorded as `B-ADVERSARIAL-REVIEW`

## Pass B — ADVERSARIAL REVIEW

Not started.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started.

## Handoff

- Current state/pass: `IN_PROGRESS / A-IMPLEMENT`
- Last green verification: pre-code design gate only
- Remaining blocker/finding: none known
- Next permitted action: create and verify the reproducible Vite/TypeScript bootstrap
