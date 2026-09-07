# Criteria Evaluation and Compatibility

Status: **Normative V1 criteria/score contract**

## Purpose

Mariage OS distinguishes:

- a fact's current retained value;
- the couple's desired/acceptable rule for that fact;
- the criterion's priority;
- whether the criterion passes/fails/is unknown;
- an optional weighted non-blocking score.

A criterion cannot be evaluated correctly from `priority` alone.

---

# 1. Criterion definition

Each `fact_definition` can include an `evaluation_rule_json` matching a supported rule type.

Priority remains one of:

- `blocking`;
- `important`;
- `bonus`;
- `informational`.

Terms such as `blocking-negative` or `important-negative` are **not** separate priorities. Negative preference is expressed by evaluation rule.

## Supported V1 evaluation rules

### `boolean_equals`

```json
{ "type": "boolean_equals", "expected": true }
```

Example: `external_caterer_allowed` expects `true`.

```json
{ "type": "boolean_equals", "expected": false }
```

Example: `exclusive_caterer` expects `false`.

### `number_min`

```json
{ "type": "number_min", "minimum": 180 }
```

### `number_max`

```json
{ "type": "number_max", "maximum": 60 }
```

### `number_range`

```json
{ "type": "number_range", "minimum": 150, "maximum": 220 }
```

### `rating_min`

```json
{ "type": "rating_min", "minimum": 7.5 }
```

### `select_in`

```json
{ "type": "select_in", "accepted": ["low", "medium"] }
```

### `select_not_in`

```json
{ "type": "select_not_in", "rejected": ["high"] }
```

### `time_at_or_after`

Used for music end time/curfew where later is better. Time comparison includes documented day offset.

```json
{ "type": "time_at_or_after", "time": "01:00", "dayOffset": 1 }
```

### `time_at_or_before`

For deadlines/constraints where earlier is preferred when semantically appropriate.

### `money_max`

```json
{
  "type": "money_max",
  "maximum": { "minor": 1200000, "currency": "EUR" }
}
```

Money conversion between currencies is not implicit in V1.

### `project_target_guest_count_supported`

Dynamic rule used by `target_guest_count_supported`; derives expectation from current project/scenario target rather than hardcoding a number into the criterion.

### `custom_manual_assessment`

For semantically rich human assessments where the retained value already encodes the judgment to evaluate. The V1 rule has exactly two keys: `type` and `accepted`.

Supported representations are:

```json
{ "type": "custom_manual_assessment", "accepted": true }
```

for a boolean fact;

```json
{ "type": "custom_manual_assessment", "accepted": "feasible" }
```

for a select fact whose declared options contain the key `feasible`; and

```json
{ "type": "custom_manual_assessment", "accepted": 8 }
```

for a rating fact.

Normative V1 semantics:

- the rule is supported only for `boolean`, `select` and `rating` fact definitions;
- `accepted` is normalized and validated against the **same canonical fact-value boundary** as the retained value for that definition;
- for `select`, `accepted` must be exactly one declared option key;
- for `rating`, `accepted` must satisfy the definition's rating bounds and integer constraint where configured;
- after ordinary fact-state handling, a known retained value is `PASS` iff its canonical value equals canonical `accepted`; otherwise it is `FAIL`;
- equality is strict primitive equality after canonical normalization; no coercion, tolerance, substring matching or implicit ordering is permitted;
- if the intended semantics are a threshold or a set of acceptable values, use the dedicated `rating_min`, `select_in`, `select_not_in` or other explicit rule instead of overloading `custom_manual_assessment`.

This rule may be used to preserve the semantic distinction that a value is a human assessment even when its pass/fail comparison is exact.

Unsupported rule type or malformed rule payload is a configuration error, not silently treated as pass.

---

# 2. Evaluation result

Each criterion evaluates to exactly one of:

- `PASS`;
- `FAIL`;
- `UNKNOWN`;
- `NOT_APPLICABLE`;
- `CONFLICT`.

Mapping:

