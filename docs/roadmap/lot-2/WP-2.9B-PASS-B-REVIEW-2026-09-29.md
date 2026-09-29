# WP-2.9B — fresh adversarial Pass B

Date: 2026-09-29

Review target: `a53bd5fcc6569fada595ad9316f10525b060de8c` /
CI [`36569916332`](https://github.com/tobianahillel-afk/mariage-os/actions/runs/36569916332)
passed **5/5 ordinary jobs**, including local DB/RLS and full verification
from a clean checkout. Pass-A implementation `eeda5cb` / CI `36568868030`
also passed 5/5. These green checks are prerequisites, not the review verdict.

## Method and decision

**FAIL — two MAJOR findings.** I reconstructed the bounded Lot-2 FTR-093
responsibility from `WP-2.9B.md`, the Feature Ledger, Physical Schema V1,
ERD/invariant 67, recoverable-tag rule, RLS permission mapping,
`AUTHZ-018..020`, `SEC-VAL-001..004/008`, `SEC-ABUSE-001`, the input-validation
contract and the three-pass protocol. I then challenged the migration, direct
pgTAP assertions, domain/service/adapter paths and exact-head CI rather than
adopting Pass A's conclusion. No new architecture or product behavior is
needed to close either finding.

| ID | Severity | Finding and evidence | Required resolution |
| --- | --- | --- | --- |
| WP29B-AR-001 | MAJOR | `project_tag_label_is_valid` is callable by authenticated clients and evaluates a per-character `generate_series(1, char_length(target_label))` without an explicit size preflight before that work. The application label is bounded to 80 scalars, but a direct REST/RPC or table input can be much longer. Boolean `AND` is not a reliable resource-limit boundary. `SEC-VAL-003` and `SEC-ABUSE-001` require bounded work at the server boundary. | Put an explicit byte/length guard before the character scan in a control flow that cannot evaluate the scan for oversized input; add a direct long-label denial test while retaining Unicode-scalar and control parity. |
| WP29B-AR-002 | MAJOR | The packet verification plan explicitly calls for direct project/audit identity mutation denial. `project_tags_venue_links_test.sql` inspects column grants but does not actually attempt direct UPDATE of tag `project_id`, `key`, `created_by`/revision or assignment target fields as an authenticated caller. Grant metadata alone does not prove the exercised API behavior. | Add pgTAP direct attempted mutations with state/SQLSTATE assertions showing protected tag identity/audit fields and assignment target cannot be rewritten; preserve allowed label/soft-delete and link/unlink behavior. |

The review also checked same-project composite FKs, active-key restore conflict,
link/soft-delete locking, live membership checks, RLS-first non-Venue rejection,
fail-closed provider parsing, optimistic revision filters, module size and
explicit downstream UI/offline/other-target exclusions. No other finding is
recorded from this review. The two findings are evidence/validation gaps within
the frozen eight-point packet, not permission to add a new public command.

WP-2.9B transitions `REVIEW_PENDING -> REVIEW_FAILED`, with
`REMEDIATION` as the next pass. On beginning remediation, transition to
`IN_PROGRESS / REMEDIATION`, fix the findings, rerun affected tests and exact-head
five-job CI, return through a separate `REVIEW_PENDING` seal and perform a fresh
Pass B. Pass C and packet acceptance are prohibited while either MAJOR finding
remains open. FTR-093 FIR #27 remains IN_PROGRESS for the Lot-2 slice and later
responsibilities.
