# Mariage OS — Implementation Status Board

Status: **Living repository source of truth for development progress**

Purpose: answer “where exactly are we?” without relying on chat history, memory or interpretation of recent commits.

## Current phase

- V1 documentation/design: **COMPLETE / FROZEN**.
- Guest RSVP + Email/SMS/WhatsApp scope: **MERGED / FROZEN**.
- AI Lot Orchestration governance: **MERGED / FROZEN**.
- Final Design Review: **PASS**.
- Implementation gate: **OPEN**.
- **Lot 0: IN_PROGRESS** — explicitly kicked off by the user on 2026-09-03.
- Lots 1–12: **NOT_STARTED**.

Lot 0 is the only permitted implementation scope. No wedding-domain Feature implementation from Lots 1–12 may begin.

## Frozen V1 feature inventory

Authoritative V1 inventory:

- `../FEATURE-LEDGER.md` — `FTR-001..104`;
- `../FEATURE-LEDGER-GUEST-COMMUNICATIONS-EXTENSION.md` — `FTR-105..120`.

Total: **120 V1 capabilities**.

Feature implementation counts remain:

- `IN_PROGRESS`: 0 product Feature IDs;
- `IMPLEMENTED`: 0;
- `VERIFIED`: 0;
- `INTEGRATED`: 0;
- `ACCEPTED`: 0;
- `BLOCKED`: 0.

Lot 0 is engineering foundation work and does not falsely mark product Features implemented.

## Current Lot 0 orchestration

Coverage/packet plan:

`lot-0/LOT-0-COVERAGE-MATRIX.md`

Required-current-lot-responsibilities minus assigned packet responsibilities: **∅**.

Planned packets:

1. `WP-0.1` — reproducible TypeScript/Vite bootstrap;
2. `WP-0.2` — static architecture and maintainability gates;
3. `WP-0.3` — unit/property/coverage/E2E/mutation harnesses;
4. `WP-0.4` — Supabase local / DB security-test foundation;
5. `WP-0.5` — CI, preview, secret/dependency security;
6. `WP-0.6` — Lot integration, adversarial review, reconciliation and acceptance.

### Durable cursor

- Current Lot: **0**
- Lot state: **IN_PROGRESS**
- Current packet: **WP-0.1**
- Packet state: **IN_PROGRESS**
- Current pass: **A-IMPLEMENT**
- Accepted packets: **none yet**
- Review-failed/blocked packets: **none**
- Latest relevant verification: **pre-code design gate PASS; runtime verification begins in Lot 0**
- Next permitted action: **implement WP-0.1 only, then move it to REVIEW_PENDING and perform Pass B**

Default rule remains one unrelated packet `IN_PROGRESS` at a time.

## Lot 0 acceptance target

Lot 0 must produce and prove, from a clean checkout:

- Vite + framework-light TypeScript skeleton;
- strict TypeScript;
- stable aliases and frozen architecture roots;
- reproducible npm install/lockfile;
- lint/format;
- layer/cycle/module-size/function-complexity/parameter/TODO/dead-code safeguards;
- Vitest unit + coverage;
- property-test harness;
- Playwright;
- mutation-test harness;
- Supabase local config/migration/test/seed foundation;
- isolated synthetic golden project/test data;
- direct DB/RLS test-harness foundation;
- environment/no-secret safeguards;
- `dev`, `test:fast`, `verify` command contracts;
- GitHub Actions clean-checkout CI;
- privacy-safe build/preview artifact;
- deliberate violating fixture/example caught by an architecture/complexity guardrail;
- all packet A/B/C evidence;
- empty Lot reconciliation;
- separate Lot Integration Pass;
- base Lot 0 acceptance criteria green.

## Lot status

| Lot | Name | State |
|---:|---|---|
| 0 | Repository & tooling | **IN_PROGRESS** |
| 1 | Identity/project foundation | NOT_STARTED |
| 2 | Venues core | NOT_STARTED |
| 3 | Tasks/decisions/Inbox | NOT_STARTED |
| 4 | Import/export foundation | NOT_STARTED |
| 5 | Budget/payments | NOT_STARTED |
| 6 | Guests/invitations/RSVP/communications/seating | NOT_STARTED |
| 7 | Vendors/contracts | NOT_STARTED |
| 8 | Dashboard/planning/timeline/search | NOT_STARTED |
| 9 | Map/access | NOT_STARTED |
| 10 | Offline/PWA hardening | NOT_STARTED |
| 11 | Backup/recovery/providers/production | NOT_STARTED |
| 12 | Existing data/cutover | NOT_STARTED |

## Cross-lot checkpoints

| Checkpoint | Lots | State |
|---|---|---|
| A | 0–3 | NOT_STARTED |
| B | 4–7 | NOT_STARTED |
| C | 8–10 | NOT_STARTED |
| D | 11–12 | NOT_STARTED |

Lot 0 acceptance does not by itself complete Checkpoint A; Lots 1–3 must also be accepted before that checkpoint.

## Current blockers

**Known blockers: 0 at Lot kickoff.**

New runtime/tooling findings must be recorded rather than hidden or bypassed.

## Handoff summary

```text
V1 design: COMPLETE / FROZEN
Implementation gate: OPEN
Current Lot: 0 — IN_PROGRESS
Current Work Packet: WP-0.1
Current pass: A-IMPLEMENT
Product Features implemented: 0
Next action: implement/review/accept WP-0.1; do not start Lot 1
```

The repository is the canonical handoff. Chat history is supplementary only.
