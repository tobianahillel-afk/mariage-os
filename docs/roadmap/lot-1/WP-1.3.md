# Work Packet Record — WP-1.3

## Identity

- Work Packet ID: `WP-1.3`
- Lot: `1`
- Name: Supabase Auth/session and controlled first-owner provisioning
- State: `ACCEPTED`
- Current pass: `C-ACCEPTANCE-COMPLETE`
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

**COMPLETE.**

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

- `WP13-AR-001` — **MAJOR / CLOSED**: provisioning adapter accepted any non-empty provider string as a project identifier. Remediation validates the RPC response as a canonical UUID before returning it and adds malformed-response negative tests.
- `WP13-AR-002` — **MAJOR / CLOSED**: selected password flow retained the local Supabase default minimum of 8 characters, below the private-owner target in `AUTH-HARDENING.md`. Remediation sets `minimum_password_length = 14` while retaining provider-managed password handling.

Post-remediation evidence:

- GitHub Actions run `33817932867` on `707b1384fbd370fe88ef7a87ac191aa9645f6db3`: all five jobs SUCCESS;
- Core quality/security SUCCESS including typecheck, static architecture/dead-code/marker gates, negative controls, 100% unit coverage, dependency audit and build;
- Local Supabase DB/RLS SUCCESS with provider config loaded and direct DB verification;
- Browser/mutation SUCCESS;
- privacy-safe preview SUCCESS;
- full `npm run verify` from clean checkout SUCCESS.

Reviewed non-blocking downstream responsibilities:

- the packet contract intentionally requires a **structural browser-safe Supabase client boundary**, not final application composition with `@supabase/supabase-js`; protected-route/application composition remains downstream in WP-1.6 and must use the official provider SDK rather than custom token/session handling;
- local `enable_signup = false` is fail-closed but is not evidence for the controlled owner/partner account-creation window. Partner invitation/account onboarding is WP-1.4 and the exact provider signup-window/closure behavior must be exercised before Lot-1 acceptance so signup closure cannot block the intended partner;
- recent-auth timing, MFA enrollment/recovery and pending-work logout/session-expiry behavior remain WP-1.8 responsibilities; WP-1.3 only supplies the fail-closed AAL hook.

No production secrets, real owner email or service-role client path were introduced.

## Pass C — ACCEPTANCE / RECONCILIATION

**COMPLETE — ACCEPTED.**

Mechanical reconciliation:

- required WP-1.3 responsibilities − implemented/evidenced WP-1.3 responsibilities = **∅**;
- accepted dependency requirements are satisfied by WP-1.1 and WP-1.2;
- compare against accepted WP-1.2 head showed changes limited to Auth/provisioning application ports, Supabase adapters/tests, private provisioning migration/tests, provider configuration and governance documentation;
- no WP-1.4 invitation/token implementation landed early;
- no Storage/Realtime foundation, protected-route UI, wedding-domain Lot 2+ code, real wedding/customer data or production credential landed;
- downstream signup-window, official SDK composition and MFA/session lifecycle responsibilities remain explicitly assigned to later Lot-1 packets and are not silently waived.

Acceptance evidence: run `33817932867` on `707b1384fbd370fe88ef7a87ac191aa9645f6db3`, all five jobs SUCCESS after Pass-B remediation.

Open BLOCKING/MAJOR findings: **none**.

## Handoff

- Final state: `ACCEPTED`
- Final pass: `C-ACCEPTANCE-COMPLETE`
- Accepted dependencies: WP-1.1, WP-1.2.
- Closed findings: `WP13-AR-001`, `WP13-AR-002`.
- Next permitted packet: **WP-1.4 — partner invitation and protected membership lifecycle**.
