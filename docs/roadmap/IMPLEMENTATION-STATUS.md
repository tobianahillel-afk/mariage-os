# Mariage OS — Implementation Status Board

Status: **Living repository source of truth for development progress**

## Current phase

- V1 documentation/design: **COMPLETE / FROZEN**.
- Guest RSVP + Email/SMS/WhatsApp scope: **MERGED / FROZEN**.
- AI Lot Orchestration governance: **MERGED / FROZEN**.
- Final Design Review: **PASS**.
- Implementation gate: **OPEN**.
- Lot 0: **ACCEPTED** — repository/tooling foundation completed 2026-09-03.
- Lot 1: **ACCEPTED** — identity/project/security foundation completed 2026-09-06.
- **Lot 2: IN_PROGRESS — Venues core explicitly kicked off 2026-09-06.**
- Lots 3–12: **NOT_STARTED**.

`main` is integration truth after PR #7 promoted the accepted Lot 0 + Lot 1 state. Promotion merge commit: `f6da05626f024431230ae46ca1ec8a4becc72a1f`. PR #7 CI run `34030211097`: **5/5 SUCCESS**, including clean-checkout `npm run verify`.

## Lot 0 closure

Coverage/reconciliation: `lot-0/LOT-0-COVERAGE-MATRIX.md`.

- WP-0.1 through WP-0.6: **ACCEPTED**.
- Required Lot 0 responsibilities minus accepted/evidenced responsibilities: **∅**.
- Lot Integration Pass: **PASS**.
- Accepted Lot 0 branch head: `3dccc801a38929c6dfda7ecb06626d9c5143ec76`.

## Lot 1 closure

Coverage/reconciliation: `lot-1/LOT-1-COVERAGE-MATRIX.md`.
Integration record: `lot-1/LOT-1-INTEGRATION-PASS.md`.

- WP-1.1 through WP-1.9: **ACCEPTED**.
- Required current-lot responsibilities minus assigned packet responsibilities: **∅**.
- Required packet-owned current-lot responsibilities minus accepted/evidenced packet responsibilities: **∅**.
- Required current-lot responsibilities minus accepted/evidenced responsibilities after Integration Pass: **∅**.
- Lot Integration Pass: **PASS**.
- Open Lot Integration findings: **none; `LOT1-IP-001` CLOSED**.
- Integration evidence: run `34026968380` on `c7594e6cd15e33602411b810aad7f89ee732ba57`, 5/5 SUCCESS; DB 15 files / 294 tests PASS; Playwright 40/40 PASS.
- Final Lot 1 branch head before promotion: `c27021fe739b52811e5c219439a0c5c7e8db8049`; exact-head push CI run `34027354049` SUCCESS.
- Promotion to `main`: PR #7 / merge commit `f6da05626f024431230ae46ca1ec8a4becc72a1f`; PR CI run `34030211097` 5/5 SUCCESS.

## Lot 2 progress

Coverage/work-packet plan: `lot-2/LOT-2-COVERAGE-MATRIX.md`.

Required current-lot responsibilities minus assigned packet responsibilities: **∅**.

Packets:

1. `WP-2.1` — venue identity, authorized persistence and lifecycle-history foundation — **ACCEPTED**;
2. `WP-2.2` — spaces, capacity and member ratings/preferences — **PLANNED / NEXT**;
3. `WP-2.3` — fact definitions, typed retained facts and value validation — **PLANNED**;
4. `WP-2.4` — observations, sources, evidence/confidence/freshness and conflicts — **PLANNED**;
5. `WP-2.5` — deterministic criteria, blockers, score/readiness and missing information — **PLANNED**;
6. `WP-2.6` — venue offers, availability, contacts and interactions basics — **PLANNED**;
7. `WP-2.7` — contextual venue access-route observations — **PLANNED**;
8. `WP-2.8` — venue media/photo foundation and private/remote media safety — **PLANNED**;
9. `WP-2.9` — venue document and tag/link basics — **PLANNED**;
10. `WP-2.10` — venue repositories, local cache and pending/offline mutation integration — **PLANNED**;
11. `WP-2.11` — gallery/table/detail/compare/deep-link workspace — **PLANNED**;
12. `WP-2.12` — mobile/offline venue-visit workflow and packet-level end-to-end completion — **PLANNED**.

### WP-2.1 acceptance evidence

Record: `lot-2/WP-2.1.md`.

- State: **ACCEPTED**.
- Required WP-2.1 responsibilities minus accepted/evidenced responsibilities: **∅**.
- Original Pass B findings `WP2.1-B-001..005`: **RESOLVED**.
- Fresh re-review findings `WP2.1-B-006..008`: **RESOLVED**.
- Fresh Pass B: **PASS**.
- Pass C reconciliation: **PASS**.
- Open WP-2.1 BLOCKING/MAJOR findings: **none**.
- Reviewed implementation head: `3418659d94d35f61183f0a20c367c74e38e86802`.
- Exact implementation CI run `34039296392`: **5/5 SUCCESS**.
- Unit: **39 files / 350 tests PASS**, measured in-scope coverage **100% statements/branches/functions/lines**.
- DB/RLS: **17 files / 359 pgTAP tests PASS**.
- Browser: **40/40 Playwright PASS** across Chromium, Firefox, WebKit and mobile Chromium.
- Privacy-safe preview: **PASS**.
- Full verify from clean checkout: **PASS**.
- Mutation job is green but currently mutates `start-application.ts`; it is not claimed as Venue mutation evidence for WP-2.1.

