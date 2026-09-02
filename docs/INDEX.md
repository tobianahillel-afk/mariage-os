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

- [`domain/ERD.md`](domain/ERD.md)
- [`domain/DATA-DICTIONARY.md`](domain/DATA-DICTIONARY.md)
- [`domain/IDENTIFIERS.md`](domain/IDENTIFIERS.md)
- [`domain/DATES-TIME.md`](domain/DATES-TIME.md)
- [`domain/MONEY.md`](domain/MONEY.md)
- [`domain/STATE-MACHINES.md`](domain/STATE-MACHINES.md)
- [`domain/INVARIANTS.md`](domain/INVARIANTS.md)
- [`domain/FACTS-SOURCES.md`](domain/FACTS-SOURCES.md)
- [`domain/CONFIDENCE-FRESHNESS.md`](domain/CONFIDENCE-FRESHNESS.md)
- [`domain/DERIVED-DATA.md`](domain/DERIVED-DATA.md)
- [`domain/DELETION-RETENTION.md`](domain/DELETION-RETENTION.md)
- [`domain/VENUES.md`](domain/VENUES.md)
- [`domain/VENDORS.md`](domain/VENDORS.md)
- [`domain/GUESTS.md`](domain/GUESTS.md)
- [`domain/TASKS-DECISIONS.md`](domain/TASKS-DECISIONS.md)
- [`domain/BUDGET-PAYMENTS.md`](domain/BUDGET-PAYMENTS.md)
- [`domain/DOCUMENTS-MEDIA.md`](domain/DOCUMENTS-MEDIA.md)

## Security

- [`security/SECURITY-ARCHITECTURE.md`](security/SECURITY-ARCHITECTURE.md)
- [`security/THREAT-MODEL.md`](security/THREAT-MODEL.md)
- [`security/AUTHENTICATION.md`](security/AUTHENTICATION.md)
- [`security/AUTHORIZATION-RLS.md`](security/AUTHORIZATION-RLS.md)
- [`security/FILE-SECURITY.md`](security/FILE-SECURITY.md)
- [`security/FRONTEND-SECURITY.md`](security/FRONTEND-SECURITY.md)
- [`security/PRIVACY.md`](security/PRIVACY.md)
- [`security/SUPPLY-CHAIN.md`](security/SUPPLY-CHAIN.md)
- [`security/ASVS-MATRIX.md`](security/ASVS-MATRIX.md)

## Quality

- [`quality/TESTING-STRATEGY.md`](quality/TESTING-STRATEGY.md)
- [`quality/COVERAGE-POLICY.md`](quality/COVERAGE-POLICY.md)
- [`quality/MUTATION-TESTING.md`](quality/MUTATION-TESTING.md)
- [`quality/E2E-TESTING.md`](quality/E2E-TESTING.md)
- [`quality/TEST-DATA.md`](quality/TEST-DATA.md)
- [`quality/QUALITY-GATES.md`](quality/QUALITY-GATES.md)
- [`quality/SECURITY-TESTING.md`](quality/SECURITY-TESTING.md)

## Operations

- [`operations/BACKUPS.md`](operations/BACKUPS.md)
- [`operations/DISASTER-RECOVERY.md`](operations/DISASTER-RECOVERY.md)
- [`operations/FREE-TIER.md`](operations/FREE-TIER.md)
- [`operations/INCIDENT-RESPONSE.md`](operations/INCIDENT-RESPONSE.md)

## UX

- [`ux/NAVIGATION.md`](ux/NAVIGATION.md)
- [`ux/INTERACTION-STATES.md`](ux/INTERACTION-STATES.md)

## Engineering

- [`engineering/DEFINITION-OF-DONE.md`](engineering/DEFINITION-OF-DONE.md)
- [`engineering/CI-CD.md`](engineering/CI-CD.md)
- [`engineering/RELEASE-PROCESS.md`](engineering/RELEASE-PROCESS.md)

## Roadmap

- [`roadmap/LOTS.md`](roadmap/LOTS.md)

## Documentation status

- **Run 1: Foundation** — complete and merged.
- **Run 2: Domain/data model** — complete and merged.
- **Run 3: Security/quality/operations** — complete in current documentation branch.
- **Run 4: Feature contracts/implementation readiness** — pending.

The repository should not be treated as implementation-ready until all four documentation runs are complete and reviewed.

## Rule for future documents

Each document must be clear enough that a developer without access to prior conversations can implement or test the described behavior. Intentional deferrals/uncertainties must be explicit.
