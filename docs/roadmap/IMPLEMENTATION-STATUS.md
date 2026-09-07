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
| WP-2.5 | deterministic criteria, blockers, score/readiness, missing information | **REVIEW_FAILED — WP2.5-B-003 MAJOR** |
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

## WP-2.5 — fresh Pass B failed on B-003

Packet record: `lot-2/WP-2.5.md`.

All pre-implementation specification gates remain **CLOSED**:

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

Pass A implementation remains fully verified:

- deterministic rule validation/evaluation, blocking aggregation, weighted score, readiness and guidance are implemented as pure domain/read-model behavior;
- project/venue compatibility application service and authorized Supabase adapter load project-scoped inputs without persisting compatibility authority;
- migration `20260907181500_harden_venue_criteria_boundaries.sql` hardens canonical rule and system-derived write boundaries; direct DB coverage lives in `venue_criteria_boundaries_test.sql`;
- implementation head/run `aef7bea53e9db32790ab19c3fffdd0a8f63dc89d` / `34158303997`: **5/5 SUCCESS**;
- clean-checkout evidence: **94 test files / 911 tests PASS**, **100% statements/branches/functions/lines**, **36 pgTAP files / 795 tests PASS**, Browser E2E **40/40 PASS**, mutation gate PASS, build PASS, privacy-safe preview PASS and full `npm run verify` PASS.

The first fresh independent Pass B reviewed head `3948060eb541ae2ae3eac6f5b1a7e702eb057e64`; CI `34159043613` was **5/5 SUCCESS**, but the review decision was **FAIL** on two MAJOR findings:

- `WP2.5-B-001 MAJOR` — missing target provenance and incomplete reconstructible dynamic dependency explanation;
- `WP2.5-B-002 MAJOR` — malformed provider response could alias one duplicate non-null `retained_observation_id` across different facts instead of failing closed.

Both findings are **RESOLVED / VERIFIED** on remediation head `68439bb0d152c60197fc8ae05f416300b3a81c35`, exact run `34161773557` — **5/5 SUCCESS**:

- B-001: the compatibility read model exposes `project|explicit_context` target provenance plus immutable dynamic explanation covering target/source, support key/state/value, retained observation state, freshness/readiness, comparison, outcome and deterministic reason; regressions cover equal numeric targets with different provenance, missing/conflict/stale/invalid states and non-mutation;
- B-002: duplicate non-null retained-observation ownership across distinct facts is rejected fail-closed during retained-ID collection and expected-ownership construction; regressions preserve existing missing/wrong-fact/duplicate-response checks;
- Core: **94 test files / 924 tests PASS**, **100% statements/branches/functions/lines**;
- DB/RLS: **36 pgTAP files / 795 tests PASS** after clean reset;
- Browser E2E + mutation: PASS;
- privacy-safe preview: PASS;
- full clean-checkout `npm run verify`: PASS.

The mandatory fresh post-remediation Pass B reviewed exact head `7eecdbfbf986d26faa2f7d98e67db2a674fdd3e2`; CI `34162443907` was **5/5 SUCCESS**, including clean-checkout `npm run verify`. Review decision: **FAIL** on one new MAJOR finding:

- `WP2.5-B-003 MAJOR — OPEN`: `parseFacts()` enforces one fact per `definition_id` but not uniqueness of `facts.id`. A malformed provider response can supply two otherwise-valid fact rows under different definitions with the same fact primary-key ID and distinct retained observations that both point to that shared ID. The parser accepts and projects them as two independent snapshots, allowing one impossible fact identity to influence multiple criteria, blocker/score/readiness/guidance. This violates the untrusted provider semantic-validation/fail-closed contract (`SEC-VAL-001`, `SEC-VAL-008`, regression obligation `SEC-VER-005`).

Required remediation is bounded: add the adversarial duplicate-fact-ID regression, reject repeated parsed fact IDs centrally while preserving existing definition/observation/project invariants, obtain exact-head full CI, then return to `REVIEW_PENDING` for another fresh independent Pass B. No DB migration is required because PostgreSQL already owns primary-key uniqueness. WP-2.6 remains prohibited concurrently.

## Durable cursor

