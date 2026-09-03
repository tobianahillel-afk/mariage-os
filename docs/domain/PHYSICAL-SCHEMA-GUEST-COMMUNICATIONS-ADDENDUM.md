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

Constraint: exactly one of `guest_id` or `household_id` must be non-null unless a future approved migration changes ownership. All referenced entities must belong to `project_id`.

No global uniqueness across projects. Deduplication is project-scoped and conservative.

### `guest_contact_channel_eligibility`

Purpose: channel-specific send eligibility/consent/suppression evidence without treating possession of a phone/email as universal permission to message.

Fields:
- `id uuid pk`
- `project_id uuid not null`
- `guest_contact_point_id uuid not null`
- `channel text check in ('email','sms','whatsapp')`
- `state text not null check in ('unknown','eligible','ineligible','opted_out','suppressed')`
- `basis text null`
- `source text null`
- `captured_at timestamptz null`
- `expires_at timestamptz null`
- `updated_by uuid null`
- timestamps

Unique current projection: `(guest_contact_point_id, channel)`; historical changes may be retained via activity/history according to implementation pattern.

This table represents platform/provider eligibility evidence, not automatic legal compliance certification.

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

### `communication_channel_settings`

Purpose: project-visible non-secret channel policy/configuration. Reusable provider credentials remain in secret/runtime infrastructure, not this table.

Fields:
- `id uuid pk`
- `project_id uuid not null`
- `channel text check in ('email','sms','whatsapp')`
- `provider_key text null`
- `enabled boolean not null default false`
- `readiness_state text not null default 'not_configured'`
- `sender_reference text null` (non-secret provider/domain/number/business identifier)
- `default_template_id uuid null`
- `per_campaign_recipient_cap integer null`
- `daily_recipient_cap integer null`
- `monthly_recipient_cap integer null`
- `cost_cap_minor bigint null`
- `currency char(3) null`
- `updated_by uuid null`
- timestamps

Unique: `(project_id, channel)`.

No reusable provider API key, access token or webhook secret belongs here.

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
- `preflight_revision bigint/int not null`
- `audience_filter_snapshot jsonb not null`
- `recipient_count integer not null default 0`
- `known_cost_minor bigint null`
- `currency char(3) null`
- `created_by uuid not null`
- timestamps

Audience is frozen into recipient rows before send. `preflight_revision`/fingerprint semantics must allow stale-preview detection.

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

Recipient row is the frozen send target. It does not silently follow later contact-point changes.

### `communication_attempts`

Purpose: distinguish logical recipient from one or more provider attempts/retries.

Fields:
- `id uuid pk`
- `project_id uuid not null`
- `communication_recipient_id uuid not null`
- `attempt_number integer not null`
- `provider text not null`
- `provider_message_id text null`
- `state text not null`
- `started_at timestamptz not null`
- `finished_at timestamptz null`
- `error_class text null`
- `error_code text null`
- `known_cost_minor bigint null`
- `currency char(3) null`

Unique `(communication_recipient_id, attempt_number)`.

### `communication_events`

Append-only normalized/provider webhook history.

Fields:
- `id uuid pk`
- `project_id uuid not null`
- `communication_recipient_id uuid not null`
- `communication_attempt_id uuid null`
- `provider_event_id text null`
- `provider text not null`
- `normalized_state text not null`
- `provider_state text null`
- `provider_event_at timestamptz null`
- `received_at timestamptz not null`
- `metadata jsonb null` privacy-minimized

Deduplicate `(provider, provider_event_id)` when provider guarantees stable event IDs.

### `communication_suppressions`

Project/channel suppression of invalid/revoked destinations.

Fields:
- `id uuid pk`
- `project_id uuid not null`
- `guest_contact_point_id uuid null`
- `channel text not null`
- `destination_hash text null`
- `reason text not null`
- `source text null`
- `active boolean not null default true`
- `created_at timestamptz`
- `resolved_at timestamptz null`
- `resolved_by uuid null`

A suppression does not require storing duplicate raw destination when contact-point reference is sufficient.

## Existing table extensions

`households` / `guests` may gain guest-visible/public-safe display fields only through explicit migrations. Internal priority/probability/private notes remain separate and MUST NOT be surfaced through portal queries.

Project settings may reference a default RSVP question profile and public wedding identity through explicit same-project relations/settings, but no guest portal reads unrestricted project settings.

## Same-project integrity

Every FK between project-owned communication/contact entities must enforce or validate same-project ownership using the same composite-integrity pattern as the frozen base schema.

Examples that MUST NOT be cross-project:
- contact point → guest/household;
- invitation link → household/question profile;
- campaign → template;
- recipient → campaign/household/contact/link;
- event/attempt → recipient;
- channel setting → default template.

## RLS and access model

Project-member CRUD uses explicit project permissions.

Guest capability endpoints MUST NOT be implemented as broad anonymous SELECT/UPDATE policies on project tables. Prefer narrowly scoped server-side/RPC/edge endpoints that:

1. resolve token hash;
2. validate active state/expiry/rate limits;
3. construct a minimal guest-safe response DTO;
4. validate submission runtime schema;
5. apply only allowed household/person RSVP mutations transactionally.

Outbound provider credentials are never stored in project-readable tables in plaintext. Provider secret configuration belongs in platform secret storage/runtime. In future public SaaS, a provider-connection abstraction may point project settings to platform-managed or tenant-bound secret records without exposing secret material.

## Indexes

At minimum review indexes for:
- invitation `token_hash`;
- project/household invitation lookup;
- contact project/owner/channel eligibility;
- campaign state/scheduled time;
- campaign recipient state;
- recipient/provider message identifiers;
- attempt/provider identifiers;
- provider event identifiers;
- active suppressions;
- channel readiness.

## Deletion/retention

Communication event history and guest submissions follow privacy-retention policy. Provider payloads are not stored wholesale unless explicitly justified; retain normalized evidence needed for operations/audit only.

Deleting a contact/guest/household follows existing soft-delete/reference rules and must not make historical communication evidence point ambiguously to another entity.