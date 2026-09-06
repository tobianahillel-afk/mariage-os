# Work Packet Record — WP-1.6

## Identity

- Work Packet ID: `WP-1.6`
- Lot: `1`
- Name: Protected app shell, navigation and public RSVP trust boundary
- State: `ACCEPTED`
- Current pass: `C-ACCEPTANCE-COMPLETE`
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

## Pass A — IMPLEMENT

Initial pre-review implementation HEAD `36eff640d8fbeebfcf64023350e6636b3a5ab624` was covered by exact-head CI run `33869860062`; all five jobs were SUCCESS, including clean-checkout `npm run verify`.

The two MAJOR findings from the first Pass B were repaired by:

- composing the official browser `@supabase/supabase-js` client from browser-safe `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` only;
- reusing the accepted Supabase Auth and live project-permission adapters;
- matching official nullable MFA response and RPC thenable shapes without weakening fail-closed semantics;
- rejecting missing/invalid/non-browser-safe runtime configuration and service-role/secret-key environment variants;
- clearing existing protected DOM synchronously before asynchronous session/membership resolution;
- converting session-provider and project-access failures into generic non-leaking unavailable state;
- adding regression tests for official SDK composition, nullable provider responses, thenable RPCs and stale private-shell removal.

Repair exact-head evidence was first green on HEAD `73e8bdd3fdf40ae3f9cccef48caedde9f395eba8`, run `33878572594`, all five jobs SUCCESS.

Fresh review then identified one non-blocking unavailable-recovery UX observation. It was repaired with a constant local `/` recovery link and a non-leak regression test.

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

Findings:

- `WP16-AR-001` — **MAJOR**: official browser Supabase composition assigned to WP-1.6 was missing, so the shipped browser runtime could not restore a real provider session or execute live project permission checks.
- `WP16-AR-002` — **MAJOR**: session-provider failure plus asynchronous protected-route resolution could leave previously rendered private content visible.

### Fresh reviews after repairs

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
- architecture/dependency/scope diff proving no guest CRUD/provider-send/cache-sync/Storage/Realtime/Lot-2+ implementation leaked into WP-1.6;
- the final unavailable-recovery action, verified as constant local `/`, non-leaking and DOM-safe.

`WP16-AR-001`: **CLOSED**.

`WP16-AR-002`: **CLOSED**.

Final fresh Pass B: **PASS**.

No unresolved BLOCKING, MAJOR or MINOR finding remains.

## Pass C — ACCEPTANCE / RECONCILIATION

**PASS / COMPLETE.**

| Responsibility | EXPECTED / normative contract | IMPLEMENTED | VERIFIED / objective evidence |
|---|---|---|---|
| FTR-009 protected application shell | canonical `/app/p/:projectId/**`; explicit project context; responsive shell/navigation | route classifier, protected shell renderer, project-scoped desktop/mobile links | route/parser/unit tests; renderer tests; multi-browser E2E; final CI `33880216335` |
| Session + live membership boundary | verified session is necessary but not sufficient; URL project ID is context only; authorization fails closed | `resolveProtectedRoute` + accepted `SupabaseAuthAdapter` + `SupabaseProjectAccessAdapter` using live `has_project_permission(..., 'project.read')` | signed-out/unverified/member/outsider/provider-failure tests; E2E member/outsider states; DB/RLS and full verify green |
| Official browser provider composition | browser runtime restores provider session and performs live permission checks with no privileged credential | official `createClient` composition from validated Supabase origin + `sb_publishable_*` key only; invalid config fails closed | composition tests; official SDK TypeScript compatibility; secret/env negative controls; exact-head build/full verify |
| Safe protected deep-link return | only canonical local protected routes may become return intent; no public capability/open redirect | `safeProtectedReturnPath`, protected route reconstruction and encoded local login link | external/protocol-relative/query/fragment/RSVP negatives; login-return renderer/E2E tests |
| No stale private content | private UI must not remain visible while auth/membership is unresolved or failing | protected root cleared synchronously before first async authorization; provider errors become generic unavailable | ordered clear-before-session regression test; guard failure tests; full CI |
| Generic non-leaking unavailable recovery | guessed/unauthorized project does not reveal existence/name/member data and offers safe recovery | generic `project_unavailable` shell + constant local `/` recovery action | outsider E2E checks no project ID/private shell; renderer non-leak/recovery test |
| FTR-119 Lot-1 UI hooks | onboarding/settings expose provider-neutral RSVP intent/defer/manual choice only | nontechnical RSVP intent hook in onboarding/settings shell | renderer tests for settings/onboarding; no provider/guest persistence introduced |
| Public `/rsvp/:token` trust boundary | separate public shell; no member navigation/session requirement; capability material not retained/leaked | capability route collapses to `public_rsvp`; public shell bypasses project auth/navigation | route tests; bootstrap tests; E2E proves no nav/token in body/title and public shell isolation |
| Privacy-safe metadata | capability/private routes avoid referrer/search leakage | global `no-referrer`, `noindex, nofollow, noarchive`; generic document titles; no remote CSS/resource loads | `index.html` review + E2E metadata assertions + source review |
| Frontend safety / scope boundary | safe DOM construction; no service-role/browser secret; no guest CRUD/provider sends/cache-sync/Storage/Realtime/Lot-2+ implementation | textContent/createElement/setAttribute renderer; browser secret gates; only official Supabase Auth/access client dependency added | architecture/static/secret negative gates; compare from accepted WP-1.5 HEAD to WP-1.6 implementation HEAD; Pass B scope review |
| Shared synthetic identity/project flow contribution | WP-1.6 supplies protected-route member/outsider/browser-shell portion; complete shared flow continues through WP-1.8 | protected routing and provider composition slice present | Playwright route flow + accepted WP-1.3/1.4 dependencies; remaining session-expiry/logout slice explicitly owned by WP-1.8 |

All WP-1.6 responsibilities have implementation and objective evidence. Required packet responsibilities minus accepted/evidenced responsibilities: **∅**.

Additional acceptance checks:

- no unresolved BLOCKING/MAJOR/MINOR finding;
- architecture, dependency, dead-code, formatting, lint, complexity and marker gates green;
- `render-shell.ts` is 333 lines: above the module review trigger but below the 400-line hard default maximum, and it received complete Pass B review with no structural finding;
- no hidden TODO/FIXME/HACK/TEMP gate violation;
- no production credential or real wedding/customer data introduced;
- final exact-head implementation verification is green from a clean checkout;
- next-packet prerequisite is explicit: WP-1.7 may open only after this acceptance record is durable.

## Acceptance

**WP-1.6 is ACCEPTED.**

Acceptance evidence is run `33880216335` on exact implementation HEAD `61dca0718f8ff7372609d208050aba6a50271743`, with all five CI jobs successful including clean-checkout `npm run verify`.

Closed findings: `WP16-AR-001`, `WP16-AR-002`; final non-blocking recovery observation was repaired and re-reviewed before acceptance.

WP-1.7 may now open. WP-1.8+ remain sequenced behind their dependencies, and Lot 2+ remains forbidden until Lot 1 closure.