### Durable cursor

- Current Lot: **2 — Venues core**
- Lot state: **IN_PROGRESS**
- Current branch: **`lot-2/venues-core`**
- Current packet: **none between packets; WP-2.1 accepted, WP-2.2 next**
- Packet state: **none active**
- Current pass: **none active**
- Accepted packets: **WP-2.1**
- Review-failed/blocked packets: **none**
- Open packet BLOCKING/MAJOR findings: **none**
- Latest accepted packet implementation verification: run `34039296392` on `3418659d94d35f61183f0a20c367c74e38e86802`, **5/5 SUCCESS**, including clean-checkout `npm run verify`.
- Next permitted action: **after governance-only exact-head CI remains green, open WP-2.2 as the single `IN_PROGRESS` packet and execute Pass A; do not start another packet concurrently.**

## Known localized specification repairs

These are recorded stop-conditions for the owning later packets, not permission to invent behavior and not blockers for WP-2.2:

- before WP-2.4 implements `fact_observations`, reconcile the normative distinction between `evidence_level` and the separate `confidence = high|medium|low|unknown` field;
- before WP-2.5 implements `evidenceReadiness`, document its deterministic formula in `domain/CRITERIA-EVALUATION.md`;
- before WP-2.8 relies on the security reading graph, repair the missing `docs/security/STORAGE-RLS.md` reference using the already frozen Storage/RLS rules and tested Lot-1 policies.

The Venue lifecycle documentation conflict discovered during WP-2.1 is closed by `docs/domain/STATE-MACHINES-VENUE-LIFECYCLE-ADDENDUM.md`: `reserve` is a non-contractual backup-candidate state; protected commitment/terminal states require dedicated future commands and are unavailable through the generic lifecycle command.

## Lot status

| Lot | State |
|---:|---|
| 0 | **ACCEPTED** |
| 1 | **ACCEPTED** |
| 2 | **IN_PROGRESS** |
| 3–12 | NOT_STARTED |

## Product Feature inventory

- V1 Feature IDs: 120 total across both ledgers.
- Lot 2 primary Feature IDs: `FTR-013..FTR-028`.
- Current-lot partial responsibilities also include `FTR-012`, `FTR-089`, `FTR-092`, `FTR-093` and Lot-acceptance cross-cutting access/offline/security responsibilities.
- Feature-level whole-capability status and current-lot responsibility are not conflated; Lot Coverage Matrices are the durable responsibility-level reconciliation source.
- `FTR-013` and `FTR-014` are now feature-level **IN_PROGRESS**, not ACCEPTED: WP-2.1 packet responsibilities are accepted while their remaining Lot-2 UI/local/duplicate-guard/deep-link responsibilities are still planned.

## Current blockers / forward maintenance

Open Lot 2 packet findings: **none**.

Inherited reviewed non-blocking maintenance:

- dependency audit reports two Moderate transitive advisories in development tooling; Critical/High accepted-known count remains zero under the normative vulnerability gate;
- dependency auditing keeps `npm audit` primary with exact-lockfile GitHub Advisory fallback only after bounded transient provider failure; dual-provider unavailability remains fail-closed;
- external container registries may transiently rate-limit clean Supabase pulls; retry cannot skip DB/RLS verification;
- exact provider signup-window behavior remains a downstream onboarding/cutover requirement;
- invitation create/accept rate-limit/abuse evidence remains required before public/self-service exposure or real production cutover;
- browser device identity recovery after selective localStorage/IndexedDB divergence remains later session/local-recovery hardening;
- root `README.md` still contains historical pre-Lot-0 status wording and should be reconciled during Lot 2 governance cleanup without overriding this status board.

## Handoff

```text
main integration truth: f6da05626f024431230ae46ca1ec8a4becc72a1f
PR #7 promotion CI: 34030211097 — 5/5 SUCCESS
Lot 0: ACCEPTED
Lot 1: ACCEPTED
Lot 2: IN_PROGRESS
Lot 2 branch: lot-2/venues-core
Coverage: required current-lot responsibilities - assigned packet responsibilities = ∅
Accepted Lot 2 packets: WP-2.1
WP-2.1: ACCEPTED
WP-2.1 reviewed implementation head: 3418659d94d35f61183f0a20c367c74e38e86802
WP-2.1 CI: 34039296392 — 5/5 SUCCESS, clean-checkout verify PASS
WP-2.1 responsibility gap: ∅
Open WP-2.1 BLOCKING/MAJOR: none
Current packet: none between packets
Next packet: WP-2.2 — spaces, capacity and member ratings/preferences
Next: exact-head governance CI, then open WP-2.2 as the only IN_PROGRESS packet
Lots 3–12: NOT_STARTED
```
