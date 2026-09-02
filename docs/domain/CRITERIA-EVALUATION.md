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

For semantically rich items such as `two_dance_areas_feasible` where a retained boolean/assessment may already encode a human judgment. Evaluation expects a configured acceptable value.

Unsupported rule type is a configuration error, not silently treated as pass.

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

---

# 3. Blocking status

Aggregate venue/vendor blocking status:

### `FAIL`
At least one applicable blocking criterion is `FAIL`.

### `CONFLICT`
No blocking FAIL, but at least one blocking criterion is unresolved `CONFLICT`.

### `UNKNOWN`
No FAIL/CONFLICT, but at least one applicable blocking criterion is `UNKNOWN`.

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

For rating/numeric rules, a future documented normalized continuous contribution is allowed only by explicit rule; V1 can use pass/fail contribution for determinism.

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

`evidenceReadiness` must have its own documented deterministic formula before implementation; V1 may use a simple count/weight of sufficiently evidenced important/blocking facts. Never call it “confidence” if it measures completeness.

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
- contribution to score.

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
- unknown/conflict/not-applicable handling;
- blocking fail cannot be hidden by 100% weighted non-blocking score;
- zero denominator → null score;
- weight change updates derived score only;
- dynamic target guest-count change;
- malformed/unsupported rule fails safe;
- score explanation components exactly reconstruct displayed score.