```text
Current Lot: 2 — Venues core
Lot State: IN_PROGRESS
Branch: lot-2/venues-core
Current Packet: WP-2.5
Packet State: REVIEW_FAILED
Current Pass: B-ADVERSARIAL-REVIEW — WP2.5-B-003 open
Last completed packet: WP-2.4 — ACCEPTED
Accepted packets: WP-2.1, WP-2.2, WP-2.3, WP-2.4
Closed WP-2.5 specification gates: evidenceReadiness; custom_manual_assessment.accepted; WP2.5-S-001
WP-2.5 verified Pass-A implementation head/run: aef7bea53e9db32790ab19c3fffdd0a8f63dc89d / 34158303997 — 5/5 SUCCESS
WP-2.5 prior fresh reviewed head/run: 3948060eb541ae2ae3eac6f5b1a7e702eb057e64 / 34159043613 — 5/5 SUCCESS, review FAIL
WP-2.5 verified B-001/B-002 remediation head/run: 68439bb0d152c60197fc8ae05f416300b3a81c35 / 34161773557 — 5/5 SUCCESS
WP-2.5 fresh post-remediation reviewed head/run: 7eecdbfbf986d26faa2f7d98e67db2a674fdd3e2 / 34162443907 — 5/5 SUCCESS, review FAIL
Resolved/verified WP-2.5 findings: WP2.5-B-001; WP2.5-B-002
Open WP-2.5 BLOCKING/MAJOR findings: WP2.5-B-003
Next permitted action: remediate WP2.5-B-003 only, exact-head full CI, transition REVIEW_PENDING, then fresh independent Pass B. Do not start WP-2.6 concurrently.
```

## Known localized specification repairs / stop-conditions

- WP-2.4 evidence/confidence gate: **CLOSED** (`c414549d...`, CI `34069692843`).
- WP-2.5 deterministic `evidenceReadiness` formula: **CLOSED** (`5fd9be01...`, CI `34143567491`).
- WP-2.5 `custom_manual_assessment.accepted` representation: **CLOSED** (`5fd9be01...`, CI `34143567491`).
- WP-2.5 `project_target_guest_count_supported` deterministic semantics / `WP2.5-S-001`: **CLOSED** (`01136a76...`, CI `34146113235`).
- WP-2.5 prior Pass-B findings `WP2.5-B-001` and `WP2.5-B-002`: **RESOLVED / VERIFIED** on `68439bb0...`, CI `34161773557`.
- WP-2.5 fresh Pass-B finding `WP2.5-B-003`: **OPEN / MAJOR** on reviewed head `7eecdbfb...`, CI `34162443907`; remediation only before another fresh Pass B.
- Before WP-2.8 relies on the security reading graph, repair the missing `docs/security/STORAGE-RLS.md` reference using already frozen/tested Storage authorization semantics.
- Venue lifecycle documentation conflict from WP-2.1 is closed by `docs/domain/STATE-MACHINES-VENUE-LIFECYCLE-ADDENDUM.md`.

## Feature lifecycle notes

- V1 Feature inventory: 120 Feature IDs across both ledgers.
- Lot-2 primary IDs: `FTR-013..FTR-028`; partial cross-lot responsibilities also include `FTR-012`, `FTR-089`, `FTR-092`, `FTR-093` and cross-cutting access/offline/security obligations.
- Feature-level whole-capability status is not conflated with packet/current-lot responsibility; Lot Coverage Matrices remain the durable responsibility-level reconciliation source.
- WP-2.4 packet responsibility for `FTR-020` is **ACCEPTED**.
- WP-2.5 is **REVIEW_FAILED / B-ADVERSARIAL-REVIEW**; no FTR-021/FTR-022 packet acceptance is claimed until B-003 is remediated, a fresh Pass B passes and Pass C succeeds.

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
Current packet: WP-2.5 — REVIEW_FAILED / B-ADVERSARIAL-REVIEW — WP2.5-B-003 open
WP-2.5 closed specification gates: evidenceReadiness; custom_manual_assessment.accepted; WP2.5-S-001
WP-2.5 verified Pass-A head/run: aef7bea53e9db32790ab19c3fffdd0a8f63dc89d / 34158303997 — 5/5 SUCCESS
WP-2.5 prior fresh reviewed head/run: 3948060eb541ae2ae3eac6f5b1a7e702eb057e64 / 34159043613 — 5/5 SUCCESS, review FAIL
WP-2.5 verified B-001/B-002 remediation head/run: 68439bb0d152c60197fc8ae05f416300b3a81c35 / 34161773557 — 5/5 SUCCESS
WP-2.5 fresh post-remediation reviewed head/run: 7eecdbfbf986d26faa2f7d98e67db2a674fdd3e2 / 34162443907 — 5/5 SUCCESS, review FAIL
Resolved/verified findings: WP2.5-B-001; WP2.5-B-002
Open BLOCKING/MAJOR findings: WP2.5-B-003
Next permitted action: remediate WP2.5-B-003 only, exact-head full CI, transition REVIEW_PENDING, then fresh independent Pass B. WP-2.6 remains prohibited concurrently.
Lots 3–12: NOT_STARTED
```
