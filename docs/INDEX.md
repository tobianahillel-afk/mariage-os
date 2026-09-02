# Mariage OS Documentation Index

This index is the map of the normative pre-code specification.

Start with [`START-HERE.md`](START-HERE.md), not by browsing files randomly.

---

## Master product documents

- [`START-HERE.md`](START-HERE.md) — mandatory onboarding path.
- [`PRODUCT-SPECIFICATION.md`](PRODUCT-SPECIFICATION.md) — master cahier des charges.
- [`REQUIREMENTS-CATALOG.md`](REQUIREMENTS-CATALOG.md) — P0/P1/P2 traceable requirements.
- [`PRODUCT.md`](PRODUCT.md) — product framing/jobs to be done.
- [`PRINCIPLES.md`](PRINCIPLES.md) — binding principles.
- [`NON-GOALS.md`](NON-GOALS.md) — deliberate scope boundaries.
- [`USER-FLOWS.md`](USER-FLOWS.md) — critical user journeys.
- [`DOCUMENTATION-COMPLETENESS-CHECKLIST.md`](DOCUMENTATION-COMPLETENESS-CHECKLIST.md) — final pre-code documentation review.
- [`IMPLEMENTATION-READINESS.md`](IMPLEMENTATION-READINESS.md) — final design readiness assessment.
- [`DEFERRED-DECISIONS.md`](DEFERRED-DECISIONS.md) — intentionally deferred implementation choices.

---

## Architecture

- [`architecture/OVERVIEW.md`](architecture/OVERVIEW.md)
- [`architecture/STACK.md`](architecture/STACK.md)
- [`architecture/TRUST-BOUNDARIES.md`](architecture/TRUST-BOUNDARIES.md)
- [`architecture/DATA-OWNERSHIP.md`](architecture/DATA-OWNERSHIP.md)
- [`architecture/LOCAL-FIRST.md`](architecture/LOCAL-FIRST.md)
- [`architecture/SYNC.md`](architecture/SYNC.md)
- [`architecture/OFFLINE.md`](architecture/OFFLINE.md)
- [`architecture/PWA-LIFECYCLE.md`](architecture/PWA-LIFECYCLE.md)
- [`architecture/STORAGE.md`](architecture/STORAGE.md)
- [`architecture/LOCAL-DATA-SCHEMA.md`](architecture/LOCAL-DATA-SCHEMA.md)
- [`architecture/REPOSITORY-SERVICE-CONTRACTS.md`](architecture/REPOSITORY-SERVICE-CONTRACTS.md)
- [`architecture/DEPENDENCY-GRAPH.md`](architecture/DEPENDENCY-GRAPH.md)

### Architecture Decision Records

- [`adr/0001-cloudflare-supabase.md`](adr/0001-cloudflare-supabase.md)
- [`adr/0002-vite-typescript-no-react.md`](adr/0002-vite-typescript-no-react.md)
- [`adr/0003-local-first-sync.md`](adr/0003-local-first-sync.md)
- [`adr/0004-canonical-json-and-open-backup.md`](adr/0004-canonical-json-and-open-backup.md)
- [`adr/0005-public-code-private-data.md`](adr/0005-public-code-private-data.md)
- [`adr/0006-facts-observations-retained-values.md`](adr/0006-facts-observations-retained-values.md)

---

## Domain and data model

