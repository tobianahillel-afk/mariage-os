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

Coverage: `lot-0/LOT-0-COVERAGE-MATRIX.md`.

- WP-0.1 through WP-0.6: **ACCEPTED**.
- Required Lot-0 responsibilities minus accepted/evidenced responsibilities: **∅**.
- Lot Integration Pass: **PASS**.
- Accepted branch head: `3dccc801a38929c6dfda7ecb06626d9c5143ec76`.

### Lot 1

Coverage: `lot-1/LOT-1-COVERAGE-MATRIX.md`.
Integration: `lot-1/LOT-1-INTEGRATION-PASS.md`.

- WP-1.1 through WP-1.9: **ACCEPTED**.
- Required current-lot responsibilities minus assigned packet responsibilities: **∅**.
- Required current-lot responsibilities minus accepted/evidenced responsibilities after Integration Pass: **∅**.
- Lot Integration Pass: **PASS**; `LOT1-IP-001` CLOSED; no open integration finding.
- Integration run `34026968380` on `c7594e6cd15e33602411b810aad7f89ee732ba57`: **5/5 SUCCESS**, DB 15 files / 294 tests PASS, Playwright 40/40 PASS.
- Final pre-promotion head `c27021fe739b52811e5c219439a0c5c7e8db8049`; exact-head run `34027354049` SUCCESS.
- Promotion: PR #7 / `f6da05626f024431230ae46ca1ec8a4becc72a1f`; CI `34030211097` 5/5 SUCCESS.

## Lot 2 — Venues core

Coverage/work-packet plan: `lot-2/LOT-2-COVERAGE-MATRIX.md`.

Required current-lot responsibilities minus assigned packet responsibilities: **∅**.

| Packet | Responsibility | State |
|---|---|---|
| WP-2.1 | venue identity, authorized persistence, lifecycle history | **ACCEPTED** |
| WP-2.2 | spaces, capacity, member ratings/preferences | **ACCEPTED** |
| WP-2.3 | fact definitions, typed retained facts, value validation | **ACCEPTED** |
| WP-2.4 | observations, sources, evidence/confidence/freshness, conflicts | **IN_PROGRESS / B-REMEDIATION** |
| WP-2.5 | deterministic criteria, blockers, score/readiness, missing information | PLANNED |
| WP-2.6 | offers, availability, contacts/interactions basics | PLANNED |
| WP-2.7 | contextual venue access-route observations | PLANNED |
| WP-2.8 | venue media/photo foundation and media safety | PLANNED |
| WP-2.9 | venue document/tag/link basics | PLANNED |
| WP-2.10 | repositories, local cache, pending/offline mutations | PLANNED |
| WP-2.11 | gallery/table/detail/compare/deep-link workspace | PLANNED |
| WP-2.12 | mobile/offline venue-visit workflow and packet E2E completion | PLANNED |

### Accepted packet evidence

**WP-2.1** (`lot-2/WP-2.1.md`)

- Responsibility gap: **∅**.
- Pass B findings `WP2.1-B-001..008`: RESOLVED; fresh Pass B PASS; Pass C PASS.
- Reviewed head `3418659d94d35f61183f0a20c367c74e38e86802`, CI `34039296392`: **5/5 SUCCESS**.
- Unit 39 files / 350 tests, 100% measured coverage; DB/RLS 17 files / 359 pgTAP; Playwright 40/40; preview and clean verify PASS.
- Governance run `34040803267` on `3304840ac94dbae2e0ebb79bdc0b57cdedb4943c`: 5/5 SUCCESS.

**WP-2.2** (`lot-2/WP-2.2.md`)

- Responsibility gap: **∅**.
- `WP2.2-B-001`: RESOLVED; fresh Pass B PASS; Pass C PASS.
- Reviewed head `241daa01e069a6cbaec4d0ebc09ddf5ca982a385`, CI `34046985956`: **5/5 SUCCESS**.
- Unit 47 files / 473 tests, 100% measured coverage; DB/RLS 20 files / 442 pgTAP; Playwright 40/40; preview and clean verify PASS.
- Governance run `34048565452` on `480b0bcc168d7789bf2bee07a75c8f04200f5cb7`: 5/5 SUCCESS.
- Non-blocking: simultaneous first-create member-opinion attempts may surface uniqueness instead of normalized stale/conflict; no overwrite/impersonation/data loss.

**WP-2.3** (`lot-2/WP-2.3.md`)

