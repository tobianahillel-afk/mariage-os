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
| WP-2.5 | deterministic criteria, blockers, score/readiness, missing information | **ACCEPTED** |
| WP-2.6A | Venue offers and offer components | **ACCEPTANCE_PENDING — C-ACCEPTANCE** |
| WP-2.6B | Venue availability observations | PLANNED |
| WP-2.6C | Venue contacts and interactions | PLANNED |
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
- WP-2.5 ACCEPTED; `WP2.5-B-001..004` resolved/verified; final fresh reviewed head `65410a3dc032208644911f29e79b70bd49e89277`, CI `34165826166` 5/5; Pass-C entry `931bac6a7145bc31a4bce24d4ea5cff354753ed4` / `34166488903` 5/5; final acceptance governance head `902ac6f56b84fed56da0113efc610617943e9449`, CI `34167062632` SUCCESS; responsibility gap **∅**.

## WP-2.4 — accepted packet closure

- Primary Feature: `FTR-020`.
- Dependency: **WP-2.3 ACCEPTED**.
- Evidence/confidence specification gate: **CLOSED** by `c414549d20338bf5180d5afc3681beda56fb11de`, CI `34069692843` 5/5.
- Historical Pass-A head/run: `9f3ca2fb57adf124e50bf8c4888280854c5d846f` / `34106264873` — **5/5 SUCCESS**.
- `WP2.4-B-001..WP2.4-B-008`: **RESOLVED / VERIFIED**.
- Final reviewed head/run `93262f9459e720d97a6dfa3a83f84f02f3a02c7c` / `34137822804`: **5/5 SUCCESS**. Core: 80 test files / 814 tests PASS at 100% measured statements/branches/functions/lines; DB/RLS: 35 files / 778 pgTAP tests PASS; Browser: 40/40 Playwright PASS across Chromium, Firefox, WebKit and mobile Chromium; mutation harness: 82.50%; privacy-safe preview and clean-checkout `npm run verify` PASS.
- Pass C: **PASS**. Required WP-2.4 responsibilities minus accepted/evidenced WP-2.4 responsibilities: **∅**.

## WP-2.5 — accepted packet closure

Packet record: `lot-2/WP-2.5.md`.

Specification gates:

- deterministic V1 `evidenceReadiness`: **CLOSED** by `5fd9be01f4da192d9d47b2d48944134fd15e471a`, CI `34143567491` — **5/5 SUCCESS**;
- exact `custom_manual_assessment.accepted` representation: **CLOSED** by the same commit/run;
- dynamic `project_target_guest_count_supported` semantics / `WP2.5-S-001`: **CLOSED** by `01136a7694141fd21c6067dcc4a1eb876e89080a`, CI `34146113235` — **5/5 SUCCESS**.

Pass A implementation:

- deterministic rule validation/evaluation, blocking aggregation, weighted score, readiness and guidance are implemented as pure domain/read-model behavior;
- project/venue compatibility service and authorized Supabase adapter load project-scoped inputs without persisting compatibility authority;
- migration `20260907181500_harden_venue_criteria_boundaries.sql` hardens canonical rule and system-derived write boundaries;
- verified implementation head/run `aef7bea53e9db32790ab19c3fffdd0a8f63dc89d` / `34158303997`: **5/5 SUCCESS**.

Fresh-review findings and remediations:

- `WP2.5-B-001` MAJOR — reconstructible target provenance/dynamic explanation: **RESOLVED / VERIFIED** on `68439bb0d152c60197fc8ae05f416300b3a81c35` / `34161773557` — **5/5 SUCCESS**;
- `WP2.5-B-002` MAJOR — duplicate retained-observation ownership across facts at provider boundary: **RESOLVED / VERIFIED** on the same head/run;
- `WP2.5-B-003` MAJOR — duplicate `fact.id` projected under multiple definitions: red-first `6e382a02de227306952199828479e442d507e710` / `34163182953` expected FAILURE; final remediation `3ce8ddf6e14a25efc71d928def52efe2314d72ba` / `34163426797` — **5/5 SUCCESS**;
- `WP2.5-B-004` MAJOR — reserved dynamic-rule parity missing on TypeScript update path: red-first `0d996515d5541cb6af1e9986bd6e833b8057fb32` / `34165097206` expected FAILURE; final remediation `589f82ca5735e9a27064697957bd3250c852c592` / `34165218864` — **5/5 SUCCESS**, including 94/94 test files, 926/926 tests and 100% statements/branches/functions/lines.

