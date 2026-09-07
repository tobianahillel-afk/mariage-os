# WP-2.4 — Observations, sources, evidence/confidence/freshness and conflicts

## Identity

- Work Packet ID: `WP-2.4`
- Lot: `2`
- Name: Observations, sources, evidence/confidence/freshness and conflicts
- State: `REVIEW_FAILED`
- Current pass: `REVIEW_FAILED — remediation next`
- Primary bounded context: `facts/evidence` for Venue targets
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Dependencies: `WP-2.3 ACCEPTED`
- Specification gate: **CLOSED** by `c414549d20338bf5180d5afc3681beda56fb11de`
- Specification-gate CI: run `34069692843` — **5/5 SUCCESS**, including clean-checkout `npm run verify`
- Reviewed Pass-A implementation head: `9f3ca2fb57adf124e50bf8c4888280854c5d846f`
- Pass-A implementation CI: run `34106264873` — **5/5 SUCCESS**, including clean-checkout `npm run verify`

## Scope

### Primary Feature

- `FTR-020` — multi-source observations/provenance/conflict.

### Current-lot responsibilities

- persist project-scoped `fact_observations` for Venue facts with normalized typed value when available, optional bounded raw source text, `evidence_level`, independent `confidence`, observation status, observed time, optional import provenance placeholder, note and immutable creator metadata;
- persist project-scoped `sources` with canonical source type, title/URL where applicable, evidence level, observation/retrieval time, notes and lifecycle/status without deleting historical evidence merely because a URL becomes broken or a source is superseded;
- persist same-project many-to-many `observation_sources` links and preserve multiple sources for one observation without duplicating the observation;
- keep observations append-oriented: ordinary clients may append evidence but may not arbitrarily rewrite or hard-delete historical observations; correction/supersession uses a narrow protected transition with explicit same-fact/same-project validation;
- validate every non-null normalized observation value against the referenced `fact_definition` using the same canonical value rules accepted in WP-2.3; nullable normalized value is permitted only as absence of a normalized value and does not invent a retained fact value;
- preserve the frozen semantic separation between `evidence_level`, `confidence`, freshness and fact state; no field is silently derived from another;
- represent `evidence_level` with the frozen initial hierarchy keys: `contractual`, `confirmed_for_event`, `official_general`, `observed`, `third_party`, `estimated`, `unknown_source`;
- represent observation `confidence` independently as exactly `high`, `medium`, `low` or `unknown`;
- retain observed/retrieved timestamps and source/observation lifecycle inputs needed for later freshness/readiness computation; WP-2.4 does not invent the WP-2.5 `evidenceReadiness` formula;
- prevent a newly appended weaker observation from silently overwriting the current retained fact; observation creation and retained-fact resolution are distinct operations;
- support explicit conflict/resolution metadata on `facts`, including `retained_observation_id`, `resolution_note`, `resolved_by`, `resolved_at`, `last_verified_at` and `stale_at`, only through validated same-project/domain transitions;
- allow conflict state to preserve observations even when no safe retained value exists; where an explicitly selected retained observation is used during conflict resolution, its value must remain type-valid and linked to the same fact;
- enforce `venues.read` / `venues.write` authorization, same-project foreign-key/link integrity and direct RLS/RPC allow/deny evidence for all new resources;
- provide domain/application/Supabase parser/adapter boundaries for later criteria/readiness/UI without implementing WP-2.5 behavior.

### Normative evidence/confidence/freshness separation

The pre-implementation stop-condition is resolved and frozen for this packet:

- `evidence_level` describes evidence strength/context/provenance class;
- `confidence` describes certainty in the observation and is one of `high|medium|low|unknown`;
- freshness is temporal applicability derived from timestamps/policy only by an explicit documented rule;
- fact state (`known|unknown|not_applicable|conflict`) is a separate retained-truth state;
- source type is descriptive provenance and does not by itself determine evidence level, confidence, freshness or retained truth;
- no automatic mapping among these axes is introduced by WP-2.4.

### Requirements / acceptance / security

- `FTR-020`;
- `FAC-002`, `FAC-003` WP-2.4 portion, `FAC-004`, `FAC-005`, `FAC-006`, `FAC-007`, `FAC-008`, `FAC-009` provenance foundation;
- `ACC-015`, `ACC-025`, `ACC-026`, `ACC-027`;
- Domain invariants 23, 24, 25 and 26, plus inherited invariants 21 and 22;
- `AUTHZ-001..008`, `AUTHZ-009`, `AUTHZ-012`, `AUTHZ-017`, `AUTHZ-018`, `AUTHZ-020` as applicable;
- `RLS-MATRIX-V1` Facts/evidence rules and direct project-isolation matrix;
- applicable validation/injection/supabase/provider security requirements identified during implementation.

