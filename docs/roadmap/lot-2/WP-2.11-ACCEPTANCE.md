# WP-2.11 — Pass C acceptance reconciliation

Status: **ACCEPTED / COMPLETE — Pass C gap ∅; acceptance-record CI 5/5 green**.

This is the separate `EXPECTED ↔ IMPLEMENTED ↔ VERIFIED` reconciliation for
the bounded Lot-2 Venue decision workspace. Entry state is
`ACCEPTANCE_PENDING` after the complete fresh post-remediation Pass B closed
WP211-AR-001..005 with no unresolved BLOCKING, MAJOR or MINOR finding.

This record accepts only the bounded WP-2.11 Gallery/Table/Detail/Compare and
deep-link presentation responsibility. It does not accept WP-2.12, Lot 2 as a
whole, generic PWA/sync, map/provider capability, budget/scenario calculations,
later document workflows or real/private data cutover.

## Entry gates

- Accepted dependencies: WP-2.1..WP-2.10 are **ACCEPTED / COMPLETE**.
- WP-2.11 activation base:
  `290a49a53556ffc6a91aa4467ba768eeb4c1ac00` /
  CI `36850174656` — five ordinary jobs SUCCESS including clean checkout.
- Pass-A implementation:
  PR #68 / `b249e87804ba7a6a546ea2f3db3195a0d2c4d0a1` /
  CI `37231659301` — ordinary CI green; provider-only workflows skipped.
- Historical failed Pass B:
  `docs/roadmap/lot-2/WP-2.11-FRESH-PASS-B-2026-10-04.md` /
  RED PR #70 / `416e1f33e192726d0e53c4236ccfba2efe0fde69` /
  CI `37232085163` — reproduced WP211-AR-001..005.
- Final remediation/review head:
  PR #72 / `619e17e910ed60076ce7c7e59ad4bece10d292b5` /
  CI `37238184427` — **5/5 SUCCESS**, clean checkout included; 228 test
  files / 1,920 tests at 100% statements/branches/functions/lines, DB/RLS and
  promotion PASS, browser 40/40 PASS, mutation score 83.11%.
- Merge commit `7cab3e8eaa59b3041d51de63bd32c17b3c9dd36a` has the same
  tree as the reviewed remediation head.
- Complete fresh Pass-B record:
  `docs/roadmap/lot-2/WP-2.11-FRESH-PASS-B-POST-REMEDIATION-2026-10-04.md`
  — PASS; WP211-AR-001..005 CLOSED / VERIFIED; final fresh Codex review found
  no new issue and left zero unresolved review threads.
- Fresh Pass-B/status seal:
  `344a23cc4caf215a5bcc4b3dbbfd9ae7c0f357a9` /
  CI `37239523579` — **5/5 SUCCESS**, including full verify from clean
  checkout.
- Primary FIRs: #57 / FTR-015, #58 / FTR-016, #59 / FTR-017,
  #60 / FTR-027.
- Downstream/open FIRs consumed but not owned here: #15 / FTR-024,
  #17 / FTR-089, #27 / FTR-093, #42 / FTR-028.

## EXPECTED ↔ IMPLEMENTED ↔ VERIFIED

