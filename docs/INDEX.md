# Mariage OS Documentation Index

This index maps the frozen V1 design baseline, final pre-implementation review set and implementation-governance system.

Start with [`START-HERE.md`](START-HERE.md). Do not browse files randomly and assume equal precedence.

## Master/freeze layer

- [`START-HERE.md`](START-HERE.md) — mandatory onboarding/read order.
- [`roadmap/IMPLEMENTATION-STATUS.md`](roadmap/IMPLEMENTATION-STATUS.md) — exact current phase, lot/checkpoint state and next permitted action.
- [`PRODUCT-SPECIFICATION.md`](PRODUCT-SPECIFICATION.md) — frozen V1 master cahier des charges.
- [`PRODUCT-SPECIFICATION-PUBLIC-READINESS-ADDENDUM.md`](PRODUCT-SPECIFICATION-PUBLIC-READINESS-ADDENDUM.md) — private V1 deployment vs multi-tenant/public-ready core precedence.
- [`REQUIREMENTS-CATALOG.md`](REQUIREMENTS-CATALOG.md) — stable P0/P1/P2 requirement IDs.
- [`PUBLIC-READINESS-REQUIREMENTS.md`](PUBLIC-READINESS-REQUIREMENTS.md) — PUB-* cross-cutting anti-single-couple requirements.
- [`FEATURE-LEDGER.md`](FEATURE-LEDGER.md) — 104 V1 capabilities tracked feature by feature through implementation.
- [`roadmap/V1-SCOPE.md`](roadmap/V1-SCOPE.md) — binding V1/post-V1 boundary.
- [`roadmap/V1-SCOPE-PUBLIC-READINESS-ADDENDUM.md`](roadmap/V1-SCOPE-PUBLIC-READINESS-ADDENDUM.md) — clarifies public-ready V1 foundation vs post-V1 public activation.
- [`DOCUMENTATION-AUDIT.md`](DOCUMENTATION-AUDIT.md) — pre-freeze findings/resolutions.
- [`FINAL-DESIGN-REVIEW.md`](FINAL-DESIGN-REVIEW.md) — final architecture/product/UX implementation gate once completed.
- [`DOCUMENTATION-COMPLETENESS-CHECKLIST.md`](DOCUMENTATION-COMPLETENESS-CHECKLIST.md) — documentation/freeze coverage checklist.
- [`IMPLEMENTATION-READINESS.md`](IMPLEMENTATION-READINESS.md) — readiness/gate assessment.
- [`DEFERRED-DECISIONS.md`](DEFERRED-DECISIONS.md) — deliberately open implementation choices only.

## Product context and journeys

- [`PRODUCT.md`](PRODUCT.md)
- [`PRINCIPLES.md`](PRINCIPLES.md)
- [`NON-GOALS.md`](NON-GOALS.md)
- [`USER-FLOWS.md`](USER-FLOWS.md)
- [`ACCEPTANCE-SCENARIOS.md`](ACCEPTANCE-SCENARIOS.md)

## UX / navigation / visual system

Read in this order for UI work:

1. [`ux/VISUAL-SYSTEM.md`](ux/VISUAL-SYSTEM.md) — visual/design entry point.
2. [`ux/UX-ARCHITECTURE.md`](ux/UX-ARCHITECTURE.md) — page taxonomy, progressive disclosure and anti-admin-CRUD guardrails.
3. [`ux/NAVIGATION.md`](ux/NAVIGATION.md) — desktop/mobile information architecture and journey continuity.
4. [`ux/SCREEN-BLUEPRINTS.md`](ux/SCREEN-BLUEPRINTS.md) — detailed visual/cognitive composition of major V1 screens.
5. [`ux/SCREEN-CONTRACTS.md`](ux/SCREEN-CONTRACTS.md) — screen jobs/actions/states.
6. [`ux/SCREEN-CONTRACTS-PROJECT-SCOPE-ADDENDUM.md`](ux/SCREEN-CONTRACTS-PROJECT-SCOPE-ADDENDUM.md) — canonical public-ready project-scoped route family.
7. [`ux/PUBLIC-WEB-SHELL.md`](ux/PUBLIC-WEB-SHELL.md) — future public marketing/Auth shell vs private application.
8. [`ux/PUBLIC-SEO-RENDERING.md`](ux/PUBLIC-SEO-RENDERING.md) — public static/prerender SEO without framework rewrite.
9. [`ux/VISUAL-IDENTITY.md`](ux/VISUAL-IDENTITY.md) — product/brand personality.
10. [`ux/COLOR-SYSTEM.md`](ux/COLOR-SYSTEM.md) — frozen multi-color/domain palette.
11. [`ux/DESIGN-SYSTEM.md`](ux/DESIGN-SYSTEM.md) — components/tokens/status consistency.
12. [`ux/MOTION-INTERACTION.md`](ux/MOTION-INTERACTION.md) — transitions/dynamic table/list behavior.
13. [`ux/SEO-METADATA-IMAGES.md`](ux/SEO-METADATA-IMAGES.md) — public/private metadata and image-delivery policy.
14. [`ux/INTERACTION-STATES.md`](ux/INTERACTION-STATES.md)
15. [`ux/FORMS-AUTOSAVE.md`](ux/FORMS-AUTOSAVE.md)
16. [`ux/UX-REVIEW-CHECKLIST.md`](ux/UX-REVIEW-CHECKLIST.md)
17. [`ux/VISUAL-REVIEW-CHECKLIST.md`](ux/VISUAL-REVIEW-CHECKLIST.md)
18. [`ux/VISUAL-BENCHMARKS.md`](ux/VISUAL-BENCHMARKS.md) — research input, never a copying target.
19. [`ux/WIREFRAMES.md`](ux/WIREFRAMES.md) — supporting low-fidelity sketches; blueprints control if less complete.

## Architecture

- [`architecture/OVERVIEW.md`](architecture/OVERVIEW.md)
- [`architecture/STACK.md`](architecture/STACK.md)
- [`architecture/PUBLIC-SAAS-READINESS.md`](architecture/PUBLIC-SAAS-READINESS.md) — multi-tenant core / private deployment policy boundary.
- [`architecture/TRUST-BOUNDARIES.md`](architecture/TRUST-BOUNDARIES.md)
- [`architecture/DATA-OWNERSHIP.md`](architecture/DATA-OWNERSHIP.md)
- [`architecture/LOCAL-FIRST.md`](architecture/LOCAL-FIRST.md)
- [`architecture/SYNC.md`](architecture/SYNC.md)
- [`architecture/OFFLINE.md`](architecture/OFFLINE.md)
- [`architecture/PWA-LIFECYCLE.md`](architecture/PWA-LIFECYCLE.md)
- [`architecture/STORAGE.md`](architecture/STORAGE.md)
- [`architecture/LOCAL-DATA-SCHEMA.md`](architecture/LOCAL-DATA-SCHEMA.md)
- [`architecture/REPOSITORY-SERVICE-CONTRACTS.md`](architecture/REPOSITORY-SERVICE-CONTRACTS.md)
- [`architecture/REPOSITORY-SERVICE-PUBLIC-READINESS-ADDENDUM.md`](architecture/REPOSITORY-SERVICE-PUBLIC-READINESS-ADDENDUM.md)
- [`architecture/DEPENDENCY-GRAPH.md`](architecture/DEPENDENCY-GRAPH.md)

### ADRs

- [`adr/0001-cloudflare-supabase.md`](adr/0001-cloudflare-supabase.md)
- [`adr/0002-vite-typescript-no-react.md`](adr/0002-vite-typescript-no-react.md)
- [`adr/0003-local-first-sync.md`](adr/0003-local-first-sync.md)
- [`adr/0004-canonical-json-and-open-backup.md`](adr/0004-canonical-json-and-open-backup.md)
- [`adr/0005-public-code-private-data.md`](adr/0005-public-code-private-data.md)
- [`adr/0006-facts-observations-retained-values.md`](adr/0006-facts-observations-retained-values.md)
- [`adr/0007-private-deployment-public-ready-multitenancy.md`](adr/0007-private-deployment-public-ready-multitenancy.md)

