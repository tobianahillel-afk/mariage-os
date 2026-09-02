# V1 Physical Schema — Freeze Addendum

Status: **Normative addendum to `PHYSICAL-SCHEMA-V1.md`**

If this addendum and the main physical-schema document differ, this addendum controls for the listed audited items. Lot 1 migrations must implement both.

## 1. `fact_definitions.evaluation_rule_json`

Add:

| Column | Type / meaning |
|---|---|
| `evaluation_rule_json` | jsonb nullable; validated supported rule from `CRITERIA-EVALUATION.md` |

System/default criteria used for compatibility must seed an explicit evaluation rule. A blocking criterion without a valid evaluation rule is configuration-incomplete and cannot silently pass.

`priority` remains exactly `blocking`,`important`,`bonus`,`informational`. Negative desirability is represented by evaluation rule (for example boolean expected `false`), never by invented priority values such as `blocking-negative`.

## 2. Fact value validation

Database mutation path for `facts.retained_value` and `fact_observations.value` validates against referenced `fact_definition.value_type` and type-specific metadata as defined in `FACT-VALUE-TYPES.md`.

Invalid JSON shape/type is rejected before becoming retained/observed canonical data.

## 3. Event timeline persistence

Add `event_timeline_items`:

| Column | Type / constraints |
|---|---|
| `id` | uuid PK |
| `project_id` | uuid not null |
| `title` | text not null |
| `description` | text nullable |
| `status` | `draft`,`confirmed`,`cancelled` |
| `start_time` | time nullable |
| `start_day_offset` | smallint not null default 0 check 0..3 |
| `end_time` | time nullable |
| `end_day_offset` | smallint nullable check 0..3 |
| `sort_order` | integer not null default 0 |
| `venue_id` | uuid nullable |
| `venue_space_id` | uuid nullable |
| `location_label` | text nullable |
| `responsible_user_id` | uuid nullable |
| `responsible_label` | text nullable |
| `audience_label` | text nullable |
| `source_id` | uuid nullable |
| `notes` | text nullable |
| audit columns | standard |

Same-project composite FKs for venue/space/source and active-member validation for responsible user.

Add `event_timeline_dependencies`:

- `project_id`;
- `item_id`;
- `depends_on_item_id`;
- unique same-project pair;
- no self-dependency;
- cycles/order validity rejected by domain validation.

Add `event_timeline_vendor_links`:

- `project_id`;
- `timeline_item_id`;
- `vendor_id`;
- optional `contact_id`;
- optional role/note;
- all same-project.

Versioned frozen timeline exports are portable export artifacts/snapshots, not independently editable timeline rows.

## 4. Access-criterion contextual semantics

Existing generic criterion keys such as `driving_duration_from_reference` can be used only as a derived/default-origin convenience summary. The authoritative multi-origin/multi-mode observations are `venue_access_routes`.

Changing default reference origin invalidates/recomputes the convenience summary but does not rewrite historical route observations.

## 5. Personal rating dimensions

System-supported `member_ratings.dimension_key` initially allows at least:

- `love_score`;
- `interior_aesthetic_score_personal`;
- `exterior_aesthetic_score_personal`;
- `logistics_score_personal`;
- `value_for_money_score_personal`.

Custom dimensions require stable project key/label configuration if later exposed; arbitrary typo strings should not proliferate silently.

## 6. Compatibility output is derived

Do not add authoritative compatibility-score columns to venues/vendors. `blockingStatus`, weighted score, completeness/evidence readiness and explanations are derived from fact definitions, facts, project criteria weights and scenario/project dependencies.

If later cached for performance, cache must be invalidatable/rebuildable under `DERIVED-DATA.md`.

## 7. Timeline indexes/tests

Evaluate indexes:

- `(project_id,start_day_offset,start_time,sort_order)`;
- timeline→vendor links;
- timeline→venue/space links.

Tests prove:

- after-midnight ordering;
- same-project references;
- end not before start after offsets;
- dependency cycles rejected;
- vendor-specific export filtering/privacy;
- live timeline edit does not mutate an already generated frozen export artifact.