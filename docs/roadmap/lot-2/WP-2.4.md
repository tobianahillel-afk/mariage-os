# WP-2.4 — Observations, sources, evidence/confidence/freshness and conflicts

## Identity

- Work Packet ID: `WP-2.4`
- Lot: `2`
- Name: Observations, sources, evidence/confidence/freshness and conflicts
- State: `ACCEPTANCE_PENDING`
- Current pass: `C-ACCEPTANCE`
- Primary bounded context: `facts/evidence` for Venue targets
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Dependency: `WP-2.3 ACCEPTED`
- Primary Feature: `FTR-020`
- Specification gate: **CLOSED** by `c414549d20338bf5180d5afc3681beda56fb11de`
- Specification-gate CI: `34069692843` — **5/5 SUCCESS**
- Historical Pass-A head/run: `9f3ca2fb57adf124e50bf8c4888280854c5d846f` / `34106264873` — **5/5 SUCCESS**
- First review-failure record: `3f6a750a97ca039c36dafd3dff5eca69eac683ad`
- Verified first-remediation head/run: `5e229cada52c9b50ca3b2b820df3ab8291c2960c` / `34110071790` — **5/5 SUCCESS**
- B-003 review-failure record: `c43af7fc93ca36931b549d94a1d6e35316c6d173`
- Verified B-003 remediation head/run: `527bdeff7840f244d749cd92a81d1eda3fc89017` / `34111887666` — **5/5 SUCCESS**
- B-004/B-005 remediation implementation head: `e87f1b82059d371159ce1f35f2bafdbb85cdf3fa`
- Verified B-004/B-005 remediation head/run: `d4d3ce84331d13809b5f7b97ed7bf1a263a2bf4a` / `34119950023` — **5/5 SUCCESS**
- Fresh re-review baseline after B-004/B-005: `3ba8575ac32564197d823d7f01001a7b6f75fdfe`
- Verified B-006 remediation head/run: `06c38444a2e859f59f590477bd43c40255463f3e` / `34131416659` — **5/5 SUCCESS**
- Fresh re-review baseline after B-006: `29469d63eccc40d9b9ababd915b974378d3cc990`
- Verified B-007 remediation head/run: `92e0f511d394448ccdcdd3143d29b4f2cf3df987` / `34134876299` — **5/5 SUCCESS**
- Verified B-008 remediation head/run: `4b161f4120cf554395badcc5b05cac79eb018e70` / `34137075923` — **5/5 SUCCESS**
- Final fresh Pass-B reviewed head/run: `93262f9459e720d97a6dfa3a83f84f02f3a02c7c` / `34137822804` — **5/5 SUCCESS**

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

MAJOR: legacy `set_retained_venue_fact` could bypass observation-backed resolution after evidence existed. Remediation moved the old setter to a client-inaccessible core, added a guarded public wrapper and serialized direct-set versus observation append.

### `WP2.4-B-002` — RESOLVED / VERIFIED

MAJOR: definition edits could invalidate persisted observations or conflict-retained typed truth. Remediation validates all non-null retained values and all persisted non-null observation values against proposed definition semantics and closes the reviewed definition-update/append race.

First-remediation verification: run `34110071790` on `5e229cada52c9b50ca3b2b820df3ab8291c2960c` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.

### `WP2.4-B-003` — RESOLVED / VERIFIED

MAJOR: PostgreSQL/RPC blank-string semantics were weaker than the official TypeScript contract for source titles and conflict-resolution rationale. Remediation added ECMAScript trim parity, table constraints, protected wrappers and Unicode pgTAP regression coverage.

Exact-head verification run `34111887666` on `527bdeff7840f244d749cd92a81d1eda3fc89017`: **5/5 SUCCESS**.

### `WP2.4-B-004` — RESOLVED / VERIFIED

MAJOR: fact-definition canonicalization still used PostgreSQL `btrim()` while TypeScript used `String.trim()`. Remediation added ECMAScript-canonical definition constraints/trigger semantics, client-inaccessible definition cores, canonical wrappers and direct pgTAP bypass coverage.

### `WP2.4-B-005` — RESOLVED / VERIFIED

MAJOR: PostgreSQL `timestamptz` microsecond/non-finite semantics were broader than the instant parser. Remediation accepts PostgreSQL microseconds at the TypeScript boundary, canonicalizes to millisecond UTC, rejects non-finite persisted timestamps and adds domain/provider/pgTAP regressions.