### Explicitly out of scope

- deterministic compatibility evaluation, blockers, weighted score, `evidenceReadiness`, missing-information read model and score explanation — WP-2.5;
- automatic task creation from stale/conflicting evidence — Lot 3;
- canonical Import engine and evidence-aware import merge/apply — Lot 4; WP-2.4 keeps optional import provenance linkage shape only where already frozen;
- Vendor facts/evidence;
- UI, IndexedDB/offline queue and real wedding data;
- automatic evidence-ranking winner selection: the evidence hierarchy remains guidance and may not silently overwrite retained truth.

## Observation/value rule

- an observation belongs to exactly one fact and the same project;
- non-null `value` must validate against that fact's referenced definition;
- `raw_value_text` is evidence/audit context and never enters calculations directly;
- appending an observation does not by itself mutate `facts.retained_value`;
- superseding/withdrawing an observation preserves the historical row;
- source-link changes cannot cross projects or attach evidence to another project's observation;
- a broken/archived source never erases the observation it historically supported.

## Conflict/resolution boundary

WP-2.4 supplies explicit retained-observation/conflict-resolution persistence but does not invent automatic truth selection:

- contradictory observations may coexist indefinitely;
- unresolved conflict may keep `facts.state = conflict` with no retained value;
- explicit resolution may select a same-fact active observation as retained evidence and records actor/time/rationale;
- a retained observation never belongs to another fact/project and its normalized value must remain definition-valid;
- weaker/newer evidence alone never authorizes silent replacement of a stronger retained value;
- future import/criteria layers must call the protected semantics rather than write around them.

## Sizing / cohesion review

This packet is intentionally kept cohesive despite crossing the normal planning threshold.

| Complexity source | Points |
|---|---:|
| facts/evidence bounded-domain extension | 3 |
| three persistent evidence tables | 3 |
| one migration family | 1 |
| new/changed RLS boundary | 2 |
| protected append/supersession/resolution command family | 2+ |
| **Total** | **>10** |

The packet remains unsplit under the orchestration exception because splitting source/link persistence from append/supersession/retained-observation integrity would temporarily create an evidence store whose history or retained-truth relationship could be mutated without the final safety boundary. Pass A maintained repository complexity limits without requiring a split.

## Pass A — IMPLEMENT

### Implementation evidence

Domain/application:

- evidence/source type unions and runtime validators;
- observation/source drafts, canonical normalization and freshness/resolution semantics;
- application services for source persistence, observation append, source linking, explicit retained-observation resolution, freshness transition and observation withdrawal;
- tests for nullable/non-null normalized values, evidence/confidence separation, source lifecycle, history preservation, fail-closed transitions and conflict behavior.

Infrastructure:

- Supabase adapters/parsers with fail-closed response validation and typed safe persistence errors;
- provider mappings reject malformed UUID/revision/shape responses and do not expose raw PostgREST errors;
- separate evidence, freshness and observation-lifecycle adapter/parser boundaries keep protected operations explicit.

Persistence/security:

- `20260907074000_create_venue_fact_evidence.sql`;
- `20260907083000_add_venue_fact_freshness_transition.sql`;
- `20260907084500_add_venue_fact_observation_withdrawal.sql`;
- project-scoped `fact_observations`, `sources`, `observation_sources` and protected `facts` resolution metadata;
- explicit grants/RLS and privileged command boundaries for append/link/resolution/freshness/withdrawal semantics;
- direct pgTAP coverage for evidence persistence, freshness transitions, observation withdrawal, same-project integrity and inherited facts security.

Exact reviewed Pass-A evidence — GitHub Actions run `34106264873` on `9f3ca2fb57adf124e50bf8c4888280854c5d846f`: **5/5 SUCCESS**.

- **Core quality and security: SUCCESS**
  - **79 test files / 807 tests PASS**;
  - measured coverage **100% statements / branches / functions / lines**;
  - typecheck, Prettier, ESLint, architecture/dependency checks, dead-code checks, debt-marker policy, negative quality/security controls, dependency gate and build PASS.
- **Local Supabase DB and RLS: SUCCESS**
  - **29 files / 664 pgTAP tests PASS** after full reset/migration application.