Final fresh independent Pass B:

- reviewed head/run `65410a3dc032208644911f29e79b70bd49e89277` / `34165826166` — **5/5 SUCCESS**;
- B-001 through B-004 remained effective;
- no unresolved BLOCKING/MAJOR mismatch remained against `FAC-006`, `FAC-008`, `FAC-010`, `FAC-011`, `FAC-013`, `VEN-007`, `VEN-010`, `VEN-011`, `ACC-022`, `ACC-023` or `ACC-028`;
- Pass B decision: **PASS**.

Pass C:

- entry head/run `931bac6a7145bc31a4bce24d4ea5cff354753ed4` / `34166488903` — **5/5 SUCCESS**;
- canonical criterion rules/evaluation, blockers/score, evidence readiness/guidance, dynamic guest-count rule, derived-data immutability, trusted project/venue provider boundary, TypeScript↔PostgreSQL reserved-rule parity and FIR-equivalent traceability reconciled EXPECTED → IMPLEMENTED → VERIFIED;
- requirements/acceptance reconciliation `FAC-006`, `FAC-008`, `FAC-010`, `FAC-011`, `FAC-013`, `VEN-007`, `VEN-010`, `VEN-011`, `ACC-022`, `ACC-023`, `ACC-028`, `SEC-VAL-001`, `SEC-VAL-008`, `SEC-VER-005`: **PASS** for WP-2.5-owned responsibility;
- required WP-2.5 responsibilities minus accepted/evidenced WP-2.5 responsibilities: **∅**;
- deferred ownership remains explicit: FTR-022 presentation/UI → WP-2.11; local/offline Venue integration → WP-2.10/2.12; automatic Task workflow → Lot 3; real default criteria/research data → Lot 12;
- Pass C decision: **PASS — WP-2.5 ACCEPTED**.

Final acceptance-governance head/run: `902ac6f56b84fed56da0113efc610617943e9449` / `34167062632` — **SUCCESS**.

## WP-2.6 — pre-implementation freeze and orchestration split

Parent product responsibility: Venue offers/date pricing/availability (`FTR-025`, `VEN-008`, `VEN-009`) plus Venue contacts/interactions (`FTR-026`).

Specification gates:

- base Venue-commercial workflow semantics frozen through `cf46c731bd45b77feaa514b22036096301280755`, exact CI `34170253114` — **5/5 SUCCESS**;
- canonical phone/WhatsApp and append-replay boundaries frozen by `docs/domain/VENUE-COMMERCIAL-WORKFLOW-BOUNDARY-ADDENDUM.md`, commit `6dce81a49ccdbb7bc9da54b2491a0c8746e12e50`, exact CI `34171320200` — **5/5 SUCCESS**;
- split/governance implementation-entry head `c99c4ac091bc21cb55a9b634710a3b7d694a7285`, exact CI `34171995654` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.

The original single WP-2.6 packet was rejected at sizing review before production code. Five new tables plus migration/RLS and multiple command surfaces exceeded the normative `>10` split threshold in `AI-LOT-ORCHESTRATION.md`, and no cross-domain atomicity/safety reason justified a mega-packet.

Implementation-only decomposition, with product scope unchanged:

- `WP-2.6A` — Venue offers + Venue-owned offer components — **ACCEPTANCE_PENDING / C-ACCEPTANCE**, estimated 10 points with explicit offer/component lifecycle cohesion rationale;
- `WP-2.6B` — append-oriented Venue availability observations — **PLANNED / PLAN**, estimated 9 points with evidence-history/replay cohesion rationale;
- `WP-2.6C` — Venue contacts + interactions — **PLANNED / PLAN**, estimated 10 points with same-Venue contact/interaction parent-integrity cohesion rationale. If actual privileged command count raises C above 10, split contacts/interactions before code.

