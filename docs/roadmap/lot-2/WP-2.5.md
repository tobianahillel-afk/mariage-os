# WP-2.5 — Deterministic criteria, blockers, score/readiness and missing information

## Identity

- Work Packet ID: `WP-2.5`
- Lot: `2`
- Name: Deterministic criteria, blockers, score/readiness and missing information
- State: `BLOCKED`
- Current pass: `PLAN`
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

Requirements / acceptance anchors: `FAC-006`, `FAC-008`, `FAC-010`, `FAC-011`, `FAC-013`, `VEN-007`, `VEN-010`, `VEN-011`, `ACC-022`, `ACC-023`, `ACC-028`, domain invariants 18, 19 and 27 as applicable.

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

Frozen V1 semantics are an unweighted critical-information readiness ratio over applicable `blocking|important` criteria. A criterion contributes one ready unit only when the fact is known/canonical, has an active retained observation, is not explicitly stale at `evaluatedAt`, and has a valid evaluation rule. Explicit `NOT_APPLICABLE` is excluded; zero denominator returns `null`. Evidence level/confidence/source strength remain independent axes and are not silently converted into readiness weights.

Exact specification-gate CI run `34143567491`: **5/5 SUCCESS**, including Core quality/security, Local Supabase DB/RLS, Browser/mutation, privacy-safe preview and clean-checkout `npm run verify`.

### Gate B — `custom_manual_assessment.accepted` representation — CLOSED

Closed by the same exact-head specification commit/run above.

Frozen V1 rule shape is exactly `{ "type": "custom_manual_assessment", "accepted": ... }` for `boolean`, `select` and `rating`; `accepted` must validate through the same canonical value boundary as the referenced definition and PASS requires strict canonical equality. Threshold/set semantics use dedicated rules instead of overloading this rule.

Pass A must harden TypeScript and PostgreSQL validators together; the currently accepted WP-2.3 implementation still recognizes the pre-gate `{type}`-only shape and must not be seeded/executed with the new rule until both boundaries and parity tests are updated.

### `WP2.5-S-001` — BLOCKING — dynamic project-target guest-count rule is under-specified

The frozen criteria contract requires `project_target_guest_count_supported` and explicitly requires a `dynamic target guest-count change` test, but it does not define the authoritative support/capacity input or derivation formula.

The repository currently supplies several semantically distinct possible inputs and explicitly forbids conflating them:

- `projects.target_guest_count` is the project-level target;
- `capacity_seated_advertised` is commercial advertised capacity;
- `venue_spaces.capacity_seated` is scoped to an individual physical space;
- `two_dance_areas_max_guest_estimate` is a couple-specific comfort estimate;
- `target_guest_count_supported` is catalogued as `boolean/dynamic`;
- `VEN-004` / invariant 17 require commercial capacity scope to remain distinct from couple suitability;
- the dependency graph says target guest-count changes recompute deterministic outputs and may mark prior human suitability assessments for review without rewriting history.

No governing contract currently chooses among those inputs, defines composition/precedence, or defines how the dynamic criterion behaves when required capacity/suitability data is unknown, conflicting, stale or not applicable. No prior repository/project decision located during the pre-implementation audit closes this gap.

#### Unsafe interpretations explicitly prohibited while this finding is open

Pass A must **not** silently choose any of the following as normative behavior:

- `capacity_seated_advertised >= project.target_guest_count`;
- maximum `venue_spaces.capacity_seated >= project.target_guest_count`;
- `two_dance_areas_max_guest_estimate >= project.target_guest_count`;
- treating the retained `target_guest_count_supported` boolean as eternally valid after the target count changes;
- combining any of the above with an undocumented precedence/fallback;
- inventing a scenario override before the Lot-5 scenario contract is available to this packet.

Any such choice could change a blocking Venue decision and would therefore be material product semantics, not an implementation detail.

#### Resolution condition

Before WP-2.5 may enter `READY` / Pass A, a governing criteria/domain contract must freeze, at minimum:

1. the authoritative input(s) used by `project_target_guest_count_supported`;
2. exact PASS/FAIL/UNKNOWN/CONFLICT/NOT_APPLICABLE behavior for missing/conflicting/stale inputs;
3. behavior when `projects.target_guest_count` is null;
4. whether the result is an ephemeral derived evaluation or a persisted/reviewable fact, consistent with invariant 27;
5. how project target changes invalidate/recompute the result without rewriting evidence history;
6. how current Lot-2 project-target semantics remain extensible to later named scenario guest counts without pre-implementing Lot 5;
7. explicit separation between commercial capacity and couple-specific wedding suitability;
8. deterministic tests covering the dependency change and boundary values.

The specification repair must receive exact-head full CI before Pass A starts.

## Sizing review

Sizing remains provisional until `WP2.5-S-001` is resolved because the dynamic rule may change the required read-model inputs/interfaces.

Known complexity sources after unblocking:

- changed bounded domain: criteria/compatibility;
- one migration family to align evaluation-rule validation where required;
- no new authoritative compatibility table is planned; compatibility/readiness remain derived;
- no new public/unauthenticated capability surface;
- no UI route in this packet;
- no automatic task creation;
- no offline/sync semantics owned here.

If blocker resolution requires a new persistent context entity or additional bounded domain, packet sizing must be recomputed before moving to `READY`.

## Expected vertical slice after unblocking

- domain: canonical rule validation/evaluation, blocking aggregation, weighted score, readiness and explanations;
- application: project/venue compatibility query/read-model service and missing-information guidance;
- infrastructure: project/fact/observation inputs loaded through authorized project-scoped adapters; no compatibility authority cache;
- database: only boundary/validation changes required to preserve TypeScript↔PostgreSQL canonicality; no authoritative score/readiness column;
- tests: unit/property/mutation plus provider/DB parity where schema validators change; dynamic dependency tests; explanation reconstruction;
- documentation/status: exact packet evidence and lifecycle transitions.

## Pass A — IMPLEMENT

**Not started. Prohibited while `WP2.5-S-001` remains open.**

No WP-2.5 production code, migration or default-criteria seeding is acceptance evidence yet.

## Pass B — ADVERSARIAL REVIEW

Not started. Pass B may begin only after a completed, fully verified Pass A reaches `REVIEW_PENDING`.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Pass C may begin only from `ACCEPTANCE_PENDING` after a fresh Pass B with no unresolved BLOCKING/MAJOR finding.

## Handoff

- Current state: `BLOCKED`
- Current/next pass: `PLAN`
- Last green verification: specification commit `5fd9be01f4da192d9d47b2d48944134fd15e471a`, CI `34143567491` — **5/5 SUCCESS**
- Closed specification gates: `evidenceReadiness`; `custom_manual_assessment.accepted`
- Remaining blocker/finding: `WP2.5-S-001` — BLOCKING dynamic guest-target support semantics
- Next permitted action: resolve `WP2.5-S-001` in the governing criteria/domain contract, obtain exact-head full CI, then move WP-2.5 to `READY`. Do not begin Pass A or WP-2.6 concurrently.