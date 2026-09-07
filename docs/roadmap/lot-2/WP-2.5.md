# WP-2.5 — Deterministic criteria, blockers, score/readiness and missing information

## Identity

- Work Packet ID: `WP-2.5`
- Lot: `2`
- Name: Deterministic criteria, blockers, score/readiness and missing information
- State: `ACCEPTANCE_PENDING`
- Current pass: `C-ACCEPTANCE — reconciliation pending`
- Primary bounded context: `facts/criteria` and Venue compatibility read models
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Dependencies: `WP-2.3 ACCEPTED`, `WP-2.4 ACCEPTED`
- Primary Features: `FTR-021`, Lot-2 responsibility of `FTR-022`
- Verified Pass-A implementation head/run: `aef7bea53e9db32790ab19c3fffdd0a8f63dc89d` / `34158303997` — **5/5 SUCCESS**
- Prior fresh Pass-B reviewed head/run: `3948060eb541ae2ae3eac6f5b1a7e702eb057e64` / `34159043613` — **5/5 SUCCESS**, review decision **FAIL** on `WP2.5-B-001` and `WP2.5-B-002`.
- Verified remediation head/run: `68439bb0d152c60197fc8ae05f416300b3a81c35` / `34161773557` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.
- Fresh post-remediation reviewed head/run: `7eecdbfbf986d26faa2f7d98e67db2a674fdd3e2` / `34162443907` — **5/5 SUCCESS**, review decision **FAIL** on `WP2.5-B-003`.
- Verified B-003 remediation head/run: `3ce8ddf6e14a25efc71d928def52efe2314d72ba` / `34163426797` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.
- Fresh post-B-003 reviewed head/run: `441d300c8de92b310fd84184dab708b55750b2fb` / `34164290470` — **5/5 SUCCESS**, review decision **FAIL** on `WP2.5-B-004`.
- Verified B-004 remediation head/run: `589f82ca5735e9a27064697957bd3250c852c592` / `34165218864` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.
- Final fresh Pass-B reviewed head/run: `65410a3dc032208644911f29e79b70bd49e89277` / `34165826166` — **5/5 SUCCESS**, review decision **PASS**.

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

Prior fresh review baseline: `3948060eb541ae2ae3eac6f5b1a7e702eb057e64`. Transition CI `34159043613`: **5/5 SUCCESS**. That review deliberately did not treat green CI as acceptance evidence and returned **FAIL** on the two MAJOR findings below.

### `WP2.5-B-001` — MAJOR — RESOLVED / VERIFIED — dynamic compatibility explanation was not reconstructible from the read model

**Historical finding.** `VenueCompatibilityQuery` already accepted an explicit `targetGuestCountOverride`, but `VenueCompatibilityReadModel` returned only the numeric/null `targetGuestCount`. It did not expose whether the target came from `projects.target_guest_count` or an explicit evaluation context. It also did not expose an explicit dynamic dependency explanation containing the support-source key, retained source state/value and per-derived-criterion source freshness/readiness state.

**Normative mismatch.** `CRITERIA-EVALUATION-DYNAMIC-GUEST-COUNT-ADDENDUM.md` §8–§10 requires the derived readiness numerator/denominator and dynamic result to be exactly reconstructible, and requires the compatibility read model to expose at least target value **and target source**, support source key, source retained state/value, result/comparison, source freshness/readiness state and deterministic non-evaluable reason. The pre-remediation `evaluations + aggregate + readiness + guidance` output did not preserve target provenance and could not fully reconstruct those dependency details, especially when a caller supplied an override or the support fact was not ready.

**Remediation.** The read model now exposes immutable `targetGuestCountSource` provenance (`project` versus `explicit_context`) and an explicit `dynamicGuestCountExplanation` with target source/value, canonical support-source key, support retained state/value, retained observation status, stale boundary/freshness, readiness, numeric comparison when available, outcome and deterministic reason. Regression coverage proves project provenance, explicit-context provenance including equal numeric values, missing/conflict/stale/invalid-input cases, comparison reconstruction and unchanged source truth.