- [`domain/ERD.md`](domain/ERD.md) — conceptual entity relationships.
- [`domain/PHYSICAL-SCHEMA-V1.md`](domain/PHYSICAL-SCHEMA-V1.md) — reference PostgreSQL table/column design.
- [`domain/DATA-DICTIONARY.md`](domain/DATA-DICTIONARY.md) — field-definition rules.
- [`domain/IDENTIFIERS.md`](domain/IDENTIFIERS.md) — UUID/external ID/hash semantics.
- [`domain/DATES-TIME.md`](domain/DATES-TIME.md) — civil dates/timestamps/timezones.
- [`domain/MONEY.md`](domain/MONEY.md) — exact financial semantics.
- [`domain/STATE-MACHINES.md`](domain/STATE-MACHINES.md) — lifecycle transitions.
- [`domain/INVARIANTS.md`](domain/INVARIANTS.md) — non-negotiable integrity rules.
- [`domain/FACTS-SOURCES.md`](domain/FACTS-SOURCES.md) — observations/provenance/retained values.
- [`domain/CONFIDENCE-FRESHNESS.md`](domain/CONFIDENCE-FRESHNESS.md) — evidence and revalidation.
- [`domain/DEFAULT-CRITERIA.md`](domain/DEFAULT-CRITERIA.md) — stable default venue/vendor criterion keys.
- [`domain/DERIVED-DATA.md`](domain/DERIVED-DATA.md) — derived-value rules.
- [`domain/DELETION-RETENTION.md`](domain/DELETION-RETENTION.md) — trash/archive/purge.
- [`domain/VENUES.md`](domain/VENUES.md)
- [`domain/VENDORS.md`](domain/VENDORS.md)
- [`domain/GUESTS.md`](domain/GUESTS.md)
- [`domain/TASKS-DECISIONS.md`](domain/TASKS-DECISIONS.md)
- [`domain/BUDGET-PAYMENTS.md`](domain/BUDGET-PAYMENTS.md)
- [`domain/DOCUMENTS-MEDIA.md`](domain/DOCUMENTS-MEDIA.md)

---

## Feature contracts

- [`features/DASHBOARD.md`](features/DASHBOARD.md)
- [`features/VENUES.md`](features/VENUES.md)
- [`features/MAP.md`](features/MAP.md)
- [`features/VENDORS.md`](features/VENDORS.md)
- [`features/GUESTS.md`](features/GUESTS.md)
- [`features/BUDGET.md`](features/BUDGET.md)
- [`features/TASKS.md`](features/TASKS.md)
- [`features/DECISIONS.md`](features/DECISIONS.md)
- [`features/PLANNING.md`](features/PLANNING.md)
- [`features/DOCUMENTS.md`](features/DOCUMENTS.md)
- [`features/IMPORT-EXPORT.md`](features/IMPORT-EXPORT.md)

---

## Import/export

- [`import-export/FORMATS.md`](import-export/FORMATS.md)
- [`import-export/CANONICAL-JSON-V1.md`](import-export/CANONICAL-JSON-V1.md)
- [`import-export/MAPPING.md`](import-export/MAPPING.md)
- [`import-export/DEDUPLICATION.md`](import-export/DEDUPLICATION.md)
- [`import-export/MERGE.md`](import-export/MERGE.md)
- [`import-export/ROLLBACK.md`](import-export/ROLLBACK.md)

---

## UX

- [`ux/NAVIGATION.md`](ux/NAVIGATION.md)
- [`ux/INTERACTION-STATES.md`](ux/INTERACTION-STATES.md)
- [`ux/WIREFRAMES.md`](ux/WIREFRAMES.md)
- [`ux/DESIGN-SYSTEM.md`](ux/DESIGN-SYSTEM.md)
- [`ux/FORMS-AUTOSAVE.md`](ux/FORMS-AUTOSAVE.md)

---

## Security and privacy

- [`security/SECURITY-ARCHITECTURE.md`](security/SECURITY-ARCHITECTURE.md)
- [`security/THREAT-MODEL.md`](security/THREAT-MODEL.md)
- [`security/AUTHENTICATION.md`](security/AUTHENTICATION.md)
- [`security/AUTHORIZATION-RLS.md`](security/AUTHORIZATION-RLS.md)
- [`security/FILE-SECURITY.md`](security/FILE-SECURITY.md)
- [`security/FRONTEND-SECURITY.md`](security/FRONTEND-SECURITY.md)
- [`security/PRIVACY.md`](security/PRIVACY.md)
- [`security/SUPPLY-CHAIN.md`](security/SUPPLY-CHAIN.md)
- [`security/ASVS-MATRIX.md`](security/ASVS-MATRIX.md)

