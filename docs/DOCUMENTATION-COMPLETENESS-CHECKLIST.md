# Documentation Completeness Checklist

Status: **Final pre-code review checklist — COMPLETE pending Run 4 merge**

This checklist is the formal answer to whether Mariage OS is documented precisely enough to start implementation without relying on prior chat context.

A checked item means a dedicated normative document or explicit section exists. Implementation/test evidence is expected later in the named implementation lots, not during documentation-only design.

---

## Product and scope

- [x] Product mission and jobs-to-be-done.
- [x] Two-partner collaboration model.
- [x] Cloud/multi-device requirement.
- [x] Hard €0/month operating constraint.
- [x] Public-code/private-data rule.
- [x] V1 definition.
- [x] Explicit post-V1 backlog.
- [x] Non-goals/scope guardrails.
- [x] Master product specification/cahier des charges.
- [x] Stable P0/P1/P2 requirements catalog.
- [x] Forty critical behavioral acceptance scenarios.
- [x] Deliberately deferred implementation decisions.
- [x] Source-of-truth cutover criteria.

## UX/product behavior

- [x] Desktop/mobile navigation.
- [x] Route/screen contract matrix.
- [x] Core user flows.
- [x] Wireframe-level screen structures.
- [x] Auth/onboarding flow.
- [x] Settings/diagnostics flow.
- [x] Design system principles/components.
- [x] Form/autosave/draft behavior.
- [x] Loading/empty/error/offline/conflict/permission states.
- [x] Undo/destructive confirmation policy.
- [x] Dashboard prioritization contract.
- [x] Phase-aware planning behavior.
- [x] Accessibility contract.
- [x] Browser/device support policy.
- [x] Performance budgets/reference data sizes.

## Architecture

- [x] High-level architecture.
- [x] Chosen stack and rationale.
- [x] Trust boundaries.
- [x] Cloud/local/recovery source-of-truth distinctions.
- [x] Local-first interaction model.
- [x] Sync/revision/idempotence/conflict model.
- [x] Offline policy.
- [x] PWA/service-worker lifecycle/update compatibility.
- [x] Supabase Storage architecture/upload lifecycle.
- [x] IndexedDB/local working schema.
- [x] Pending mutation/conflict/draft local stores.
- [x] Repository/service/provider boundaries.
- [x] Pure business-engine boundaries.
- [x] Derived-data dependency/invalidation graph.
- [x] Provider portability rule.
- [x] Major architecture decisions recorded as ADRs.

## Database/domain model

- [x] Conceptual ERD.
- [x] Physical V1 PostgreSQL schema reference.
- [x] Tables/columns/types/key relationships.
- [x] Project scoping/RLS baseline.
- [x] Indexing baseline.
- [x] Polymorphic same-project validation approach.
- [x] UUID/external-ID/hash strategy.
- [x] Data dictionary conventions.
- [x] Revision/audit metadata.
- [x] Venue domain.
- [x] Venue spaces/capacities.
- [x] Venue offers/components/availability.
- [x] Generic fact definitions.
- [x] Fact observations/sources/retained values.
- [x] Confidence/freshness/revalidation.
- [x] Stable default venue criteria keys.
- [x] Stable default caterer/vendor criteria keys.
- [x] Vendor/offers/contacts/interactions.
- [x] Households/guests.
- [x] Tasks/dependencies/links.
- [x] Decisions/options/approvals/links.
- [x] Budget/payments/links.
- [x] Milestones.
- [x] Documents/media/derivatives/links.
- [x] Import history/change lineage/external identifiers.
- [x] Server idempotence/sync mutation receipts.
- [x] Deletion/retention.
- [x] Domain invariants.
- [x] State machines.
- [x] Dates/timezones/after-midnight semantics.
- [x] Exact money semantics.

## Feature contracts

- [x] Authentication/onboarding.
- [x] Dashboard.
- [x] Venues and visit mode.
- [x] Map/accessibility.
- [x] Vendors/caterers.
- [x] Guests/households.
- [x] Budget/payments.
- [x] Tasks.
- [x] Decisions.
- [x] Planning/milestones.
- [x] Documents/media.
- [x] Import/export.
- [x] Settings/diagnostics.

## Import/export and portability

- [x] CSV semantics.
- [x] XLSX semantics.
- [x] Canonical JSON v1 logical contract and sample shapes.
- [x] `.mariage` open recovery format.
- [x] Missing/null/unknown/conflict semantics.
- [x] Mapping behavior.
- [x] Locale normalization.
- [x] Duplicate matching confidence.
- [x] Re-import idempotence.
- [x] Evidence-aware merge precedence.
- [x] Protected data behavior.
- [x] No implicit deletion from missing rows.
- [x] Preview-before-commit.
- [x] Atomic/partial import semantics.
- [x] Rollback after later edits.
- [x] Import provenance/history.
- [x] External research completion workflow.
- [x] Round-trip requirement.
- [x] Active spreadsheet/file-content security rule.
- [x] Machine schema/template generation explicitly assigned to Lot 4.

