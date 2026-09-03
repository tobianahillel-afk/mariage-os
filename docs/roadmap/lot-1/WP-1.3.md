# Work Packet Record — WP-1.3

## Identity

- Work Packet ID: `WP-1.3`
- Lot: `1`
- Name: Supabase Auth/session and controlled first-owner provisioning
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
- Primary bounded context: authentication / private deployment provisioning
- Branch/PR: `lot-1/identity-project-foundation`

## Scope

### Primary Feature IDs

- FTR-002 — controlled initial project/owner bootstrap.
- FTR-003 — Supabase identity/session boundary prerequisites.
- FTR-005 — auth-assurance/recent-auth foundation only.

### Current-lot responsibilities covered

- browser-safe Supabase Auth application port and infrastructure adapter boundary;
- explicit signed-out / unverified / verified identity session semantics;
- V1 ordinary sign-in decision: Supabase verified-email + password flow, provider recovery retained;
- deployment provisioning-policy persistence that distinguishes `private_pair` from future `public_saas` without imposing a one-project database invariant;
- controlled private bootstrap bound to an operator-configured intended first-owner email;
- atomic profile + project + active owner membership creation through one narrow RPC;
- bootstrap consumed once, unrelated verified user denied, and synthetic database remains capable of multiple projects;
- reusable recent-auth/MFA assurance hook for later privileged commands.

### Requirements / Acceptance / Security IDs

- FTR-002/003/005 applicable Lot-1 responsibilities.
- `AUTHZ-001`, `AUTHZ-004`, `AUTHZ-006`, `AUTHZ-007`, `AUTHZ-014`, `AUTHZ-015`, `AUTHZ-016`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020` as applicable.
- `AUTHENTICATION.md`, `BOOTSTRAP-INVITATIONS.md`, `AUTH-ONBOARDING.md`, `PUBLIC-SAAS-READINESS.md`.

### Explicitly out of scope

- partner invitation persistence/token lifecycle — WP-1.4;
- final-owner invariant / membership administration — WP-1.4;
- full MFA enrollment UI/recovery diagnostics — WP-1.8;
- protected project route shell — WP-1.6;
- local pending-work/session-expiry state machine — WP-1.8;
- public SaaS project self-service implementation;
- real owner email, credentials or production secrets.

## Dependency / sequencing

- Required prior packets: WP-1.1 and WP-1.2 **ACCEPTED**.
- Downstream: WP-1.4 and WP-1.6 depend directly on verified session/provisioning boundaries; WP-1.8 extends assurance/session-expiry behavior.

## Sizing review

Planning complexity: **8/10**.

Cohesion rationale: provider identity/session semantics and the first-owner bootstrap are one onboarding security boundary. The bootstrap must consume the verified provider identity that the Auth port represents; splitting them would leave either an unauthenticated provisioning command or an Auth slice with no secure private-deployment entry path.

## V1 ordinary sign-in decision

Selected for V1: **Supabase email + password**, with provider-verified email required before private provisioning and provider-supported password/email recovery. This decision is replaceable at the Auth adapter boundary and does not alter `profiles`, `projects`, `project_members` or project RLS semantics.

No password hashing, token cryptography or service-role behavior is implemented in Mariage OS browser code.

## Pass A — IMPLEMENT

In progress.

Expected evidence:

- migration/policies/RPC for deployment provisioning state + atomic private bootstrap + assurance helper;
- direct pgTAP tests for intended verified owner, unrelated user, unverified user, replay/second bootstrap, atomic owner membership and multi-project database compatibility;
- application/domain unit tests for normalized provider session states and fail-closed semantics;
- infrastructure adapter tests with a structural browser-safe Supabase client boundary;
- no production secret or real email;
- exact-head full verification before Pass B.

## Pass B — ADVERSARIAL REVIEW

Not started.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started.

## Handoff

- Current state: `IN_PROGRESS`
- Current/next pass: `A-IMPLEMENT`
- Accepted dependencies: WP-1.1, WP-1.2.
- Remaining blocker/finding: none at kickoff.
- Next permitted action: implement WP-1.3 only, then run affected/full verification before independent Pass B.
