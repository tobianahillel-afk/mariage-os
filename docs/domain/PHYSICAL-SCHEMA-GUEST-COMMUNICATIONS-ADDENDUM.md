# Mariage OS — Physical Schema Addendum: Guest Invitations & Communications

Status: **NORMATIVE V1 SCHEMA ADDENDUM**

This addendum extends the frozen V1 physical schema. Same-project integrity rules, UUID conventions, timestamps, soft-delete/history rules and RLS principles from the base schema remain applicable.

## New/extended entities

### `guest_contact_points`

Purpose: normalized contact endpoints without overloading the guest row.

Fields:
- `id uuid pk`
- `project_id uuid not null`
- `guest_id uuid null`
- `household_id uuid null`
- `kind text check in ('email','phone')`
- `value_normalized text not null`
- `value_display text null`
- `label text null`
- `is_primary boolean not null default false`
- `verification_state text not null default 'unverified'`
- `source text null`
- `created_at timestamptz`
- `updated_at timestamptz`

Constraint: exactly one of `guest_id` or `household_id` must be non-null unless a future approved migration changes the ownership model. All referenced entities must belong to `project_id`.

Unique strategy: no global uniqueness across projects. Deduplication is project-scoped and conservative.

### `guest_invitation_links`

Purpose: secure capability links for one household invitation scope.

Fields:
- `id uuid pk`
- `project_id uuid not null`
- `household_id uuid not null`
- `token_hash bytea/text not null unique`
- `state text not null check in ('draft','active','revoked','expired')`
- `expires_at timestamptz null`
- `rsvp_deadline date null`
- `allow_edit_after_submit boolean not null default true`
- `allow_plus_one_count integer not null default 0`
- `allow_additional_children_count integer not null default 0`
- `question_profile_id uuid null`
- `activated_at timestamptz null`
- `revoked_at timestamptz null`
- `created_at timestamptz`
- `updated_at timestamptz`

Raw token MUST NOT be stored.

### `guest_rsvp_submissions`

Append-oriented submission/audit record.

Fields:
- `id uuid pk`
- `project_id uuid not null`
- `invitation_link_id uuid not null`
- `household_id uuid not null`
- `submission_version integer not null`
- `idempotency_key text not null`
- `submitted_at timestamptz not null`
- `payload_summary jsonb not null` (privacy-minimized, typed schema)
- `source_ip_hash text null` only if justified by anti-abuse policy; never raw by default
- `user_agent_class text null` only if needed for diagnostics

Unique: `(invitation_link_id, idempotency_key)`.

### `rsvp_question_profiles`

Project-scoped reusable public form configuration.

Fields:
- `id uuid pk`
- `project_id uuid not null`
- `name text not null`
- `version integer not null`
- `fields jsonb not null` validated against a fixed allowlisted schema
- `is_default boolean not null default false`
- timestamps

No arbitrary executable form logic.

### `communication_templates`

Fields:
- `id uuid pk`
- `project_id uuid not null`
- `channel text check in ('email','sms','whatsapp')`
- `purpose text not null`
- `name text not null`
- `version integer not null`
- `subject_template text null`
- `body_template text not null`
- `provider_template_reference text null`
- `allowed_variables jsonb not null`
- `state text not null`
- timestamps

### `communication_campaigns`

Fields:
- `id uuid pk`
- `project_id uuid not null`
- `purpose text not null`
- `channel text not null`
- `template_id uuid not null`
- `state text not null`
- `scheduled_at timestamptz null`
- `audience_filter_snapshot jsonb not null`
- `recipient_count integer not null default 0`
- `known_cost_minor bigint null`
- `currency char(3) null`
- `created_by uuid not null`
- `created_at/updated_at`

Audience is frozen into recipient rows before send.

### `communication_recipients`

Fields:
- `id uuid pk`
- `project_id uuid not null`
- `campaign_id uuid not null`
- `household_id uuid not null`
- `guest_contact_point_id uuid not null`
- `invitation_link_id uuid null`
- `destination_snapshot text not null`
- `personalization_snapshot jsonb not null`
- `state text not null`
- `provider_message_id text null`
- `idempotency_key text not null`
- `last_error_code text null`
- `last_error_class text null`
- timestamps

Unique: `(campaign_id, idempotency_key)`.

### `communication_events`

Append-only normalized/provider webhook history.

Fields:
- `id uuid pk`
- `project_id uuid not null`
- `communication_recipient_id uuid not null`
- `provider_event_id text null`
- `provider text not null`
- `normalized_state text not null`
- `provider_state text null`
- `provider_event_at timestamptz null`
- `received_at timestamptz not null`
- `metadata jsonb null` privacy-minimized

Deduplicate `(provider, provider_event_id)` when provider guarantees stable event IDs.

### `communication_suppressions`

Project/provider/channel suppression of invalid/revoked destinations.

Fields include project, normalized destination hash/value reference, channel, reason, source, active flag, timestamps.

## Existing table extensions

`households` / `guests` may gain guest-visible/public-safe display fields only through explicit migrations. Internal priority/probability/private notes remain separate and MUST NOT be surfaced through portal queries.

## RLS and access model

Project-member CRUD uses project permissions.

Guest capability endpoints MUST NOT be implemented as broad anonymous SELECT/UPDATE policies on project tables. Prefer narrowly scoped server-side/RPC/edge endpoints that:

1. resolve token hash;
2. validate active state/expiry/rate limits;
3. construct a minimal guest-safe response DTO;
4. validate submission runtime schema;
5. apply only allowed household/person RSVP mutations transactionally.

Outbound provider credentials are never stored in project-readable tables in plaintext. Provider secret configuration belongs in platform secret storage/environment.

## Indexes

At minimum review indexes for:
- invitation `token_hash`;
- project/household invitation lookup;
- campaign state/scheduled time;
- campaign recipient state;
- provider message/event identifiers;
- project-scoped contact lookup.

## Deletion/retention

Communication event history and guest submissions follow privacy-retention policy. Provider payloads are not stored wholesale unless explicitly justified; retain normalized evidence needed for operations/audit only.