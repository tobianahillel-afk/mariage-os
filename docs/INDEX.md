# Mariage OS — Documentation Index

Status: **Normative navigation/index document**

Purpose: make the repository navigable without conversation context while avoiding the mistake of treating every document as equal-priority context.

## Start here

### AI / context-free contributor

1. [`../AGENTS.md`](../AGENTS.md)
2. [`roadmap/IMPLEMENTATION-STATUS.md`](roadmap/IMPLEMENTATION-STATUS.md)
3. [`START-HERE.md`](START-HERE.md)
4. [`engineering/LLM-TASK-ROUTING.md`](engineering/LLM-TASK-ROUTING.md)

### Human full onboarding

Start with [`START-HERE.md`](START-HERE.md).

Do not read this index as an instruction to load every document into one working context. Follow task routing and explicit cross-references.

---

# 1. Master product / freeze / review

- [`PRODUCT-SPECIFICATION.md`](PRODUCT-SPECIFICATION.md) — frozen V1 master cahier des charges.
- [`PRODUCT-SPECIFICATION-PUBLIC-READINESS-ADDENDUM.md`](PRODUCT-SPECIFICATION-PUBLIC-READINESS-ADDENDUM.md) — private first deployment vs public-ready multi-tenant core.
- [`PRODUCT.md`](PRODUCT.md) — concise product framing.
- [`PRINCIPLES.md`](PRINCIPLES.md) — product principles.
- [`NON-GOALS.md`](NON-GOALS.md) — anti-scope-creep boundaries.
- [`REQUIREMENTS-CATALOG.md`](REQUIREMENTS-CATALOG.md) — stable P0/P1/P2 requirement IDs.
- [`PUBLIC-READINESS-REQUIREMENTS.md`](PUBLIC-READINESS-REQUIREMENTS.md) — `PUB-*` requirements.
- [`FEATURE-LEDGER.md`](FEATURE-LEDGER.md) — 104 V1 capabilities/lifecycle.
- [`REQUIREMENT-FEATURE-MATRIX.md`](REQUIREMENT-FEATURE-MATRIX.md) — requirements to features.
- [`ACCEPTANCE-FEATURE-MATRIX.md`](ACCEPTANCE-FEATURE-MATRIX.md) — acceptance scenarios to features.
- [`USER-FLOWS.md`](USER-FLOWS.md) — major journeys.
- [`ACCEPTANCE-SCENARIOS.md`](ACCEPTANCE-SCENARIOS.md) — 80 critical Given/When/Then scenarios.
- [`roadmap/V1-SCOPE.md`](roadmap/V1-SCOPE.md) — binding V1/post-V1 scope.
- [`roadmap/V1-SCOPE-PUBLIC-READINESS-ADDENDUM.md`](roadmap/V1-SCOPE-PUBLIC-READINESS-ADDENDUM.md).
- [`DEFERRED-DECISIONS.md`](DEFERRED-DECISIONS.md) — intentionally open implementation choices only.
- [`DOCUMENTATION-AUDIT.md`](DOCUMENTATION-AUDIT.md) — freeze audit findings/resolutions.
- [`DOCUMENTATION-COMPLETENESS-CHECKLIST.md`](DOCUMENTATION-COMPLETENESS-CHECKLIST.md).
- [`IMPLEMENTATION-READINESS.md`](IMPLEMENTATION-READINESS.md).
- [`FINAL-DESIGN-REVIEW.md`](FINAL-DESIGN-REVIEW.md) — only document allowed to open pre-code gate.
- [`FINAL-DESIGN-REVIEW-SECURITY-ADDENDUM.md`](FINAL-DESIGN-REVIEW-SECURITY-ADDENDUM.md).
- [`FINAL-DESIGN-REVIEW-LLM-ENGINEERING-ADDENDUM.md`](FINAL-DESIGN-REVIEW-LLM-ENGINEERING-ADDENDUM.md).

