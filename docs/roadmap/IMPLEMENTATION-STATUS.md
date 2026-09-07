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
| WP-2.4 | observations, sources, evidence/confidence/freshness, conflicts | **REVIEW_PENDING — fresh Pass B after B-008** |
| WP-2.5 | deterministic criteria, blockers, score/readiness, missing information | PLANNED |
| WP-2.6 | offers, availability, contacts/interactions basics | PLANNED |
| WP-2.7 | contextual venue access-route observations | PLANNED |
| WP-2.8 | venue media/photo foundation and media safety | PLANNED |
| WP-2.9 | venue document/tag/link basics | PLANNED |
| WP-2.10 | repositories, local cache, pending/offline mutations | PLANNED |
| WP-2.11 | gallery/table/detail/compare/deep-link workspace | PLANNED |
| WP-2.12 | mobile/offline venue-visit workflow and packet E2E completion | PLANNED |

Accepted packet evidence remains unchanged:

- WP-2.1 ACCEPTED; findings `WP2.1-B-001..008` resolved; CI `34039296392` and governance `34040803267` 5/5.
- WP-2.2 ACCEPTED; `WP2.2-B-001` resolved; CI `34046985956` and governance `34048565452` 5/5.
- WP-2.3 ACCEPTED; `WP2.3-B-001..008` resolved; final reviewed head `2e3194f7109eb30eee4e73ace7ecbdd329fd321c`, CI `34068703691` 5/5.

## WP-2.4 — current packet

- Primary Feature: `FTR-020`.
- Dependency: **WP-2.3 ACCEPTED**.
- Evidence/confidence specification gate: **CLOSED** by `c414549d20338bf5180d5afc3681beda56fb11de`, CI `34069692843` 5/5.
- Historical Pass-A head/run: `9f3ca2fb57adf124e50bf8c4888280854c5d846f` / `34106264873` — **5/5 SUCCESS**.

### Pass-B history

- `WP2.4-B-001` MAJOR — legacy retained setter write-around: **RESOLVED / VERIFIED**.
- `WP2.4-B-002` MAJOR — definition edits invalidating persisted evidence: **RESOLVED / VERIFIED**.
- Verified first-remediation head/run: `5e229cada52c9b50ca3b2b820df3ab8291c2960c` / `34110071790` — **5/5 SUCCESS**.
- `WP2.4-B-003` MAJOR — source/conflict ECMAScript whitespace parity: **RESOLVED / VERIFIED**; head/run `527bdeff7840f244d749cd92a81d1eda3fc89017` / `34111887666` — **5/5 SUCCESS**.
- `WP2.4-B-004` MAJOR — fact-definition ECMAScript whitespace parity: **RESOLVED / VERIFIED**.
- `WP2.4-B-005` MAJOR — timestamp microsecond/non-finite parity: **RESOLVED / VERIFIED**.
- Verified B-004/B-005 remediation head/run: `d4d3ce84331d13809b5f7b97ed7bf1a263a2bf4a` / `34119950023` — **5/5 SUCCESS**, Core 80 files / 811 tests at 100% coverage plus DB/RLS, Browser/mutation, preview and clean-checkout verify PASS.
- `WP2.4-B-006` MAJOR — strict timestamp calendar/year-domain parity: **RESOLVED / VERIFIED**.
- Verified B-006 remediation head/run: `06c38444a2e859f59f590477bd43c40255463f3e` / `34131416659` — **5/5 SUCCESS**, including Core, DB/RLS, Browser/mutation, privacy-safe preview and clean-checkout `npm run verify`.
- `WP2.4-B-007` MAJOR — raw RPC timestamp grammar bypass through PostgreSQL `timestamptz` coercion: **RESOLVED / VERIFIED**.
- Verified B-007 remediation head/run: `92e0f511d394448ccdcdd3143d29b4f2cf3df987` / `34134876299` — **5/5 SUCCESS**, including Core, DB/RLS (`db:verify`), Browser E2E/mutation, privacy-safe preview and clean-checkout `npm run verify`.
- `WP2.4-B-008` MAJOR — observation/source link `isPrimary` parity: **RESOLVED / VERIFIED**.
- Verified B-008 remediation head/run: `4b161f4120cf554395badcc5b05cac79eb018e70` / `34137075923` — **5/5 SUCCESS**, including Core, DB/RLS (`db:verify`), Browser E2E/mutation, privacy-safe preview and clean-checkout `npm run verify`.

