# Mariage OS — Documentation Index

Status: **Normative navigation/index document**

Purpose: let a human or context-free LLM locate the governing contracts without reading the whole repository blindly.

## Start here

### AI / context-free contributor

1. [`../AGENTS.md`](../AGENTS.md)
2. [`roadmap/IMPLEMENTATION-STATUS.md`](roadmap/IMPLEMENTATION-STATUS.md)
3. [`V1-FROZEN-MANIFEST.md`](V1-FROZEN-MANIFEST.md)
4. [`START-HERE.md`](START-HERE.md)
5. [`engineering/LLM-TASK-ROUTING.md`](engineering/LLM-TASK-ROUTING.md)

### Human full onboarding

Start with [`START-HERE.md`](START-HERE.md), then the frozen manifest/product scope.

Do not treat this index as an instruction to load every file into one context.

---

# 1. Frozen product / scope / traceability

- [`V1-FROZEN-MANIFEST.md`](V1-FROZEN-MANIFEST.md) — compact current V1 composition and precedence.
- [`PRODUCT-SPECIFICATION.md`](PRODUCT-SPECIFICATION.md) — master V1 product specification.
- [`PRODUCT-SPECIFICATION-PUBLIC-READINESS-ADDENDUM.md`](PRODUCT-SPECIFICATION-PUBLIC-READINESS-ADDENDUM.md) — private-first/public-ready core.
- [`PRODUCT-SPECIFICATION-GUEST-COMMUNICATIONS-ADDENDUM.md`](PRODUCT-SPECIFICATION-GUEST-COMMUNICATIONS-ADDENDUM.md) — V1 invitations/RSVP/Email/SMS/WhatsApp scope.
- [`roadmap/V1-SCOPE.md`](roadmap/V1-SCOPE.md) — current binding V1/post-V1 boundary.
- [`roadmap/V1-SCOPE-PUBLIC-READINESS-ADDENDUM.md`](roadmap/V1-SCOPE-PUBLIC-READINESS-ADDENDUM.md).
- [`REQUIREMENTS-CATALOG.md`](REQUIREMENTS-CATALOG.md) — base stable requirement IDs.
- [`PUBLIC-READINESS-REQUIREMENTS.md`](PUBLIC-READINESS-REQUIREMENTS.md) — base `PUB-*` requirements.
- [`requirements/GUEST-COMMUNICATIONS-REQUIREMENTS.md`](requirements/GUEST-COMMUNICATIONS-REQUIREMENTS.md) — `RSVP-*`, `COM-*`, `QIF-*`, `COMMOPS-*`.
- [`requirements/PUBLIC-GUEST-COMMUNICATIONS-REQUIREMENTS.md`](requirements/PUBLIC-GUEST-COMMUNICATIONS-REQUIREMENTS.md) — `PUB-COM-*`.
- [`FEATURE-LEDGER.md`](FEATURE-LEDGER.md) — FTR-001..104.
- [`FEATURE-LEDGER-GUEST-COMMUNICATIONS-EXTENSION.md`](FEATURE-LEDGER-GUEST-COMMUNICATIONS-EXTENSION.md) — FTR-105..120.
- [`GUEST-COMMUNICATIONS-TRACEABILITY.md`](GUEST-COMMUNICATIONS-TRACEABILITY.md) — new requirements ↔ features ↔ acceptance ↔ lots.
- [`REQUIREMENT-FEATURE-MATRIX.md`](REQUIREMENT-FEATURE-MATRIX.md) — historical/base requirement mapping; use guest extension matrix for FTR-105..120.
- [`ACCEPTANCE-FEATURE-MATRIX.md`](ACCEPTANCE-FEATURE-MATRIX.md) — historical/base acceptance mapping; use guest extension matrix for GC scenarios.
- [`USER-FLOWS.md`](USER-FLOWS.md) — base major journeys.
- [`ACCEPTANCE-SCENARIOS.md`](ACCEPTANCE-SCENARIOS.md) — base 80 scenarios.
- [`quality/GUEST-COMMUNICATIONS-ACCEPTANCE.md`](quality/GUEST-COMMUNICATIONS-ACCEPTANCE.md) — GC-001..060 additional V1 scenarios.
- [`DEFERRED-DECISIONS.md`](DEFERRED-DECISIONS.md) — only intentionally open implementation choices.
- [`FINAL-DESIGN-REVIEW.md`](FINAL-DESIGN-REVIEW.md) — current pre-code gate decision.

**Current V1 total: 120 trackable features.** The acceptance corpus is the base suite plus GC-001..060; do not describe the current V1 as “104 features / 80 scenarios total”.

---

