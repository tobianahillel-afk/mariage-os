# Work Packet Record — WP-1.4

## Identity

- Work Packet ID: `WP-1.4`
- Lot: `1`
- Name: Partner invitation and protected membership lifecycle
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
- Primary bounded context: identity-bound invitation / membership administration
- Branch/PR: `lot-1/identity-project-foundation`

## Scope

### Primary Feature IDs

- FTR-004 — partner invitation and membership lifecycle.

### Current-lot responsibilities covered

- `project_invitations` persistence foundation;
- cryptographically strong raw invitation token generation outside persistent/logged state;
- hash-at-rest token persistence only;
- narrow protected create/revoke/accept commands;
- invitation binding to project, intended normalized verified email, allowed role, expiry/revocation and one-time token hash;
- atomic acceptance using authenticated immutable Auth user ID plus provider-verified email;
- wrong identity, expired, revoked and replayed invitation denial;
- idempotent/safe repeated acceptance semantics where the same already-accepted identity retries;
- final active-owner invariant;
- narrow membership administration without browser-exposed service-role/admin secret;
- explicit separation between invitation capability and project membership.

### Requirements / Acceptance / Security IDs

- FTR-004 applicable Lot-1 responsibilities.
- `AUTHZ-001`, `AUTHZ-004`, `AUTHZ-005`, `AUTHZ-006`, `AUTHZ-007`, `AUTHZ-008`, `AUTHZ-014`, `AUTHZ-015`, `AUTHZ-016`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020` as applicable.
- `AUTHENTICATION.md`, `BOOTSTRAP-INVITATIONS.md`, `AUTH-HARDENING.md`, `PUBLIC-SAAS-READINESS.md`.

### Explicitly out of scope

- protected route/navigation UI — WP-1.6;
- complete provider signup UI or public self-service signup;
- MFA enrollment/recovery/session-expiry/logout state machine — WP-1.8;
- local cache/sync primitives — WP-1.7;
- guest RSVP capability/domain implementation;
- outbound Email/SMS/WhatsApp delivery/provider integration;
- production invitation delivery or real owner email/token;
- arbitrary public SaaS self-service project provisioning;
- Lot 2+ wedding-domain features.

## Dependency / sequencing

- Required prior packets: WP-1.1, WP-1.2 and WP-1.3 **ACCEPTED**.
- WP-1.3 provides verified identity/session and controlled bootstrap boundaries.
- Downstream WP-1.6 and WP-1.8 consume the resulting two-owner membership/session lifecycle.

## Sizing review

Planning complexity: **10/10**.

Cohesion rationale: invitation token creation, hash-at-rest persistence, identity-bound atomic acceptance, revocation/replay behavior and the final-owner membership invariant are one security transaction family. Splitting them into independently acceptable partial packets would create unsafe intermediate states where a token can exist without a safe acceptance lifecycle or membership can mutate without owner-preservation guarantees.

## Security invariants to preserve

1. Raw invitation token is generated with platform/provider cryptographic randomness; no custom PRNG or token cryptography.
2. Raw token is returned only at creation boundary and never stored in tables, logs, fixtures or diagnostics.
3. Persistent invitation stores only a cryptographic hash/digest suitable for exact token lookup/verification.
4. Acceptance never trusts client-supplied user ID/email/role/project authorization; authenticated identity and verified email are derived server-side.
5. Invitation is project-bound, email-bound, role-bound, expiry-bound, revocable and one-time.
6. Wrong identity, anonymous caller, unverified identity, expired invite, revoked invite and replay fail closed without leaking project data.
7. Invitation possession alone never grants project membership; successful server-side acceptance creates/activates membership atomically.
8. Membership administration reuses centralized permissions and RLS rather than client role text.
9. A project cannot be left with zero active owners by membership mutation.
10. No browser service-role/admin secret is introduced.

## Pass A — IMPLEMENT

**IN_PROGRESS.**

Planned evidence:

- migration-controlled invitation schema/indexes/constraints and protected command surface;
- application/infrastructure boundary for raw-token creation/acceptance without persistence leakage;
- direct pgTAP grant/RLS/RPC tests;
- negative tests for anonymous/unverified/wrong-email/expired/revoked/replay/cross-project attempts;
- final-active-owner invariant tests for revoke/demotion/removal paths;
- synthetic two-owner acceptance path using `.invalid` identities only;
- unit/property tests for token boundary and input normalization where applicable;
- exact-head GitHub CI including clean-checkout `npm run verify`.

## Pass B — ADVERSARIAL REVIEW

Not started. Must independently review token entropy/hash boundary, replay/concurrency, identity binding, enumeration leakage, privilege escalation, owner invariant, grant surface and scope leakage after Pass A is green.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Requires Pass B closure, exact-head evidence and mechanical reconciliation before acceptance.

## Handoff

- Current state: `IN_PROGRESS`
- Current/next pass: `A-IMPLEMENT`
- Accepted dependencies: WP-1.1, WP-1.2, WP-1.3.
- Open BLOCKING/MAJOR findings: none at kickoff.
- Next permitted action: implement WP-1.4 only.
