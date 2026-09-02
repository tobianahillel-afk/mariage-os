# Pre-code Documentation Audit

Status: **Active freeze review**

This document records issues found during the final pre-code review of Mariage OS documentation. A documentation item is not considered frozen while a known `BLOCKING` or `MAJOR` finding remains unresolved.

## Audit method

The review cross-checks:

- product specification and original intended couple workflows;
- feature contracts versus physical persistence model;
- ERD versus physical schema;
- import/export contracts versus external-ID persistence;
- security/RLS assumptions versus relational integrity;
- offline/sync semantics versus local/cloud schemas;
- finance feature semantics versus payment/scenario persistence;
- navigation/wireframes versus feature contracts/routes;
- quality requirements versus objective acceptance scenarios;
- operations/recovery versus implementable browser/cloud behavior.

## Severity

- `BLOCKING`: could create security, data-loss, financial-integrity or unrecoverable design failure.
- `MAJOR`: required V1/product behavior cannot be implemented without inventing undocumented semantics.
- `MINOR`: ambiguity or maintainability/UX issue that should be resolved before freeze where practical.
- `DEFERRED`: deliberately postponed and explicitly bounded by existing specification.

---

## Findings and resolutions

| ID | Severity | Finding | Resolution |
|---|---|---|---|
| AUD-001 | BLOCKING | Project-scoped child foreign keys could reference a parent from another project while carrying an authorized child `project_id`. | Require composite same-project FKs `(project_id,parent_id)` for relational references and same-project validation for polymorphic references. |
| AUD-002 | MAJOR | Numeric weekday convention was undefined. | Freeze `0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday` across DB, TypeScript and import/export. |
| AUD-003 | MAJOR | Payment types/statuses in physical schema could not represent the finance/state-machine contract. | Expand payment types/statuses and model refunds as linked cash movements. |
| AUD-004 | MAJOR | Nested external IDs were documented as parent-scoped but persisted as project-global. | Add parent scope to external identifier uniqueness with separate top-level/nested uniqueness rules. |
| AUD-005 | MAJOR | Named budget scenarios had no persistence model. | Add `budget_scenarios` and `budget_scenario_items`; active scenario is explicit. |
| AUD-006 | MAJOR | Venue personal favorites/ratings existed in UX but no durable per-member model existed. | Add `member_entity_preferences` and `member_ratings`. |
| AUD-007 | MAJOR | Date comparison before final wedding-date selection was implicit only. | Add `wedding_date_options`; selected date is explicit and budget/availability can reference candidates. |
| AUD-008 | MAJOR | Multiple project origins and route observations were required by access UX but one generic duration fact could not distinguish origins. | Add `project_reference_origins` and `venue_access_routes`. |
| AUD-009 | MAJOR | Planning referenced a final seating plan but no V1 non-visual seating persistence existed. | Promote basic seating sections/tables/guest assignment to V1; drag-and-drop canvas remains post-V1. |
| AUD-010 | MAJOR | Milestone dependencies/completion rules were documented but absent from physical schema. | Add milestone dependency/link persistence and completion-rule fields. |
| AUD-011 | MAJOR | Fact observations were documented as multi-source but physical schema allowed one source only and omitted raw/supersession metadata. | Add `observation_sources`, raw value, confidence and observation lifecycle fields. |
| AUD-012 | MAJOR | Configurable guest/budget categories were stored as unconstrained text despite import/category-management requirements. | Add project-scoped guest and budget category tables with stable keys and FKs. |
| AUD-013 | MAJOR | Import mapping profiles were meant to be remembered but had no persistence table. | Add `import_mapping_profiles`. |
| AUD-014 | MAJOR | Partner invitation relied on an unspecified provider/admin flow incompatible with a purely static client if a secret service-role were required. | Specify client-safe invite-token workflow using an authorized DB command, hashed one-time token, authenticated email match and no service-role key in browser. |
| AUD-015 | BLOCKING | Public deployment plus unrestricted self-service project creation could let unrelated users consume the couple's free-tier resources. | V1 is a single-couple deployment: bootstrap onboarding is controlled; project creation is limited; new Auth signups are disabled after both owners are enrolled unless deliberately reopened for recovery. |
| AUD-016 | MAJOR | Logout/local-cache behavior remained intentionally undecided, creating privacy and data-loss ambiguity. | Freeze policy: normal logout must not silently discard pending work; after sync or explicit discard/export, project private cache is purged from that browser profile. |
| AUD-017 | MAJOR | Wireframes contained an Inbox with no feature/schema contract. | Add Inbox/quick-capture contract and `inbox_items`. |
| AUD-018 | MINOR | Desktop shell exposed global Search without a search behavior contract. | Add global-search contract with bounded searchable domains, privacy rules and graceful offline behavior. |
| AUD-019 | MAJOR | “Since your last visit” lacked a durable per-member cursor. | Add member activity cursor/last-seen metadata. |
| AUD-020 | MAJOR | Backup encryption was described but format semantics were not frozen. | Specify versioned encrypted `.mariage` container semantics using Web Crypto authenticated encryption and stored KDF parameters; implementation benchmarks exact KDF work factor without changing format semantics. |
| AUD-021 | MINOR | Soft-delete 30-day target did not specify how purge happens without a custom always-on server. | V1 supports explicit/manual and safe opportunistic purge; elapsed age makes an item eligible, not automatically guaranteed to purge at an exact wall-clock time. |
| AUD-022 | MINOR | External remote images can leak client IP/request metadata to third-party hosts. | Use `referrerpolicy=no-referrer`, explicit external-content handling, and prefer private archived copies for important/finalist media; remote images remain nonessential. |
| AUD-023 | MAJOR | Offer pricing did not explicitly preserve tax-included/excluded semantics. | Add tax mode/rate fields to offer/commercial components where supplied; unknown tax treatment stays unknown rather than assumed. |
| AUD-024 | MAJOR | Canonical JSON supported tags but no persistent tag model existed. | Add project-scoped tags/entity-tag links or remove unsupported tags from canonical contract. V1 adopts generic tags. |
| AUD-025 | MINOR | Activity diagnostics mentioned device provenance but server records did not persist device ID consistently. | Add non-authenticating `device_id` metadata to relevant mutation/activity records where available. |

## Freeze rule

Before PR #4 is merged:

1. every `BLOCKING`/`MAJOR` row above must be reflected in normative documents;
2. physical schema and feature contracts must agree;
3. reviewer findings must be replied to with the concrete resolution;
4. documentation index/completeness/readiness files must reference the final contracts;
5. no new unresolved critical contradiction may be known.

After freeze, newly discovered design defects are handled as normal spec/ADR changes during implementation; “frozen” does not mean immutable in the face of evidence.