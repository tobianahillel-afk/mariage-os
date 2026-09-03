# Conceptual Entity Relationship Model

Status: **Frozen V1 conceptual model aligned with `PHYSICAL-SCHEMA-V1.md` + freeze addendum**

The physical schema and addendum are normative for SQL implementation. This document provides one conceptual map so no V1 entity is hidden only in an addendum.

```text
auth.users
   │
profiles
   │
   └──< project_members >── projects ──< project_invitations
                            │
                            ├── user_project_preferences (per member)
                            ├── project_reference_origins
                            ├── wedding_date_options
                            │
                            ├── venues
                            │    ├── venue_spaces
                            │    ├── venue_offers ──< offer_components
                            │    ├── venue_availabilities → date option
                            │    ├── venue_access_routes → reference origin
                            │    ├── contacts / interactions
                            │    ├── facts / evidence
                            │    └── media/document/tag links
                            │
                            ├── vendors
                            │    ├── vendor_offers ──< offer_components
                            │    ├── contacts / interactions
                            │    ├── facts / evidence
                            │    └── media/document/tag links
                            │
                            ├── fact_definitions (incl. evaluation rule)
                            ├── facts
                            │    └── fact_observations
                            │          └──< observation_sources >── sources
                            │                                      └── optional document evidence
                            │
                            ├── guest_categories
                            ├── households ──< guests
                            │
                            ├── seating_sections ──< seating_tables
                            │                          └──< seating_assignments >── guests
                            │
                            ├── member_entity_preferences
                            ├── member_ratings
                            │
                            ├── tasks ──< task_dependencies / task_links
                            ├── decisions
                            │    ├── decision_options
                            │    ├── decision_approvals
                            │    └── decision_links
                            ├── inbox_items
                            │
                            ├── budget_categories
                            ├── budget_scenarios
                            │    └──< budget_scenario_items >── budget_items
                            │                                  ├── payments
                            │                                  └── budget_links
                            │
                            ├── milestones
                            │    ├── milestone_dependencies
                            │    └── milestone_links
                            │
                            ├── event_timeline_items
                            │    ├── event_timeline_dependencies
                            │    └── event_timeline_vendor_links → vendors/contacts
                            │
                            ├── documents
                            │    ├── document_links
                            │    ├── document_review_items → facts/sources/tasks
                            │    └── supersedes_document_id → documents
                            ├── media / media_links
                            ├── tags / entity_tags
                            │
                            ├── import_mapping_profiles
                            ├── imports ──< import_changes
                            ├── external_identifiers
                            ├── activity_log
                            └── sync_mutation_receipts
```

## Project and membership

### `projects`
One private wedding workspace. V1 production deployment is deliberately single-couple/closed-bootstrap rather than public SaaS project creation.

### `project_members`
Active user→project authorization/role plus member activity cursor used for “since your last visit”.

### `project_invitations`
Email-bound one-time pre-membership invitation; token hash only is persisted. Valid invitation still requires authenticated intended identity.

### `user_project_preferences`
Per-user cross-device UI preferences, distinct from shared wedding facts.

## Planning inputs

### `wedding_date_options`
Candidate/selected/rejected/archived dates. Zero-or-one selected maximum. Availability and budget scenarios may reference candidate dates.

### `project_reference_origins`
Private reference origins for contextual access/travel comparison.

## Venues/vendors/access

Venue/vendor identity rows remain relatively stable while spaces, offers, availability, interactions, facts, files and routes represent changing detail.

`venue_access_routes` preserves origin/mode-specific observations rather than flattening Paris/home/station travel into one ambiguous duration.

## Facts/evidence

### `fact_definitions`
Typed criterion definition plus configurable priority/weight/freshness and explicit evaluation rule when used for compatibility.

### `facts`
One retained semantic state/value per target+definition.

### `fact_observations`
Append-oriented evidence values, validated against the definition's value type.

### `observation_sources`
Many-to-many evidence links. A `source` can optionally point to the specific versioned document that constitutes evidence.

## Guests/seating

`guest_categories`, `households`, `guests` store invitation/people/statistics inputs.

V1 seating stores `seating_sections`, `seating_tables`, `seating_assignments`. It is structured/operational but non-graphical; drag/drop floor-plan is post-V1.

## Partner-specific opinions

`member_entity_preferences` and `member_ratings` keep personal favorites/notes/scores distinct from shared objective facts and from the other owner's opinion.

## Tasks/decisions/Inbox

- tasks = executable action/dependency/waiting state;
- decisions = alternatives/approvals/rationale;
- Inbox = low-friction unstructured capture before idempotent conversion.

## Finance

- `budget_categories` = taxonomy;
- `budget_items` = estimate/quote/contract source amounts;
- `budget_scenarios` = named date/venue/guest assumptions, multiple coexist;
- `budget_scenario_items` = scenario-specific inclusion/override without rewriting base truth;
- `payments` = explicit planned/actual cash movements, refunds/returns/deposits.

At most one scenario is active operationally; activation is protected/atomic.

## Planning and event timeline

### Milestones
`milestones` + dependencies/links model preparation outcomes and weighted progress.

### `event_timeline_items`
Models what happens during the wedding event: local time/day offset, location/venue space, responsibility, status and notes.

### Timeline links/dependencies
Dependencies remain acyclic and same-project. Vendor/contact links support operational/vendor-filtered exports.

Frozen timeline exports are generated historical artifacts, not rows that mutate with the live timeline.

## Documents/media/contract review

### `documents`
Private file metadata with optional date, review status and version/supersession link. Supersession is same-project/acyclic and never destroys older versions.

### `document_review_items`
Factual checklist items for quote/contract readiness, linkable to facts/sources/tasks. These are planning validation records, not legal-advice conclusions.

### `media`
Remote/private images and derivatives with original/preview distinction. DB link tables allow multiple entity relationships independently from physical object paths.

### Tags
Project-scoped reusable labels linked through `entity_tags`.

## Import/sync

`import_mapping_profiles`, imports/change lineage and `external_identifiers` support safe repeatable mappings/imports. Nested external identifiers are parent-scoped. Mutation receipts support retry idempotence.

## Same-project integrity

Every project-owned ordinary relationship is enforceably same-project with composite FKs where relational. Polymorphic links use DB validation. RLS is mandatory but not a substitute for referential integrity.

## Derived-data rule

Counts, totals, compatibility, readiness, progress and search/read models derive from authoritative inputs. Persisted caches, if introduced, must be invalidatable/rebuildable.

See:

- `PHYSICAL-SCHEMA-V1.md` + `PHYSICAL-SCHEMA-V1-ADDENDUM.md` for concrete persistence;
- `../security/RLS-MATRIX-V1.md` for authorization;
- `../architecture/LOCAL-DATA-SCHEMA.md` for offline/local representation.