**Verification.** Remediation is included in exact verified head `68439bb0d152c60197fc8ae05f416300b3a81c35`, run `34161773557` — **5/5 SUCCESS**.

### `WP2.5-B-002` — MAJOR — RESOLVED / VERIFIED — malformed provider response could alias one retained observation across multiple facts

**Historical finding.** `expectedObservationFacts()` stored `retainedObservationId -> factId` in a `Map` without rejecting an already-present observation ID; later facts silently overwrote earlier ownership. `retainedObservationIds()` likewise deduplicated repeated retained IDs before the observation query. A malformed provider response containing two different facts that both referenced the same retained observation could therefore be accepted if the single returned observation matched the last mapped fact, after which `snapshots()` assigned that same observation status to both facts.

**Normative/security mismatch.** Legitimate PostgreSQL state prevents this relation because retained-fact validation requires the retained observation to belong to the same fact. The Supabase response is nevertheless an untrusted runtime boundary. `SEC-VAL-001` P0 requires schema/type validation at every untrusted runtime boundary; `SEC-VAL-008` P0 forbids validation failure from falling through to permissive defaults. A relationally impossible provider response must fail closed rather than silently aliasing evidence. `SEC-VER-005` requires a regression test once discovered.

**Remediation.** Duplicate non-null retained-observation ownership across distinct facts is now rejected fail-closed while collecting retained observation IDs and again while building expected observation ownership inside the full parser. Regression coverage demonstrates the formerly accepted alias and proves rejection without weakening the existing duplicate observation-row, missing-observation and wrong-fact checks.

**Verification.** Remediation is included in exact verified head `68439bb0d152c60197fc8ae05f416300b3a81c35`, run `34161773557` — **5/5 SUCCESS**.

### Verified remediation evidence

- remediation code remained bounded to WP-2.5; WP-2.6 was not started;
- Core quality/security: **SUCCESS**; **94 test files / 924 tests PASS**, **100% statements/branches/functions/lines**, static quality, dependency audit and build PASS;
- Local Supabase DB/RLS: **36 pgTAP files / 795 tests PASS** after clean reset;
- Browser/mutation: E2E PASS and mutation gate PASS;
- privacy-safe preview artifact: PASS;
- full verification from clean checkout: `npm run verify` PASS;
- exact remediation head/run: `68439bb0d152c60197fc8ae05f416300b3a81c35` / `34161773557` — **5/5 SUCCESS**.

### Reviewed surfaces with no additional BLOCKING/MAJOR finding in the prior pass

- blocking severity and weighted-score denominator/default-weight semantics;
- `NOT_APPLICABLE`, bonus and unknown/conflict score treatment;
- canonical rule validator/evaluator direction and manual-assessment parity;
- derived-key write protection in TypeScript/PostgreSQL and legacy-row evidence rejection;
- dynamic `T <= M` formula, null/invalid target handling and no advertised/per-space capacity fallback;
- stale known source preserving semantic PASS/FAIL while readiness becomes not-ready;
- explicit conflict state versus resolved `known` state semantics;
- project-scoped RLS/GRANT model and database same-fact retained-observation integrity.

### Fresh independent post-remediation Pass B

Reviewed head `7eecdbfbf986d26faa2f7d98e67db2a674fdd3e2`; exact CI `34162443907`: **5/5 SUCCESS**, including clean-checkout `npm run verify`. The review re-read the dynamic addendum, compatibility service/read model, query port/adapter, provider parser, criterion evaluation/aggregate/readiness/guidance, evaluation-rule boundary and PostgreSQL derived-write hardening. B-001 and B-002 remediations remain effective, but the fresh review found the new MAJOR finding below. Green CI is therefore not treated as a Pass-B PASS.

### `WP2.5-B-003` — MAJOR — RESOLVED / VERIFIED — duplicate fact primary-key identity could be silently projected as multiple criteria

