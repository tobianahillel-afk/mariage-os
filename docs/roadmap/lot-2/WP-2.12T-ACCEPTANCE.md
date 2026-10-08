# WP-2.12T — Pass C acceptance reconciliation

Status: **ACCEPTED / COMPLETE — Pass C gap ∅; acceptance-record CI 5/5 green; final seal CI pending**.

This is a separate EXPECTED ↔ IMPLEMENTED ↔ VERIFIED acceptance review of
WP-2.12T's bounded atomic Venue Fact in-person source-provenance link. It
accepts only the checked-link transaction and its application/adapter contract,
not the parent WP-2.12 structured replay, queue settlement, mobile visit
workflow, local media upload or Lot 2 integration.

## Entry gates

- Parent WP-2.12 is **BLOCKED**; draft structured-reconnect PR #99 is
  preserved and not merge-approved.
- Support packets WP-2.12R and WP-2.12S are terminal **ACCEPTED / COMPLETE**.
- Activation-governance head `8b0dfb431adc2d09b5d75d0b0c8d22b3315424b9`
  / CI `37538654009` — 5/5 SUCCESS, clean checkout included.
- RED-only PR #106 `b7f3e705c46bd026b5389ec18fda660beb4ebffb`
  / CI `37539654080` proved missing atomic provenance and was closed unmerged.
- GREEN PR #107 reviewed head `f6eaa0e232252f1ff8962979097c17c3ca184ee7`
  / CI `37542674381` — 5/5 SUCCESS; 237 test files / 2,059 tests, 100%
  global coverage; clean Codex re-review and zero unresolved threads.
- GREEN canonical merge `a130fe20147fbe892455b86b5fb6ba28149ccc38`
  / CI `37543738014` — 5/5 SUCCESS including clean checkout.
- Historical Fresh Pass B reviews #109/#111 found missing direct security and
  input-validation evidence. Tests-only remediations #110/#112 closed the gaps.
- Final canonical review base `8b453d216b11e6b0bdf6297b6b68dbec669cf954`
  / CI `37551357375` — 5/5 SUCCESS, 237 files / 2,059 tests, 100% coverage.
- Complete independent Fresh Pass B v3 review-only PR #113
  `aaff9b7ea70951481c3d915449935db183312054` / CI `37552197889` —
  5/5 SUCCESS including clean checkout; Codex found no major issue and no
  unresolved review thread; PR closed without merging.
- Fresh Pass-B/status seal `ce4a55372662b1c9f207c18ea6f3611bcda34c86`
  / CI `37553218988` — **5/5 SUCCESS**, full clean checkout included.
- WP212T-AR-001..004 are CLOSED / VERIFIED; new bounded finding set is ∅.
- Primary FIR #42 / FTR-028 stays IN_PROGRESS under parent WP-2.12; this
  support packet adds no standalone product Feature.

## EXPECTED ↔ IMPLEMENTED ↔ VERIFIED

