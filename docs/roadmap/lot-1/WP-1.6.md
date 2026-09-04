# Work Packet Record — WP-1.6

## Identity

- Work Packet ID: `WP-1.6`
- Lot: `1`
- Name: Protected app shell, navigation and public RSVP trust boundary
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
- Primary bounded context: client routing/session/project-membership shell boundary
- Branch/PR: `lot-1/identity-project-foundation`

## Dependencies

WP-1.1 through WP-1.5 are **ACCEPTED**. WP-1.5 acceptance evidence: run `33866160626` on implementation HEAD `15e477a9ca75efbc98594000c190180e24226229`, all five jobs SUCCESS, DB 239/239, `WP15-AR-001` and `WP15-AR-002` closed.

## Primary responsibilities

- FTR-009 responsive application shell/navigation/deep-link foundation.
- protected canonical route family `/app/p/:projectId/**` with explicit project context;
- session-aware and membership-aware route resolution that never treats route project ID as authorization;
- generic non-leaking recovery for guessed/unauthorized project IDs;
- safe return/deep-link intent across authentication without rendering protected content first;
- separate `/rsvp/:token` public-shell trust boundary with no project-member navigation/session requirement;
- FTR-119 onboarding/settings UI hook for already-persisted RSVP intent/defer/manual-link plan only;
- privacy-safe metadata/shell behavior for private routes;
- desktop/mobile navigation skeleton sufficient to prove responsive shell structure and route semantics.

## Normative references

- FTR-009 and applicable Lot-1 portion of FTR-119.
- `ux/NAVIGATION.md`.
- `ux/SCREEN-CONTRACTS-PROJECT-SCOPE-ADDENDUM.md`.
- `ux/ROUTE-FEATURE-GUEST-COMMUNICATIONS-ADDENDUM.md`.
- `architecture/TRUST-BOUNDARIES-GUEST-COMMUNICATIONS-ADDENDUM.md`.
- `features/AUTH-ONBOARDING.md`.
- `security/AUTHENTICATION.md`, `AUTHORIZATION-REQUIREMENTS.md`, `GUEST-COMMUNICATIONS-AUTHORIZATION.md`.
- `FRONTEND-SECURITY.md` and privacy/SEO shell contracts as applicable.

## Security/trust invariants

1. `/app/p/:projectId/**` requires a verified authenticated session and live active membership before protected project UI is returned.
2. URL/project ID supplies context only, never authorization.
3. Signed-out access preserves only a safe return route and renders no protected project content.
4. Authenticated user without membership receives generic non-leaking unavailable/not-found recovery; project name/member count/existence is not exposed.
5. Unverified authenticated identity is never treated as a protected-app member session.
6. `/rsvp/:token` is a distinct public capability shell, never nested in `/app` and never grants/project-membership semantics.
7. This packet does not implement guest token persistence/resolution or RSVP data; public shell uses a narrow placeholder boundary only.
8. Raw guest token is never logged, rendered into analytics/diagnostics, stored as project membership data or exposed in page metadata.
9. Public RSVP shell contains no private sidebar/project navigation and uses restrictive referrer/private-safe metadata behavior.
10. Internal protected navigation keeps explicit project context and generated routes cannot silently cross projects.
11. Browser UI visibility is convenience only; cloud authorization remains server-side.
12. No provider SDK/credential/send path is introduced.

## Explicitly out of scope

- guest/household records, invitation capability DB model, token hashing/resolution and RSVP submission — Lot 6;
- email/SMS/WhatsApp provider SDKs, credentials, templates, campaigns, sends or webhooks;
- project data repositories/local cache/sync primitives — WP-1.7;
- session-expiry pending-work behavior, safe logout purge and MFA diagnostics — WP-1.8;
- Storage/Realtime — WP-1.9;
- full domain module screens/content from Lots 2+;
- production styling completeness or real wedding/customer data.

## Planned Pass-A evidence

- pure route parser/classifier tests for protected/public/auth/global routes and malformed paths;
- protected route guard tests for signed-out, unverified, verified-member, verified-outsider and revoked membership outcomes;
- safe return-route validation preventing external/open-redirect or public-token persistence abuse;
- project context remains explicit in internal navigation links;
- public RSVP route renders a separate minimal shell with no private navigation and no membership grant path;
- raw token absent from document metadata/logging surface and restrictive referrer policy present;
- E2E refresh/deep-link behavior for protected and public shells;
- responsive shell/nav smoke evidence desktop/mobile;
- no guest/provider/repository implementation leaked into packet;
- full exact-head CI green before Pass B.

## Pass A — IMPLEMENT

**IN_PROGRESS.**

## Pass B — ADVERSARIAL REVIEW

Not started. Must independently attack open redirect/return-route handling, route-project authorization confusion, unverified/session states, stale membership trust, cached-content pre-render risk, token leakage in DOM/metadata/referrer/logging, private/public shell separation, browser-only permission assumptions and scope creep.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Requires clean Pass B and contract → implementation → objective evidence reconciliation.

## Handoff

- Current state: `IN_PROGRESS` / `A-IMPLEMENT`.
- Accepted dependencies: WP-1.1..WP-1.5.
- Open BLOCKING/MAJOR: none at kickoff.
- Next permitted action: implement WP-1.6 only.
- WP-1.7+ and Lot 2+ remain forbidden.
