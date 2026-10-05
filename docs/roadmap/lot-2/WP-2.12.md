# WP-2.12 — Mobile/offline Venue visit and Lot-2 exit workflow

## Identity

- Work Packet ID: `WP-2.12`
- Lot: 2 — Venues core
- Name: mobile/offline Venue visit, offline package, local visit media and packet E2E completion
- State: `BLOCKED`
- Current pass: `A-IMPLEMENT PAUSED` — tranches 1–3 remain GREEN; dependency WP-2.12R
- Branch: `lot-2/venues-core`
- Activation base: `0a2d051d3f0a45b638f5c1b5f8c81acf36491c36`
- Activation-base CI: `37240817336` — **5/5 SUCCESS**, including full verify from clean checkout; provider-only workflows skipped
- Primary FIR: #42 / FTR-028
- Primary contracts: UF-08, PWA-003/004/006, FTR-028, `docs/architecture/OFFLINE.md`, `LOCAL-DATA-SCHEMA.md`, `SCREEN-CONTRACTS.md`
- Accepted dependencies consumed: WP-2.1..WP-2.11, especially WP-2.10 local durability and WP-2.8B/C + WP-2.9C media safety

## Purpose

Complete the Lot-2 Venue workflow with the frozen mobile-first
`/app/p/:projectId/venues/:venueId/visit` experience.

The user must be able to:

1. mark a Venue `Available offline` before a visit;
2. prepare a bounded local visit package from already-authorized Venue data;
3. open that package on a phone with weak/no network;
4. capture visit notes, measurements/fact observations, personal ratings and a local photo without false cloud confirmation;
5. close/reopen the app and retain local pending work;
6. reconnect/re-authenticate and replay safe structured changes while isolating conflicts;
7. upload local media separately from structured mutations;
8. finish with a truthful local visit summary showing what is synced, pending, conflicted or failed.

WP-2.12 also supplies the synthetic complex Venue exit fixture/integrated workflow
evidence required before the separate Lot-2 reconciliation and Integration Pass.

## Frozen user-flow contract

### Prepare offline

From canonical Venue Detail, `Préparer la visite` opens
`/app/p/:projectId/venues/:venueId/visit`.

`Available offline` must not claim success until durable local storage contains
a valid visit package. The package includes currently available/authorized
Lot-2 data needed for the visit:

- Venue identity/location/status;
- relevant spaces/capacities;
- criteria/checklist inputs, blockers and missing/unknown/conflicting prompts;
- selected facts/source summaries;
- contact/access summary;
- selected media thumbnail/reference metadata according to policy;
- local package metadata, prepared-at timestamp and media policy.

Tasks/Decision context is extension-ready but is not invented here because full
Tasks/Decision behavior belongs to Lot 3.

### Visit offline

The visit route is mobile-first and suppresses unrelated navigation clutter.

It supports:

- generated questions/checklist;
- free-form visit note;
- measurement / fact observation capture;
- independent personal rating;
- local image capture/file selection;
- clear local durability and sync status;
- finish-visit summary.

Unsupported camera APIs must fall back to ordinary file selection; unsupported
IndexedDB/local durability must fail closed and must not display “saved offline”.

### Restart and reconnect

After process/app restart:

- the visit package is still readable;
- structured unsynced visit work remains durable/pending;
- unsynced local binary bytes remain recoverable and are not silently evicted;
- project/user/device scope is revalidated;
- explicit logout/purge safety counts unsynced binaries as pending local work.

On reconnect/re-authentication:

- structured operations replay through accepted application/service boundaries;
- fact measurements/observations retain visit provenance (`in_person_visit`) where applicable;
- visit notes use the accepted Venue interaction/history boundary rather than a new notes table;
- personal ratings use the accepted member-opinion boundary;
- local photos use the accepted private-media validation/lifecycle/storage boundary;
- semantic conflicts remain isolated/pending rather than last-write-wins;
- binary upload proceeds separately so a large/failed photo cannot block critical structured visit mutations.

## Local schema plan

WP-2.12 may evolve the browser-local IndexedDB schema from v1 to v2.

New local persistent stores:

1. `offline_pins`
   - entity type/id;
   - project/user/device scope;
   - reason (`manual`, `upcoming_visit`, `favorite`, `recent`);
   - prepared/updated timestamps;
   - desired media policy;
   - package revision/version metadata.

2. `local_binaries`
   - stable local binary ID;
   - project/user/device + Venue scope;
   - related local media/operation IDs;
   - filename/MIME/size and exact local bytes;
   - created/last-accessed timestamp;
   - pin/unsynced state;
   - optional hash/version once known.

The accepted `cached_records` store remains the home of the JSON visit package
and local visit draft snapshots. The accepted `pending_mutations` store remains
the durable queue for structured operations.

The v1 → v2 migration must preserve all existing cached Venue records, pending
mutations and metadata. “Clear the database” is not an acceptable migration
repair while unsynced work may exist.

## Application / replay plan

Expected bounded modules:

- `src/application/venues/venue-visit-package.ts` — typed package/pin composition and validation;
- `src/application/venues/venue-visit-local-coordinator.ts` — local-first capture/replay orchestration;
- `src/application/venues/venue-visit-local-mutation.ts` — strict persisted mutation parsing/replay dispatch;
- `src/application/local-data/` — pin/binary value contracts and LocalProjectStore ports;
- `src/infrastructure/indexeddb/` — v2 stores/migration and atomic local operations;
- `src/ui/venues/render-venue-visit.ts` — focused mobile visit presentation;
- existing bootstrap/runtime wiring only as required to inject accepted ports.

No UI module may call Supabase, Storage or IndexedDB directly.

## Server / provider boundary

No new server persistence family is planned.

WP-2.12 reuses:

- accepted Venue read/cache state;
- Venue Facts/Evidence services for measurement/observation truth;
- Venue Interaction service for visit-note history;
- Venue Member Opinion service for personal ratings;
- accepted private Media service for image validation, hashing, Storage lifecycle and Venue linking.

Implementation re-review discovered exactly this condition: the accepted
`append_venue_fact_observation` command generates observation IDs server-side,
so a lost successful response can be retried as a duplicate measurement.
The parent packet therefore stops here. Replay identity hardening is extracted
to support packet `WP-2.12R`; no parent replay implementation resumes until
that packet is accepted.

## Explicitly out of scope

- generic cross-domain sync queue/replay — Lot 10;
- service-worker install/update/version UX — Lot 10;
- generic offline eviction policy outside the bounded Venue visit package — Lot 10;
- Tasks/Decision creation/finalization — Lot 3;
- Budget/scenario engine — Lot 5;
- rendered map/routing-provider capability or offline maps — Lot 9;
- new PostgreSQL table/migration/RPC/RLS/permission key;
- new Cloudflare/provider workflow, secret or telemetry campaign;
- real/private wedding data import/cutover — Lot 12;
- full document version/contract-readiness workflow.

## Complexity / cohesion review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| new/meaningfully changed bounded workflow/domain | 1 Venue Visit local-first workflow | 3 | 3 |
| new persistent entity/store | 2 local IndexedDB stores | 1 | 2 |
| migration family | 1 IndexedDB v1→v2 | 1 | 1 |
| RPC/public endpoint/capability command | 0 | 2 | 0 |
| RLS/privileged authorization boundary | 0 | 2 | 0 |
| major UI route/workflow | 1 | 1 | 1 |
| public/unauthenticated capability surface | 0 | 2 | 0 |
| external provider integration | 0 new | 3 | 0 |
| new/changed offline/sync semantics | 1 bounded Venue Visit slice | 2 | 2 |
| security-sensitive token/crypto boundary | 0 | 2 | 0 |
| financial/calculation critical engine | 0 | 3 | 0 |
| backup/import/version migration semantics | 0 | 2 | 0 |
| **Original WP-2.12 total** |  |  | **9** |

Cohesion review at activation: **PASS** for the original 9-point plan.

Later implementation re-review invalidated one planning assumption: the existing
Facts/Evidence command is not replay-idempotent. Adding one SQL migration family
(+1) and one meaningfully changed RPC (+2) inside this parent would raise it to
**12 points**. The orchestration hard rule for >10 therefore requires a split.
This is not a product-scope expansion: `WP-2.12R` owns only reusable
fact-observation replay identity hardening, after which the original Venue Visit
workflow resumes.

## RED-first gate

Pass A must begin with isolated failing evidence proving the current accepted
branch does **not** yet satisfy the WP-2.12 contract.

Required RED classes:

1. `/venues/:venueId/visit` currently parses/renders unavailable instead of a visit workspace;
2. `Available offline` cannot yet durably create/read a scoped visit pin/package;
3. IndexedDB v1 has no `offline_pins` store;
4. IndexedDB v1 has no unsynced local-binary store;
5. v1 → v2 upgrade must preserve existing metadata/cache/pending mutations;
6. package/pin from another project/user/device fails closed;
7. failed/blocked local durability cannot be mislabeled “available offline”;
8. offline note/measurement/rating capture must persist before any network attempt;
9. current Venue replay parser cannot replay visit-specific structured mutations;
10. process/store reopen retains visit package, draft and queued structured work;
11. unsynced local photo survives reopen and ordinary cache cleanup/eviction paths;
12. explicit logout/purge cannot silently discard an unsynced local photo without the existing pending-work decision path;
13. reconnect replays critical structured visit work independently from media upload;
14. invalid/malformed persisted visit mutation/binary metadata fails closed;
15. unsupported camera capability has a file-selection fallback;
16. mobile visit presentation exposes checklist/capture/summary without desktop-table dependence;
17. synthetic end-to-end fixture proves prepare online → lose network → capture → restart → reconnect/re-auth → structured sync + separate media sync/conflict state.

Use a closed, non-merged RED branch/PR where practical. No production
implementation is permitted until the activation-governance HEAD itself is
exact-head green.

## Planned Pass A evidence