## Systematic reviews

- [`reviews/DOCUMENTATION-SYSTEM-SCORECARD.md`](reviews/DOCUMENTATION-SYSTEM-SCORECARD.md) — 44-criterion documentation/LLM/engineering scorecard.
- [`reviews/LLM-COLD-START-REVIEW.md`](reviews/LLM-COLD-START-REVIEW.md) — context-free agent simulation.
- [`reviews/AUTHORIZATION-DESIGN-REVIEW.md`](reviews/AUTHORIZATION-DESIGN-REVIEW.md).
- [`reviews/SECURITY-HARDENING-REVIEW.md`](reviews/SECURITY-HARDENING-REVIEW.md).
- [`reviews/README.md`](reviews/README.md) — durable review/checkpoint-report convention.

---

# 2. UX / UI / visual design

Read user-facing work through [`ux/VISUAL-SYSTEM.md`](ux/VISUAL-SYSTEM.md) and [`ux/UX-ARCHITECTURE.md`](ux/UX-ARCHITECTURE.md), then the affected screen/feature contract.

- [`ux/VISUAL-SYSTEM.md`](ux/VISUAL-SYSTEM.md) — visual entry point.
- [`ux/UX-ARCHITECTURE.md`](ux/UX-ARCHITECTURE.md) — page taxonomy, one-job-per-screen, progressive disclosure.
- [`ux/NAVIGATION.md`](ux/NAVIGATION.md) — desktop/mobile IA and journeys.
- [`ux/ROUTE-FEATURE-MATRIX.md`](ux/ROUTE-FEATURE-MATRIX.md) — route → job → feature mapping.
- [`ux/SCREEN-BLUEPRINTS.md`](ux/SCREEN-BLUEPRINTS.md) — detailed screen composition.
- [`ux/SCREEN-CONTRACTS.md`](ux/SCREEN-CONTRACTS.md) — route/actions/states.
- [`ux/SCREEN-CONTRACTS-PROJECT-SCOPE-ADDENDUM.md`](ux/SCREEN-CONTRACTS-PROJECT-SCOPE-ADDENDUM.md) — canonical project-scoped routes.
- [`ux/AUTH-BLUEPRINTS.md`](ux/AUTH-BLUEPRINTS.md) — login/onboarding/MFA/recovery states.
- [`ux/VISUAL-IDENTITY.md`](ux/VISUAL-IDENTITY.md) — brand personality.
- [`ux/COLOR-SYSTEM.md`](ux/COLOR-SYSTEM.md) — frozen multi-color/domain palette.
- [`ux/DESIGN-SYSTEM.md`](ux/DESIGN-SYSTEM.md) — components/tokens/states.
- [`ux/MOTION-INTERACTION.md`](ux/MOTION-INTERACTION.md) — motion/table/list behavior.
- [`ux/INTERACTION-STATES.md`](ux/INTERACTION-STATES.md) — loading/empty/error/offline/etc.
- [`ux/FORMS-AUTOSAVE.md`](ux/FORMS-AUTOSAVE.md) — forms/drafts/autosave.
- [`ux/SEO-METADATA-IMAGES.md`](ux/SEO-METADATA-IMAGES.md) — private metadata + image delivery.
- [`ux/PUBLIC-WEB-SHELL.md`](ux/PUBLIC-WEB-SHELL.md) — future public marketing/Auth shell.
- [`ux/PUBLIC-SEO-RENDERING.md`](ux/PUBLIC-SEO-RENDERING.md) — static/prerender public SEO.
- [`ux/VISUAL-BENCHMARKS.md`](ux/VISUAL-BENCHMARKS.md) — inspiration/research only, not copying target.
- [`ux/WIREFRAMES.md`](ux/WIREFRAMES.md) — supporting low-fidelity material; blueprints control when richer.
- [`ux/UX-REVIEW-CHECKLIST.md`](ux/UX-REVIEW-CHECKLIST.md).
- [`ux/VISUAL-REVIEW-CHECKLIST.md`](ux/VISUAL-REVIEW-CHECKLIST.md).

