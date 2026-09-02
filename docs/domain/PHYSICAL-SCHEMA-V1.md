# V1 Physical PostgreSQL Schema Reference

Status: **Normative schema design for implementation — freeze candidate**

This document translates the conceptual ERD and feature contracts into the concrete V1 relational design. Lot 1 migrations implement this model. A migration may refine a physical detail only if documented semantics/invariants remain true and the governing spec/ADR is updated when material.

The objective is that a developer does **not** invent persistence, authorization or relationship semantics while coding.

---

# 1. Global conventions and hard invariants

## 1.1 Primary keys

Application-owned entities use UUID primary keys. Secure client-generated UUIDs are allowed so entities can be created offline before cloud synchronization.

## 1.2 Project scope and same-project relational integrity

Every project-owned table carries `project_id uuid not null` unless it is strictly auth-global.

Every project-owned parent table must expose a unique candidate key:

```text
UNIQUE (project_id, id)
```

Every ordinary child→parent relationship between project-owned tables must use a **composite same-project foreign key**:

```text
FOREIGN KEY (project_id, parent_id)
  REFERENCES parent_table(project_id, id)
```

A separate `project_id` FK plus unrelated `parent_id` FK is **not sufficient**, because it can create cross-project relationships.

For polymorphic links (`target_type + target_id`), a database validation function/trigger must confirm the target exists in the same project. Application validation is defense-in-depth, not the primary integrity boundary.

## 1.3 Audit/version columns

Collaboratively editable entities normally contain:

- `created_at timestamptz not null default now()`;
- `created_by uuid null references auth.users(id)`;
- `updated_at timestamptz not null default now()`;
- `updated_by uuid null references auth.users(id)`;
- `revision bigint not null default 1 check (revision > 0)`;
- `deleted_at timestamptz null` where soft deletion applies.

Accepted cloud updates increment `revision` atomically. Client clocks never substitute for server revision conflict checks.

## 1.4 Status storage

V1 uses `text` plus CHECK constraints for lifecycle values unless a later ADR deliberately changes this. TypeScript unions mirror DB constraints.

## 1.5 Money

Authoritative money is integer minor units (`bigint`) plus ISO-4217 currency code. EUR cents are V1 default. Floating-point is never authoritative money.

## 1.6 Dates/time

- civil date → `date`;
- absolute event/audit instant → `timestamptz`;
- local wall-clock → `time` plus day-offset when crossing midnight matters;
- project timezone → IANA identifier on project.

### Weekday integer convention

The following convention is frozen across PostgreSQL, TypeScript, CSV/XLSX mapping and canonical JSON:

| Value | Day |
|---:|---|
| 0 | Sunday |
| 1 | Monday |
| 2 | Tuesday |
| 3 | Wednesday |
| 4 | Thursday |
| 5 | Friday |
| 6 | Saturday |

No implementation may silently switch to ISO 1–7 semantics.

## 1.7 JSONB

JSONB is permitted for typed/extensible fact values, mapping/profile definitions, completion rules, safe import summaries and preferences. Core identity, ownership, money, relationship and authorization semantics must remain relational.

## 1.8 Soft deletion

Where `deleted_at` exists, normal queries exclude deleted rows. Unique constraints that apply only to active entities use partial unique indexes when necessary.

## 1.9 External URLs

URLs are stored as text after validation. Application rendering rejects unsafe schemes (`javascript:`, executable `data:` contexts, etc.). Remote images are untrusted external content.

---

# 2. Identity, membership and project configuration

## `profiles`

| Column | Type / constraints |
|---|---|
| `id` | uuid PK, FK `auth.users(id)` on delete cascade |
| `display_name` | text not null, 1..120 chars |
| `avatar_url` | text nullable |
| `created_at` | timestamptz not null default now() |
| `updated_at` | timestamptz not null default now() |

No wedding-project content belongs here.

## `projects`

| Column | Type / constraints |
|---|---|
| `id` | uuid PK |
| `name` | text not null, 1..160 chars |
| `locale` | text not null default `fr-FR` |
| `timezone` | text not null default `Europe/Paris` |
| `currency` | char(3) not null default `EUR` |
| `target_guest_count` | integer nullable check >=0 |
| `status` | `planning`,`archived`,`deleting` |
| audit columns | standard |

