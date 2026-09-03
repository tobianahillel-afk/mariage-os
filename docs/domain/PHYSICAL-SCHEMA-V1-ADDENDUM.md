# V1 Physical Schema — Freeze Addendum

Status: **Normative addendum to `PHYSICAL-SCHEMA-V1.md`**

If this addendum and the main physical-schema document differ, this addendum controls for the listed audited items. Lot 1 migrations must implement both.

## 1. `fact_definitions.evaluation_rule_json`

Add:

| Column | Type / meaning |
|---|---|
| `evaluation_rule_json` | jsonb nullable; validated supported rule from `CRITERIA-EVALUATION.md` |

System/default criteria used for compatibility must seed an explicit evaluation rule. A blocking criterion without a valid evaluation rule is configuration-incomplete and cannot silently pass.

`priority` remains exactly `blocking`,`important`,`bonus`,`informational`. Negative desirability is represented by evaluation rule, never invented priority values.

## 2. Fact value validation

Database mutation path for `facts.retained_value` and `fact_observations.value` validates against referenced `fact_definition.value_type` and metadata in `FACT-VALUE-TYPES.md`.

Invalid JSON shape/type is rejected before becoming canonical fact data.

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

Versioned frozen timeline exports are snapshots, not independently editable timeline rows.

## 4. Access-criterion contextual semantics

Generic keys such as `driving_duration_from_reference` are only a derived/default-origin convenience summary. Authoritative multi-origin/multi-mode observations are `venue_access_routes`.

Changing default origin invalidates/recomputes summary but never rewrites route history.

## 5. Personal rating dimensions

Initial system `member_ratings.dimension_key` values:

- `love_score`;
- `interior_aesthetic_score_personal`;
- `exterior_aesthetic_score_personal`;
- `logistics_score_personal`;
- `value_for_money_score_personal`.

Arbitrary typo dimensions must not proliferate silently.

## 6. Compatibility output is derived

Do not add authoritative compatibility-score columns. Blocking status, weighted score, completeness/evidence readiness and explanations derive from criterion definitions/evaluation rules/facts/project assumptions.

A future persisted cache must be rebuildable/invalidatable.

## 7. Document version/review metadata

Extend `documents` with:

| Column | Type / meaning |
|---|---|
| `document_date` | date nullable; issue/signature/document date when known |
| `supersedes_document_id` | uuid nullable, composite same-project FK to documents |
| `review_status` | `unreviewed`,`in_review`,`reviewed_with_open_items`,`reviewed`,`superseded` |
| `reviewed_at` | timestamptz nullable |
| `reviewed_by` | uuid nullable active/same-project member at review time |

Rules:

- supersession cannot cross project;
- supersession cycles prohibited;
- a superseded document remains historical/readable until retention policy;
- new version does not silently inherit document-version-specific review confirmations.

## 8. `document_review_items`

Persist contract/quote checklist results without pretending they are legal interpretations.

| Column | Type / meaning |
|---|---|
| `id` | uuid PK |
| `project_id` | uuid not null |
| `document_id` | uuid not null composite same-project FK |
| `check_key` | stable machine key |
| `label` | text not null |
| `status` | `confirmed_in_document`,`confirmed_by_linked_evidence`,`not_found`,`contradictory`,`not_applicable`,`needs_human_review` |
| `fact_id` | uuid nullable same-project |
| `source_id` | uuid nullable same-project |
| `task_id` | uuid nullable same-project follow-up |
| `note` | text nullable |
| `reviewed_by` | uuid nullable member |
| `reviewed_at` | timestamptz nullable |
| audit columns | standard |

Unique active `(project_id,document_id,check_key)`.

## 9. Source→document evidence

Extend `sources` with optional:

| Column | Type |
|---|---|
| `document_id` | uuid nullable composite same-project FK to documents |

This allows a fact observation source to be the specific quote/contract version. Other source types can leave it null.

## 10. Timeline/document indexes/tests

Evaluate indexes:

- `(project_id,start_day_offset,start_time,sort_order)` timeline;
- timeline→vendor / venue/space;
- `(project_id,document_type,review_status)`;
- document supersession lookup;
- document review items by document/status.

Tests prove:

- timeline after-midnight ordering/same-project/cycle/end validation;
- live timeline edit does not mutate frozen export;
- document supersession same-project and acyclic;
- new contract version does not silently mark prior checks reviewed;
- review item links cannot cross project;
- contract-signed warning can derive unresolved critical document checks.