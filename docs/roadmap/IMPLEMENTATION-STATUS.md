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
| WP-2.5 | deterministic criteria, blockers, score/readiness, missing information | **REVIEW_FAILED — WP2.5-B-001 / WP2.5-B-002** |
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

## WP-2.5 — Pass B review failed

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

Fresh independent Pass B reviewed the post-transition head `3948060eb541ae2ae3eac6f5b1a7e702eb057e64`; its CI `34159043613` is **5/5 SUCCESS**, but the review decision is **FAIL** because two MAJOR normative defects remain:

- `WP2.5-B-001 MAJOR` — the compatibility read model accepts explicit target override/context but loses target provenance and does not expose the complete dynamic dependency explanation required by the frozen addendum: target source, support-source key/state/value, source freshness/readiness, comparison/outcome/reason must be reconstructible explicitly.
- `WP2.5-B-002 MAJOR` — the Supabase provider parser can silently alias one duplicate non-null `retained_observation_id` across different facts because ownership is stored in an overwriting Map and retained IDs are deduplicated. This violates fail-closed runtime-boundary validation (`SEC-VAL-001`, `SEC-VAL-008`) and can corrupt readiness/guidance for a malformed provider response. `SEC-VER-005` requires regression coverage.

No additional BLOCKING/MAJOR finding was found in this pass for score/blocker math, NOT_APPLICABLE/bonus handling, rule direction/manual parity, derived write protection, dynamic T/M boundary semantics, stale semantic outcome, conflict state semantics or database same-fact retained-observation integrity.

WP-2.5 is therefore `REVIEW_FAILED`. Next permitted work is remediation of **B-001 and B-002 only**, exact-head full CI, transition back to `REVIEW_PENDING`, then a fresh independent Pass B. Green CI alone cannot accept the packet. WP-2.6 remains prohibited concurrently.

## Durable cursor

```text
Current Lot: 2 — Venues core
Lot State: IN_PROGRESS
Branch: lot-2/venues-core
Current Packet: WP-2.5
Packet State: REVIEW_FAILED
Current Pass: B-ADVERSARIAL-REVIEW — WP2.5-B-001 / WP2.5-B-002
Last completed packet: WP-2.4 — ACCEPTED
Accepted packets: WP-2.1, WP-2.2, WP-2.3, WP-2.4
Closed WP-2.5 specification gates: evidenceReadiness; custom_manual_assessment.accepted; WP2.5-S-001
WP-2.5 verified Pass-A implementation head/run: aef7bea53e9db32790ab19c3fffdd0a8f63dc89d / 34158303997 — 5/5 SUCCESS
WP-2.5 fresh reviewed head/run: 3948060eb541ae2ae3eac6f5b1a7e702eb057e64 / 34159043613 — 5/5 SUCCESS, review FAIL
Open WP-2.5 BLOCKING/MAJOR findings: WP2.5-B-001 MAJOR; WP2.5-B-002 MAJOR
Next permitted action: remediate B-001 and B-002 only, add regressions, obtain exact-head full CI, return to REVIEW_PENDING, then fresh Pass B. Do not start WP-2.6 concurrently.
```

## Known localized specification repairs / stop-conditions

- WP-2.4 evidence/confidence gate: **CLOSED** (`c414549d...`, CI `34069692843`).
- WP-2.5 deterministic `evidenceReadiness` formula: **CLOSED** (`5fd9be01...`, CI `34143567491`).
- WP-2.5 `custom_manual_assessment.accepted` representation: **CLOSED** (`5fd9be01...`, CI `34143567491`).
- WP-2.5 `project_target_guest_count_supported` deterministic semantics / `WP2.5-S-001`: **CLOSED** (`01136a76...`, CI `34146113235`).
- WP-2.5 Pass B: **REVIEW_FAILED** on `WP2.5-B-001` and `WP2.5-B-002`; remediation is the only permitted packet work until re-review.
- Before WP-2.8 relies on the security reading graph, repair the missing `docs/security/STORAGE-RLS.md` reference using already frozen/tested Storage authorization semantics.
- Venue lifecycle documentation conflict from WP-2.1 is closed by `docs/domain/STATE-MACHINES-VENUE-LIFECYCLE-ADDENDUM.md`.

## Feature lifecycle notes

- V1 Feature inventory: 120 Feature IDs across both ledgers.
- Lot-2 primary IDs: `FTR-013..FTR-028`; partial cross-lot responsibilities also include `FTR-012`, `FTR-089`, `FTR-092`, `FTR-093` and cross-cutting access/offline/security obligations.
- Feature-level whole-capability status is not conflated with packet/current-lot responsibility; Lot Coverage Matrices remain the durable responsibility-level reconciliation source.
- WP-2.4 packet responsibility for `FTR-020` is **ACCEPTED**.
- WP-2.5 is **REVIEW_FAILED / B-ADVERSARIAL-REVIEW**; no FTR-021/FTR-022 packet acceptance is claimed until remediation, fresh Pass B and Pass C succeed.

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
Current packet: WP-2.5 — REVIEW_FAILED / B-ADVERSARIAL-REVIEW — WP2.5-B-001 / WP2.5-B-002
WP-2.5 closed specification gates: evidenceReadiness; custom_manual_assessment.accepted; WP2.5-S-001
WP-2.5 verified Pass-A head/run: aef7bea53e9db32790ab19c3fffdd0a8f63dc89d / 34158303997 — 5/5 SUCCESS
WP-2.5 fresh reviewed head/run: 3948060eb541ae2ae3eac6f5b1a7e702eb057e64 / 34159043613 — 5/5 SUCCESS, review FAIL
Open findings: WP2.5-B-001 MAJOR; WP2.5-B-002 MAJOR
Next permitted action: remediate B-001 and B-002 only; exact-head full CI; transition REVIEW_PENDING; fresh independent Pass B. WP-2.6 remains prohibited concurrently.
Lots 3–12: NOT_STARTED
```
