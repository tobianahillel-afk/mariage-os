# Documentation Completeness and Freeze Checklist

Status: **V1 design coverage complete; final cross-document review in progress; implementation gate CLOSED**

A checked item means a normative contract exists and has been reconciled into the frozen V1 baseline. It does not mean implementation evidence already exists.

The final implementation authorization is separately controlled by `FINAL-DESIGN-REVIEW.md` + Run 4 merge.

## Product/scope

- [x] Mission / Understand→Decide→Act model.
- [x] Two-owner collaboration model.
- [x] Cloud/multi-device/offline requirement.
- [x] €0/month design constraint.
- [x] Single-couple closed production bootstrap.
- [x] Public-code/private-data rule.
- [x] Frozen V1 definition and explicit post-V1 boundary.
- [x] Master frozen product specification.
- [x] Stable P0/P1/P2 requirements catalog.
- [x] 104 V1 user/system capabilities enumerated in Feature Ledger.
- [x] 24 critical user flows.
- [x] 80 critical Given/When/Then acceptance scenarios.
- [x] Deliberately deferred implementation choices separated from frozen semantics.
- [x] Source-of-truth cutover criteria/evidence.

## V1 functional coverage

- [x] Authentication/bootstrap/invitation/MFA/logout.
- [x] Dashboard.
- [x] Venues/compare/visit.
- [x] Multi-origin access/map.
- [x] Vendors/caterers.
- [x] Guests/households/statistics.
- [x] Structured non-visual seating.
- [x] Tasks/waiting/dependencies.
- [x] Joint decisions/approvals/rationale.
- [x] Inbox/quick capture.
- [x] Global search.
- [x] Budget/named scenarios/tax/payments/refunds/cash flow.
- [x] Planning/milestones.
- [x] Structured wedding-day timeline/frozen export.
- [x] Documents/media/versioning.
- [x] Contract readiness factual checklist.
- [x] Tags.
- [x] Import/export/mapping/dedup/rollback.
- [x] Portable/encrypted backup/restore.
- [x] Settings/security/diagnostics.

## UX/navigation/design

- [x] Product mental model and top-level information architecture.
- [x] Desktop/mobile navigation.
- [x] Route/screen matrix for all V1 domains.
- [x] Screen taxonomy: overview, collection, entity detail, workflow, analysis, operational, settings.
- [x] One-screen/one-primary-job rule.
- [x] Progressive disclosure Levels 1/2/3.
- [x] Page vs tab vs drawer vs dialog selection rules.
- [x] Cards/lists/tables/comparison usage rules.
- [x] Explicit anti-mega-page/admin-CRUD guardrails.
- [x] Desktop/mobile/tablet layout behavior.
- [x] Detailed Screen Blueprints for major V1 screens.
- [x] Venue decision journey.
- [x] Guest→RSVP→Seating journey.
- [x] Vendor→Quote→Contract→Budget/Timeline journey.
- [x] Dashboard→next-action→completion journey.
- [x] Document detail/contract-review route.
- [x] Seating route/workspace.
- [x] Timeline route/workspace.
- [x] Search and Inbox surfaces.
- [x] Auth/invite/restore routes.
- [x] Universal loading/empty/partial/offline/pending/conflict/error/permission/session-expired states.
- [x] Explicit session-expiry vs logout behavior.
- [x] Autosave/drafts.
- [x] Undo/destructive confirmation.
- [x] Accessibility/no pointer-only critical feature.
- [x] Browser/device and performance policies.
- [x] UX review checklist can reject technically-correct but poor/overloaded screens.
- [x] Major screen acceptance requires desktop/mobile synthetic visual evidence.

## Architecture