---

# 3. Architecture / runtime / local-first

- [`architecture/OVERVIEW.md`](architecture/OVERVIEW.md) — browser/cloud high-level architecture.
- [`architecture/STACK.md`](architecture/STACK.md) — Vite/TS/Supabase/IndexedDB stack contract.
- [`architecture/PUBLIC-SAAS-READINESS.md`](architecture/PUBLIC-SAAS-READINESS.md) — public-ready multi-tenant constraint.
- [`architecture/TRUST-BOUNDARIES.md`](architecture/TRUST-BOUNDARIES.md).
- [`architecture/DATA-OWNERSHIP.md`](architecture/DATA-OWNERSHIP.md).
- [`architecture/LOCAL-FIRST.md`](architecture/LOCAL-FIRST.md).
- [`architecture/SYNC.md`](architecture/SYNC.md).
- [`architecture/OFFLINE.md`](architecture/OFFLINE.md).
- [`architecture/PWA-LIFECYCLE.md`](architecture/PWA-LIFECYCLE.md).
- [`architecture/STORAGE.md`](architecture/STORAGE.md).
- [`architecture/LOCAL-DATA-SCHEMA.md`](architecture/LOCAL-DATA-SCHEMA.md).
- [`architecture/REPOSITORY-SERVICE-CONTRACTS.md`](architecture/REPOSITORY-SERVICE-CONTRACTS.md).
- [`architecture/REPOSITORY-SERVICE-PUBLIC-READINESS-ADDENDUM.md`](architecture/REPOSITORY-SERVICE-PUBLIC-READINESS-ADDENDUM.md).
- [`architecture/DEPENDENCY-GRAPH.md`](architecture/DEPENDENCY-GRAPH.md) — invalidation/recompute dependencies.

## ADRs

- [`adr/0001-cloudflare-supabase.md`](adr/0001-cloudflare-supabase.md)
- [`adr/0002-vite-typescript-no-react.md`](adr/0002-vite-typescript-no-react.md)
- [`adr/0003-local-first-sync.md`](adr/0003-local-first-sync.md)
- [`adr/0004-canonical-json-and-open-backup.md`](adr/0004-canonical-json-and-open-backup.md)
- [`adr/0005-public-code-private-data.md`](adr/0005-public-code-private-data.md)
- [`adr/0006-facts-observations-retained-values.md`](adr/0006-facts-observations-retained-values.md)
- [`adr/0007-private-deployment-public-ready-multitenancy.md`](adr/0007-private-deployment-public-ready-multitenancy.md)

---

# 4. Domain / database / invariants

Read schema work as a set: physical schema + addenda + invariants + relevant domain doc + authorization mapping.

- [`domain/TENANCY-MODEL.md`](domain/TENANCY-MODEL.md)
- [`domain/ERD.md`](domain/ERD.md)
- [`domain/PHYSICAL-SCHEMA-V1.md`](domain/PHYSICAL-SCHEMA-V1.md)
- [`domain/PHYSICAL-SCHEMA-V1-ADDENDUM.md`](domain/PHYSICAL-SCHEMA-V1-ADDENDUM.md)
- [`domain/PHYSICAL-SCHEMA-AUTHORIZATION-ADDENDUM.md`](domain/PHYSICAL-SCHEMA-AUTHORIZATION-ADDENDUM.md)
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

---

# 5. Feature contracts

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

---

# 6. Import / export / backup / migration

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
- [`migration/INITIAL-DATA-MIGRATION.md`](migration/INITIAL-DATA-MIGRATION.md)
- [`migration/CUTOVER.md`](migration/CUTOVER.md)

---

# 7. Security / authorization / privacy

**Security tasks start with [`security/README.md`](security/README.md).** It defines the required reading order and review triggers.

