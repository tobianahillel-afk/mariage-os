# Documentation Completeness Checklist

Status: **Final pre-code review checklist**

This checklist is used to decide whether Mariage OS is documented precisely enough to start implementation without relying on prior chat context.

A checked item means a dedicated normative document or explicit section now exists. Implementation evidence is not expected yet unless noted.

---

## Product and scope

- [x] Product mission and jobs-to-be-done.
- [x] Two-partner collaboration model.
- [x] Hard €0/month operating constraint.
- [x] Public-code/private-data rule.
- [x] V1 definition.
- [x] Explicit post-V1 backlog.
- [x] Non-goals/scope guardrails.
- [x] Master product specification.
- [x] Stable requirements catalog.
- [x] Deliberately deferred implementation decisions.
- [x] Source-of-truth cutover criteria.

## UX/product behavior

- [x] Desktop/mobile navigation.
- [x] Core user flows.
- [x] Wireframe-level screen structures.
- [x] Design system principles/components.
- [x] Form/autosave/draft behavior.
- [x] Loading/empty/error/offline/conflict states.
- [x] Undo/destructive confirmation policy.
- [x] Dashboard prioritization contract.
- [x] Phase-aware planning behavior.
- [x] Accessibility contract.
- [x] Browser/device support policy.

## Architecture

- [x] High-level architecture.
- [x] Chosen stack and rationale.
- [x] Trust boundaries.
- [x] Cloud/local/recovery source-of-truth distinctions.
- [x] Local-first interaction model.
- [x] Sync/revision/conflict model.
- [x] Offline policy.
- [x] PWA/service-worker lifecycle.
- [x] Supabase Storage architecture.
- [x] IndexedDB/local schema.
- [x] Repository/service/provider boundaries.
- [x] Derived-data dependency/invalidation graph.
- [x] Provider portability rule.
- [x] Architecture decision records.

## Database/domain model

- [x] Conceptual ERD.
- [x] Physical V1 schema reference.
- [x] UUID/external-ID/hash strategy.
- [x] Data dictionary conventions.
- [x] Project scoping.
- [x] Revision/audit metadata.
- [x] Venue domain.
- [x] Venue spaces/capacities.
- [x] Venue offers/availability.
- [x] Generic fact definitions.
- [x] Fact observations/sources.
- [x] Confidence/freshness.
- [x] Default venue criteria keys.
- [x] Default caterer/vendor criteria keys.
- [x] Vendor/contacts/interactions.
- [x] Households/guests.
- [x] Tasks/dependencies.
- [x] Decisions/options/approvals.
- [x] Budget/payments.
- [x] Milestones.
- [x] Documents/media.
- [x] Import history/external identifiers.
- [x] Sync operation receipts.
- [x] Deletion/retention.
- [x] Domain invariants.
- [x] State machines.
- [x] Dates/timezones/after-midnight semantics.
- [x] Exact money semantics.

## Feature contracts

- [x] Dashboard.
- [x] Venues.
- [x] Map/accessibility.
- [x] Vendors.
- [x] Guests.
- [x] Budget.
- [x] Tasks.
- [x] Decisions.
- [x] Planning.
- [x] Documents/media.
- [x] Import/export.

## Import/export and portability

- [x] CSV semantics.
- [x] XLSX semantics.
- [x] Canonical JSON v1 logical contract.
- [x] `.mariage` open recovery format.
- [x] Mapping behavior.
- [x] Locale normalization.
- [x] Duplicate detection.
- [x] Re-import idempotence.
- [x] Evidence-aware merge precedence.
- [x] Protected data behavior.
- [x] No implicit deletion from missing rows.
- [x] Preview-before-commit.
- [x] Rollback semantics.
- [x] Import provenance/history.
- [x] External research completion workflow.
- [x] Round-trip requirement.
- [x] Active spreadsheet/file-content security rule.

## Security/privacy

- [x] Security architecture.
- [x] Threat model.
- [x] Authentication/MFA policy.
- [x] Session/re-authentication principles.
- [x] RLS project isolation.
- [x] Storage RLS.
- [x] Client secret prohibition.
- [x] File upload security.
- [x] Frontend XSS/CSP/header requirements.
- [x] Privacy/data minimization.
- [x] Public-repo hygiene.
- [x] Supply-chain controls.
- [x] ASVS 5.0 verification matrix framework.
- [x] Security testing strategy.
- [x] Incident response.
- [x] Public vulnerability-reporting policy.

## Testing/quality

- [x] Testing pyramid/layer strategy.
- [x] Unit tests.
- [x] Property-based tests.
- [x] Integration tests.
- [x] Database/RLS allow+deny tests.
- [x] Security/adversarial tests.
- [x] Playwright E2E.
- [x] Offline/reconnect/session-expiry tests.
- [x] Import/export/rollback tests.
- [x] Backup/restore tests.
- [x] Historical migration tests.
- [x] 100% in-scope code-coverage gate.
- [x] Mutation testing of critical engines.
- [x] Synthetic/golden project test data.
- [x] Accessibility checks.
- [x] Performance budgets.
- [x] Browser/device test matrix.
- [x] Release-blocking quality gates.

## Engineering process

- [x] Coding standards.
- [x] Error handling/recovery UX.
- [x] Observability/diagnostics without tracking.
- [x] DB/local/import migration strategy.
- [x] CI/CD principles.
- [x] Release process.
- [x] Definition of Done.
- [x] Requirements traceability.
- [x] Contributor guide.
- [x] Changelog policy.
- [x] ADR policy.

## Operations/recovery

- [x] Free-tier/quota behavior.
- [x] Storage-priority behavior.
- [x] Backup strategy.
- [x] Portable restore/integrity validation.
- [x] Disaster recovery scenarios.
- [x] Cloud outage degradation.
- [x] Diagnostics/integrity checking.
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

---

# Items intentionally not finalized before coding

The following are explicitly deferred, not missing:

- concrete package versions;
- exact final browser minimum versions;
- exact visual palette/font stack;
- chosen IndexedDB helper library vs native abstraction;
- exact service-worker library/manual implementation;
- exact CSV/XLSX parser packages;
- machine-readable JSON Schema files generated from canonical logical contract;
- concrete SQL migration files implementing the physical schema;
- exact CI YAML;
- exact test files;
- exact production Supabase project IDs/config values.

These belong to implementation Lots 0–4 and are constrained by existing specs/ADRs.

---

# Completion rule

Documentation is ready for code when:

1. this checklist is reviewed;
2. Run 4 PR is merged;
3. `README`, `START-HERE`, `INDEX`, V1 scope and roadmap agree;
4. no undocumented critical behavior relies solely on chat memory;
5. no known internal documentation contradiction remains;
6. real wedding data/secrets are absent from the public repository.

After this point, additional pre-code brainstorming is optional. New discoveries should be handled through normal specification/ADR changes driven by implementation/testing/user feedback.