- [x] High-level Cloudflare + Supabase + IndexedDB PWA architecture.
- [x] Stack and ADRs.
- [x] Trust boundaries including browser/local/CI/Auth/DB/Storage/Realtime/external/import/export/email.
- [x] Cloud/local/recovery sources of truth.
- [x] Local-first write/read model.
- [x] Sync/revision/idempotence/conflicts/reconnect.
- [x] Per-workflow offline capability matrix.
- [x] PWA/service-worker lifecycle.
- [x] Storage object/path/upload/derivative/remote-media model.
- [x] IndexedDB schema reconciled with frozen V1 cloud/domain model.
- [x] Repository/service/provider boundaries reconciled with every V1 feature.
- [x] Pure critical engines identified.
- [x] Business dependency/invalidation graph reconciled with dates/origins/scenarios/seating/timeline/contracts.
- [x] Provider portability rule.

## Domain/database

- [x] Conceptual ERD reconciled with physical schema + freeze addendum.
- [x] Physical PostgreSQL V1 reference.
- [x] Freeze addendum for criteria typing/timeline/document review.
- [x] Project scoping and same-project composite FK rule.
- [x] Polymorphic DB target validation.
- [x] RLS baseline/table matrix.
- [x] IDs/external IDs/hashes and parent-scoped nested IDs.
- [x] Audit/revision metadata.
- [x] Weekday/date/timezone/after-midnight rules.
- [x] Exact money/tax semantics.
- [x] State-machine/transition catalog.
- [x] 101 domain/security/recovery invariants.
- [x] Fact definitions/value types/evaluation rules.
- [x] Fact observations/multi-source/retained value/confidence/freshness.
- [x] Default stable venue/vendor/caterer criterion keys.
- [x] Member ratings/preferences distinct from facts.
- [x] Date options/reference origins/access routes.
- [x] Guest categories/seating.
- [x] Budget categories/scenarios/payments.
- [x] Milestones/timeline.
- [x] Documents/version/review/source linkage.
- [x] Inbox/tags/import mapping profiles/activity/sync receipts.
- [x] Soft deletion/purge eligibility/recovery.

## Import/export/portability

- [x] CSV/XLSX semantics.
- [x] Canonical JSON v1 + freeze addendum.
- [x] Missing/null/unknown/conflict semantics.
- [x] Parent-scoped nested external ID semantics.
- [x] Mapping and saved profiles.
- [x] Locale/type normalization.
- [x] Duplicate matching confidence/human resolution.
- [x] Evidence-aware merge precedence.
- [x] Protected fields/locked truth.
- [x] Preview-before-commit + stale-preview revalidation.
- [x] No implicit deletion.
- [x] Rollback protecting later edits.
- [x] Provenance/history.
- [x] External research round-trip.
- [x] CSV formula-injection protections.
- [x] Active spreadsheet content never executed.
- [x] Plain `.mariage` structure/checksums/version.
- [x] Authenticated encrypted `.mariage` semantics.
- [x] Wrong password/tamper/future-version failure before mutation.

## Security/privacy

- [x] Security architecture and full threat model.
- [x] Controlled single-couple bootstrap threat/control.
- [x] Secure invitation hash/identity/replay semantics.
- [x] MFA/session/re-authentication.
- [x] RLS table-by-table matrix incl. timeline/document review/seating.
- [x] Storage RLS.
- [x] Same-project FK/link integrity.
- [x] Security-definer command requirements.
- [x] Client secret/service-role prohibition.
- [x] File/active-content security.
- [x] Frontend XSS/CSP/security headers.
- [x] Privacy/data minimization/export allowlists.
- [x] Remote image/referrer/private-URL policy.
- [x] Public Git/CI/supply-chain boundaries.
- [x] ASVS 5.0 verification framework.
- [x] Sanitized diagnostics/logging.
- [x] Incident/vulnerability reporting.

## Testing/quality