# 2. UX / UI / visual design

Read user-facing work through `ux/VISUAL-SYSTEM.md` + `ux/UX-ARCHITECTURE.md`, then the affected blueprint/feature.

Core:
- [`ux/VISUAL-SYSTEM.md`](ux/VISUAL-SYSTEM.md)
- [`ux/UX-ARCHITECTURE.md`](ux/UX-ARCHITECTURE.md)
- [`ux/NAVIGATION.md`](ux/NAVIGATION.md)
- [`ux/ROUTE-FEATURE-MATRIX.md`](ux/ROUTE-FEATURE-MATRIX.md)
- [`ux/SCREEN-BLUEPRINTS.md`](ux/SCREEN-BLUEPRINTS.md)
- [`ux/SCREEN-CONTRACTS.md`](ux/SCREEN-CONTRACTS.md)
- [`ux/SCREEN-CONTRACTS-PROJECT-SCOPE-ADDENDUM.md`](ux/SCREEN-CONTRACTS-PROJECT-SCOPE-ADDENDUM.md)
- [`ux/AUTH-BLUEPRINTS.md`](ux/AUTH-BLUEPRINTS.md)
- [`ux/VISUAL-IDENTITY.md`](ux/VISUAL-IDENTITY.md)
- [`ux/COLOR-SYSTEM.md`](ux/COLOR-SYSTEM.md)
- [`ux/DESIGN-SYSTEM.md`](ux/DESIGN-SYSTEM.md)
- [`ux/MOTION-INTERACTION.md`](ux/MOTION-INTERACTION.md)
- [`ux/INTERACTION-STATES.md`](ux/INTERACTION-STATES.md)
- [`ux/FORMS-AUTOSAVE.md`](ux/FORMS-AUTOSAVE.md)
- [`ux/SEO-METADATA-IMAGES.md`](ux/SEO-METADATA-IMAGES.md)
- [`ux/PUBLIC-WEB-SHELL.md`](ux/PUBLIC-WEB-SHELL.md)
- [`ux/PUBLIC-SEO-RENDERING.md`](ux/PUBLIC-SEO-RENDERING.md)
- [`ux/UX-REVIEW-CHECKLIST.md`](ux/UX-REVIEW-CHECKLIST.md)
- [`ux/VISUAL-REVIEW-CHECKLIST.md`](ux/VISUAL-REVIEW-CHECKLIST.md)

Guest communications:
- [`ux/GUEST-COMMUNICATIONS-BLUEPRINTS.md`](ux/GUEST-COMMUNICATIONS-BLUEPRINTS.md) — couple campaign + guest RSVP + onboarding QIF.
- [`ux/ROUTE-FEATURE-GUEST-COMMUNICATIONS-ADDENDUM.md`](ux/ROUTE-FEATURE-GUEST-COMMUNICATIONS-ADDENDUM.md) — private + `/rsvp/:token` routes.

Supporting inspiration only:
- `ux/VISUAL-BENCHMARKS.md`
- `ux/WIREFRAMES.md`

---

# 3. Architecture / runtime / local-first

Core:
- `architecture/OVERVIEW.md`
- `architecture/STACK.md`
- `architecture/PUBLIC-SAAS-READINESS.md`
- `architecture/TRUST-BOUNDARIES.md`
- `architecture/DATA-OWNERSHIP.md`
- `architecture/LOCAL-FIRST.md`
- `architecture/SYNC.md`
- `architecture/OFFLINE.md`
- `architecture/PWA-LIFECYCLE.md`
- `architecture/STORAGE.md`
- `architecture/LOCAL-DATA-SCHEMA.md`
- `architecture/REPOSITORY-SERVICE-CONTRACTS.md`
- `architecture/DEPENDENCY-GRAPH.md`

Guest communications additions:
- [`architecture/COMMUNICATION-PROVIDER-PORTS.md`](architecture/COMMUNICATION-PROVIDER-PORTS.md)
- [`architecture/REPOSITORY-SERVICE-GUEST-COMMUNICATIONS-ADDENDUM.md`](architecture/REPOSITORY-SERVICE-GUEST-COMMUNICATIONS-ADDENDUM.md)
- [`architecture/LOCAL-DATA-GUEST-COMMUNICATIONS-ADDENDUM.md`](architecture/LOCAL-DATA-GUEST-COMMUNICATIONS-ADDENDUM.md)
- [`architecture/OFFLINE-GUEST-COMMUNICATIONS-ADDENDUM.md`](architecture/OFFLINE-GUEST-COMMUNICATIONS-ADDENDUM.md)
- [`architecture/TRUST-BOUNDARIES-GUEST-COMMUNICATIONS-ADDENDUM.md`](architecture/TRUST-BOUNDARIES-GUEST-COMMUNICATIONS-ADDENDUM.md)
- [`architecture/PUBLIC-SAAS-GUEST-COMMUNICATIONS-ADDENDUM.md`](architecture/PUBLIC-SAAS-GUEST-COMMUNICATIONS-ADDENDUM.md)