- **Browser and mutation harnesses: SUCCESS**
  - **40/40 Playwright E2E PASS** across Chromium, Firefox, WebKit and mobile Chromium;
  - mutation score **82.50%**, PASS under the repository-configured gate.
- **Privacy-safe preview artifact: SUCCESS**.
- **Full verify from clean checkout: SUCCESS** with `npm run verify`.

Dependency audit continues to report only the previously reviewed two Moderate transitive development-tool advisories; no accepted-known Critical/High vulnerability is introduced by this packet.

### Pass A exit checklist

- [x] all packet-owned schema/resources implemented
- [x] all ordinary and privileged mutation paths had implementation and direct authorization/same-project test evidence at Pass-A exit
- [x] observation values reuse WP-2.3 canonical validation on observation mutation
- [x] append/supersession/withdrawal paths preserve historical rows
- [x] multi-source links preserve one observation with many sources
- [x] observation append is distinct from retained-truth mutation
- [x] conflict/resolution metadata has validated protected transition coverage
- [x] evidence/confidence/freshness remain separate in the implementation contract
- [x] direct DB/RLS security matrix green
- [x] provider/domain tests green
- [x] architecture/static/complexity gates green
- [x] exact implementation HEAD has full CI evidence

Pass A decision was **PASS / REVIEW_PENDING**. Pass B has since invalidated acceptance readiness with MAJOR findings below; affected verification must be rerun after remediation.

## Pass B — ADVERSARIAL REVIEW

Fresh review reconstructed the expected behavior from `FACTS-SOURCES.md`, `CONFIDENCE-FRESHNESS.md`, `INVARIANTS.md`, ADR-0006, `PHYSICAL-SCHEMA-V1.md`, `RLS-MATRIX-V1.md` and the WP-2.4 packet contract rather than trusting Pass-A conclusions.

Review baseline:

- implementation head: `9f3ca2fb57adf124e50bf8c4888280854c5d846f`;
- exact-head CI: `34106264873` — **5/5 SUCCESS**.

### Findings

| Severity | Finding | Evidence / impact | State |
|---|---|---|---|
| MAJOR `WP2.4-B-001` | Legacy `set_retained_venue_fact` remains a write-around for the WP-2.4 observation-resolution boundary. | Once observations/conflicts exist, an authenticated `venues.write` caller can still use the WP-2.3 RPC to set a direct `known` retained value and clear `retained_observation_id`, `resolution_note`, `resolved_by` and `resolved_at`. This can collapse conflict/evidence state without the documented retained-observation resolution path and bypass invariant 26 / protected resolution semantics. | **OPEN** |
| MAJOR `WP2.4-B-002` | Fact-definition edits do not preserve canonical validity of existing observation-backed evidence. | `validate_fact_definition_row` only rejects edits that invalidate `facts.state='known'` retained values. It does not validate non-null `fact_observations.value`, nor non-null retained values allowed for WP-2.4 `state='conflict'`. A custom options/rule edit can therefore leave stored observations/current conflict-retained truth invalid under the referenced current definition and make provider/domain parsing fail closed after the mutation. | **OPEN** |

Reviewed but not promoted to a finding: observation withdrawal currently preserves the retained value/pointer and fact revision by explicit test design. The frozen contract requires history preservation and does not unambiguously require automatic retained-truth invalidation on withdrawal, so Pass B does not invent that behavior. It remains a semantic point for later explicit specification if product requirements change.

Pass B decision: **FAIL / REVIEW_FAILED**. No Pass C may start. The durable next action is bounded WP-2.4 remediation for `WP2.4-B-001..002`, followed by fresh exact-head verification and a fresh independent re-review.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Entry requires a fresh Pass B with no unresolved BLOCKING/MAJOR findings and state `ACCEPTANCE_PENDING`.

## Handoff

```text
Lot: 2 — Venues core
Branch: lot-2/venues-core
Packet: WP-2.4
State: REVIEW_FAILED
Pass: review failed; remediation next
Primary Feature: FTR-020
Dependency: WP-2.3 ACCEPTED
Reviewed Pass-A implementation head: 9f3ca2fb57adf124e50bf8c4888280854c5d846f
Pass-A implementation CI: 34106264873 — 5/5 SUCCESS (invalidated for acceptance by Pass-B MAJOR findings)
Open MAJOR findings: WP2.4-B-001, WP2.4-B-002
Next action: remediate WP2.4-B-001..002 only, rerun exact-head verification, then perform fresh Pass B; do not start WP-2.5
```