- [x] Unit/property/integration/database/RLS/security layers.
- [x] Playwright critical E2E.
- [x] 80 critical acceptance scenarios.
- [x] Offline/reconnect/session/PWA scenarios.
- [x] Import/rollback/round-trip/hostile-file scenarios.
- [x] Finance/scenario/tax/payment/refund tests.
- [x] Guest/statistics/seating tests.
- [x] Timeline/date/dependency/export tests.
- [x] Document version/readiness tests.
- [x] Backup/encryption/restore/migration tests.
- [x] 100% in-scope lines/statements/functions/branches policy.
- [x] Mutation testing critical engines.
- [x] Synthetic/golden data only.
- [x] Accessibility/performance/browser-device gates.
- [x] Critical/High vulnerability release policy.
- [x] Requirement traceability.
- [x] Feature-level traceability from product→requirements→UX→data→tests→evidence.

## Implementation governance / anti-drift

- [x] Feature Ledger enumerates 104 V1 capabilities.
- [x] Feature lifecycle is standardized (`SPECIFIED`→`ACCEPTED`).
- [x] Feature Implementation Record defines required implementation metadata/evidence.
- [x] Definition of Ready prevents guessing unresolved semantics.
- [x] Definition of Verified requires all applicable layers, not just coverage.
- [x] Vertical-slice implementation rule.
- [x] PR anti-drift questions.
- [x] Current implementation status board exists.
- [x] End-of-session/handoff update protocol exists.
- [x] Lot progress is measured using Feature IDs/status, not vague percentages.
- [x] Mandatory Checkpoint A after Lots 0–3.
- [x] Mandatory Checkpoint B after Lots 4–7.
- [x] Mandatory Checkpoint C after Lots 8–10.
- [x] Mandatory Checkpoint D after Lots 11–12.
- [x] Checkpoints re-review product, UX, architecture, security, data, offline, testing and docs.
- [x] Checkpoint review findings use stable IDs/severity/status and remain historically visible.
- [x] Next normal lot group cannot start while governing checkpoint has BLOCKING/MAJOR findings.

## Engineering/operations

- [x] Coding/error/observability standards.
- [x] DB/local/import/backup migration strategy.
- [x] CI/CD and release principles.
- [x] Definition of Done.
- [x] Free-tier/quota degradation behavior.
- [x] Backup/disaster recovery.
- [x] Storage orphan/retention rules.
- [x] Existing-data migration/cutover.
- [x] Lots 0–12 reconciled with frozen feature set.
- [x] Objective lot acceptance criteria.
- [x] No implementation lot may start before final design gate opens.

## Intentionally implementation-time, not missing

The following remain deliberately deferred mechanisms:

- concrete Node/npm/package versions;
- exact lint/formatter/property/mutation libraries;
- IndexedDB wrapper vs native API;
- exact supported browser minimum versions after Lot 0/real-device validation;
- exact accessible visual palette/font stack within frozen design/UX direction;
- exact XLSX/CSV/JSON-schema libraries;
- manual vs maintained PWA/service-worker helper;
- exact map/tile library/provider integration;
- concrete SQL migration files implementing frozen physical semantics;
- concrete machine JSON Schema files generated from canonical contract;
- concrete CI YAML/test source files;
- production Supabase/Cloudflare identifiers/configuration.

These cannot alter frozen product/security/data/UX semantics without reviewed spec/ADR change.

---

# Final freeze gate

Documentation coverage is considered **complete**, but implementation remains CLOSED until all of the following are true:

- [ ] `FINAL-DESIGN-REVIEW.md` completed across all review dimensions, including UX architecture/design governance.
- [ ] Every final-review BLOCKING/MAJOR finding resolved.
- [ ] Master spec, V1 scope, requirements, Feature Ledger, routes, UX blueprints, ERD/schema/local schema, lots and acceptance scenarios agree.
- [ ] Five existing PR P1 review comments have documented responses/resolution.
- [ ] No stale normative `future/pending/candidate/Lot0 next` wording creates contradictory semantics.
- [ ] Public repository branch contains no real wedding data/secrets/private artifacts.
- [ ] PR #4 is mergeable and final review/consistency check passes.
- [ ] PR #4 is merged into `main`.

Only after those boxes are closed may implementation gate become OPEN. The first implementation lot would then be Lot 0, but this documentation task does **not** start it.