ADRs remain under `docs/adr/`; architectural choices not already frozen require ADR/review.

---

# 4. Domain / database / invariants

Base schema/domain set:
- `domain/TENANCY-MODEL.md`
- `domain/ERD.md`
- `domain/PHYSICAL-SCHEMA-V1.md`
- `domain/PHYSICAL-SCHEMA-V1-ADDENDUM.md`
- `domain/PHYSICAL-SCHEMA-AUTHORIZATION-ADDENDUM.md`
- `domain/DATA-DICTIONARY.md`
- `domain/IDENTIFIERS.md`
- `domain/DATES-TIME.md`
- `domain/MONEY.md`
- `domain/STATE-MACHINES.md`
- `domain/INVARIANTS.md`
- `domain/FACTS-SOURCES.md`
- `domain/FACT-VALUE-TYPES.md`
- `domain/CONFIDENCE-FRESHNESS.md`
- `domain/DEFAULT-CRITERIA.md`
- `domain/CRITERIA-EVALUATION.md`
- `domain/DERIVED-DATA.md`
- `domain/DELETION-RETENTION.md`
- `domain/VENUES.md`
- `domain/VENDORS.md`
- `domain/GUESTS.md`
- `domain/TASKS-DECISIONS.md`
- `domain/BUDGET-PAYMENTS.md`
- `domain/DOCUMENTS-MEDIA.md`

Guest communications domain additions:
- [`domain/PHYSICAL-SCHEMA-GUEST-COMMUNICATIONS-ADDENDUM.md`](domain/PHYSICAL-SCHEMA-GUEST-COMMUNICATIONS-ADDENDUM.md)
- [`domain/DEPENDENCY-GRAPH-GUEST-COMMUNICATIONS-ADDENDUM.md`](domain/DEPENDENCY-GRAPH-GUEST-COMMUNICATIONS-ADDENDUM.md)
- [`domain/STATE-MACHINES-GUEST-COMMUNICATIONS-ADDENDUM.md`](domain/STATE-MACHINES-GUEST-COMMUNICATIONS-ADDENDUM.md)
- [`domain/INVARIANTS-GUEST-COMMUNICATIONS-ADDENDUM.md`](domain/INVARIANTS-GUEST-COMMUNICATIONS-ADDENDUM.md)

---

# 5. Feature contracts

Base feature contracts:
- `features/AUTH-ONBOARDING.md`
- `features/DASHBOARD.md`
- `features/VENUES.md`
- `features/MAP.md`
- `features/VENDORS.md`
- `features/GUESTS.md`
- `features/SEATING.md`
- `features/BUDGET.md`
- `features/TASKS.md`
- `features/DECISIONS.md`
- `features/PLANNING.md`
- `features/EVENT-TIMELINE.md`
- `features/DOCUMENTS.md`
- `features/CONTRACT-READINESS.md`
- `features/INBOX.md`
- `features/GLOBAL-SEARCH.md`
- `features/IMPORT-EXPORT.md`
- `features/SETTINGS-DIAGNOSTICS.md`

New V1 guest communication contracts:
- [`features/GUEST-RSVP-PORTAL.md`](features/GUEST-RSVP-PORTAL.md)
- [`features/COMMUNICATIONS.md`](features/COMMUNICATIONS.md)

`features/GUESTS.md` and `features/AUTH-ONBOARDING.md` have been reconciled with the new scope.

---

# 6. Import / export / backup / migration

Base:
- `import-export/FORMATS.md`
- `import-export/CANONICAL-JSON-V1.md` + addendum
- `import-export/MAPPING.md`
- `import-export/DEDUPLICATION.md`
- `import-export/MERGE.md`
- `import-export/ROLLBACK.md`
- `operations/BACKUPS.md`
- `operations/BACKUP-FORMAT.md`
- `operations/DISASTER-RECOVERY.md`
- `migration/INITIAL-DATA-MIGRATION.md`
- `migration/CUTOVER.md`

Guest communications:
- [`import-export/GUEST-COMMUNICATIONS-PORTABILITY.md`](import-export/GUEST-COMMUNICATIONS-PORTABILITY.md)

Raw guest capability tokens/provider secrets are never ordinary project exports.

---

# 7. Security / authorization / privacy