Exact-head verification run `34119950023` on `d4d3ce84331d13809b5f7b97ed7bf1a263a2bf4a`: **5/5 SUCCESS**. Core includes 80 test files / 811 tests with **100% statements/branches/functions/lines**; Local Supabase DB/RLS, Browser/mutation, privacy-safe preview and clean-checkout `npm run verify` all PASS.

### `WP2.4-B-006` — RESOLVED / VERIFIED

Fresh independent re-review found a remaining timestamp-domain parity gap. The B-005 database hardening checked only `isfinite(timestamptz)`, while the official TypeScript parser accepted exactly four-digit ISO years. PostgreSQL could represent finite timestamps outside that parser domain, and `Date.parse` could silently normalize invalid calendar inputs such as `2026-02-30`.

Remediation freezes the Facts/evidence instant profile in `docs/domain/DATES-TIME.md`: Gregorian years `0001..9999`, valid calendar/clock components, optional 1..6 fractional digits, `Z|±HH:mm` with absolute offset bounded to `14:00`, no leap-second/`24:00`, and a canonical UTC result that itself remains inside the four-digit-year domain. TypeScript now validates calendar fields before timezone conversion instead of parsing untrusted instant text through permissive `Date.parse`; PostgreSQL keeps microsecond precision while provider/domain reads canonicalize to milliseconds without rounding.

Migration `20260907142000_harden_venue_fact_timestamp_domain.sql` adds a client-inaccessible application-domain primitive and CHECK constraints to `sources.observed_at`, `fact_observations.observed_at`, `facts.resolved_at`, `facts.last_verified_at` and `facts.stale_at`. Domain/provider regressions cover impossible calendar values, year/offset boundaries and valid PostgreSQL microseconds. Direct pgTAP covers finite out-of-domain RPC/table write-arounds and failed-mutation atomicity.

Exact-head verification run `34131416659` on `06c38444a2e859f59f590477bd43c40255463f3e`: **5/5 SUCCESS**, including Core quality/security, Local Supabase DB/RLS, Browser/mutation, privacy-safe preview and clean-checkout `npm run verify`.

### `WP2.4-B-007` — RESOLVED / VERIFIED

The fresh independent Pass B after B-006 found that the public source/observation/freshness RPCs accepted temporal parameters as PostgreSQL `timestamptz`. PostgreSQL parsed an RPC JSON string into `timestamptz` before the function body and intentionally accepted date/time input syntaxes broader than the frozen TypeScript instant grammar. A non-canonical input rejected by `normalizeFactInstant` could therefore be coerced into a valid timestamp before WP-2.4 validation saw the original representation.

Remediation in `20260907150000_harden_venue_fact_rpc_timestamp_grammar.sql` moves the public create/update-source, append-observation and freshness temporal boundaries to raw `text`, validates the frozen `YYYY-MM-DDTHH:mm:ss[.ffffff](Z|±HH:mm)` Gregorian/calendar/offset/year-domain profile before constructing `timestamptz`, and keeps the typed timestamp implementations behind client-inaccessible cores. Nullable source/freshness semantics and PostgreSQL microsecond storage remain preserved.

`venue_fact_rpc_timestamp_grammar_review_test.sql` attacks PostgreSQL-friendly non-canonical raw strings, offset variants, create/update/append/freshness atomicity and core privileges while retaining canonical/microsecond/null positive cases. Historical pgTAP helpers were updated to cross the same raw-text public boundary rather than relying on pre-cast `timestamptz` values.

Exact-head verification run `34134876299` on `92e0f511d394448ccdcdd3143d29b4f2cf3df987`: **5/5 SUCCESS**, including Core quality/security, Local Supabase DB/RLS (`db:verify`), Browser E2E/mutation, privacy-safe preview and clean-checkout `npm run verify`.

### `WP2.4-B-008` — RESOLVED / VERIFIED

Fresh independent Pass B found an observation/source-link canonicality bypass. The official application service accepts `isPrimary` only when `typeof value === "boolean"`; `null` returns `invalid_primary_flag`. The direct authenticated RPC previously persisted `NULL` as `false` through `coalesce(target_is_primary, false)`, so a value rejected by the official TypeScript boundary could be silently committed.

