# Work Packet Record — WP-1.8

## Identity

- Work Packet ID: `WP-1.8`
- Lot: `1`
- Name: Session expiry, safe logout, MFA/security diagnostics
- State: `ACCEPTANCE_PENDING`
- Current pass: `C-ACCEPTANCE-RECONCILIATION`
- Primary bounded context: authenticated project-session recovery and local privacy lifecycle
- Branch/PR: `lot-1/identity-project-foundation`

## Scope

### Primary Feature IDs

- `FTR-003` — recovery-compatible Auth/session boundary and explicit expired-session state.
- `FTR-005` — MFA/strong-assurance readiness and security diagnostics foundation.
- `FTR-011` — pending-work-safe explicit logout and private local-cache purge foundation.

### Current-lot responsibilities covered

- distinguish an established project context whose provider session is gone/expired from an ordinary fresh signed-out visit without rendering private cached content;
- preserve WP-1.7 local pending work across session expiry;
- require successful reauthentication plus live membership validation before protected project state/local queue is reopened for cloud-capable work;
- retain a minimal browser-local established-context marker that contains no Auth token, invite token or project content and is cleared only after safe logout completion;
- inspect local unsynchronized-work counters before explicit logout;
- refuse logout completion/purge when unresolved local work exists unless the user explicitly chooses an allowed destructive discard path;
- clear visible project context during logout transition;
- invoke provider sign-out before private local project data is purged; failed sign-out does not silently purge recoverable local work;
- purge the account+project IndexedDB namespace after safe logout and keep failure explicit if another tab/storage error prevents purge;
- expose provider-derived current assurance and verified TOTP-factor readiness without treating UI state as authoritative for privileged commands;
- expose a bounded Settings security/diagnostics surface using safe operational metadata only;
- add unit/integration/real-browser regressions for ACC-008/ACC-009 and fresh-signed-out isolation.

### Requirements / Acceptance / Security IDs

- `IAM-008`, `IAM-009`, `IAM-013`;
- `SYN-008`, inherited `SYN-010`/`SYN-011` preservation/isolation;
- `ACC-008`, `ACC-009`, inherited `ACC-010`;
- `SEC-AUTH-003`, `SEC-AUTH-004`, `SEC-AUTH-011`, `SEC-AUTH-012`, `SEC-AUTH-013`, `SEC-AUTH-014`, `SEC-AUTH-015`;
- `SEC-LOC-001`, `SEC-LOC-002`, `SEC-LOC-004`, `SEC-LOC-006`;
- `SEC-VAL-001`, `SEC-VAL-008`, `SEC-LOG-002`, `SEC-LOG-005`, `SEC-VER-002`, `SEC-VER-005`;
- normative contracts in `AUTHENTICATION.md`, `AUTH-HARDENING.md`, `PRIVILEGED-OPERATIONS.md`, `AUTH-ONBOARDING.md`, `AUTH-BLUEPRINTS.md`, `LOCAL-DATA-SCHEMA.md`, `OFFLINE.md`, `SYNC.md`, `SETTINGS-DIAGNOSTICS.md` and `OBSERVABILITY-DIAGNOSTICS.md`.

### Explicitly out of scope for this packet

- the full remote refresh/replay/retry/backoff/conflict coordinator — Lot 10;
- claiming that local pending work is cloud-synchronized without a server acknowledgement;
- full project backup/export/restore or a general recovery-file product — later backup/import Lots;
- domain-specific drafts/media/offline business repositories not yet owned by Lot 1;
- member invitation/role/revocation commands already accepted in WP-1.4;
- new privileged project commands or weakening their server-side AAL2 checks;
- production MFA enrollment/recovery drill evidence for both real owners: this remains a real-data cutover gate; WP-1.8 provides the browser/provider readiness surface and tests;
- custom Auth token refresh cryptography, custom MFA cryptography or duplicate Auth-token persistence;
- Storage/Realtime tenant policy closure — WP-1.9;
- any Lot 2+ product functionality.

## Dependency / sequencing

- Required prior packets: WP-1.3 Auth/session adapter, WP-1.6 protected shell, WP-1.7 durable local project store are **ACCEPTED**.
- WP-1.9 remains blocked until WP-1.8 acceptance.
- Lot 2+ remains forbidden.

## Sizing review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| changed auth/session bounded behavior | 1 | 3 | 3 |
| local persistent lifecycle/purge | 1 | 2 | 2 |
| security/diagnostics UI + provider assurance | 1 | 2 | 2 |
| **Total** |  |  | **7** |

Cohesion rationale: session expiry, safe logout and security diagnostics all govern the same authenticated browser/project lifecycle. Splitting them would create unsafe intermediate states where local pending work, provider session state and visible security controls disagree.

## Expected vertical slice