Required original WP-2.6 responsibilities minus assigned A/B/C responsibilities: **∅**.

### WP-2.6A Pass A

- implementation head/run `e027bbbba93d73546ed19fffac7c26471f45ecb5` / `34223226316`: **5/5 SUCCESS**, including clean-checkout `npm run verify`;
- dedicated commercial pgTAP/RLS coverage proves offer lifecycle, stale writes, draft-only terms/components, quoted immutability, atomic quoted creation, same-project isolation and role/deny matrix;
- Pass-A hardening control `0149f0b1b77335228af9bf53379a47735c6ec9b6` / `34222772124`: expected DB FAILURE demonstrated that NULL creation status could be coerced to `draft`;
- forward-only migration hardening on `e027bbbba93d73546ed19fffac7c26471f45ecb5` rejects NULL before insertion while preserving all prior green proofs;
- unit coverage is 100% statements/branches/functions/lines on the verified implementation head;
- Pass A is complete.

### WP-2.6A Pass B

- findings `WP2.6A-B-001..006`: **RESOLVED / VERIFIED**;
- B-001 same-state lifecycle mismatch: red-first `509bc143...` / `34225335069`; verified remediation `177e8379...` / `34225597966` — **5/5 SUCCESS**;
- B-002 duplicate provider identities: red-first `e6397a44...` / `34226318216`; first fully green remediation head `d471b198...` / `34227416769` — **5/5 SUCCESS**;
- B-003 mutation receipt lifecycle-intent mismatch and B-004 source receipt identity substitution were exposed by red-first unit failures `ab5369ab...` / `34228042878` and `9ef4dc1f...` / `34228937549`; both remain fixed on the final reviewed head;
- B-005 exact `numeric(12,3)` quantity parity: red-first `905bcd36...` / `34229413676`; remediation `61aa9bf5...` / `34231035762` — **5/5 SUCCESS**;
- B-006 incomplete `quoted` SQL bypass: red-first `41db57cb...` / `34232111029`; forward-only trigger hardening plus lifecycle fixture alignment verified on `c7339227...` / `34233201350` — **5/5 SUCCESS**;
- final fresh reviewed head/run `c7339227126e0df6969809644b5d0eb2512d350c` / `34233201350`: **5/5 SUCCESS**, including clean-checkout `npm run verify`;
- no unresolved BLOCKING/MAJOR finding remains; Pass B decision **PASS**;
- WP-2.6B/C and WP-2.7 remain blocked until WP-2.6A Pass C completes.

## Durable cursor

```text
Current Lot: 2 — Venues core
Lot State: IN_PROGRESS
Branch: lot-2/venues-core
Current Packet: WP-2.6A
Packet State: ACCEPTANCE_PENDING
Current Pass: C-ACCEPTANCE
Last completed packet: WP-2.5 — ACCEPTED
Accepted packets: WP-2.1, WP-2.2, WP-2.3, WP-2.4, WP-2.5
Planned commercial subpackets: WP-2.6B, WP-2.6C
WP-2.6 base freeze head/run: cf46c731bd45b77feaa514b22036096301280755 / 34170253114 — 5/5 SUCCESS
WP-2.6 boundary freeze head/run: 6dce81a49ccdbb7bc9da54b2491a0c8746e12e50 / 34171320200 — 5/5 SUCCESS
WP-2.6A implementation-entry head/run: c99c4ac091bc21cb55a9b634710a3b7d694a7285 / 34171995654 — 5/5 SUCCESS
WP-2.6A verified Pass-A implementation head/run: e027bbbba93d73546ed19fffac7c26471f45ecb5 / 34223226316 — 5/5 SUCCESS
WP-2.6A final fresh Pass-B reviewed head/run: c7339227126e0df6969809644b5d0eb2512d350c / 34233201350 — 5/5 SUCCESS
WP-2.6A Pass-B findings: WP2.6A-B-001..006 — RESOLVED / VERIFIED
Open WP-2.6A BLOCKING/MAJOR findings: ∅
Next permitted action: verify the Pass-B governance transition on its exact HEAD, then execute WP-2.6A Pass C only. Do not start WP-2.6B/C or WP-2.7 concurrently.
```