Remediation in `20260907162000_harden_venue_fact_link_primary_parity.sql` moves the pre-hardening implementation behind client-inaccessible `link_venue_fact_observation_source_primary_core(...)` and places a canonical public wrapper in front of it that rejects `NULL` with SQLSTATE `22023` before mutation. `venue_fact_link_primary_parity_review_test.sql` proves the core is not executable by `authenticated`, rejected `NULL` leaves no link, canonical `false` creates exactly one relationship, and canonical `true` updates that same relationship without duplication.

Exact-head verification run `34137075923` on `4b161f4120cf554395badcc5b05cac79eb018e70`: **5/5 SUCCESS**, including Core quality/security, Local Supabase DB/RLS (`db:verify`), Browser E2E/mutation, privacy-safe preview and clean-checkout `npm run verify`.

### Final fresh independent re-review after B-008

Fresh Pass B reconstructed WP-2.4 from the frozen Facts/provenance, authorization, instant/canonicality and acceptance contracts rather than trusting the remediation history. It re-attacked:

- observation append/supersession and withdrawal lifecycle, including row locking, append-only history and cross-operation interleavings;
- retained-observation resolution, revision checks, same-fact/project integrity and conflict-rationale canonicality;
- source create/update semantics, expected-revision serialization, source classes/status and broken-source retention;
- independent evidence-level, confidence, freshness and fact-state semantics;
- direct table privileges/RLS and same-project authorization for observations, sources and observation/source links;
- public RPC versus TypeScript canonical boundaries, including nullability, enums, free-form bounded strings, URLs, timestamps and `isPrimary`;
- client-inaccessible cores introduced by B-003/B-004/B-007/B-008;
- the apparent PostgreSQL `bigint` versus JavaScript safe-integer revision-domain difference: ordinary authenticated clients cannot directly mutate evidence/fact revisions, and supported RPCs only increment serialized server-owned revisions from 1, so no supported client-controlled invalid canonical row is reachable through that theoretical bound mismatch;
- `ACC-015`, `ACC-025`, `ACC-026` and `ACC-027`: conflicting observations remain preserved, one observation can retain multiple same-project sources, weaker evidence cannot silently overwrite retained truth, and a broken source does not delete historical evidence.

Reviewed non-finding retained from earlier review: withdrawal may leave an existing retained observation pointer/value. Frozen contracts preserve evidence history and do not mandate automatic retained-truth invalidation on withdrawal; inventing that semantic remains prohibited.

Final fresh reviewed HEAD `93262f9459e720d97a6dfa3a83f84f02f3a02c7c` has GitHub Actions run `34137822804`: **5/5 SUCCESS** — Core quality/security, Local Supabase DB/RLS, Browser E2E/mutation, privacy-safe preview and clean-checkout `npm run verify` all PASS.

Fresh Pass B decision: **PASS — `WP2.4-B-001..008` are resolved/verified and no unresolved BLOCKING/MAJOR finding remains.**

## Pass C — ACCEPTANCE / RECONCILIATION

Current state: `ACCEPTANCE_PENDING`.

Pass C must mechanically compare EXPECTED vs IMPLEMENTED vs VERIFIED for every WP-2.4 responsibility, confirm `WP2.4-B-001..008` remain closed, reconcile `FAC-002`, the WP-2.4 portion of `FAC-003`, `FAC-004..009`, `ACC-015`, `ACC-025..027`, applicable authorization/RLS obligations and packet scope fences, and only then mark WP-2.4 `ACCEPTED`.

If Pass C changes production code, affected verification and a fresh Pass B must be repeated. Documentation-only reconciliation does not alter the implementation/review HEAD evidence, but its diff and durable cursor must be inspected before acceptance.

## Handoff

```text
Lot: 2 — Venues core
Branch: lot-2/venues-core
Packet: WP-2.4
State: ACCEPTANCE_PENDING
Pass: C-ACCEPTANCE
Primary Feature: FTR-020
Dependency: WP-2.3 ACCEPTED
Resolved/verified: WP2.4-B-001, WP2.4-B-002, WP2.4-B-003, WP2.4-B-004, WP2.4-B-005, WP2.4-B-006, WP2.4-B-007, WP2.4-B-008
Open BLOCKING/MAJOR: none
Final fresh Pass-B reviewed head/run: 93262f9459e720d97a6dfa3a83f84f02f3a02c7c / 34137822804 — 5/5 SUCCESS
Next action: WP-2.4 Pass C acceptance/reconciliation only. WP-2.5 remains prohibited until WP-2.4 is ACCEPTED.
```
