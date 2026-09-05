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
5. `WP-1.5` — project configuration, dates, origins, preferences and RSVP-intent hooks — **ACCEPTED**;
6. `WP-1.6` — protected app shell/navigation and public RSVP trust boundary — **ACCEPTED**;
7. `WP-1.7` — project-scoped repositories, local cache and sync primitives — **ACCEPTED**;
8. `WP-1.8` — session expiry, safe logout, MFA/security diagnostics — **ACCEPTED**;
9. `WP-1.9` — Storage/Realtime isolation foundation and security-matrix closure — **PLANNED**.

### Durable cursor

- Current Lot: **1**
- Lot state: **IN_PROGRESS**
- Current packet: **WP-1.9**
- Packet state: **PLANNED**
- Current/next pass: **PREPARE / READINESS**
- Accepted packets: **WP-1.1, WP-1.2, WP-1.3, WP-1.4, WP-1.5, WP-1.6, WP-1.7, WP-1.8**
- Review-failed/blocked packets: **none**
- WP-1.1 acceptance evidence: run `33809855993` on `f0b1e46c46bc3ad5d15bf2191c63ec4e85473507`, all five jobs SUCCESS.
- WP-1.2 acceptance evidence: run `33811568440` on `fa96228bcd8a0b7671fcb561f8f7668eaf5851dc`, all five jobs SUCCESS; `WP12-AR-001` closed.
- WP-1.3 acceptance evidence: run `33817932867` on `707b1384fbd370fe88ef7a87ac191aa9645f6db3`, all five jobs SUCCESS; `WP13-AR-001` and `WP13-AR-002` closed.
- WP-1.4 acceptance evidence: run `33859207161` on `bf0046dc45c318875d349edc2b6327292e2894ea`, all five jobs SUCCESS including clean-checkout `npm run verify`; DB 133/133; `WP14-AR-001..003` closed.
- WP-1.5 acceptance evidence: run `33866160626` on implementation HEAD `15e477a9ca75efbc98594000c190180e24226229`, all five jobs SUCCESS including clean-checkout `npm run verify`; DB **13 files / 239 tests / PASS**; `WP15-AR-001` and `WP15-AR-002` closed; Pass C required-minus-evidenced = ∅.
- WP-1.6 acceptance evidence: run `33880216335` on implementation HEAD `61dca0718f8ff7372609d208050aba6a50271743`, all five jobs SUCCESS including clean-checkout `npm run verify`; fresh Pass B PASS; Pass C required-minus-evidenced = ∅; `WP16-AR-001` and `WP16-AR-002` closed; final recovery observation repaired/re-reviewed.
- WP-1.7 acceptance evidence: run `33895516028` on implementation/review HEAD `46548702f304dbabcf4bd673a33afb1c0ec96a3d`, all five jobs SUCCESS including 28/28 Playwright E2E, mutation and clean-checkout `npm run verify`; `WP17-AR-001..003` closed; fresh Pass B PASS; Pass C required-minus-evidenced = ∅.
- WP-1.8 acceptance evidence: run `33994961610` on implementation/evidence HEAD `cb7201e2d6dc1a8ca7608bb236f1f79ac84d8d9d`, all five jobs SUCCESS including browser E2E + mutation and clean-checkout `npm run verify`; `WP18-AR-001..003` closed; final fresh Pass B PASS; Pass C required-minus-evidenced = ∅.
- Current branch: **`lot-1/identity-project-foundation`**
- Next permitted action: **prepare/re-read WP-1.9 and its governing Storage/Realtime/security-matrix contracts, then move only WP-1.9 through the normal Pass A → B → C protocol**.

## Lot status

| Lot | State |
|---:|---|
| 0 | **ACCEPTED** |
| 1 | **IN_PROGRESS** |
| 2–12 | NOT_STARTED |

## Product Feature counts

