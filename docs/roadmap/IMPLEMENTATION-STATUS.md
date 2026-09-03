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
2. `WP-1.2` — core tenancy schema, membership and RLS baseline — **IN_PROGRESS**;
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
- Current packet: **WP-1.2**
- Packet state: **IN_PROGRESS**
- Current pass: **A-IMPLEMENT**
- Accepted packets: **WP-1.1**
- Review-failed/blocked packets: **none open**
- WP-1.1 acceptance evidence: **run `33809855993` on `f0b1e46c46bc3ad5d15bf2191c63ec4e85473507`, all five jobs including clean-checkout `npm run verify` SUCCESS; both Pass B MAJOR findings repaired and closed**
- Current branch: **`lot-1/identity-project-foundation`**
- Next permitted action: **implement WP-1.2 only: core tenancy schema, active membership semantics, permission helper activation, grants/RLS and direct multi-project authorization matrix**

## Lot status

| Lot | State |
|---:|---|
| 0 | **ACCEPTED** |
| 1 | **IN_PROGRESS** |
| 2–12 | NOT_STARTED |

## Product Feature counts

- V1 Feature IDs: 120 SPECIFIED inventory rows total.
- Lot 1 foundations are in implementation; no Lot 2+ Feature may start.
- ACCEPTED product Features remain 0; WP-1.1 is a cross-cutting authorization foundation rather than a user-facing Feature acceptance.

## Current blockers / forward maintenance

**0 open BLOCKING/MAJOR findings at the WP-1.2 kickoff cursor.**

Closed WP-1.1 adversarial findings:

- `WP1-AR-001`: closed after exact set-equality tests for owner/editor/viewer against the normative matrix;
- `WP1-AR-002`: closed after restricting the internal `SECURITY DEFINER` helper to `search_path = pg_catalog` and proving client-execution denial.

Inherited reviewed non-blocking maintenance:

- dependency audit reports two Moderate transitive advisories in development tooling; Critical/High accepted-known count remains zero under the normative vulnerability gate, and the Moderate findings must be re-evaluated on the relevant dependency/toolchain update;
- external container registries may transiently rate-limit clean Supabase image pulls; bounded retry is permitted only when it does not skip DB/RLS verification.

## Handoff

```text
Lot 0: ACCEPTED
Lot 1: IN_PROGRESS
Coverage: required - assigned = ∅
Accepted: WP-1.1
Current: WP-1.2 / IN_PROGRESS / A-IMPLEMENT
Next: implement profiles + projects + project_members + membership-aware has_project_permission + explicit grants/RLS + synthetic cross-project allow/deny tests
WP-1.3+: forbidden until WP-1.2 acceptance
Lot 2+: forbidden
```