## Known localized specification repairs / stop-conditions

- WP-2.4 evidence/confidence gate: **CLOSED** (`c414549d...`, CI `34069692843`).
- WP-2.5 deterministic `evidenceReadiness` formula: **CLOSED** (`5fd9be01...`, CI `34143567491`).
- WP-2.5 `custom_manual_assessment.accepted` representation: **CLOSED** (`5fd9be01...`, CI `34143567491`).
- WP-2.5 `project_target_guest_count_supported` deterministic semantics / `WP2.5-S-001`: **CLOSED** (`01136a76...`, CI `34146113235`).
- WP-2.5 `WP2.5-B-001..B-004`: **RESOLVED / VERIFIED**; final fresh Pass B PASS and Pass C PASS.
- WP-2.6 commercial workflow semantics: **CLOSED** through `cf46c731...` / CI `34170253114`.
- WP-2.6 canonical phone/WhatsApp and append retry semantics: **CLOSED** by `6dce81a4...` / CI `34171320200`.
- WP-2.6A NULL creation-status fail-closed boundary: **RESOLVED / VERIFIED** on `e027bbbb...` / CI `34223226316` after red-first control `0149f0b1...` / `34222772124`.
- WP-2.6A `WP2.6A-B-001..B-006`: **RESOLVED / VERIFIED**; final fresh Pass B reviewed head `c7339227...` / CI `34233201350` — **5/5 SUCCESS**.
- Before WP-2.8 relies on the security reading graph, repair the missing `docs/security/STORAGE-RLS.md` reference using already frozen/tested Storage authorization semantics.
- Venue lifecycle documentation conflict from WP-2.1 is closed by `docs/domain/STATE-MACHINES-VENUE-LIFECYCLE-ADDENDUM.md`.

## Feature lifecycle notes

- V1 Feature inventory: 120 Feature IDs across both ledgers.
- Lot-2 primary IDs: `FTR-013..FTR-028`; partial cross-lot responsibilities also include `FTR-012`, `FTR-089`, `FTR-092`, `FTR-093` and cross-cutting access/offline/security obligations.
- Feature-level whole-capability status is not conflated with packet/current-lot responsibility; Lot Coverage Matrices remain the durable responsibility-level reconciliation source.
- WP-2.4 packet responsibility for `FTR-020` is **ACCEPTED**.
- WP-2.5 packet responsibility for `FTR-021` and the Lot-2 read-model/guidance responsibility of `FTR-022` is **ACCEPTED**. This does not claim downstream WP-2.11 presentation/UI, WP-2.10/2.12 offline integration, Lot-3 Task workflow or Lot-12 real-data/default-criteria work.
- Original WP-2.6 product responsibility is execution-mapped to WP-2.6A/B/C. WP-2.6A Pass A and Pass B are complete, but no FTR-025/FTR-026 acceptance is claimed before WP-2.6A Pass C and the remaining B/C subpackets.

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
Accepted Lot-2 packets: WP-2.1, WP-2.2, WP-2.3, WP-2.4, WP-2.5
Last completed packet: WP-2.5 — ACCEPTED / COMPLETE
Current packet: WP-2.6A — ACCEPTANCE_PENDING / C-ACCEPTANCE
Planned next commercial packets: WP-2.6B, WP-2.6C
WP-2.6 specification gates: cf46c731... / 34170253114 and 6dce81a4... / 34171320200 — both 5/5 SUCCESS
WP-2.6A implementation-entry gate: c99c4ac... / 34171995654 — 5/5 SUCCESS
WP-2.6A verified Pass-A implementation: e027bbbb... / 34223226316 — 5/5 SUCCESS
WP-2.6A final fresh Pass-B review: c7339227... / 34233201350 — 5/5 SUCCESS; findings B-001..B-006 resolved/verified
Next permitted action: verify the Pass-B governance transition on its exact HEAD, then execute WP-2.6A Pass C only. WP-2.6B/C and WP-2.7 remain prohibited concurrently.
Lots 3–12: NOT_STARTED
```
