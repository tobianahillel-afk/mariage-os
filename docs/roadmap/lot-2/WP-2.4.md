# WP-2.4 — Observations, sources, evidence/confidence/freshness and conflicts

## Identity

- Work Packet ID: `WP-2.4`
- Lot: `2`
- Name: Observations, sources, evidence/confidence/freshness and conflicts
- State: `IN_PROGRESS`
- Current pass: `B-REMEDIATION`
- Primary bounded context: `facts/evidence` for Venue targets
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Dependency: `WP-2.3 ACCEPTED`
- Primary Feature: `FTR-020`
- Specification gate: **CLOSED** by `c414549d20338bf5180d5afc3681beda56fb11de`
- Specification-gate CI: run `34069692843` — **5/5 SUCCESS**
- Reviewed Pass-A implementation head: `9f3ca2fb57adf124e50bf8c4888280854c5d846f`
- Pass-A implementation CI: run `34106264873` — **5/5 SUCCESS**, including clean-checkout `npm run verify`
- Pass-B review-failure record: `3f6a750a97ca039c36dafd3dff5eca69eac683ad`
- Remediation implementation baseline: `06c7d1bf92239db22af14303d008c449387ca6ea`

## Scope and frozen responsibilities

WP-2.4 owns the Venue facts/evidence slice for `FTR-020`:

- project-scoped `fact_observations` with typed normalized value, optional bounded raw text, `evidence_level`, independent `confidence`, observation status, observed time, optional import provenance placeholder, note and immutable creator metadata;
- project-scoped `sources` with canonical source type, title/URL where applicable, evidence level, observed/retrieved time, notes and lifecycle/status;
- same-project many-to-many `observation_sources` links so one observation can cite several sources without duplication;
- append-oriented observation history: correction/supersession/withdrawal preserves historical rows and ordinary clients cannot arbitrarily rewrite/hard-delete evidence;
- every non-null observation value remains valid under the referenced `fact_definition` using the accepted WP-2.3 canonical value contract;
- `evidence_level`, `confidence`, freshness and fact semantic state remain independent axes with no implicit mapping;
- evidence levels: `contractual`, `confirmed_for_event`, `official_general`, `observed`, `third_party`, `estimated`, `unknown_source`;
- confidence: exactly `high`, `medium`, `low`, `unknown`;
- observation creation never silently overwrites retained truth;
- explicit conflict/resolution metadata on `facts`: `retained_observation_id`, `resolution_note`, `resolved_by`, `resolved_at`, `last_verified_at`, `stale_at`;
- explicit retained-observation resolution validates same project/fact/domain, active observation and current definition validity;
- inherited `venues.read` / `venues.write` authorization, composite same-project integrity and direct RLS/RPC allow/deny evidence;
- domain/application/Supabase boundaries for later criteria/readiness/UI without implementing WP-2.5.

Requirements/evidence anchors: `FAC-002`, WP-2.4 portion of `FAC-003`, `FAC-004..009`, `ACC-015`, `ACC-025..027`, domain invariants 21–26 as applicable, `AUTHZ-001..009`, `AUTHZ-012`, `AUTHZ-017`, `AUTHZ-018`, `AUTHZ-020`, `RLS-MATRIX-V1` Facts/evidence rules.

### Explicit scope fence

Not owned here: WP-2.5 scoring/compatibility/blockers/`evidenceReadiness`/missing-information read model; Lot-3 task creation; Lot-4 canonical import/merge/apply; Vendor facts; UI; IndexedDB/offline queue; real wedding data; automatic evidence-ranking winner selection.

## Frozen semantic boundaries

- `unknown`, known-false, `not_applicable` and `conflict` remain distinct.
- Evidence strength, confidence, freshness and fact state are independent.
- A broken/archived/superseded source never erases the historical observation it supported.
- Contradictory observations may coexist indefinitely.
- Weaker/newer evidence alone cannot replace retained truth.
- `raw_value_text` is audit/evidence context and never calculation truth.
- A retained observation cannot belong to another fact/project and its normalized value must remain valid for the current definition.
- Historical observation values remain typed evidence after supersession/withdrawal; definition edits may not make persisted evidence semantically invalid.

## Pass A — IMPLEMENT

Implemented before fresh review:

- domain/application evidence, source, resolution and freshness contracts;
- Supabase adapters/parsers with fail-closed response validation and typed safe persistence errors;
- `20260907074000_create_venue_fact_evidence.sql`;
- `20260907083000_add_venue_fact_freshness_transition.sql`;
- `20260907084500_add_venue_fact_observation_withdrawal.sql`;
- `sources`, `fact_observations`, `observation_sources`, protected retained-observation/freshness/lifecycle RPCs, RLS/grants and pgTAP coverage.

Exact Pass-A evidence on `9f3ca2fb57adf124e50bf8c4888280854c5d846f`, run `34106264873`: **5/5 SUCCESS**.

