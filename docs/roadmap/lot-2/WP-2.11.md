# WP-2.11 — Venue decision workspace presentation

## Identity

- Work Packet ID: `WP-2.11`
- Lot: 2 — Venues core
- Name: Venue Gallery / Table / Detail / Compare / deep-link workspace
- State: `READY` — activation governance HEAD must pass exact-head CI before Pass A starts
- Current pass: `PLAN` (next: `A-IMPLEMENT / RED first`)
- Branch: `lot-2/venues-core`
- Activation base: `290a49a53556ffc6a91aa4467ba768eeb4c1ac00`
- Activation-base CI: `36850174656` — **5/5 SUCCESS**, including full verify from clean checkout; provider-only workflows skipped
- Primary FIRs: #57 / FTR-015, #58 / FTR-016, #59 / FTR-017, #60 / FTR-027
- Downstream/open FIRs consumed for presentation only: #15 / FTR-024, #17 / FTR-089, #27 / FTR-093, #42 / FTR-028

## Purpose

Turn the accepted Venue domain/read models into the first complete decision-oriented
Venue workspace without reopening persistence, authorization or sync semantics.

The user must be able to:

1. browse Venue candidates visually;
2. switch to a controlled analytical table;
3. open a canonical summary-first Venue detail deep link;
4. compare 2–5 practical candidates with blockers before scores;
5. see local pending/conflict state from accepted WP-2.10;
6. drill to accepted evidence/media/document/tag/commercial/access information
   without duplicating domain truth.

## Primary Feature IDs

- `FTR-015` — Venue gallery browsing;
- `FTR-016` — Venue analytical table with controlled columns;
- `FTR-017` — Venue detail summary-first workspace;
- `FTR-027` — Venue comparison 2–5 candidates/differences.

Presentation also consumes already-accepted Lot-2 responsibilities from
FTR-013/014/018/021/022/023/024/025/026/028/089/093. Consumption does not
transfer ownership or mark those cross-packet/cross-lot Features complete.

## Frozen route / UX contract

### `/venues`

Within the protected project route `/app/p/:projectId/venues`:

- mode switch: Gallery / Table / Compare;
- Gallery is the default visual discovery/shortlist mode;
- search/filter/sort use typed project-scoped read models;
- cards show one status, 4–7 high-value facts, one warning/missing summary,
  and partner ratings separately from objective compatibility;
- Table uses a controlled default-column allowlist, never every criterion;
- mobile collection uses cards/list rather than a compressed desktop table.

### `/venues/:venueId`

Canonical protected deep link:
`/app/p/:projectId/venues/:venueId`.

Above the fold must prioritize:

- identity/location/status;
- independent partner rating/favorite summary;
- sync/pending/conflict state;
- blocker result before weighted score;
- readiness/missing critical information;
- price/availability/access context where accepted data exists;
- strengths/reservations and the next useful action.

Sections remain grouped according to the frozen screen contract rather than a
12-tab horizontal strip. Evidence/source/confidence metadata is available on
demand and is not allowed to flood the default view.

### `/venues/compare`

Canonical protected comparison route:
`/app/p/:projectId/venues/compare`.

- 2–5 same-project candidates;
- blocking criteria first;
- capacity/configuration, price, access, availability, inclusions/logistics,
  evidence readiness and independent partner ratings remain distinguishable;
- `Only differences` is supported;
- no score-only automatic winner;
- mobile compares two at a time or uses stacked criterion cards;
- detail/source drill-down retains canonical project/Venue context.

## Explicitly out of scope

- `/venues/:venueId/visit` implementation — WP-2.12;
- offline visit package/checklists/measurements/local media capture — WP-2.12;
- new Venue persistence, migration, RPC, RLS policy or permission key;
- generic cross-domain sync/PWA engine — Lot 10;
- rendered map/routing-provider capability — Lot 9;
- full Tasks/Decision workflow — Lot 3;
- Budget/scenario engine — Lot 5;
- document versions/contract-readiness — later assigned packets/lots;
- non-Venue generic tag targets — later owning packets/lots;
- real/private wedding-data import/cutover — Lot 12;
- any new Cloudflare/provider workflow or secret.

## Dependency / architecture revalidation

All persistence/read-model dependencies required for this presentation packet are
already accepted through WP-2.10.

The production implementation must preserve:

- UI → application/read-model boundary; UI must not call Supabase or IndexedDB directly;
- domain/application independence from DOM/provider infrastructure;
- live project authorization through existing provider adapters/RLS;
- explicit project ID in route/service/local context;
- WP-2.10 local cache/pending/conflict semantics as authoritative local state;
- no duplicated score/readiness/freshness/business calculation in UI;
- safe text rendering for user/imported/external content;
- standards-aware handling of external URLs and no dangerous schemes;
- fail-closed unknown/missing/foreign Venue identity.

