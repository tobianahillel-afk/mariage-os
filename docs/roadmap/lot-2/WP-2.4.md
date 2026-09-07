# WP-2.4 — Observations, sources, evidence/confidence/freshness and conflicts

## Identity

- Work Packet ID: `WP-2.4`
- Lot: `2`
- Name: Observations, sources, evidence/confidence/freshness and conflicts
- State: `REVIEW_PENDING`
- Current pass: `B-ADVERSARIAL-REVIEW — fresh re-review after WP2.4-B-003`
- Primary bounded context: `facts/evidence` for Venue targets
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Dependency: `WP-2.3 ACCEPTED`
- Primary Feature: `FTR-020`
- Specification gate: **CLOSED** by `c414549d20338bf5180d5afc3681beda56fb11de`
- Specification-gate CI: `34069692843` — **5/5 SUCCESS**
- Historical Pass-A head/run: `9f3ca2fb57adf124e50bf8c4888280854c5d846f` / `34106264873` — **5/5 SUCCESS**
- First review-failure record: `3f6a750a97ca039c36dafd3dff5eca69eac683ad`
- Verified first-remediation head/run: `5e229cada52c9b50ca3b2b820df3ab8291c2960c` / `34110071790` — **5/5 SUCCESS**
- Fresh re-review transition: `48ddaa1cdca2bde7f2b9e639295a10455e7ba477`
- B-003 review-failure record: `c43af7fc93ca36931b549d94a1d6e35316c6d173`
- Verified B-003 remediation head/run: `527bdeff7840f244d749cd92a81d1eda3fc89017` / `34111887666` — **5/5 SUCCESS**

## Scope and frozen responsibilities

WP-2.4 owns the Venue facts/evidence slice for `FTR-020`: project-scoped typed observations; canonical sources; many-to-many observation/source links; append-oriented evidence history; independent evidence/confidence/freshness/state semantics; protected retained-observation conflict resolution; freshness and observation lifecycle transitions; inherited `venues.read` / `venues.write`, same-project integrity and direct RLS/RPC evidence; and domain/application/Supabase boundaries for later criteria/readiness/UI.

Requirements/evidence anchors: `FAC-002`, WP-2.4 portion of `FAC-003`, `FAC-004..009`, `ACC-015`, `ACC-025..027`, domain invariants 21–26 as applicable, `AUTHZ-001..009`, `AUTHZ-012`, `AUTHZ-017`, `AUTHZ-018`, `AUTHZ-020`, `RLS-MATRIX-V1` Facts/evidence rules.

Explicitly out of scope: WP-2.5 scoring/compatibility/blockers/`evidenceReadiness`; Lot-3 task creation; Lot-4 canonical import/merge/apply; Vendor facts; UI; IndexedDB/offline queue; real wedding data; automatic evidence-ranking winner selection.

## Frozen semantic boundaries

- `unknown`, known-false, `not_applicable` and `conflict` are distinct.
- Evidence strength, confidence, freshness and fact state are independent.
- Historical observations/sources are preserved through supersession, withdrawal, broken links and conflict.
- Observation append never silently overwrites retained truth.
- A retained observation is same-project/same-fact and remains definition-valid.
- Definition edits cannot invalidate persisted typed evidence/history.
- Database/RPC canonical validation must not commit values that the official TypeScript domain/provider parser rejects.

## Pass A — IMPLEMENT

Initial implementation includes domain/application evidence, source, resolution and freshness contracts; Supabase adapters/parsers; `20260907074000_create_venue_fact_evidence.sql`; `20260907083000_add_venue_fact_freshness_transition.sql`; `20260907084500_add_venue_fact_observation_withdrawal.sql`; RLS/grants and direct pgTAP coverage.

Historical Pass-A run `34106264873` on `9f3ca2fb57adf124e50bf8c4888280854c5d846f`: **5/5 SUCCESS**. Pass B subsequently invalidated acceptance readiness.

## Pass B history

