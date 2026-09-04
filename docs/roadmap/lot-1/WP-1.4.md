# Work Packet Record — WP-1.4

## Identity

- Work Packet ID: `WP-1.4`
- Lot: `1`
- Name: Partner invitation and protected membership lifecycle
- State: `ACCEPTED`
- Current pass: `C-ACCEPTANCE-COMPLETE`
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

## Security invariants preserved

1. Raw invitation token uses provider/platform cryptographic randomness; no custom PRNG/token cryptography.
2. Raw token is returned only at creation boundary and is never persisted in invitation storage.
3. Persistent invitation stores a SHA-256 digest for exact token lookup/verification.
4. Acceptance derives authenticated user ID and verified email server-side and does not trust client user/email/role/project authority.
5. Invitation is project-bound, email-bound, role-bound, expiry-bound, revocable and one-time.
6. Wrong identity, anonymous caller, unverified identity, expired invite, revoked invite and invalid/replayed capability states fail closed with generic errors.
7. Invitation possession alone never grants project membership; successful server-side acceptance creates/reactivates membership atomically.
8. Membership administration uses centralized live permission checks rather than client role text.
9. A project cannot be left with zero active owners by role mutation or revocation.
10. No browser service-role/admin secret was introduced.
11. Privileged role/revoke membership mutations require server-side `aal2` assurance.
12. Privileged invitation/membership writers serialize on the project before live authorization/resource mutation so stale-authority and lock-order races fail safely.

## Pass A — IMPLEMENT

**COMPLETE.**

Implemented:

- `project_invitations` schema with normalized intended identity, role, SHA-256 token hash, expiry, issuer, revoke and acceptance state constraints;
- no direct browser privileges on invitation persistence;
- owner-authorized `create_project_invitation` using `pgcrypto` 256-bit random token material, SHA-256 hash-at-rest and seven-day expiry;
- protected invitation revocation with idempotent already-revoked behavior and accepted-state protection;
- server-side identity-bound acceptance deriving `auth.uid()` and provider-verified email from `auth.users`, with wrong identity/unverified/expired/revoked/replayed capability handling;
- idempotent same-identity replay after successful acceptance without duplicate membership;
- exact-role reactivation of a matching revoked membership;
- protected role-change and membership-revoke commands reusing `members.manage_roles`;
- project-row serialization for invitation/membership administration;
- application ports for invitation and membership administration;
- fail-closed Supabase structural adapters validating provider outputs rather than trusting RPC payloads;
- 43-assertion pgTAP invitation/membership security matrix plus 4-assertion concurrency/authorization-order contract;
- unit tests for email normalization, invitation provider trust boundary and membership administration adapter.

Final Pass-A runtime evidence:

- exact-head run `33859207161` on `bf0046dc45c318875d349edc2b6327292e2894ea`: all five CI jobs **SUCCESS**;
- Core quality/security: typecheck/static/negative controls/unit tests/dependency gate/build all SUCCESS; 38 TypeScript tests pass with 100% measured coverage;
- Local Supabase DB/RLS: clean reset plus six pgTAP files, **133 tests**, all successful;
- Browser/mutation harnesses: SUCCESS;
- privacy-safe preview artifact: SUCCESS;
- full `npm run verify` from clean checkout: SUCCESS.

CI resilience maintenance performed during Pass A did not weaken the High/Critical dependency gate: `npm audit` remains primary; only bounded transient provider failures may fall back to exact-lockfile GitHub Advisory Database review, and dual-provider failure remains fail-closed. The final acceptance run used the primary npm audit path successfully and reported only the already-known Moderate transitive `qs` advisories.

## Pass B — ADVERSARIAL REVIEW

**COMPLETE.**

Review areas:

- token entropy and raw-token/hash persistence boundary;
- verified-identity binding and account-enumeration behavior;
- invite expiry/revoke/replay/idempotency;
- invitation possession versus membership authority;
- final-owner invariant under concurrent role/revoke operations;
- live permission evaluation after membership revocation/downgrade;
- lock ordering and stale-authorization races;
- Security Definer/search-path and grant surface;
- browser/provider trust boundary;
- scope leakage into later Lot-1 or Lot-2+ responsibilities.

