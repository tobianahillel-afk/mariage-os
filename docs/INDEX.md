# Documentation Index

## Start here

- [`START-HERE.md`](START-HERE.md) — mandatory onboarding path
- [`PRODUCT.md`](PRODUCT.md) — product definition and jobs to be done
- [`PRINCIPLES.md`](PRINCIPLES.md) — binding product/engineering principles
- [`NON-GOALS.md`](NON-GOALS.md) — scope boundaries

## Architecture

- [`architecture/OVERVIEW.md`](architecture/OVERVIEW.md)
- [`architecture/STACK.md`](architecture/STACK.md)
- [`architecture/TRUST-BOUNDARIES.md`](architecture/TRUST-BOUNDARIES.md)
- [`architecture/DATA-OWNERSHIP.md`](architecture/DATA-OWNERSHIP.md)
- [`architecture/LOCAL-FIRST.md`](architecture/LOCAL-FIRST.md)
- [`architecture/SYNC.md`](architecture/SYNC.md)
- [`architecture/OFFLINE.md`](architecture/OFFLINE.md)

## Domain and data model

- [`domain/ERD.md`](domain/ERD.md) — conceptual entity relationships
- [`domain/DATA-DICTIONARY.md`](domain/DATA-DICTIONARY.md) — field-definition rules
- [`domain/IDENTIFIERS.md`](domain/IDENTIFIERS.md) — UUID, external IDs and hashes
- [`domain/DATES-TIME.md`](domain/DATES-TIME.md) — date/time/timezone semantics
- [`domain/MONEY.md`](domain/MONEY.md) — exact financial semantics
- [`domain/STATE-MACHINES.md`](domain/STATE-MACHINES.md) — lifecycle rules
- [`domain/INVARIANTS.md`](domain/INVARIANTS.md) — non-negotiable integrity rules
- [`domain/FACTS-SOURCES.md`](domain/FACTS-SOURCES.md) — provenance model
- [`domain/CONFIDENCE-FRESHNESS.md`](domain/CONFIDENCE-FRESHNESS.md) — confidence/revalidation
- [`domain/DERIVED-DATA.md`](domain/DERIVED-DATA.md) — dependency/recalculation rules
- [`domain/DELETION-RETENTION.md`](domain/DELETION-RETENTION.md) — archival/purge rules
- [`domain/VENUES.md`](domain/VENUES.md)
- [`domain/VENDORS.md`](domain/VENDORS.md)
- [`domain/GUESTS.md`](domain/GUESTS.md)
- [`domain/TASKS-DECISIONS.md`](domain/TASKS-DECISIONS.md)
- [`domain/BUDGET-PAYMENTS.md`](domain/BUDGET-PAYMENTS.md)
- [`domain/DOCUMENTS-MEDIA.md`](domain/DOCUMENTS-MEDIA.md)

## UX

- [`ux/NAVIGATION.md`](ux/NAVIGATION.md)
- [`ux/INTERACTION-STATES.md`](ux/INTERACTION-STATES.md)

## Engineering

- [`engineering/DEFINITION-OF-DONE.md`](engineering/DEFINITION-OF-DONE.md)

## Roadmap

- [`roadmap/LOTS.md`](roadmap/LOTS.md)

## Documentation status

The design phase is intentionally split into four review runs.

- **Run 1: Foundation** — complete and merged.
- **Run 2: Domain/data model** — complete in current documentation branch.
- **Run 3: Security/quality/operations** — pending.
- **Run 4: Feature contracts/implementation readiness** — pending.

The repository should not be treated as implementation-ready until all four documentation runs are complete and reviewed.

## Rule for future documents

Each document should state requirements unambiguously enough that a developer without access to prior conversations can implement or test the described behavior. If a requirement is intentionally deferred or uncertain, label it explicitly rather than leaving ambiguity implicit.
