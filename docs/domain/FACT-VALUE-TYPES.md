# Fact Value Types and Validation

Status: **Normative V1 value-shape contract**

`facts.retained_value` and `fact_observations.value` use JSONB for extensibility, but JSONB is not untyped free-form storage. Value shape is determined by the referenced `fact_definition.value_type` and must be validated before/at persistence.

## Common principle

A fact value is valid only if:

1. JSON shape matches definition value type;
2. domain range/options are valid;
3. unit semantics match definition;
4. value is compatible with its evaluation rule;
5. money/date/time uses canonical representations.

DB trigger/function or controlled mutation command validates JSONB value against definition. TypeScript runtime validators mirror the same rules. Invalid JSONB never becomes retained truth merely because PostgreSQL can store it.

---

## `boolean`

JSON `true` or `false` only.

No strings `"yes"`, `"oui"`, `1`, `0` in canonical storage.

## `number`

Finite JSON number. Definition/options may set min/max/integer constraints.

Examples:

- area: `300`
- dB: `95`

NaN/Infinity are invalid.

## `rating`

JSON number in configured scale. V1 system ratings use **0..10 inclusive** unless definition explicitly declares another bounded scale.

## `money`

Exact object:

```json
{ "minor": 950000, "currency": "EUR" }
```

Rules:

- `minor` integer;
- non-negative for factual price/fee values unless the specific fact definition explicitly models signed delta;
- `currency` ISO-4217 uppercase 3-letter code;
- no implicit currency conversion.

## `text`

JSON string, trimmed for empty-value normalization according to form/import rules. Maximum length comes from definition/system limits. User HTML remains text.

## `url`

JSON string containing validated `http:` or `https:` URL unless a narrower allowlist applies. Unsafe schemes rejected.

## `date`

JSON string ISO civil date:

```json
"2027-06-20"
```

No timestamp where date-only semantics apply.

## `time`

For simple same-day time fact:

```json
{ "time": "22:30", "dayOffset": 0 }
```

For after-midnight curfew:

```json
{ "time": "01:30", "dayOffset": 1 }
```

`dayOffset` V1 allowed 0..2 unless a specific definition is stricter.

Legacy/simple imported string `"22:30"` may normalize to `{time:"22:30",dayOffset:0}` during preview; canonical storage/export uses object form when day context can matter.

## `duration`

Canonical JSON integer minutes:

```json
135
```

Definition unit must be `minutes` or UI-specific presentation derived from minutes. Human input `2h15` normalizes to 135.

## `distance`

Canonical integer meters:

```json
12500
```

UI can display km. Definition unit identifies meters as canonical storage.

Origin-dependent travel distance belongs in `venue_access_routes`, not a single ambiguous fact.

## `select`

JSON string equal to one key in `fact_definitions.options_json`.

Labels are localized/display text, not stored canonical value.

## `multiselect`

JSON array of unique option keys:

```json
["round_tables", "rectangular_tables"]
```

Canonical order is either definition order or sorted stable key order; semantic equality ignores ordering.

## `not_applicable`, `unknown`, `conflict`

Fact state conveys these concepts. Do not encode them as magic strings inside `retained_value`.

When `state != known`, retained value may be null unless conflict-resolution workflow intentionally retains a provisional value with explicit resolution metadata.

---

# Raw imported values

`fact_observations.raw_value_text` can preserve source text such as `"environ 300 m²"` while normalized `value` stores `300`.

Raw text is evidence/audit context, not used directly by calculations.

---

# Fact-definition validation metadata

`options_json` may include type-specific constraints such as:

```json
{
  "min": 0,
  "max": 500,
  "integer": true
}
```

or select values:

```json
{
  "options": [
    {"key":"low","labelKey":"criteria.low"},
    {"key":"medium","labelKey":"criteria.medium"},
    {"key":"high","labelKey":"criteria.high"}
  ]
}
```

`evaluation_rule_json` from `CRITERIA-EVALUATION.md` is separate from value-shape validation.

---

# Migration rule

Changing the semantic representation of a system criterion/value type requires:

- schema/data migration;
- canonical import/export migration;
- historical fixture update;
- tests proving old values normalize correctly;
- no silent reinterpretation.

---

# Tests

Cover every value type with valid/invalid shapes, bounds/options, imported human formats, money precision, unsafe URLs, after-midnight time, duration/distance normalization, unknown-vs-false and multiselect duplicate/order behavior.