## Domain/data

- [`domain/TENANCY-MODEL.md`](domain/TENANCY-MODEL.md) — user/project/membership tenancy model.
- [`domain/ERD.md`](domain/ERD.md)
- [`domain/PHYSICAL-SCHEMA-V1.md`](domain/PHYSICAL-SCHEMA-V1.md)
- [`domain/PHYSICAL-SCHEMA-V1-ADDENDUM.md`](domain/PHYSICAL-SCHEMA-V1-ADDENDUM.md)
- [`domain/DATA-DICTIONARY.md`](domain/DATA-DICTIONARY.md)
- [`domain/IDENTIFIERS.md`](domain/IDENTIFIERS.md)
- [`domain/DATES-TIME.md`](domain/DATES-TIME.md)
- [`domain/MONEY.md`](domain/MONEY.md)
- [`domain/STATE-MACHINES.md`](domain/STATE-MACHINES.md)
- [`domain/INVARIANTS.md`](domain/INVARIANTS.md)
- [`domain/FACTS-SOURCES.md`](domain/FACTS-SOURCES.md)
- [`domain/FACT-VALUE-TYPES.md`](domain/FACT-VALUE-TYPES.md)
- [`domain/CONFIDENCE-FRESHNESS.md`](domain/CONFIDENCE-FRESHNESS.md)
- [`domain/DEFAULT-CRITERIA.md`](domain/DEFAULT-CRITERIA.md)
- [`domain/CRITERIA-EVALUATION.md`](domain/CRITERIA-EVALUATION.md)
- [`domain/DERIVED-DATA.md`](domain/DERIVED-DATA.md)
- [`domain/DELETION-RETENTION.md`](domain/DELETION-RETENTION.md)
- [`domain/VENUES.md`](domain/VENUES.md)
- [`domain/VENDORS.md`](domain/VENDORS.md)
- [`domain/GUESTS.md`](domain/GUESTS.md)
- [`domain/TASKS-DECISIONS.md`](domain/TASKS-DECISIONS.md)
- [`domain/BUDGET-PAYMENTS.md`](domain/BUDGET-PAYMENTS.md)
- [`domain/DOCUMENTS-MEDIA.md`](domain/DOCUMENTS-MEDIA.md)

## Feature contracts

- [`features/AUTH-ONBOARDING.md`](features/AUTH-ONBOARDING.md)
- [`features/DASHBOARD.md`](features/DASHBOARD.md)
- [`features/VENUES.md`](features/VENUES.md)
- [`features/MAP.md`](features/MAP.md)
- [`features/VENDORS.md`](features/VENDORS.md)
- [`features/GUESTS.md`](features/GUESTS.md)
- [`features/SEATING.md`](features/SEATING.md)
- [`features/BUDGET.md`](features/BUDGET.md)
- [`features/TASKS.md`](features/TASKS.md)
- [`features/DECISIONS.md`](features/DECISIONS.md)
- [`features/PLANNING.md`](features/PLANNING.md)
- [`features/EVENT-TIMELINE.md`](features/EVENT-TIMELINE.md)
- [`features/DOCUMENTS.md`](features/DOCUMENTS.md)
- [`features/CONTRACT-READINESS.md`](features/CONTRACT-READINESS.md)
- [`features/INBOX.md`](features/INBOX.md)
- [`features/GLOBAL-SEARCH.md`](features/GLOBAL-SEARCH.md)
- [`features/IMPORT-EXPORT.md`](features/IMPORT-EXPORT.md)
- [`features/SETTINGS-DIAGNOSTICS.md`](features/SETTINGS-DIAGNOSTICS.md)