The selected wedding date is derived from the one selected `wedding_date_options` row, not duplicated as a second editable truth.

## `project_members`

Unique `(project_id,user_id)`.

| Column | Type / constraints |
|---|---|
| `project_id` | uuid FK projects |
| `user_id` | uuid FK auth.users |
| `role` | `owner`,`editor`,`viewer` |
| `membership_status` | `active`,`revoked` |
| `accepted_at` | timestamptz nullable |
| `revoked_at` | timestamptz nullable |
| `last_seen_activity_at` | timestamptz nullable; member-specific “since last visit” cursor |
| `created_at` | timestamptz not null |

V1 normal couple membership is two active owners. Last active owner cannot be removed by ordinary mutation.

## `project_invitations`

Invitation exists separately from membership because the invited user may not yet have an Auth account.

| Column | Type / constraints |
|---|---|
| `id` | uuid PK |
| `project_id` | uuid not null FK projects |
| `invited_email_normalized` | text not null |
| `role` | text not null default `owner` |
| `token_hash` | text not null; raw token never persisted |
| `invited_by` | uuid not null FK auth.users |
| `expires_at` | timestamptz not null |
| `accepted_at` | timestamptz nullable |
| `accepted_by` | uuid nullable FK auth.users |
| `revoked_at` | timestamptz nullable |
| `created_at` | timestamptz not null default now() |

Rules:

- only authorized owner can create/revoke invitation;
- one-time random token returned once to creator, only cryptographic hash stored;
- acceptance RPC requires authenticated user email to match invitation email after provider verification;
- acceptance is idempotent;
- token expiry/revocation enforced server-side;
- accepted invite atomically creates/activates one membership.

Partial unique index prevents duplicate active invitations for same project/email where appropriate.

## `user_project_preferences`

Cross-device personal UI preferences, not shared project facts.

| Column | Type |
|---|---|
| `project_id` uuid |
| `user_id` uuid |
| `preferences_json` jsonb not null default `{}` |
| `updated_at` timestamptz |
| `revision` bigint |

Unique `(project_id,user_id)`. Same-project active membership required by RLS.

## `project_reference_origins`

Stores private origins used for travel/access comparisons.

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `label` text not null |
| `address_text` text nullable |
| `latitude` numeric(9,6) nullable |
| `longitude` numeric(9,6) nullable |
| `is_default` boolean not null default false |
| `sort_order` integer not null default 0 |
| audit columns |

At most one active default origin per project.

---

# 3. Wedding dates and scenarios

## `wedding_date_options`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `event_date` date not null |
| `label` text nullable |
| `status` | `candidate`,`selected`,`rejected`,`archived` |
| `notes` text nullable |
| audit columns |

Unique active `(project_id,event_date)` unless product explicitly allows two labels for same civil date. Exactly zero-or-one active row may be `selected`; selecting one demotes any previous selected option atomically.

All “current wedding date” logic reads the selected option. Before a date is selected, scenarios may refer to candidate options.

---

# 4. Venue domain

## `venues`

| Column | Type / meaning |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `code` text nullable human code e.g. `S32` |
| `name` text not null |
| `status` text lifecycle from state-machine spec |
| `rejection_reason` text nullable |
| `address_line1` text nullable |
| `address_line2` text nullable |
| `postal_code` text nullable |
| `city` text nullable |
| `region` text nullable |
| `country_code` char(2) nullable/default `FR` where appropriate |
| `latitude` numeric(9,6) nullable check -90..90 |
| `longitude` numeric(9,6) nullable check -180..180 |
| `website_url` text nullable |
| `phone` text nullable |
| `email` text nullable |
| `summary_note` text nullable private/shared couple note |
| `main_media_id` uuid nullable; same-project media validation |
| audit columns |

Unique `(project_id,id)`; recommended indexes `(project_id,status)`, natural-code/name lookup and coordinate lookup only when measured useful.

