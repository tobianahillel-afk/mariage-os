# WP-2.4 — Observations, sources, evidence/confidence/freshness and conflicts

## Identity

- Work Packet ID: `WP-2.4`
- Lot: `2`
- Name: Observations, sources, evidence/confidence/freshness and conflicts
- State: `REVIEW_PENDING`
- Current pass: `B-ADVERSARIAL-REVIEW — fresh re-review after WP2.4-B-004 / WP2.4-B-005`
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
- Verified B-004/B-005 remediation head/run: `d4d3ce84331d13809b5f7b97ed7bf1a263a2bf4a` / `34119950023` — **5/5 SUCCESS**

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

### `WP2.4-B-001` — RESOLVED / VERIFIED

MAJOR: legacy `set_retained_venue_fact` could bypass observation-backed resolution after evidence existed. Remediation moved the old setter to a client-inaccessible core, added a guarded public wrapper and serialized direct-set versus observation append. Fresh re-review found no remaining direct `known` write-around.

### `WP2.4-B-002` — RESOLVED / VERIFIED

MAJOR: definition edits could invalidate persisted observations or conflict-retained typed truth. Remediation validates all non-null retained values and all persisted non-null observation values against proposed definition semantics. Fresh re-review found the definition-update/observation-append lock ordering closes the reviewed race.

First-remediation verification: run `34110071790` on `5e229cada52c9b50ca3b2b820df3ab8291c2960c` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.

### `WP2.4-B-003` — RESOLVED / VERIFIED

MAJOR: PostgreSQL/RPC blank-string semantics were weaker than the official TypeScript contract for source titles and conflict-resolution rationale (`btrim` versus JavaScript `String.trim()`). Remediation added `fact_ecmascript_trim`, canonical source-title and conflict-rationale table constraints, protected wrappers and direct Unicode pgTAP regression coverage.

Exact-head verification run `34111887666` on `527bdeff7840f244d749cd92a81d1eda3fc89017`: **5/5 SUCCESS**, including Local Supabase DB/RLS with 31 files / 707 pgTAP tests and clean-checkout `npm run verify`.

### `WP2.4-B-004` — RESOLVED / VERIFIED; FRESH RE-REVIEW PENDING

MAJOR: fact-definition canonicalization still used PostgreSQL default `btrim()` while the official TypeScript `normalizeFactDefinition` uses `String.trim()`. ECMAScript-whitespace-only values could be committed for definition metadata and poison the fact context used by WP-2.4.

Remediation:

- ECMAScript-canonical table constraints for fact-definition label, unit and freshness policy;
- definition validation uses `fact_ecmascript_trim` while preserving retained-value/observation-history validation and system-definition protection;
- create/update definition implementations live behind client-inaccessible `*_core` functions;
- same-signature wrappers canonicalize key/label/unit/freshness with ECMAScript semantics and reject optional fields collapsing to blank;
- pgTAP covers NBSP/BOM/ideographic boundaries, update non-mutation, wrapper canonicalization, core EXECUTE denial and privileged write-around rejection.

### `WP2.4-B-005` — RESOLVED / VERIFIED; FRESH RE-REVIEW PENDING

MAJOR: PostgreSQL `timestamptz` precision/non-finite semantics were broader than `normalizeFactInstant`; server-generated `resolved_at = now()` and direct evidence/freshness RPC input could create provider-invalid responses or persisted values.

Remediation:

- official instant parser accepts ISO timestamps with PostgreSQL microsecond precision (up to six fractional digits) and returns canonical millisecond UTC strings;
- malformed, over-precision and non-finite textual instants remain rejected;
- finite-timestamp DB constraints cover source `observed_at`, observation `observed_at`, fact `resolved_at`, `last_verified_at` and `stale_at`;
- domain/provider tests cover microsecond source/observation/resolution/freshness responses;
- pgTAP proves `infinity` cannot commit, failed freshness leaves revision unchanged, finite microsecond observations persist correctly and normal server-generated resolution remains finite.

Exact-head verification run `34119950023` on `d4d3ce84331d13809b5f7b97ed7bf1a263a2bf4a`: **5/5 SUCCESS**. Core includes 80 test files / 811 tests with **100% statements/branches/functions/lines**; Local Supabase DB/RLS, Browser/mutation, privacy-safe preview and clean-checkout `npm run verify` all PASS.

## Fresh Pass-B coverage completed so far

Previously re-reviewed without additional promoted findings: direct known-value setter versus observation append serialization; definition-update versus observation-append locking; freshness versus resolution revision serialization; supersession concurrency; withdrawal versus resolution; same-project source/observation links; retained observation same-fact integrity; append-only observation fields; core-function EXECUTE revocation.

The next action is a **new independent adversarial Pass B across the complete remediated WP-2.4 boundary**, explicitly re-attacking B-001..B-005 and nearby bypass/race/parser/RLS variants. CI success alone does not permit Pass C.

Withdrawal preserving an existing retained pointer/value remains reviewed but not promoted to a finding: the frozen contracts preserve evidence history and do not clearly mandate automatic retained-truth invalidation on withdrawal, so WP-2.4 must not invent that semantic.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Entry requires a fresh Pass B with no unresolved BLOCKING/MAJOR findings and state `ACCEPTANCE_PENDING`.

## Handoff

```text
Lot: 2 — Venues core
Branch: lot-2/venues-core
Packet: WP-2.4
State: REVIEW_PENDING
Pass: B-ADVERSARIAL-REVIEW — fresh re-review after WP2.4-B-004 / WP2.4-B-005
Primary Feature: FTR-020
Dependency: WP-2.3 ACCEPTED
Resolved/verified: WP2.4-B-001, WP2.4-B-002, WP2.4-B-003, WP2.4-B-004, WP2.4-B-005
Latest verified remediation: d4d3ce84331d13809b5f7b97ed7bf1a263a2bf4a / 34119950023 — 5/5 SUCCESS
Next action: fresh independent Pass B across complete WP-2.4; if and only if no BLOCKING/MAJOR remains, transition ACCEPTANCE_PENDING and perform Pass C. Do not start WP-2.5.
```
