# Pre-code Documentation Audit

Status: **Freeze review — all currently known findings resolved in normative documentation**

This document records design/documentation defects found before implementation. `RESOLVED` means the required semantic decision now exists in normative docs; implementation evidence still belongs to its development lot and Quality Gate.

## Audit method

Cross-checks performed:

- original couple workflows ↔ product/V1 scope;
- feature contracts ↔ screen routes ↔ persistence;
- ERD ↔ physical schema;
- import/export ↔ external-ID/category/schema persistence;
- security/RLS ↔ relational integrity/bootstrap;
- local/offline/sync ↔ cloud state/commands;
- finance ↔ offers/scenarios/payments/tax;
- planning ↔ milestones/seating/event timeline;
- documents ↔ version/review/evidence;
- privacy ↔ remote resources/local cache/exports;
- quality ↔ objective acceptance/invariants.

## Severity

- `BLOCKING` — security/data-loss/financial/recovery architecture failure.
- `MAJOR` — required V1 behavior would otherwise require an undocumented design decision.
- `MINOR` — ambiguity/maintainability/UX/privacy detail worth resolving before freeze.

---

## Findings

| ID | Severity | Status | Finding | Normative resolution |
|---|---|---|---|---|
| AUD-001 | BLOCKING | RESOLVED | Child FK could point to parent in another project. | Composite `(project_id,parent_id)` FKs + DB validation for polymorphic links in physical schema. |
| AUD-002 | MAJOR | RESOLVED | Weekday 0..6 mapping undefined. | Frozen 0=Sunday … 6=Saturday in `DATES-TIME.md`, schema and JSON addendum. |
| AUD-003 | MAJOR | RESOLVED | Payments could not model all documented deposit/installment/refund states. | Expanded payment types/statuses + linked non-negative refund/return cash movements. |
| AUD-004 | MAJOR | RESOLVED | Nested external IDs documented parent-scoped but persisted globally. | Parent-aware external identifier uniqueness + canonical addendum. |
| AUD-005 | MAJOR | RESOLVED | Named budget scenarios lacked persistence. | `budget_scenarios` + `budget_scenario_items`, explicit active scenario. |
| AUD-006 | MAJOR | RESOLVED | Partner favorites/ratings had no durable per-member model. | `member_entity_preferences` + `member_ratings`. |
| AUD-007 | MAJOR | RESOLVED | Date alternatives before final selection were implicit only. | `wedding_date_options` + protected selected-date transition. |
| AUD-008 | MAJOR | RESOLVED | Multiple travel origins/routes collapsed into ambiguous facts. | `project_reference_origins` + `venue_access_routes`; summary facts derived only. |
| AUD-009 | MAJOR | RESOLVED | “Final seating plan” mentioned but no V1 seating persistence. | V1 non-visual `seating_sections/tables/assignments`; graphical canvas remains post-V1. |
| AUD-010 | MAJOR | RESOLVED | Milestone dependencies/completion rules absent from schema. | Persist completion rule, dependencies and links. |
| AUD-011 | MAJOR | RESOLVED | Fact observations were conceptually multi-source but schema singular. | `observation_sources`, raw value, confidence, supersession lifecycle. |
| AUD-012 | MAJOR | RESOLVED | Guest/budget categories were free strings despite configurable/importable taxonomy. | Project-scoped category entities with stable keys. |
| AUD-013 | MAJOR | RESOLVED | Remembered import mapping had no persistence. | `import_mapping_profiles`. |
| AUD-014 | MAJOR | RESOLVED | Partner invite flow could imply server/admin secret requirement. | Client-safe authorized DB command + hashed one-time token + verified-email acceptance. |
| AUD-015 | BLOCKING | RESOLVED | Public app could allow arbitrary users/projects and exhaust free tier. | Single-couple deployment, one-time bootstrap, disable unrestricted signups, DB project-create lock. |
| AUD-016 | MAJOR | RESOLVED | Logout/cache policy ambiguous. | Pending work must resolve explicitly; successful logout purges private local project cache. |
| AUD-017 | MAJOR | RESOLVED | Inbox appeared in UX without feature/schema. | `INBOX.md` + `inbox_items` + idempotent conversion. |
| AUD-018 | MINOR | RESOLVED | Global Search had no contract. | `GLOBAL-SEARCH.md` + routed/cached-only/privacy behavior. |
| AUD-019 | MAJOR | RESOLVED | “Since last visit” lacked durable per-member cursor. | `project_members.last_seen_activity_at`. |
| AUD-020 | MAJOR | RESOLVED | Backup encryption/portable format under-specified. | `operations/BACKUP-FORMAT.md`: ZIP-compatible inner archive; PBKDF2-HMAC-SHA-256 + AES-256-GCM encrypted outer container. |
| AUD-021 | MINOR | RESOLVED | 30-day trash implied nonexistent precise background scheduler. | 30 days means purge-eligible; explicit/opportunistic maintenance, no exact cron guarantee. |
| AUD-022 | MINOR | RESOLVED | Remote images leak IP/referrer metadata to external hosts. | No-referrer, no private query data, nonessential/lazy remote refs, privacy disclosure/archive option. |
| AUD-023 | MAJOR | RESOLVED | Offer tax treatment TTC/HT was not represented. | Explicit `tax_mode` + optional basis-points rate; unknown remains unknown. |
| AUD-024 | MAJOR | RESOLVED | Canonical tags had no persistent model. | `tags` + `entity_tags`. |
| AUD-025 | MINOR | RESOLVED | Device provenance inconsistent in server records. | Optional non-authenticating `device_id` on activity/mutation receipts. |
| AUD-026 | MAJOR | RESOLVED | Criterion priority did not define what value is good/bad. | `CRITERIA-EVALUATION.md` + `evaluation_rule_json`; blocking result and weighted score are deterministic/explainable. |
| AUD-027 | MAJOR | RESOLVED | Fact JSONB accepted no exact value-shape contract. | `FACT-VALUE-TYPES.md` + persistence validation by definition value type. |
| AUD-028 | MAJOR | RESOLVED | Preparation milestones did not represent actual wedding-day sequence. | `EVENT-TIMELINE.md` + timeline tables in physical-schema addendum. |
| AUD-029 | MAJOR | RESOLVED | Document feature promised versions/supersession but schema lacked it. | Document supersession/review metadata + `document_review_items`. |
| AUD-030 | MAJOR | RESOLVED | Important venue/vendor promises had no explicit pre-signature review workflow. | `CONTRACT-READINESS.md`; document-version-specific checklist, no legal-advice claim. |
| AUD-031 | MAJOR | RESOLVED | V1 scope/route docs did not consistently include seating, Inbox, Search and timeline. | Revised `V1-SCOPE.md`, `SCREEN-CONTRACTS.md`, planning/features. |
| AUD-032 | MAJOR | RESOLVED | Fact criteria used invalid pseudo-priorities such as `blocking-negative`. | Priorities normalized; desirability expressed exclusively through evaluation rules. |
| AUD-033 | MAJOR | RESOLVED | Sync model did not explicitly cover protected multi-row commands/stale command preconditions. | Revised `SYNC.md` with command conflict/reconnect/queue semantics. |
| AUD-034 | MAJOR | RESOLVED | RLS spec was conceptual but not table/action exact. | `RLS-MATRIX-V1.md` maps client rights/protected commands/test identities. |
| AUD-035 | MINOR | RESOLVED | Threat model omitted signup abuse/invite replay/remote-image/backup-crypto cases. | Revised `THREAT-MODEL.md`. |

---

# Freeze gates still to execute (not design gaps)

Before PR #4 merge:

1. update INDEX/START-HERE/readiness/completeness/roadmap references to all final documents;
2. update master product/requirements documents where older language conflicts with resolved V1 scope;
3. reply to automated PR review comments with concrete fixes;
4. rerun/reinspect PR review for new contradictions;
5. inspect public diff for production secrets/real wedding private data;
6. ensure no known BLOCKING/MAJOR row is reopened by later edits.

Implementation verification remains future work:

- SQL migrations/functions/RLS tests;
- actual JSON Schema/test fixtures;
- CI workflows;
- UI implementation;
- provider configuration;
- real-device/security/backup drills.

Those are implementation deliverables, not missing documentation decisions.

After freeze, new evidence from coding/testing can reopen a spec through normal ADR/change process. “Frozen” means no known design ambiguity is being intentionally handed to implementation.