Major entry points:

- [`security/SECURITY-ARCHITECTURE.md`](security/SECURITY-ARCHITECTURE.md)
- [`security/SECURITY-CONTROL-BASELINE.md`](security/SECURITY-CONTROL-BASELINE.md)
- [`security/SECURITY-REQUIREMENTS.md`](security/SECURITY-REQUIREMENTS.md)
- [`security/THREAT-MODEL.md`](security/THREAT-MODEL.md) + addenda
- [`security/AUTHENTICATION.md`](security/AUTHENTICATION.md)
- [`security/AUTH-HARDENING.md`](security/AUTH-HARDENING.md)
- [`security/AUTHORIZATION-MODEL.md`](security/AUTHORIZATION-MODEL.md)
- [`security/AUTHORIZATION-REQUIREMENTS.md`](security/AUTHORIZATION-REQUIREMENTS.md)
- [`security/ROLE-PERMISSION-MATRIX.md`](security/ROLE-PERMISSION-MATRIX.md)
- [`security/AUTHORIZATION-RLS.md`](security/AUTHORIZATION-RLS.md)
- [`security/RLS-MATRIX-V1.md`](security/RLS-MATRIX-V1.md)
- [`security/RLS-PERMISSION-MAPPING.md`](security/RLS-PERMISSION-MAPPING.md)
- [`security/PRIVILEGED-OPERATIONS.md`](security/PRIVILEGED-OPERATIONS.md)
- [`security/STORAGE-RLS.md`](security/STORAGE-RLS.md)
- [`security/INPUT-VALIDATION.md`](security/INPUT-VALIDATION.md)
- [`security/SECURE-DATABASE-QUERIES.md`](security/SECURE-DATABASE-QUERIES.md)
- [`security/SECURE-CODING-PATTERNS.md`](security/SECURE-CODING-PATTERNS.md)
- [`security/FRONTEND-SECURITY.md`](security/FRONTEND-SECURITY.md)
- [`security/FILE-SECURITY.md`](security/FILE-SECURITY.md)
- [`security/EXTERNAL-CONTENT-SECURITY.md`](security/EXTERNAL-CONTENT-SECURITY.md)
- [`security/WEB-PROTOCOL-SECURITY.md`](security/WEB-PROTOCOL-SECURITY.md)
- [`security/SECRET-MANAGEMENT.md`](security/SECRET-MANAGEMENT.md)
- [`security/PRIVACY.md`](security/PRIVACY.md)
- [`security/PLATFORM-ADMIN-ACCESS.md`](security/PLATFORM-ADMIN-ACCESS.md)
- [`security/PUBLIC-ABUSE-PROTECTION.md`](security/PUBLIC-ABUSE-PROTECTION.md)
- [`security/SUPPLY-CHAIN.md`](security/SUPPLY-CHAIN.md)
- [`security/ASVS-MATRIX.md`](security/ASVS-MATRIX.md)
- root [`../SECURITY.md`](../SECURITY.md)

---

# 8. Quality / testing / supported environments

- [`quality/TESTING-STRATEGY.md`](quality/TESTING-STRATEGY.md)
- [`quality/COVERAGE-POLICY.md`](quality/COVERAGE-POLICY.md)
- [`quality/MUTATION-TESTING.md`](quality/MUTATION-TESTING.md)
- [`quality/E2E-TESTING.md`](quality/E2E-TESTING.md)
- [`quality/TEST-DATA.md`](quality/TEST-DATA.md)
- [`quality/PUBLIC-READINESS-TEST-MATRIX.md`](quality/PUBLIC-READINESS-TEST-MATRIX.md)
- [`quality/SECURITY-TESTING.md`](quality/SECURITY-TESTING.md)
- [`quality/QUALITY-GATES.md`](quality/QUALITY-GATES.md)
- [`quality/ACCESSIBILITY.md`](quality/ACCESSIBILITY.md)
- [`quality/PERFORMANCE.md`](quality/PERFORMANCE.md)
- [`quality/BROWSER-SUPPORT.md`](quality/BROWSER-SUPPORT.md)

