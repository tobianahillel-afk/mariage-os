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

1. `WP-1.1` — permission catalog and authorization helper foundation — **REVIEW_FAILED / REPAIR**;
2. `WP-1.2` — core tenancy schema, membership and RLS baseline — **PLANNED**;
3. `WP-1.3` — Supabase Auth/session and controlled first-owner provisioning — **PLANNED**;
4. `WP-1.4` — partner invitation and protected membership lifecycle — **PLANNED**;
5. `WP-1.5` — project configuration, dates, origins, preferences and RSVP-intent hooks — **PLANNED**;
6. `WP-1.6` — protected app shell/navigation and public RSVP trust boundary — **PLANNED**;
7. `WP-1.7` — project-scoped repositories, local cache and sync primitives — **PLANNED**;
8. `WP-1.8` — session expiry, safe logout, MFA/security diagnostics — **PLANNED**;
9. `WP-1.9` — Storage/Realtime isolation foundation and security-matrix closure — **PLANNED**.

### Durable cursor

- Current Lot: **1**
- Lot state: **IN_PROGRESS**
- Current packet: **WP-1.1**
- Packet state: **REVIEW_FAILED**
- Current pass: **A-IMPLEMENT-REPAIR**
- Accepted packets: **none yet**
- Review-failed/blocked packets: **WP-1.1 — 2 MAJOR adversarial findings open**
- Latest green verification: **WP-1.1 pre-review exact-head run `33809158568` on `b76aa509d84c4aa73f80669faa2c9d6b494c15b8`, all five jobs including clean-checkout `npm run verify` SUCCESS; this green run does not close the adversarial findings**
- Current branch: **`lot-1/identity-project-foundation`**
- Next permitted action: **repair WP1-AR-001 exact role-matrix evidence and WP1-AR-002 SECURITY DEFINER search-path posture, rerun full verification, then re-enter Pass B**

## Lot status

| Lot | State |
|---:|---|
| 0 | **ACCEPTED** |
| 1 | **IN_PROGRESS** |
| 2–12 | NOT_STARTED |

## Product Feature counts

- V1 Feature IDs: 120 SPECIFIED inventory rows total.
- Lot 1 feature rows are being transitioned into lifecycle states as their packets begin; no Lot 2+ Feature may start.
- ACCEPTED product Features: 0 at current cursor.

## Current blockers / forward maintenance

**2 open MAJOR findings in WP-1.1:**

- `WP1-AR-001`: current SQL tests sample the built-in role mappings but do not prove exact set equality against the complete normative role-permission matrix;
- `WP1-AR-002`: the internal `SECURITY DEFINER` role lookup includes `public` in its search path even though all application relations can be fully qualified.

Inherited reviewed non-blocking maintenance:

- dependency audit reports two Moderate transitive advisories in development tooling; Critical/High accepted-known count remains zero under the normative vulnerability gate, and the Moderate findings must be re-evaluated on the relevant dependency/toolchain update;
- external container registries may transiently rate-limit clean Supabase image pulls; bounded retry is permitted only when it does not skip DB/RLS verification.

## Handoff

```text
Lot 0: ACCEPTED
Lot 1: IN_PROGRESS
Coverage: required - assigned = ∅
Current: WP-1.1 / REVIEW_FAILED / A-IMPLEMENT-REPAIR
Open findings: WP1-AR-001 MAJOR, WP1-AR-002 MAJOR
Next: repair exact matrix evidence + SECURITY DEFINER search path + explicit PUBLIC deny posture; rerun exact-head full verify; then fresh Pass B
WP-1.2: forbidden until WP-1.1 acceptance
Lot 2+: forbidden
```
