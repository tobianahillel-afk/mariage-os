# WP-2.12U — Complete Fresh Pass B post-remediation — 2026-10-09

**Verdict: PASS — all WP212U-AR-001..008 CLOSED / VERIFIED; zero new bounded P0/P1/P2 findings.**

## Review identity and immutable evidence

- Packet: WP-2.12U — PostgREST-safe replay conflict signaling over accepted R/S/T.
- Activation: `2c01f8a2b8f48bd069e0382a46e940b385fea224` / CI `37807120195` 5/5 SUCCESS.
- RED-only #114 / `deb8ebd24bd5bf424b618e6e4e34832d521430bb` / CI `37808965919`, closed unmerged with intended failures.
- GREEN PR #115 reviewed exact HEAD `a4850a3535b2a98babb90837c4f873a26130515f` / CI `37850249038` (#2426) **5/5 SUCCESS**, including clean checkout.
- Fresh **complete independent** Codex adversarial review requested in #115 comment `6069977532` assessed **that same head** and replied **“Didn't find any major issues”** in #115 comment `6070005329`, with no new inline finding. Eight prior review threads were then resolved.
- Canonical PR #115 squash `45f28bbfa77ec1bf66e344a5d3cf3b1fecb95626` has the IDENTICAL Git tree `ebb5a29b59da9969bb49a44068450ccce0d60b53`; ordinary canonical CI `37852529610` (#2427) **5/5 SUCCESS**, clean checkout included.
- Unit evidence: 237 files / 2,063 tests PASS, 100% global statements/branches/functions/lines; DB/RLS/promotion PASS; browser 40/40 PASS; mutation 83.78%; privacy-safe preview PASS.
- Optional redundant review-only PR #116 was closed **unmerged** after Codex quota refused a second review. It is NOT cited as a successful independent verdict. The clean independent review on #115 plus identical canonical tree is the basis for this Pass B.
- No provider campaign, production wedding data, external deployment or parent #99 implementation was included.

## Independent contract / evidence matrix

| Expected bounded invariant | Implemented | Verified evidence | Verdict |
| --- | --- | --- | --- |
| Business conflicts must not pretend to be PostgreSQL serialization errors | Explicit business/precondition `40001` replaced with `PT412` (HTTP 412) in one forward-only migration | Direct pgTAP and reviewed migration | PASS |
| Four function bodies / three existing RPC families | Fact observation replay core; 5- and 7-argument member rating; checked provenance link | Previous callable signatures and migration-chain tests retained | PASS |
| Legacy rating compatibility | Still-granted 5-argument overload now emits `PT412` on existing-row and missing-row stale preconditions | Direct stale-success/denial and post-state pgTAP regression | PASS |
| Receipt-aware rating retry and conflict | 7-argument operation/device receipt identities and correct conflict denials preserved | Direct acknowledged conflict and stale revision `PT412` with post-call rating/revision/receipt assertions | PASS |
| Fact supersession stale/missing conditions | Missing or non-active superseded observation rejected without unauthorized mutation | Direct `PT412`, row/receipt invariants and accepted replay tests | PASS |
| Provenance atomicity | Stale type/revision `in_person_visit` source rejected inside checked-link transaction | Direct pgTAP stale/missing/wrong-source denial + zero link; T accepted tests retained | PASS |
| Genuine database/provider `40001` | No native PG serialization rewrite; adapter maps genuine 40001 as typed conflict | Fact/Rating adapter tests | PASS |
| Fact adapter semantics | `PT412` classified as existing typed `conflict`, not success/retryable | Fact error mapping regression | PASS |
| Rating adapter/service semantics | `PT412` and native `40001` remain typed conflict through `saveVenueMemberRating` | Adapter/service test plus parent coordinator conflict-state behavior | PASS |
| No receipt/row/link side effects on conflict | Failed operations do not settle local work or change new rating / original receipt / link | Updated pgTAP after-call postconditions for acknowledged and stale rating cases | PASS |
| Authorization and tenant isolation | Existing live member role, per-project identities, RLS and grants retained | Direct DB/RLS allow/deny and migration review | PASS |
| No unintended scope expansion | One bounded migration family plus error maps and tests; no new table/RLS/UI/provider/Storage/parent work | PR #115 changed-file review, architectural/static gates | PASS |
| Durable governance | U packet, status board and Lot-2 matrix jointly reflect historical AR-006/007/008 review gate; current clean result supersedes it | Final #115 exact-head Codex review and this canonical result record | PASS |

## Historical remediation disposition

| Finding | Final result |
| --- | --- |
| AR-001 typed rating conflict through application service | CLOSED / VERIFIED |
| AR-002 stale READY/PLAN packet handoff | CLOSED / VERIFIED |
| AR-003 missing converted PT412 direct branch coverage | CLOSED / VERIFIED |
| AR-004 canonical status + matrix contradiction | CLOSED / VERIFIED |
| AR-005 acknowledged-rating unchanged postconditions | CLOSED / VERIFIED |
| AR-006 retained legacy overload's two custom 40001 branches | CLOSED / VERIFIED |
| AR-007 packet/status/matrix exact review-gate synchronization | CLOSED / VERIFIED |
| AR-008 post-seven-argument-stale-call rating=8, revision=2, no new receipt | CLOSED / VERIFIED |
| New findings from final independent #115 review | ∅ |

No unresolved bounded BLOCKING/P0, MAJOR/P1 or MINOR/P2 finding remains in the exact tree reviewed and merged.

## Verdict and non-bypassable next step

**Fresh Pass B: PASS.** Transition:
`REVIEW_FAILED / REMEDIATION → ACCEPTANCE_PENDING / C-ACCEPTANCE`.

This record does NOT accept WP-2.12U, does NOT reopen parent WP-2.12,
does NOT permit merge of draft PR #99, and does NOT accept Lot 2. Complete a
separate Pass C `EXPECTED ↔ IMPLEMENTED ↔ VERIFIED` reconciliation, prove
its record through exact-head 5/5 CI including clean checkout, then a
separate final U support `ACCEPTED / COMPLETE` seal (also exact-head green).
Only then may parent WP-2.12 undergo its own resumption-governance gate.