### `WP2.4-B-001` — RESOLVED

MAJOR: legacy `set_retained_venue_fact` could bypass observation-backed resolution after evidence existed. Remediation moved the old setter to a client-inaccessible core, added a guarded public wrapper and serialized direct-set versus observation append. Fresh re-review found no remaining direct `known` write-around.

### `WP2.4-B-002` — RESOLVED

MAJOR: definition edits could invalidate persisted observations or conflict-retained typed truth. Remediation validates all non-null retained values and all persisted non-null observation values against proposed definition semantics. Fresh re-review found the definition-update/observation-append lock ordering closes the reviewed race.

First-remediation verification: run `34110071790` on `5e229cada52c9b50ca3b2b820df3ab8291c2960c` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.

### `WP2.4-B-003` — REMEDIATION VERIFIED / FRESH RE-REVIEW PENDING

MAJOR found during the fresh re-review: PostgreSQL/RPC blank-string semantics were weaker than the official TypeScript contract for source titles and conflict-resolution rationale. SQL used default `btrim`, while `normalizeFactSource` / `normalizeFactResolution` use JavaScript `String.trim()`. TAB/NBSP-only input could therefore be accepted/committed by SQL and rejected by the official parser; conflict resolution could also persist an effectively blank required rationale.

Remediation verified at exact head `527bdeff7840f244d749cd92a81d1eda3fc89017`:

- add `public.fact_ecmascript_trim(text)`, an immutable PostgreSQL canonical trim primitive matching the ECMAScript whitespace/line-terminator set used by `String.trim()`;
- add a `sources` canonical-title CHECK using that primitive;
- add a `facts` conflict-resolution nonblank CHECK at the table integrity boundary;
- move source create/update and observation-resolution implementations behind client-inaccessible `*_core` functions;
- expose same-signature protected wrappers: source wrappers canonicalize titles before the previous validation/persistence path; conflict resolution rejects ECMAScript-blank rationale before delegating while preserving legitimate rationale verbatim;
- add `venue_fact_unicode_whitespace_parity_test.sql` covering TAB-only and NBSP-only source titles, source update non-mutation, BOM/ideographic trim parity, TAB/NBSP-only conflict rationale, no partial fact mutation/revision/provenance on rejection, legitimate Unicode values, internal-core privilege denial and privileged table-level blank-rationale write-around denial.

Exact-head verification run `34111887666`: **5/5 SUCCESS**, including Local Supabase DB/RLS with 31 files / 707 pgTAP tests and clean-checkout `npm run verify`.

The packet is now `REVIEW_PENDING`. A fresh independent adversarial Pass B must re-attack the complete WP-2.4 implementation and all three resolved MAJOR classes before Pass C can start; exact-head CI success alone does not constitute acceptance.

Reviewed but not promoted to a finding: withdrawal preserves retained pointer/value by explicit design; frozen contracts require evidence history preservation but do not clearly require automatic retained-truth invalidation, so WP-2.4 does not invent that semantic.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Entry requires a fresh Pass B with no unresolved BLOCKING/MAJOR findings and state `ACCEPTANCE_PENDING`.

## Handoff

```text
Lot: 2 — Venues core
Branch: lot-2/venues-core
Packet: WP-2.4
State: REVIEW_PENDING
Pass: B-ADVERSARIAL-REVIEW — fresh re-review after WP2.4-B-003
Primary Feature: FTR-020
Dependency: WP-2.3 ACCEPTED
Resolved: WP2.4-B-001, WP2.4-B-002
B-003 review failure: c43af7fc93ca36931b549d94a1d6e35316c6d173
B-003 verified remediation: 527bdeff7840f244d749cd92a81d1eda3fc89017 / 34111887666 — 5/5 SUCCESS
Next action: perform fresh independent Pass B across the complete WP-2.4 boundary; if no unresolved BLOCKING/MAJOR findings remain, transition to ACCEPTANCE_PENDING and perform Pass C. Do not start WP-2.5.
```
