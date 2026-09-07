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

## Lot 0 / Lot 1 closure

- Lot 0: WP-0.1..0.6 **ACCEPTED**, responsibility gap **∅**, Integration Pass **PASS**, accepted branch head `3dccc801a38929c6dfda7ecb06626d9c5143ec76`.
- Lot 1: WP-1.1..1.9 **ACCEPTED**, responsibility gap **∅**, Integration Pass **PASS**, `LOT1-IP-001` CLOSED. Integration run `34026968380` 5/5; final pre-promotion head `c27021fe739b52811e5c219439a0c5c7e8db8049`.

## Lot 2 — Venues core

Coverage/work-packet plan: `lot-2/LOT-2-COVERAGE-MATRIX.md`.

Required current-lot responsibilities minus assigned packet responsibilities: **∅**.

| Packet | Responsibility | State |
|---|---|---|
| WP-2.1 | venue identity, authorized persistence, lifecycle history | **ACCEPTED** |
| WP-2.2 | spaces, capacity, member ratings/preferences | **ACCEPTED** |
| WP-2.3 | fact definitions, typed retained facts, value validation | **ACCEPTED** |
| WP-2.4 | observations, sources, evidence/confidence/freshness, conflicts | **ACCEPTED** |
| WP-2.5 | deterministic criteria, blockers, score/readiness, missing information | **IN_PROGRESS — A-IMPLEMENT** |
| WP-2.6 | offers, availability, contacts/interactions basics | PLANNED |
| WP-2.7 | contextual venue access-route observations | PLANNED |
| WP-2.8 | venue media/photo foundation and media safety | PLANNED |
| WP-2.9 | venue document/tag/link basics | PLANNED |
| WP-2.10 | repositories, local cache, pending/offline mutations | PLANNED |
| WP-2.11 | gallery/table/detail/compare/deep-link workspace | PLANNED |
| WP-2.12 | mobile/offline venue-visit workflow and packet E2E completion | PLANNED |

Accepted packet evidence:

- WP-2.1 ACCEPTED; findings `WP2.1-B-001..008` resolved; CI `34039296392` and governance `34040803267` 5/5.
- WP-2.2 ACCEPTED; `WP2.2-B-001` resolved; CI `34046985956` and governance `34048565452` 5/5.
- WP-2.3 ACCEPTED; `WP2.3-B-001..008` resolved; final reviewed head `2e3194f7109eb30eee4e73ace7ecbdd329fd321c`, CI `34068703691` 5/5.
- WP-2.4 ACCEPTED; `WP2.4-B-001..008` resolved/verified; final fresh reviewed head `93262f9459e720d97a6dfa3a83f84f02f3a02c7c`, CI `34137822804` 5/5; Pass C responsibility gap **∅**.

## WP-2.4 — accepted packet closure

- Primary Feature: `FTR-020`.
- Dependency: **WP-2.3 ACCEPTED**.
- Evidence/confidence specification gate: **CLOSED** by `c414549d20338bf5180d5afc3681beda56fb11de`, CI `34069692843` 5/5.
- Historical Pass-A head/run: `9f3ca2fb57adf124e50bf8c4888280854c5d846f` / `34106264873` — **5/5 SUCCESS**.
- `WP2.4-B-001..WP2.4-B-008`: **RESOLVED / VERIFIED**.
- Final reviewed head/run `93262f9459e720d97a6dfa3a83f84f02f3a02c7c` / `34137822804`: **5/5 SUCCESS**. Core: 80 test files / 814 tests PASS at 100% measured statements/branches/functions/lines; DB/RLS: 35 files / 778 pgTAP tests PASS; Browser: 40/40 Playwright PASS across Chromium, Firefox, WebKit and mobile Chromium; mutation harness: 82.50%; privacy-safe preview and clean-checkout `npm run verify` PASS.
- Pass C: **PASS**. Required WP-2.4 responsibilities minus accepted/evidenced WP-2.4 responsibilities: **∅**.

## WP-2.5 — active Pass A

Packet record: `lot-2/WP-2.5.md`.

All pre-implementation specification gates are **CLOSED**:

- deterministic V1 `evidenceReadiness`: `5fd9be01f4da192d9d47b2d48944134fd15e471a`, CI `34143567491` — **5/5 SUCCESS**;
- exact `custom_manual_assessment.accepted` representation: same commit/run above;
- `WP2.5-S-001` dynamic `project_target_guest_count_supported` semantics: normative addendum `docs/domain/CRITERIA-EVALUATION-DYNAMIC-GUEST-COUNT-ADDENDUM.md`, commit `01136a7694141fd21c6067dcc4a1eb876e89080a`, CI `34146113235` — **5/5 SUCCESS**.

