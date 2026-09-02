# V1 Physical PostgreSQL Schema Reference

Status: **Normative schema design for implementation**

This document translates the conceptual ERD into a concrete V1 relational design. Lot 1+ migrations may refine physical details only when the change preserves documented semantics and is recorded by spec/ADR when material.

The objective is that a developer does not invent the production schema from scratch.

---

## 1. Global conventions

### Primary keys

All application-owned entities use UUID primary keys generated client-side or database-side using a secure UUID generator. Client-generated UUIDs are allowed for offline creation.

### Project scope

Every project-owned table has a non-null `project_id uuid` either directly or through a parent where the table is never independently queried. For simplicity/RLS clarity, V1 should prefer direct `project_id` on project-owned leaf tables as listed below.

### Audit/version columns

Collaboratively editable records normally include:

- `created_at timestamptz not null default now()`
- `created_by uuid null references auth.users(id)`
- `updated_at timestamptz not null default now()`
- `updated_by uuid null references auth.users(id)`
- `revision bigint not null default 1 check (revision > 0)`
- `deleted_at timestamptz null` where soft deletion applies

Revision increments atomically on accepted update.

### Status fields

Use `text` plus CHECK constraints for lifecycle values unless a later ADR chooses PostgreSQL enums. TypeScript unions mirror DB constraints.

### Money

Use `bigint` integer minor units (EUR cents in V1) plus ISO currency code, never authoritative floating-point.

### Dates

- Civil dates: `date`.
- Absolute events/audit: `timestamptz`.
- Local wall-clock time without date: `time` only where semantically appropriate.
- Project timezone: IANA timezone string on `projects.timezone`.

### JSONB

JSONB is used for typed extensible fact values, import summaries and limited structured metadata. Core identity/state/financial relationships must not be hidden inside giant JSON blobs.

### Polymorphic targets

Where facts/tasks/decisions/documents/media link to heterogeneous project entities, use `target_type text + target_id uuid` with an allowlisted type set and a database validation trigger/function that verifies the target exists and belongs to the same `project_id`.

No cross-project polymorphic link is valid.

---

# 2. Identity and project tables

## `profiles`

| Column | Type | Constraints / meaning |
|---|---|---|
| `id` | uuid | PK, references `auth.users(id)` on delete cascade |
| `display_name` | text | not null, length 1..120 |
| `avatar_url` | text | nullable |
| `created_at` | timestamptz | not null default now |
| `updated_at` | timestamptz | not null default now |

No wedding-project PII beyond user-facing identity belongs here.

## `projects`

| Column | Type | Constraints / meaning |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | not null, length 1..160 |
| `locale` | text | not null default `fr-FR` |
| `timezone` | text | not null default `Europe/Paris` |
| `currency` | char(3) | not null default `EUR` |
| `wedding_date` | date | nullable until chosen |
| `target_guest_count` | integer | nullable, check >= 0 |
| `status` | text | `planning`,`archived`,`deleting` |
| `created_at` | timestamptz | not null |
| `created_by` | uuid | auth user |
| `updated_at` | timestamptz | not null |
| `updated_by` | uuid | auth user |
| `revision` | bigint | >=1 |

## `project_members`

Composite PK or unique constraint on `(project_id,user_id)`.

| Column | Type | Meaning |
|---|---|---|
| `project_id` | uuid | FK projects |
| `user_id` | uuid | FK auth.users |
| `role` | text | `owner`,`editor`,`viewer` |
| `membership_status` | text | `invited`,`active`,`revoked` |
| `invited_by` | uuid | nullable auth user |
| `invited_at` | timestamptz | nullable |
| `accepted_at` | timestamptz | nullable |
| `revoked_at` | timestamptz | nullable |
| `created_at` | timestamptz | not null |

At least one active owner invariant is enforced by privileged transaction/function; ordinary UI cannot remove final owner.

---

# 3. Venue domain

## `venues`