**Historical finding.** `parseFacts()` keyed its internal `Map` by `definition_id` and rejected an unknown or repeated definition, but it did not enforce uniqueness of the parsed fact record's own `id`. A malformed Supabase/provider response could therefore return two fact rows with different valid `definition_id` values but the same valid `facts.id`. If the two rows used distinct retained-observation IDs, and both observation rows pointed to that same fact ID, `expectedObservationFacts()` and `observationStatuses()` accepted the relation. `snapshots()` then projected the two rows as two independent criterion snapshots even though PostgreSQL could never contain two distinct `facts` rows sharing one primary key.

**Impact.** The compatibility engine could silently double-project one impossible fact identity under multiple definitions and use the fabricated snapshots in blocker evaluation, weighted score, guidance and `evidenceReadiness`. This was not merely a provider-format cosmetic issue: it could alter decision-support output and readiness counts from a relationally impossible network response.

**Normative/security mismatch.** Network/Supabase responses are explicitly untrusted under `INPUT-VALIDATION.md` and `SECURITY-CONTROL-BASELINE.md`. Validation must include semantic/domain invariants after syntax validation, and failure must not fall through to a permissive interpretation. This finding is the same class of fail-closed relational-boundary defect as B-002 and implicates `SEC-VAL-001`, `SEC-VAL-008` and regression obligation `SEC-VER-005`. PostgreSQL primary-key uniqueness is defense in depth, not permission for the runtime provider parser to accept a response shape the database cannot represent.

**Red-first reproduction.** Test-only commit `6e382a02de227306952199828479e442d507e710` added the otherwise-valid two-definition / one-shared-`fact.id` provider response with distinct retained observations. Exact run `34163182953` failed as intended on that regression before any production fix, while the prior unit corpus remained green.

**Remediation.** `parseFacts()` now validates each retained fact through the existing canonical row parser, tracks the parsed fact record IDs centrally and rejects a repeated `fact.id` fail-closed before snapshot projection. Existing definition uniqueness, retained-observation ownership, project/venue identity and observation-status checks remain intact. No database migration was added because PostgreSQL already enforces fact primary-key uniqueness.

**Verification.** The functional guard was introduced in `1405490854d94b15d0e2129730a48b1c6815f55f`; that run stopped at the repository formatting gate before unit execution, so it is not used as behavioral verification. The formatting-only follow-up produced final remediation head `3ce8ddf6e14a25efc71d928def52efe2314d72ba`. Exact run `34163426797` is **5/5 SUCCESS**: Core quality/security including the B-003 regression, Local Supabase DB/RLS, Browser/mutation, privacy-safe preview and full clean-checkout `npm run verify` all passed.

Historical fresh Pass B decision on reviewed head `7eecdbfbf986d26faa2f7d98e67db2a674fdd3e2`: **FAIL — `WP2.5-B-003 MAJOR` was open.** No other new BLOCKING/MAJOR finding was identified in the reviewed score/blocker, dynamic formula, readiness/guidance, derived-write or project-isolation surfaces. B-003 is now **RESOLVED / VERIFIED**, so the packet returned to `REVIEW_PENDING` for another fresh independent Pass B; that remediation did not itself constitute a Pass-B PASS.

### Fresh independent Pass B after B-003 remediation

Reviewed head `441d300c8de92b310fd84184dab708b55750b2fb`; exact CI `34164290470`: **5/5 SUCCESS**, including clean-checkout `npm run verify`. The review re-read the deterministic criteria/readiness contracts, dynamic guest-count addendum, ordinary/dynamic evaluators, aggregate/readiness/guidance, compatibility service/read model, Supabase provider parser/adapter, TypeScript definition mutation service, PostgreSQL criteria boundary migration and pgTAP parity coverage. B-001, B-002 and B-003 remain effective, but the fresh review found the new MAJOR finding below. Green CI is therefore not treated as a Pass-B PASS.

### `WP2.5-B-004` — MAJOR — RESOLVED / VERIFIED — update mutation did not enforce the reserved dynamic-rule boundary in TypeScript