- direct LocalProjectStore/IndexedDB v2 migration tests;
- property/adversarial tests for project/user/device scope and malformed persisted values;
- restart/reopen durability tests for package, structured queue and local bytes;
- purge/logout safety tests including unsynced binary work;
- application coordinator tests for note/measurement/rating/photo separation;
- existing Facts/Interaction/Opinion/Media ports mocked at application boundary;
- route/parser and mobile DOM behavior tests;
- browser E2E on Chromium/Firefox/WebKit plus mobile Chromium;
- privacy-safe synthetic visual evidence only;
- synthetic complex Venue offline visit exit fixture;
- full coverage/static/security/dead-code/mutation gates;
- exact-head ordinary CI + full verify from clean checkout.

No provider campaign, production data or server migration is expected.

## Pass A progress — 2026-10-05

Activation READY gate:
- `99cf3b68f91b616b8aca9a218d3fb6ea62b493d9` / CI `37241583422` — **5/5 SUCCESS**, including clean checkout.

Completed RED→GREEN tranches:

1. **Visit route + local schema v2 / local-binary logout safety**
   - RED #73 / `8e8f9c1f36b9465630d1f60dff60a5fab0e14061` / CI `37242212073` — intended failures only.
   - GREEN #74 / `fa3495a8b059d8a14b7e678be9d29087057761a1` / CI `37245441506` — 5/5, 1,949 tests, 100% coverage.
   - canonical merge `bca9bd27ba7b47e011248480efad703f51de8ebf` / CI `37245983552` — 5/5.
2. **Offline pin + cached visit-package durability**
   - RED #76 closed unmerged at `ae83bcd4f654ada4813e03df3472b42a2d0f144f`.
   - GREEN #78 / `9fe3545e8354288b4a514278038d59c873ff8bd3` / CI `37248870611`; canonical `853ef01f480b7c28d4f8b3a2b53ccfe2bcb85259` / CI `37249343123` — 5/5.
   - sync-summary remediation #77 canonical `2a4bca34529a896016b6298eada0892e9196fb24` / CI `37248133866` — 5/5.
3. **Durable scoped Venue visit drafts**
   - RED #79 / `082979532a4df4e7669ab519e220a7673740b8dc` / CI `37252892728` — exactly five intended failures with existing surfaces green.
   - GREEN #80 / `b5076b335f62ae92df1e660ced1b8d59d81d4840` / CI `37280176962` — review findings for draft-only logout, stale/equal-revision atomicity and unsafe revisions remediated; zero unresolved threads.
   - canonical merge `1794a3d9d564769437a22582b918f793e57cf150` / CI `37280907551` — **5/5 SUCCESS**, clean checkout included.

Already GREEN:
- canonical protected visit route + explicit visit state/shell;
- IndexedDB v2 migration preserving accepted v1 metadata/cache/pending work;
- scoped `offline_pins`, durable cached visit package and fail-closed isolation;
- validated local-binary metadata + unsynced-binary logout safety;
- durable scoped visit draft for questions, notes, measurements and personal-rating intent;
- stale draft replacement rejection and idempotent equal-revision retry;
- pending visit draft participates in safe-logout sync counters.

Still required before Pass A exit:
- structured reconnect/replay through accepted Interaction / Facts-Evidence / Member Opinion boundaries;
- local binary **bytes** durability and separate private-media upload lifecycle;
- media failure isolation from structured replay;
- complete mobile checklist/capture/rating/photo/summary UI and unsupported-camera file fallback;
- restart/re-auth reconnect integration and synthetic complex Venue exit E2E;
- final exact-head 5/5 gate and fresh Pass B.

## Pass A exit

- [x] activation-governance HEAD passed five ordinary jobs including clean checkout
- [x] RED evidence exists and failed for the intended missing-contract reasons
- [x] IndexedDB v2 migration preserves accepted v1 local work
- [x] scoped offline package/pin is durable and fail-closed
- [ ] structured visit work survives restart and replays safely
- [ ] unsynced local media bytes survive until upload/recovery/discard
- [ ] media failure cannot block structured visit mutations
- [ ] visit route is mobile-first, accessible and explicit about sync truth
- [ ] synthetic prepare/offline/restart/reconnect E2E is green
- [ ] no untracked TODO/FIXME/HACK/TEMP
- [ ] packet moves to `REVIEW_PENDING / B-ADVERSARIAL-REVIEW`

## Handoff

- Current state: **BLOCKED**
- Current/next pass: A-IMPLEMENT paused after tranches 1–3 GREEN; dependency `WP-2.12R`
- READY gate: `99cf3b68f91b616b8aca9a218d3fb6ea62b493d9` / CI `37241583422` — 5/5
- Current canonical implementation preserved: `1794a3d9d564769437a22582b918f793e57cf150` / CI `37280907551` — 5/5
- Pass-A reconciliation: `8ffe905b026645affb6f218b65b601f565e80fe6` / CI `37288210671` — 5/5
- Blocking dependency: accepted Facts/Evidence observation append lacks client replay identity; support packet `WP-2.12R` owns the bounded hardening.
- Primary FIR: #42 / FTR-028 — IN_PROGRESS
- Open parent findings: replay-safety dependency only; no tranches 1–3 regression
- Next permitted parent action: none until WP-2.12R is ACCEPTED; then resume A-IMPLEMENT with structured reconnect replay RED.
