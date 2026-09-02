# Conceptual Entity Relationship Model

This is the conceptual ERD for V1. The normative physical PostgreSQL reference is [`PHYSICAL-SCHEMA-V1.md`](PHYSICAL-SCHEMA-V1.md); versioned migrations implement that reference and may refine physical details only under the documented migration/specification rules.

```text
profiles
  │
  └──< project_members >── projects
                            │
                            ├──< venues ──< venue_spaces
                            │       │
                            │       ├──< facts ──< fact_observations >── sources
                            │       ├──< venue_offers ──< offer_components
                            │       ├──< venue_availabilities
                            │       ├──< media_links >── media
                            │       ├──< document_links >── documents
                            │       └──< contacts/interactions
                            │
                            ├──< vendors
                            │       ├──< facts
                            │       ├──< vendor_offers ──< offer_components
                            │       ├──< contacts
                            │       ├──< interactions
                            │       └──< document/media links
                            │
                            ├──< households ──< guests
                            │
                            ├──< tasks
                            │       ├──< task_dependencies
                            │       └──< task_links → validated project entities
                            │
                            ├──< decisions
                            │       ├──< decision_options
                            │       ├──< decision_approvals
                            │       └──< decision_links → validated project entities
                            │
                            ├──< budget_items
                            │       ├──< payments
                            │       └──< budget_links → validated project entities
                            │
                            ├──< milestones
                            ├──< fact_definitions
                            ├──< sources
                            ├──< media
                            ├──< documents
                            ├──< imports ──< import_changes
                            ├──< external_identifiers
                            ├──< activity_log
                            └──< sync_mutation_receipts
```

## Core project entities

### `projects`

One wedding workspace. Contains project-wide settings such as display name, locale, timezone, currency, target date and target guest count.

### `project_members`

Links authenticated profiles/users to projects with a role and membership status. Membership is the basis of RLS authorization.

### `profiles`

User-facing identity metadata separate from auth provider internals.

## Venue domain

### `venues`

A physical venue candidate or selected venue. Contains stable identity/location/status fields rather than an ever-growing set of criterion columns.

### `venue_spaces`

Distinct reception/ceremony/terrace/garden/kitchen/accommodation spaces attached to a venue. Capacity belongs to the relevant space when possible rather than only at venue level.

### `venue_offers`

Commercial pricing packages with validity/date/day rules, deposits/cautions and pricing components.

### `venue_availabilities`

Observed availability for candidate wedding dates, including options/holds and observation time.

## Generic facts and provenance

### `fact_definitions`

Project-visible typed criterion definitions such as external caterer, air conditioning, panoramic view or music end time.

### `facts`

The current semantic fact attached to a supported entity: state, retained value, retained observation and freshness metadata.

### `fact_observations`

Append-oriented evidence observations that preserve individual values, evidence strength, source, time and import provenance.

### `sources`

External or internal evidence: official site, quote, contract, email, phone-call note, visit observation, specialist directory or import source.

This structure is intentionally richer than one `value + source_url` field because conflicting/historical evidence must survive.

## Vendor domain

### `vendors`

Generic supplier entity with `vendor_type` such as caterer, photographer, DJ, florist, transport or accommodation.

Specialized properties use facts/offers rather than duplicating nearly identical supplier tables.

### `contacts`

Named contact methods/people related to a venue/vendor.

### `interactions`

Chronological contact history: email, phone call, visit, quote received, follow-up, etc.

## Guest domain

### `households`

Invitation/address grouping. A household can contain one or more guests.

### `guests`

Individual invitee with priority, probability, RSVP and limited useful logistics/meal metadata.

## Work-management domain

### `tasks`

Actionable work with owner, due date, status, priority, dependencies, waiting/follow-up metadata and links to related entities.

### `decisions`

A question/options/rationale workflow distinct from tasks. Can require both primary owners to approve.

## Finance domain

### `budget_items`

Expected/quoted/approved/contracted cost item with calculation method and scenario relevance.

### `payments`

Actual/expected cash movements against budget items. Refundable deposits/cautions are distinct from final cost.

## Files

### `media`

Image/media metadata; may point to private Storage objects or remote source URLs. Originals and derivatives remain distinguishable.

### `documents`

Quotes, contracts, invoices, plans and other files. Stored privately when uploaded.

`media_links` and `document_links` allow legitimate many-to-many relationships while enforcing same-project validation.

## Imports and external identity

### `imports`

Import-session metadata: file hash, source, schema/mapping profile, summary and actor.

### `import_changes`

Applied change lineage used for provenance and intelligent rollback.

### `external_identifiers`

Stable namespaced importer IDs mapped to internal entity UUIDs for idempotent re-import.

## Activity and sync

### `activity_log`

Human-meaningful mutation history sufficient for “since your last visit,” decision history and recovery diagnostics without storing unnecessary sensitive payloads.

### `sync_mutation_receipts`

Server-side operation receipts/idempotence metadata for safe retries of local-first mutations.

## Relationship rules

- Every project-scoped row belongs to exactly one project, directly where the physical schema specifies it.
- Cross-project foreign keys/links are forbidden.
- Generic polymorphic links validate target type, existence and same-project ownership.
- Normal entity deletion is soft first where defined.
- Derived values are not independent authoritative entities unless a documented cache strategy exists.
- Project isolation is enforced by RLS and tested with allow/deny cases.

See [`PHYSICAL-SCHEMA-V1.md`](PHYSICAL-SCHEMA-V1.md) for concrete tables, columns, constraints, indexing baseline and RLS structure.
