# Work Packet Record — WP-1.8

## Identity

- Work Packet ID: `WP-1.8`
- Lot: `1`
- Name: Session expiry, safe logout, MFA/security diagnostics
- State: `ACCEPTED`
- Current pass: `C-ACCEPTED`
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
- WP-1.9 becomes the next permitted packet after this acceptance.
- Lot 2+ remains forbidden pending Lot 1 completion/acceptance.

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

Final repaired implementation/evidence HEAD: `cb7201e2d6dc1a8ca7608bb236f1f79ac84d8d9d`.

GitHub Actions run `33994961610`: **5/5 SUCCESS**:

- Core quality/security SUCCESS;
- Browser E2E + mutation SUCCESS, including warning-zone assertions in Chromium, Firefox, WebKit and mobile-Chromium;
- Local Supabase DB/RLS SUCCESS;
- Privacy-safe preview artifact SUCCESS;
- clean-checkout `npm run verify` SUCCESS.

Earlier implementation/review cycles remain recorded historically: initial run `33991620529` led to `WP18-AR-001/002`; first repair run `33993111405` led to `WP18-AR-003`.

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

Final result: **PASS — no unresolved BLOCKING/MAJOR finding**.

### Closed findings

- `WP18-AR-001` — **CLOSED**: ordinary safe logout explicitly uses Supabase `signOut({ scope: 'local' })`; application `AuthPort` remains provider-neutral; exact-call regression is green.
- `WP18-AR-002` — **CLOSED**: destructive pending-work discard remains two-step and is isolated inside a dedicated danger zone with `Abandon irréversible`, irreversible-loss copy and separated destructive control; unit/error recovery evidence is green.
- `WP18-AR-003` — **CLOSED**: real-browser regression asserts the visible danger zone, warning heading and loss copy before discard across Chromium, Firefox, WebKit and mobile-Chromium.

Final review delta from prior review HEAD `6d69f8cf80c5a08114fc7d171043cf49cffb3ed2` contained no production-code change: only the missing browser regression plus durable status documentation. Surrounding session-expiry, live-membership revalidation, scoped purge, context-marker, MFA diagnostics and logout-failure paths were rechecked without additional BLOCKING/MAJOR finding.

## Pass C — ACCEPTANCE / RECONCILIATION

### Mechanical reconciliation

| Expected responsibility | Implemented | Verified evidence | Result |
|---|---|---|---|
| fresh signed-out vs established-context session-expiry distinction | protected-route guard uses validated local context marker only to choose `login_required` vs `session_expired`; marker is never cloud authorization | protected-route unit tests; signed-out/session-expiry Playwright scenarios | PASS |
| pending local work survives session expiry | account+project IndexedDB queue is not purged on expiry; expired shell states sync is suspended and work retained | durable IndexedDB/reload tests; ACC-008 Playwright scenario | PASS |
| cloud/project access resumes only after reauth + live membership validation | verified session must pass live `canReadProject(projectId)` before private shell/local project state opens | route/startup tests; member vs outsider E2E | PASS |
| minimal local established-context marker is safe and scoped | browser store persists only validated project→user UUID mapping; malformed/storage failures fail closed; no auth token/project content copied | marker unit tests; secret/static controls | PASS |
| logout inspects all unresolved local work before destructive completion | pending, conflict, retryable failure and permanent failure counters contribute to resolution requirement | safe-logout unit tests | PASS |
| explicit logout never silently discards pending work | unresolved work returns `resolution_required`; discard requires separate explicit second action and irreversible warning | safe-logout + security-panel unit tests; ACC-009 Playwright scenario | PASS |
| logout transition clears visible private context before provider/purge work | application passes root-neutralization callback before sign-out; failures render generic unavailable recovery state | coordinator ordering tests; startup/logout tests | PASS |
| ordinary provider logout is current-session scoped | Supabase adapter uses explicit `{ scope: 'local' }` while application port remains provider-neutral | adapter regression; real SDK typecheck; full verify | PASS |
| private local purge is account+project scoped and ordered after provider sign-out | IndexedDB deletion targets only scoped namespace; context marker clears only after successful purge | purge/coordinator unit tests; two-project Playwright isolation scenario | PASS |
| sign-out/purge/context-cleanup failures fail safely | sign-out failure preserves local cache; purge failure preserves context marker; typed generic recovery outcomes | safe-logout failure tests; UI recovery tests | PASS |
| bounded MFA/security diagnostics expose no secret/factor identifier | diagnostics model contains only assurance, AAL2-upgrade readiness and verified-TOTP boolean; provider errors fail closed | Supabase adapter diagnostics tests; security settings/diagnostics UI tests | PASS |
| no UI assurance substitutes for server-side privileged-command enforcement | diagnostics copy explicitly informational; existing privileged RPC AAL2 controls from accepted prior packet remain unchanged | architecture/security review; existing DB/RPC evidence; final diff review | PASS |
| no WP-1.9/Lot-10/Lot-2+ scope pulled forward | no Storage/Realtime policy work, remote sync coordinator, business domain or provider token crypto introduced | final diff review; architecture/static gates | PASS |

Mechanical set result:

`required WP-1.8 responsibilities − implemented/evidenced responsibilities = ∅`

### Acceptance decision

- all WP-1.8 current-lot responsibilities are implemented or explicitly deferred by packet scope;
- `WP18-AR-001`, `WP18-AR-002` and `WP18-AR-003` are closed;
- final fresh Pass B has no unresolved BLOCKING/MAJOR finding;
- final implementation/evidence run `33994961610` on `cb7201e2d6dc1a8ca7608bb236f1f79ac84d8d9d` is 5/5 SUCCESS including clean-checkout `npm run verify`;
- architecture/complexity/security gates are green;
- no out-of-scope WP-1.9, Lot-10 or Lot-2+ functionality was introduced.

Result: **ACCEPTED**.

## Handoff

- Current state: `ACCEPTED`.
- Current/last pass: `C-ACCEPTED`.
- Acceptance implementation evidence: run `33994961610` on `cb7201e2d6dc1a8ca7608bb236f1f79ac84d8d9d`, all five jobs SUCCESS including clean-checkout `npm run verify`.
- Findings: `WP18-AR-001`, `WP18-AR-002`, `WP18-AR-003` — all **CLOSED**; final fresh Pass B **PASS**.
- Pass C: `required − implemented/evidenced = ∅`.
- Next permitted packet: WP-1.9, subject to its bounded packet record and normal Pass A → B → C protocol.
- Lot 2+ remains forbidden pending Lot 1 closure.