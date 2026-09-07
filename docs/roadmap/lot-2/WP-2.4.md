# WP-2.4 — Observations, sources, evidence/confidence/freshness and conflicts

## Identity

- Work Packet ID: `WP-2.4`
- Lot: `2`
- Name: Observations, sources, evidence/confidence/freshness and conflicts
- State: `REVIEW_FAILED`
- Current pass: `REVIEW_FAILED — B-003 remediation next`
- Primary bounded context: `facts/evidence` for Venue targets
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Dependency: `WP-2.3 ACCEPTED`
- Primary Feature: `FTR-020`
- Specification gate: **CLOSED** by `c414549d20338bf5180d5afc3681beda56fb11de`
- Specification-gate CI: run `34069692843` — **5/5 SUCCESS**
- Historical Pass-A implementation head: `9f3ca2fb57adf124e50bf8c4888280854c5d846f`
- Historical Pass-A CI: run `34106264873` — **5/5 SUCCESS**
- First Pass-B review-failure record: `3f6a750a97ca039c36dafd3dff5eca69eac683ad`
- First remediation implementation baseline: `06c7d1bf92239db22af14303d008c449387ca6ea`
- Verified first-remediation head/run: `5e229cada52c9b50ca3b2b820df3ab8291c2960c` / `34110071790` — **5/5 SUCCESS**
- Fresh re-review transition commit: `48ddaa1cdca2bde7f2b9e639295a10455e7ba477`

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
- RPC/database canonical validation must not accept a value that the official domain/provider parser rejects after the mutation has committed.

## Pass A — IMPLEMENT

Implemented foundation:

- domain/application evidence, source, resolution and freshness contracts;
- Supabase adapters/parsers with fail-closed response validation and typed safe persistence errors;
- `20260907074000_create_venue_fact_evidence.sql`;
- `20260907083000_add_venue_fact_freshness_transition.sql`;
- `20260907084500_add_venue_fact_observation_withdrawal.sql`;
- `sources`, `fact_observations`, `observation_sources`, protected retained-observation/freshness/lifecycle RPCs, RLS/grants and pgTAP coverage.

Historical Pass-A evidence on `9f3ca2fb57adf124e50bf8c4888280854c5d846f`, run `34106264873`: **5/5 SUCCESS**. Pass B invalidated acceptance readiness.

## First Pass B — ADVERSARIAL REVIEW

Fresh review reconstructed behavior from `FACTS-SOURCES.md`, `CONFIDENCE-FRESHNESS.md`, `INVARIANTS.md`, ADR-0006, `PHYSICAL-SCHEMA-V1.md`, `RLS-MATRIX-V1.md` and this packet rather than trusting Pass-A conclusions.

| Severity | Finding | State after first remediation / re-review |
|---|---|---|
| MAJOR `WP2.4-B-001` | Legacy `set_retained_venue_fact` could write around observation-backed resolution after evidence existed, allowing direct `known` truth and clearing retained-observation resolution provenance. | **RESOLVED / re-attacked with no bypass found** |
| MAJOR `WP2.4-B-002` | `fact_definition` edits could invalidate persisted observation values or WP-2.4 conflict-retained values. | **RESOLVED / re-attacked with no bypass found** |

Reviewed but not promoted to a finding: withdrawal currently preserves the retained value/pointer and fact revision by explicit test design. Frozen contracts require history preservation but do not unambiguously require automatic retained-truth invalidation on withdrawal, so this packet does not invent that behavior.

## First remediation evidence

Remediation added:

- `supabase/migrations/20260907101500_harden_venue_fact_evidence_review.sql`;
- `supabase/tests/venue_fact_evidence_adversarial_review_test.sql`.

### `WP2.4-B-001`

The original WP-2.3 setter became an internal core function with client EXECUTE revoked. The public wrapper preserves pre-evidence direct retained-value behavior, but once a fact has observations it rejects direct transition to `known`; callers must use protected observation resolution. The fact row is locked before checking for observations, serializing concurrent append/direct-set attempts.

Fresh re-review checked the function privilege boundary and the lock ordering against observation append. No remaining direct `known` write-around was found.

### `WP2.4-B-002`

`validate_fact_definition_row` rejects edits that invalidate any non-null retained value regardless of fact state and any non-null persisted observation value for facts using the definition. Historical observation rows remain valid after supersession/withdrawal.

