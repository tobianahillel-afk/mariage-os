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

`main` is integration truth again after PR #7 promoted the accepted Lot 0 + Lot 1 state. Promotion merge commit: `f6da05626f024431230ae46ca1ec8a4becc72a1f`. PR #7 CI run `34030211097`: **5/5 SUCCESS**, including clean-checkout `npm run verify`.

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

## Lot 2 kickoff

Coverage/work-packet plan: `lot-2/LOT-2-COVERAGE-MATRIX.md`.

Required current-lot responsibilities minus assigned packet responsibilities: **∅**.

Planned packets:

1. `WP-2.1` — venue identity, authorized persistence and lifecycle-history foundation — **REVIEW_PENDING**;
2. `WP-2.2` — spaces, capacity and member ratings/preferences — **PLANNED**;
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

### Durable cursor

- Current Lot: **2 — Venues core**
- Lot state: **IN_PROGRESS**
- Current branch: **`lot-2/venues-core`**
- Current packet: **WP-2.1**
- Packet state: **REVIEW_PENDING**
- Current pass: **B-ADVERSARIAL-REVIEW**
- Accepted packets: **none yet**
- Review-failed/blocked packets: **none**
- Open packet BLOCKING/MAJOR findings: **Pass B in progress; none waived or closed yet**
- Latest exact implementation verification: run `34034349485`, **5/5 SUCCESS** on Pass-A head `00144dfb70b901fb7c05f2d71ad032a68b2a16bd`, including clean-checkout `npm run verify`.
- Next permitted action: **perform WP-2.1 Pass B adversarial review only; do not start WP-2.2 concurrently.**

## Known localized specification repairs

These are recorded stop-conditions for the owning later packets, not permission to invent behavior and not blockers for WP-2.1:

- before WP-2.4 implements `fact_observations`, reconcile the normative distinction between `evidence_level` and the separate `confidence = high|medium|low|unknown` field;
- before WP-2.5 implements `evidenceReadiness`, document its deterministic formula in `domain/CRITERIA-EVALUATION.md`;
- before WP-2.8 relies on the security reading graph, repair the missing `docs/security/STORAGE-RLS.md` reference using the already frozen Storage/RLS rules and tested Lot-1 policies.

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

## Current blockers / forward maintenance

Open Lot 2 packet findings:

- WP-2.1 Pass B adversarial review is active; findings are recorded in the packet record before remediation/acceptance.

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
Current packet: WP-2.1
Packet state: REVIEW_PENDING
Current pass: B-ADVERSARIAL-REVIEW
Pass-A exact implementation head: 00144dfb70b901fb7c05f2d71ad032a68b2a16bd
Pass-A CI: 34034349485 — 5/5 SUCCESS, clean-checkout verify PASS
Accepted Lot 2 packets: none
Open BLOCKING/MAJOR: Pass B in progress; see WP-2.1 record
Next: perform WP-2.1 Pass B only
Lots 3–12: NOT_STARTED
```