- V1 Feature IDs: 120 SPECIFIED inventory rows total.
- Lot 1 foundations are in implementation; no Lot 2+ Feature may start.
- WP-1.1 through WP-1.8 are accepted foundations; WP-1.9 is the final planned packet before Lot 1 reconciliation/integration/acceptance.

## Current blockers / forward maintenance

Open adversarial findings:

- none.

Closed WP-1.8 findings:

- `WP18-AR-001`: ordinary safe logout explicitly uses provider-local Supabase sign-out while `AuthPort` remains provider-neutral; exact provider-call regression is green.
- `WP18-AR-002`: destructive pending-work discard uses a dedicated warning/danger zone with irreversible-loss copy and separated destructive action; unit/error evidence is green.
- `WP18-AR-003`: Playwright proves the browser-visible danger zone, warning heading and loss copy before destructive discard across Chromium/Firefox/WebKit/mobile-Chromium.

Closed/adversarial findings from prior packets:

- `WP1-AR-001`: exact built-in role matrix evidence completed;
- `WP1-AR-002`: internal SECURITY DEFINER search path hardened;
- `WP12-AR-001`: core tenancy grant/RLS denial matrix expanded;
- `WP13-AR-001`: provider-returned project IDs validated as UUIDs;
- `WP13-AR-002`: password minimum hardened to 14 characters;
- `WP14-AR-001`: privileged membership role/revoke commands require AAL2;
- `WP14-AR-002`: project-first invitation lifecycle lock ordering removes deadlock risk;
- `WP14-AR-003`: privileged invitation/membership authorization is evaluated after serialization, closing stale-authorization TOCTOU;
- `WP15-AR-001`: rejected/archived wedding-date history preserved until explicit candidate reactivation;
- `WP15-AR-002`: exhaustive WP-1.5 table/column/RPC grant evidence completed;
- `WP16-AR-001`: official browser Supabase client composition now uses browser-safe publishable configuration and accepted Auth/project-access adapters;
- `WP16-AR-002`: protected DOM is neutralized before asynchronous authorization and provider failures resolve fail-closed to generic recovery;
- `WP17-AR-001`: IndexedDB metadata/cached-record/pending-mutation values are runtime parsed fail-closed before use;
- `WP17-AR-002`: blocked/version-change IndexedDB lifecycle is explicit and cannot leave startup waiting indefinitely;
- `WP17-AR-003`: `synced` requires explicit cloud synchronization evidence; zero local work alone yields truthful `online_idle`.

Inherited reviewed non-blocking maintenance:

- dependency audit reports two Moderate transitive advisories in development tooling; Critical/High accepted-known count remains zero under the normative vulnerability gate;
- dependency auditing keeps `npm audit` primary with exact-lockfile GitHub Advisory fallback only after bounded transient provider failure; dual-provider unavailability remains fail-closed;
- external container registries may transiently rate-limit clean Supabase pulls; retry cannot skip DB/RLS verification;
- exact provider signup-window behavior remains a downstream Lot-1 onboarding requirement;
- invitation create/accept rate-limit/abuse evidence remains required before public/self-service exposure or real production cutover;
- browser device identity recovery after selective localStorage/IndexedDB divergence remains later session/local-recovery hardening; current behavior fails closed/degraded without cross-scope attachment or silent deletion.

## Handoff

```text
Lot 0: ACCEPTED
Lot 1: IN_PROGRESS
Coverage: required - assigned = ∅
Accepted: WP-1.1, WP-1.2, WP-1.3, WP-1.4, WP-1.5, WP-1.6, WP-1.7, WP-1.8
WP-1.8 acceptance: run 33994961610 on cb7201e2d6dc1a8ca7608bb236f1f79ac84d8d9d, 5/5 SUCCESS; final fresh Pass B PASS; Pass C required-minus-evidenced = ∅
Current: WP-1.9 / PLANNED / PREPARE-READINESS
Next: read WP-1.9 governing contracts -> move to READY only if no material ambiguity -> Pass A
Lot 2+: forbidden
```