Root [`../SECURITY.md`](../SECURITY.md) defines public vulnerability-reporting behavior.

---

## Quality and test strategy

- [`quality/TESTING-STRATEGY.md`](quality/TESTING-STRATEGY.md)
- [`quality/COVERAGE-POLICY.md`](quality/COVERAGE-POLICY.md)
- [`quality/MUTATION-TESTING.md`](quality/MUTATION-TESTING.md)
- [`quality/E2E-TESTING.md`](quality/E2E-TESTING.md)
- [`quality/TEST-DATA.md`](quality/TEST-DATA.md)
- [`quality/SECURITY-TESTING.md`](quality/SECURITY-TESTING.md)
- [`quality/QUALITY-GATES.md`](quality/QUALITY-GATES.md)
- [`quality/ACCESSIBILITY.md`](quality/ACCESSIBILITY.md)
- [`quality/PERFORMANCE.md`](quality/PERFORMANCE.md)
- [`quality/BROWSER-SUPPORT.md`](quality/BROWSER-SUPPORT.md)

---

## Engineering

- [`engineering/CODING-STANDARDS.md`](engineering/CODING-STANDARDS.md)
- [`engineering/ERROR-HANDLING.md`](engineering/ERROR-HANDLING.md)
- [`engineering/OBSERVABILITY-DIAGNOSTICS.md`](engineering/OBSERVABILITY-DIAGNOSTICS.md)
- [`engineering/MIGRATIONS.md`](engineering/MIGRATIONS.md)
- [`engineering/DEFINITION-OF-DONE.md`](engineering/DEFINITION-OF-DONE.md)
- [`engineering/REQUIREMENTS-TRACEABILITY.md`](engineering/REQUIREMENTS-TRACEABILITY.md)
- [`engineering/CI-CD.md`](engineering/CI-CD.md)
- [`engineering/RELEASE-PROCESS.md`](engineering/RELEASE-PROCESS.md)

Root [`../CONTRIBUTING.md`](../CONTRIBUTING.md), [`../ARCHITECTURE.md`](../ARCHITECTURE.md) and [`../CHANGELOG.md`](../CHANGELOG.md) provide repository-level entry points.

---

## Operations/recovery

- [`operations/BACKUPS.md`](operations/BACKUPS.md)
- [`operations/DISASTER-RECOVERY.md`](operations/DISASTER-RECOVERY.md)
- [`operations/FREE-TIER.md`](operations/FREE-TIER.md)
- [`operations/INCIDENT-RESPONSE.md`](operations/INCIDENT-RESPONSE.md)

---

## Existing-data migration

- [`migration/INITIAL-DATA-MIGRATION.md`](migration/INITIAL-DATA-MIGRATION.md)
- [`migration/CUTOVER.md`](migration/CUTOVER.md)

---

## Roadmap and V1 boundary

- [`roadmap/V1-SCOPE.md`](roadmap/V1-SCOPE.md)
- [`roadmap/LOTS.md`](roadmap/LOTS.md)
- [`roadmap/LOT-ACCEPTANCE.md`](roadmap/LOT-ACCEPTANCE.md)
- [`roadmap/BACKLOG.md`](roadmap/BACKLOG.md)

---

## Documentation-run status

- **Run 1 — Foundation:** complete and merged.
- **Run 2 — Domain/data:** complete and merged.
- **Run 3 — Security/quality/operations:** complete and merged.
- **Run 4 — Feature contracts/implementation readiness:** complete in the current branch; pending final review/merge.

After Run 4 merge the design phase is considered complete enough to start Lot 0. Future discoveries are handled through spec updates/ADRs rather than relying on prior chat context.

---

## Normative rule

Each document must be clear enough that a developer without access to previous conversations can implement/test the described behavior. Intentional uncertainty belongs in `DEFERRED-DECISIONS.md`; unlabelled ambiguity is a documentation defect.
