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
2. `WP-2.2` — spaces, capacity and member ratings/preferences — **ACCEPTED**;
3. `WP-2.3` — fact definitions, typed retained facts and value validation — **REVIEW_PENDING / B-ADVERSARIAL-REVIEW**;
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
- All original/fresh Pass B findings `WP2.1-B-001..008`: **RESOLVED**.
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
- Governance exact-head run `34040803267` on `3304840ac94dbae2e0ebb79bdc0b57cdedb4943c`: **5/5 SUCCESS**.

### WP-2.2 acceptance evidence

Record: `lot-2/WP-2.2.md`.

- State: **ACCEPTED**.
- Required WP-2.2 responsibilities minus accepted/evidenced responsibilities: **∅**.
- MAJOR `WP2.2-B-001`: **RESOLVED** across domain validation, provider parsing, direct RPC validation and PostgreSQL representation.
- Fresh Pass B: **PASS**.
- Pass C reconciliation: **PASS**.
- Open WP-2.2 BLOCKING/MAJOR findings: **none**.
- Reviewed implementation head: `241daa01e069a6cbaec4d0ebc09ddf5ca982a385`.
- Exact implementation CI run `34046985956`: **5/5 SUCCESS**.
- Unit: **47 files / 473 tests PASS**, measured in-scope coverage **100% statements/branches/functions/lines**.
- DB/RLS: **20 files / 442 pgTAP tests PASS**.
- Browser: **40/40 Playwright PASS** across Chromium, Firefox, WebKit and mobile Chromium.
- Privacy-safe preview: **PASS**.
- Full verify from clean checkout: **PASS**.
- Non-blocking observation: simultaneous first-create attempts for the same member opinion may lose on the uniqueness constraint rather than normalize to the existing-row stale/conflict code; no overwrite, impersonation or data loss occurs.
- Acceptance-governance exact-head CI: run `34048565452` on `480b0bcc168d7789bf2bee07a75c8f04200f5cb7` — **5/5 SUCCESS**, clean-checkout `npm run verify` PASS.
- No UI/local-offline/facts/criteria completion is claimed by WP-2.2.

### WP-2.3 review state

Record: `lot-2/WP-2.3.md`.

- State: **REVIEW_PENDING**.
- Current/next pass: **B-ADVERSARIAL-REVIEW**.
- Primary Feature: `FTR-019`.
- Scope: Venue `fact_definitions` + retained `facts`, explicit semantic states, all frozen V1 value-shape validation, same-project/RLS and provider-safe boundaries.
- WP-2.3 non-`known` states store null retained value; provisional conflict-value/resolution behavior waits for WP-2.4 observations/provenance.
- `evaluation_rule_json` storage shape is validated, but compatibility execution/scoring remains WP-2.5.
- Full default-criteria seeding is not activated in WP-2.3; ordinary client commands cannot create/repurpose system-defined definitions.
- No observation/source, scoring/readiness, UI, offline queue, import/export or Vendor-target implementation is claimed.
- Reviewed Pass-A implementation head: `e209d5d33ef2ec5c535121caf9e2e066012f4de8`.
- Exact Pass-A CI run `34062811901`: **5/5 SUCCESS**, including clean-checkout `npm run verify`.
- Unit: **57 files / 669 tests PASS**, measured in-scope coverage **100% statements/branches/functions/lines**.
- DB/RLS: **25 files / 553 pgTAP tests PASS**.
- Browser: **40/40 Playwright PASS** across Chromium, Firefox, WebKit and mobile Chromium.
- Provider parser hardening: wrong same-project requested definition identity now fails closed.
- Pass B decision: **pending; no BLOCKING/MAJOR finding has yet been recorded**.

### Durable cursor

- Current Lot: **2 — Venues core**
- Lot state: **IN_PROGRESS**
- Current branch: **`lot-2/venues-core`**
- Current packet: **WP-2.3**
- Packet state: **REVIEW_PENDING**
- Current/next pass: **B-ADVERSARIAL-REVIEW**
- Accepted packets: **WP-2.1, WP-2.2**
- Review-failed/blocked packets: **none**
- Open packet BLOCKING/MAJOR findings: **none recorded yet; fresh Pass B decision pending**
- Latest implementation verification: run `34062811901` on `e209d5d33ef2ec5c535121caf9e2e066012f4de8` — **5/5 SUCCESS**
- Next permitted action: **run fresh WP-2.3 Pass B only; do not start WP-2.4 concurrently.**

## Known localized specification repairs

These are recorded stop-conditions for the owning later packets, not permission to invent behavior:

- before WP-2.4 implements `fact_observations`, reconcile the normative distinction between `evidence_level` and the separate `confidence = high|medium|low|unknown` field;
- before WP-2.5 implements `evidenceReadiness`, document its deterministic formula in `domain/CRITERIA-EVALUATION.md`;
- before WP-2.5 executes or seeds `custom_manual_assessment`, freeze the exact representation of its configured acceptable value for the supported boolean/select/rating cases; WP-2.3 stores/validates only the currently frozen structural marker and does not execute it;
- before WP-2.8 relies on the security reading graph, repair the missing `docs/security/STORAGE-RLS.md` reference using the already frozen Storage/RLS rules and tested Lot-1 policies.

The Venue lifecycle documentation conflict discovered during WP-2.1 is closed by `docs/domain/STATE-MACHINES-VENUE-LIFECYCLE-ADDENDUM.md`.

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
- `FTR-013` and `FTR-014` remain feature-level **IN_PROGRESS** because later Lot-2 UI/local/deep-link/duplicate responsibilities remain.
- `FTR-018`, `FTR-023` and `FTR-012` remain feature-level **IN_PROGRESS** after WP-2.2 acceptance because later Lot-2 UI/local/read-model responsibilities remain.
- `FTR-019` remains feature-level **IN_PROGRESS** while WP-2.3 is under review; later observation and compatibility responsibilities remain separate FTR-020/FTR-021 packets.

## Current blockers / forward maintenance

Open Lot 2 packet findings: **none currently recorded; WP-2.3 fresh Pass B is now the active review step**.

Reviewed non-blocking maintenance:

- WP-2.2 first-create member-opinion concurrency may surface a uniqueness failure instead of normalized stale/conflict; behavior is non-destructive and can be normalized in later local/retry hardening if needed;
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
Lot 0: ACCEPTED
Lot 1: ACCEPTED
Lot 2: IN_PROGRESS
Lot 2 branch: lot-2/venues-core
Coverage: required current-lot responsibilities - assigned packet responsibilities = ∅
Accepted Lot 2 packets: WP-2.1, WP-2.2
WP-2.1 implementation CI: 34039296392 — 5/5 SUCCESS
WP-2.1 governance CI: 34040803267 — 5/5 SUCCESS
WP-2.2 implementation CI: 34046985956 — 5/5 SUCCESS
WP-2.2 governance CI: 34048565452 — 5/5 SUCCESS
Current packet: WP-2.3
Packet state: REVIEW_PENDING
Current/next pass: B-ADVERSARIAL-REVIEW
WP-2.3 reviewed Pass-A head: e209d5d33ef2ec5c535121caf9e2e066012f4de8
WP-2.3 Pass-A CI: 34062811901 — 5/5 SUCCESS
Open WP-2.3 BLOCKING/MAJOR: none recorded yet; fresh Pass B decision pending
Next: run fresh WP-2.3 Pass B only; do not start WP-2.4
Lots 3–12: NOT_STARTED
```