B-008 remediation moves the old permissive link implementation behind a client-inaccessible core and rejects `NULL` at the public RPC before mutation. Direct pgTAP proves rejected-NULL atomicity, canonical `false`/`true` behavior, no duplicate relationship, and denial of core execution to `authenticated`.

A fresh independent Pass B is now active on this verified baseline. No BLOCKING/MAJOR is assumed absent merely because remediation CI is green. Pass C remains prohibited until the fresh review clears. WP-2.5 remains PLANNED.

## Durable cursor

```text
Current Lot: 2 — Venues core
Lot State: IN_PROGRESS
Branch: lot-2/venues-core
Current Packet: WP-2.4
Packet State: REVIEW_PENDING
Current Pass: B-ADVERSARIAL-REVIEW — fresh independent re-review after WP2.4-B-008
Last completed packet: WP-2.3 — ACCEPTED
Accepted packets: WP-2.1, WP-2.2, WP-2.3
Resolved/verified WP-2.4 MAJOR findings: WP2.4-B-001, WP2.4-B-002, WP2.4-B-003, WP2.4-B-004, WP2.4-B-005, WP2.4-B-006, WP2.4-B-007, WP2.4-B-008
Open WP-2.4 BLOCKING/MAJOR finding: none promoted yet from fresh re-review
Latest verified remediation: 4b161f4120cf554395badcc5b05cac79eb018e70 / 34137075923 — 5/5 SUCCESS
Next permitted action: perform fresh independent Pass B on the verified B-008 baseline. Pass C and WP-2.5 remain prohibited until review clearance.
```

## Known localized specification repairs / stop-conditions

- WP-2.4 evidence/confidence gate: **CLOSED** (`c414549d...`, CI `34069692843`).
- Before WP-2.5 implements `evidenceReadiness`, document its deterministic formula in `domain/CRITERIA-EVALUATION.md`.
- Before WP-2.5 executes/seeds `custom_manual_assessment`, freeze exact acceptable-value representation for supported boolean/select/rating cases.
- Before WP-2.8 relies on the security reading graph, repair the missing `docs/security/STORAGE-RLS.md` reference using already frozen/tested Storage authorization semantics.
- Venue lifecycle documentation conflict from WP-2.1 is closed by `docs/domain/STATE-MACHINES-VENUE-LIFECYCLE-ADDENDUM.md`.

## Feature lifecycle notes

- V1 Feature inventory: 120 Feature IDs across both ledgers.
- Lot-2 primary IDs: `FTR-013..FTR-028`; partial cross-lot responsibilities also include `FTR-012`, `FTR-089`, `FTR-092`, `FTR-093` and cross-cutting access/offline/security obligations.
- Feature-level whole-capability status is not conflated with packet/current-lot responsibility; Lot Coverage Matrices remain the durable responsibility-level reconciliation source.
- `FTR-020` remains feature-level **IN_PROGRESS** while WP-2.4 undergoes fresh Pass B after B-008.

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
Current state/pass: REVIEW_PENDING / B-ADVERSARIAL-REVIEW — fresh independent re-review after WP2.4-B-008
Resolved/verified: WP2.4-B-001, WP2.4-B-002, WP2.4-B-003, WP2.4-B-004, WP2.4-B-005, WP2.4-B-006, WP2.4-B-007, WP2.4-B-008
Open BLOCKING/MAJOR: none promoted yet from fresh re-review
Next: fresh independent Pass B. Pass C and WP-2.5 remain prohibited until review clearance.
Lots 3–12: NOT_STARTED
```