| Column | Type | Meaning |
|---|---|---|
| `id` | uuid | PK |
| `project_id` | uuid | FK projects, not null |
| `code` | text | nullable human code e.g. S32 |
| `name` | text | not null |
| `status` | text | lifecycle from state-machine spec |
| `rejection_reason` | text | nullable |
| `address_line1` | text | nullable |
| `address_line2` | text | nullable |
| `postal_code` | text | nullable |
| `city` | text | nullable |
| `region` | text | nullable |
| `country_code` | char(2) | default FR where appropriate |
| `latitude` | numeric(9,6) | nullable, -90..90 |
| `longitude` | numeric(9,6) | nullable, -180..180 |
| `website_url` | text | nullable |
| `phone` | text | nullable |
| `email` | text | nullable |
| `summary_note` | text | nullable private couple note |
| `main_media_id` | uuid | nullable; validated media belongs same project/venue context |
| audit columns | | standard |

Recommended indexes:

- `(project_id,status)`
- `(project_id,lower(name))` expression/index choice finalized migration time
- `(project_id,code)` with partial uniqueness if non-null and policy wants unique human codes
- coordinates only if map query needs it.

## `venue_spaces`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `venue_id` uuid FK venues on delete cascade/soft-delete policy |
| `name` text not null |
| `space_type` text not null |
| `indoor` boolean nullable |
| `area_m2` numeric(10,2) nullable check >0 |
| `length_m` numeric(10,2) nullable check >0 |
| `width_m` numeric(10,2) nullable check >0 |
| `height_m` numeric(10,2) nullable check >0 |
| `capacity_seated` integer nullable check >=0 |
| `capacity_cocktail` integer nullable check >=0 |
| `sort_order` integer not null default 0 |
| `notes` text nullable |
| audit columns |

Index `(project_id,venue_id,sort_order)`.

## `venue_offers`

| Column | Type / meaning |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `venue_id` uuid FK venues |
| `name` text not null |
| `status` text: `draft`,`quoted`,`expired`,`accepted`,`rejected`,`superseded` |
| `valid_from` date nullable |
| `valid_to` date nullable |
| `weekday` smallint nullable check 0..6 using documented convention |
| `base_amount_minor` bigint nullable check >=0 |
| `currency` char(3) not null default EUR |
| `included_guest_count` integer nullable check >=0 |
| `extra_guest_amount_minor` bigint nullable check >=0 |
| `deposit_amount_minor` bigint nullable check >=0 |
| `deposit_refundable` boolean nullable |
| `security_deposit_minor` bigint nullable check >=0 |
| `security_deposit_refundable` boolean nullable default true |
| `included_start_time` time nullable |
| `included_end_time` time nullable |
| `extra_hour_amount_minor` bigint nullable check >=0 |
| `quote_document_id` uuid nullable |
| `source_id` uuid nullable |
| `notes` text nullable |
| audit columns |

Complex components/inclusions use facts or `offer_components` below rather than expanding infinite columns.

## `offer_components`

Generic component for venue/vendor offers.

| Column | Type / meaning |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `owner_type` text `venue_offer`/`vendor_offer` |
| `owner_id` uuid validated same project |
| `label` text not null |
| `component_type` text: `included`,`mandatory_extra`,`optional` |
| `calculation_type` text: `fixed`,`per_guest`,`per_table`,`per_hour`,`quantity_unit` |
| `unit_amount_minor` bigint nullable |
| `quantity` numeric(12,3) nullable |
| `currency` char(3) not null default EUR |
| `notes` text nullable |
| audit columns |

## `venue_availabilities`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `venue_id` uuid FK |
| `event_date` date not null |
| `status` text: `unknown`,`available`,`unavailable`,`option_held`,`expired` |
| `option_expires_at` timestamptz nullable |
| `observed_at` timestamptz not null |
| `source_id` uuid nullable |
| `notes` text nullable |
| audit columns |

Unique active observation is not forced; history may contain multiple observations. Queries choose latest/relevant observation.

---

# 4. Extensible facts and evidence

## `fact_definitions`

Project-scoped definitions (system defaults copied/seeded into project or otherwise made RLS-safe).

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `key` text not null |
| `label` text not null |
| `entity_type` text not null |
| `value_type` text: `boolean`,`number`,`money`,`text`,`date`,`time`,`rating`,`select`,`multiselect`,`duration`,`distance`,`url` |
| `unit` text nullable |
| `priority` text: `blocking`,`important`,`bonus`,`informational` |
| `weight` numeric(8,3) nullable |
| `freshness_policy` text nullable |
| `system_defined` boolean not null default false |
| `options_json` jsonb nullable |
| audit columns |