- routing/session: `session_expired` protected-route decision only for a previously established local project context; ordinary signed-out remains `login_required`;
- reauth: successful provider authentication alone does not restore project shell; live `canReadProject(projectId)` still gates access before local store is opened;
- local context: minimal project→last-authorized-user marker, runtime validated and never used as cloud authorization;
- local store: explicit account+project purge primitive with blocked/error handling and no global browser-storage wipe;
- logout application service: inspect unresolved local work, return resolution-required when needed, explicit destructive-discard path, provider sign-out, then scoped local purge and context-marker clear;
- security diagnostics: safe assurance/TOTP readiness snapshot; no factor secrets/IDs/tokens in UI or diagnostic model;
- Settings UI: `/settings/security` and `/settings/diagnostics` foundation panels plus safe logout interaction;
- expired-session UI: generic recovery screen explaining work is retained and synchronization is paused; no project data/token/user ID rendered;
- tests: pure state/validation tests, provider adapter tests, IndexedDB purge lifecycle tests, route/startup tests, logout coordinator tests and Playwright session-expiry/logout/relogin isolation scenarios.

## Pass A — IMPLEMENT

Initial implementation HEAD `c93dd734ff048ea9829c53e147735c433cf8b41e` received run `33991620529`, 5/5 SUCCESS; subsequent review found `WP18-AR-001` and `WP18-AR-002`.

First repair HEAD `68dbb4be3c7407758168b573ddbcf10120ef7298` received run `33993111405`, 5/5 SUCCESS; subsequent review found `WP18-AR-003` because browser evidence did not assert the repaired warning behavior.

Final repaired implementation/evidence HEAD `cb7201e2d6dc1a8ca7608bb236f1f79ac84d8d9d` received GitHub Actions run `33994961610`, **5/5 SUCCESS**:

- Core quality/security SUCCESS;
- Browser E2E + mutation SUCCESS, including warning-zone assertions in the standard Chromium/Firefox/WebKit/mobile-Chromium matrix;
- Local Supabase DB/RLS SUCCESS;
- Privacy-safe preview artifact SUCCESS;
- clean-checkout `npm run verify` SUCCESS.

### Pass A exit criteria

- [x] bounded vertical slice implemented
- [x] runtime validation at new browser/provider trust boundaries
- [x] no private project content rendered from an expired/fresh signed-out state
- [x] pending local work survives expiry and cannot be silently purged during logout
- [x] reauth path still requires live membership validation
- [x] safe logout purges only the authenticated account+project private namespace after provider sign-out
- [x] MFA/security diagnostics expose safe metadata only and do not weaken server-side strong-auth checks
- [x] applicable unit/property/browser/security evidence green
- [x] fresh exact-head full CI including clean-checkout `npm run verify` green after final remediation

## Pass B — ADVERSARIAL REVIEW

Final fresh review performed after run `33994961610`, using final repaired delta from prior review HEAD `6d69f8cf80c5a08114fc7d171043cf49cffb3ed2`.

Result: **PASS — no unresolved BLOCKING/MAJOR finding**.

### Closed findings

- `WP18-AR-001` — **CLOSED**: ordinary safe logout explicitly uses Supabase `signOut({ scope: 'local' })`; `AuthPort` remains provider-neutral; regression test pins the exact provider call.
- `WP18-AR-002` — **CLOSED**: destructive pending-work discard is a two-step flow inside a dedicated danger zone with `Abandon irréversible`, concrete loss copy and separated destructive control; unit/error recovery evidence is green.
- `WP18-AR-003` — **CLOSED**: real-browser safe-logout regression now asserts the visible danger zone, warning heading and irreversible-loss copy before discard; the scenario runs in Chromium, Firefox, WebKit and mobile-Chromium and remains green in run `33994961610`.

The final delta from the prior review HEAD contains no production-code change: only the browser regression plus durable status documentation. Review of the surrounding session-expiry, live-membership revalidation, scoped purge, context-marker, MFA diagnostics and logout-failure paths found no additional BLOCKING/MAJOR defect.

## Pass C — ACCEPTANCE / RECONCILIATION

In progress.

Pass C must mechanically reconcile all WP-1.8 responsibilities/IDs against implementation and final green evidence. No production modification is permitted during acceptance without returning through implementation/review.

## Handoff

- Current state: `ACCEPTANCE_PENDING`.
- Current/next pass: `C-ACCEPTANCE-RECONCILIATION`.
- Final repaired evidence: run `33994961610` on `cb7201e2d6dc1a8ca7608bb236f1f79ac84d8d9d`, 5/5 SUCCESS including clean-checkout `npm run verify`.
- Fresh Pass B: PASS; `WP18-AR-001..003` closed.
- Next permitted action: Pass C reconciliation for WP-1.8 only.
- WP-1.9 and Lot 2+ remain forbidden until WP-1.8 acceptance.