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
3. `WP-1.3` — Supabase Auth/session and controlled first-owner provisioning — **IN_PROGRESS**;
4. `WP-1.4` — partner invitation and protected membership lifecycle — **PLANNED**;
5. `WP-1.5` — project configuration, dates, origins, preferences and RSVP-intent hooks — **PLANNED**;
6. `WP-1.6` — protected app shell/navigation and public RSVP trust boundary — **PLANNED**;
7. `WP-1.7` — project-scoped repositories, local cache and sync primitives — **PLANNED**;
8. `WP-1.8` — session expiry, safe logout, MFA/security diagnostics — **PLANNED**;
9. `WP-1.9` — Storage/Realtime isolation foundation and security-matrix closure — **PLANNED**.

### Durable cursor

- Current Lot: **1**
- Lot state: **IN_PROGRESS**
- Current packet: **WP-1.3**
- Packet state: **IN_PROGRESS**
- Current pass: **A-IMPLEMENT**
- Accepted packets: **WP-1.1, WP-1.2**
- Review-failed/blocked packets: **none open**
- WP-1.1 acceptance evidence: run `33809855993` on `f0b1e46c46bc3ad5d15bf2191c63ec4e85473507`, all five jobs SUCCESS.
- WP-1.2 acceptance evidence: run `33811568440` on `fa96228bcd8a0b7671fcb561f8f7668eaf5851dc`, all five jobs SUCCESS; repaired 41-assertion grant/RLS matrix; `WP12-AR-001` closed.
- Current branch: **`lot-1/identity-project-foundation`**
- Next permitted action: **implement WP-1.3 only: browser-safe Supabase Auth/session boundary, controlled private first-owner provisioning, verified-identity enforcement and recent-auth/MFA assurance hook**.

## Lot status

| Lot | State |
|---:|---|
| 0 | **ACCEPTED** |
| 1 | **IN_PROGRESS** |
| 2–12 | NOT_STARTED |

## Product Feature counts

- V1 Feature IDs: 120 SPECIFIED inventory rows total.
- Lot 1 foundations are in implementation; no Lot 2+ Feature may start.
- WP-1.1 and WP-1.2 are accepted foundations; user-facing Feature acceptance remains pending broader Lot 1 slices.

## Current blockers / forward maintenance

**0 open BLOCKING/MAJOR findings at WP-1.3 kickoff.**

Closed adversarial findings:

- `WP1-AR-001`: exact built-in role matrix evidence completed;
- `WP1-AR-002`: internal SECURITY DEFINER search path hardened;
- `WP12-AR-001`: core tenancy table/column/RPC grant and denied-operation matrix expanded to direct exhaustive evidence.

Inherited reviewed non-blocking maintenance:

- dependency audit reports two Moderate transitive advisories in development tooling; Critical/High accepted-known count remains zero under the normative vulnerability gate, and the Moderate findings must be re-evaluated on the relevant dependency/toolchain update;
- external container registries may transiently rate-limit clean Supabase image pulls; bounded retry is permitted only when it does not skip DB/RLS verification.

## Handoff

```text
Lot 0: ACCEPTED
Lot 1: IN_PROGRESS
Coverage: required - assigned = ∅
Accepted: WP-1.1, WP-1.2
Current: WP-1.3 / IN_PROGRESS / A-IMPLEMENT
Next: implement verified Supabase Auth/session boundary + controlled one-time private first-owner provisioning + assurance hook
WP-1.4+: forbidden until WP-1.3 acceptance
Lot 2+: forbidden
```
