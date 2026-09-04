# Work Packet Record — WP-1.6

## Identity

- Work Packet ID: `WP-1.6`
- Lot: `1`
- Name: Protected app shell, navigation and public RSVP trust boundary
- State: `ACCEPTANCE_PENDING`
- Current pass: `C-ACCEPTANCE`
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
- protected route guard tests for signed-out, unverified, verified-member, verified-outsider and provider-failure outcomes;
- safe return-route validation preventing external/open-redirect or public-token persistence abuse;
- project context remains explicit in internal navigation links;
- public RSVP route renders a separate minimal shell with no private navigation and no membership grant path;
- raw token absent from document metadata/logging surface and restrictive referrer policy present;
- E2E refresh/deep-link behavior for protected and public shells;
- responsive shell/nav smoke evidence desktop/mobile;
- no guest/provider/repository implementation leaked into packet;
- full exact-head CI green before Pass B.

## Pass A — IMPLEMENT

### Initial implementation

Initial pre-review implementation HEAD `36eff640d8fbeebfcf64023350e6636b3a5ab624` was covered by exact-head CI run `33869860062`; all five jobs were SUCCESS, including clean-checkout `npm run verify`.

### Repair after first Pass B

The two MAJOR findings were repaired by:

- composing the official browser `@supabase/supabase-js` client from browser-safe `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` only;
- reusing the accepted Supabase Auth and live project-permission adapters;
- matching official nullable MFA response and RPC thenable shapes without weakening fail-closed semantics;
- rejecting missing/invalid/non-browser-safe runtime configuration and service-role/secret-key environment variants;
- clearing existing protected DOM synchronously before asynchronous session/membership resolution;
- converting session-provider and project-access failures into generic non-leaking unavailable state;
- adding regression tests for official SDK composition, nullable provider responses, thenable RPCs and stale private-shell removal.

Exact-head repair evidence was first green on HEAD `73e8bdd3fdf40ae3f9cccef48caedde9f395eba8`, run `33878572594`, all five jobs SUCCESS.

### Final MINOR repair and exact-head evidence

Fresh Pass B identified one non-blocking UX observation: generic unavailable recovery had no explicit action back to a safe home surface. It was repaired with a hard-coded local `/` recovery link and a non-leak regression test; no project ID, token or private datum is placed in the link.

Final implementation HEAD: `61dca0718f8ff7372609d208050aba6a50271743`.

Final exact-head CI run: `33880216335`.

All five jobs are SUCCESS:

- Core quality and security — SUCCESS, including strict typecheck/static checks, negative controls, unit coverage, dependency security gate and build;
- Local Supabase DB and RLS — SUCCESS;
- Browser and mutation harnesses — SUCCESS, including Playwright protected/public shell coverage and mutation gate;
- Privacy-safe preview artifact — SUCCESS;
- Full verify from clean checkout — SUCCESS with `npm run verify`.

## Pass B — ADVERSARIAL REVIEW

### First review — REVIEW_FAILED

The initial independent review attacked open redirect/return-route handling, route-project authorization confusion, unverified/session states, stale membership trust, cached-content pre-render risk, token leakage in DOM/metadata/referrer/logging, private/public shell separation, browser-only permission assumptions and scope creep.

Findings:

- `WP16-AR-001` — **MAJOR**: official browser Supabase composition assigned to WP-1.6 was missing, so the shipped browser runtime could not restore a real provider session or execute live project permission checks.
- `WP16-AR-002` — **MAJOR**: session-provider failure plus asynchronous protected-route resolution could leave previously rendered private content visible.

### Fresh review after MAJOR repairs

The complete packet was reconstructed from normative contracts and re-reviewed, not merely the patched lines. Review surfaces included:

- canonical route parsing and malformed-path denial;
- local protected return-path validation and open-redirect rejection;
- signed-out, unverified, verified member, outsider and provider-failure route decisions;
- live `has_project_permission(..., 'project.read')` authorization with route project ID treated only as context;
- official Supabase browser composition and publishable-key-only configuration;
- nullable MFA/provider error shapes and future assurance values;
- provider RPC thenable behavior and fail-closed rejection/error handling;
- stale private-content removal before asynchronous authorization;
- renderer DOM safety and explicit same-project navigation context;
- public `/rsvp/:token` isolation, capability-material discard, no project navigation and no membership grant path;
- restrictive `no-referrer` and `noindex, nofollow, noarchive` metadata;
- absence of remote CSS/resources that could receive a capability URL referrer;
- environment/secret negative controls, including browser-prefixed service-role/secret-key variants;
- E2E behavior across Chromium, Firefox, WebKit and mobile Chromium;
- architecture/dependency/scope diff proving no guest CRUD/provider-send/cache-sync/Storage/Realtime/Lot-2+ implementation leaked into WP-1.6.

`WP16-AR-001`: **CLOSED**.

`WP16-AR-002`: **CLOSED**.

One MINOR UX observation remained: the generic unavailable shell did not yet expose the screen-contract recovery action. It was repaired before final review by adding a generic local home link and objective non-leak test.

### Final fresh Pass B — PASS

After the MINOR repair, the changed surface was re-reviewed against the already-audited packet. The recovery link is a constant local `/` URL, contains no project/capability/private context, uses safe DOM APIs and is covered by unit tests. Final exact-head CI run `33880216335` on `61dca0718f8ff7372609d208050aba6a50271743` is 5/5 SUCCESS including clean-checkout `npm run verify`.

**No unresolved BLOCKING, MAJOR or MINOR finding remains.**

## Pass C — ACCEPTANCE / RECONCILIATION

In progress. Pass B is clean and the packet is now `ACCEPTANCE_PENDING`. Pass C must reconcile every primary responsibility as EXPECTED vs IMPLEMENTED vs VERIFIED, confirm required-minus-evidenced = ∅, confirm no unresolved BLOCKING/MAJOR, and record the next packet prerequisite before acceptance.

## Handoff

- Current state: `ACCEPTANCE_PENDING` / `C-ACCEPTANCE`.
- Final green implementation HEAD: `61dca0718f8ff7372609d208050aba6a50271743`.
- Final green CI: run `33880216335`, all five jobs SUCCESS including clean-checkout `npm run verify`.
- Closed findings: `WP16-AR-001`, `WP16-AR-002`; final MINOR recovery observation repaired and re-reviewed.
- Open BLOCKING/MAJOR/MINOR: none.
- Next permitted action: perform Pass C reconciliation for WP-1.6 only.
- WP-1.7+ and Lot 2+ remain forbidden until WP-1.6 acceptance.
