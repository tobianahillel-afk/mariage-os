# WP-2.11 — Fresh Pass B adversarial review after remediation — 2026-10-04

Status: **PASS — ACCEPTANCE_PENDING / C-ACCEPTANCE**

## Review identity

- Packet: `WP-2.11` — Venue Gallery / Table / Detail / Compare / deep-link workspace
- Review target: `619e17e910ed60076ce7c7e59ad4bece10d292b5`
- Exact-head CI: `37238184427` / run 2076 — **5/5 ordinary jobs SUCCESS**, including full verification from a clean checkout
- Merged remediation: PR #72 → merge commit `7cab3e8eaa59b3041d51de63bd32c17b3c9dd36a`
- Reviewed-head tree = merge-commit tree: `a12533b421a8c91270128946fdd38bd7d5d19f41`
- Pass-A implementation: PR #68 / `b249e87804ba7a6a546ea2f3db3195a0d2c4d0a1` / CI `37231659301`
- Historical failed Pass B: `WP-2.11-FRESH-PASS-B-2026-10-04.md`
- Historical RED evidence: PR #70 / `416e1f33e192726d0e53c4236ccfba2efe0fde69` / CI `37232085163`
- Review type: complete fresh independent adversarial Pass B after bounded remediation
- Final independent review: Codex fresh review request on current head returned 👍, with **0 unresolved review threads**
- Verdict: **PASS — no unresolved BLOCKING, MAJOR or MINOR finding**

## Independent contract reconstruction

This review did not inherit the Pass-A or remediation verdict. It re-read and
challenged:

- `docs/roadmap/lot-2/WP-2.11.md`;
- `docs/roadmap/LOT-ACCEPTANCE.md`;
- `docs/engineering/DEFINITION-OF-DONE.md`;
- accepted WP-2.10 local cache/pending/conflict boundaries;
- current Venue workspace route/read-model/presentation code;
- Supabase offer, selected-date availability and access-route batch readers;
- Gallery/Table/Detail/Compare behavior and contract tests;
- the failed Pass-B evidence and every bounded remediation regression.

The review specifically challenged project isolation, canonical deep links,
blockers-before-score ordering, independent partner opinions, pending/conflict
presentation, selected-date commercial applicability, no-date uncertainty,
unknown-vs-missing semantics, deterministic complete reads, malformed provider
pagination, safe rendering, 2–5 candidate Compare behavior, mobile fallbacks and
the WP-2.12 boundary.

## Exact-head verification evidence

CI `37238184427` on `619e17e9...` reports:

- Core quality and security: **SUCCESS**;
- **228/228** unit/coverage files and **1,920/1,920 tests PASS**;
- statements / branches / functions / lines: **100% / 100% / 100% / 100%**;
- typecheck, Prettier, ESLint, architecture, dead-code, quality-negative,
  security-negative, dependency audit and build: PASS;
- Local Supabase DB/RLS + Pages Function: **SUCCESS**;
- promotion regression suite: **SUCCESS**;
- Browser: **40/40 E2E PASS** across Chromium, Firefox, WebKit and mobile Chromium;
- mutation testing: **83.11%**, above the configured break threshold;
- privacy-safe preview artifact: **SUCCESS**;
- Full verify from clean checkout: **SUCCESS**.

No production/private wedding data, schema migration, provider campaign or
credential mutation was used.

## Review matrix

