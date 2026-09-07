# WP-2.5 — Deterministic criteria, blockers, score/readiness and missing information

## Identity

- Work Packet ID: `WP-2.5`
- Lot: `2`
- Name: Deterministic criteria, blockers, score/readiness and missing information
- State: `REVIEW_FAILED`
- Current pass: `B-ADVERSARIAL-REVIEW — WP2.5-B-001 / WP2.5-B-002`
- Primary bounded context: `facts/criteria` and Venue compatibility read models
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Dependencies: `WP-2.3 ACCEPTED`, `WP-2.4 ACCEPTED`
- Primary Features: `FTR-021`, Lot-2 responsibility of `FTR-022`
- Verified Pass-A implementation head/run: `aef7bea53e9db32790ab19c3fffdd0a8f63dc89d` / `34158303997` — **5/5 SUCCESS**
- Fresh Pass-B reviewed head/run: `3948060eb541ae2ae3eac6f5b1a7e702eb057e64` / `34159043613` — **5/5 SUCCESS**, review decision still **FAIL** because green CI does not satisfy the missing normative behavior below.

## Scope and current-lot responsibilities

WP-2.5 owns the deterministic Venue criteria slice for:

- explicit criterion evaluation from retained fact state/value plus valid `evaluation_rule_json`;
- blocking aggregation where FAIL/CONFLICT/UNKNOWN cannot be hidden by weighted score;
- deterministic weighted compatibility score and reconstructible explanation;
- deterministic completeness / `evidenceReadiness` read model;
- missing/stale/conflicting/configuration-incomplete information guidance;
- dynamic recomputation when an already-frozen dependency changes;
- pure/read-model behavior that never rewrites historical facts or observations merely because criteria/project assumptions changed.

Requirements / acceptance anchors: `FAC-006`, `FAC-008`, `FAC-010`, `FAC-011`, `FAC-013`, `VEN-007`, `VEN-010`, `VEN-011`, `ACC-022`, `ACC-023`, `ACC-028`, domain invariants 17, 18, 19 and 27 as applicable. Security validation anchors for provider/read boundaries include `SEC-VAL-001`, `SEC-VAL-008` and regression obligation `SEC-VER-005`.

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

**COMPLETE / VERIFIED.** Production implementation remained bounded to WP-2.5 and no WP-2.6 responsibility was started.

Implementation completed the frozen order:

1. hardened `custom_manual_assessment.accepted` in TypeScript and PostgreSQL with canonical parity coverage;
2. restricted `project_target_guest_count_supported` to the canonical derived-key semantics rather than arbitrary boolean definitions;
3. rejected retained-fact / observation writes for the system-derived target-support criterion at supported TypeScript and PostgreSQL boundaries;
4. implemented pure ordinary/dynamic criterion evaluation, blocker aggregation, weighted score, readiness, deterministic reason/explanation models and missing-information guidance;
5. added the authorized Venue compatibility read-model port/adapter without persisting compatibility authority;
6. verified dynamic target changes, source-evidence readiness and derived-data non-mutation;
7. obtained exact-head full CI on the implementation head before transition to `REVIEW_PENDING`.

### Implementation evidence

- domain/code: `criterion-types.ts`, `derived-fact-definition.ts`, `fact-evaluation-rule.ts`, `criterion-rule-evaluators.ts`, `criterion-evaluation.ts`, `criterion-aggregate.ts`, `criterion-readiness.ts`, `criterion-guidance.ts`, plus the supported derived-fact write guard;
- application: `venue-compatibility-query-port.ts` and `venue-compatibility-service.ts` provide a pure project/venue compatibility read model with optional caller-supplied target override and no persisted score/readiness authority;
- infrastructure: `parse-venue-compatibility-inputs.ts` and `supabase-venue-compatibility-query-adapter.ts` load project-scoped definitions/facts/retained evidence through the existing authorized Supabase boundary;
- migration/schema: `20260907181500_harden_venue_criteria_boundaries.sql` hardens canonical criteria-rule and system-derived write boundaries without introducing a compatibility table or elevated client capability;
- DB evidence: `venue_criteria_boundaries_test.sql` plus the full existing pgTAP corpus validate direct database boundaries and inherited project isolation;
- tests: exact clean-checkout verification has **94 test files / 911 tests PASS** at **100% statements/branches/functions/lines**; Local Supabase reset and **36 pgTAP files / 795 tests PASS**; Browser E2E **40/40 PASS** across Chromium, Firefox, WebKit and mobile Chromium; mutation harness gate PASS; build and privacy-safe preview PASS;
- exact implementation verification: head `aef7bea53e9db32790ab19c3fffdd0a8f63dc89d`, GitHub Actions run `34158303997` — **5/5 SUCCESS**, including clean-checkout `npm run verify`;
- FIR-equivalent durable record: this packet record carries frozen semantics, implementation boundaries, exact verification evidence and lifecycle state.

Pass A decision: **PASS — implementation complete and fully verified; packet entered fresh independent Pass B.**

## Pass B — ADVERSARIAL REVIEW

Fresh review baseline: `3948060eb541ae2ae3eac6f5b1a7e702eb057e64`. Transition CI `34159043613`: **5/5 SUCCESS**. Pass B deliberately did not treat that green run as acceptance evidence.