- Responsibility gap: **∅**.
- Findings `WP2.3-B-001..008`: all RESOLVED; fresh independent Pass B PASS; Pass C PASS.
- Final reviewed head `2e3194f7109eb30eee4e73ace7ecbdd329fd321c`, CI `34068703691`: **5/5 SUCCESS**.
- Unit 62 files / 707 tests, 100% coverage; DB/RLS 26 files / 575 pgTAP; Playwright 40/40; mutation, preview, clean verify PASS.
- Scope fence preserved: no observation/source, criteria execution/readiness, UI, offline, import/export or Vendor completion claimed.

## WP-2.4 — current packet

Record: `lot-2/WP-2.4.md`.

### Frozen/specification gate

- Primary Feature: `FTR-020`.
- Dependency: **WP-2.3 ACCEPTED**.
- Evidence-level versus independent-confidence stop-condition: **CLOSED** by `c414549d20338bf5180d5afc3681beda56fb11de`.
- Specification-gate CI `34069692843`: **5/5 SUCCESS**.

### Historical Pass A

- Reviewed implementation head: `9f3ca2fb57adf124e50bf8c4888280854c5d846f`.
- CI `34106264873`: **5/5 SUCCESS**, including clean-checkout `npm run verify`.
- Unit: 79 files / 807 tests, **100% statements/branches/functions/lines**.
- DB/RLS: 29 files / 664 pgTAP.
- Browser: 40/40 Playwright; mutation 82.50% PASS; preview PASS.

Fresh Pass B invalidated this acceptance evidence with two MAJOR findings recorded at `3f6a750a97ca039c36dafd3dff5eca69eac683ad`:

- `WP2.4-B-001`: legacy `set_retained_venue_fact` can write around observation-backed resolution after evidence exists and clear resolution provenance.
- `WP2.4-B-002`: fact-definition edits can invalidate persisted observation values or WP-2.4 conflict-retained typed truth.

### Remediation in progress

- State/pass: **IN_PROGRESS / B-REMEDIATION**.
- Remediation implementation baseline: `06c7d1bf92239db22af14303d008c449387ca6ea`.
- Migration: `20260907101500_harden_venue_fact_evidence_review.sql`.
- Regression: `venue_fact_evidence_adversarial_review_test.sql`.
- B-001 remediation: legacy core setter is client-inaccessible; public setter rejects direct `known` write-around once observations exist while preserving pre-evidence WP-2.3 behavior; fact locking serializes append/direct-set race.
- B-002 remediation: definition mutation validates every non-null retained value and every non-null persisted observation value against proposed definition semantics.
- Intermediate remediation run `34109732455` on `06c7d1bf...`: Core quality/security already **SUCCESS**; this run is diagnostic only because governance commits create a newer final remediation head.
- Findings remain **REMEDIATING**, not RESOLVED, until final exact-head CI is fully green and a fresh independent re-review re-attacks both boundaries.
- Pass C: **NOT_STARTED**.

## Durable cursor

```text
Current Lot: 2 — Venues core
Lot State: IN_PROGRESS
Branch: lot-2/venues-core
Current Packet: WP-2.4
Packet State: IN_PROGRESS
Current Pass: B-REMEDIATION
Last completed packet: WP-2.3 — ACCEPTED
Accepted packets: WP-2.1, WP-2.2, WP-2.3
Review-failed history: WP-2.4 fresh Pass B at 3f6a750a97ca039c36dafd3dff5eca69eac683ad
Open findings under remediation: WP2.4-B-001, WP2.4-B-002
Next permitted action: finish WP-2.4 remediation verification only; then REVIEW_PENDING + fresh independent Pass B. Do not start WP-2.5 concurrently.
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
- `FTR-013`, `FTR-014`, `FTR-018`, `FTR-019`, `FTR-020`, `FTR-023` and relevant spanning features remain feature-level IN_PROGRESS until their remaining Lot-2/integration responsibilities elapse.

## Forward maintenance

- Dependency audit continues to report two Moderate transitive development-tool advisories; accepted-known Critical/High count remains zero under the normative gate.
- Dependency audit uses `npm audit` primary with exact-lockfile GitHub Advisory fallback only after bounded transient provider failure; dual-provider failure remains fail-closed.
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
Current state/pass: IN_PROGRESS / B-REMEDIATION
WP-2.4 historical Pass-A head/run: 9f3ca2fb57adf124e50bf8c4888280854c5d846f / 34106264873 — 5/5 SUCCESS, invalidated for acceptance by fresh Pass B
WP-2.4 review-failure record: 3f6a750a97ca039c36dafd3dff5eca69eac683ad
WP-2.4 remediation baseline: 06c7d1bf92239db22af14303d008c449387ca6ea
Open MAJOR findings under remediation: WP2.4-B-001, WP2.4-B-002
Next: exact-head remediation verification -> REVIEW_PENDING -> fresh independent Pass B. WP-2.5 remains PLANNED.
Lots 3–12: NOT_STARTED
```