## `venue_spaces`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `venue_id` uuid not null |
| `name` text not null |
| `space_type` text not null |
| `indoor` boolean nullable |
| `area_m2` numeric(10,2) nullable check >0 |
| `length_m`,`width_m`,`height_m` | numeric(10,2) nullable check >0 |
| `capacity_seated` integer nullable check >=0 |
| `capacity_cocktail` integer nullable check >=0 |
| `sort_order` integer not null default 0 |
| `notes` text nullable |
| audit columns |

Composite FK `(project_id,venue_id) → venues(project_id,id)`.

## `venue_offers`

| Column | Type / meaning |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `venue_id` uuid not null |
| `name` text not null |
| `status` | `draft`,`quoted`,`expired`,`accepted`,`rejected`,`superseded` |
| `valid_from`,`valid_to` | date nullable |
| `weekday` | smallint nullable check 0..6 using frozen convention |
| `base_amount_minor` | bigint nullable check >=0 |
| `currency` | char(3) not null default EUR |
| `tax_mode` | `included`,`excluded`,`not_applicable`,`unknown` default `unknown` |
| `tax_rate_basis_points` | integer nullable check 0..10000 |
| `included_guest_count` | integer nullable check >=0 |
| `extra_guest_amount_minor` | bigint nullable check >=0 |
| `deposit_amount_minor` | bigint nullable check >=0 |
| `deposit_refundable` | boolean nullable |
| `security_deposit_minor` | bigint nullable check >=0 |
| `security_deposit_refundable` | boolean nullable default true |
| `included_start_time` | time nullable |
| `included_end_time` | time nullable |
| `included_end_day_offset` | smallint not null default 0 check 0..2 |
| `extra_hour_amount_minor` | bigint nullable check >=0 |
| `quote_document_id` | uuid nullable |
| `source_id` | uuid nullable |
| `notes` | text nullable |
| audit columns |

Composite same-project FKs for venue/document/source.

## `vendor_offers`

Same shared commercial semantics as venue offers, with:

- `vendor_id` instead of venue;
- optional `per_guest_amount_minor`;
- optional `minimum_guest_count`;
- same tax, deposit, validity, source/document and audit semantics.

## `offer_components`

Generic inclusion/extra row for a venue or vendor offer.

| Column | Type / meaning |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `owner_type` | `venue_offer`,`vendor_offer` |
| `owner_id` uuid not null, validated same project/type |
| `label` text not null |
| `component_type` | `included`,`mandatory_extra`,`optional` |
| `calculation_type` | `fixed`,`per_guest`,`per_adult`,`per_child`,`per_table`,`per_hour`,`quantity_unit` |
| `unit_amount_minor` bigint nullable check >=0 |
| `quantity` numeric(12,3) nullable check >=0 |
| `unit_label` text nullable |
| `currency` char(3) not null default EUR |
| `tax_mode` | same commercial tax semantics |
| `tax_rate_basis_points` integer nullable |
| `notes` text nullable |
| audit columns |

## `venue_availabilities`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `venue_id` uuid not null |
| `date_option_id` uuid nullable |
| `event_date` date not null |
| `status` | `unknown`,`available`,`unavailable`,`option_held`,`expired` |
| `option_expires_at` timestamptz nullable |
| `observed_at` timestamptz not null |
| `source_id` uuid nullable |
| `notes` text nullable |
| audit columns |

If `date_option_id` is present, it must be same project and its date must equal `event_date` (validated by command/trigger). Multiple observations are allowed; UI selects relevant/latest rather than overwriting history.

---

# 5. Venue access and transport observations

Generic single-value facts such as nearest TGV station remain supported, but time/distance observations that depend on an origin need explicit context.

## `venue_access_routes`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `venue_id` uuid not null |
| `reference_origin_id` uuid nullable |
| `route_type` | `reference_to_venue`,`reference_to_tgv_station`,`tgv_station_to_venue`,`airport_to_venue`,`custom` |
| `origin_label` text nullable |
| `destination_label` text nullable |
| `mode` | `car`,`train`,`public_transport`,`taxi_vtc`,`shuttle`,`coach`,`walk`,`mixed`,`other` |
| `duration_minutes` integer nullable check >=0 |
| `distance_meters` integer nullable check >=0 |
| `transfers_count` integer nullable check >=0 |
| `observed_at` timestamptz not null |
| `source_id` uuid nullable |
| `notes` text nullable |
| audit columns |