**Always start at [`security/README.md`](security/README.md).**

Base security corpus includes security architecture/control baseline/requirements/threat models/Auth/authorization/RLS/validation/query/frontend/file/protocol/secret/privacy/platform-admin/abuse/supply-chain/ASVS documents.

Guest communications mandatory additions:
- [`security/GUEST-COMMUNICATIONS-SECURITY.md`](security/GUEST-COMMUNICATIONS-SECURITY.md)
- [`security/GUEST-COMMUNICATIONS-AUTHORIZATION.md`](security/GUEST-COMMUNICATIONS-AUTHORIZATION.md)

Partner-account invitation and guest RSVP invitation are separate trust models.

---

# 8. Quality / testing

Base:
- `quality/TESTING-STRATEGY.md`
- `quality/COVERAGE-POLICY.md`
- `quality/MUTATION-TESTING.md`
- `quality/E2E-TESTING.md`
- `quality/TEST-DATA.md`
- `quality/PUBLIC-READINESS-TEST-MATRIX.md`
- `quality/SECURITY-TESTING.md`
- `quality/QUALITY-GATES.md`
- `quality/ACCESSIBILITY.md`
- `quality/PERFORMANCE.md`
- `quality/BROWSER-SUPPORT.md`

Guest communications:
- [`quality/GUEST-COMMUNICATIONS-ACCEPTANCE.md`](quality/GUEST-COMMUNICATIONS-ACCEPTANCE.md) — GC-001..060.

---

# 9. Operations / provider / release

Core operations include backups/disaster recovery/free-tier/privacy/public launch/incident/release/version contracts.

Guest communications:
- [`operations/COMMUNICATION-PROVIDER-OPERATIONS.md`](operations/COMMUNICATION-PROVIDER-OPERATIONS.md)
- [`operations/FREE-TIER.md`](operations/FREE-TIER.md) — core €0 target vs optional paid communication traffic.

Release/versioning must preserve webhook/idempotency/guest-link compatibility across upgrades.

---

# 10. Engineering / maintainability / agent governance

Base:
- `engineering/IMPLEMENTATION-PLAYBOOK.md`
- `engineering/LLM-TASK-ROUTING.md`
- `engineering/REQUIREMENTS-TRACEABILITY.md`
- `engineering/CODING-STANDARDS.md`
- `engineering/CODEBASE-STRUCTURE.md`
- `engineering/MODULE-SIZE-COMPLEXITY.md`
- `engineering/ERROR-HANDLING.md`
- `engineering/OBSERVABILITY-DIAGNOSTICS.md`
- `engineering/MIGRATIONS.md`
- `engineering/DEFINITION-OF-DONE.md`
- `engineering/CI-CD.md`
- `engineering/RELEASE-PROCESS.md`
- `engineering/VERSIONING-UPDATE-DELIVERY.md`

Guest communications code placement:
- [`engineering/CODEBASE-STRUCTURE-GUEST-COMMUNICATIONS-ADDENDUM.md`](engineering/CODEBASE-STRUCTURE-GUEST-COMMUNICATIONS-ADDENDUM.md)

Root governance:
- `../AGENTS.md`
- `../CONTRIBUTING.md`
- `../.github/pull_request_template.md`

---

# 11. Roadmap / acceptance / checkpoints

- [`roadmap/LOTS.md`](roadmap/LOTS.md) — current implementation sequence.
- `roadmap/LOT-ACCEPTANCE.md`
- [`roadmap/LOT-ACCEPTANCE-GUEST-COMMUNICATIONS-ADDENDUM.md`](roadmap/LOT-ACCEPTANCE-GUEST-COMMUNICATIONS-ADDENDUM.md)
- `roadmap/INTEGRATION-CHECKPOINTS.md`
- [`roadmap/INTEGRATION-CHECKPOINTS-GUEST-COMMUNICATIONS-ADDENDUM.md`](roadmap/INTEGRATION-CHECKPOINTS-GUEST-COMMUNICATIONS-ADDENDUM.md)
- `roadmap/IMPLEMENTATION-STATUS.md` — exact current state/next allowed action.

---

# 12. Review / freeze evidence

Systematic reviews live in `reviews/`.

Current scope-change review/certification must be read together with the historical full-design reviews. A future contributor must never infer implementation status from an old review date; use `roadmap/IMPLEMENTATION-STATUS.md`.

---

## Navigation invariant

If a new normative document is created but is not discoverable from at least one of `AGENTS.md`, `START-HERE.md`, `V1-FROZEN-MANIFEST.md` or this index according to its task category, documentation navigation is incomplete and the change must not be considered frozen.