Unique `(project_id,entity_type,key)` among non-deleted definitions.

## `facts`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `target_type` text not null |
| `target_id` uuid not null |
| `definition_id` uuid FK fact_definitions |
| `state` text: `known`,`unknown`,`not_applicable`,`conflict` |
| `retained_value` jsonb nullable |
| `retained_observation_id` uuid nullable |
| `last_verified_at` timestamptz nullable |
| `stale_at` timestamptz nullable |
| audit columns |

Unique `(project_id,target_type,target_id,definition_id)` among active rows.

DB trigger validates target exists in same project.

## `fact_observations`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `fact_id` uuid FK facts |
| `value` jsonb nullable |
| `evidence_level` text not null |
| `observed_at` timestamptz not null |
| `source_id` uuid nullable FK sources |
| `import_id` uuid nullable FK imports |
| `note` text nullable |
| `created_at` timestamptz |
| `created_by` uuid |

Observations are append-oriented; corrections create new observation unless proven data-entry repair policy allows explicit correction with audit.

## `sources`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `source_type` text not null |
| `title` text nullable |
| `url` text nullable |
| `evidence_level` text not null |
| `observed_at` timestamptz nullable |
| `notes` text nullable |
| `status` text default `active`: `active`,`broken`,`replaced`,`archived` |
| audit columns |

---

# 5. Vendors, contacts and interactions

## `vendors`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `vendor_type` text not null |
| `name` text not null |
| `status` text not null |
| `website_url` text nullable |
| `phone` text nullable |
| `email` text nullable |
| `summary_note` text nullable |
| audit columns |

Index `(project_id,vendor_type,status)`.

## `vendor_offers`

Mirrors common commercial fields from `venue_offers` where applicable:

- `id`, `project_id`, `vendor_id`, `name`, `status`;
- `valid_from`, `valid_to`;
- `base_amount_minor`, `currency`;
- `per_guest_amount_minor` nullable;
- `minimum_guest_count` nullable;
- `deposit_amount_minor` nullable;
- `quote_document_id` nullable;
- `source_id` nullable;
- `notes`;
- audit columns.

Fine-grained inclusions use `offer_components`.

## `contacts`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `parent_type` text `venue`/`vendor` |
| `parent_id` uuid validated same project |
| `name` text nullable |
| `role_label` text nullable |
| `email` text nullable |
| `phone` text nullable |
| `preferred_channel` text nullable |
| `notes` text nullable |
| audit columns |

## `interactions`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `parent_type` text `venue`/`vendor` |
| `parent_id` uuid validated |
| `contact_id` uuid nullable FK contacts |
| `interaction_type` text not null |
| `occurred_at` timestamptz not null |
| `summary` text not null |
| `next_follow_up_at` timestamptz nullable |
| `source_id` uuid nullable |
| audit columns |

---

# 6. Guests and households

## `households`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `display_name` text not null |
| `guest_group` text nullable |
| `address_line1` text nullable |
| `address_line2` text nullable |
| `postal_code` text nullable |
| `city` text nullable |
| `country_code` char(2) nullable |
| `notes` text nullable |
| audit columns |

## `guests`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `household_id` uuid nullable FK households |
| `first_name` text not null |
| `last_name` text nullable |
| `category` text nullable |
| `priority` smallint nullable check within configured project range, V1 default 1..5 |
| `attendance_probability` numeric(5,4) nullable check 0..1 |
| `rsvp_status` text not null default `pending` |
| `age_group` text nullable |
| `relationship_role` text nullable |
| `parent_guest_id` uuid nullable FK guests |
| `email` text nullable |
| `phone` text nullable |
| `transport_needed` boolean nullable |
| `accommodation_needed` boolean nullable |
| `dietary_notes` text nullable |
| `notes` text nullable |
| audit columns |

Name similarity is never a uniqueness constraint. External IDs/import metadata drive safe re-import matching.

---

# 7. Tasks and decisions

## `tasks`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `title` text not null |
| `description` text nullable |
| `status` text not null |
| `priority` text not null default `normal` |
| `owner_type` text `member`,`both`,`third_party`,`unassigned` |
| `owner_user_id` uuid nullable |
| `third_party_label` text nullable |
| `due_at` timestamptz nullable |
| `waiting_for` text nullable |
| `waiting_since` timestamptz nullable |
| `follow_up_at` timestamptz nullable |
| `is_blocker` boolean not null default false |
| `completed_at` timestamptz nullable |
| audit columns |

