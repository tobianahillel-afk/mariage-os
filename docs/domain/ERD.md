# Conceptual Entity Relationship Model

Status: **V1 conceptual model aligned with `PHYSICAL-SCHEMA-V1.md`**

The physical schema is normative for SQL implementation; this document explains domain grouping and relationships.

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
                            ├── fact_definitions
                            ├── facts
                            │    └── fact_observations
                            │          └──< observation_sources >── sources
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
                            ├── documents / document_links
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
One private wedding workspace. V1 production deployment intentionally supports the couple's single project.

### `project_members`
Active authorized user→project relation and role. Also holds member activity cursor used for “since your last visit”.

### `project_invitations`
Pre-membership, email-bound one-time invitation with only token hash persisted. It is not a substitute for Auth verification.

### `user_project_preferences`
Per-user UI preferences; not shared planning truth.

## Planning inputs

### `wedding_date_options`
Candidate/selected/rejected dates. One selected maximum. Venue availability and budget scenario can reference candidate dates.

### `project_reference_origins`
Private origins used for contextual access/travel comparison.

## Venues and vendors

Venue/vendor identity rows remain relatively stable while spaces, offers, availabilities, interactions, sources and facts represent changing detail.

Capacity belongs to the relevant venue space whenever known, not only a commercial venue-level number.

### Access routes
`venue_access_routes` stores origin/mode-specific travel observations so Paris→venue and TGV-station→venue are not collapsed into one ambiguous duration fact.

## Facts/evidence

### `fact_definitions`
Project-configurable typed criterion definitions.

### `facts`
One retained operational fact state/value per target+definition.

### `fact_observations`
Append-oriented observations underneath the retained value.

### `observation_sources`
Many-to-many evidence links: one observation can cite multiple sources; one source can support multiple observations/facts.

## Guests and seating

### `guest_categories`
Configurable stable guest grouping taxonomy.

### `households` / `guests`
Invitation grouping + individual people, RSVP/probability/logistics.

### Seating
V1 persists sections, tables and guest assignments. It is an operational non-visual model; graphical floor plan is post-V1.

## Partner-specific opinions

`member_entity_preferences` and `member_ratings` keep individual favorites/notes/scores separate from shared objective facts. A partner cannot overwrite the other partner's rating row.

## Tasks, decisions and Inbox

Tasks represent actions/dependencies. Decisions represent alternatives/approvals/rationale. Inbox represents intentionally unstructured quick capture before conversion to a domain entity.

## Finance

### `budget_categories`
Project taxonomy.

### `budget_scenarios`
Named date/venue/guest assumptions; multiple coexist, at most one active operational scenario.

### `budget_scenario_items`
Per-scenario inclusion/override without overwriting base budget items.

### `payments`
Planned/actual cash movements including deposits, installments, refunds/returns. Refundable deposits are distinguishable from final cost.

## Planning/milestones

Milestones persist completion rules, dependencies and entity/task/decision links. Weighted progress is derived from this source state.

## Files/media/tags

Documents/media are private or remote-reference metadata with link tables. Tags are project-scoped reusable labels.

## Import/sync

Mapping profiles remember approved spreadsheet mappings. Imports/change rows preserve provenance/rollback. External identifiers make re-import idempotent and nested IDs parent-scoped. Mutation receipts support retry idempotence.

## Same-project integrity

Every project-owned ordinary relationship is enforceably same-project using composite foreign keys. Polymorphic links use database validation. RLS is mandatory but is not a replacement for relational integrity.

## Derived-data rule

Counts, totals, compatibility and readiness are derived from authoritative rows. They are not separate manually editable truths unless a documented invalidatable cache is later introduced.

See [`PHYSICAL-SCHEMA-V1.md`](PHYSICAL-SCHEMA-V1.md) for concrete columns/constraints and `../security/RLS-MATRIX-V1.md` for client authorization.