Fresh re-review checked definition UPDATE locking versus observation append and found the shared/update lock ordering closes the reviewed race: whichever operation wins, the later one validates against the resulting definition/evidence state.

### Exact-head verification of first remediation

GitHub Actions run `34110071790` on `5e229cada52c9b50ca3b2b820df3ab8291c2960c`: **5/5 SUCCESS**.

- Core quality/security: **SUCCESS** — 79 test files / 807 tests PASS; measured coverage **100% statements / branches / functions / lines**.
- Local Supabase DB/RLS: **SUCCESS**, including adversarial remediation pgTAP.
- Browser/mutation harnesses: **SUCCESS**.
- Privacy-safe preview: **SUCCESS**.
- Full verify from clean checkout: **SUCCESS** — `npm run verify` PASS.
- Dependency audit still reports only the previously reviewed two Moderate transitive development-tool advisories; no accepted-known Critical/High.

## Fresh Pass B — ADVERSARIAL RE-REVIEW

Review baseline: verified remediation `5e229cada52c9b50ca3b2b820df3ab8291c2960c`, governance transition `48ddaa1cdca2bde7f2b9e639295a10455e7ba477`.

The re-review rebuilt expectations from the frozen contracts and re-attacked old-setter/core privileges and locking, definition-edit/history validity, direct RPC versus domain/parser canonical parity, same-project boundaries, malformed-success/provider fail-closed behavior, and evidence lifecycle preservation.

### Fresh finding

| Severity | Finding | Evidence / impact | State |
|---|---|---|---|
| MAJOR `WP2.4-B-003` | Database/RPC whitespace normalization is weaker than the official TypeScript domain/parser contract for source titles and conflict-resolution rationale. | `create_venue_fact_source` / `update_venue_fact_source` and the `sources.title` CHECK rely on PostgreSQL `btrim`, while `normalizeFactSource` uses JavaScript `String.trim()`. `resolve_venue_fact_from_observation` and `validate_retained_fact_row` similarly use `btrim` to require a nonblank conflict rationale while `normalizeFactResolution` uses `String.trim()`. A direct RPC caller can therefore submit whitespace such as TAB/NBSP that survives default `btrim` but is blank under the official parser. PostgreSQL can commit the mutation and return a row that `parseVenueFactSourceRow` or `parseResolvedVenueFactEvidenceRow` rejects, creating a committed-success/provider-failure split; for conflict resolution it also weakens the required rationale invariant. | **OPEN** |

`WP2.4-B-001` and `WP2.4-B-002` are considered resolved by this re-review. `WP2.4-B-003` is MAJOR, so Pass B verdict remains **FAIL / REVIEW_FAILED** and Pass C is prohibited.

Required B-003 remediation is intentionally narrow:

- establish one PostgreSQL canonical trim/nonblank primitive matching the TypeScript `String.trim()` whitespace boundary used by this packet;
- use it for source-title normalization/table integrity and conflict-resolution nonblank validation at both RPC and retained-fact trigger boundaries;
- add direct pgTAP regressions for at least TAB-only and NBSP-only input, plus a legitimate nonblank Unicode value;
- prove rejected conflict rationale causes no fact mutation/revision/provenance change;
- rerun exact-head full verification, then transition to `REVIEW_PENDING` for another fresh re-review.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Entry requires a fresh Pass B with no unresolved BLOCKING/MAJOR findings and state `ACCEPTANCE_PENDING`.

## Handoff

```text
Lot: 2 — Venues core
Branch: lot-2/venues-core
Packet: WP-2.4
State: REVIEW_FAILED
Pass: review failed; B-003 remediation next
Primary Feature: FTR-020
Dependency: WP-2.3 ACCEPTED
Historical Pass-A head/run: 9f3ca2fb57adf124e50bf8c4888280854c5d846f / 34106264873 — 5/5 SUCCESS
First review failure: 3f6a750a97ca039c36dafd3dff5eca69eac683ad
Verified first remediation: 5e229cada52c9b50ca3b2b820df3ab8291c2960c / 34110071790 — 5/5 SUCCESS
Fresh re-review transition: 48ddaa1cdca2bde7f2b9e639295a10455e7ba477
Resolved findings: WP2.4-B-001, WP2.4-B-002
Open MAJOR finding: WP2.4-B-003
Next action: remediate WP2.4-B-003 only, rerun exact-head verification, then fresh Pass B; do not start WP-2.5
```