Composite same-project FKs for venue, reference origin and source. Several route observations may coexist for different origins/modes.

---

# 6. Extensible facts, observations and evidence

## `fact_definitions`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `key` text not null |
| `label` text not null |
| `entity_type` text not null |
| `value_type` | `boolean`,`number`,`money`,`text`,`date`,`time`,`rating`,`select`,`multiselect`,`duration`,`distance`,`url` |
| `unit` text nullable |
| `priority` | `blocking`,`important`,`bonus`,`informational` |
| `weight` numeric(8,3) nullable |
| `freshness_policy` text nullable |
| `system_defined` boolean not null default false |
| `options_json` jsonb nullable |
| audit columns |

Unique active `(project_id,entity_type,key)`.

## `facts`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `target_type` text not null |
| `target_id` uuid not null |
| `definition_id` uuid not null |
| `state` | `known`,`unknown`,`not_applicable`,`conflict` |
| `retained_value` jsonb nullable |
| `retained_observation_id` uuid nullable |
| `resolution_note` text nullable |
| `resolved_by` uuid nullable |
| `resolved_at` timestamptz nullable |
| `last_verified_at` timestamptz nullable |
| `stale_at` timestamptz nullable |
| audit columns |

Unique active `(project_id,target_type,target_id,definition_id)`. Polymorphic target and definition must belong to same project.

## `fact_observations`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `fact_id` uuid not null |
| `value` jsonb nullable |
| `raw_value_text` text nullable |
| `evidence_level` | controlled evidence hierarchy key |
| `confidence` | `high`,`medium`,`low`,`unknown` |
| `observation_status` | `active`,`superseded`,`withdrawn` |
| `superseded_by_observation_id` uuid nullable |
| `observed_at` timestamptz not null |
| `import_id` uuid nullable |
| `note` text nullable |
| `created_at`,`created_by` | audit creator |

Observations are append-oriented. Correcting evidence normally creates a new observation and supersedes the old one rather than rewriting history.

## `sources`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `source_type` | `contract`,`written_confirmation`,`quote`,`official_website`,`phone_call_note`,`in_person_visit`,`specialized_directory`,`public_third_party`,`user_estimate`,`import_without_primary_source`,`other` |
| `title` text nullable |
| `url` text nullable |
| `evidence_level` text not null |
| `observed_at` timestamptz nullable |
| `notes` text nullable |
| `status` | `active`,`broken`,`replaced`,`superseded`,`contradictory`,`archived` |
| audit columns |

## `observation_sources`

Many-to-many evidence relationship.

Unique `(observation_id,source_id)`.

| Column | Type |
|---|---|
| `project_id` uuid not null |
| `observation_id` uuid not null |
| `source_id` uuid not null |
| `is_primary` boolean not null default false |
| `created_at` timestamptz not null |

Both composite FKs enforce same project.

---

# 7. Vendors, contacts and interactions

## `vendors`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `vendor_type` text not null |
| `name` text not null |
| `status` text not null |
| `website_url`,`phone`,`email` | text nullable |
| `summary_note` text nullable |
| audit columns |

Index `(project_id,vendor_type,status)`.

## `contacts`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `parent_type` | `venue`,`vendor` |
| `parent_id` uuid validated same project |
| `name`,`role_label`,`email`,`phone`,`preferred_channel`,`notes` | text nullable |
| audit columns |

## `interactions`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `parent_type` | `venue`,`vendor` |
| `parent_id` uuid validated same project |
| `contact_id` uuid nullable |
| `interaction_type` text not null |
| `occurred_at` timestamptz not null |
| `summary` text not null |
| `next_follow_up_at` timestamptz nullable |
| `source_id` uuid nullable |
| audit columns |

Contact/source links must be same-project.

---

# 8. Guest taxonomy and guest domain

## `guest_categories`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `key` text not null |
| `label` text not null |
| `sort_order` integer not null default 0 |
| `active` boolean not null default true |
| audit columns |

Unique active `(project_id,key)` and case-insensitive duplicate-label checks at application/import preview level.

