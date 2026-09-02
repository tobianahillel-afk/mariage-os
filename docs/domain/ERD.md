# Conceptual Entity Relationship Model

This is the conceptual ERD for V1. Physical SQL details will be finalized in migrations, but implementation must preserve these relationships and invariants.

```text
profiles
  │
  └──< project_members >── projects
                            │
                            ├──< venues ──< venue_spaces
                            │       │
                            │       ├──< facts >── fact_sources >── sources
                            │       ├──< venue_offers
                            │       ├──< venue_availabilities
                            │       ├──< media_links >── media
                            │       ├──< document_links >── documents
                            │       └──< interactions
                            │
                            ├──< vendors
                            │       ├──< facts
                            │       ├──< offers/quotes
                            │       ├──< contacts
                            │       ├──< interactions
                            │       └──< document/media links
                            │
                            ├──< households ──< guests
                            │
                            ├──< tasks
                            │       └── task_links → arbitrary project entities
                            │
                            ├──< decisions
                            │       ├──< decision_options
                            │       ├──< decision_votes/approvals
                            │       └── decision_links → arbitrary project entities
                            │
                            ├──< budget_items
                            │       ├──< payments
                            │       └── budget_links → venue/vendor/etc.
                            │
                            ├──< milestones
                            │
                            ├──< sources
                            ├──< media
                            ├──< documents
                            ├──< imports
                            ├──< activity_log
                            └──< sync/audit metadata where required
```

## Core project entities

### `projects`

One wedding workspace. Contains project-wide settings such as display name, locale, timezone, currency, target date/range, target guest count and free-tier preferences.

### `project_members`

Links authenticated profiles to projects with a role. Membership is the basis of RLS authorization.

### `profiles`

User-facing identity metadata separate from auth provider internals.

## Venue domain

### `venues`

A physical venue candidate or selected venue. Contains stable identity/location/status fields only.

### `venue_spaces`

Distinct reception/ceremony/terrace/garden/kitchen/accommodation spaces attached to a venue. Capacity must be associated with the relevant space when possible rather than only at venue level.

### `venue_offers`

Commercial pricing packages with validity/date/day rules, inclusions, deposits/cautions and pricing components.

### `venue_availabilities`

Observed availability for candidate wedding dates, including options/holds and observation freshness.

## Generic facts and provenance

### `facts`

Extensible typed attributes about an entity. Examples: air conditioning, external caterer allowed, music end time, accessibility rating.

Facts distinguish retained value, state, confidence and freshness.

### `sources`

External or internal evidence: official site, quote, contract, email, phone-call note, visit observation, specialist directory, imported source.

### `fact_sources`

Many-to-many relationship between facts/observations and evidence.

## Vendor domain

### `vendors`

Generic supplier entity with a `vendor_type` such as caterer, photographer, DJ, florist, transport or accommodation.

Specialized fields should use definitions/facts/offers rather than duplicating nearly identical supplier tables.

### `contacts`

Named contact methods/people related to a venue/vendor when needed.

### `interactions`

Chronological contact history: email, phone call, meeting, visit, quote received, follow-up, etc.

## Guest domain

### `households`

Invitation/address grouping. A household can contain one or more guests.

### `guests`

Individual invitee with priority, probability, RSVP and logistics/meal metadata.

## Work-management domain

### `tasks`

Actionable work with owner, due date, status, priority, blocking/dependency metadata and links to related entities.

### `decisions`

A question/options/rationale workflow distinct from tasks. Can require both primary owners to approve.

## Finance domain

### `budget_items`

Expected/quoted/contracted cost item with calculation method and scenario relevance.

### `payments`

Actual/expected cash movements against budget items. Refundable cautions/deposits must be modeled distinctly from final cost.

## Files

### `media`

Image/video metadata; may point to private Storage objects or remote source URLs.

### `documents`

Quotes, contracts, invoices, plans and other files. Stored privately when uploaded.

Links are many-to-many where a document/media item legitimately relates to multiple entities.

## Imports

### `imports`

Import-session metadata: file hash, source, mapping profile, preview summary, applied changes and rollback lineage.

## Activity/audit

### `activity_log`

Human-meaningful and/or technical mutation history sufficient for “since your last visit,” decision history and recovery diagnostics.

## Relationship rules

- Every project-scoped row must be bound to exactly one project, directly or through a parent with enforceable membership.
- Cross-project foreign keys are forbidden.
- Normal entity deletion is soft first.
- Generic link tables must still enforce project consistency.
- Derived values are not independent authoritative entities unless a documented cache strategy exists.
