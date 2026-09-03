# Work Packet Record — WP-0.4

## Identity

- Work Packet ID: `WP-0.4`
- Lot: `0`
- Name: Supabase local and direct DB/RLS test foundation
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
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

Lot 1 owns the real identity/project schema (`profiles`, `projects`, `project_members`, invitations and production RLS foundation). WP-0.4 therefore uses an isolated engineering-only schema/table to prove the local migration/seed/RLS harness. It must not create production product tables or mark any product Feature ID implemented.

## Governing contracts

- `docs/roadmap/LOT-ACCEPTANCE.md` — Lot 0
- `docs/quality/SECURITY-TESTING.md`
- `docs/quality/TEST-DATA.md`
- `docs/security/AUTHORIZATION-RLS.md`
- `docs/engineering/MIGRATIONS.md`
- `docs/engineering/CI-CD.md`

## Sizing

Planning complexity: **8/10 — within normal target**.

## Pass A — IMPLEMENT

Required evidence:

- Supabase CLI starts from a clean checkout with no production credentials;
- database reset applies ordered migrations and deterministic seed;
- direct SQL tests exercise RLS, not UI behavior;
- anonymous access denied;
- authenticated same-tenant synthetic user allowed;
- authenticated cross-tenant synthetic user denied;
- cross-tenant write/injection denied by `WITH CHECK`;
- seed contains synthetic data only and is deterministic;
- no production product table is introduced.

## Pass B — ADVERSARIAL REVIEW

Not started.

## Pass C — ACCEPTANCE

Not started.

## Handoff

- Current state/pass: `IN_PROGRESS / A-IMPLEMENT`
- Accepted packets: `WP-0.1`, `WP-0.2`, `WP-0.3`
- Next action: establish and prove local Supabase reset/seed/direct-RLS harness