## `households`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `display_name` text not null |
| `category_id` uuid nullable |
| address fields | nullable private PII |
| `notes` text nullable |
| audit columns |

## `guests`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `household_id` uuid nullable |
| `first_name` text not null |
| `last_name` text nullable |
| `category_id` uuid nullable |
| `priority` smallint nullable, V1 default 1..5 |
| `attendance_probability` numeric(5,4) nullable check 0..1 |
| `rsvp_status` text not null default `pending` |
| `age_group` text nullable |
| `relationship_role` text nullable |
| `parent_guest_id` uuid nullable |
| `email`,`phone` text nullable |
| `transport_needed`,`accommodation_needed` boolean nullable |
| `dietary_notes`,`notes` text nullable |
| audit columns |

All guest/household/category/parent relationships enforce same project. Name similarity is never a uniqueness rule.

---

# 9. Basic seating plan (V1 non-visual)

V1 includes operational table assignment; drag-and-drop floor-plan canvas remains post-V1.

## `seating_sections`

Examples: men, women, children/family, flexible/custom.

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `key` text not null |
| `label` text not null |
| `sort_order` integer default 0 |
| audit columns |

Project-defined operational sections must not be interpreted as identity/gender data beyond event seating logistics.

## `seating_tables`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `name` text not null |
| `table_number` integer nullable |
| `section_id` uuid nullable |
| `capacity` integer not null check >0 |
| `shape` text nullable |
| `sort_order` integer default 0 |
| `notes` text nullable |
| audit columns |

## `seating_assignments`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `guest_id` uuid not null |
| `table_id` uuid not null |
| `seat_label` text nullable |
| `status` | `planned`,`confirmed` |
| audit columns |

One active assignment per guest. Same-project guest/table constraints are mandatory. Table over-capacity is rejected by domain command and verified before final/frozen seating export.

---

# 10. Per-member opinions/preferences on entities

Shared objective facts must not overwrite individual opinions.

## `member_entity_preferences`

Unique `(project_id,user_id,target_type,target_id)`.

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `user_id` uuid not null |
| `target_type` text not null |
| `target_id` uuid not null |
| `favorite` boolean not null default false |
| `personal_note` text nullable |
| `updated_at` timestamptz not null |
| `revision` bigint not null default 1 |

Target and user membership validated same project.

## `member_ratings`

Unique active `(project_id,user_id,target_type,target_id,dimension_key)`.

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `user_id` uuid not null |
| `target_type`,`target_id` | validated same project |
| `dimension_key` text not null |
| `rating` numeric(4,2) not null check 0..10 |
| `updated_at` timestamptz not null |
| `revision` bigint not null default 1 |

---

# 11. Tasks, decisions and Inbox

## `tasks`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `title` text not null |
| `description` text nullable |
| `status` text not null |
| `priority` text not null default `normal` |
| `owner_type` | `member`,`both`,`third_party`,`unassigned` |
| `owner_user_id` uuid nullable |
| `third_party_label` text nullable |
| `due_at` timestamptz nullable |
| `waiting_for` text nullable |
| `waiting_since` timestamptz nullable |
| `follow_up_at` timestamptz nullable |
| `is_blocker` boolean not null default false |
| `completed_at` timestamptz nullable |
| audit columns |

Owner user, when present, must be active member of same project.

## `task_dependencies`

Unique `(project_id,task_id,depends_on_task_id)`. Composite same-project FKs. Self-dependency forbidden. Cycles are rejected by application/domain validation; tests cover cycle detection.

## `task_links`

`id`, `project_id`, `task_id`, `target_type`, `target_id`, creation metadata; target same-project validation.

## `decisions`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `title` text not null |
| `description` text nullable |
| `status` text not null |
| `requires_all_owners` boolean not null default false |
| `due_at` timestamptz nullable |
| `final_option_id` uuid nullable |
| `final_rationale` text nullable |
| `finalized_at`,`locked_at` timestamptz nullable |
| audit columns |

`final_option_id`, if present, must belong to this same decision and project.

## `decision_options`

`id`, `project_id`, `decision_id`, `label`, `description`, `sort_order`, optional same-project polymorphic target, audit metadata.