- fact `unknown` → `UNKNOWN`;
- fact `conflict` → `CONFLICT` unless an explicitly retained resolved value exists under conflict-resolution rules;
- fact `not_applicable` → `NOT_APPLICABLE`;
- known value → apply evaluation rule.

An unavailable/malformed retained value is not a PASS.

A missing or malformed evaluation rule is a configuration-incomplete condition and must fail safe; it cannot produce `PASS` or a positive score contribution.

---

# 3. Blocking status

Aggregate venue/vendor blocking status:

### `FAIL`
At least one applicable blocking criterion is `FAIL`.

### `CONFLICT`
No blocking FAIL, but at least one blocking criterion is unresolved `CONFLICT`.

### `UNKNOWN`
No FAIL/CONFLICT, but at least one applicable blocking criterion is `UNKNOWN` or configuration-incomplete.

### `PASS`
All applicable blocking criteria are PASS or explicitly NOT_APPLICABLE according to valid criterion semantics.

UI order of severity:

`FAIL > CONFLICT > UNKNOWN > PASS`.

A high weighted score **never overrides blocking FAIL/UNKNOWN/CONFLICT**.

---

# 4. Weighted compatibility score

Score is only computed over **known evaluable non-informational criteria** according to rule outcome/normalized contribution.

Default simple contribution:

- PASS → 1.0;
- FAIL → 0.0;
- NOT_APPLICABLE → excluded;
- UNKNOWN/CONFLICT → excluded from numeric score but reflected in completeness/certainty.

Configuration-incomplete criteria are excluded from the numeric denominator and surfaced explicitly; they never contribute a positive value.

For rating/numeric rules, a future documented normalized continuous contribution is allowed only by explicit rule; V1 uses pass/fail contribution for determinism.

Formula:

```text
weighted_score = sum(contribution_i * weight_i) / sum(weight_i for included criteria)
```

If denominator is zero, score is `null`, not 0 or 100.

Default weights if project did not customize:

- important → 3
- bonus → 1
- blocking → excluded from numeric score by default because shown separately
- informational → excluded

A project may configure weights; historical criteria facts do not change when weights change.

---

# 5. Completeness / evidence readiness

Compatibility score and data completeness are separate.

Example output:

```json
{
  "blockingStatus": "UNKNOWN",
  "weightedScore": 0.91,
  "knownWeightedCriteria": 14,
  "unknownImportantCriteria": 3,
  "conflictingCriteria": 1,
  "evidenceReadiness": 0.78
}
```

## V1 deterministic `evidenceReadiness` formula

`evidenceReadiness` is a **critical-information completeness/readiness ratio**, not a confidence score and not a proxy for evidence strength.

The evaluation instant `evaluatedAt` is an explicit input to the deterministic calculation.

### Readiness population

Start with every configured criterion/fact definition whose priority is `blocking` or `important` for the evaluated target.

- `bonus` and `informational` criteria do not enter this ratio;
- an explicitly `not_applicable` fact is excluded from the denominator because no current information is required for that criterion;
- a missing fact row remains in scope and is not ready;
- a missing/malformed evaluation rule remains in scope and is not ready, with reason `configuration_incomplete`.

Let `R` be the remaining in-scope applicable criteria after `not_applicable` exclusions.

### Per-criterion readiness contribution

For each criterion `i` in `R`, `ready_i = 1` only when all of the following are true:

1. a fact row exists for the evaluated target and definition;
2. its state is `known` and its retained value is canonically valid;
3. it has a non-null `retained_observation_id`;
4. that retained observation belongs to the same project/fact and is currently `active`;
5. the fact is not explicitly stale at `evaluatedAt`, meaning `stale_at` is null or `stale_at > evaluatedAt`;
6. the evaluation rule is present and valid for the definition.

Otherwise `ready_i = 0`.

Therefore:

```text
evidence_readiness = sum(ready_i for i in R) / count(R)
```

If `count(R) = 0`, `evidenceReadiness` is `null`, not 0 or 1.