### `WP2.5-B-001` — MAJOR — dynamic compatibility explanation is not reconstructible from the read model

**Finding.** `VenueCompatibilityQuery` already accepts an explicit `targetGuestCountOverride`, but `VenueCompatibilityReadModel` returns only the numeric/null `targetGuestCount`. It does not expose whether the target came from `projects.target_guest_count` or an explicit evaluation context. It also does not expose an explicit dynamic dependency explanation containing the support-source key, retained source state/value and per-derived-criterion source freshness/readiness state.

**Normative mismatch.** `CRITERIA-EVALUATION-DYNAMIC-GUEST-COUNT-ADDENDUM.md` §8–§10 requires the derived readiness numerator/denominator and dynamic result to be exactly reconstructible, and requires the compatibility read model to expose at least target value **and target source**, support source key, source retained state/value, result/comparison, source freshness/readiness state and deterministic non-evaluable reason. The existing `evaluations + aggregate + readiness + guidance` output does not preserve target provenance and cannot fully reconstruct those dependency details, especially when a caller supplies an override or the support fact is not ready.

**Impact.** Two evaluations with the same numeric target but different provenance (`project` versus explicit context) are observationally indistinguishable to consumers. Later scenario-context use can therefore be presented as project truth, and the mandated explanation cannot be reconstructed reliably even though the PASS/FAIL arithmetic itself is correct.

**Required remediation.** Add an explicit, immutable dynamic guest-count explanation/read-model component that identifies target source (`project` versus explicit evaluation context), canonical support-source key, support retained state/value, observation/freshness/readiness state, numeric comparison when available, outcome and deterministic reason. Preserve the existing formula and non-mutation behavior. Regression tests must prove project provenance, explicit-context provenance (including equal numeric values), missing/conflict/stale cases, comparison reconstruction and unchanged source truth.

### `WP2.5-B-002` — MAJOR — malformed provider response can alias one retained observation across multiple facts

**Finding.** `expectedObservationFacts()` stores `retainedObservationId -> factId` in a `Map` without rejecting an already-present observation ID; later facts silently overwrite earlier ownership. `retainedObservationIds()` likewise deduplicates repeated retained IDs before the observation query. A malformed provider response containing two different facts that both reference the same retained observation can therefore be accepted if the single returned observation matches the last mapped fact, after which `snapshots()` assigns that same observation status to both facts.

**Normative/security mismatch.** Legitimate PostgreSQL state prevents this relation because retained-fact validation requires the retained observation to belong to the same fact. The Supabase response is nevertheless an untrusted runtime boundary. `SEC-VAL-001` P0 requires schema/type validation at every untrusted runtime boundary; `SEC-VAL-008` P0 forbids validation failure from falling through to permissive defaults. A relationally impossible provider response must fail closed rather than silently aliasing evidence. `SEC-VER-005` requires a regression test once discovered.

**Impact.** A malformed/compromised/stale provider response can falsely mark evidence active for a second fact and can inflate `evidenceReadiness` or change missing-information guidance. This is silent compatibility/readiness corruption at the trust boundary even though such a state cannot be produced through valid database mutations.

**Required remediation.** Reject duplicate non-null `retained_observation_id` ownership across different fact rows both when collecting retained observation IDs and when building expected observation ownership inside the full parser. Add regression tests that demonstrate the formerly accepted alias and prove fail-closed behavior; keep duplicate observation response rows and missing/wrong-fact checks intact.

### Reviewed surfaces with no additional BLOCKING/MAJOR finding in this pass

- blocking severity and weighted-score denominator/default-weight semantics;
- `NOT_APPLICABLE`, bonus and unknown/conflict score treatment;
- canonical rule validator/evaluator direction and manual-assessment parity;
- derived-key write protection in TypeScript/PostgreSQL and legacy-row evidence rejection;
- dynamic `T <= M` formula, null/invalid target handling and no advertised/per-space capacity fallback;
- stale known source preserving semantic PASS/FAIL while readiness becomes not-ready;
- explicit conflict state versus resolved `known` state semantics;
- project-scoped RLS/GRANT model and database same-fact retained-observation integrity.

Pass B decision on reviewed head: **FAIL — `WP2.5-B-001` and `WP2.5-B-002` are unresolved MAJOR findings.**

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Pass C may begin only from `ACCEPTANCE_PENDING` after remediation, exact-head verification and a **fresh independent Pass B** with no unresolved BLOCKING/MAJOR finding.

## Handoff

- Current state: `REVIEW_FAILED`
- Current pass: `B-ADVERSARIAL-REVIEW — WP2.5-B-001 / WP2.5-B-002`
- Verified Pass-A implementation head/run: `aef7bea53e9db32790ab19c3fffdd0a8f63dc89d` / `34158303997` — **5/5 SUCCESS**
- Fresh reviewed head/run: `3948060eb541ae2ae3eac6f5b1a7e702eb057e64` / `34159043613` — **5/5 SUCCESS**, review decision FAIL
- Open WP-2.5 BLOCKING/MAJOR findings: `WP2.5-B-001 MAJOR`, `WP2.5-B-002 MAJOR`
- Next permitted action: remediate **B-001 and B-002 only**, add regressions, obtain exact-head full CI, transition back to `REVIEW_PENDING`, then perform a fresh independent Pass B. Do not start WP-2.6 concurrently.