## `decision_approvals`

Unique `(project_id,decision_id,user_id)`. `user_id` must be an active member; `option_id`, if set, must belong to same decision. Includes `approval_state`, optional comment, updated_at.

## `decision_links`

Generic same-project target links.

## `inbox_items`

Fast capture that is not yet normalized into a domain entity.

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `created_by` uuid not null |
| `capture_type` | `text`,`url`,`venue_hint`,`vendor_hint`,`guest_hint`,`task_hint`,`document_hint`,`other` |
| `raw_text` text nullable |
| `url` text nullable |
| `status` | `inbox`,`converted`,`archived`,`discarded` |
| `converted_target_type` text nullable |
| `converted_target_id` uuid nullable |
| `notes` text nullable |
| audit columns |

Conversion is explicit and idempotent; archived/discarded capture remains recoverable per deletion policy until purge.

---

# 12. Budget categories, scenarios, items and cash movements

## `budget_categories`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `key` text not null |
| `label` text not null |
| `sort_order` integer default 0 |
| `active` boolean default true |
| audit columns |

Unique active `(project_id,key)`.

## `budget_scenarios`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `name` text not null |
| `status` | `draft`,`active`,`archived` |
| `date_option_id` uuid nullable |
| `venue_id` uuid nullable |
| `guest_count` integer nullable check >=0 |
| `scenario_class` | `minimum`,`probable`,`maximum`,`custom` default `custom` |
| `notes` text nullable |
| audit columns |

At most one active operational scenario per project. Named scenarios may coexist. Date/venue links must be same-project.

## `budget_items`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `category_id` uuid not null |
| `label` text not null |
| `status` text not null |
| `calculation_type` | `fixed`,`per_guest`,`per_adult`,`per_child`,`per_table`,`per_hour`,`quantity_unit`,`manual_total`,`minimum_plus_variable` |
| `currency` char(3) not null default EUR |
| `unit_amount_minor` bigint nullable |
| `quantity` numeric(12,3) nullable |
| `guest_count_basis` integer nullable |
| `minimum_amount_minor` bigint nullable |
| `estimated_amount_minor` bigint nullable |
| `quoted_amount_minor` bigint nullable |
| `approved_amount_minor` bigint nullable |
| `contracted_amount_minor` bigint nullable |
| `required` boolean not null default true |
| `source_offer_type` text nullable |
| `source_offer_id` uuid nullable validated same project |
| `notes` text nullable |
| audit columns |

Derived totals are computed and never independently editable truth.

## `budget_scenario_items`

Unique `(project_id,scenario_id,budget_item_id)`.

| Column | Type |
|---|---|
| `project_id` uuid not null |
| `scenario_id` uuid not null |
| `budget_item_id` uuid not null |
| `included` boolean not null default true |
| `quantity_override` numeric(12,3) nullable |
| `guest_count_override` integer nullable |
| `unit_amount_override_minor` bigint nullable |
| `notes` text nullable |
| audit columns |

This relation persists scenario-specific assumptions rather than overwriting the base budget item.

## `payments`

A payment row is a planned or actual cash movement. Refunds/returns are separate linked movements; authoritative amounts remain non-negative.

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `budget_item_id` uuid not null |
| `related_payment_id` uuid nullable; original payment when refund/return relates to one |
| `payment_type` | `deposit_nonrefundable`,`installment`,`final_balance`,`refundable_security_deposit`,`refund`,`credit`,`deposit_return`,`other` |
| `status` | `planned`,`due`,`processing`,`manual_pending`,`paid`,`partially_refunded`,`refunded`,`cancelled`,`overdue` |
| `amount_minor` bigint not null check >=0 |
| `currency` char(3) not null |
| `due_date` date nullable |
| `paid_at` timestamptz nullable |
| `document_id` uuid nullable |
| `notes` text nullable |
| audit columns |

Rules:

- refund/credit/deposit-return movements link to original where applicable;
- original payment status may become partially_refunded/refunded based on linked movements;
- overdue status is derived/maintained from due date and lifecycle rules, not arbitrary arithmetic alone;
- refundable security deposits are excluded from expected final cost but included in temporary cash exposure.

