# WP-2.4 — Observations, sources, evidence/confidence/freshness and conflicts

## Identity

- Work Packet ID: `WP-2.4`
- Lot: `2`
- Name: Observations, sources, evidence/confidence/freshness and conflicts
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
- Primary bounded context: `facts/evidence` for Venue targets
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Dependencies: `WP-2.3 ACCEPTED`
- Specification gate: **CLOSED** by `c414549d20338bf5180d5afc3681beda56fb11de`
- Specification-gate CI: run `34069692843` — **5/5 SUCCESS**, including clean-checkout `npm run verify`

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

The packet remains unsplit under the orchestration exception because splitting source/link persistence from append/supersession/retained-observation integrity would temporarily create an evidence store whose history or retained-truth relationship could be mutated without the final safety boundary. The implementation must still keep individual modules/functions/RPCs small and independently testable. If Pass A reveals that this cohesion cannot be maintained within repository complexity limits, the packet must be split before declaring `REVIEW_PENDING`.

## Pass A — IMPLEMENT

### Planned implementation evidence

Domain/application:

- evidence/source type unions and runtime validators;
- observation/source drafts and canonical normalization;
- application commands for source persistence, observation append/supersession and explicit retained-observation resolution;
- tests for null/non-null normalized values, evidence/confidence separation, source lifecycle, history preservation and safe conflict behavior.

Infrastructure:

- Supabase adapters/parsers with fail-closed response validation and typed safe persistence errors;
- provider mappings must not leak raw PostgREST errors or collapse authorization/integrity/conflict failures into false success.

Persistence/security:

- ordered migration for `fact_observations`, `sources`, `observation_sources` plus safe extension of `facts` observation/resolution fields;
- explicit grants/RLS and narrow privileged commands where append/supersession/resolution cannot be safely expressed through ordinary table mutation;
- direct pgTAP allow/deny matrix for owner, anon, outsider, project-B, revoked and disallowed-role cases;
- same-project fact/source/observation links and cross-project injection denial;
- append/history immutability and retained-observation validity tests.

Quality:

- unit/property tests for evidence/confidence/status/value validation;
- provider/parser malformed-response tests;
- exact-head `npm run verify` and full CI before Pass A may transition to `REVIEW_PENDING`.

### Pass A exit checklist

- [ ] all packet-owned schema/resources implemented
- [ ] all ordinary and privileged mutation paths enforce authorization and same-project integrity
- [ ] observation values reuse WP-2.3 canonical validation
- [ ] append/supersession preserves history
- [ ] multi-source links preserve one observation with many sources
- [ ] weaker/new evidence cannot silently replace retained truth
- [ ] conflict/resolution metadata is validated and auditable
- [ ] evidence/confidence/freshness remain separate
- [ ] direct DB/RLS security matrix green
- [ ] provider/domain tests green
- [ ] architecture/static/complexity gates green
- [ ] exact implementation HEAD has full CI evidence

When these are all satisfied, transition to `REVIEW_PENDING`; do not self-accept.

## Pass B — ADVERSARIAL REVIEW

Not started. A fresh review must reconstruct expected behavior from the frozen facts/evidence/security contracts after Pass A reaches `REVIEW_PENDING`.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Entry requires Pass B with no unresolved BLOCKING/MAJOR findings and state `ACCEPTANCE_PENDING`.

## Handoff

```text
Lot: 2 — Venues core
Branch: lot-2/venues-core
Packet: WP-2.4
State: IN_PROGRESS
Pass: A-IMPLEMENT
Primary Feature: FTR-020
Dependency: WP-2.3 ACCEPTED
Specification stop-condition: CLOSED at c414549d20338bf5180d5afc3681beda56fb11de
Specification-gate CI: 34069692843 — 5/5 SUCCESS
Next action: implement WP-2.4 only; do not start WP-2.5 concurrently
```