## `task_dependencies`

Composite unique `(task_id,depends_on_task_id)`.

- `project_id` uuid;
- `task_id` uuid FK tasks;
- `depends_on_task_id` uuid FK tasks;
- created metadata.

Self-dependency prohibited; cycles detected application-side and preferably validated before commit.

## `task_links`

- `id` uuid PK;
- `project_id` uuid;
- `task_id` uuid FK tasks;
- `target_type`, `target_id` validated same project.

## `decisions`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `title` text not null |
| `description` text nullable |
| `status` text not null |
| `requires_all_owners` boolean not null default false |
| `due_at` timestamptz nullable |
| `final_option_id` uuid nullable |
| `final_rationale` text nullable |
| `finalized_at` timestamptz nullable |
| `locked_at` timestamptz nullable |
| audit columns |

## `decision_options`

- `id` uuid PK;
- `project_id` uuid;
- `decision_id` uuid FK;
- `label` text;
- `description` text nullable;
- `sort_order` integer;
- optional target reference fields when option represents a venue/vendor.

## `decision_approvals`

Unique `(decision_id,user_id)`.

- `project_id`;
- `decision_id`;
- `user_id`;
- `option_id` nullable;
- `approval_state` text;
- `comment` nullable;
- `updated_at`.

## `decision_links`

Generic validated target link like `task_links`.

---

# 8. Budget and payments

## `budget_items`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `category` text not null |
| `label` text not null |
| `status` text not null |
| `calculation_type` text not null |
| `currency` char(3) not null default EUR |
| `unit_amount_minor` bigint nullable |
| `quantity` numeric(12,3) nullable |
| `guest_count_basis` integer nullable |
| `estimated_amount_minor` bigint nullable |
| `quoted_amount_minor` bigint nullable |
| `approved_amount_minor` bigint nullable |
| `contracted_amount_minor` bigint nullable |
| `scenario_class` text nullable: `minimum`,`probable`,`maximum` or rule metadata |
| `notes` text nullable |
| audit columns |

Derived totals are computed, not manually authoritative columns.

## `payments`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `budget_item_id` uuid FK budget_items |
| `payment_type` text: `payment`,`refund`,`refundable_deposit`,`deposit_return` |
| `status` text: `planned`,`due`,`paid`,`cancelled`,`refunded` |
| `amount_minor` bigint not null check >=0 |
| `currency` char(3) not null |
| `due_date` date nullable |
| `paid_at` timestamptz nullable |
| `document_id` uuid nullable |
| `notes` text nullable |
| audit columns |

## `budget_links`

Generic validated links from budget item to venue/vendor/decision/etc.

---

# 9. Planning

## `milestones`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `key` text nullable stable system key |
| `label` text not null |
| `phase` text not null |
| `weight` numeric(8,3) not null check >=0 |
| `status` text not null |
| `target_date` date nullable |
| `offset_days_from_wedding` integer nullable |
| `completed_at` timestamptz nullable |
| audit columns |

---

# 10. Documents and media

## `documents`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `document_type` text not null |
| `title` text not null |
| `storage_path` text nullable |
| `remote_url` text nullable |
| `original_filename` text nullable |
| `mime_type` text nullable |
| `size_bytes` bigint nullable check >=0 |
| `sha256` text nullable |
| `classification` text not null default `private` |
| `upload_status` text not null |
| `source_id` uuid nullable |
| audit columns |

At least one of storage_path/remote_url may be required depending on document type; no executable content rendering.

## `media`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `media_type` text not null |
| `category` text nullable |
| `storage_path` text nullable |
| `remote_url` text nullable |
| `source_page_url` text nullable |
| `original_filename` text nullable |
| `mime_type` text nullable |
| `size_bytes` bigint nullable |
| `sha256` text nullable |
| `width_px` integer nullable |
| `height_px` integer nullable |
| `derivative_of_id` uuid nullable FK media |
| `is_original` boolean not null default true |
| `upload_status` text not null |
| `caption` text nullable |
| audit columns |