## `budget_links`

Generic same-project links from budget item to venue/vendor/decision/etc.

---

# 13. Planning and milestones

## `milestones`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `key` text nullable stable system key |
| `label` text not null |
| `phase` text not null |
| `weight` numeric(8,3) not null check >=0 |
| `status` text not null |
| `target_date` date nullable |
| `offset_days_from_wedding` integer nullable |
| `completion_rule_type` | `manual`,`all_linked_tasks_done`,`decision_locked`,`entity_status`,`custom_supported_rule` |
| `completion_rule_json` jsonb nullable |
| `completed_at` timestamptz nullable |
| audit columns |

## `milestone_dependencies`

Unique `(project_id,milestone_id,depends_on_milestone_id)`; same-project FKs; no self-dependency; cycles rejected by domain validation.

## `milestone_links`

Generic same-project links to tasks/decisions/entities used for completion/progress explanation.

---

# 14. Documents, media and tags

## `documents`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
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

## `media`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `media_type` text not null |
| `category` text nullable |
| `storage_path` text nullable |
| `remote_url` text nullable |
| `source_page_url` text nullable |
| `original_filename`,`mime_type` text nullable |
| `size_bytes` bigint nullable |
| `sha256` text nullable |
| `width_px`,`height_px` integer nullable |
| `derivative_of_id` uuid nullable |
| `is_original` boolean not null default true |
| `upload_status` text not null |
| `caption` text nullable |
| audit columns |

Derivative FK must be same project. Exact-byte duplicates are detected by project+hash; derivative/original semantics prevent accidental replacement.

## `document_links` / `media_links`

Each contains `id`, `project_id`, source object id, `target_type`, `target_id`, optional `relationship_type`, creation metadata. Source and target both same-project.

## `tags`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `key` text not null |
| `label` text not null |
| audit columns |

Unique active `(project_id,key)`.

## `entity_tags`

Unique `(project_id,tag_id,target_type,target_id)`; tag and target same project.

---

# 15. Import mapping, history, external IDs and rollback

## `import_mapping_profiles`

Persists user-approved mappings for repeat spreadsheet layouts.

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `user_id` uuid not null |
| `name` text not null |
| `domain` text not null |
| `source_signature` text nullable |
| `locale` text nullable |
| `mapping_json` jsonb not null |
| `normalization_json` jsonb nullable |
| `last_used_at` timestamptz nullable |
| audit columns |

## `imports`

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `source_type` text not null |
| `original_filename` text nullable |
| `source_namespace` text nullable |
| `file_sha256` text nullable |
| `schema_name`,`schema_version` text nullable |
| `status` text not null |
| `mapping_profile_id` uuid nullable |
| `summary_json` jsonb nullable |
| `started_at` timestamptz not null |
| `completed_at` timestamptz nullable |
| `created_by` uuid not null |

Index `(project_id,file_sha256)` where hash non-null for duplicate-file warning; not necessarily unique because re-analysis is permitted explicitly.

## `import_changes`

`id`, `project_id`, `import_id`, entity type/id, change type, before/after safe JSON, applied revision, rollback timestamp. Large binary/sensitive file content never copied into change JSON.

## `external_identifiers`

Used for idempotent import matching.

| Column | Type |
|---|---|
| `id` uuid PK |
| `project_id` uuid not null |
| `namespace` text not null |
| `entity_type` text not null |
| `entity_id` uuid not null |
| `parent_entity_type` text nullable |
| `parent_entity_id` uuid nullable |
| `external_id` text not null |
| `created_at` timestamptz not null |

Uniqueness is parent-aware:

- top-level (`parent_entity_id is null`): unique `(project_id,namespace,entity_type,external_id)`;
- nested (`parent_entity_id is not null`): unique `(project_id,namespace,entity_type,parent_entity_type,parent_entity_id,external_id)`.

Parent and target are validated same project. Therefore two different venues may each import a nested space `externalId = "main"` safely.

---

# 16. Activity and sync metadata

## `activity_log`

Human-meaningful project activity, not raw telemetry.