| Responsibility / attack | Fresh adversarial conclusion | Verdict |
| --- | --- | --- |
| Protected project routing / deep links | Venue collection/detail/compare stay under explicit project context; missing/foreign Venue identity fails without leaking another project. | PASS |
| Gallery / Table | Gallery remains the visual default; Table uses bounded controlled columns and deterministic presentation instead of exposing every criterion. | PASS |
| Detail hierarchy | Identity, sync state, blockers/readiness and decision context are composed through application read models; presentation does not re-own persistence truth. | PASS |
| Compare 2–5 | Candidate count/scope are bounded, blockers precede score, differences-only is supported and no score-only automatic winner is introduced. | PASS |
| Partner opinions | Partner rating/favorite presentation remains separate from objective compatibility/readiness. | PASS |
| WP211-AR-001 — selected-date commercial truth | Offers are filtered by inclusive validity bounds and frozen weekday semantics. Invalid dates fail closed; a date-scoped offer without a selected event date yields unknown commercial context rather than false “no quote”. | **CLOSED / VERIFIED** |
| WP211-AR-002 — complete project-wide reads | Shared Supabase pagination uses deterministic ranges, bounded page count, repeated-full-page progress detection, provider-error/shape validation and rejects a page larger than its requested inclusive range. Multi-page, repeated-page, non-terminating and 1,001-for-0..999 regressions are direct. | **CLOSED / VERIFIED** |
| WP211-AR-003 — missing-critical semantics | Only UNKNOWN blocking/critical evaluations count as missing critical; UNKNOWN important criteria remain separately represented. | **CLOSED / VERIFIED** |
| WP211-AR-004 — absent commercial context | Provider/unknown commercial absence stays unknown and does not invent “obtain quote”; quote actions require explicit none/draft state. | **CLOSED / VERIFIED** |
| WP211-AR-005 — base amount semantics | Compare labels the accepted commercial value “Montant de base”; no total-cost/scenario engine is invented. | **CLOSED / VERIFIED** |
| Availability / access fail-soft | Source failure does not synthesize provider truth; accepted availability/access context is shown only when loaded and applicable. | PASS |
| WP-2.10 local state | Pending/conflict state is consumed as authoritative local state; WP-2.11 adds no new offline/sync mutation semantics. | PASS |
| Safe rendering | Imported/external text remains text-rendered; external URL handling stays bounded and no provider bypass is introduced. | PASS |
| Mobile behavior | Collection/Compare retain mobile-specific fallback behavior rather than compressing desktop matrices into unusable layouts. | PASS |
| Packet scope | No visit workflow, new schema/RPC/RLS, provider integration, generic sync engine, map capability or downstream lot implementation entered WP-2.11. | PASS |

## Remediation-review follow-up probes

The remediation was not accepted after the first green run.

1. Fresh review on the initial remediation found that date-scoped quotes could
   be mislabeled as “Aucun devis” before date selection and that a provider
   ignoring range requests could keep pagination alive indefinitely.
   Both paths were corrected and directly regression-tested.
2. A second fresh review on `3855f6faa9...` found that a malformed provider
   could return **1,001 rows for requested range 0..999** and still be trusted.
   The helper now rejects any page larger than `to - from + 1`; a direct test
   proves first-page fail-closed behavior.
3. The final exact head `619e17e9...` then passed all five ordinary jobs and a
   fresh Codex review returned 👍 with no new thread.

These follow-ups strengthen the closure of AR-001 and AR-002; they do not widen
the packet boundary.

## Finding disposition

| Finding | Fresh Pass-B disposition |
| --- | --- |
| WP211-AR-001 | **CLOSED / VERIFIED** — selected-date applicability and no-date uncertainty are explicit and fail-soft. |
| WP211-AR-002 | **CLOSED / VERIFIED** — project-wide reads are deterministic, complete within the bounded contract and fail closed on malformed/ignored/oversized provider pages. |
| WP211-AR-003 | **CLOSED / VERIFIED** — important UNKNOWN remains distinct from missing critical. |
| WP211-AR-004 | **CLOSED / VERIFIED** — absent provider context no longer invents quote truth/action. |
| WP211-AR-005 | **CLOSED / VERIFIED** — Compare exposes the value as base amount, not total price. |

No new MINOR, MAJOR or BLOCKING finding remains open.

## Downstream boundaries rechecked

- `/venues/:venueId/visit` and mobile/offline visit-package/checklist/media behavior remain WP-2.12.
- Map/routing-provider capability remains Lot 9.
- Generic cross-domain sync/PWA semantics remain Lot 10.
- Budget/scenario total-cost behavior remains outside this packet.
- No database migration or provider campaign is needed or authorized for WP-2.11 Pass C.

## Verdict and transition

Fresh Pass B verdict: **PASS**.

```text
REVIEW_FAILED / REMEDIATION
-> ACCEPTANCE_PENDING / C-ACCEPTANCE
```

All historical WP211-AR-001..005 findings are CLOSED / VERIFIED and the final
fresh independent review found no new issue. Pass C must now independently
reconcile every bounded WP-2.11 responsibility as
EXPECTED ↔ IMPLEMENTED ↔ VERIFIED and confirm gap ∅.

WP-2.12 remains blocked until the separate WP-2.11 Pass-C acceptance record
itself passes exact-head ordinary CI including clean checkout.
