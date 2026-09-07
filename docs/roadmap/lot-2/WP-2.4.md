# WP-2.4 — Observations, sources, evidence/confidence/freshness and conflicts

## Identity

- Work Packet ID: `WP-2.4`
- Lot: `2`
- Name: Observations, sources, evidence/confidence/freshness and conflicts
- State: `IN_PROGRESS`
- Current pass: `B-REMEDIATION — WP2.4-B-004 / WP2.4-B-005`
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
- B-004/B-005 remediation implementation head: `e87f1b82059d371159ce1f35f2bafdbb85cdf3fa`

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

### `WP2.4-B-003` — RESOLVED / VERIFIED

MAJOR: PostgreSQL/RPC blank-string semantics were weaker than the official TypeScript contract for source titles and conflict-resolution rationale (`btrim` versus JavaScript `String.trim()`). Remediation added `fact_ecmascript_trim`, canonical source-title and conflict-rationale table constraints, protected wrappers and direct Unicode pgTAP regression coverage.

Exact-head verification run `34111887666` on `527bdeff7840f244d749cd92a81d1eda3fc89017`: **5/5 SUCCESS**, including Local Supabase DB/RLS with 31 files / 707 pgTAP tests and clean-checkout `npm run verify`.

### `WP2.4-B-004` — REMEDIATION IMPLEMENTED / VERIFICATION PENDING

MAJOR: fact-definition canonicalization still used PostgreSQL default `btrim()` while the official TypeScript `normalizeFactDefinition` uses `String.trim()`. ECMAScript-whitespace-only values could be committed for definition metadata and poison the fact context used by WP-2.4.

Remediation at `e87f1b82059d371159ce1f35f2bafdbb85cdf3fa`:

- add ECMAScript-canonical table constraints for fact-definition label, unit and freshness policy;
- replace the B-002 definition trigger body so canonical checks use `fact_ecmascript_trim` without losing retained-value/observation-history validation or system-definition protection;
- move create/update definition implementations behind client-inaccessible `*_core` functions;
- expose same-signature wrappers that canonicalize key/label/unit/freshness with ECMAScript semantics and reject non-null optional fields that collapse to blank;
- add pgTAP coverage for NBSP/BOM/ideographic boundaries, update non-mutation, wrapper canonicalization, core EXECUTE denial and privileged write-around rejection.

### `WP2.4-B-005` — REMEDIATION IMPLEMENTED / VERIFICATION PENDING

MAJOR: PostgreSQL `timestamptz` precision/non-finite semantics were broader than `normalizeFactInstant`; server-generated `resolved_at = now()` and direct evidence/freshness RPC input could therefore create provider-invalid responses or persisted values.

Remediation at `e87f1b82059d371159ce1f35f2bafdbb85cdf3fa`:

- extend the official instant parser to accept ISO timestamps with PostgreSQL microsecond precision (up to six fractional digits) while returning canonical millisecond UTC strings;
- continue rejecting malformed, over-precision and non-finite textual instants;
- add finite-timestamp DB constraints for source `observed_at`, observation `observed_at`, fact `resolved_at`, `last_verified_at` and `stale_at`;
- add domain/provider tests for microsecond source/observation/resolution/freshness responses;
- add direct pgTAP regression proving `infinity` cannot commit, failed freshness leaves revision unchanged, finite microsecond observations persist correctly and normal server-generated resolution remains finite.

Affected verification is stale by design. The next gate is full CI on the exact remediation head; if green, transition to `REVIEW_PENDING` and run another fresh independent Pass B. Do not go directly to Pass C.

## Fresh Pass-B coverage completed so far

Re-reviewed without additional promoted findings: direct known-value setter versus observation append serialization; definition-update versus observation-append locking; freshness versus resolution revision serialization; supersession concurrency; withdrawal versus resolution; same-project source/observation links; retained observation same-fact integrity; append-only observation fields; core-function EXECUTE revocation introduced for B-001/B-003.

Withdrawal preserving an existing retained pointer/value remains reviewed but not promoted to a finding: the frozen contracts preserve evidence history and do not clearly mandate automatic retained-truth invalidation on withdrawal, so WP-2.4 must not invent that semantic.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Entry requires remediation of all open BLOCKING/MAJOR findings, exact-head verification, then another fresh Pass B with no unresolved BLOCKING/MAJOR findings and state `ACCEPTANCE_PENDING`.

## Handoff

```text
Lot: 2 — Venues core
Branch: lot-2/venues-core
Packet: WP-2.4
State: IN_PROGRESS
Pass: B-REMEDIATION — WP2.4-B-004 / WP2.4-B-005
Primary Feature: FTR-020
Dependency: WP-2.3 ACCEPTED
Resolved/verified: WP2.4-B-001, WP2.4-B-002, WP2.4-B-003
B-004/B-005 remediation implementation: e87f1b82059d371159ce1f35f2bafdbb85cdf3fa
Verification: pending exact-head full CI
Last fully verified remediation: 527bdeff7840f244d749cd92a81d1eda3fc89017 / 34111887666 — 5/5 SUCCESS
Next action: verify exact remediation head; if and only if green, transition REVIEW_PENDING and perform another fresh Pass B. Do not start WP-2.5.
```
