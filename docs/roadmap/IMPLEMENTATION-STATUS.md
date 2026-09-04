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
7. `WP-1.7` — project-scoped repositories, local cache and sync primitives — **READY**;
8. `WP-1.8` — session expiry, safe logout, MFA/security diagnostics — **PLANNED**;
9. `WP-1.9` — Storage/Realtime isolation foundation and security-matrix closure — **PLANNED**.

### Durable cursor

- Current Lot: **1**
- Lot state: **IN_PROGRESS**
- Current packet: **WP-1.7**
- Packet state: **READY**
- Current/next pass: **A-IMPLEMENT**
- Accepted packets: **WP-1.1, WP-1.2, WP-1.3, WP-1.4, WP-1.5, WP-1.6**
- Review-failed/blocked packets: **none**
- WP-1.1 acceptance evidence: run `33809855993` on `f0b1e46c46bc3ad5d15bf2191c63ec4e85473507`, all five jobs SUCCESS.
- WP-1.2 acceptance evidence: run `33811568440` on `fa96228bcd8a0b7671fcb561f8f7668eaf5851dc`, all five jobs SUCCESS; `WP12-AR-001` closed.
- WP-1.3 acceptance evidence: run `33817932867` on `707b1384fbd370fe88ef7a87ac191aa9645f6db3`, all five jobs SUCCESS; `WP13-AR-001` and `WP13-AR-002` closed.
- WP-1.4 acceptance evidence: run `33859207161` on `bf0046dc45c318875d349edc2b6327292e2894ea`, all five jobs SUCCESS; DB 133/133; `WP14-AR-001..003` closed.
- WP-1.5 acceptance evidence: run `33866160626` on implementation HEAD `15e477a9ca75efbc98594000c190180e24226229`, all five jobs SUCCESS including clean-checkout `npm run verify`; DB **13 files / 239 tests / PASS**; `WP15-AR-001` and `WP15-AR-002` closed; Pass C required-minus-evidenced = ∅.
- WP-1.6 acceptance evidence: run `33880216335` on implementation HEAD `61dca0718f8ff7372609d208050aba6a50271743`, all five jobs SUCCESS including clean-checkout `npm run verify`; fresh Pass B PASS; Pass C required-minus-evidenced = ∅; `WP16-AR-001` and `WP16-AR-002` closed; final recovery observation repaired/re-reviewed.
- Current branch: **`lot-1/identity-project-foundation`**
- Next permitted action: **begin WP-1.7 Pass A only: project-scoped repositories, local account+project partitioning and sync-envelope primitives**.

## Lot status

| Lot | State |
|---:|---|
| 0 | **ACCEPTED** |
| 1 | **IN_PROGRESS** |
| 2–12 | NOT_STARTED |

## Product Feature counts

- V1 Feature IDs: 120 SPECIFIED inventory rows total.
- Lot 1 foundations are in implementation; no Lot 2+ Feature may start.
- WP-1.1 through WP-1.6 are accepted foundations; user-facing Feature acceptance remains pending broader Lot 1 slices and Lot integration.

## Current blockers / forward maintenance

Open adversarial findings: **none for the current cursor**.

Closed/adversarial findings:

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
- `WP16-AR-002`: protected DOM is neutralized before asynchronous authorization and provider failures resolve fail-closed to generic recovery.

Inherited reviewed non-blocking maintenance:

- dependency audit reports two Moderate transitive advisories in development tooling; Critical/High accepted-known count remains zero under the normative vulnerability gate;
- dependency auditing keeps `npm audit` primary with exact-lockfile GitHub Advisory fallback only after bounded transient provider failure; dual-provider unavailability remains fail-closed;
- external container registries may transiently rate-limit clean Supabase pulls; retry cannot skip DB/RLS verification;
- exact provider signup-window behavior remains a downstream Lot-1 onboarding requirement;
- invitation create/accept rate-limit/abuse evidence remains required before public/self-service exposure or real production cutover.

## Handoff

```text
Lot 0: ACCEPTED
Lot 1: IN_PROGRESS
Coverage: required - assigned = ∅
Accepted: WP-1.1, WP-1.2, WP-1.3, WP-1.4, WP-1.5, WP-1.6
WP-1.6 acceptance: run 33880216335 on 61dca0718f8ff7372609d208050aba6a50271743, 5/5 SUCCESS; Pass B PASS; Pass C required-evidenced = ∅
Current: WP-1.7 / READY / A-IMPLEMENT next
Open findings: none
Next: begin WP-1.7 Pass A only
WP-1.8/1.9 remain sequenced behind dependencies
Lot 2+: forbidden
```
