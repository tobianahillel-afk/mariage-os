# WP-2.4 — Observations, sources, evidence/confidence/freshness and conflicts

## Identity

- Work Packet ID: `WP-2.4`
- Lot: `2`
- Name: Observations, sources, evidence/confidence/freshness and conflicts
- State: `REVIEW_FAILED`
- Current pass: `B-ADVERSARIAL-REVIEW — WP2.4-B-006`
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

### `WP2.4-B-006` — OPEN / MAJOR

Fresh independent re-review found a remaining timestamp-domain parity gap. The B-005 database hardening checks only `isfinite(timestamptz)`, while the official TypeScript parser accepts exactly four-digit ISO years. PostgreSQL can represent finite timestamps outside that parser domain, so a direct RPC can still persist a finite value that a provider parser cannot read back. Conversely, `Date.parse` silently normalizes some invalid calendar inputs such as `2026-02-30` before persistence, rather than rejecting the invalid instant.

This violates the frozen WP-2.4 boundary that database/RPC validation must not commit values rejected by the official parser and that canonicalization must not silently change evidence/freshness timestamps.

Required remediation:

- freeze the application instant domain to strict ISO calendar instants with years `0001..9999`, valid month/day/time and bounded offset syntax;
- reject invalid calendar dates rather than relying on permissive `Date.parse` rollover;
- add a database timestamp-domain primitive/constraints so all WP-2.4 persisted evidence/freshness/resolution instants remain inside the same application-readable year range, in addition to being finite;
- add domain/provider tests for invalid calendar dates, year zero/beyond-four-digit inputs and valid PostgreSQL microseconds;
- add direct pgTAP proving finite out-of-domain timestamps cannot commit and failed mutations remain atomic.

Fresh re-review otherwise re-attacked without additional promoted findings: B-001 setter/append serialization, B-002 definition-update/append locking, B-003 source/conflict whitespace parity, B-004 definition whitespace/core bypasses, B-005 non-finite/microsecond handling, freshness/resolution revisions, supersession concurrency, withdrawal/resolution, same-project evidence links, retained-observation integrity, append-only observation fields, direct table grants/RLS and core-function EXECUTE revocation.

Withdrawal preserving an existing retained pointer/value remains reviewed but not promoted: frozen contracts preserve evidence history and do not clearly mandate automatic retained-truth invalidation on withdrawal, so WP-2.4 must not invent that semantic.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Entry is prohibited while `WP2.4-B-006` remains open. After remediation and exact-head verification, another fresh independent Pass B is required before `ACCEPTANCE_PENDING`.

## Handoff

```text
Lot: 2 — Venues core
Branch: lot-2/venues-core
Packet: WP-2.4
State: REVIEW_FAILED
Pass: B-ADVERSARIAL-REVIEW — WP2.4-B-006
Primary Feature: FTR-020
Dependency: WP-2.3 ACCEPTED
Resolved/verified: WP2.4-B-001, WP2.4-B-002, WP2.4-B-003, WP2.4-B-004, WP2.4-B-005
Open MAJOR: WP2.4-B-006
Latest verified remediation: d4d3ce84331d13809b5f7b97ed7bf1a263a2bf4a / 34119950023 — 5/5 SUCCESS
Next action: remediate B-006 only, verify exact head, then fresh independent Pass B. Do not start WP-2.5.
```