---

# 9. Engineering / agent governance / code quality

- [`engineering/IMPLEMENTATION-PLAYBOOK.md`](engineering/IMPLEMENTATION-PLAYBOOK.md) — feature lifecycle/FIR/anti-drift process.
- [`engineering/LLM-TASK-ROUTING.md`](engineering/LLM-TASK-ROUTING.md) — minimal context per task type.
- [`engineering/REQUIREMENTS-TRACEABILITY.md`](engineering/REQUIREMENTS-TRACEABILITY.md).
- [`engineering/CODING-STANDARDS.md`](engineering/CODING-STANDARDS.md).
- [`engineering/CODEBASE-STRUCTURE.md`](engineering/CODEBASE-STRUCTURE.md) — physical structure/dependency directions/test placement.
- [`engineering/MODULE-SIZE-COMPLEXITY.md`](engineering/MODULE-SIZE-COMPLEXITY.md) — quantitative maintainability limits.
- [`engineering/ERROR-HANDLING.md`](engineering/ERROR-HANDLING.md).
- [`engineering/OBSERVABILITY-DIAGNOSTICS.md`](engineering/OBSERVABILITY-DIAGNOSTICS.md).
- [`engineering/MIGRATIONS.md`](engineering/MIGRATIONS.md).
- [`engineering/DEFINITION-OF-DONE.md`](engineering/DEFINITION-OF-DONE.md).
- [`engineering/CI-CD.md`](engineering/CI-CD.md).
- [`engineering/RELEASE-PROCESS.md`](engineering/RELEASE-PROCESS.md).
- [`templates/FEATURE-IMPLEMENTATION-RECORD.md`](templates/FEATURE-IMPLEMENTATION-RECORD.md).
- [`templates/CHECKPOINT-REPORT.md`](templates/CHECKPOINT-REPORT.md).
- root [`../CONTRIBUTING.md`](../CONTRIBUTING.md).
- root [`.github/pull_request_template.md`](../.github/pull_request_template.md).
- root [`../ARCHITECTURE.md`](../ARCHITECTURE.md).
- root [`../CHANGELOG.md`](../CHANGELOG.md).

---

# 10. Operations / roadmap / current state

- [`operations/FREE-TIER.md`](operations/FREE-TIER.md)
- [`operations/PUBLIC-LAUNCH-GATE.md`](operations/PUBLIC-LAUNCH-GATE.md)
- [`operations/INCIDENT-RESPONSE.md`](operations/INCIDENT-RESPONSE.md)
- [`roadmap/IMPLEMENTATION-STATUS.md`](roadmap/IMPLEMENTATION-STATUS.md) — **current phase/next action source of truth**.
- [`roadmap/LOTS.md`](roadmap/LOTS.md)
- [`roadmap/LOT-ACCEPTANCE.md`](roadmap/LOT-ACCEPTANCE.md)
- [`roadmap/INTEGRATION-CHECKPOINTS.md`](roadmap/INTEGRATION-CHECKPOINTS.md)
- [`roadmap/INTEGRATION-CHECKPOINTS-PUBLIC-READINESS-ADDENDUM.md`](roadmap/INTEGRATION-CHECKPOINTS-PUBLIC-READINESS-ADDENDUM.md)
- [`roadmap/BACKLOG.md`](roadmap/BACKLOG.md)

---

# Current repository state

Runs 1–3 are merged. Run 4 contains the frozen V1 baseline plus final review/remediation.

**Implementation gate is CLOSED.**

The next permitted work is whatever [`roadmap/IMPLEMENTATION-STATUS.md`](roadmap/IMPLEMENTATION-STATUS.md) states. At present that is final documentation/PR/repository review only, not Lot 0 implementation.