The ratio is unweighted in V1. Blocking severity is already represented separately by `blockingStatus`; introducing an additional undocumented priority weight here would make the metric harder to explain and could double-count severity.

### What does not change this ratio in V1

`evidence_level`, observation `confidence`, `source_type` and source strength are preserved and surfaced separately. V1 does **not** silently map them into readiness weights or a pseudo-confidence value.

Weak/unknown provenance, low/unknown confidence, broken/contradictory source state and oral-only evidence may produce explicit guidance/warnings and revalidation reasons, but they do not numerically alter `evidenceReadiness` unless they cause one of the normative readiness conditions above to become false, for example by making the retained observation non-active or the fact explicitly stale.

Absence of `stale_at` is not interpreted as stale. Freshness policies and later dependency invalidation may set/derive explicit revalidation state according to their owning contracts; the readiness engine must not invent a date that was never stored or deterministically derived.

### Required explanation counts

The read model must be able to explain the numerator and denominator and classify non-ready critical criteria at least as:

- missing/unknown;
- conflicting;
- stale;
- retained evidence missing or non-active;
- configuration incomplete.

A single criterion can expose multiple diagnostic reasons, but it contributes at most one denominator unit and one numerator unit.

Changing a rule, priority, retained resolution, observation lifecycle or explicit freshness state recomputes readiness without rewriting historical facts/observations.

Never call this ratio “confidence”. Confidence remains the independent observation axis defined by `CONFIDENCE-FRESHNESS.md`.

---

# 6. Dynamic criterion dependencies

Some evaluation depends on project/scenario state:

- target guest count;
- selected/candidate date;
- chosen reference origin;
- active budget scenario.

When dependency changes:

- deterministic rule recalculates automatically where valid;
- human assessments that were made for a prior guest count/date are marked for review according to `DEPENDENCY-GRAPH.md`.

Example: `two_dance_areas_feasible=true` assessed at 160 guests may need review when scenario becomes 200 guests; the system must not blindly reuse it as equally valid.

A dependency-triggered review state must not rewrite the historical assessment. If such review state makes current applicability/readiness false under its owning contract, the readiness read model reflects that state rather than mutating the fact.

---

# 7. Personal ratings

Member ratings are not shared objective facts and do not enter blocking-status evaluation unless the couple explicitly configures a separate derived preference metric.

Show both partners' values independently.

---

# 8. Explainability

For every compatibility result, UI can display:

- criterion label;
- retained fact value/state;
- evaluation rule/target in human language;
- PASS/FAIL/UNKNOWN/etc.;
- priority/weight;
- source/freshness indicator;
- contribution to score;
- readiness contribution/reason where the criterion is `blocking` or `important`.

The explanation components must be sufficient to reconstruct both `weightedScore` and `evidenceReadiness` exactly from the displayed/read-model inputs.

No opaque AI score is used in core V1.

---

# 9. Tests

Required:

- positive boolean requirement;
- negative boolean requirement;
- numeric min/max/range boundaries;
- rating threshold;
- time + next-day offset comparison;
- money max exact cents;
- `custom_manual_assessment` exact accepted boolean/select/rating values;
- `custom_manual_assessment` rejects undeclared select options, out-of-range/invalid rating values, wrong types and extra/missing keys;
- unknown/conflict/not-applicable handling;
- blocking fail cannot be hidden by 100% weighted non-blocking score;
- zero weighted-score denominator → null score;
- weight change updates derived score only;
- dynamic target guest-count change;
- malformed/unsupported rule fails safe;
- score explanation components exactly reconstruct displayed score;
- readiness population includes blocking/important only and excludes explicit NOT_APPLICABLE;
- missing fact, UNKNOWN, CONFLICT, stale fact, missing/non-active retained observation and configuration-incomplete each contribute zero readiness;
- known active retained observation with no explicit staleness contributes one readiness unit regardless of evidence-level/confidence labels;
- zero readiness denominator → null readiness;
- readiness explanation counts exactly reconstruct numerator, denominator and displayed ratio;
- readiness/rule recomputation never rewrites fact or observation history.