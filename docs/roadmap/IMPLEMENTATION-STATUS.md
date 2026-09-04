# Mariage OS — Implementation Status Board

Status: **Living repository source of truth for development progress**

## Current phase

- V1 documentation/design: **COMPLETE / FROZEN**.
- Guest RSVP + Email/SMS/WhatsApp scope: **MERGED / FROZEN**.
- AI Lot Orchestration governance: **MERGED / FROZEN**.
- Final Design Review: **PASS**.
- Implementation gate: **OPEN**.
- Lot 0: **ACCEPTED** — implementation/integration completed 2026-09-03.
- **Lot 1: IN_PROGRESS** — explicitly kicked off by the user on 2026-09-03.
- Lots 2–12: **NOT_STARTED**.

Lot 1 is the only permitted implementation scope. No Lot 2+ product implementation is permitted.

## Lot 0 closure

Coverage/reconciliation: `lot-0/LOT-0-COVERAGE-MATRIX.md`.

- WP-0.1 through WP-0.6: **ACCEPTED**.
- Required Lot 0 responsibilities minus accepted/evidenced responsibilities: **∅**.
- Lot Integration Pass: **PASS**.
- Exact-head closure: branch `lot-0/repository-tooling` at `3dccc801a38929c6dfda7ecb06626d9c5143ec76` retained a green Lot 0 CI including clean-checkout `npm run verify`.

## Lot 1 orchestration

Coverage plan: `lot-1/LOT-1-COVERAGE-MATRIX.md`.

Required current-lot responsibilities minus assigned packet responsibilities: **∅**.

Packets:

1. `WP-1.1` — permission catalog and authorization helper foundation — **ACCEPTED**;
2. `WP-1.2` — core tenancy schema, membership and RLS baseline — **ACCEPTED**;
3. `WP-1.3` — Supabase Auth/session and controlled first-owner provisioning — **ACCEPTED**;
4. `WP-1.4` — partner invitation and protected membership lifecycle — **ACCEPTED**;
5. `WP-1.5` — project configuration, dates, origins, preferences and RSVP-intent hooks — **REVIEW_PENDING / B-ADVERSARIAL-REVIEW**;
6. `WP-1.6` — protected app shell/navigation and public RSVP trust boundary — **PLANNED**;
7. `WP-1.7` — project-scoped repositories, local cache and sync primitives — **PLANNED**;
8. `WP-1.8` — session expiry, safe logout, MFA/security diagnostics — **PLANNED**;
9. `WP-1.9` — Storage/Realtime isolation foundation and security-matrix closure — **PLANNED**.

### Durable cursor

- Current Lot: **1**
- Lot state: **IN_PROGRESS**
- Current packet: **WP-1.5**
- Packet state: **REVIEW_PENDING**
- Current pass: **B-ADVERSARIAL-REVIEW**
- Accepted packets: **WP-1.1, WP-1.2, WP-1.3, WP-1.4**
- Review-failed/blocked packets: **WP-1.5 has one open MAJOR finding under repair**
- WP-1.1 acceptance evidence: run `33809855993` on `f0b1e46c46bc3ad5d15bf2191c63ec4e85473507`, all five jobs SUCCESS.
- WP-1.2 acceptance evidence: run `33811568440` on `fa96228bcd8a0b7671fcb561f8f7668eaf5851dc`, all five jobs SUCCESS; `WP12-AR-001` closed.
- WP-1.3 acceptance evidence: run `33817932867` on `707b1384fbd370fe88ef7a87ac191aa9645f6db3`, all five jobs SUCCESS; `WP13-AR-001` and `WP13-AR-002` closed.
- WP-1.4 acceptance evidence: run `33859207161` on `bf0046dc45c318875d349edc2b6327292e2894ea`, all five jobs SUCCESS; DB 133/133; `WP14-AR-001..003` closed.
- WP-1.5 Pass-A evidence: run `33863817975` on `d7f019878c0827e4357e59278a342d5033bca2cb`, all five jobs SUCCESS including clean-checkout `npm run verify`; DB **12 files / 232 tests / PASS**.
- Current branch: **`lot-1/identity-project-foundation`**
- Next permitted action: **repair `WP15-AR-001`, rerun exact-head verification and conduct a fresh Pass B**.

## Lot status

| Lot | State |
|---:|---|
| 0 | **ACCEPTED** |
| 1 | **IN_PROGRESS** |
| 2–12 | NOT_STARTED |

## Product Feature counts

- V1 Feature IDs: 120 SPECIFIED inventory rows total.
- Lot 1 foundations are in implementation; no Lot 2+ Feature may start.
- WP-1.1 through WP-1.4 are accepted foundations; user-facing Feature acceptance remains pending broader Lot 1 slices and Lot integration.

## Current blockers / forward maintenance

Open adversarial finding:

- `WP15-AR-001` — **MAJOR**: rejected/archived wedding-date rows can still rewrite their civil date through generic update; repair must preserve historical date until explicit reactivation to candidate.

Closed/adversarial findings:

- `WP1-AR-001`: exact built-in role matrix evidence completed;
- `WP1-AR-002`: internal SECURITY DEFINER search path hardened;
- `WP12-AR-001`: core tenancy grant/RLS denial matrix expanded;
- `WP13-AR-001`: provider-returned project IDs validated as UUIDs;
- `WP13-AR-002`: password minimum hardened to 14 characters;
- `WP14-AR-001`: privileged membership role/revoke commands require AAL2;
- `WP14-AR-002`: project-first invitation lifecycle lock ordering removes deadlock risk;
- `WP14-AR-003`: privileged invitation/membership authorization is evaluated after serialization, closing stale-authorization TOCTOU.

WP-1.5 Pass-A hardening before formal review also closed selected-date generic-transition bypass, RSVP channel/setup inconsistency, null selector validation gaps, anonymous grant-surface gaps and lock-order evidence gaps before the Pass-A gate.

Inherited reviewed non-blocking maintenance:

- dependency audit reports two Moderate transitive advisories in development tooling; Critical/High accepted-known count remains zero under the normative vulnerability gate;
- dependency auditing keeps `npm audit` primary with exact-lockfile GitHub Advisory fallback only after bounded transient provider failure; dual-provider unavailability remains fail-closed;
- external container registries may transiently rate-limit clean Supabase pulls; retry cannot skip DB/RLS verification;
- exact provider signup-window behavior remains a downstream Lot-1 onboarding requirement;
- invitation create/accept rate-limit/abuse evidence remains required before public/self-service exposure or real production cutover;
- official Supabase browser SDK composition remains downstream from the structural Auth adapter boundary and must not introduce custom token/session handling.

## Handoff

```text
Lot 0: ACCEPTED
Lot 1: IN_PROGRESS
Coverage: required - assigned = ∅
Accepted: WP-1.1, WP-1.2, WP-1.3, WP-1.4
Current: WP-1.5 / REVIEW_PENDING / B-ADVERSARIAL-REVIEW
WP-1.5 Pass A: run 33863817975, DB 232/232, 5/5 CI
Open: WP15-AR-001 MAJOR
Next: repair finding → exact-head verify → fresh Pass B
WP-1.6+: forbidden until WP-1.5 acceptance
Lot 2+: forbidden
```