## Import/export/backup

- [`import-export/FORMATS.md`](import-export/FORMATS.md)
- [`import-export/CANONICAL-JSON-V1.md`](import-export/CANONICAL-JSON-V1.md)
- [`import-export/CANONICAL-JSON-V1-ADDENDUM.md`](import-export/CANONICAL-JSON-V1-ADDENDUM.md)
- [`import-export/MAPPING.md`](import-export/MAPPING.md)
- [`import-export/DEDUPLICATION.md`](import-export/DEDUPLICATION.md)
- [`import-export/MERGE.md`](import-export/MERGE.md)
- [`import-export/ROLLBACK.md`](import-export/ROLLBACK.md)
- [`operations/BACKUPS.md`](operations/BACKUPS.md)
- [`operations/BACKUP-FORMAT.md`](operations/BACKUP-FORMAT.md)
- [`operations/DISASTER-RECOVERY.md`](operations/DISASTER-RECOVERY.md)

## Security/privacy

- [`security/SECURITY-ARCHITECTURE.md`](security/SECURITY-ARCHITECTURE.md)
- [`security/THREAT-MODEL.md`](security/THREAT-MODEL.md)
- [`security/AUTHENTICATION.md`](security/AUTHENTICATION.md)
- [`security/BOOTSTRAP-INVITATIONS.md`](security/BOOTSTRAP-INVITATIONS.md)
- [`security/PUBLIC-ABUSE-PROTECTION.md`](security/PUBLIC-ABUSE-PROTECTION.md) — future public signup/provisioning abuse boundary.
- [`security/AUTHORIZATION-RLS.md`](security/AUTHORIZATION-RLS.md)
- [`security/RLS-MATRIX-V1.md`](security/RLS-MATRIX-V1.md)
- [`security/STORAGE-RLS.md`](security/STORAGE-RLS.md)
- [`security/FILE-SECURITY.md`](security/FILE-SECURITY.md)
- [`security/FRONTEND-SECURITY.md`](security/FRONTEND-SECURITY.md)
- [`security/PRIVACY.md`](security/PRIVACY.md)
- [`security/SUPPLY-CHAIN.md`](security/SUPPLY-CHAIN.md)
- [`security/ASVS-MATRIX.md`](security/ASVS-MATRIX.md)
- root [`../SECURITY.md`](../SECURITY.md)

## Quality/testing

- [`quality/TESTING-STRATEGY.md`](quality/TESTING-STRATEGY.md)
- [`quality/COVERAGE-POLICY.md`](quality/COVERAGE-POLICY.md)
- [`quality/MUTATION-TESTING.md`](quality/MUTATION-TESTING.md)
- [`quality/E2E-TESTING.md`](quality/E2E-TESTING.md)
- [`quality/TEST-DATA.md`](quality/TEST-DATA.md)
- [`quality/PUBLIC-READINESS-TEST-MATRIX.md`](quality/PUBLIC-READINESS-TEST-MATRIX.md) — mandatory multi-project/tenant synthetic regression matrix.
- [`quality/SECURITY-TESTING.md`](quality/SECURITY-TESTING.md)
- [`quality/QUALITY-GATES.md`](quality/QUALITY-GATES.md)
- [`quality/ACCESSIBILITY.md`](quality/ACCESSIBILITY.md)
- [`quality/PERFORMANCE.md`](quality/PERFORMANCE.md)
- [`quality/BROWSER-SUPPORT.md`](quality/BROWSER-SUPPORT.md)

## Engineering/process/governance