Fields: `id`, `project_id`, `actor_user_id`, `device_id` nullable, `event_type`, optional entity type/id, safe summary key/metadata, `occurred_at`, optional `operation_id`.

Never persist secrets/full sensitive payloads merely for logging.

## `sync_mutation_receipts`

| Column | Type |
|---|---|
| `operation_id` uuid PK |
| `project_id` uuid not null |
| `user_id` uuid not null |
| `device_id` uuid nullable |
| `entity_type` text not null |
| `entity_id` uuid nullable |
| `result_revision` bigint nullable |
| `created_at` timestamptz not null |

Retention must exceed the supported normal offline-retry window.

---

# 17. RLS and privileged command baseline

Every project-scoped table enables RLS.

Active membership baseline:

```text
exists (
  select 1
  from project_members pm
  where pm.project_id = row.project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
)
```

Write policies additionally check role and immutable/protected columns.

Critical operations execute through narrowly scoped database commands/functions with internal authorization and fixed safe `search_path`, including at minimum:

- create initial project + owner atomically;
- create/revoke/accept partner invitation;
- select wedding date atomically;
- activate budget scenario atomically;
- ownership changes / final-owner protection;
- destructive project purge;
- any cross-row state transition that cannot be safely expressed as ordinary update.

`SECURITY DEFINER` is used only when necessary and always performs explicit authorization before mutation.

Storage RLS validates project membership from object namespace; object ownership alone is insufficient.

---

# 18. Closed single-couple deployment bootstrap

V1 production is a **single-couple deployment**, not a public SaaS signup service.

Operational bootstrap:

1. deploy empty production stack;
2. enable Auth registration only for controlled onboarding;
3. first intended owner creates/authenticates account and is permitted to create the one project;
4. partner receives one-time project invitation and creates/authenticates matching account if needed;
5. partner accepts invitation and enrolls MFA;
6. both owners verify recovery/second-factor plan;
7. disable unrestricted new Auth signups for normal operation;
8. project-creation command refuses additional projects in this deployment unless a future ADR changes product model.

Re-enabling signup for recovery/new authorized member is an explicit owner/operator action, not normal public behavior.

This prevents unrelated Internet users from consuming Auth/database/storage free-tier resources simply because the static application URL is public.

---

# 19. Indexing baseline

Evaluate/create indexes for:

- every composite same-project FK join;
- `(project_id,status)` on lifecycle tables;
- task/payment deadlines;
- `(project_id,updated_at)` where sync/activity queries need it;
- fact lookup `(project_id,target_type,target_id,definition_id)`;
- external-ID partial uniqueness;
- import file hash lookup;
- venue status/name/code;
- budget scenario/item joins;
- seating assignment/table lookups;
- activity time cursor;
- media/document links.

Do not add speculative indexes without query need, but required security/integrity unique constraints are not optional optimization.

---

# 20. Physical-schema acceptance tests

Before Lot 1 is complete, direct database tests must prove at minimum:

1. cross-project child→parent references are rejected by constraints/triggers;
2. cross-project polymorphic target references are rejected;
3. user A cannot CRUD project B rows through direct API;
4. final owner cannot be removed;
5. invite token cannot be reused or accepted by wrong authenticated email;
6. weekday `6` maps to Saturday in DB/import tests;
7. nested external IDs are unique only within their parent scope;
8. named budget scenarios coexist and exactly one active scenario is enforced;
9. payment/refund lifecycle represents partial and complete refunds without negative authoritative amounts;
10. guest cannot be assigned to table in another project and cannot have two active table assignments;
11. retained fact can have multiple evidence sources;
12. mapping profiles remain user/project scoped;
13. all selected date/venue/scenario references are same-project;
14. no public signup can create additional production projects after bootstrap lock;
15. soft-deleted active-unique entities can be restored or recreated according to documented policy without uniqueness corruption.

---

# 21. Physical-schema change rule

Migrations may change names/normalization only if:

- all documented domain semantics/invariants remain satisfied;
- same-project relational integrity remains enforced;
- RLS remains directly testable;
- offline/import/export mappings are updated;
- historical migration fixtures are added;
- this reference and affected docs/ADRs are updated.

The persistence model is no longer an unspecified design task.