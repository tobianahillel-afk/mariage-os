# WP-2.5 — Deterministic criteria, blockers, score/readiness and missing information

## Identity

- Work Packet ID: `WP-2.5`
- Lot: `2`
- Name: Deterministic criteria, blockers, score/readiness and missing information
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
- Primary bounded context: `facts/criteria` and Venue compatibility read models
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Dependencies: `WP-2.3 ACCEPTED`, `WP-2.4 ACCEPTED`
- Primary Features: `FTR-021`, Lot-2 responsibility of `FTR-022`

## Scope and current-lot responsibilities

WP-2.5 owns the deterministic Venue criteria slice for:

- explicit criterion evaluation from retained fact state/value plus valid `evaluation_rule_json`;
- blocking aggregation where FAIL/CONFLICT/UNKNOWN cannot be hidden by weighted score;
- deterministic weighted compatibility score and reconstructible explanation;
- deterministic completeness / `evidenceReadiness` read model;
- missing/stale/conflicting/configuration-incomplete information guidance;
- dynamic recomputation when an already-frozen dependency changes;
- pure/read-model behavior that never rewrites historical facts or observations merely because criteria/project assumptions changed.

Requirements / acceptance anchors: `FAC-006`, `FAC-008`, `FAC-010`, `FAC-011`, `FAC-013`, `VEN-007`, `VEN-010`, `VEN-011`, `ACC-022`, `ACC-023`, `ACC-028`, domain invariants 17, 18, 19 and 27 as applicable.

Explicitly out of scope:

- automatic Task creation/workflow (Lot 3);
- full Budget/scenario engine (Lot 5);
- Vendor compatibility (Lot 7 responsibility beyond reusable pure primitives);
- Venue UI workspace (WP-2.11);
- offline/IndexedDB integration (WP-2.10/2.12);
- real wedding data/default-criteria migration (Lot 12).

## Pre-implementation specification gates

### Gate A — deterministic `evidenceReadiness` — CLOSED

Closed by `5fd9be01f4da192d9d47b2d48944134fd15e471a` in `docs/domain/CRITERIA-EVALUATION.md`.

Frozen V1 semantics are an unweighted critical-information readiness ratio over applicable `blocking|important` criteria. An ordinary criterion contributes one ready unit only when the fact is known/canonical, has an active retained observation, is not explicitly stale at `evaluatedAt`, and has a valid evaluation rule. Explicit `NOT_APPLICABLE` is excluded; zero denominator returns `null`. Evidence level/confidence/source strength remain independent axes and are not silently converted into readiness weights.

Exact specification-gate CI run `34143567491`: **5/5 SUCCESS**, including Core quality/security, Local Supabase DB/RLS, Browser/mutation, privacy-safe preview and clean-checkout `npm run verify`.

### Gate B — `custom_manual_assessment.accepted` representation — CLOSED

Closed by the same exact-head specification commit/run above.

Frozen V1 rule shape is exactly `{ "type": "custom_manual_assessment", "accepted": ... }` for `boolean`, `select` and `rating`; `accepted` must validate through the same canonical value boundary as the referenced definition and PASS requires strict canonical equality. Threshold/set semantics use dedicated rules instead of overloading this rule.

Pass A must harden TypeScript and PostgreSQL validators together; the accepted WP-2.3 implementation still recognizes the pre-gate `{type}`-only shape and must not be seeded/executed with the new rule until both boundaries and parity tests are updated.

### Gate C / `WP2.5-S-001` — dynamic project-target guest-count semantics — RESOLVED / VERIFIED

The blocker was resolved by normative addendum `docs/domain/CRITERIA-EVALUATION-DYNAMIC-GUEST-COUNT-ADDENDUM.md`, commit `01136a7694141fd21c6067dcc4a1eb876e89080a`.

Exact specification-gate CI run `34146113235`: **5/5 SUCCESS**, including Core quality/security, Local Supabase DB/RLS, Browser/mutation, privacy-safe preview and clean-checkout `npm run verify`.

Frozen semantics:

- Lot-2 evaluation target is `projects.target_guest_count`; a later caller may explicitly inject a scenario target without changing the formula or mutating project/fact truth;
- the authoritative couple-specific support ceiling is the same Venue's retained `two_dance_areas_max_guest_estimate`, not advertised capacity or a venue-space capacity fallback;
- canonical target `T` and ceiling `M`: `T <= M` → PASS, `T > M` → FAIL;
- null target, absent/unknown/not-applicable/invalid support ceiling or invalid configuration → UNKNOWN with deterministic reason; unresolved source conflict → CONFLICT;
- explicit staleness does not rewrite semantic PASS/FAIL but makes readiness not-ready and must surface stale guidance;
- `target_guest_count_supported` is system-derived and is not independently writable authoritative fact/evidence;
- the dynamic criterion's readiness uses the source ceiling's active retained observation/freshness instead of requiring duplicate derived evidence;
- project target changes auto-recompute the derived result without rewriting historical facts/observations; human context-bound assessments may separately need review under `DEPENDENCY-GRAPH.md`;
- commercial capacity and couple-specific wedding suitability remain distinct under `VEN-004` / invariant 17.

All previously listed unsafe fallbacks are prohibited by the addendum. `WP2.5-S-001` is closed at specification level; no unresolved pre-implementation BLOCKING/MAJOR finding remains.

## Sizing review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| new/changed bounded domain | 1 | 3 | 3 |
| persistent entity/table | 0 | 1 | 0 |
| migration family | 1 | 1 | 1 |
| RPC/public endpoint/capability command | 0 | 2 | 0 |
| RLS/privileged authorization boundary | 0 new | 2 | 0 |
| major UI route/workflow | 0 | 1 | 0 |
| public/unauthenticated capability surface | 0 | 2 | 0 |
| external provider integration | 0 | 3 | 0 |
| offline/sync semantics | 0 | 2 | 0 |
| security-sensitive token/crypto boundary | 0 | 2 | 0 |
| financial/calculation critical engine | 0 | 3 | 0 |
| backup/import/version migration semantics | 0 | 2 | 0 |
| **Total** |  |  | **4** |

The migration family hardens already-owned fact-definition / retained-fact / observation boundaries; it does not introduce a new authoritative compatibility table or new privilege model.

## Expected vertical slice

- domain: canonical rule validation/evaluation, blocking aggregation, weighted score, readiness and explanations;
- application: project/venue compatibility query/read-model service and missing-information guidance;
- infrastructure: project/fact/observation inputs loaded through authorized project-scoped adapters; no compatibility authority cache;
- database: boundary/validation changes required to preserve TypeScript↔PostgreSQL canonicality and derived-key non-writability; no authoritative score/readiness column;
- tests: unit/property/mutation plus provider/DB parity where schema validators change; dynamic dependency tests; explanation reconstruction;
- documentation/status: exact packet evidence and lifecycle transitions.

## Pass A — IMPLEMENT

**IN PROGRESS.** Production implementation is now permitted only inside WP-2.5.

Implementation order:

1. harden `custom_manual_assessment.accepted` in TypeScript and PostgreSQL with canonical parity tests;
2. restrict `project_target_guest_count_supported` to the canonical derived-key semantics rather than arbitrary boolean definitions;
3. reject retained-fact / observation writes for the system-derived target-support criterion at supported TypeScript and PostgreSQL boundaries;
4. implement pure ordinary/dynamic criterion evaluation, blocker aggregation, weighted score, readiness, deterministic reason/explanation models and missing-information guidance;
5. add the authorized Venue compatibility read-model port/adapter without persisting compatibility authority;
6. verify dynamic target changes and derived-data non-mutation;
7. obtain exact-head full CI before moving to `REVIEW_PENDING`.

### Implementation evidence

- code/modules: pending
- migrations/schema: pending
- tests added: pending
- FIRs updated: pending
- docs/status updated: Pass A cursor opened on status board and packet record

## Pass B — ADVERSARIAL REVIEW

Not started. Pass B may begin only after a completed, fully verified Pass A reaches `REVIEW_PENDING`.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Pass C may begin only from `ACCEPTANCE_PENDING` after a fresh Pass B with no unresolved BLOCKING/MAJOR finding.

## Handoff

- Current state: `IN_PROGRESS`
- Current/next pass: `A-IMPLEMENT`
- Last green verification: dynamic specification commit `01136a7694141fd21c6067dcc4a1eb876e89080a`, CI `34146113235` — **5/5 SUCCESS**
- Closed specification gates: `evidenceReadiness`; `custom_manual_assessment.accepted`; `WP2.5-S-001` dynamic guest-target support semantics
- Remaining pre-implementation blocker/finding: none
- Next permitted action: implement WP-2.5 Pass A only, beginning with canonical validation and derived-data write boundaries. Do not start WP-2.6 concurrently.