## Security/privacy

- [x] Security architecture.
- [x] Threat model.
- [x] Authentication/MFA policy.
- [x] Invitation/project-membership model.
- [x] Session/re-authentication principles.
- [x] RLS project isolation.
- [x] Storage RLS.
- [x] Client secret/service-role prohibition.
- [x] File upload/type/active-content security.
- [x] Frontend XSS/CSP/header requirements.
- [x] Privacy/data minimization/classification.
- [x] Public-repo hygiene and `.gitignore` defense-in-depth.
- [x] Supply-chain controls.
- [x] ASVS 5.0 verification matrix framework.
- [x] Security testing strategy.
- [x] Incident response.
- [x] Public vulnerability-reporting policy.
- [x] Diagnostics/log PII minimization.

## Testing/quality

- [x] Layered test strategy.
- [x] Unit tests.
- [x] Property-based tests.
- [x] Integration/local Supabase tests.
- [x] Database/RLS allow+deny tests.
- [x] Security/adversarial tests.
- [x] Playwright E2E.
- [x] Forty critical acceptance scenarios.
- [x] Offline/reconnect/session-expiry tests.
- [x] Import/export/rollback/round-trip tests.
- [x] Backup/restore tests.
- [x] Historical DB/local/import migration tests.
- [x] 100% in-scope code-coverage gate.
- [x] Mutation testing of critical engines.
- [x] Synthetic/golden project test data.
- [x] Accessibility automated/manual checks.
- [x] Performance budgets.
- [x] Browser/device test matrix and real-device checks.
- [x] Release-blocking Quality Gates.

## Engineering process

- [x] Coding standards.
- [x] Application/service/repository boundaries.
- [x] Error taxonomy/recovery UX.
- [x] Observability/diagnostics without behavioral tracking.
- [x] DB/local/import/backup migration strategy.
- [x] CI/CD principles.
- [x] Release process.
- [x] Definition of Done.
- [x] Requirements traceability process.
- [x] Contributor guide.
- [x] Changelog policy.
- [x] ADR policy.
- [x] Deliberate ambiguity register.

## Operations/recovery

- [x] Free-tier/quota behavior.
- [x] Essential-data-first storage/sync priority.
- [x] Backup strategy.
- [x] Portable restore/integrity validation.
- [x] Disaster recovery scenarios.
- [x] Cloud outage degradation.
- [x] Diagnostics/integrity checking.
- [x] Orphan media cleanup/retention.
- [x] Existing-data migration plan.
- [x] Cutover/source-of-truth plan.

## Implementation roadmap

- [x] Documentation runs 1–4.
- [x] Implementation lots 0–12.
- [x] Lot dependency order.
- [x] Per-lot deliverables.
- [x] Per-lot tests/security expectations.
- [x] Per-lot objective exit criteria.
- [x] V1 release blockers.
- [x] Cutover evidence package.
- [x] Post-V1 promotion process.
- [x] Explicit next step: Lot 0 only.

---

# Items intentionally not finalized before coding

The following are explicitly deferred, not missing:

- concrete package versions;
- exact lint/formatter/test package choices;
- exact final browser minimum versions;
- exact visual palette/font stack;
- IndexedDB helper library vs native abstraction;
- exact service-worker library/manual implementation;
- exact CSV/XLSX parser packages;
- machine-readable JSON Schema files generated from the canonical logical contract;
- synthetic template files generated during Import/Export implementation;
- concrete SQL migration files implementing the physical schema;
- exact CI YAML and script syntax;
- exact test source files;
- exact production Supabase/Cloudflare project identifiers/configuration.

These belong to named implementation lots and are constrained by existing specs/ADRs. Their deferral is documented in `DEFERRED-DECISIONS.md`.

---

# Completion rule

Documentation is ready for code when:

1. this checklist is reviewed;
2. Run 4 PR is merged;
3. `README`, `START-HERE`, `INDEX`, V1 scope and roadmap agree;
4. no undocumented critical behavior relies solely on chat memory;
5. no known internal documentation contradiction remains;
6. real wedding data/secrets are absent from the public repository;
7. implementation begins at Lot 0 and uses versioned spec/ADR changes for future discoveries.

After this point, more pre-code brainstorming is optional rather than required. Product precision should improve from implementation/tests/real usage through normal change control, not indefinite design expansion.