**Historical finding.** `createVenueFactDefinition()` rejected `project_target_guest_count_supported` rules before persistence by checking `isDynamicGuestRule()`. `updateVenueFactDefinition()` normalized the draft and validated revision, but did not apply that same reserved-rule guard before calling `port.updateDefinition()`. Because generic `normalizeFactDefinition()` accepts the dynamic rule for a boolean definition, an ordinary boolean definition could therefore be submitted through the TypeScript update service with `{ "type": "project_target_guest_count_supported" }` and reach persistence.

**Why this was not closed by PostgreSQL.** `20260907181500_harden_venue_criteria_boundaries.sql` correctly rejected the dynamic rule on any noncanonical key, so authoritative database corruption was prevented. That DB defense did not make the application boundary canonical: the same invalid semantic mutation was rejected deterministically before the port on create, but was allowed through the TypeScript update boundary and became a backend integrity/persistence failure on update.

**Normative mismatch / impact.** WP-2.5 explicitly owns TypeScript↔PostgreSQL canonicality for criteria rules and Pass A claims the dynamic rule is restricted to the canonical derived-key semantics rather than arbitrary boolean definitions. The frozen criteria gate also requires TypeScript and PostgreSQL validation to be hardened together. The prior update path violated that parity and made validity depend on which mutation path was used. It could not corrupt PostgreSQL, but it was a material deterministic-boundary defect and lacked the required regression proving fail-closed application behavior.

**Required remediation.** Add a red-first application regression proving that an update draft carrying the reserved dynamic rule is rejected as `invalid_evaluation_rule` without calling the update port. Implement the minimal shared/symmetric guard so both create and update mutation paths reject reserved dynamic-rule writes before persistence, without weakening the canonical system seed/read-model behavior or changing PostgreSQL. Run exact-head full verification and then return to another fresh independent Pass B. No WP-2.6 work is permitted concurrently.

**Red-first reproduction.** Test-only commit `0d996515d5541cb6af1e9986bd6e833b8057fb32` added the update-service regression requiring `{ ok: false, error: "invalid_evaluation_rule" }` and proving the update port is not called. Exact run `34165097206` failed as intended on that single new regression before any production fix; **925 prior tests passed** and typecheck/static/quality-negative/security-negative controls were green before the unit failure.

**Remediation.** `updateVenueFactDefinition()` now applies the same `isDynamicGuestRule()` rejection as `createVenueFactDefinition()` immediately after canonical normalization and before revision validation or persistence. The invalid reserved-rule mutation therefore fails deterministically at the TypeScript application boundary and the update port is not called. No PostgreSQL or broader criteria behavior changed.

**Verification.** Final remediation head `589f82ca5735e9a27064697957bd3250c852c592`, exact run `34165218864`: **5/5 SUCCESS**. Core quality/security passed with **94/94 test files, 926/926 tests and 100% statements/branches/functions/lines**; Local Supabase DB/RLS passed; Browser E2E and mutation passed; privacy-safe preview passed; full clean-checkout `npm run verify` passed.

Historical fresh Pass B decision on reviewed head `441d300c8de92b310fd84184dab708b55750b2fb`: **FAIL — `WP2.5-B-004 MAJOR` was open.** No other new BLOCKING/MAJOR finding was identified in the reviewed provider-integrity, score/blocker, dynamic formula/explanation, readiness/guidance, derived-fact write, PostgreSQL isolation or prior-remediation surfaces. B-004 is now **RESOLVED / VERIFIED**, so the packet returned to `REVIEW_PENDING` for another fresh independent Pass B; this remediation did not itself constitute a Pass-B PASS.

### Fresh independent Pass B after B-004 remediation

Reviewed head `65410a3dc032208644911f29e79b70bd49e89277`; exact CI `34165826166`: **5/5 SUCCESS**, including clean-checkout `npm run verify`. The review independently re-read the frozen criteria/evidenceReadiness contract, dynamic guest-count addendum, ordinary/dynamic evaluation, blocker aggregation, weighted-score denominator, readiness/guidance, dynamic explanation/provenance, TypeScript create/update mutation boundaries, authorized Supabase compatibility adapter/provider parser, PostgreSQL validation/write protections and `venue_criteria_boundaries_test.sql`.