| WP-2.12T responsibility | EXPECTED | IMPLEMENTED | VERIFIED | Result |
| --- | --- | --- | --- | --- |
| Server-side atomicity | source type and revision are rechecked in the same link transaction, not trusted from an earlier client read | checked `link_venue_fact_observation_source_checked` SQL locks/reads exact scoped source before inserting/updating link | migration inspection, direct pgTAP wrong-type/stale-revision/race regressions and Fresh Pass B v3 | PASS |
| Fixed visit provenance | expected source type for visit replay is exactly `in_person_visit` | application checked-link input fixes that type; adapter forwards it | application/adapter tests, direct pgTAP valid and wrong-type branches | PASS |
| Exact expected revision | missing, zero, negative or stale expected revision may never link | SQL validates positive non-null expected revision and exact current revision inside transaction | direct pgTAP NULL/zero/negative/stale revision and post-read source edit, each zero-link assertions | PASS |
| Exact expected type | NULL/wrong expected type cannot bypass the check | checked RPC requires and validates expected type against actual scoped source | direct pgTAP NULL/wrong expected type and no-side-effect evidence | PASS |
| Required link identity | project, observation, source and primary flag are mandatory and exact | checked SQL verifies scoped Venue Fact observation/source; creates or updates link only after all guards | direct pgTAP NULL primary, same-project success, foreign observation/source and zero-link denial | PASS |
| Primary and non-primary behavior | exact primary identity is honored; successful non-primary links are legal | checked RPC preserves explicit `is_primary`; adapter requires exact receipt flag | direct non-primary pgTAP success, primary link cases, substituted receipt tests | PASS |
| Live authenticated authorization | unauthenticated, read-only, revoked or outsider actors cannot write | checked SECURITY DEFINER command verifies auth, active project membership and `venues.write` before mutation | direct pgTAP anon, viewer, revoked-member and outsider calls with zero-link assertions | PASS |
| Tenant isolation | cross-project source/observation identity fails closed without disclosure or side effects | same-project predicates for Venue Fact observation and exact source | direct foreign observation/source tests, no-write pgTAP assertions, Fresh Pass B v3 | PASS |
| Stale provenance conflict | source type/revision drift must yield conflict and never be acknowledged | checked SQL rejects drift using SQLSTATE `40001`; adapter maps conflict safely | stale type/revision and client-read-then-edit tests, adapter mapping tests | PASS |
| Typed application port | caller must supply exactly expected scoped identities and provenance revision | checked-link input is separate from the accepted general link boundary | service/port tests, exact argument adapter assertions, source delta review | PASS |
| Receipt integrity | missing/substituted project/observation/source/primary receipt is never treated as success | adapter validates full returned checked-link identity and fails closed on mismatch | missing/substituted/malformed receipt adapter tests and Fresh Pass B v3 | PASS |
| Provider error behavior | RPC/provider failure cannot be treated as acknowledged link | adapter rejects/matches conflict without silently manufacturing a link | adapter negative-path tests, security tests and review | PASS |
| Legacy compatibility | four-argument general source link stays available and unchanged for non-visit callers | separate forward-only checked RPC; accepted ordinary link remains untouched | existing general link pgTAP, migration-chain and compatibility review | PASS |
| Schema/permission limits | one forward-only checked-link migration; no new table/column/RLS policy/permission key/provider | `20261006222000_harden_venue_fact_visit_source_provenance.sql` contains only the bounded checked RPC and grants | migration/source delta review, DB/RLS and promotion CI | PASS |
| Support packet isolation | parent replay/queue/media, generic PWA, UI and product Fact/source semantics remain untouched | only SQL, Fact port, adapter and tests were changed in GREEN, later fixes tests-only | PR #107/#110/#112 diffs, Fresh Pass B v3, architecture/security gates | PASS |

## Finding reconciliation

| Finding | Pass C disposition |
| --- | --- |
| WP212T-AR-001 — revoked/viewer denial evidence | CLOSED / VERIFIED |
| WP212T-AR-002 — foreign observation isolation evidence | CLOSED / VERIFIED |
| WP212T-AR-003 — direct anon checked-RPC denial evidence | CLOSED / VERIFIED |
| WP212T-AR-004 — required provenance input evidence | CLOSED / VERIFIED |
| New Fresh Pass B v3 findings | ∅ |

## Gap calculation

```text
required bounded WP-2.12T responsibilities
- implemented WP-2.12T responsibilities
- verified WP-2.12T responsibilities
= ∅
```

## Security, migration and downstream boundary

- The checked command validates live actor authorization inside the same
  transaction as provenance identity and link mutation.
- NULL, wrong, stale and cross-project identities fail closed, with direct
  no-side-effect evidence; the client cannot substitute a pre-read.
- Existing four-argument link remains authoritative for its existing callers.
- Parent WP-2.12 must explicitly consume the accepted checked command only
  after T is terminally accepted and its own resumption gate passes.
- WP-2.12R/S replay identities remain accepted, independent responsibilities.
- Local media bytes/private upload, broader Lot-10 sync, Lot-2 integration,
  provider campaigns and real/private wedding data are out of scope.

## Pass C verdict

**PASS — EXPECTED ↔ IMPLEMENTED ↔ VERIFIED gap ∅.**

The acceptance-record HEAD `6f460afc1d12134bc12f08e51145f29b01cf6e0f` passed CI `37796626397` with all five ordinary jobs green, including `Full verify from clean checkout`. WP-2.12T is therefore **ACCEPTED / COMPLETE** under the separate final support seal, whose exact-head CI is pending. Parent WP-2.12 and draft PR #99 remain blocked until that seal and a separate parent resumption-governance gate are green.
