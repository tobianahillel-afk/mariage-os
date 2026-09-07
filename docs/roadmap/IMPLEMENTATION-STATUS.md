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
| WP-2.5 | deterministic criteria, blockers, score/readiness, missing information | **BLOCKED — `WP2.5-S-001`** |
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
- `WP2.4-B-001` MAJOR — legacy retained setter write-around: **RESOLVED / VERIFIED**.
- `WP2.4-B-002` MAJOR — definition edits invalidating persisted evidence: **RESOLVED / VERIFIED**.
- Verified first-remediation head/run: `5e229cada52c9b50ca3b2b820df3ab8291c2960c` / `34110071790` — **5/5 SUCCESS**.
- `WP2.4-B-003` MAJOR — source/conflict ECMAScript whitespace parity: **RESOLVED / VERIFIED**; head/run `527bdeff7840f244d749cd92a81d1eda3fc89017` / `34111887666` — **5/5 SUCCESS**.
- `WP2.4-B-004` MAJOR — fact-definition ECMAScript whitespace parity: **RESOLVED / VERIFIED**.
- `WP2.4-B-005` MAJOR — timestamp microsecond/non-finite parity: **RESOLVED / VERIFIED**.
- Verified B-004/B-005 remediation head/run: `d4d3ce84331d13809b5f7b97ed7bf1a263a2bf4a` / `34119950023` — **5/5 SUCCESS**.
- `WP2.4-B-006` MAJOR — strict timestamp calendar/year-domain parity: **RESOLVED / VERIFIED**; head/run `06c38444a2e859f59f590477bd43c40255463f3e` / `34131416659` — **5/5 SUCCESS**.
- `WP2.4-B-007` MAJOR — raw RPC timestamp grammar bypass through PostgreSQL `timestamptz` coercion: **RESOLVED / VERIFIED**; head/run `92e0f511d394448ccdcdd3143d29b4f2cf3df987` / `34134876299` — **5/5 SUCCESS**.
- `WP2.4-B-008` MAJOR — observation/source link `isPrimary` parity: **RESOLVED / VERIFIED**; head/run `4b161f4120cf554395badcc5b05cac79eb018e70` / `34137075923` — **5/5 SUCCESS**.

Final fresh independent Pass B after B-008: **PASS**. It reconstructed the packet from frozen Facts/provenance, authorization, canonical instant and acceptance contracts; re-attacked append/supersession/withdrawal, retained resolution, source revision/update, evidence/confidence/freshness/state independence, direct table/RLS/RPC authorization, TS↔DB canonicality and internal-core privileges; and rechecked `ACC-015`, `ACC-025..027`. No unresolved BLOCKING/MAJOR remains.

Final reviewed head/run `93262f9459e720d97a6dfa3a83f84f02f3a02c7c` / `34137822804`: **5/5 SUCCESS**. Core: 80 test files / 814 tests PASS at 100% measured statements/branches/functions/lines; DB/RLS: 35 files / 778 pgTAP tests PASS; Browser: 40/40 Playwright PASS across Chromium, Firefox, WebKit and mobile Chromium; mutation harness: 82.50%; privacy-safe preview and clean-checkout `npm run verify` PASS.

Pass C: **PASS**. `FAC-002`, WP-2.4 portion of `FAC-003`, `FAC-004..009`, `ACC-015`, `ACC-025..027`, applicable authorization/RLS duties and packet scope fences were mechanically reconciled EXPECTED → IMPLEMENTED → VERIFIED. Required WP-2.4 responsibilities minus accepted/evidenced WP-2.4 responsibilities: **∅**.

## WP-2.5 — pre-implementation specification state

Packet record: `lot-2/WP-2.5.md`.

Two previously recorded stop-conditions are now **CLOSED** by `5fd9be01f4da192d9d47b2d48944134fd15e471a`; exact-head CI `34143567491`: **5/5 SUCCESS**.

- deterministic V1 `evidenceReadiness`: **CLOSED** — unweighted readiness ratio over applicable `blocking|important` criteria, with explicit active-retained-evidence/freshness/configuration conditions and no evidence-level/confidence pseudo-weighting;
- `custom_manual_assessment.accepted`: **CLOSED** — exact canonical acceptable value for boolean/select/rating, with TypeScript↔PostgreSQL parity required during Pass A.

Open pre-implementation finding:

- `WP2.5-S-001` **BLOCKING** — `project_target_guest_count_supported` has no frozen authoritative support/capacity input or derivation formula. The repository distinguishes commercial advertised capacity, per-space capacities, couple-specific two-dance-area maximum estimate and the dynamic target-support criterion, while requiring commercial capacity and couple suitability to remain distinct. No contract defines the composition/precedence, unknown/conflict/stale behavior, null target behavior or persistence/derived semantics. Choosing one would materially change a blocking Venue decision.

While `WP2.5-S-001` is open, Pass A must not silently derive target support from advertised capacity, maximum venue-space capacity, the two-dance-area estimate, a permanently retained boolean, or an undocumented fallback/precedence. WP-2.6 must not start concurrently.

Resolution condition: freeze the dynamic rule's authoritative inputs and exact state behavior in a governing criteria/domain contract, preserve commercial-capacity vs couple-suitability separation and derived-data invariant 27, define project-target change behavior without pre-implementing Lot-5 scenarios, add deterministic dependency/boundary test requirements, obtain exact-head full CI, then move WP-2.5 `BLOCKED → READY`.

## Durable cursor

```text
Current Lot: 2 — Venues core
Lot State: IN_PROGRESS
Branch: lot-2/venues-core
Current Packet: WP-2.5
Packet State: BLOCKED
Current Pass: PLAN
Last completed packet: WP-2.4 — ACCEPTED
Accepted packets: WP-2.1, WP-2.2, WP-2.3, WP-2.4
Closed WP-2.5 specification gates: evidenceReadiness; custom_manual_assessment.accepted
Open WP-2.5 BLOCKING finding: WP2.5-S-001 — project_target_guest_count_supported semantics under-specified
Last green WP-2.5 specification head/run: 5fd9be01f4da192d9d47b2d48944134fd15e471a / 34143567491 — 5/5 SUCCESS
Next permitted action: resolve WP2.5-S-001 in the governing criteria/domain contract, obtain exact-head full CI, then transition WP-2.5 to READY. Do not begin Pass A or WP-2.6 concurrently.
```

## Known localized specification repairs / stop-conditions

- WP-2.4 evidence/confidence gate: **CLOSED** (`c414549d...`, CI `34069692843`).
- WP-2.5 deterministic `evidenceReadiness` formula: **CLOSED** (`5fd9be01...`, CI `34143567491`).
- WP-2.5 `custom_manual_assessment.accepted` representation: **CLOSED** (`5fd9be01...`, CI `34143567491`).
- WP-2.5 `project_target_guest_count_supported` deterministic semantics: **OPEN / BLOCKING — `WP2.5-S-001`**.
- Before WP-2.8 relies on the security reading graph, repair the missing `docs/security/STORAGE-RLS.md` reference using already frozen/tested Storage authorization semantics.
- Venue lifecycle documentation conflict from WP-2.1 is closed by `docs/domain/STATE-MACHINES-VENUE-LIFECYCLE-ADDENDUM.md`.

## Feature lifecycle notes

- V1 Feature inventory: 120 Feature IDs across both ledgers.
- Lot-2 primary IDs: `FTR-013..FTR-028`; partial cross-lot responsibilities also include `FTR-012`, `FTR-089`, `FTR-092`, `FTR-093` and cross-cutting access/offline/security obligations.
- Feature-level whole-capability status is not conflated with packet/current-lot responsibility; Lot Coverage Matrices remain the durable responsibility-level reconciliation source.
- WP-2.4 packet responsibility for `FTR-020` is **ACCEPTED**. This does not claim downstream WP-2.5 criteria/readiness, UI, offline/import, Vendor or real-data completion.
- WP-2.5 remains **BLOCKED before Pass A**; no FTR-021/FTR-022 implementation completion is claimed from the specification work alone.

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
Current packet: WP-2.5 — BLOCKED / PLAN
WP-2.5 closed specification gates: evidenceReadiness; custom_manual_assessment.accepted
WP-2.5 open BLOCKING: WP2.5-S-001 — dynamic project-target guest-count support semantics
WP-2.5 last green specification head/run: 5fd9be01f4da192d9d47b2d48944134fd15e471a / 34143567491 — 5/5 SUCCESS
Next permitted action: resolve WP2.5-S-001 specification only; then exact-head CI and BLOCKED → READY. Pass A and WP-2.6 remain prohibited until then.
Lots 3–12: NOT_STARTED
```
