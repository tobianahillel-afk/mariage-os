# WP-2.9B — fresh adversarial Pass B after remediation

Date: 2026-09-29

Review target: `d603f8c2bd5d53c85484c27b72297c60405cf677` /
CI [`36573768984`](https://github.com/tobianahillel-afk/mariage-os/actions/runs/36573768984)
passed **5/5 ordinary jobs**, including local DB/RLS, Pages integration and
full verify from a clean checkout. The remediation head
`bd39576c27d74482c477823e264aa54f85f8a3ed` / CI `36572652546` also
passed 5/5, with 1,439/1,439 pgTAP assertions. The earlier
[failed review](WP-2.9B-PASS-B-REVIEW-2026-09-29.md) and its findings remain
in the record.

## Method and verdict

**PASS — no unresolved BLOCKING, MAJOR or MINOR finding.** I re-read the
bounded FTR-093 Lot-2 contract, Physical Schema V1, ERD/invariant 67,
recoverable-tag rule, RLS permission mapping, live authorization and
input/resource-validation requirements. I challenged the final SQL,
domain/service/adapter paths, direct allow/deny tests and exact-head CI. The
first Pass-A conclusion did not decide this verdict.

| Responsibility | Adversarial check and evidence | Verdict |
| --- | --- | --- |
| Project tag dictionary and canonical identity | `tags` has UUID/same-project identity, immutable lowercase ASCII key, Unicode-scalar label and protected audit/revision fields. Domain normalization and DB CHECK constraints reject malformed keys, controls and length violations. Active `(project_id,key)` uniqueness is project-scoped. Provider receipts are parsed against requested IDs and canonical values. | PASS |
| Soft-delete, restore and conflicts | Ordinary active reads hide deleted tags, while the owner can recover the same UUID/key. Retained `entity_tags` links reappear on restore; an occupied active key makes restore fail explicitly through the partial unique index. The service uses expected-revision filters and the DB trigger increments revision. Direct pgTAP and service/adapter tests cover each transition. | PASS |
| Venue-only assignment integrity | `entity_tags` has unique UUID/tuple, composite project FKs to tag and Venue, a `venue` allowlist and an active-tag lock before INSERT. Soft-delete and concurrent link cannot authorize a stale active tag. Column grants deny retargeting. Adapter receipt checks reject substituted tag, project or Venue. | PASS |
| Live authorization and isolation | Tag read uses current `project.read`, owner recovery/write uses `project.settings.update`; assignment read/write uses current `venues.read/write`. SQL tests exercise owner/editor/viewer, anon, outsider, project B, revoked and same-session downgraded identities, including cross-project tag/Venue injection and RLS-first non-Venue rejection. No new permission key or broad RPC was introduced. | PASS |
| Provider and input failure paths | The typed service validates UUIDs/revisions and returns explicit conflict/persistence errors. Adapter rejects malformed, duplicate, deleted or foreign provider rows; full new-code coverage passed the repository's 100% gate. The SQL label function now returns before any character scan when `octet_length > 320`; 80 four-byte Unicode scalars remain valid, 81 and a direct 100,000-byte call are rejected. | PASS |
| Scope, architecture and regression | No UI, offline queue, import, non-Venue target or provider credential change entered B. Domain/application/infrastructure dependencies respect the layer contract. Accepted Venue, Media and Document tests and all five ordinary exact-head CI jobs, including clean checkout, remain green. | PASS |

## Earlier finding disposition

| Finding | Fresh review result |
| --- | --- |
| WP29B-AR-001 | **CLOSED / VERIFIED.** The `plpgsql` guard checks null and UTF-8 byte size before the bounded `generate_series` scan, independent of Boolean expression evaluation order. The pgTAP direct oversized-call and 320-byte Unicode boundary cases pass in the DB/RLS job. |
| WP29B-AR-002 | **CLOSED / VERIFIED.** Under authenticated owner/editor roles, pgTAP directly attempts to rewrite tag project/key/creator/updater/revision and assignment target. Every attempt returns `42501`; key and Venue target remain unchanged. Allowed label, soft-delete/restore and link/unlink paths still pass. |

No new MINOR, MAJOR or BLOCKING finding is recorded. WP-2.9B may transition
`REVIEW_PENDING -> ACCEPTANCE_PENDING / C-ACCEPTANCE` once this review/status
head passes five exact-head ordinary CI jobs. Pass C must separately reconcile
each assigned current-Lot responsibility with implementation and verification,
including FIR #27 and explicit downstream UI/other-target scope. FTR-093 as a
whole remains `IN_PROGRESS` after this bounded packet because those later
responsibilities remain.