- Core: **79 test files / 807 tests PASS**, **100% statements/branches/functions/lines**.
- DB/RLS: **29 files / 664 pgTAP tests PASS**.
- Browser: **40/40 Playwright PASS** across Chromium, Firefox, WebKit and mobile Chromium.
- Mutation: **82.50%**, configured gate PASS.
- Privacy-safe preview: PASS.
- Clean-checkout `npm run verify`: PASS.
- Dependency gate: only the two previously reviewed Moderate transitive development-tool advisories; no accepted-known Critical/High.

Pass A correctly transitioned to `REVIEW_PENDING`; this evidence was later invalidated for acceptance by fresh Pass-B MAJOR findings.

## Pass B — ADVERSARIAL REVIEW

Fresh review reconstructed expected behavior from `FACTS-SOURCES.md`, `CONFIDENCE-FRESHNESS.md`, `INVARIANTS.md`, ADR-0006, `PHYSICAL-SCHEMA-V1.md`, `RLS-MATRIX-V1.md` and this packet rather than trusting Pass-A conclusions.

### Findings

| Severity | Finding | State |
|---|---|---|
| MAJOR `WP2.4-B-001` | Legacy `set_retained_venue_fact` can write around observation-backed resolution after evidence exists, allowing direct `known` truth and clearing retained-observation resolution provenance. | **REMEDIATING** |
| MAJOR `WP2.4-B-002` | `fact_definition` edits protect only prior `known` retained truth and can invalidate persisted observation values or WP-2.4 conflict-retained values. | **REMEDIATING** |

Reviewed but not promoted to a finding: withdrawal currently preserves the retained value/pointer and fact revision by explicit test design. Frozen contracts require history preservation but do not unambiguously require automatic retained-truth invalidation on withdrawal, so this packet does not invent that behavior.

Fresh Pass-B decision at baseline: **FAIL / REVIEW_FAILED**. Pass C remains prohibited until remediation is verified and a fresh re-review passes.

## Remediation — IN PROGRESS

Remediation implementation baseline `06c7d1bf92239db22af14303d008c449387ca6ea` adds:

- `supabase/migrations/20260907101500_harden_venue_fact_evidence_review.sql`;
- `supabase/tests/venue_fact_evidence_adversarial_review_test.sql`.

### `WP2.4-B-001` remediation

The original WP-2.3 retained setter is renamed to an internal core function with client EXECUTE revoked. The public `set_retained_venue_fact` wrapper preserves legitimate pre-evidence direct retained-value behavior, but once a fact has observations it rejects a direct transition to `known`; callers must use the protected observation-resolution workflow. The fact row is locked before the evidence-existence check so concurrent append versus direct-set operations serialize instead of creating a time-of-check/time-of-use bypass.

Regression evidence attacks the public legacy RPC after an explicit conflict resolution and verifies that state, retained value, retained observation pointer and rationale remain unchanged. It also proves direct retained setting still works before evidence exists.

### `WP2.4-B-002` remediation

`validate_fact_definition_row` now rejects definition edits that invalidate any non-null retained value regardless of fact state and any non-null persisted observation value for facts using that definition. Historical evidence remains valid even when superseded/withdrawn because it is still persisted evidence under the same definition.

Regression evidence proves an option-removing definition edit is rejected when an observation uses that option, a compatible edit still succeeds, and an edit cannot invalidate a conflict-retained observation value.

### Verification state

- remediation code/tests committed at `06c7d1bf92239db22af14303d008c449387ca6ea`;
- intermediate CI run `34109732455` started for that code-only remediation head;
- Core quality/security on that intermediate run: **SUCCESS**;
- full exact-head acceptance evidence is **not yet claimed** because this governance update creates a newer head and the complete CI must be rerun on the final remediation head.

No finding is marked RESOLVED until full exact-head verification is green and the fresh independent re-review re-attacks both boundaries.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Entry requires state `ACCEPTANCE_PENDING` after a fresh Pass B with no unresolved BLOCKING/MAJOR findings.

## Handoff

```text
Lot: 2 — Venues core
Branch: lot-2/venues-core
Packet: WP-2.4
State: IN_PROGRESS
Pass: B-REMEDIATION
Primary Feature: FTR-020
Dependency: WP-2.3 ACCEPTED
Historical Pass-A head/run: 9f3ca2fb57adf124e50bf8c4888280854c5d846f / 34106264873 — 5/5 SUCCESS
Review-failure record: 3f6a750a97ca039c36dafd3dff5eca69eac683ad
Open MAJOR findings under remediation: WP2.4-B-001, WP2.4-B-002
Remediation baseline: 06c7d1bf92239db22af14303d008c449387ca6ea
Next action: finish exact-head verification of remediation, then transition REVIEW_PENDING and perform a fresh independent WP-2.4 Pass B; do not start WP-2.5
```
