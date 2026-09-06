# Work Packet Record — WP-0.4

## Identity

- Work Packet ID: `WP-0.4`
- Lot: `0`
- Name: Supabase local and direct DB/RLS test foundation
- State: `ACCEPTED`
- Current pass: `C-ACCEPTANCE-COMPLETE`
- Primary bounded context: engineering database/security test infrastructure
- Branch/PR: `lot-0/repository-tooling`

## Scope

- local Supabase configuration and ordered migration directory;
- reproducible local reset/seed command foundation;
- direct PostgreSQL/RLS test harness;
- deterministic synthetic multi-tenant principals and rows;
- version-controlled synthetic golden-project seed foundation;
- no production credentials or real wedding/customer data.

## Critical scope boundary

Lot 1 owns the real identity/project schema (`profiles`, `projects`, `project_members`, invitations and production RLS foundation). WP-0.4 therefore uses an isolated engineering-only schema/table to prove the local migration/seed/RLS harness. It does not create production product tables or mark any product Feature ID implemented.

## Governing contracts

- `docs/roadmap/LOT-ACCEPTANCE.md` — Lot 0
- `docs/quality/SECURITY-TESTING.md`
- `docs/quality/TEST-DATA.md`
- `docs/security/AUTHORIZATION-RLS.md`
- `docs/engineering/MIGRATIONS.md`
- `docs/engineering/CI-CD.md`

## Pass A — IMPLEMENT

Implemented and proved:

- versioned local Supabase configuration;
- ordered engineering-only migration under `supabase/migrations/`;
- deterministic synthetic seed under `supabase/seed.sql`;
- reproducible `db:start`, `db:reset`, `db:test`, `db:verify`, `db:stop` commands;
- direct pgTAP RLS tests for anonymous denial, authenticated same-tenant allow, cross-tenant read denial, and `WITH CHECK` write denial;
- clean GitHub runner start/reset/seed/test/stop with no production credentials.

Evidence:

- WP-0.4 local DB verification run `33802763046` — SUCCESS;
- Lot 0 packet verification run `33802763051` — SUCCESS.

## Pass B — ADVERSARIAL REVIEW

Review focus:

- fail-closed behavior when tenant context is absent;
- cross-tenant read and write attempts;
- schema/table permission surface;
- deterministic seed assumptions;
- Lot 0 / Lot 1 boundary;
- regression of accepted static/test harnesses.

Finding: authenticated-without-tenant denial was implied by the policy but lacked an explicit negative proof. Remediation added that direct DB assertion.

Post-remediation evidence at exact head `06063067479d8a0d9ce91237501b80c388f2f0a1`:

- WP-0.4 local verification run `33802976963` — SUCCESS;
- Lot 0 packet verification run `33802977112` — SUCCESS.

No open BLOCKING/MAJOR finding remains.

## Pass C — ACCEPTANCE

Acceptance reconciliation:

- required WP-0.4 responsibilities minus implemented/evidenced responsibilities: **∅**;
- no production credentials required: **PASS**;
- no real wedding/customer data: **PASS**;
- no production product table / Lot 1 feature implementation: **PASS**;
- accepted WP-0.1/0.2/0.3 regression suite: **PASS**.

Decision: **ACCEPTED**.

## Handoff

- Current state/pass: `ACCEPTED / C-ACCEPTANCE-COMPLETE`
- Accepted packets: `WP-0.1`, `WP-0.2`, `WP-0.3`, `WP-0.4`
- Next permitted packet: `WP-0.5` — CI, preview, secret/dependency security
