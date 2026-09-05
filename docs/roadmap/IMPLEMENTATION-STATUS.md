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
9. `WP-1.9` — Storage/Realtime isolation foundation and security-matrix closure — **REVIEW_FAILED**.

### Durable cursor

- Current Lot: **1**
- Lot state: **IN_PROGRESS**
- Current packet: **WP-1.9**
- Packet state: **REVIEW_FAILED**
- Current/next pass: **B-REVIEW-FAILED; A-REMEDIATION next**
- Accepted packets: **WP-1.1, WP-1.2, WP-1.3, WP-1.4, WP-1.5, WP-1.6, WP-1.7, WP-1.8**
- Review-failed/blocked packets: **WP-1.9 — `WP19-AR-001` MAJOR**
- WP-1.1 acceptance evidence: run `33809855993` on `f0b1e46c46bc3ad5d15bf2191c63ec4e85473507`, all five jobs SUCCESS.
- WP-1.2 acceptance evidence: run `33811568440` on `fa96228bcd8a0b7671fcb561f8f7668eaf5851dc`, all five jobs SUCCESS; `WP12-AR-001` closed.
- WP-1.3 acceptance evidence: run `33817932867` on `707b1384fbd370fe88ef7a87ac191aa9645f6db3`, all five jobs SUCCESS; `WP13-AR-001` and `WP13-AR-002` closed.
- WP-1.4 acceptance evidence: run `33859207161` on `bf0046dc45c318875d349edc2b6327292e2894ea`, all five jobs SUCCESS including clean-checkout `npm run verify`; DB 133/133; `WP14-AR-001..003` closed.
- WP-1.5 acceptance evidence: run `33866160626` on implementation HEAD `15e477a9ca75efbc98594000c190180e24226229`, all five jobs SUCCESS including clean-checkout `npm run verify`; DB **13 files / 239 tests / PASS**; `WP15-AR-001` and `WP15-AR-002` closed; Pass C required-minus-evidenced = ∅.
- WP-1.6 acceptance evidence: run `33880216335` on implementation HEAD `61dca0718f8ff7372609d208050aba6a50271743`, all five jobs SUCCESS including clean-checkout `npm run verify`; fresh Pass B PASS; Pass C required-minus-evidenced = ∅; `WP16-AR-001` and `WP16-AR-002` closed.
- WP-1.7 acceptance evidence: run `33895516028` on implementation/review HEAD `46548702f304dbabcf4bd673a33afb1c0ec96a3d`, all five jobs SUCCESS including 28/28 Playwright E2E, mutation and clean-checkout `npm run verify`; `WP17-AR-001..003` closed; fresh Pass B PASS; Pass C required-minus-evidenced = ∅.
- WP-1.8 acceptance evidence: run `33994961610` on implementation/evidence HEAD `cb7201e2d6dc1a8ca7608bb236f1f79ac84d8d9d`, all five jobs SUCCESS including browser E2E + mutation and clean-checkout `npm run verify`; `WP18-AR-001..003` closed; final fresh Pass B PASS; Pass C required-minus-evidenced = ∅.
- WP-1.9 pre-review Pass A evidence: run `33996464530` on implementation/evidence HEAD `a0e719462b2ea41908e6438a72cac75f11edcf36`, 5/5 SUCCESS including clean-checkout `npm run verify`; DB **14 files / 277 tests / PASS**. Fresh Pass B subsequently found `WP19-AR-001`, so this evidence is historical for acceptance.
- Current branch: **`lot-1/identity-project-foundation`**
- Next permitted action: **remediate `WP19-AR-001` only by adding direct transactional DELETE allow/deny RLS evidence using Supabase's local `storage.allow_delete_query=true` session flag; then fresh exact-head evidence and fresh Pass B**.

## Lot status

| Lot | State |
|---:|---|
| 0 | **ACCEPTED** |
| 1 | **IN_PROGRESS** |
| 2–12 | NOT_STARTED |

## Product Feature counts

- V1 Feature IDs: 120 SPECIFIED inventory rows total.
- Lot 1 foundations are in implementation; no Lot 2+ Feature may start.
- WP-1.1 through WP-1.8 are accepted foundations; WP-1.9 is in bounded adversarial-review remediation as the final implementation packet before Lot reconciliation/integration/acceptance.

## Current blockers / forward maintenance

Open adversarial finding:

- `WP19-AR-001` **MAJOR**: the DELETE policy is structurally present and correctly references `media.write`, but the current green matrix does not behaviorally execute direct DELETE authorization. The repair must set Supabase's transaction-local `storage.allow_delete_query=true` flag inside the pgTAP transaction and then prove allowed and denied DELETE decisions under the existing synthetic roles. No API/service-role credentials are required.

Reviewed clean in the same Pass B:

- bucket privacy and four expected policy operations;
- full-path validation and malformed-path fail-closed behavior;
- live centralized membership/permission authorization;
- cross-project UPDATE movement denial;
- owner/editor/viewer/multi-project/outsider/revoked/anon/guest-like isolation for covered operations;
- Realtime disabled plus empty public application publication and no client Realtime surface;
- no provider/service-role/domain/Lot-2+ scope leak.

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
WP-1.9 historical Pass A: run 33996464530 on a0e719462b2ea41908e6438a72cac75f11edcf36, 5/5 SUCCESS; DB 14 files / 277 tests / PASS
Current: WP-1.9 / REVIEW_FAILED / WP19-AR-001
Next: bounded DELETE-RLS evidence remediation -> fresh exact-head verification -> fresh Pass B
Pass C/Lot closure/Lot 2+: forbidden until gates pass
```