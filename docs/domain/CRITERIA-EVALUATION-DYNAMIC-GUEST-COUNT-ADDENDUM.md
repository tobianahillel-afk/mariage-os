# Criteria Evaluation — Dynamic Guest-Count Addendum

Status: **Normative V1 addendum to `CRITERIA-EVALUATION.md`**

Purpose: close the pre-implementation ambiguity recorded as `WP2.5-S-001` for the `project_target_guest_count_supported` rule without conflating commercial venue capacity with the couple-specific wedding configuration.

If this addendum and `CRITERIA-EVALUATION.md`, `DEFAULT-CRITERIA.md` or older explanatory prose differ for the behavior defined below, this addendum controls for `project_target_guest_count_supported` and the associated derived `target_guest_count_supported` criterion.

This addendum does not broaden Lot 2 into Budget/scenario implementation and does not change historical fact/evidence semantics.

---

## 1. Stable keys and semantic roles

The existing V1 keys remain stable:

- `capacity_seated_advertised`: commercial/marketing seated capacity. It is descriptive/commercial evidence and is **not** the couple-specific suitability ceiling.
- `venue_spaces.capacity_seated`: capacity of one identified physical space. It remains scoped to that space and is **not** an implicit wedding-configuration suitability result.
- `single_large_reception_room`: independent blocking criterion for the one-shared-room requirement.
- `two_dance_areas_feasible`: independent human/observed blocking assessment for feasibility of two distinct dance areas in the same shared reception room.
- `two_dance_areas_max_guest_estimate`: authoritative V1 **couple-specific estimated comfortable maximum guest count for the required shared-room / two-dance-area reception configuration**.
- `target_guest_count_supported`: system-derived blocking criterion that answers whether the current evaluation guest-count target is within that couple-specific maximum.

`two_dance_areas_max_guest_estimate` is a sourceable numeric fact, not a commercial-capacity alias. Its retained observation may be based on a layout plan, measurements, visit assessment, venue confirmation or other evidence captured through the Facts/evidence subsystem. Its provenance/confidence/freshness remain visible and independent.

No implementation may silently populate or overwrite `two_dance_areas_max_guest_estimate` from advertised capacity or from the maximum of venue-space capacities.

---

## 2. Rule representation

The V1 rule payload remains exactly:

```json
{ "type": "project_target_guest_count_supported" }
```

It is valid only for the system-defined `target_guest_count_supported` Venue criterion. The historical rule name remains stable even when a later Lot evaluates the same semantics against an explicit scenario target.

The rule is a **cross-input derived evaluation**, not an ordinary comparison against a retained boolean fact value.

The authoritative inputs are:

1. an explicit evaluation-context guest-count target; and
2. the retained state/value/evidence metadata of the same Venue's `two_dance_areas_max_guest_estimate` fact.

For Lot 2, the evaluation-context guest-count target is `projects.target_guest_count`.

Lot 5 may later call the same pure rule with a named scenario's explicit guest-count assumption. That later caller changes only the evaluation context; it must not change the rule formula, rewrite project settings, or mutate historical Venue facts. WP-2.5 must not query or invent a Budget scenario itself.

---

## 3. Derived-result persistence boundary

`target_guest_count_supported` is derived under domain invariant 27.

Therefore:

- it is calculated in the compatibility/read-model engine;
- it is not independently editable authoritative truth;
- no retained `facts` value or `fact_observation` may be created for the system-defined `target_guest_count_supported` definition through supported mutation paths;
- any legacy/pre-hardening retained row for that system-derived definition is not an evaluation input and must not silently override the derived result;
- Pass A must enforce this boundary in TypeScript and PostgreSQL mutation paths before default seeding/execution can make the criterion writable.

A rebuildable cache may be introduced only under the general derived-data contract and is not authoritative.

---

## 4. Deterministic outcome

Let:

- `T` = explicit evaluation-context target guest count;
- `M` = canonically retained value of `two_dance_areas_max_guest_estimate` for the Venue.

Both counts use non-negative safe-integer people semantics. `M` must also satisfy the source definition's numeric validation.

Evaluation proceeds in this order.

### 4.1 Target dependency

- If `T` is absent/null: result is `UNKNOWN`, reason `missing_target_guest_count`.
- If `T` is present but invalid: configuration/input error; result fails safe as `UNKNOWN`, reason `invalid_target_guest_count`. It never PASSes by coercion.

`T = 0` is valid and follows the ordinary comparison. No positive default is invented.

### 4.2 Source-definition/configuration dependency

The same project must expose exactly one applicable system definition for `two_dance_areas_max_guest_estimate` with numeric people semantics expected by this addendum.

If that dependency definition is missing, duplicated, incompatible or otherwise cannot be resolved canonically, result is `UNKNOWN`, reason `configuration_incomplete`.

### 4.3 Source fact state

For the Venue's `two_dance_areas_max_guest_estimate` source fact:

- missing fact row or `unknown` → `UNKNOWN`;
- unresolved `conflict` → `CONFLICT`;
- `not_applicable` → `UNKNOWN`, reason `support_ceiling_not_applicable`;
- `known` with malformed/non-canonical retained value → `UNKNOWN`, reason `invalid_support_ceiling`;
- `known` with canonical retained numeric value → compare as below.

`NOT_APPLICABLE` is deliberately **not** propagated to the derived blocking criterion while a guest-count target exists. Capacity support is applicable to the wedding decision; an unavailable support ceiling means the answer is not established, not that the requirement disappeared.

### 4.4 Numeric comparison

For canonical `T` and `M`:

```text
T <= M  => PASS
T >  M  => FAIL
```

The comparison is inclusive at the boundary.

There is no tolerance, rounding, interpolation or conversion.