- [`engineering/IMPLEMENTATION-PLAYBOOK.md`](engineering/IMPLEMENTATION-PLAYBOOK.md) — feature lifecycle, FIR, Definition of Ready/Verified, vertical slices and anti-drift PR review.
- [`engineering/REQUIREMENTS-TRACEABILITY.md`](engineering/REQUIREMENTS-TRACEABILITY.md)
- [`engineering/CODING-STANDARDS.md`](engineering/CODING-STANDARDS.md)
- [`engineering/ERROR-HANDLING.md`](engineering/ERROR-HANDLING.md)
- [`engineering/OBSERVABILITY-DIAGNOSTICS.md`](engineering/OBSERVABILITY-DIAGNOSTICS.md)
- [`engineering/MIGRATIONS.md`](engineering/MIGRATIONS.md)
- [`engineering/DEFINITION-OF-DONE.md`](engineering/DEFINITION-OF-DONE.md)
- [`engineering/CI-CD.md`](engineering/CI-CD.md)
- [`engineering/RELEASE-PROCESS.md`](engineering/RELEASE-PROCESS.md)
- [`templates/FEATURE-IMPLEMENTATION-RECORD.md`](templates/FEATURE-IMPLEMENTATION-RECORD.md) — includes mandatory public-readiness/tenant review.
- root [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
- root [`../ARCHITECTURE.md`](../ARCHITECTURE.md)
- root [`../CHANGELOG.md`](../CHANGELOG.md)

## Operations/migration

- [`operations/FREE-TIER.md`](operations/FREE-TIER.md)
- [`operations/PUBLIC-LAUNCH-GATE.md`](operations/PUBLIC-LAUNCH-GATE.md) — future public self-service release gate.
- [`operations/INCIDENT-RESPONSE.md`](operations/INCIDENT-RESPONSE.md)
- [`migration/INITIAL-DATA-MIGRATION.md`](migration/INITIAL-DATA-MIGRATION.md)
- [`migration/CUTOVER.md`](migration/CUTOVER.md)

## Roadmap / implementation control

- [`roadmap/IMPLEMENTATION-STATUS.md`](roadmap/IMPLEMENTATION-STATUS.md) — living progress/handoff board.
- [`roadmap/V1-SCOPE.md`](roadmap/V1-SCOPE.md)
- [`roadmap/V1-SCOPE-PUBLIC-READINESS-ADDENDUM.md`](roadmap/V1-SCOPE-PUBLIC-READINESS-ADDENDUM.md)
- [`roadmap/LOTS.md`](roadmap/LOTS.md)
- [`roadmap/LOT-ACCEPTANCE.md`](roadmap/LOT-ACCEPTANCE.md)
- [`roadmap/INTEGRATION-CHECKPOINTS.md`](roadmap/INTEGRATION-CHECKPOINTS.md) — mandatory whole-product reviews after Lots 0–3, 4–7, 8–10 and 11–12.
- [`roadmap/INTEGRATION-CHECKPOINTS-PUBLIC-READINESS-ADDENDUM.md`](roadmap/INTEGRATION-CHECKPOINTS-PUBLIC-READINESS-ADDENDUM.md) — required tenancy/public-ready dimension at every checkpoint.
- [`roadmap/BACKLOG.md`](roadmap/BACKLOG.md)
- [`reviews/README.md`](reviews/README.md) — durable review finding/report format.

## Current status

Runs 1–3 are merged. Run 4 contains the frozen V1 baseline and final audit/governance changes.

**Implementation gate is CLOSED** until `FINAL-DESIGN-REVIEW.md` is complete, all BLOCKING/MAJOR findings are resolved, documentation entry points agree, and Run 4 is merged.

After the gate opens, the first implementation lot is Lot 0. No feature coding should be started earlier.

Private V1 self-service public signup is intentionally disabled, but **multi-tenant/public-ready architecture is already a V1 implementation constraint** and is tested during development/checkpoints.

During implementation, the repository must always make it possible to answer:
- what Feature IDs are complete;
- what lot/checkpoint is active;
- what remains blocked;
- what evidence proves completion;
- what next action is permitted;
- whether the implemented core remains public-ready without single-couple shortcuts.

## Normative rule

A developer with no prior conversation context must be able to implement/test/resume behavior from this repository. Intentional uncertainty belongs only in `DEFERRED-DECISIONS.md`; unlabelled ambiguity is a defect.