| Assigned WP-2.11 responsibility | EXPECTED | IMPLEMENTED | VERIFIED | Result |
| --- | --- | --- | --- | --- |
| Protected project-scoped Venue routes | Collection, detail and compare remain under `/app/p/:projectId`; missing/foreign Venue identities fail non-disclosing | typed route parser/workspace loader retains explicit project and Venue identity and delegates through application/read ports | route/foreign/missing identity tests, fresh Pass B project-isolation review, browser shell authorization evidence | PASS |
| FTR-015 Gallery browsing | Gallery is default; cards show bounded decision-critical state, warning/missing summary and separate partner opinions; typed filter/sort retains project scope | Venue collection presentation/read-model composition renders Gallery cards from accepted domain/read services without UI-owned business truth | Gallery behavior/contract tests, hostile/missing data coverage, exact-head 100% unit coverage | PASS |
| FTR-016 analytical Table | controlled default columns, deterministic natural Venue-code sorting, blockers remain visible; mobile does not depend on desktop table | bounded table presentation allowlist and deterministic sorting share the collection read model; narrow/mobile presentation falls back to cards/list | table contract/sort tests, presentation coverage, mobile/browser evidence | PASS |
| FTR-017 summary-first Detail | above-fold identity/status/opinions/sync/blocker/readiness/commercial/access/missing/next-action hierarchy; grouped deeper evidence | detail route and decision presentation compose accepted Venue, criteria, commercial, access, evidence, media/document/tag and local-sync read models | detail behavior/decision-presentation tests, deep-link and non-disclosure tests, fresh Pass B | PASS |
| FTR-027 Compare 2–5 | same-project 2–5 candidates; blockers first; differences-only; no score-only winner; mobile usable without five-column matrix | compare selection normalization and presentation keep objective criteria, commercial/access/readiness and independent partner ratings distinct | compare behavior/contract tests, 2–5/invalid/duplicate scope cases, mobile presentation coverage, fresh Pass B | PASS |
| WP-2.10 local pending/conflict consumption | accepted pending/conflict/working state is visible but never reimplemented or overwritten by WP-2.11 | workspace composition reads accepted local-state markers through application/local-store boundaries; UI remains presentation-only | local workspace integration tests, bootstrap/local-store tests and adversarial review | PASS |
| Commercial selected-date truth | price/quote context uses applicable accepted offers only; unknown/provider absence does not invent quote truth or total-cost semantics | selected-date validity and weekday filtering; date-scoped offers without selected date yield unknown; explicit quote states drive next action; Compare labels base amount accurately | WP211-AR-001/004/005 RED→GREEN regressions and fresh review | PASS |
| Complete selected-date/project-wide reads | offer/availability/access batches cannot silently truncate or trust malformed provider pagination | shared deterministic bounded pagination with stable ranges, progress/repetition guard, absolute page ceiling, provider-error/shape checks and oversized-range rejection | WP211-AR-002 multi-page, ignored-range, non-terminating and 1,001-for-0..999 direct regressions; fresh review | PASS |
| Missing/readiness semantics | UNKNOWN important criteria remain distinct from missing critical; blocker/readiness truth stays application-owned | decision context counts only blocking/critical UNKNOWN as missing critical while retaining important UNKNOWN separately | WP211-AR-003 direct regression and decision-context coverage | PASS |
| Evidence/media/document/tag presentation | accepted evidence and content are drillable without cross-project leakage, auto-merge or unsafe DOM/URL behavior | UI consumes accepted services/read models and safe text/link helpers; document duplicate signal remains project-scoped/detect-only | hostile text/URL tests, project-scoped link/document/tag/media behavior tests, security/static gates | PASS |
| Responsive/accessibility/browser contract | mobile collection/compare uses bounded cards/stacked/two-at-a-time patterns and supported browsers remain functional | venue presentation includes mobile-specific collection/compare structures and semantic navigation behavior | 40/40 E2E across Chromium, Firefox, WebKit and mobile Chromium; presentation behavior tests; preview artifact | PASS |
| Architecture and packet boundary | no new persistence/RPC/RLS/provider/offline semantics, visit workflow, map engine, budget engine or real-data shortcut | UI → application/read-model layering retained; Supabase/IndexedDB remain behind accepted adapters; `/venues/:venueId/visit` stays downstream | dependency/static/dead-code/security gates, source-delta review, provider workflows skipped | PASS |

## Finding reconciliation

| Finding | Pass C disposition |
| --- | --- |
| WP211-AR-001 | CLOSED / VERIFIED |
| WP211-AR-002 | CLOSED / VERIFIED |
| WP211-AR-003 | CLOSED / VERIFIED |
| WP211-AR-004 | CLOSED / VERIFIED |
| WP211-AR-005 | CLOSED / VERIFIED |
| New fresh Pass-B findings | ∅ |

## Gap calculation

```text
required bounded WP-2.11 responsibilities
- implemented WP-2.11 responsibilities
- verified WP-2.11 responsibilities
= ∅
```

## Security / data-integrity / scope confirmation

- Existing live project authorization, RLS and provider adapters remain
  authoritative; the UI never grants access or calls Supabase directly.
- Explicit project context is preserved across collection/detail/compare links;
  foreign/missing Venue identities fail closed without tenant disclosure.
- WP-2.10 local pending/conflict state is consumed, not reimplemented.
- Score/readiness/freshness/commercial truth remains application/domain-owned.
- User/imported/external text and URLs stay behind safe rendering/link
  boundaries; no dangerous scheme is authorized.
- No new migration, RPC, RLS policy, permission key, Cloudflare/provider
  workflow, secret or real/private wedding data is required by this packet.
- `/venues/:venueId/visit`, offline visit package/checklists/measurements/local
  media capture and packet E2E completion remain WP-2.12.
- Generic cross-domain sync/PWA remains Lot 10; rendered map/routing provider
  remains Lot 9; budget/scenario calculations remain Lot 5.

## Pass C verdict

**PASS — EXPECTED ↔ IMPLEMENTED ↔ VERIFIED gap ∅.**

The exact HEAD containing this acceptance record,
`3167a380521119e9650859543778b040527332e2`, passed CI `37240178167` with
all five ordinary jobs green, including `Full verify from clean checkout`.
WP-2.11 is therefore **ACCEPTED / COMPLETE** and FTR-015/FTR-016/FTR-017/FTR-027
are accepted for this bounded workspace. WP-2.12 may undergo a separate
activation revalidation only after the final status/ledger/matrix seal itself
is exact-head green; no WP-2.12 implementation is authorized before its own
READY gate.