### 4.5 Freshness/evidence

Explicit staleness of the retained source fact does not mutate its semantic state or the deterministic numeric comparison. A stale known ceiling can therefore still reconstruct the same PASS/FAIL result, while readiness becomes not-ready and explanation/missing-information guidance must surface `stale`.

Evidence level, observation confidence and source type likewise do not change the numeric comparison. They remain separate evidence axes and may generate warnings/guidance under their owning contracts.

This preserves the V1 separation between compatibility outcome and evidence readiness.

---

## 5. No commercial-capacity fallback

The following are forbidden fallback inputs for this dynamic rule:

- `capacity_seated_advertised`;
- maximum/minimum/first `venue_spaces.capacity_seated`;
- cocktail capacity;
- raw area/dimension heuristics;
- a previously persisted `target_guest_count_supported` boolean;
- any undocumented precedence across those values.

Commercial and per-space capacities remain useful evidence/read-model columns and can surface separate warnings, but they do not determine this couple-specific blocking rule.

This directly preserves `VEN-004` and domain invariant 17.

---

## 6. Relationship to the other blocking criteria

The dynamic guest-count result does not subsume the other wedding-configuration requirements.

Examples:

- `single_large_reception_room=false` remains its own blocking FAIL even if `T <= M`;
- `two_dance_areas_feasible=false` remains its own blocking FAIL even if `T <= M`;
- `external_caterer_allowed=false` remains its own blocking FAIL regardless of capacity;
- a high weighted score never masks any of those blockers.

`M` answers only the guest-count ceiling for the required shared-room/two-dance-area configuration. Other blockers remain independently explainable.

---

## 7. Dependency changes and history

Changing `projects.target_guest_count`:

- AUTO_RECOMPUTES the derived `target_guest_count_supported` result from the same retained source ceiling;
- does not rewrite `two_dance_areas_max_guest_estimate`, observations or sources;
- does not rewrite commercial capacities;
- may independently MARK_REVIEW context-bound human assessments such as `two_dance_areas_feasible` when their assessment basis no longer matches, according to `DEPENDENCY-GRAPH.md`.

Example with retained `M = 170`:

```text
T = 160 => PASS
T = 170 => PASS
T = 171 => FAIL
T = null => UNKNOWN
```

This is deterministic recomputation, not evidence mutation.

A later scenario guest-count change applies the same four-line semantics to that explicit scenario evaluation context without mutating project-level or historical inputs.

---

## 8. Evidence readiness for the derived criterion

The ordinary readiness rule in `CRITERIA-EVALUATION.md` expects a criterion's own retained fact/evidence. Because `target_guest_count_supported` is deliberately derived and must not have its own retained fact, this addendum defines the sole V1 exception.

The derived criterion remains one `blocking` denominator unit whenever it is configured/applicable.

Its `ready_i = 1` only when all are true:

1. `T` is present and canonical;
2. the dynamic evaluation rule/configuration and source definition are valid;
3. the source `two_dance_areas_max_guest_estimate` fact is `known` with a canonical retained value;
4. that source fact has a non-null retained observation belonging to the same project/fact and currently `active`;
5. the source fact is not explicitly stale at `evaluatedAt`.

Otherwise `ready_i = 0`.

The derived criterion does not require or permit a duplicate retained observation of its own. Explanation must identify the source criterion and dependency reason so the readiness numerator/denominator remains exactly reconstructible.

---

## 9. Missing-information / explanation requirements

The compatibility read model must expose enough information to explain this derived criterion, including at least:

- evaluated target guest count and target source (`project` in Lot 2; explicit scenario context later);
- support source key `two_dance_areas_max_guest_estimate`;
- support source retained state/value;
- PASS/FAIL/UNKNOWN/CONFLICT result;
- boundary comparison when numeric inputs exist;
- source freshness/readiness state;
- deterministic reason code for a non-evaluable result.

Missing target, missing/unknown support ceiling, conflict, staleness and configuration errors feed the deterministic missing-information guidance owned by WP-2.5. The engine suggests review information only; it does not silently create Lot-3 Tasks.

---

## 10. Required tests

Before WP-2.5 acceptance, tests must prove at least:

- target below, equal to and above retained support ceiling;
- `T = 0` boundary;
- null target → UNKNOWN;
- invalid target → fail-safe UNKNOWN/input error;
- missing/unknown source ceiling → UNKNOWN;
- source conflict → CONFLICT;
- source `not_applicable` → UNKNOWN, never blocking PASS;
- malformed source value → UNKNOWN;
- stale known source keeps deterministic PASS/FAIL but contributes zero readiness and surfaces stale guidance;
- commercial advertised capacity higher/lower than the support ceiling does not affect the dynamic result;
- unrelated venue-space capacities do not affect the dynamic result;
- changing project target recomputes result without mutating source fact/observations;
- retained `target_guest_count_supported` writes are rejected through supported TypeScript and PostgreSQL mutation paths;
- any pre-existing derived-key retained row cannot override calculation;
- readiness uses the source fact/evidence under the derived-criterion exception and does not require duplicate derived evidence;
- later evaluation-context injection can substitute an explicit scenario target without changing source facts or formula;
- explanation reconstructs target, support ceiling, comparison, outcome and readiness deterministically.

---

## 11. WP-2.5 specification-gate decision

This addendum resolves `WP2.5-S-001` at specification level once committed on the active Lot-2 branch and verified by the required exact-head CI.

No Pass-A implementation may rely on this addendum until that exact-head specification CI is green. After green verification, durable packet/status records may transition WP-2.5 from `BLOCKED` to `READY`; implementation then begins through normal Pass A and must enforce all TypeScript/PostgreSQL/derived-data boundaries above.