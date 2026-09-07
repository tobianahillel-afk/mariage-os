# Mariage OS — Implementation Status Board

Status: **Living repository source of truth for development progress**

## Current phase

- V1 documentation/design: **COMPLETE / FROZEN**.
- Guest RSVP + Email/SMS/WhatsApp scope: **MERGED / FROZEN**.
- AI Lot Orchestration governance: **MERGED / FROZEN**.
- Final Design Review: **PASS**.
- Implementation gate: **OPEN**.
- Lot 0: **ACCEPTED** — completed 2026-09-03.
- Lot 1: **ACCEPTED** — completed 2026-09-06.
- Lot 2: **IN_PROGRESS — Venues core**.
- Lots 3–12: **NOT_STARTED**.

`main` integration truth after accepted Lot 0 + Lot 1 promotion is `f6da05626f024431230ae46ca1ec8a4becc72a1f` (PR #7). Promotion CI `34030211097`: **5/5 SUCCESS**, including clean-checkout `npm run verify`.

## Closed foundations

### Lot 0

- WP-0.1 through WP-0.6: **ACCEPTED**.
- Required Lot-0 responsibilities minus accepted/evidenced responsibilities: **∅**.
- Lot Integration Pass: **PASS**.
- Accepted branch head: `3dccc801a38929c6dfda7ecb06626d9c5143ec76`.

### Lot 1

- WP-1.1 through WP-1.9: **ACCEPTED**.
- Required current-lot responsibilities minus accepted/evidenced responsibilities after Integration Pass: **∅**.
- Lot Integration Pass: **PASS**; `LOT1-IP-001` CLOSED; no open integration finding.
- Integration run `34026968380` on `c7594e6cd15e33602411b810aad7f89ee732ba57`: **5/5 SUCCESS**, DB 15 files / 294 tests PASS, Playwright 40/40 PASS.
- Final pre-promotion head `c27021fe739b52811e5c219439a0c5c7e8db8049`; promotion PR #7 merged to main.

## Lot 2 — Venues core

Coverage/work-packet plan: `lot-2/LOT-2-COVERAGE-MATRIX.md`.

Required current-lot responsibilities minus assigned packet responsibilities: **∅**.

| Packet | Responsibility | State |
|---|---|---|
| WP-2.1 | venue identity, authorized persistence, lifecycle history | **ACCEPTED** |
| WP-2.2 | spaces, capacity, member ratings/preferences | **ACCEPTED** |
| WP-2.3 | fact definitions, typed retained facts, value validation | **ACCEPTED** |
| WP-2.4 | observations, sources, evidence/confidence/freshness, conflicts | **REVIEW_PENDING / B-ADVERSARIAL-REVIEW** |
| WP-2.5 | deterministic criteria, blockers, score/readiness, missing information | PLANNED |
| WP-2.6 | offers, availability, contacts/interactions basics | PLANNED |
| WP-2.7 | contextual venue access-route observations | PLANNED |
| WP-2.8 | venue media/photo foundation and media safety | PLANNED |
| WP-2.9 | venue document/tag/link basics | PLANNED |
| WP-2.10 | repositories, local cache, pending/offline mutations | PLANNED |
| WP-2.11 | gallery/table/detail/compare/deep-link workspace | PLANNED |
| WP-2.12 | mobile/offline venue-visit workflow and packet E2E completion | PLANNED |

### Accepted packet evidence

**WP-2.1** — ACCEPTED. Responsibility gap ∅; findings `WP2.1-B-001..008` resolved; fresh Pass B and Pass C PASS. Reviewed CI `34039296392` 5/5; governance CI `34040803267` 5/5.

**WP-2.2** — ACCEPTED. Responsibility gap ∅; `WP2.2-B-001` resolved; fresh Pass B and Pass C PASS. Reviewed CI `34046985956` 5/5; governance CI `34048565452` 5/5.

**WP-2.3** — ACCEPTED. Responsibility gap ∅; `WP2.3-B-001..008` resolved; fresh independent Pass B and Pass C PASS. Final reviewed head `2e3194f7109eb30eee4e73ace7ecbdd329fd321c`; CI `34068703691` 5/5.

## WP-2.4 — current packet

Record: `lot-2/WP-2.4.md`.

### Frozen/specification gate

- Primary Feature: `FTR-020`.
- Dependency: **WP-2.3 ACCEPTED**.
- Evidence-level versus independent-confidence stop-condition: **CLOSED** by `c414549d20338bf5180d5afc3681beda56fb11de`.
- Specification-gate CI `34069692843`: **5/5 SUCCESS**.

### Historical Pass A and first Pass B

- Historical Pass-A implementation head `9f3ca2fb57adf124e50bf8c4888280854c5d846f`; CI `34106264873`: **5/5 SUCCESS**.
- Historical metrics: 79 unit-test files / 807 tests PASS, 100% measured statements/branches/functions/lines; DB/RLS 29 files / 664 pgTAP; Playwright 40/40; mutation and preview gates PASS.
- Fresh Pass B then found two MAJOR defects, recorded at `3f6a750a97ca039c36dafd3dff5eca69eac683ad`:
  - `WP2.4-B-001`: legacy `set_retained_venue_fact` could bypass observation-backed retained resolution after evidence existed;
  - `WP2.4-B-002`: definition edits could invalidate persisted observation values or conflict-retained typed truth.

### Verified remediation

- Remediation implementation baseline: `06c7d1bf92239db22af14303d008c449387ca6ea`.
- Hardening migration: `20260907101500_harden_venue_fact_evidence_review.sql`.
- Adversarial regression: `venue_fact_evidence_adversarial_review_test.sql`.
- B-001: internal legacy core setter has client EXECUTE revoked; public wrapper rejects direct `known` writes once observations exist and locks the fact before the evidence check, preserving pre-evidence WP-2.3 behavior while closing the observed write-around/race.
- B-002: definition mutation now validates every non-null retained value and every non-null persisted observation value against proposed definition semantics.
- Final remediation/governance head: `5e229cada52c9b50ca3b2b820df3ab8291c2960c`.
- Exact-head CI run `34110071790`: **5/5 SUCCESS**:
  - Core quality/security SUCCESS — 79 files / 807 tests PASS; 100% measured coverage; static/security/dependency/build gates PASS;
  - Local Supabase DB/RLS SUCCESS, including adversarial remediation pgTAP;
  - Browser/mutation SUCCESS;
  - privacy-safe preview SUCCESS;
  - clean-checkout `npm run verify` SUCCESS.
- Dependency audit still reports only the two previously reviewed Moderate transitive development-tool advisories; no accepted-known Critical/High.

The packet has therefore left remediation and is now **REVIEW_PENDING**. The original findings have verified fixes but are not finally closed until the fresh independent re-review re-attacks them and finds no bypass.

## Durable cursor

```text
Current Lot: 2 — Venues core
Lot State: IN_PROGRESS
Branch: lot-2/venues-core
Current Packet: WP-2.4
Packet State: REVIEW_PENDING
Current Pass: B-ADVERSARIAL-REVIEW
Last completed packet: WP-2.3 — ACCEPTED
Accepted packets: WP-2.1, WP-2.2, WP-2.3
First review-failure history: WP-2.4 at 3f6a750a97ca039c36dafd3dff5eca69eac683ad
Original MAJOR findings: WP2.4-B-001, WP2.4-B-002 — remediation verified; fresh re-review pending
Verified remediation head/run: 5e229cada52c9b50ca3b2b820df3ab8291c2960c / 34110071790 — 5/5 SUCCESS
Next permitted action: fresh independent WP-2.4 Pass B only. Do not start WP-2.5 concurrently.
```

## Known localized specification repairs / stop-conditions

- WP-2.4 evidence/confidence gate: **CLOSED** (`c414549d...`, CI `34069692843`).
- Before WP-2.5 implements `evidenceReadiness`, document its deterministic formula in `domain/CRITERIA-EVALUATION.md`.
- Before WP-2.5 executes/seeds `custom_manual_assessment`, freeze exact acceptable-value representation for supported boolean/select/rating cases.
- Before WP-2.8 relies on the security reading graph, repair the missing `docs/security/STORAGE-RLS.md` reference using already frozen Storage/RLS rules and tested Lot-1 policies.
- Venue lifecycle documentation conflict from WP-2.1 is closed by `docs/domain/STATE-MACHINES-VENUE-LIFECYCLE-ADDENDUM.md`.

## Feature lifecycle notes

- V1 Feature inventory: 120 Feature IDs across both ledgers.
- Lot-2 primary IDs: `FTR-013..FTR-028`; partial cross-lot responsibilities also include `FTR-012`, `FTR-089`, `FTR-092`, `FTR-093` and cross-cutting access/offline/security obligations.
- Feature-level whole-capability status is not conflated with packet/current-lot responsibility; Lot Coverage Matrices remain the durable responsibility-level reconciliation source.
- `FTR-020` remains feature-level **IN_PROGRESS** while WP-2.4 is under fresh adversarial re-review.

## Forward maintenance

- Dependency audit continues to report two Moderate transitive development-tool advisories; accepted-known Critical/High count remains zero under the normative gate.
- External container registry rate limiting may be retried but cannot skip DB/RLS verification.
- Provider signup-window behavior and invitation abuse/rate-limit evidence remain downstream onboarding/cutover requirements.
- Browser device-identity recovery after selective localStorage/IndexedDB divergence remains later local/session hardening.
- Root `README.md` still contains historical pre-Lot-0 wording; reconcile during Lot-2 governance cleanup without overriding this board.

## Lot status

| Lot | State |
|---:|---|
| 0 | **ACCEPTED** |
| 1 | **ACCEPTED** |
| 2 | **IN_PROGRESS** |
| 3–12 | NOT_STARTED |

## Handoff

```text
main integration truth: f6da05626f024431230ae46ca1ec8a4becc72a1f
Lot 0: ACCEPTED
Lot 1: ACCEPTED
Lot 2: IN_PROGRESS
Lot 2 branch: lot-2/venues-core
Accepted Lot-2 packets: WP-2.1, WP-2.2, WP-2.3
Current packet: WP-2.4
Current state/pass: REVIEW_PENDING / B-ADVERSARIAL-REVIEW
WP-2.4 historical Pass-A: 9f3ca2fb57adf124e50bf8c4888280854c5d846f / 34106264873 — 5/5 SUCCESS
WP-2.4 first review failure: 3f6a750a97ca039c36dafd3dff5eca69eac683ad
WP-2.4 verified remediation: 5e229cada52c9b50ca3b2b820df3ab8291c2960c / 34110071790 — 5/5 SUCCESS
Original MAJOR findings: WP2.4-B-001, WP2.4-B-002 — remediation verified, fresh re-review pending
Next: fresh independent WP-2.4 Pass B. WP-2.5 remains PLANNED.
Lots 3–12: NOT_STARTED
```