Exact-byte dedup uses `(project_id,sha256)` where non-null, subject to semantics for derivative/original distinction.

## `document_links` / `media_links`

Each contains:

- `id` uuid PK;
- `project_id`;
- source object ID (`document_id` or `media_id`);
- `target_type`;
- `target_id`;
- optional `relationship_type`;
- creation metadata.

Target validated same project.

---

# 11. Import/history/sync metadata

## `imports`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid FK |
| `source_type` text not null |
| `original_filename` text nullable |
| `source_namespace` text nullable |
| `file_sha256` text nullable |
| `schema_name` text nullable |
| `schema_version` text nullable |
| `status` text not null |
| `mapping_profile_name` text nullable |
| `summary_json` jsonb nullable |
| `started_at` timestamptz not null |
| `completed_at` timestamptz nullable |
| `created_by` uuid not null |

## `import_changes`

Supports rollback/provenance.

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid |
| `import_id` uuid FK imports |
| `entity_type` text |
| `entity_id` uuid |
| `change_type` text `create`,`update`,`observation_add`,`link_add`,`category_create` etc. |
| `before_json` jsonb nullable |
| `after_json` jsonb nullable |
| `applied_revision` bigint nullable |
| `rolled_back_at` timestamptz nullable |

Sensitive large document contents are never copied into change JSON.

## `external_identifiers`

Used for idempotent imports without polluting every domain table.

Unique `(project_id,namespace,entity_type,external_id)`.

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid |
| `namespace` text not null |
| `entity_type` text not null |
| `entity_id` uuid not null |
| `external_id` text not null |
| `created_at` timestamptz |

Trigger validates target same project.

## `activity_log`

Human-meaningful durable project activity, not raw noisy telemetry.

- `id` uuid PK;
- `project_id`;
- `actor_user_id` nullable;
- `event_type` text;
- `entity_type` nullable;
- `entity_id` nullable;
- `summary_key`/safe structured metadata;
- `occurred_at` timestamptz;
- optional operation ID.

Never store full sensitive payloads merely for logging.

## `sync_mutation_receipts`

Server-side idempotence record for mutation operations that need retry protection.

| Column | Type |
|---|---|
| `operation_id` uuid PK |
| `project_id` uuid not null |
| `user_id` uuid not null |
| `entity_type` text not null |
| `entity_id` uuid nullable |
| `result_revision` bigint nullable |
| `created_at` timestamptz not null |

Retention can be bounded after safe retry window, but never so aggressively that normal offline retries duplicate recent operations.

---

# 12. Polymorphic target validation

Create a database function/trigger pattern that validates allowlisted `target_type` values and confirms:

1. target row exists and is active/valid for link semantics;
2. target row belongs to the same `project_id`;
3. caller is authorized through table RLS.

Never trust a client-provided `project_id` plus arbitrary UUID as proof of project ownership.

---

# 13. RLS baseline pattern

Every project-scoped table enables RLS.

Conceptual active-member predicate:

`exists(select 1 from project_members pm where pm.project_id = row.project_id and pm.user_id = auth.uid() and pm.membership_status='active')`

Write policies may additionally require owner/editor role depending on entity.

Critical owner/admin operations use dedicated functions/policies rather than giving blanket table writes.

Storage policies validate the project path namespace against active membership, not only object ownership.

Full allow/deny matrix: `security/AUTHORIZATION-RLS.md`.

---

# 14. Indexing baseline

At minimum, evaluate indexes for:

- every FK commonly joined;
- every `project_id` filter;
- `(project_id,status)` on major lifecycle tables;
- `(project_id,due_date)` or equivalent task/payment deadline queries;
- `(project_id,updated_at)` for sync/activity queries;
- human-code/name search where measured useful;
- external identifier uniqueness;
- fact lookup `(project_id,target_type,target_id,definition_id)`;
- media/document parent/link lookups.

Do not add speculative indexes without query need; migrations/tests should validate critical query plans at realistic dataset scale if performance indicates concern.

---

# 15. Physical-schema change rule

Migrations may change names/normalization only if:

- all domain semantics/invariants remain satisfied;
- RLS remains testable;
- offline/import/export mappings are updated;
- migration and historical fixtures are added;
- this reference and affected ADR/specs are updated.

The schema is a means to implement the product contracts, but it is no longer an unspecified design task.
