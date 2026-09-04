# Work Packet Record — WP-1.6

## Identity

- Work Packet ID: `WP-1.6`
- Lot: `1`
- Name: Protected app shell, navigation and public RSVP trust boundary
- State: `REVIEW_FAILED`
- Current pass: `B-REVIEW-FAILED`
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

**PASS before adversarial review.** Implementation HEAD `36eff640d8fbeebfcf64023350e6636b3a5ab624` is covered by exact-head CI run `33869860062`; all five jobs are SUCCESS:

- Core quality and security — SUCCESS, including strict typecheck/static checks, negative controls, 100% unit coverage, dependency security gate and build;
- Local Supabase DB and RLS — SUCCESS;
- Browser and mutation harnesses — SUCCESS, including Playwright protected/public shell coverage and mutation gate;
- Privacy-safe preview artifact — SUCCESS;
- Full verify from clean checkout — SUCCESS with `npm run verify`.

Pass-A repairs preserved the repository quality gates: the temporary Prettier diagnostic workflow was removed, formatting was made canonical, and route parsing was decomposed to satisfy the existing complexity maximum without weakening lint or behavior.

## Pass B — ADVERSARIAL REVIEW

**REVIEW_FAILED.** Independent review attacked open redirect/return-route handling, route-project authorization confusion, unverified/session states, stale membership trust, cached-content pre-render risk, token leakage in DOM/metadata/referrer/logging, private/public shell separation, browser-only permission assumptions and scope creep.

Open findings:

- `WP16-AR-001` — **MAJOR / OPEN**: accepted WP-1.3 explicitly deferred official browser `@supabase/supabase-js` application composition to WP-1.6, but the WP-1.6 runtime still hard-codes a synthetic `signed_out` session reader and `projectAccess: null`. Unit/E2E dependency injection proves the guards in isolation but the shipped browser composition cannot restore a real Supabase session or perform the live permission RPC, so no real verified member can reach the protected shell. Repair must compose the official SDK with browser-safe publishable credentials only, reuse accepted Auth/project-access adapters, preserve fail-closed behavior when runtime config is absent/invalid, and introduce no service-role/custom token storage.
- `WP16-AR-002` — **MAJOR / OPEN**: `resolveProtectedRoute` does not convert session-provider failure into a fail-closed decision and `startApplication` leaves the previous DOM intact while awaiting session/membership resolution. Re-evaluating a protected route after private content was rendered can therefore leave stale protected content visible when session resolution throws or stalls. Repair must clear/replace the previous protected shell before asynchronous authorization and make session-provider failure resolve to generic non-leaking unavailable state; tests must prove stale private content is removed.

Reviewed and currently clean/non-blocking:

- route project ID is treated as context only; live `has_project_permission(..., 'project.read')` remains the authorization decision;
- verified outsider and project-access provider failure collapse to generic `project_unavailable`;
- unverified identity never reaches membership evaluation;
- public `/rsvp/:token` parsing discards raw capability material from application state, renders no project navigation, and global metadata is `no-referrer` plus `noindex, nofollow, noarchive`;
- safe protected return helper rejects external/protocol-relative/query/fragment/public-capability candidates and generated signed-out return paths originate from a validated protected route;
- no guest CRUD/capability persistence, provider-send SDK, local repository/cache/sync implementation, Storage/Realtime or Lot 2+ domain implementation leaked into WP-1.6.

Because MAJOR findings are open, Pass C is forbidden. Repair requires fresh exact-head CI followed by a fresh Pass B.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Requires repaired green Pass A, clean fresh Pass B and contract → implementation → objective evidence reconciliation.

## Handoff

- Current state: `REVIEW_FAILED` / `B-REVIEW-FAILED`.
- Last green pre-review implementation HEAD: `36eff640d8fbeebfcf64023350e6636b3a5ab624`.
- Last green pre-review CI: run `33869860062`, all five jobs SUCCESS.
- Open BLOCKING/MAJOR: `WP16-AR-001`, `WP16-AR-002`.
- Next permitted action: repair WP-1.6 findings only, then fresh exact-head verification and fresh Pass B.
- WP-1.7+ and Lot 2+ remain forbidden.