Expected code ownership:

- `src/ui/venues/` — presentation/rendering and view-local interaction state;
- `src/application/venues/` — bounded workspace/read-model composition only
  where existing accepted services are not already sufficient;
- `src/app/bootstrap/` — composition wiring;
- existing `src/infrastructure/supabase/` and IndexedDB adapters are consumed,
  not bypassed;
- `render-shell.ts` delegates to Venue UI rather than accumulating domain-specific
  rendering/business logic.

## Sizing review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| new/changed bounded domain | 0 | 3 | 0 |
| persistent entity/table | 0 | 1 | 0 |
| migration family | 0 | 1 | 0 |
| RPC/public endpoint/capability command | 0 | 2 | 0 |
| RLS/privileged authorization boundary | 0 | 2 | 0 |
| major UI route/workflow | 4 (Gallery, Table, Detail, Compare) | 1 | 4 |
| public/unauthenticated capability surface | 0 | 2 | 0 |
| external provider integration | 0 | 3 | 0 |
| new offline/sync semantics | 0 | 2 | 0 |
| security-sensitive token/crypto boundary | 0 | 2 | 0 |
| financial/calculation critical engine | 0 | 3 | 0 |
| backup/import/version migration semantics | 0 | 2 | 0 |
| **Total** |  |  | **4** |

Cohesion: **PASS**. The four workflows are one Venue decision workspace over
the same accepted read models and canonical route hierarchy. No split is
required before Pass A.

## RED-first gate

Pass A must begin with isolated failing evidence proving that the current
generic project shell does not yet satisfy the frozen UI contract.

Required RED classes:

1. protected `/venues` renders a real Gallery workspace instead of the generic placeholder;
2. Gallery/Table switch preserves project context and controlled data hierarchy;
3. Table default columns are bounded and natural Venue-code sorting is deterministic;
4. mobile collection does not depend on the desktop table;
5. `/venues/:venueId` deep link resolves the correct same-project Venue and
   missing/foreign IDs fail non-disclosing;
6. detail keeps blockers visible regardless of score and keeps partner ratings independent;
7. detail surfaces WP-2.10 pending/conflict state without mutating/overwriting local working state;
8. Compare accepts only 2–5 project-scoped candidates, orders blockers first,
   supports differences-only and never declares a score-only winner;
9. mobile Compare avoids a five-column matrix;
10. source/detail links retain canonical project/Venue context;
11. Document duplicate signal is project-scoped/detect-only with no automatic merge;
12. tag/media/document presentation uses accepted services and safe DOM/URL rendering;
13. `/venues/:venueId/visit` remains a downstream route/link and is not
    implemented by this packet.

RED evidence should use a closed, non-merged staging branch/PR where practical,
as done for earlier packet findings. No production implementation is permitted
until the activation-governance HEAD itself is exact-head green.

## Planned Pass A evidence

- pure/read-model tests for Gallery card/table/detail/compare composition;
- deterministic sort/filter/compare property tests where applicable;
- DOM rendering tests with hostile text/URL inputs and safe text-only behavior;
- project/foreign/missing identity route tests;
- WP-2.10 cached/pending/conflict presentation integration tests;
- browser E2E on Chromium/Firefox/WebKit plus mobile Chromium;
- keyboard/focus/semantic accessibility checks;
- desktop/mobile synthetic visual evidence from privacy-safe fixtures;
- full coverage/static architecture/complexity/dead-code gates;
- exact-head ordinary CI + full verify from clean checkout.

No database migration/provider campaign is expected in this packet.

## Pass A exit

- [ ] activation-governance HEAD passed five ordinary jobs including clean checkout
- [ ] intended vertical slice exists for Gallery/Table/Detail/Compare
- [ ] all required REDs turned green for the intended reason
- [ ] no UI-owned duplicate business truth/provider access
- [ ] responsive/accessibility/browser evidence green
- [ ] no untracked TODO/FIXME/HACK/TEMP
- [ ] packet moves to `REVIEW_PENDING / B-ADVERSARIAL-REVIEW`

## Handoff

- Current state: READY, **activation exact-head CI pending**
- Current/next pass: PLAN → A-IMPLEMENT / RED first
- Last accepted dependency: WP-2.10 final seal `290a49a53556ffc6a91aa4467ba768eeb4c1ac00` / CI `36850174656` — 5/5
- Open packet findings: ∅
- Next permitted action: pass this activation-governance HEAD through all five
  ordinary CI jobs including clean checkout; only then create RED-only evidence
  and begin Pass A implementation.
