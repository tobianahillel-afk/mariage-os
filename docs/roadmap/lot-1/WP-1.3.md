# Work Packet Record — WP-1.3

## Identity

- Work Packet ID: `WP-1.3`
- Lot: `1`
- Name: Supabase Auth/session and controlled first-owner provisioning
- State: `IN_PROGRESS`
- Current pass: `B-ADVERSARIAL-REMEDIATION`
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
- `AUTHENTICATION.md`, `BOOTSTRAP-INVITATIONS.md`, `AUTH-HARDENING.md`, `PUBLIC-SAAS-READINESS.md`.

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

**COMPLETE.**

Implemented evidence:

- migration/policies/RPC for deployment provisioning state, atomic private bootstrap and assurance helper;
- pgTAP coverage for intended verified owner, unrelated verified account, unverified account, replay/second bootstrap denial, atomic owner membership, consumed bootstrap policy and multi-project database compatibility;
- application Auth port with explicit signed-out, authenticated-unverified and authenticated-verified states;
- fail-closed Supabase Auth and provisioning adapters with generic provider-facing failures;
- provider configuration with verified-email password mode, anonymous/manual linking disabled and no production credential;
- exact-head clean-checkout verification on `0758479222bf777d99cc0e6e855faabf1beef1d5`: GitHub Actions run `33816301733`, all five jobs SUCCESS including `npm run verify` from a clean checkout.

Pass-A repairs before green evidence included SQL role-context corrections, exact Prettier formatting, forbidden-marker collision removal and correction of the Auth fixture so a deliberately absent AAL remains absent.

## Pass B — ADVERSARIAL REVIEW

**IN_PROGRESS — remediations implemented; exact-head re-verification pending.**

Review areas:

- client/provider trust boundary and malformed provider output;
- private bootstrap authorization, verified-identity source and one-time consumption;
- concurrency/transaction boundary around bootstrap policy;
- exposure of intended bootstrap identity;
- Security Definer/search-path safety;
- V1 password/provider configuration;
- separation between private deployment provisioning policy and future public SaaS tenancy architecture;
- scope boundary versus later signup-window, route, invitation, MFA and local-session packets.

Findings/remediations:

- `WP13-AR-001` — **MAJOR / CLOSED IN CODE, VERIFY PENDING**: provisioning adapter accepted any non-empty provider string as a project identifier. Remediation validates the RPC response as a canonical UUID before returning it and adds malformed-response negative tests.
- `WP13-AR-002` — **MAJOR / CLOSED IN CONFIG, VERIFY PENDING**: selected password flow retained the local Supabase default minimum of 8 characters, below the private-owner target in `AUTH-HARDENING.md`. Remediation sets `minimum_password_length = 14` while retaining provider-managed password handling.

Reviewed non-blocking downstream responsibilities:

- the packet contract intentionally requires a **structural browser-safe Supabase client boundary**, not final application composition with `@supabase/supabase-js`; protected-route/application composition remains downstream in WP-1.6 and must use the official provider SDK rather than custom token/session handling;
- local `enable_signup = false` is fail-closed but is not evidence for the controlled owner/partner account-creation window. Partner invitation/account onboarding is WP-1.4 and the exact provider signup-window/closure behavior must be exercised before Lot-1 acceptance so signup closure cannot block the intended partner;
- recent-auth timing, MFA enrollment/recovery and pending-work logout/session-expiry behavior remain WP-1.8 responsibilities; WP-1.3 only supplies the fail-closed AAL hook.

No production secrets, real owner email or service-role client path were introduced.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Requires a green exact-head run after Pass-B remediations and no open BLOCKING/MAJOR finding.

## Handoff

- Current state: `IN_PROGRESS`
- Current/next pass: `B-ADVERSARIAL-REMEDIATION`
- Accepted dependencies: WP-1.1, WP-1.2.
- Open BLOCKING/MAJOR findings: none awaiting design/code remediation; `WP13-AR-001` and `WP13-AR-002` await exact-head verification.
- Next permitted action: obtain exact-head full verification, finish independent Pass B, then perform Pass C reconciliation for WP-1.3 only.