Findings/remediations:

- `WP14-AR-001` — **MAJOR / CLOSED**: privileged membership role changes and revocations initially accepted `aal1` sessions despite the existing strong-assurance hook and `AUTHZ-014`. Remediation requires `public.has_auth_assurance('aal2')` for both commands and adds direct AAL1-deny/AAL2-allow DB evidence.
- `WP14-AR-002` — **MAJOR / CLOSED**: invitation acceptance and invitation reissue/revocation initially used inconsistent invitation/project lock ordering, permitting a database deadlock under concurrency. Remediation standardizes project-first serialization before invitation-row locking/mutation.
- `WP14-AR-003` — **MAJOR / CLOSED**: several privileged commands evaluated permission before taking the project serialization lock, leaving a TOCTOU window where a concurrent revocation/downgrade could occur after authorization but before mutation. Remediation moves the live permission check after project locking and adds a structural concurrency/authorization-order pgTAP contract.

Post-remediation evidence:

- `partner_invitation_test.sql`: 43 direct assertions, including AAL1 denial for privileged membership mutations and AAL2 success paths;
- `invitation_concurrency_contract_test.sql`: 4 structural assertions preventing regression of project-first locking and post-lock live authorization;
- total local DB suite: 6 files / 133 tests / PASS on run `33859207161`;
- exact-head CI run `33859207161` is 5/5 SUCCESS including clean-checkout `npm run verify`.

Reviewed non-blocking downstream responsibilities:

- invitation creation/acceptance anti-abuse/rate-limit review remains mandatory before exposing public/self-service flows or real production cutover; private V1 manual partner onboarding does not convert this packet into a public onboarding surface;
- exact provider account-creation/signup-window UX, token stripping from browser navigation/history and protected route behavior remain downstream Lot-1 onboarding/route work, especially WP-1.6/WP-1.8;
- real-owner MFA enrollment/recovery evidence remains a pre-cutover responsibility in WP-1.8; WP-1.4 only consumes the server-side AAL hook for privileged membership administration;
- no outbound invite email/SMS/WhatsApp provider integration is implemented here.

No production secrets, real owner identity/token or service-role client path were introduced.

## Pass C — ACCEPTANCE / RECONCILIATION

**COMPLETE — ACCEPTED.**

Mechanical reconciliation:

- required WP-1.4 responsibilities − implemented/evidenced WP-1.4 responsibilities = **∅**;
- accepted dependency requirements are satisfied by WP-1.1, WP-1.2 and WP-1.3;
- compare against accepted WP-1.3 head `707b1384fbd370fe88ef7a87ac191aa9645f6db3` shows product changes limited to invitation/membership application ports, Supabase adapters/tests, invitation/membership migrations/tests and governance/CI maintenance;
- no project settings/date/origin/preferences implementation from WP-1.5 landed early;
- no protected-route/public-RSVP shell, local cache/sync, Storage/Realtime, wedding-domain Lot 2+ code, real wedding/customer data or production credential landed;
- downstream signup-window, route/token-history cleanup, public abuse protection and real MFA/recovery evidence remain explicitly assigned and are not silently waived.

Acceptance evidence: run `33859207161` on `bf0046dc45c318875d349edc2b6327292e2894ea`, all five jobs SUCCESS after all Pass-B remediations; DB suite reports 133/133 tests successful.

Open BLOCKING/MAJOR findings: **none**.

## Handoff

- Final state: `ACCEPTED`
- Final pass: `C-ACCEPTANCE-COMPLETE`
- Accepted dependencies: WP-1.1, WP-1.2, WP-1.3.
- Closed findings: `WP14-AR-001`, `WP14-AR-002`, `WP14-AR-003`.
- Next permitted packet: **WP-1.5 — project configuration, dates, origins, preferences and RSVP-intent data hooks**.