Frozen dynamic rule summary:

- Lot-2 target = `projects.target_guest_count`;
- authoritative couple-specific ceiling = same Venue's retained `two_dance_areas_max_guest_estimate`;
- `T <= M` PASS, `T > M` FAIL;
- null target / missing, unknown, not-applicable or invalid ceiling → UNKNOWN; unresolved ceiling conflict → CONFLICT;
- stale known ceiling preserves deterministic PASS/FAIL but readiness is not-ready and stale guidance is surfaced;
- no fallback to advertised capacity, per-space capacity, cocktail capacity or geometry heuristic;
- `target_guest_count_supported` is derived and must not be independently writable fact/evidence;
- later scenario callers may inject an explicit target without changing the formula or mutating historical project/fact truth.

Pass A implementation order:

1. harden TypeScript/PostgreSQL rule validation and derived-key write boundaries;
2. implement pure ordinary/dynamic criterion evaluation;
3. blocking aggregation, weighted score, readiness and deterministic explanations;
4. missing/stale/conflicting information guidance;
5. authorized Venue compatibility read-model port/adapter without persistent score authority;
6. full exact-head verification, then `REVIEW_PENDING` and fresh Pass B.

WP-2.6 must not start concurrently.

## Durable cursor

```text
Current Lot: 2 — Venues core
Lot State: IN_PROGRESS
Branch: lot-2/venues-core
Current Packet: WP-2.5
Packet State: IN_PROGRESS
Current Pass: A-IMPLEMENT
Last completed packet: WP-2.4 — ACCEPTED
Accepted packets: WP-2.1, WP-2.2, WP-2.3, WP-2.4
Closed WP-2.5 specification gates: evidenceReadiness; custom_manual_assessment.accepted; WP2.5-S-001
WP-2.5 specification gate head/run: 01136a7694141fd21c6067dcc4a1eb876e89080a / 34146113235 — 5/5 SUCCESS
Open WP-2.5 BLOCKING/MAJOR finding: none at Pass-A entry
Next permitted action: implement WP-2.5 Pass A only, beginning with canonical rule/derived-data boundaries and pure deterministic evaluation. Do not start WP-2.6 concurrently.
```

## Known localized specification repairs / stop-conditions

- WP-2.4 evidence/confidence gate: **CLOSED** (`c414549d...`, CI `34069692843`).
- WP-2.5 deterministic `evidenceReadiness` formula: **CLOSED** (`5fd9be01...`, CI `34143567491`).
- WP-2.5 `custom_manual_assessment.accepted` representation: **CLOSED** (`5fd9be01...`, CI `34143567491`).
- WP-2.5 `project_target_guest_count_supported` deterministic semantics / `WP2.5-S-001`: **CLOSED** (`01136a76...`, CI `34146113235`).
- Before WP-2.8 relies on the security reading graph, repair the missing `docs/security/STORAGE-RLS.md` reference using already frozen/tested Storage authorization semantics.
- Venue lifecycle documentation conflict from WP-2.1 is closed by `docs/domain/STATE-MACHINES-VENUE-LIFECYCLE-ADDENDUM.md`.

## Feature lifecycle notes

- V1 Feature inventory: 120 Feature IDs across both ledgers.
- Lot-2 primary IDs: `FTR-013..FTR-028`; partial cross-lot responsibilities also include `FTR-012`, `FTR-089`, `FTR-092`, `FTR-093` and cross-cutting access/offline/security obligations.
- Feature-level whole-capability status is not conflated with packet/current-lot responsibility; Lot Coverage Matrices remain the durable responsibility-level reconciliation source.
- WP-2.4 packet responsibility for `FTR-020` is **ACCEPTED**.
- WP-2.5 is **IN_PROGRESS / A-IMPLEMENT**; no FTR-021/FTR-022 implementation completion is claimed until Pass A verification, fresh Pass B and Pass C succeed.

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
Accepted Lot-2 packets: WP-2.1, WP-2.2, WP-2.3, WP-2.4
Last completed packet: WP-2.4 — ACCEPTED / COMPLETE
Current packet: WP-2.5 — IN_PROGRESS / A-IMPLEMENT
WP-2.5 closed specification gates: evidenceReadiness; custom_manual_assessment.accepted; WP2.5-S-001
WP-2.5 specification head/run: 01136a7694141fd21c6067dcc4a1eb876e89080a / 34146113235 — 5/5 SUCCESS
Next permitted action: WP-2.5 Pass A only; WP-2.6 remains prohibited concurrently.
Lots 3–12: NOT_STARTED
```
