# Mariage OS — Implementation Status Board

Status: **Living repository source of truth for development progress**

Detailed historical packet evidence remains in packet records, acceptance records, coverage matrices, FIRs and Git history.

## Current phase

- V1 documentation/design: **COMPLETE / FROZEN**.
- Guest RSVP + Email/SMS/WhatsApp scope: **MERGED / FROZEN**.
- AI Lot Orchestration governance: **MERGED / FROZEN**.
- Final Design Review: **PASS**.
- Implementation gate: **OPEN**.
- Lot 0: **ACCEPTED**.
- Lot 1: **ACCEPTED**.
- Lot 2: **IN_PROGRESS — Venues core**.
- Lots 3–12: **NOT_STARTED**.

`main` integration truth: `f6da05626f024431230ae46ca1ec8a4becc72a1f` (PR #7). Lot-2 branch: `lot-2/venues-core`.

## Lot 2 — packet status

Required current-lot responsibilities minus assigned packet responsibilities: **∅**.

| Packet  | Responsibility                                                         | State                                                                      |
| ------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| WP-2.1  | venue identity, authorized persistence, lifecycle history              | **ACCEPTED / COMPLETE**                                                    |
| WP-2.2  | spaces, capacity, member ratings/preferences                           | **ACCEPTED / COMPLETE**                                                    |
| WP-2.3  | fact definitions, typed retained facts, value validation               | **ACCEPTED / COMPLETE**                                                    |
| WP-2.4  | observations, sources, evidence/confidence/freshness, conflicts        | **ACCEPTED / COMPLETE**                                                    |
| WP-2.5  | deterministic criteria, blockers, score/readiness, missing information | **ACCEPTED / COMPLETE**                                                    |
| WP-2.6A | Venue offers and offer components                                      | **ACCEPTED / COMPLETE**                                                    |
| WP-2.6B | Venue availability observations                                        | **ACCEPTED / COMPLETE**                                                    |
| WP-2.6C | Venue contacts                                                         | **ACCEPTED / COMPLETE**                                                    |
| WP-2.6D | Venue interaction history                                              | **ACCEPTED / COMPLETE**                                                    |
| WP-2.7  | contextual venue access-route observations                             | **ACCEPTED / COMPLETE**                                                    |
| WP-2.8A | Venue remote-image metadata and Venue links                            | **ACCEPTED / COMPLETE**                                                    |
| WP-2.8B | Venue private archived media lifecycle                                 | **ACCEPTED / COMPLETE**                                                    |
| WP-2.8C | recoverable Venue remote-media metadata lifecycle                      | **ACCEPTED / COMPLETE**                                                    |
| WP-2.9A | Venue-linked private PDF/document foundation                           | **ACCEPTED / COMPLETE**                                                    |
| WP-2.9C | trusted private-document ingestion hardening                           | **ACCEPTED / COMPLETE**                                                      |
| WP-2.9B | generic project tags and Venue entity-tag links                        | **ACCEPTED / COMPLETE — Pass C gap ∅**                                      |
| WP-2.10 | repositories, local cache, pending/offline mutations                   | **ACCEPTED / COMPLETE**                                                     |
| WP-2.11 | gallery/table/detail/compare/deep-link workspace                       | **ACCEPTED / COMPLETE**                                                    |
| WP-2.12 | mobile/offline venue-visit workflow and packet E2E completion          | **IN_PROGRESS — A-IMPLEMENT resumption seal CI pending**                  |
| WP-2.12R | replay-safe Venue fact-observation command boundary                     | **ACCEPTED / COMPLETE — Pass C gap ∅**                                    |
| WP-2.12S | replay-safe Venue member-rating command boundary                        | **ACCEPTED / COMPLETE — Pass C gap ∅**                                    |

## WP-2.10 — activation revalidation

- Activation was **READY** after revalidation against accepted WP-2.9A/B/C and current local-first/offline/sync contracts; WP-2.10 subsequently completed Pass A, fresh Pass B and Pass C and is now **ACCEPTED / COMPLETE**.
- Activation base `c5cfe273468eb56592f8fe8f0de9eb764d671a58` / CI `36579954211` passed the five ordinary jobs including clean checkout; all provider-only jobs were skipped.
- Packet record: `docs/roadmap/lot-2/WP-2.10.md`.
- Size: **8 points / cohesion PASS** — canonical frozen-schema `sync_mutation_receipts` table + receipt-aware Venue RPC boundary + Venue-local offline semantics.
- Scope is Venue-local only: cache essential Venue core records, durable pending Venue edits, retry-safe operation receipts for Venue core update/lifecycle transition, restart/session-expiry preservation and project/account isolation. Generic cross-domain sync remains Lot 10.
- Pass A implementation head `eca752c145f9c59c1d0ca17d938569d8977fba92` / CI `36713679555` rerun attempt 2 passed **5/5 ordinary jobs**, including full verify from clean checkout; provider-only jobs were skipped.
- FIR #42 records FTR-028's bounded current slice and downstream WP-2.12 responsibility.
- Historical Pass B `WP-2.10-PASS-B-REVIEW-2026-09-30.md` remains the failed-review record that discovered AR-001 and later AR-002/003.
- AR-003 RED evidence remains closed PR #56 / `aa511f38c0cddef69bc6dea829eaa4e8090345c2` / CI `36840025014`. Final bounded remediation head `b0658cd9a6e9a0ebeb957a1a3157193ab4e611ec` / CI `36846712515` passed **5/5 ordinary jobs**, including clean checkout; 208 test files / 1,833 tests passed at 100% code coverage, DB/RLS/promotion passed, browser 40/40 passed and mutation score was 82.50%.
- Complete fresh independent Pass B: `docs/roadmap/lot-2/WP-2.10-FRESH-PASS-B-2026-10-01.md` — **PASS**, no unresolved BLOCKING/MAJOR/MINOR; WP210-AR-001/002/003 CLOSED / VERIFIED.
- Pass C reconciliation: **PASS / gap ∅** in `docs/roadmap/lot-2/WP-2.10-ACCEPTANCE.md`; acceptance-record `a2d48341515a516651d11454c3c5e89c01896c21` / CI `36849005712` passed **5/5 ordinary jobs**, including full verify from clean checkout.
- State: **ACCEPTED / COMPLETE**. Final status seal `290a49a53556ffc6a91aa4467ba768eeb4c1ac00` / CI `36850174656` passed **5/5**, including clean checkout.

## WP-2.11 — implementation and fresh Pass B

- Activation base `290a49a53556ffc6a91aa4467ba768eeb4c1ac00` / CI `36850174656` passed **5/5**, including clean checkout.
- Pass-A GREEN was merged by PR #68 at `b249e87804ba7a6a546ea2f3db3195a0d2c4d0a1`; CI `37231659301` passed and provider-only workflows were skipped.
- Historical failed Pass B: `docs/roadmap/lot-2/WP-2.11-FRESH-PASS-B-2026-10-04.md` / RED PR #70 / `416e1f33e192726d0e53c4236ccfba2efe0fde69` / CI `37232085163` reproduced WP211-AR-001..005.
- Bounded remediation PR #72 exact head `619e17e910ed60076ce7c7e59ad4bece10d292b5` / CI `37238184427` passed **5/5 ordinary jobs**, including clean checkout; Core passed 228 files / **1,920 tests** at **100%** statements/branches/functions/lines, DB/RLS/promotion passed, browser **40/40** passed and mutation score was **83.11%**.
- PR #72 merged as `7cab3e8eaa59b3041d51de63bd32c17b3c9dd36a`; its tree `a12533b421a8c91270128946fdd38bd7d5d19f41` is identical to reviewed head `619e17e9...`.
- Fresh remediation review first challenged date-scoped/no-date truth and pagination termination, then found an oversized-page fail-closed gap on `3855f6faa9...`; all were remediated with direct regressions before the final review.
- Final fresh independent Codex review on `619e17e9...` returned **no new suggestion** (👍), with **0 unresolved review threads**.
- Complete clean Pass-B record: `docs/roadmap/lot-2/WP-2.11-FRESH-PASS-B-POST-REMEDIATION-2026-10-04.md` — **PASS**.
- `WP211-AR-001..005` are **CLOSED / VERIFIED**. No unresolved BLOCKING, MAJOR or MINOR finding remains.
- Fresh Pass-B/status seal `344a23cc4caf215a5bcc4b3dbbfd9ae7c0f357a9` / CI `37239523579` passed **5/5 ordinary jobs**, including full verify from clean checkout.
- Pass C reconciliation: **PASS / gap ∅** in `docs/roadmap/lot-2/WP-2.11-ACCEPTANCE.md`; acceptance-record `3167a380521119e9650859543778b040527332e2` / CI `37240178167` passed **5/5 ordinary jobs**, including full verify from clean checkout.
- State: **ACCEPTED / COMPLETE**. Primary FTR-015/FTR-016/FTR-017/FTR-027 are accepted for their bounded Lot-2 responsibility.
- Final WP-2.11 status/ledger/matrix seal `0a2d051d3f0a45b638f5c1b5f8c81acf36491c36` / CI `37240817336` passed **5/5 ordinary jobs**, including full verify from clean checkout; FIR #57–60 are closed completed.
- `/venues/:venueId/visit` remains WP-2.12. WP-2.12 activation revalidation found no dependency blocker and is recorded below; no Pass A code may begin until the WP-2.12 activation-governance HEAD itself is exact-head green.

## WP-2.12 — activation revalidation

- **READY candidate** after revalidation against accepted WP-2.1..WP-2.11, FTR-028 FIR #42, UF-08, PWA-003/004/006, the offline/local-data contracts and the existing media/facts/opinion services.
- Activation base `0a2d051d3f0a45b638f5c1b5f8c81acf36491c36` / CI `37240817336` passed **5/5 ordinary jobs**, including full verify from clean checkout; provider-only workflows were skipped.
- Packet record: `docs/roadmap/lot-2/WP-2.12.md`.
- Primary FIR: #42 / FTR-028. The accepted WP-2.10 slice remains immutable; WP-2.12 completes mobile visit/offline-package behavior only.
- Size: **9 points / explicit cohesion review PASS** — one Venue Visit workflow (3 domain/workflow), two local persistent stores (2), one IndexedDB migration family (1), one major UI route (1), and Venue-specific offline/sync semantics (2). Splitting would create independently green halves that cannot satisfy UF-08 restart/offline/reconnect safety.
- Planned local schema evolution is bounded to IndexedDB: `offline_pins` plus unsynced/local binary references, while visit package/draft records and structured pending mutations reuse accepted `cached_records` / `pending_mutations`.
- Existing server truth/services are reused: Venue/Facts/Interactions/Member Opinion/private Media. No new PostgreSQL table, migration, RPC, RLS policy, permission key, provider workflow or secret is expected.
- Generic service-worker/app update/install, cross-domain sync and offline policies remain Lot 10. Full Tasks/Decision behavior remains Lot 3; rendered map/provider capability remains Lot 9.
- Activation-governance head `99cf3b68f91b616b8aca9a218d3fb6ea62b493d9` / CI `37241583422` passed **5/5 ordinary jobs**, including clean checkout. Pass A is active.
- Tranche 1 RED: closed PR #73 / `8e8f9c1f36b9465630d1f60dff60a5fab0e14061` / CI `37242212073` failed for the intended visit-route/schema-v2/offline-store/logout-safety gaps.
- Tranche 1 GREEN: PR #74 reviewed head `fa3495a8b059d8a14b7e678be9d29087057761a1` / CI `37245441506` passed 5/5 with 1,949 tests / 100% coverage; merged canon `bca9bd27ba7b47e011248480efad703f51de8ebf` / CI `37245983552` passed 5/5.
- Sync-summary remediation: PR #77 / `ad3ba5fd9f1508c60bd7b914153050526216e7a9` / CI `37247526739`; merged `2a4bca34529a896016b6298eada0892e9196fb24` / CI `37248133866` — both SUCCESS.
- Tranche 2 RED: closed PR #76 / `ae83bcd4f654ada4813e03df3472b42a2d0f144f`; offline pin/package durability gaps reproduced without merge.
- Tranche 2 GREEN: PR #78 / `9fe3545e8354288b4a514278038d59c873ff8bd3` / CI `37248870611`; merged canon `853ef01f480b7c28d4f8b3a2b53ccfe2bcb85259` / CI `37249343123` passed 5/5; no unresolved review thread remains.
- Tranche 3 RED: closed PR #79 / `082979532a4df4e7669ab519e220a7673740b8dc` / CI `37252892728` failed for the intended durable scoped visit-draft gaps.
- Tranche 3 GREEN: PR #80 / `b5076b335f62ae92df1e660ced1b8d59d81d4840` / CI `37280176962` passed after remediating draft-only logout safety, atomic stale/equal-revision write handling and safe-integer revisions; merged canon `1794a3d9d564769437a22582b918f793e57cf150` / CI `37280907551` passed **5/5**, with zero unresolved review threads.
- Re-review blocker discovered before structured replay: the accepted `append_venue_fact_observation` RPC generates observation UUIDs server-side and exposes no client replay identity. A lost success response can therefore duplicate a measurement on retry.
- Adding replay identity inside WP-2.12 would add one migration family (+1) and one meaningfully changed RPC (+2), taking the packet from 9 to **12 points**. Under AI Lot Orchestration (>10), the packet must split.
- WP-2.12 was paused after three GREEN tranches while support packet `WP-2.12R` hardened replay-safe fact-observation identity. WP-2.12R is now **ACCEPTED / COMPLETE**; the parent blocker is resolved.
- WP-2.12R size: **3 points / cohesion PASS** — one migration family + one changed RPC; no table, RLS, permission, provider, UI or new product Feature.
- Activation governance `cc12be09d1569a739c11943e5283146d02de950f` / CI `37289339246` passed **5/5**, including clean checkout; RED #81 then proved the missing replay-identity contract.
- Pass-A GREEN PR #82 reviewed head `78c1d83e45357b653486ceb53dec64a9afdfec51` / CI `37295580568` passed **5/5** and merged as `5389bb31f2b57c1b02a011dbd6fd775a9c048570`; canonical CI `37296758669` passed **5/5**.
- Historical post-merge findings `WP212R-AR-001` and `WP212R-AR-002` are **CLOSED / VERIFIED**. Targeted RED #83 reproduced the NULL-metadata defect; remediation PR #84 exact head `bb856ab835a48ddc7bcc6b6278f5f83bc815d991` / CI `37301743650` passed 5/5 and fresh Codex review found no major issue with zero unresolved threads.
- Targeted RED #83 / `b4909ef100f1ea40d73e1490bfa19258b0820eec` / CI `37300726435` executed 21 replay pgTAP assertions and failed **exactly tests 7–8** for NULL evidence/confidence while Core, browser/mutation and preview remained green; PR closed unmerged.
- PR #84 merged as `e6c46b0e6b0879aa48ce29fd58c80f91b6900cb7`; canonical CI `37309288791` passed **5/5 SUCCESS**, including full verify from clean checkout.
- Authorization evidence PR #86 merged canonically as `9e9851d29830decd1dd927496b7aaa473445ca51`; canonical CI `37316129635` passed **5/5 SUCCESS**, including clean checkout and direct exact-signature authorization evidence.
- Complete Fresh Pass B v2: review-only PR #87 / head `bd17217f6d2ecb2ffc20ef7dd1c9017713737019` / CI `37327242771` — **PASS**, zero unresolved review threads and final Codex verdict “Didn't find any major issues.”
- Review-only challenge #88 / `55f0fc8b54554d1f108098d12fa6b718e2288115` / CI `37322464350` passed 5/5 and disproved the transient multiselect-order P2.
- Review-only challenge #89 / `8bb749810082332efb9de43fb9a61f101e8f39c9` / CI `37329487914` passed 5/5 and disproved the transient definition-constraint-drift P2.
- Complete review record: `docs/roadmap/lot-2/WP-2.12R-FRESH-PASS-B-POST-AUTHZ-2026-10-05.md` — **PASS**; no P0/P1/P2 remains.
- Fresh Pass-B/status seal `091d5f00e5e07afcefaafd8e89d4bb477a55dd10` / CI `37333914603` passed **5/5 ordinary jobs**, including full verify from clean checkout.
- Pass C reconciliation: **PASS / gap ∅** in `docs/roadmap/lot-2/WP-2.12R-ACCEPTANCE.md`; acceptance-record head `5c6d40296ccf7ee2e616a6587b8e910e762dd541` / CI `37335393969` passed **5/5 ordinary jobs**, including full verify from clean checkout.
- State: **ACCEPTED / COMPLETE**. The bounded replay-safe Fact Observation support responsibility is terminal; no open P0/P1/P2 remains.
- WP-2.12R final support seal `cdad9eb82052ac3e2296769e5381b2371558ec4d` / CI `37341157497` passed **5/5 ordinary jobs**, including full verify from clean checkout.
- Parent WP-2.12 resumption is now recorded separately. No new parent production code is authorized until this resumption-governance HEAD itself passes all five ordinary jobs including clean checkout.

## WP-2.12S — member-rating replay-safety split

- Parent resumption-governance head `2b2035740736dde090da9b1f5d86066975e7bc60` / CI `37342313598` passed **5/5 ordinary jobs**, including full verify from clean checkout.
- Re-review of the next structured reconnect tranche confirmed that Venue Interaction is replay-safe by stable `interactionId` and Fact Observation is replay-safe through accepted WP-2.12R, but `set_venue_member_rating(uuid,uuid,text,numeric,bigint)` has only optimistic `expectedRevision` and no stable operation/device identity.
- Failure mode: if a rating write commits and its response is lost, retrying the same offline intent with the original expected revision raises serialization conflict instead of recognizing the already-applied semantic result.
- Folding this hardening into the already-9-point parent would add one migration/API family (+1) and one meaningfully changed RPC (+2), returning the parent to **12 points**. The >10 orchestration rule therefore requires a separate support packet.
- Support packet record: `docs/roadmap/lot-2/WP-2.12S.md`.
- Size: **3 points / cohesion PASS** — one forward-only RPC migration family + one changed rating command; existing `sync_mutation_receipts` is reused, so no table/RLS/permission/provider/UI change is needed.
- Parent WP-2.12 is **BLOCKED** with tranches 1–3 GREEN preserved. WP-2.12R remains terminally accepted.
- Activation-governance head `4768853fa9c86c44f7cc54c85381fbf87a795547` / CI `37343723399` passed **5/5 ordinary jobs**, including clean checkout.
- RED-only PR #90 / `9d4bfb5ffffc388b954d9fa9b6a2c031aa46602d` is closed unmerged. CI `37364388534` proves the application/adapter identity gap plus the missing seven-argument replay/receipt behavior. Its assertion that the legacy overload should disappear was superseded by fresh-review finding `WP212S-AR-001` because obsolete cached clients have no update-required gate.
- Pre-finding GREEN head `a5e6c1a4e51c39882c93d4c13038275a430472bc` / CI `37379588696` passed **5/5**, 236 files / 2,056 tests / 100% global coverage, DB/RLS/promotion, browser/mutation and preview.
- Historical fresh-review finding `WP212S-AR-001` **P1** required expand/switch compatibility because migrations can precede frontend promotion and obsolete cached clients have no enforced update-required gate.
- Remediation PR #91 final reviewed head `c751c1908ee0fc7691c4ea4d57ade9bad6dfbabb` / CI `37381076113` passed **5/5 SUCCESS**, including clean checkout. It preserves the authenticated five-argument compatibility overload while the current adapter uses only the receipt-aware seven-argument path.
- Fresh independent Codex review on exact head `c751c190...` returned **“Didn't find any major issues”**, 👍, with zero unresolved review threads.
- PR #91 merged canonically as `c95364bd7f9215fe2686b2e3b76d517cc5b2ded4`; canonical CI `37384351528` passed **5/5 SUCCESS**, including full verify from clean checkout. Core: 236 files / **2,056 tests**, **100%** statements/branches/functions/lines.
- `WP212S-AR-001` is **CLOSED / VERIFIED**.
- Fresh Pass B #92 failed only on missing behavioral execution of the retained five-argument compatibility overload; tests-only #93 closed that evidence gap and merged canonically.
- Fresh Pass B v2 #94 failed only on `WP212S-AR-003` direct authorization-denial evidence. Security-only #95 refreshed patched transitive dependencies; tests-only #96 final head `2a39bab40aee523f1e4594ab08d6235f3ab2f0b6` / CI `37452807606` passed 5/5 with direct outsider/revoked deny plus zero-row/zero-receipt assertions and merged canonically as `c4bac33388c24e7b3c2746242ca6edd017f8ede0`.
- Canonical review base `c4bac33388c24e7b3c2746242ca6edd017f8ede0` / CI `37453636126` passed **5/5 SUCCESS**, including clean checkout; Core remains 236 files / **2,056 tests** / **100%** global coverage.
- Complete Fresh Pass B v3 review-only PR #97 / `826ea3dd61d9d13257c83715dc418fae16c5b9df` / CI `37454663521` is **PASS**: Codex found no major issue, returned 👍 and left zero unresolved review threads. PR #97 is closed unmerged by design.
- `WP212S-AR-001`, `WP212S-AR-002` and `WP212S-AR-003` are **CLOSED / VERIFIED**. Complete review record: `docs/roadmap/lot-2/WP-2.12S-FRESH-PASS-B-V3-2026-10-06.md`.
- Fresh Pass-B/status seal `54d3faaca10be74556372ec5e2f8ade2c5fddc53` / CI `37462189131` passed **5/5 SUCCESS**, including full verify from clean checkout.
- Pass C reconciliation: **PASS / gap ∅** in `docs/roadmap/lot-2/WP-2.12S-ACCEPTANCE.md`; acceptance-record head `8b0eae20d59e6013a14064fdea29451fbb503c42` / CI `37463358444` passed **5/5 ordinary jobs**, including full verify from clean checkout.
- State: **ACCEPTED / COMPLETE**. The bounded replay-safe Member Rating support responsibility is terminal; `WP212S-AR-001/002/003` remain CLOSED / VERIFIED and no new P0/P1/P2 is open.
- WP-2.12S final support seal `93f2916db125139f7694e56248c188a2cf21f794` / CI `37465538267` passed **5/5 ordinary jobs**, including full verify from clean checkout.
- Parent WP-2.12 resumption is recorded separately below. No new parent production code is authorized until the resumption-governance HEAD itself passes five ordinary jobs including clean checkout.

## Accepted packet evidence summary

WP-2.1..WP-2.8C are accepted and complete. Durable evidence remains in their packet/acceptance records. Latest accepted packet closure: WP-2.8C `7f97ab8bab9c60ba538b5c900845ca77e9b9f34c` / `34786974129` — **5/5 SUCCESS**, gap **∅**.

## WP-2.9A

- **ACCEPTED / COMPLETE**; FIR `#17 / FTR-089` remains open for downstream feature work.
- Pass-A `e533b5c53d1be074216ccaa92f74281b425de770` / `34826553890` — **5/5 SUCCESS**.
- `WP29A-AR-001/002/003` — **CLOSED / VERIFIED**.
- `WP29A-AR-004/005` — **CLOSED / VERIFIED in A** by complete fresh Pass B `WP-2.9A-FRESH-PASS-B-2026-09-29.md`.
- C's acceptance resolved A's blocker. A's full Pass B closed AR-001..005, and separate Pass C reconciled gap ∅. Acceptance-record `656398bcd5520cfa56d782023d150eb64317161d` / CI `36542083037` passed **5/5**, clean checkout included. B activation revalidation is next; FTR-089 remains IN_PROGRESS.

## WP-2.9C — accepted remediation packet

State: **ACCEPTED / COMPLETE**. The prior repeated-byte sample remains historical limited evidence. The compliant ten-distinct-PDF provider result, full fresh Pass B and separate Pass C are recorded below. Acceptance-record head `21accd7f9ab1b845275507b7941a782c5e816a56` / CI `36494697647` passed **5/5**, including clean checkout. A subsequently completed its own review and acceptance; FTR-089 remains IN_PROGRESS for downstream scope.

Pass-A exact evidence:

- `297ecdf3337e8522d6f200a90f96b481a9e6bdb1` / CI `34996240637` — **5/5 SUCCESS**, clean-checkout included.

Review-pending exact evidence:

- `e0854afb62cf5fcf834792fbad425d013b02af56` / CI `34997963836` — **5/5 SUCCESS**, clean-checkout included.

Fresh Pass-B failure:

- review record: `docs/roadmap/lot-2/WP-2.9C-PASS-B-REVIEW.md`;
- finding record commit: `deaa2432327b9512068a75635dde6f4c522467ad`;
- packet REVIEW_FAILED record: `d7fd7ae94792600d5d50afb51a7e6c96487e93a9`;
- status REVIEW_FAILED record: `16dac2577f1ef63afddf79e48fc4ce421c2b7c60`;
- matrix REVIEW_FAILED record: `f0ad5fab0d46a526a726028c7805b78bdb43b1d9`.

Remediation exact-head verification:

- implementation head `68a4f6bdb7b55acc80c4c6fbb8c0afc0295bfde5`;
- CI `35025384594` — **5/5 SUCCESS**, including `Full verify from clean checkout`;
- Core quality/security, Local Supabase DB/RLS/Pages Function, browser/mutation, privacy-safe preview and clean-checkout full verify all passed on the same exact implementation head.

Latest AR-006 execution-support verification:

- execution-support head `2aa0b91da82b09f479cd93fb52763786f9a7874f`;
- CI `35082871383` — **5/5 SUCCESS**, including `Full verify from clean checkout`;
- Core quality/security, Local Supabase DB/RLS/Pages Function, browser/mutation, privacy-safe preview and clean-checkout full verify all passed on that exact head;
- the dedicated `AR-006 isolated provider preflight` job and `Exact 25 MB Workers Free provider evidence` job were both **SKIPPED** on that ordinary push, as required;
- `npm run test:ar006:metrics` passed in Core and is also part of `npm run verify`;
- provider CPU GraphQL quantiles are treated as microseconds, retained raw as `cpuTimeP50Us` / `cpuTimeP99Us`, normalized by exact division by `1000` to `cpuTimeP50Ms` / `cpuTimeP99Ms`, then compared with the `10 ms` Workers Free budget;
- regression controls prove `10,000 µs = 10 ms` is accepted and `10,001 µs = 10.001 ms` is rejected;
- `npm run preflight:ar006` is a read-only readiness guard. The dedicated `[AR006-PREFLIGHT]` job runs it separately before provider evidence is authorized; the `[AR006-EVIDENCE]` job also runs the same guard before build/deployment;
- post-deployment checks still independently require the exact candidate to expose Pages Functions, expected bindings, deployment identity and `preview_script_name` before smoke/evidence collection.

Latest ADR 0011 private-Worker provider attempt:

- evidence head `bdb3d95cc788d4b43205fe9c0e109966f72c7798` / CI `35286381507` — normal repository verification jobs **5/5 SUCCESS**, including `Full verify from clean checkout`;
- private Worker deployment, isolated Pages Service Binding validation, exact Pages preview deployment and deny-oriented smoke succeeded;
- sanitized artifact `10525006138` (ZIP SHA-256 `42ce5db8d9b8d046bbfada9b34494bfa93d0b6c58e21adef8a4cf3adead3e25f`) records ten distinct exact `25,000,000`-byte synthetic promotions, all HTTP `200` / `success: true`;
- the final Workers Observability collection is **FAIL-CLOSED**: attempts 1–5 had no UUID-correlated marker, attempt 6 returned HTTP `429` / provider code `10429`, and no numeric CPU measurement was retained;
- Cloudflare's REST rate-limit documentation requires `Retry-After` handling. The permitted repair is the no-mutation source requery recorded in `WP-2.9C-AR-006-WORKER-REQUERY.md`; it must not be represented as AR-006 acceptance.

Latest read-only source requery and credential recovery:

- support head `2ef0e13b755ffc609972ac83c1d2260ca73ff8de` / CI `35337938664` — normal repository verification jobs **5/5 SUCCESS**, including `Full verify from clean checkout`;
- sanitized requery artifact `10544340701` (ZIP SHA-256 `d048098fa251b409ca8545fcda4d9e72c50cd76ebb3810d1b290e88be0bb0424`) contains no application mutation and failed closed before provider event retrieval: all three telemetry calls returned HTTP `401` / provider code `10000`, with zero measurements;
- this is an external credential/configuration failure, not CPU evidence or proof of telemetry absence. The dedicated encrypted observability secret was replaced with a one-year, Workers-Observability-only account token; its value is not recorded here;
- the one permitted recovery at `a937d6e1484640afba52848e895f5480ab4ea8a8` / CI `35339776360` completed normal CI **5/5 SUCCESS**, including `Full verify from clean checkout`, but its telemetry job again returned HTTP `401` / provider code `10000` on all three calls. Sanitized artifact `10545420236` (ZIP SHA-256 `dbac3d188a41dfc94420618406456d6a17f65ddbec485507a4fe98100e09eb86`) has zero measurements and `pass: false`;
- the bounded requery protocol is exhausted. No further token rotation, telemetry requery, deployment or promotion is permitted without an explicit architecture decision.

Local AR-006 evidence-parser correction after architecture review:

- the bounded local-only decision is recorded at `202f149` in `WP-2.9C-AR-006-ARCHITECTURE-REVIEW.md`;
- implementation head `18cf24cebb545b67fd2fe6791a7a3ece13e60f94` / CI `35364734978` completed the five normal jobs **5/5 SUCCESS**, including `Full verify from clean checkout`; provider preflight, promotion evidence and Worker telemetry requery were **SKIPPED**;
- the evaluator now reads Cloudflare's invocation HTTP status from `$metadata.statusCode` and requires a finite, non-negative JSON number at `$workers.cpuTimeMs`. Focused regression tests accept a schema-conforming `200` / `5 ms` event and reject absent, string and negative CPU values;
- this repairs the local verifier only. The previous provider HTTP `401` / `10000` responses and missing CPU measurements remain unresolved; AR-006 and WP-2.9C are not accepted.

Historical initial provider-readiness execution:

- no-content readiness head `55b02f40e8b4519db12f99ee8a38fe095e81a534`, using the exact tree of repository-green parent `2aa0b91da82b09f479cd93fb52763786f9a7874f`;
- CI `35083615839` / preflight job `104753395475`;
- `AR-006 isolated provider preflight` — **FAILURE BEFORE DEPLOYMENT / BEFORE DATA MUTATION** because the isolated GitHub Environment values were not yet configured;
- checkout, Node setup, dependency install and secret scan passed;
- the run did not reach the Cloudflare Pages API, Cloudflare Analytics, Supabase authentication or `has_project_permission`, and performed no deployment, document reservation, Storage upload, promotion/finalization or application-data mutation.

Historical isolated-provider setup and credential-readiness attempts earlier on **2026-09-16**:

- Dedicated Supabase Free project `rpdmqqvupmhxlxosasqi` (`mariage-os-ar006-isolated`, `eu-west-3`) has all **63** repository SQL migrations. Synthetic project `3651c5b8-fffa-494a-9686-2abcf0757a9d` exists.
- Dedicated Cloudflare Pages project `mariage-os-ar006-isolated` (project ID `1223854c-79fc-4617-855b-7919597e809f`) has preview `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and encrypted `PRIVATE_DOCUMENT_ADMIN_KEY` for this isolated Supabase project. Cloudflare dashboard displayed **Workers Free — Current plan** with the normal **10 ms CPU/request** limit.
- GitHub Environment `ar006-isolated` is restricted to `lot-2/venues-core`; runbook variables and scoped secrets were configured. Provider credential values are not stored in this board.
- Readiness heads `918ed0e198574f9c3e7f17d4c67cab7e1bc27c4d` / `35133580074` and `803b2e641b75074aa1d966cc6681c9523d36c1c1` / `35135570623` failed closed only at synthetic Supabase password authentication; no Pages deployment or application-data mutation occurred.
- Final confirmed synthetic user `ar006-synthetic-20260916-rpdm-final@example.com` (UUID `650241aa-fbf6-41ce-a277-9708f26b946a`) has active `editor` / `documents.write`. Its password is not retained in the repository.

Exact isolated provider execution on **2026-09-16**:

- No-content preflight head `d89b3601d066996c3958f30ad9067b34675f8b22` / CI `35138142860` / provider preflight job `104935966498` — **SUCCESS**.
- No-content evidence head `4f40613060b4c9de41a32d99ed43fcf6e12c9791` / CI `35138368708` — normal five repository jobs **5/5 SUCCESS**, including clean-checkout full verification. Provider evidence job `104939181956` deployed the exact head to isolated Workers Free Pages preview deployment `064d50b9-3c3d-414e-a6c3-afdcc1051be9` at `https://064d50b9.mariage-os-ar006-isolated.pages.dev`, branch `ar006-4f40613060b4`, preview script `pages-worker--19505720-preview`. Deployment identity, preview Functions/bindings and deny smoke passed.
- Sanitized schema-v2 Actions artifact `10464581885` (ZIP SHA-256 `56c809b27dadf42a3ef26a003855eb628dbf0ef437774bb76d82c02b33ada3c5`) records ten distinct exact `25,000,000`-byte synthetic promotions, all HTTP 200 and finalized. Controlled analytics window: `2026-09-16T19:13:57.417Z` to `19:16:29.334Z`.
- Provider CPU evidence was **absent, not above budget**: `providerCpuMeasurements: []`, `pass: false`. Cloudflare GraphQL `workersInvocationsAdaptive` returned no rows. No CPU value or CPU-limit outcome can be inferred from HTTP 200.
- Detailed attempt record: `docs/roadmap/lot-2/WP-2.9C-AR-006-PROVIDER-ATTEMPT-2026-09-16.md`.

AR-006 evidence-channel follow-up and architecture review:

- Read-only delayed requery trigger `9b139d23a7de47f8d3927a54c54d79298ca96a6b` / workflow `35149303081` re-read the same exact script/window roughly 1 h 40 later and still returned no provider CPU rows. Artifact `10468931194` remained fail-closed.
- Therefore the GraphQL aggregation-delay hypothesis did not unblock AR-006. `docs/roadmap/lot-2/WP-2.9C-AR-006-ARCHITECTURE-REVIEW.md` is **OPEN**.
- A bounded Pages deployment-tail capability support tree `d04edd0ed0d3daa3b9bfe20d954003bb13545200` was verified on parent `82e05a8dab9f61377f045b74005fd6582da0afe3` / CI `35152382433` — **5/5 SUCCESS**, including clean-checkout full verification.
- No-content exact-tree tail trigger `7645a9e769c641640f52fdba535deb6140401fc6` launched workflow `35153132971`, job `104986087784`. The exact deployment tail attached and the deny-only production smoke succeeded with no PDF upload, Supabase auth or application-data mutation.
- Sanitized tail artifact `10469354745`, ZIP SHA-256 `6b1c9db4b0b54d83881614867c1f68bd3e45b71fa767fec55c09203a72ac1f8c`, recorded `parsedJsonEventCount: 0`, `providerCpuTimeMs: []`, `pass: false`. Raw tail data was deliberately not retained.
- That result does not prove every Pages-tail event lacks CPU, but Cloudflare's documented standard Pages deployment-tail event shape does not define CPU time. Standard Pages tail is therefore **not approved as the final AR-006 CPU channel** and the ten exact-size promotions must not be rerun merely to retry it.
- Workers Observability capability preflight after dedicated secret configuration: no-content commit `bd3fdb4baab6ef59983e40f77b5b2f44ba6dc8b7`, workflow `35213157767`, job `105175271234`. The deny-only smoke passed and the query ran with the configured dedicated secret, but Cloudflare exposed no attributable numeric provider CPU for `pages-worker--19505720-preview`. Sanitized artifact `10494251279` (ZIP SHA-256 `02438aadb3e377f6c8e6ed66b3b00c0c0d3e473008c3bb710acbfb805f2dde7c`) failed closed. It contains no credentials or application data. The dedicated Cloudflare token was revoked and `AR006_CLOUDFLARE_OBSERVABILITY_TOKEN` was deleted from the GitHub Environment after the exercise.
- The three tested provider channels are now insufficient for this unchanged isolated Pages deployment: GraphQL, standard Pages tail and Workers Observability. No exact-size promotion, Paid entitlement, timing substitute, contract reduction or runtime migration is authorized by this result.
- The Observability capability probe must use a dedicated short-lived `AR006_CLOUDFLARE_OBSERVABILITY_TOKEN`; Cloudflare currently documents `Workers Observability Write` as the API permission for the telemetry query/key endpoints. This token must not replace/reuse the Pages deployment or Account Analytics tokens.

Historical ADR 0011 remediation status (superseded by item 41 above):

- `WP29C-AR-005` — **MAJOR / IMPLEMENTATION-REMEDIATED / EXACT-HEAD-GREEN** — trusted clean-abandon path, DB orphan backstop, immediate pre-copy reservation revalidation, safe post-copy compensation and race/retry coverage implemented. Formal closure waits for the later complete fresh Pass B after AR-006 is unblocked.
- `WP29C-AR-006` — **MAJOR / OPEN / BLOCKING** — the bounded ADR 0011 private-Worker campaign produced eight HTTP-200 exact-size successes, two HTTP-503 failures, eight provider CPU values of 237–273 ms and two `exceededCpu` outcomes on Workers Free. The 10 ms normal budget failed. Architecture review is required before any new campaign.
- `WP29C-AR-007` — **MAJOR / IMPLEMENTATION-REMEDIATED / EXACT-HEAD-GREEN** — ADR/release/CI-CD/secret contracts reconciled to Pages Functions and `PRIVATE_DOCUMENT_ADMIN_KEY`; fail-closed non-destructive deployment smoke added. Formal closure waits for the later complete fresh Pass B after AR-006 is unblocked.

Historical `WP29C-AR-001..004` remain implementation-green but await a later complete clean fresh Pass B for formal closure.

### AR-005 guardrails retained

Trusted cleanup remains inside the same narrow Pages security boundary and must remain:

- bodyless;
- current-user authenticated;
- live `documents.write` authorized;
- project/document bound with server-derived exact paths;
- safe for pending/absent retry state only;
- idempotent across response loss;
- unable to delete ready documents, another project/document or Media;
- verified absent before metadata abandon completes.

Promotion retains authoritative reservation-state recheck immediately before privileged canonical mutation and safe compensation only for canonical bytes created by the failing request.

### AR-006 blocking evidence gate

Local Wrangler/workerd exact-25-MB success is functional evidence, not Workers Free CPU evidence. The frozen normal Workers Free acceptance budget remains `10 ms` CPU per request.

The original provider evidence harness and delayed requery used `workersInvocationsAdaptive` CPU quantiles as microseconds, retained raw values, normalized by division by `1000`, and failed closed because no provider rows were returned. That channel is now historical evidence, not the sole planned channel.

Unblock now requires an exact-commit isolated Pages + Durable Object deployment on Workers Free, ten complete exact `25,000,000`-byte trusted promotion flows, and provider-produced CPU telemetry for both execution surfaces: the stateless Pages ingress must remain inside its normal Free CPU envelope, while the lifecycle executor must be provider-classified as `executionModel=durableObject`, expose numeric CPU, avoid CPU-limit outcomes and remain below the documented Durable Object CPU limit. No Paid entitlement or file-limit reduction is permitted.

Provider-observation exploration is now governed by the open architecture review:

- GraphQL `workersInvocationsAdaptive`: unavailable for this isolated Pages preview after immediate and delayed queries;
- standard Pages deployment tail: bounded deny-only probe executed, but no parseable CPU event was retained and the documented tail event contract does not define CPU time;
- Workers Observability telemetry REST API: provider capability is proven and remains the selected CPU evidence channel; the future ADR 0012 evaluator must distinguish the stateless Pages ingress from `executionModel=durableObject` and fail closed on missing/ambiguous CPU;
- wall time, HTTP 200, application timing, Paid-only shortcuts and file-limit reduction remain invalid substitutes.

The 2026-09-24 ADR-0011 provider CPU result remains decisive adverse evidence for the stateless Worker design. ADR 0012 is the replacement execution architecture: the same-origin/bodyless Pages ingress binds directly to one private SQLite-backed Durable Object per project/document lifecycle. Preflight attempt 1 failed contained at the Pages Preview PATCH and was remediated. The single authorized retry at `eca478937fad40632dc378f0408c1c8ec4bd5c8c` / CI `36049934080` proved the private Durable Object deploy, minimal Pages binding PATCH, binding receipt, Worker-secret/Supabase authority checks and exact Pages preview deployment, but failed at the immediate deny-smoke because GET `/api/private-document-promote` returned transient HTTP 404 instead of the required 405. The job stopped before the non-mutating route probe; exact-size evidence stayed disabled and no document was reserved/uploaded/promoted/finalized. A subsequent diagnostic fetch observed the same exact preview route returning 405, consistent with deployment propagation, but that observation is not acceptance evidence. WP-2.9C remains **IN_PROGRESS — ADR 0012 ROUTE-READINESS REMEDIATION EXACT-HEAD GREEN / TARGETED REVIEW PASS; READ-ONLY RECHECK HARNESS NEXT**. AR-006 remains OPEN. The bounded existing-deployment continuation is now provider-green: trigger `ce2738a22d421fafd446695d9595a378a0413865`, CI `36054731788`, read-only job `107821508056`, artifact `10832062202` (ZIP SHA-256 `4fdc8a890bb0a23f59fa0055dd208dcee7e018c08a8437b118475bacb5af6f7e`). It re-verified the ADR 0012 provider binding/Worker secret metadata/synthetic authority, resolved the unique exact `eca478...` Pages preview, passed the bounded deny smoke and reached the lifecycle Durable Object using a random unreserved document UUID, without deploy/PATCH or document mutation.


### ADR 0012 exact-preview route recheck result — 2026-09-25

The single reviewed read-only recheck ran on same-tree trigger `1a4deb3ffb8980e32b887a2244f8d9fb947699e3` / CI `36133903894`. All five repository jobs passed, including `Full verify from clean checkout`. All unrelated provider jobs and the exact-size evidence job were skipped.

Read-only provider job `108069830452` succeeded. It re-verified the isolated provider metadata and synthetic `documents.write` authority, resolved exactly one successful Functions preview for pinned candidate `6bdf445e7f56e38caa0d807232bcfde573103117`, passed the deny-oriented production smoke, and reached the lifecycle Durable Object on the first bounded random-unreserved probe with safe status sequence `[409]`.

Sanitized artifact `10863225626` / ZIP SHA-256 `8168ceac820923b4bf63a96e7a2240b0d49c02abf8ca51f048b8cc992c22e00a` uses schema `mariage-os.wp29c.ar006.do-route-recheck.v1`, is bound to the expected preview, records `usesFunctions:true` and `documentMutation:false`, and contains no credential or document content.

Post-recheck adversarial review: **PASS FOR ONE BOUNDED SECOND EXACT-SIZE CAMPAIGN**. The route-readiness defect that contained the first ADR-0012 evidence attempt is no longer present on the pinned preview, and the current exact-size job uses the reviewed bounded 404/503 route-readiness helper before any document mutation. No BLOCKING/MAJOR finding remains in this recheck result. This does not close AR-006 and does not itself prove CPU compliance.

Authorization is conditional: the commit containing this result/review seal must first pass ordinary exact-head CI + clean checkout. Only then may one no-content same-tree `[AR006-DO-EVIDENCE]` trigger execute the current reviewed ten-flow/two-surface harness. Any failure remains fail-closed; no immediate repeat, Paid entitlement, wall-time substitution or file-limit reduction is authorized.

### AR-007 operations gate retained

Normative release/deployment/secret contracts require Pages Functions to deploy with the exact static candidate, `PRIVATE_DOCUMENT_ADMIN_KEY` to live only as an environment-specific encrypted secret on the private Worker/Durable Object host (never Pages), `/api/private-document-promote` to fail closed without static/origin fallback, and the removed Supabase promotion route to remain absent. `npm run smoke:private-document-production` provides deny-oriented deployment smoke without privileged credentials or real wedding data.

## Current next-action gate

1. The reviewed ADR 0013 preflight/result seal remained exact-head green.
2. Same-tree trigger `f7951e99eb31bcc63d9cbd93f67db80548340ed6` ran the single authorized `[AR006-INGRESS-EVIDENCE]` in CI `36157672647`; all five ordinary repository jobs, including clean checkout, were **SUCCESS**.
3. Provider job `108149068138` redeployed the exact private DO host and Static Assets ingress, verified the binding/secret boundary and passed deny smoke.
4. The mandatory safe marker preflight reached generic HTTP `409` and complete Observability pages but failed with one aggregate `invalid_provider_invocation` after eight bounded attempts.
5. Artifact `10874337441` (digest `sha256:b286b9361df2ca8780f054c60a957ac0edfbcfded71e1d67e6525f9087e324b7`) records `completedInvocationCount:0`, `invocations:[]`, `provider:null` and `failureStage:"marker_preflight"`. No exact-size document was reserved/staged/promoted/finalized and no ten-flow CPU verdict exists.
6. The campaign authorization is exhausted. **Do not rerun `[AR006-INGRESS-EVIDENCE]`.**
7. `ADR13-EV-001` is **MAJOR / OPEN**: the retained aggregate provider-invocation rejection is not sufficiently diagnosable.
8. Diagnostic hardening is exact-head green at `743b885f96f734118f4c1a656183dab620eb75ac` / CI `36164117948`: all five ordinary jobs are **SUCCESS**, including clean checkout. Field-specific privacy-safe rejection reasons, focused tests and the exact-window read-only requery harness are implemented.
9. Fresh adversarial diagnostic review is **PASS** with no BLOCKING/MAJOR finding. The review is recorded in `WP-2.9C-ADR-0013-DIAGNOSTIC-REVIEW.md`.
10. After the commit containing that review/status seal is itself exact-head green, exactly one no-content same-tree `[AR006-INGRESS-DIAGNOSTIC]` trigger may query the already-produced failed-window events. The job has no deploy credential, no Supabase authentication, no new marker, no PDF construction and no application mutation capability.
11. The diagnostic result must return to review. It is not provider acceptance and does not authorize an automatic `[AR006-INGRESS-EVIDENCE]` retry. Workers Paid, wall-time substitution, dashboard aggregates, lower file limit and silent relaxation of version/model/status/CPU checks remain prohibited.
12. The one read-only diagnostic trigger `561aa6efa4e5f3d3e1ee5bfe5962bd84cf50060a` / CI `36167031612` passed all five ordinary jobs and provider job `108179616464`. Sanitized artifact `10879110764` (ZIP SHA-256 `397734aeaf183c01463a8077ea0b19bae8eab9f87619eb3cd6a1e21a55218556`) classified the sole rejection as ingress `script_version_mismatch`: observed previous version `11eb9e2f...` at `3 ms` CPU rather than the newly deployed `8c48646c...`. Durable Object attribution passed. No exact-size flow ran.
13. Cloudflare deployment inventory shows the new ingress version configured at 100%, with the observed version belonging to the prior 100% deployment. This is consistent with propagation but not a proven internal root cause. `WP-2.9C-ADR-0013-DIAGNOSTIC-RESULT-2026-09-25.md` records the exact evidence and bounded repository-only correction.
14. The bounded safe-marker exact-version readiness correction is committed at `6c5560ed6d1ef89e617adc77dace28790adf30f7` / CI `36169216121`: **5/5 SUCCESS**, including clean checkout; provider jobs skipped. Focused RED-first tests cover exclusive version-skew retry and fail-closed adverse conditions.
15. Fresh targeted review `WP-2.9C-ADR-0013-VERSION-READINESS-REVIEW.md` is **PASS** with no BLOCKING/MAJOR finding in this scope. It is not the complete WP-2.9C Pass B. The historical ADR 0013 provider topology preflight was green, and no ingress/DO runtime or privilege boundary changed.
16. Only after the commit containing this review/status seal itself passes ordinary exact-head CI and clean checkout is **one** no-content same-tree `[AR006-INGRESS-EVIDENCE]` trigger authorized. It must use the reviewed safe exact-version marker gate before any 25 MB mutation. A red result exhausts the authorization and returns to review.
17. Review/status seal `d3fc84be4dccee7812076a53c414aa1ab3826bd0` / CI `36170334350` passed all five jobs, including clean checkout. Its one authorized same-tree trigger `baa119ea77be3769ca9c66b9a62904bfe7b3a2b7` / CI `36171181043` also passed the five ordinary jobs but provider job `108193266069` stopped at the safe marker before any exact-size flow.
18. Sanitized artifact `10880811417` / ZIP SHA-256 `63e839d0e3cfd4f9563bb5dfbcdb10df396e0a174db9e183b3abb5d475eceba3` records complete HTTP-200 Observability queries with zero events on both surfaces, a 409 route response, `completedInvocationCount:0`, no provider verdict and `pass:false`. A later read-only query of that same window found six ingress/two DO events and exact-version, request-correlated marker invocations at 1 ms and 17 ms CPU respectively. This is safe-marker evidence only, not 25 MB CPU evidence.
19. `WP-2.9C-ADR-0013-EMPTY-LOG-RESULT-2026-09-25.md` records the classification defect and precise bounded correction. A RED-first test reproduced it. The classifier now treats only the exact no-marker/no-attribution/two-missing-marker plus two derived script-identity failures as delayed logs under the existing eight-query bound. Wrong-script observations, invalid invocations, CPU, status and version failures remain blocking.
20. Next: exact-head implementation CI and clean checkout, fresh targeted adversarial review, review-seal exact-head CI; only a new review may authorize one further campaign. The previous authorization is exhausted. No automatic retry or AR-006 closure.
21. Empty-log correction `5ef42c3` / CI `36173041841` passed **5/5 SUCCESS**, including clean checkout. No provider job ran on this ordinary push. Fresh targeted review `WP-2.9C-ADR-0013-EMPTY-LOG-REVIEW.md` is PASS with no BLOCKING/MAJOR finding in its narrow scope. Exactly one new no-content same-tree `[AR006-INGRESS-EVIDENCE]` trigger is permitted **only after this review/status seal itself passes exact-head 5/5 CI**. A red provider result returns to review without retry.
22. Review/status seal `890f5bc942974d874a2b2cbd604f683412bf488b` / CI `36343323166` passed **5/5 SUCCESS**, clean checkout included. Its single authorized same-tree trigger `da19c6cbe339f060955cf2b852e4cfeb1c576023` / CI `36343818988` passed all five ordinary jobs and provider job `108690065987`.
23. Sanitized artifact `10940276677` (ZIP SHA-256 `d94f668d2b04329720555a9b144b89be61b5c5347c137b0430dc24680e9c2aa3`) records **10** distinct synthetic document/evidence identities, each staging the exact-`25,000,000`-byte PDF bytes and all HTTP 200/success/finalized; ten exact-version ingress CPU readings **0–3 ms** within 10 ms; ten exact-version Durable Object readings **142–329 ms** within 30,000 ms and ten distinct DO IDs. Two-surface evaluation and campaign `pass:true`, no provider failures, Workers Free attested, Paid entitlement attested absent. See `WP-2.9C-ADR-0013-PROVIDER-RESULT-2026-09-27.md`.
24. AR-006 is **IMPLEMENTATION-EVIDENCED**, not yet formally closed. Next: pass ordinary exact-head CI + clean checkout over the commit retaining this provider result, then transition WP-2.9C to `REVIEW_PENDING` and perform a complete fresh Pass B over AR-001..007. Only a clean Pass B may enter `ACCEPTANCE_PENDING`; Pass C alone may accept C and unblock A. No second provider campaign is authorized or needed.
25. Evidence-bound commit `bd5ca22` / CI `36344835905` passed **5/5 SUCCESS**, including clean checkout. This permitted `IN_PROGRESS -> REVIEW_PENDING` and the full fresh Pass B over all seven C responsibilities and AR-001..007.
26. That fresh Pass B is `REVIEW_FAILED`: `WP-2.9C-FRESH-PASS-B-2026-09-27.md` records new MAJOR `WP29C-AR-008`. ADR 0013 requires Workers Static Assets for the production private-document ingress, but CI/release/secret/Free-tier contracts still prescribe the superseded Pages route. Formal AR-007 closure is therefore reopened. State moved `REVIEW_PENDING -> REVIEW_FAILED -> IN_PROGRESS` as remediation began. No Pass C or A resumption.
27. A new ADR 0013 production-operations regression test was RED against the old contracts. Next: reconcile those normative contracts and release-plan metadata to the current Worker ingress plus private DO host, run focused tests and complete exact-head CI/clean checkout, then a fresh review and full Pass B. The successful CPU campaign is retained; no rerun is authorized or needed.
28. AR-008 remediation is implemented locally: `WP-2.9C-AR-008-REMEDIATION-2026-09-27.md` records normative CI/release/secret/Free-tier/plan reconciliation and Worker-first deny/static production smoke. The RED-first contract control and AR-007 regression now pass 9/9 targeted tests. Next: local static checks, commit/push, exact-head CI including clean checkout, fresh remediation review, then complete fresh Pass B. No provider action is authorized by this docs/smoke correction.
29. AR-008 production-contract correction passed exact-head `a819947` / CI `36346460133` **5/5 SUCCESS**, including clean checkout. Targeted review found the historical Pages `onRequest` source remains for shared logic/local regression; production must verify that the route is owned only by Workers Static Assets. A narrow contract/test clarification is in progress, without changing the deployed ingress/DO runtime or rerunning the green CPU campaign. Next: exact-head CI over that clarification, targeted review, then full fresh Pass B.
30. Clarification `a94a7b9` / CI `36395904397` passed **5/5 SUCCESS**, clean checkout included; targeted AR-008 review is PASS in `WP-2.9C-AR-008-REVIEW-2026-09-28.md`. The complete fresh Pass B in `WP-2.9C-FRESH-PASS-B-2026-09-28.md` found MAJOR `WP29C-AR-009`: the governed ten-flow campaign used ten distinct document/DO identities but one repeated PDF byte sequence, while ADR 0013 requires ten distinct synthetic PDFs. RED tests reproduced both the repeated hash and the verdict's duplicate-hash acceptance. State moved `REVIEW_PENDING -> REVIEW_FAILED -> IN_PROGRESS` for remediation. No Pass C or A resumption; prior CPU readings must not be mislabeled as ten byte-distinct PDFs.
31. AR-009 RED-first remediation is implemented locally in the isolated provider harness, without changing production runtime: ten generated exact-size PDFs now have ten distinct SHA-256 hashes; each flow reserves/stages its own bytes; sanitized evidence retains per-flow hashes and sizes; the verdict rejects duplicate/missing hashes or wrong sizes. Focused tests pass 11/11, TypeScript/ESLint/Prettier/secret scan pass. `WP-2.9C-AR-009-REMEDIATION-2026-09-28.md` records the scope. Next: exact-head CI/clean checkout, fresh adversarial harness review and explicit bounded replacement-campaign authorization; no campaign yet.
32. First AR-009 implementation `a1b726f` / CI `36397976054` failed application typecheck; this was corrected in `8f04bba3bcb92e9045800e954aca31d816a84943` / CI `36398524127` **5/5 SUCCESS**, including clean checkout. Fresh targeted review `WP-2.9C-AR-009-REVIEW-2026-09-28.md` is PASS for the distinct-PDF harness, per-flow reserve/stage hash and fail-closed verdict. Exactly one replacement `[AR006-INGRESS-EVIDENCE]` campaign is authorized **only after this review/status seal itself passes 5/5 exact-head CI**. It must use a no-content same-tree trigger and stop on red; no campaign has run yet.
33. Review/status seal `0cffaf2dbf2b351d31a4c22830ebd236d2f9b7c2` / CI `36399469688` passed **5/5**, including clean checkout. Its same-tree campaign trigger `9822ba73fe328839df1a76e515e399e2d20a4287` / CI `36400324210` passed the five ordinary jobs, but provider job `108859090242` failed at the non-mutating marker preflight. Artifact `10960925487` (ZIP SHA-256 `891667aebb9be726fa9a0a963d02772e5ff930ba67a069ed8059580c40d8bf73`) records only paired ingress/DO `script_version_mismatch` against newly deployed exact versions, complete HTTP-200 Observability queries, **zero** completed 25 MB invocations and no PDF mutation. The campaign authorization is exhausted; AR-006 and AR-009 remain open.
34. `WP-2.9C-ADR-0013-PAIRED-VERSION-READINESS-2026-09-28.md` records the provider result and a RED-first, narrowly bounded local correction: a fresh marker may be retried only when both complete surfaces show exactly one version-only mismatch each, in addition to the already reviewed ingress-only case. Three marker rounds maximum, final exact-version attribution before any document mutation. Result/correction `f9bd24e9939db95b74f96399bddb23a41bbcc7d2` / CI `36423040486` passed **5/5**, including clean checkout; provider jobs skipped. Re-reading ADR 0013 identified an explicit conflict with its earlier all-DO-mismatch stop rule; a dated narrow amendment is required and must be included in the targeted review before any provider rerun. Next: exact-head CI/clean checkout for the normative amendment, fresh targeted adversarial review, then explicit review/status seal before **one** new campaign. No provider rerun is authorized yet.
35. The dated ADR 0013 paired-version amendment `8b8925cb2ccb045aeef098f8876cea3148ce7d1c` / CI `36423946026` passed **5/5**, including clean checkout; provider jobs skipped. Fresh targeted adversarial review `WP-2.9C-ADR-0013-PAIRED-VERSION-REVIEW-2026-09-28.md` is PASS for the narrowly bounded marker retry and explicit normative exception; the former all-DO-mismatch stop rule is superseded only for paired version-only diagnostics. This is not the full packet Pass B. One replacement campaign is authorized **only after this review/status seal itself passes 5/5 exact-head CI**; a red attempt returns to review without automatic repeat.
36. Review/status seal `f18f1f475a3f415d5aa115d2091a0ac85d93d5d9` / CI `36424965352` passed **5/5**, including clean checkout. Its same-tree no-content trigger `fe03af21c0059d6d4344002f58ec4f5b170d65ff` / CI `36425931984` passed all five ordinary jobs, but isolated job `108943088476` failed closed at the bodyless marker preflight. Artifact `10972140652` (ZIP SHA-256 `d17ba9006e98b1391e4d086697e8322b4a724fd569744a13c9888d7cac904a45`) records one attributed DO marker, missing ingress marker, complete HTTP-200 event pages, no 25 MB invocation and no acceptance CPU proof. The single-campaign authorization is exhausted. `WP-2.9C-ADR-0013-PARTIAL-MARKER-RESULT-2026-09-28.md` records RED-first local remediation: only the exact partial shape may re-read the same marker within the existing eight-query bound; no new marker or mutation. The dated ADR clause is reconciled. Next: exact-head CI/clean checkout, targeted review and separate seal before another single campaign.
37. Partial-marker remediation `039e8fdddf7003adaa3ed0f433288f13903faf4c` / CI `36428473034` passed **5/5**, including clean checkout; provider jobs skipped. Fresh targeted adversarial review `WP-2.9C-ADR-0013-PARTIAL-MARKER-REVIEW-2026-09-28.md` is PASS for the exact same-marker re-read, existing eight-query bound and unchanged final two-surface gate. It is not the full packet Pass B. Exactly one new no-content same-tree `[AR006-INGRESS-EVIDENCE]` campaign is authorized **only after this review/status seal itself passes 5/5 exact-head CI**. A red result returns to review without automatic repeat.
38. The review/status seal `15d4e4eac6973de5d00798ca849568d6692e898d` / CI `36458756536` passed **5/5**, including clean checkout. Its same-tree no-content trigger `2303df0c9e8d6f72561ec0ce42514663801229d8` / CI `36459949861` passed all five ordinary jobs and isolated provider job `109058754517`. Artifact `10987866873` (ZIP SHA-256 `6ec13fbc69d7ab098d46ecc8219f383a4996c2dc193ffa753ac012c81d5e9c92`) records ten byte-distinct synthetic 25,000,000-byte PDFs, ten successful finalizations and valid exact-version CPU on both Workers Free surfaces: ingress 0–2 ms / 10 ms, Durable Object 274–360 ms / 30,000 ms. `WP-2.9C-ADR-0013-DISTINCT-PDF-PROVIDER-RESULT-2026-09-28.md` records the checked receipt. This closes the provider evidence gap as a candidate only; AR-006/AR-009 formal closure and C acceptance still require evidence-bound exact-head CI, complete fresh Pass B and Pass C. The single-campaign authorization is consumed.
39. Evidence-bound result `78fb24e4dcb9551b041edd9079f0ac3c5b1e973a` / CI `36461954215` passed **5/5**, including clean checkout; provider jobs skipped. Pre-review reconciliation found `docs/operations/FREE-TIER.md` still calling the older repeated-byte `da19c6c` sample accepted proof. That normative operational reference is being corrected to cite the ten-distinct-PDF result and label the older sample limited history. Require exact-head 5/5 CI for this correction before entering the complete fresh Pass B. No new provider campaign is authorized.
40. Free-tier reconciliation `d3dad1623f0a878b43637200db31e7cf909f9869` / CI `36463139444` passed **5/5**, including full verification from a clean checkout. Pass A remediation evidence is now complete and the packet transitions `IN_PROGRESS -> REVIEW_PENDING`. Next: a new complete Pass B over all seven C responsibilities and AR-001..009; no provider rerun is authorized.
41. REVIEW_PENDING seal `44fc3e14bdc55dc6ab0b3613a82a9eea7daa6293` / CI `36464200682` passed **5/5**, including full verification from a clean checkout. `WP-2.9C-FRESH-PASS-B-DISTINCT-PDF-2026-09-28.md` is the new complete Pass B: **PASS**, no unresolved BLOCKING/MAJOR/MINOR finding across all seven C responsibilities; AR-001..009 are formally CLOSED / VERIFIED for C. State transitions `REVIEW_PENDING -> ACCEPTANCE_PENDING`; next is separate Pass C expected/implemented/verified reconciliation, including FIR and parent-A dependency. No provider rerun is needed or authorized.
42. Pass-B/status seal `66b9396fc06b540a0a51a1fa948933c170728d65` / CI `36465390803` passed **5/5**, including clean checkout. Separate `WP-2.9C-ACCEPTANCE.md` Pass C reconciles all seven responsibilities `EXPECTED ↔ IMPLEMENTED ↔ VERIFIED` with gap **∅**, current FIR #17, no open C finding and explicit parent-A handoff. Its decision is **PASS / eligible for ACCEPTED**, subject to this acceptance-record seal passing five exact-head ordinary CI jobs. Until then C remains `ACCEPTANCE_PENDING` and A `BLOCKED`.
43. Acceptance-record seal `21accd7f9ab1b845275507b7941a782c5e816a56` / CI `36494697647` passed **5/5**, including clean checkout. Pass C marks WP-2.9C **ACCEPTED / COMPLETE** with gap ∅ and AR-001..009 closed for C. WP-2.9A's recorded blocker is resolved; it transitions `BLOCKED -> IN_PROGRESS` for integration/reverification and fresh full Pass B. Its AR-004/005 remain open until that review. No provider rerun is authorized or needed.
44. C-accepted/A-resumption transition `c8f3dfd441e7ad583613c8b94bd9197b19b829fb` / CI `36495622949` passed **5/5**, including clean checkout. A reintegration inspected the domain/service/staging/trusted promotion/attestation/RLS/read/link/recovery boundaries and found no new product-code change needed. It found `docs/security/STORAGE-RLS.md` still stating the obsolete WP-1.9 UPDATE policy despite accepted WP-2.8B immutability and current three-policy pgTAP proof. `WP-2.9A-REINTEGRATION-2026-09-29.md` records the bounded documentation correction and A responsibility checks. Next: seal this correction/record with five exact-head ordinary CI jobs before A enters REVIEW_PENDING.
45. Reintegration/Storage-RLS correction `19d26c825bba19f5a826a6b820b6d4b027e44399` / CI `36496447413` passed **5/5**, including clean checkout. WP-2.9A transitions `IN_PROGRESS -> REVIEW_PENDING` for a new complete adversarial Pass B. Parent AR-004/005 remain MAJOR / OPEN until that review verifies the accepted-C fixes in A's full product contract. The review-entry status commit must itself pass exact-head ordinary CI before a Pass-B decision.
46. Review-entry `30922eb6f348369022edb2a8d1d4cb948757fe29` / CI `36497398006` passed **5/5**, including clean checkout; isolated provider jobs skipped. `WP-2.9A-FRESH-PASS-B-2026-09-29.md` independently reviews all A product/security responsibilities and closes AR-001..005 in A with no new BLOCKING/MAJOR/MINOR finding. WP-2.9A transitions `REVIEW_PENDING -> ACCEPTANCE_PENDING`; next is a separate Pass C expected/implemented/verified reconciliation after the review/status seal itself passes exact-head CI.
47. Pass-B/status seal `2ed8191bf310fdc4ef395e1f294d54c543c02705` / CI `36498263015` passed **5/5**, including clean checkout. Separate `WP-2.9A-ACCEPTANCE.md` Pass C reconciles all assigned A responsibilities as `EXPECTED ↔ IMPLEMENTED ↔ VERIFIED` with gap **∅**, current FIR #17 and explicit downstream FTR-089/WP-2.9B scope. Verdict is PASS / eligible for ACCEPTED, subject to the acceptance-record HEAD passing five exact-head ordinary CI jobs. Until then A stays `ACCEPTANCE_PENDING` and B `PLANNED / AFTER A`.
48. A acceptance-record `656398bcd5520cfa56d782023d150eb64317161d` / CI `36542083037` passed **5/5**, including clean checkout. Pass C marks WP-2.9A **ACCEPTED / COMPLETE**, gap ∅ and AR-001..005 closed in A. FTR-089 stays IN_PROGRESS because WP-2.11 presentation and later-lot document responsibilities remain. WP-2.9B remains PLANNED pending its separate activation revalidation, READY transition and exact-head CI; no B implementation is authorized yet.
49. A acceptance handoff `f41bee0c5fd6cd2b696e269e54e41e5a43ec3b2d` / CI `36543034897` passed **5/5**, including clean checkout; isolated provider jobs skipped. WP-2.9B's frozen 8-point tag contract was revalidated against accepted A's document schema and existing permissions with no conflict. This separate B `PLANNED -> READY` governance candidate must itself pass five exact-head CI jobs before B Pass A begins.
50. B READY governance `605d616589d4732e9136d249302f8a64c6c29eb0` / CI `36544194589` passed **5/5**, including clean checkout; provider jobs skipped. B is now `IN_PROGRESS / A-IMPLEMENT` with new FTR-093 FIR #27. Its forward-only tag/assignment migration, RLS, typed service/adapter and direct tests are a Pass-A candidate awaiting exact-head CI; no B review or acceptance is claimed.
51. First B implementation head `643368e319aa6d1b1e94671bdff133207cbf999f` / CI `36547210465` **FAILED**: core 100% new-code coverage and local DB/RLS (label validation helper `42501`, ambiguous pgTAP unlink parameter `42702`); browser/mutation succeeded, preview/full verification skipped. A bounded Pass-A remediation candidate fixes the SQL privilege boundary and test ambiguity, adds provider/lifecycle/deny branch tests, and passes local TypeScript/Vitest coverage (188 files, 1,686 tests; two pre-existing Windows CRLF-sensitive tests excluded). B remains IN_PROGRESS / A-IMPLEMENT until a new exact-head 5/5 CI gate.
52. B remediation `b80f609909e4cc8aa158bce36973c9192929e623` / CI `36548685008` **FAILED 3/5**: core quality/security, browser/mutation and preview passed; DB/RLS passed 42/43 tag assertions, with the sole mismatch an expected `23514` versus observed RLS-first `42501` denial for a non-Venue target. Clean checkout skipped. The test expectation is corrected without weakening the deny rule; a new exact-head 5/5 gate remains required.
53. B corrected Pass-A head `eeda5cbeecd4bef299347e40252496ef8451c916` / CI `36568868030` passed **5/5 ordinary jobs**, including DB/RLS, Pages integration and full verify from clean checkout. B transitions `IN_PROGRESS / A-IMPLEMENT -> REVIEW_PENDING / B-ADVERSARIAL-REVIEW`. The separate review-entry status commit must itself pass exact-head 5/5 before fresh Pass B; no Pass C or acceptance is claimed.
54. B review-entry `a53bd5fcc6569fada595ad9316f10525b060de8c` / CI `36569916332` passed **5/5**, including clean checkout. Fresh `WP-2.9B-PASS-B-REVIEW-2026-09-29.md` found WP29B-AR-001 (unbounded direct SQL label scan) and WP29B-AR-002 (missing attempted protected-field deny tests), both MAJOR / OPEN. Verdict **FAIL**, transition `REVIEW_PENDING -> REVIEW_FAILED`; next is bounded remediation, new exact-head CI and a fresh review. No Pass C or acceptance.
55. B review-failure record `67d4fe10bd148e491a1554f9441a938ec7e492f8` / CI `36571052052` passed **5/5**, including clean checkout. Bounded AR-001/002 remediation is active: explicit SQL byte preflight before the label scan and direct authenticated protected-field/retargeting deny attempts. B transitions `REVIEW_FAILED -> IN_PROGRESS / REMEDIATION`; findings remain OPEN until exact-head CI and fresh Pass B.
56. B AR-001/002 remediation `bd39576c27d74482c477823e264aa54f85f8a3ed` / CI `36572652546` passed **5/5**, including 1,439/1,439 pgTAP assertions and clean checkout. B returns `IN_PROGRESS / REMEDIATION -> REVIEW_PENDING / B-ADVERSARIAL-REVIEW`. Findings have tested resolution candidates but remain OPEN until fresh Pass B. The separate review-entry status commit requires exact-head five-job CI before review verdict.
57. B post-remediation review entry `d603f8c2bd5d53c85484c27b72297c60405cf677` / CI `36573768984` passed **5/5**, including clean checkout. Separate `WP-2.9B-FRESH-PASS-B-2026-09-29.md` rechecked the full B responsibility, closed WP29B-AR-001/002 with direct DB evidence and found no new finding. Verdict **PASS**; B transitions `REVIEW_PENDING -> ACCEPTANCE_PENDING / C-ACCEPTANCE`, subject to this review/status seal's own exact-head five-job CI. No Pass C or acceptance is claimed yet.
58. B Pass-B/status seal `f812dc07ff855e985a7cf2993dbbb9408582154c` / CI `36575013966` passed **5/5**, including clean checkout. Separate `WP-2.9B-ACCEPTANCE.md` Pass C reconciles every assigned current-Lot responsibility as `EXPECTED ↔ IMPLEMENTED ↔ VERIFIED` with gap **∅**, current FIR #27 and explicit downstream FTR-093 scope. Verdict **PASS / eligible for ACCEPTED**, subject to the acceptance-record HEAD passing five exact-head ordinary CI jobs. Until then B remains `ACCEPTANCE_PENDING` and WP-2.10 `PLANNED / AFTER B`.
59. B acceptance-record `df0a3f057d4d06d02312c071b3a890c0b1f14b38` / CI `36576346730` passed **5/5**, including DB/RLS and full verify from clean checkout. Pass C marks WP-2.9B **ACCEPTED / COMPLETE**, gap ∅ and AR-001/002 closed. WP-2.9A/B/C are all terminal accepted. FTR-093 remains IN_PROGRESS for WP-2.11 presentation and later targets/lots.
60. WP-2.10 activation base `c5cfe273468eb56592f8fe8f0de9eb764d671a58` / CI `36579954211` passed five ordinary jobs and authorized RED-first Pass A. The branch then implemented the Venue-local cache/pending-mutation coordinator, receipt-aware retry-safe update/lifecycle RPCs, frozen receipt schema, atomic IndexedDB intent/failure/settlement semantics, response-loss/restart/session-expiry coverage and cloud-confirmed quick-add caching. A static size guard found the IndexedDB store at 411 effective lines; bounded extraction into a pure validation module restored the guard without weakening it.
61. WP-2.10 Pass-A head `eca752c145f9c59c1d0ca17d938569d8977fba92` / CI `36713679555` rerun attempt 2 passed **5/5 ordinary jobs**, including clean checkout. Core reported 201 test files / 1,801 tests at 100% code coverage; DB/RLS/Pages integration passed; browser 40/40 passed; mutation score 82.50%. FIR #42 is current. WP-2.10 transitions `IN_PROGRESS / A-IMPLEMENT -> REVIEW_PENDING / B-ADVERSARIAL-REVIEW`. No Pass B or acceptance is claimed.
62. Review-entry seal `333f584fd00ca2830839540f43465d21072e7616` / CI `36715447094` passed **5/5**, including clean checkout. Fresh `WP-2.10-PASS-B-REVIEW-2026-09-30.md` reconstructed the offline/sync contracts and found `WP210-AR-001` MAJOR / OPEN: settling an older same-Venue operation can overwrite the cached newer local working value as `synced` while the newer mutation remains unresolved in the queue. Verdict **FAIL**; transition `REVIEW_PENDING -> REVIEW_FAILED`.
63. AR-001 settlement-order and AR-002 atomic-refresh remediation are exact-head green at `f3b0fc8528510f151bced32c1ba4760437c25d32` / CI `36838716613`: five ordinary jobs SUCCESS including clean checkout. Neither finding is formally closed until the next complete fresh Pass B.
64. Fresh post-remediation adversarial review found `WP210-AR-003` MAJOR / OPEN. Closed RED-only PR #56 / head `aa511f38c0cddef69bc6dea829eaa4e8090345c2` reproduced same-operation/same-target changed-intent loss; CI `36840025014` reached unit tests and the new test failed because settlement resolved successfully instead of rejecting.
65. AR-003 remediation and test-harness reconciliation reached exact-head `b0658cd9a6e9a0ebeb957a1a3157193ab4e611ec` / CI `36846712515` — **5/5 SUCCESS** including clean checkout. A new complete independent Pass B closed WP210-AR-001/002/003 as VERIFIED with no new finding and moved WP-2.10 to `ACCEPTANCE_PENDING / C-ACCEPTANCE`.
66. Fresh Pass-B/status seal `1cc26a697cd1675f2d5cb32ea2750406c258f2ef` / CI `36847931025` passed **5/5 SUCCESS**, including clean checkout. Separate WP-2.10 Pass C reconciled all bounded responsibilities with gap ∅.
67. WP-2.10 Pass-C acceptance-record `a2d48341515a516651d11454c3c5e89c01896c21` / CI `36849005712` passed **5/5 SUCCESS**, including full verify from clean checkout. WP-2.10 is **ACCEPTED / COMPLETE**. FTR-028 remains `IN_PROGRESS` because WP-2.12 owns the mobile venue-visit/offline-package completion.
68. WP-2.10 final status seal `290a49a53556ffc6a91aa4467ba768eeb4c1ac00` / CI `36850174656` passed **5/5 SUCCESS**, including clean checkout. WP-2.11 activation revalidation found no unresolved dependency/design blocker: primary FIRs #57–60 now exist, packet size is 4/cohesion PASS, and no new persistence/RPC/RLS/provider/offline semantic is required. WP-2.11 entered its implementation/review sequence.
69. WP-2.11 remediation/review converged at reviewed head `619e17e910ed60076ce7c7e59ad4bece10d292b5` / CI `37238184427`: **5/5 SUCCESS**, 1,920 unit tests / 100% code coverage, DB/RLS/promotion PASS, browser 40/40 PASS, mutation 83.11%, clean checkout PASS. Fresh Pass B closed WP211-AR-001..005 with no new finding.
70. WP-2.11 fresh Pass-B/status seal `344a23cc4caf215a5bcc4b3dbbfd9ae7c0f357a9` / CI `37239523579` passed **5/5 SUCCESS**, including full verify from clean checkout. Separate Pass C reconciled all bounded WP-2.11 responsibilities with gap ∅.
71. WP-2.11 Pass-C acceptance-record `3167a380521119e9650859543778b040527332e2` / CI `37240178167` passed **5/5 SUCCESS**, including full verify from clean checkout. WP-2.11 is **ACCEPTED / COMPLETE**; FTR-015/016/017/027 are accepted for this bounded workspace. FTR-024/FTR-089/FTR-093 and FTR-028 retain downstream responsibilities.
72. WP-2.11 final status/ledger/matrix seal `0a2d051d3f0a45b638f5c1b5f8c81acf36491c36` / CI `37240817336` passed **5/5 SUCCESS**, including clean checkout; FIR #57–60 are closed completed.
73. WP-2.12 READY seal `99cf3b68f91b616b8aca9a218d3fb6ea62b493d9` / CI `37241583422` passed **5/5 SUCCESS**, including clean checkout; Pass A RED-first was authorized.
74. WP-2.12 tranche 1 visit-route/local-schema GREEN merged at `bca9bd27ba7b47e011248480efad703f51de8ebf` / CI `37245983552` — **5/5 SUCCESS** after RED #73 and review remediation.
75. WP-2.12 sync-summary remediation merged at `2a4bca34529a896016b6298eada0892e9196fb24` / CI `37248133866` — **5/5 SUCCESS**.
76. WP-2.12 tranche 2 offline pin/package GREEN merged at `853ef01f480b7c28d4f8b3a2b53ccfe2bcb85259` / CI `37249343123` — **5/5 SUCCESS**, no unresolved review thread.
77. WP-2.12 tranche 3 durable visit-draft GREEN merged at `1794a3d9d564769437a22582b918f793e57cf150` / CI `37280907551` — **5/5 SUCCESS** after RED #79 and three review findings were remediated; no unresolved review thread remains.
78. WP-2.12 Pass-A reconciliation `8ffe905b026645affb6f218b65b601f565e80fe6` / CI `37288210671` passed **5/5 SUCCESS**, including clean checkout. Structured-replay re-review then found the fact-observation RPC has no client replay identity; adding it would raise WP-2.12 from 9 to 12 points, so orchestration requires split support packet WP-2.12R.
79. WP-2.12R initial GREEN merged at `5389bb31f2b57c1b02a011dbd6fd775a9c048570` / CI `37296758669` — **5/5 SUCCESS**; post-merge review then opened AR-001/002.
80. WP-2.12R remediation PR #84 reviewed head `bb856ab835a48ddc7bcc6b6278f5f83bc815d991` / CI `37301743650` passed **5/5 SUCCESS** with fresh independent review clean; merged canonical `e6c46b0e6b0879aa48ce29fd58c80f91b6900cb7` / CI `37309288791` also passed **5/5 SUCCESS**, including clean checkout. AR-001/002 are CLOSED / VERIFIED.
81. WP-2.12R authorization-evidence remediation #86 merged as `9e9851d29830decd1dd927496b7aaa473445ca51` / CI `37316129635` — **5/5 SUCCESS**, including clean checkout. Complete Fresh Pass B v2 #87 is PASS after #88/#89 disproved two migration-chain false positives; final Codex review on `bd17217f...` found no major issue and left zero unresolved threads.
82. WP-2.12R Fresh Pass-B/status seal `091d5f00e5e07afcefaafd8e89d4bb477a55dd10` / CI `37333914603` passed **5/5 SUCCESS**, including full verify from clean checkout. Separate Pass C reconciled all bounded replay-safe observation-command responsibilities with gap ∅.
83. WP-2.12R Pass-C acceptance-record `5c6d40296ccf7ee2e616a6587b8e910e762dd541` / CI `37335393969` passed **5/5 SUCCESS**, including full verify from clean checkout. Final support seal `cdad9eb82052ac3e2296769e5381b2371558ec4d` / CI `37341157497` also passed **5/5 SUCCESS**. WP-2.12R is **ACCEPTED / COMPLETE**.
84. WP-2.12 parent replay resumption-governance head `2b2035740736dde090da9b1f5d86066975e7bc60` / CI `37342313598` passed **5/5 SUCCESS**, including full verify from clean checkout.
85. Structured-reconnect re-review then found the remaining Member Rating command is not response-loss replay-safe. Interaction and Fact Observation are already replay-safe; only rating is extracted to 3-point support packet WP-2.12S. Parent WP-2.12 returns to **BLOCKED** with all existing GREEN evidence preserved; no parent production change is authorized until WP-2.12S is accepted.
86. WP-2.12S remediation PR #91 reviewed head `c751c1908ee0fc7691c4ea4d57ade9bad6dfbabb` / CI `37381076113` passed **5/5 SUCCESS** after preserving the legacy five-argument rollout-compatibility overload while current code uses the seven-argument receipt-aware path. Fresh Codex review on that exact head found no major issue and left zero unresolved threads. PR #91 merged as `c95364bd7f9215fe2686b2e3b76d517cc5b2ded4`; canonical CI `37384351528` passed **5/5 SUCCESS**, including clean checkout, with 2,056 tests / 100% coverage.
87. WP-2.12S compatibility-evidence #93 and authorization-evidence #96 closed the remaining Pass-B evidence gaps; canonical `c4bac33388c24e7b3c2746242ca6edd017f8ede0` / CI `37453636126` passed 5/5. Complete Fresh Pass B v3 review-only #97 / `826ea3dd61d9d13257c83715dc418fae16c5b9df` / CI `37454663521` is PASS with Codex clean, 👍 and zero unresolved threads. AR-001/002/003 are CLOSED / VERIFIED.
88. WP-2.12S Fresh Pass-B/status seal `54d3faaca10be74556372ec5e2f8ade2c5fddc53` / CI `37462189131` passed **5/5 SUCCESS**, including full verify from clean checkout. Separate Pass C reconciled all bounded member-rating replay/authorization/rollout responsibilities with gap ∅.
89. WP-2.12S Pass-C acceptance-record `8b0eae20d59e6013a14064fdea29451fbb503c42` / CI `37463358444` passed **5/5 SUCCESS**, including full verify from clean checkout. Final support seal `93f2916db125139f7694e56248c188a2cf21f794` / CI `37465538267` also passed **5/5 SUCCESS**. WP-2.12S is **ACCEPTED / COMPLETE**.
90. Both replay support dependencies WP-2.12R and WP-2.12S are terminally accepted. A separate parent resumption-governance head returns WP-2.12 to **IN_PROGRESS / A-IMPLEMENT** with tranches 1–3 preserved; exact-head five-job CI including clean checkout is required before the next structured-reconnect RED/production tranche.

## Durable handoff

```text
main integration truth: f6da05626f024431230ae46ca1ec8a4becc72a1f
Lot 0: ACCEPTED
Lot 1: ACCEPTED
Lot 2: IN_PROGRESS
Lot 2 branch: lot-2/venues-core
Accepted durable Lot-2 packets: WP-2.1..WP-2.11
WP-2.9C: ACCEPTED / COMPLETE — Pass C gap ∅; acceptance-record 21accd7f9ab1b845275507b7941a782c5e816a56 / CI 36494697647 5/5 including clean checkout
WP-2.9A: ACCEPTED / COMPLETE — Pass C gap ∅; acceptance-record 656398bcd5520cfa56d782023d150eb64317161d / CI 36542083037 5/5 including clean checkout
Current packet: WP-2.12 — IN_PROGRESS / A-IMPLEMENT resumption gate; WP-2.12R final seal `cdad9eb82052ac3e2296769e5381b2371558ec4d` / CI `37341157497` 5/5; WP-2.12S final seal `93f2916db125139f7694e56248c188a2cf21f794` / CI `37465538267` 5/5; tranches 1–3 GREEN preserved; primary FIR #42 / FTR-028
Latest green readiness: d89b3601d066996c3958f30ad9067b34675f8b22 / 35138142860 / job 104935966498 — SUCCESS
Exact-size evidence candidate: 4f40613060b4c9de41a32d99ed43fcf6e12c9791 / 35138368708 — 5/5 normal jobs SUCCESS; ten exact 25,000,000-byte promotions HTTP 200/finalized; provider CPU rows absent
Provider deployment: 064d50b9-3c3d-414e-a6c3-afdcc1051be9 / pages-worker--19505720-preview / Workers Free Pages preview
Exact-size evidence artifact: 10464581885 / ZIP SHA-256 56c809b27dadf42a3ef26a003855eb628dbf0ef437774bb76d82c02b33ada3c5 / providerCpuMeasurements=[] / pass=false
Delayed GraphQL requery: 9b139d23a7de47f8d3927a54c54d79298ca96a6b / workflow 35149303081 / artifact 10468931194 — still no CPU rows
AR-006 architecture review: DECISION RECORDED IN ADR 0011; implementation/verification open
Latest private-Worker evidence: bdb3d95cc788d4b43205fe9c0e109966f72c7798 / CI 35286381507 / artifact 10525006138 (ZIP SHA-256 42ce5db8d9b8d046bbfada9b34494bfa93d0b6c58e21adef8a4cf3adead3e25f) — ten exact 25,000,000-byte HTTP-200 synthetic promotions; provider query attempt 6 rate-limited (429/10429); pass=false
Latest Worker requery: 2ef0e13b755ffc609972ac83c1d2260ca73ff8de / CI 35337938664 / artifact 10544340701 (ZIP SHA-256 d048098fa251b409ca8545fcda4d9e72c50cd76ebb3810d1b290e88be0bb0424) — normal CI 5/5 SUCCESS; telemetry request rejected 401/10000 before event retrieval; pass=false
Final bounded Worker requery: a937d6e1484640afba52848e895f5480ab4ea8a8 / CI 35339776360 / artifact 10545420236 (ZIP SHA-256 dbac3d188a41dfc94420618406456d6a17f65ddbec485507a4fe98100e09eb86) — normal CI 5/5 SUCCESS; telemetry rejected 401/10000 on all three calls; zero measurements; pass=false
Local evidence parser repair: architecture decision 202f149; implementation 18cf24cebb545b67fd2fe6791a7a3ece13e60f94 / CI 35364734978 — normal CI 5/5 SUCCESS including clean-checkout; no provider query or promotion; AR-006 remains open
Bounded parser-repair live retest: 8dd0da2b948e4bdad3edaba274ef658fc850b4ef / CI 35366867329 — normal CI 5/5 SUCCESS including clean-checkout; isolated job 105673740056 FAILURE at account-token verification 401/1000; artifact 10557066610 (ZIP SHA-256 414ba6803b1a75d65ae2ed9930c0fbb4a49b784c06538966847c19962b9ae990) has no provider query, no CPU measurement, pass=false
Owner-type credential diagnostic: e5c9c93ae23a1350511c986629f78f58db308e61 / CI 35912545590 — normal CI 5/5 SUCCESS including clean-checkout; isolated job 107358251456 failed closed; artifact 10774515322 (ZIP SHA-256 8ce43d8acba16bb4c5d7ee97c49d40b4057b5c3e54059d4a9022da579dedfa60) records account 401/1000 and user 401/1000, no telemetry query, pass=false
Replacement Observability token: created in the authenticated Cloudflare account on 2026-09-24 with only `Workers Observability Write` for the account, all IPs allowed, expiration 2027-09-25; GitHub `ar006-isolated` secret updated at 2026-09-24T08:17:32Z (REST 204, confirmed by refreshed GitHub UI). The token is also stored outside the repository in a Windows DPAPI user-protected local file. Normal CI for preflight preparation commit 4ea938b37321c77c24d359e6e13c69e5ea71693f / run 35915263712 succeeded. No promotion has run with the replacement.
Observability credential capability: 2187a137663a02a01e3868cfd3690f8d6f45f05e / CI 35974594865 — normal CI 5/5 SUCCESS including clean-checkout; isolated job 107554277941 SUCCESS; artifact 10796864297 (ZIP SHA-256 394d5c3497b0adb81a8ba3a888a1f3461c77df85a4abd85a718cf9ca11b8ade4) records account verification 200/active and telemetry query 200/success, no provider errors, pass=true; no CPU measurement or promotion. Both superseded wrong-scope Observability tokens were deleted after the replacement passed.
Deployment-token rotation: on 2026-09-24 the Cloudflare dashboard created `mariage-os-ar006-pages-deploy-20260924` (account `Pages Write`) and `mariage-os-ar006-worker-deploy-20260924` (account `Workers Scripts Write`), each expiring 2027-09-25 with all IPs allowed. GitHub `ar006-isolated` encrypted secrets `AR006_CLOUDFLARE_DEPLOY_TOKEN` and `AR006_CLOUDFLARE_WORKER_DEPLOY_TOKEN` show update timestamps `2026-09-24T08:36:53Z` and `2026-09-24T08:38:15Z` respectively. Their values are also in current-user DPAPI files outside the repository. No deployment or promotion has used the replacements yet.
Isolated Pages/synthetic-user preflight: `6b4a1da36e3dd32bde36adfb7f6d75e204324902` / CI `35976858406` / job `107559568930` — SUCCESS, with `AR-006 isolated provider preflight passed.` in the job log. The same exact commit passed all five ordinary CI jobs, including full verification from a clean checkout; the exact-size evidence job was correctly skipped. The expired old Pages token was deleted after preflight proof; the old Worker token remains until deployment proof.
Single permitted exact-size campaign: `26da10e5aabd7d2a9b6105caef49dd87d6ee58b9` / CI `35977875774` — all five ordinary jobs SUCCESS, including clean checkout. Isolated job `107565190064` passed preflight, Worker/Pages deployments, binding checks and deny smoke, then FAILED at evidence collection. Artifact `10799077529` (ZIP SHA-256 `b11e62221fa82f1697133e51f19eeeb546ff562a5615327da14882924025003e`) records eight exact-size HTTP-200 successes, two HTTP-503 failures, no accepted UUID-correlated CPU measurements and `pass: false`. A bounded read-only Cloudflare query returned ten private-Worker invocation rows: eight `ok` at 237–273 ms CPU and two `exceededCpu` at 10 and 27 ms. See `WP-2.9C-AR-006-PROVIDER-ATTEMPT-2026-09-24.md`.
Blocker handoff: `10fb35be5104ab168151dc30b3eb1bc62c530538` / CI `36005004956` — all five ordinary jobs SUCCESS, including full verification from clean checkout; isolated provider workflows correctly SKIPPED. WP-2.9C and FTR-089 remain BLOCKED.
Post-campaign credential cleanup: the replacement Worker token deployed successfully. The superseded `mariage-os-ar006-worker-deploy` token remains because the Cloudflare connector refused deletion (`9109 Unauthorized`) and the browser tool was unavailable. Its revocation is outstanding; it is not used by the current GitHub environment secret.
CPU feasibility follow-up: `docs/roadmap/lot-2/WP-2.9C-AR-006-FEASIBILITY-2026-09-24.md` is superseded for the selected direction by ADR 0012. Multi-request hashing remains a fallback only. The selected design uses a private SQLite-backed Durable Object per document lifecycle, directly bound to Pages, and requires explicit serialization plus deployed provider CPU proof. The superseded Worker-token cleanup remains separate and deferred while this packet is active.
ADR 0012 decision commit: `889433938e721e8cbd9a01c9d6caff6436b198f4` — direct Pages → Durable Object architecture accepted; no production implementation or provider campaign in that commit.
ADR 0012 implementation/provider-remediation candidate: `7492dd06677f6d5c5ae7627a1c0129bf841c6175` / CI `36038873857` — **5/5 SUCCESS**, clean-checkout included; ordinary push kept provider jobs SKIPPED.
ADR 0012 remediation review: **PASS FOR PREFLIGHT SCOPE** — ADR12-IR-001..004 CLOSED / VERIFIED; exact-size evidence remains separately gated.
ADR 0012 provider preflight attempt 1: `b0c8782517f726a0b71f33ca52e940f31c3e138c` / CI `36044939346` / job `107788836160` — ordinary + clean-checkout gates green; private Durable Object host deployment SUCCESS; Pages Preview PATCH FAILED; no binding receipt, Pages candidate, route mutation or exact-size evidence; failure contained.
ADR 0012 Pages PATCH remediation: `2f3a9eb657bfb8b151d9b70d64371961b519cd53` / CI `36047159395` — **5/5 SUCCESS**, clean checkout included; configurator now uses a minimal partial PATCH and sanitized status/code/field diagnostics; all provider workflows skipped on remediation commits.
ADR 0012 retry review: **PASS FOR BOUNDED PREFLIGHT RETRY SCOPE** — one new `[AR006-DO-PREFLIGHT]` retry only after this review/status state is exact-head green; exact-size remains disabled.
ADR 0012 provider preflight retry 2: `eca478937fad40632dc378f0408c1c8ec4bd5c8c` / CI `36049934080` / job `107805560963` — Core/DB/browser/preview/clean-checkout all SUCCESS; private DO deploy SUCCESS; minimal Pages binding PATCH SUCCESS; provider binding/Worker-secret/synthetic authority SUCCESS; exact Pages preview deployment SUCCESS; immediate deny-smoke FAILED because unsupported-method GET returned transient 404 instead of required 405; route probe skipped; exact-size evidence job SKIPPED; no document mutation.
ADR 0012 existing-deployment read-only continuation: `ce2738a22d421fafd446695d9595a378a0413865` / CI `36054731788` / job `107821508056` — **SUCCESS**; artifact `10832062202`, ZIP SHA-256 `4fdc8a890bb0a23f59fa0055dd208dcee7e018c08a8437b118475bacb5af6f7e`; no deploy/PATCH/document mutation; deny smoke and lifecycle-DO route proof green.
Route-readiness remediation green head: `f6a272bd04640c52a3ff0c98330605f158474148` / CI `36124432936` — 5/5 SUCCESS including clean checkout; provider jobs skipped. Fresh targeted review: PASS, no BLOCKING/MAJOR finding. Current permitted action: repository-only implementation + focused review of one marker-gated read-only route-recheck job pinned to exact `6bdf445e7f56e38caa0d807232bcfde573103117`; no Worker deploy, Pages PATCH or document/exact-size mutation is authorized. A provider recheck may run only after that harness is exact-head green and reviewed.
Tail support green tree: d04edd0ed0d3daa3b9bfe20d954003bb13545200 / parent 82e05a8dab9f61377f045b74005fd6582da0afe3 / CI 35152382433 — 5/5 SUCCESS
Tail capability trigger: 7645a9e769c641640f52fdba535deb6140401fc6 / workflow 35153132971 / job 104986087784 / artifact 10469354745 — deny smoke SUCCESS; parsedJsonEventCount=0; providerCpuTimeMs=[]; pass=false
Workers Observability configured capability preflight: bd3fdb4baab6ef59983e40f77b5b2f44ba6dc8b7 / workflow 35213157767 / job 105175271234 / artifact 10494251279 (ZIP SHA-256 02438aadb3e377f6c8e6ed66b3b00c0c0d3e473008c3bb710acbfb805f2dde7c) — deny smoke passed; no attributable numeric provider CPU; pass=false
AR-006 architecture review: ADR 0011 private Worker failed the deployed Free CPU gate; ADR 0012 accepted direct Pages → per-document Durable Object replacement architecture
AR-005/007/008/006/009 in C: CLOSED / VERIFIED by the complete fresh C Pass B and Pass C; parent A AR-004/005 closed by A Pass B and Pass C
FTR-089 FIR: #17 — IN_PROGRESS / parent A accepted, later presentation and Lot responsibilities remain
WP-2.9B: ACCEPTED / COMPLETE; FTR-093 FIR #27 remains IN_PROGRESS for downstream scope; WP29B-AR-001/002 CLOSED / VERIFIED; Pass C gap ∅
Lots 3–12: NOT_STARTED
Latest distinct-PDF campaign: 2303df0c9e8d6f72561ec0ce42514663801229d8 / CI 36459949861 / provider job 109058754517 / artifact 10987866873 — 10 distinct exact-size PDFs, 10 finalized flows, 20 valid exact-version CPU readings within Workers Free; provider verdict PASS
Next permitted action: pass this WP-2.12 resumption-governance HEAD through five ordinary exact-head CI jobs including clean checkout. If green, create an isolated RED-only structured-reconnect tranche covering durable/replay-safe visit note, measurement and personal-rating mutations through the accepted Interaction / Fact Observation / Member Opinion boundaries. Media bytes/upload remain a separate later tranche. No provider campaign is authorized or required.
```