B-001 through B-004 remain effective. The provider parser still fails closed on impossible retained-observation ownership and duplicate fact identities; the reserved dynamic rule is rejected symmetrically by ordinary TypeScript create/update mutations and by PostgreSQL canonical-shape protection; derived facts/evidence remain read-only; dynamic `T <= M` evaluation uses only the canonical couple-specific support source; staleness changes readiness/guidance without rewriting semantic truth; blocking status remains independent from weighted score; and compatibility recomputation does not persist or rewrite fact/observation authority.

The review also rechecked `FAC-006`, `FAC-008`, `FAC-010`, `FAC-011`, `FAC-013`, `VEN-007`, `VEN-010`, `VEN-011`, `ACC-022`, `ACC-023` and `ACC-028`. No unresolved BLOCKING/MAJOR mismatch was found. Green CI is used only as verification evidence, not as the basis of the review verdict.

Pass B decision: **PASS — no unresolved BLOCKING/MAJOR finding remains on the verified reviewed state. Packet transitions to `ACCEPTANCE_PENDING`.**

## Pass C — ACCEPTANCE / RECONCILIATION

**PENDING.** Pass C must reconcile the bounded WP-2.5 responsibilities against the Lot-2 coverage matrix and objective evidence. The documentary `ACCEPTANCE_PENDING` transition must receive exact-head full CI before the final acceptance decision. WP-2.6 remains prohibited until WP-2.5 is `ACCEPTED`.

## Handoff

- Current state: `ACCEPTANCE_PENDING`
- Current pass: `C-ACCEPTANCE — reconciliation pending`
- Verified Pass-A implementation head/run: `aef7bea53e9db32790ab19c3fffdd0a8f63dc89d` / `34158303997` — **5/5 SUCCESS**
- Prior fresh reviewed head/run: `3948060eb541ae2ae3eac6f5b1a7e702eb057e64` / `34159043613` — **5/5 SUCCESS**, review decision FAIL
- Verified remediation head/run: `68439bb0d152c60197fc8ae05f416300b3a81c35` / `34161773557` — **5/5 SUCCESS**
- Fresh post-remediation reviewed head/run: `7eecdbfbf986d26faa2f7d98e67db2a674fdd3e2` / `34162443907` — **5/5 SUCCESS**, review decision FAIL
- B-003 red-first proof: `6e382a02de227306952199828479e442d507e710` / `34163182953` — expected regression FAILURE before fix
- Verified B-003 remediation head/run: `3ce8ddf6e14a25efc71d928def52efe2314d72ba` / `34163426797` — **5/5 SUCCESS**
- Fresh post-B-003 reviewed head/run: `441d300c8de92b310fd84184dab708b55750b2fb` / `34164290470` — **5/5 SUCCESS**, review decision FAIL
- B-004 red-first proof: `0d996515d5541cb6af1e9986bd6e833b8057fb32` / `34165097206` — expected regression FAILURE before fix
- Verified B-004 remediation head/run: `589f82ca5735e9a27064697957bd3250c852c592` / `34165218864` — **5/5 SUCCESS**
- Final fresh Pass-B reviewed head/run: `65410a3dc032208644911f29e79b70bd49e89277` / `34165826166` — **5/5 SUCCESS**, review decision **PASS**
- `WP2.5-B-001`: **RESOLVED / VERIFIED**
- `WP2.5-B-002`: **RESOLVED / VERIFIED**
- `WP2.5-B-003`: **RESOLVED / VERIFIED**
- `WP2.5-B-004`: **RESOLVED / VERIFIED**
- Open BLOCKING/MAJOR findings: **∅**
- Next permitted action: obtain exact-head full CI for this `ACCEPTANCE_PENDING` transition, then perform Pass C responsibility reconciliation. Do not start WP-2.6 concurrently.