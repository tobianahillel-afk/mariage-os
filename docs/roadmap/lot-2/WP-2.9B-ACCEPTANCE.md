# WP-2.9B — Pass C acceptance reconciliation

Status: **ACCEPTED / COMPLETE — Pass C gap ∅; acceptance-record CI green**.

This is the separate `EXPECTED ↔ IMPLEMENTED ↔ VERIFIED` reconciliation for
the bounded FTR-093 Lot-2 project tag dictionary and Venue assignment slice.
Entry state was `ACCEPTANCE_PENDING` after the
[fresh Pass B](WP-2.9B-FRESH-PASS-B-2026-09-29.md) closed
WP29B-AR-001/002 with no new BLOCKING, MAJOR or MINOR finding. This record
does not accept all of FTR-093, WP-2.10, Lot 2 or V1.

## Entry gates

- Accepted dependencies: WP-2.9C acceptance `21accd7` / CI `36494697647`
  and WP-2.9A acceptance `656398b` / CI `36542083037`, both 5/5.
- B READY gate `605d616589d4732e9136d249302f8a64c6c29eb0` /
  CI `36544194589` — **5/5**.
- Corrected Pass A `eeda5cbeecd4bef299347e40252496ef8451c916` /
  CI `36568868030` — **5/5**.
- Pass-B AR-001/002 remediation `bd39576c27d74482c477823e264aa54f85f8a3ed` /
  CI `36572652546` — **5/5**, including 1,439/1,439 pgTAP assertions.
- Fresh review entry `d603f8c2bd5d53c85484c27b72297c60405cf677` /
  CI `36573768984` — **5/5**.
- Fresh Pass-B/status seal `f812dc07ff855e985a7cf2993dbbb9408582154c` /
  CI `36575013966` — **5/5**, including full verification from a clean
  checkout. AR-001/002 are CLOSED / VERIFIED; unresolved findings = ∅.
- Separate Pass-C acceptance record `df0a3f057d4d06d02312c071b3a890c0b1f14b38` /
  CI [`36576346730`](https://github.com/tobianahillel-afk/mariage-os/actions/runs/36576346730)
  — **5/5**, including full verification from a clean checkout; isolated
  provider campaigns correctly skipped.
- FTR-093 FIR [#27](https://github.com/tobianahillel-afk/mariage-os/issues/27)
  records feature identity, bounded behavior, architecture, live permissions,
  test evidence, public-readiness identities and explicit downstream scope.
  The Feature Ledger correctly keeps the feature `IN_PROGRESS` because later
  presentation and other target types remain assigned elsewhere.

## EXPECTED ↔ IMPLEMENTED ↔ VERIFIED

| Assigned B responsibility | EXPECTED | IMPLEMENTED | VERIFIED | Result |
| --- | --- | --- | --- | --- |
| Project tag identity and validation | FTR-093/Physical Schema: stable project-owned UUID, immutable lowercase ASCII key, Unicode label ≤80 scalars and protected audit/revision fields | Pure domain validator; `tags` forward-only migration with key/label checks, column grants and protected update trigger; typed service and fail-closed parser | Key/label domain/parser tests; direct pgTAP malformed key/control/81-scalar rejection, 80 four-byte-scalar allowance, oversized direct-call guard and protected-field denials; core/DB CI | PASS |
| Active uniqueness and recoverable lifecycle | Active `(project_id,key)` unique; label rename, soft-delete/restore same identity; retained links hidden while deleted and restored without silent merge; conflict explicit | Partial unique active-key index, `deleted_at` and revision trigger; service/adapter change actions with expected-revision/state filters | pgTAP create/rename/delete/restore, replacement-key conflict and retained assignment reappearance; service/adapter stale/conflict/receipt tests | PASS |
| Same-project Venue assignments | Stable link UUID; exact `venue` target, existing active same-project tag and Venue; unique tuple; link/unlink without retargeting | `entity_tags` with composite tag/Venue FKs, tuple uniqueness, Venue CHECK, active-tag locking trigger, no UPDATE grant; typed link/query adapter | pgTAP cross-project tag/Venue/non-Venue/duplicate/soft-delete cases, direct retarget denial and unchanged target; adapter substituted receipt tests | PASS |
| Live authorization and project isolation | Dictionary read `project.read`, mutation `project.settings.update`; assignment read `venues.read`, mutation `venues.write`; current membership and non-disclosing denial | Explicit RLS and column grants; live permission checks in policies/trigger; no new `tags.*` permission or privileged CRUD RPC | Direct pgTAP owner/editor/viewer/anon/outsider/project-B/revoked/downgraded allow/deny and cross-project injection; security/DB CI | PASS |
| Typed trust boundary and non-regression | Invalid client input or provider data fails closed; accepted Venue/Media/Document behavior remains intact | Domain/service/port and Supabase parser/adapter; no UI/offline/storage/provider-token change | Full new-code coverage under the 100% gate, 1,439 pgTAP assertions, browser/mutation, privacy-safe preview and five ordinary jobs from exact-head clean checkout | PASS |
| Bounded current-Lot scope and handoff | Only tag definitions and Venue links in WP-2.9B; UI, other target types, offline and import/export remain later; no premature FTR completion | Migration allows exactly `venue`; no UI or offline/import code; FIR and Lot-2 matrix assign downstream work | Source-delta review, fresh Pass B and FIR #27; next WP-2.10 remains separately gated | PASS |

```text
required WP-2.9B current-Lot responsibilities
- implemented WP-2.9B responsibilities
- verified WP-2.9B responsibilities
= ∅
```

## Decision and next boundary

**Pass C verdict: PASS, gap ∅; WP-2.9B is `ACCEPTED / COMPLETE`.** The
acceptance-record HEAD passed all five ordinary CI jobs, including local
DB/RLS and full clean-checkout verification. The later FTR-093 UI,
other target types and portability responsibilities remain `IN_PROGRESS`
outside this packet. WP-2.10 is the next planned Lot-2 packet after B is
durably accepted; no Lot-2 reconciliation or integration pass is claimed here.
