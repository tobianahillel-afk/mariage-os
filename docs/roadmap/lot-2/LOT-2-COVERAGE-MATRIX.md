# Lot 2 — Coverage Matrix and Work Packet Plan

Status: **IN_PROGRESS — WP-2.1..WP-2.11 + WP-2.12R/S/T ACCEPTED; WP-2.12U ACCEPTED / COMPLETE (final seal CI pending); parent WP-2.12 BLOCKED/FROZEN**

Purpose: durable current responsibility-to-packet map for Lot 2 under `docs/engineering/AI-LOT-ORCHESTRATION.md`. Detailed historical evidence remains in packet records, acceptance records, FIRs and Git history.

## Lot 2 goal

Deliver the Venues core as a safe decision-and-action workspace: quick capture, lifecycle/history, spaces/capacity, independent partner ratings, facts/evidence/conflicts, deterministic criteria/blockers/readiness, commercial/access context, photos/documents basics, local/offline integration, gallery/table/detail/compare/deep links and mobile visit workflow.

Integration prerequisite is accepted Lot 0 + Lot 1 on `main` through PR #7; `main` integration truth is `f6da05626f024431230ae46ca1ec8a4becc72a1f`. Lot-2 branch is `lot-2/venues-core`.

## Responsibility coverage

| Required item | Owning Feature/control | Packet(s) | Current state |
|---|---|---|---|
| stable venue identity/project identity, code/name/location and lifecycle/history | FTR-013, FTR-014, VEN-001/002/006, PRD-007, ACC-032 | WP-2.1, WP-2.11 | WP-2.1 **ACCEPTED**; presentation downstream |
| minimal quick-add and duplicate-warning/read-model flow | FTR-013, VEN-012, ACC-021 | WP-2.1, WP-2.10, WP-2.11 | persistence accepted; local/UI downstream |
| spaces, dimensions, commercial capacity | FTR-018, VEN-003/004/005 | WP-2.2, WP-2.11 | WP-2.2 **ACCEPTED** |
| independent member favorites/ratings/preferences | FTR-023, FTR-012 Lot-2, VEN-015/017, PRD-004, ACC-029 | WP-2.2, WP-2.11 | WP-2.2 **ACCEPTED** |
| typed fact definitions/value semantics | FTR-019, FAC-001/003/011/012, ACC-024 | WP-2.3 | **ACCEPTED** |
| multi-source observations/provenance/conflicts/freshness | FTR-020, FAC-002/004..009, ACC-015/025..027 | WP-2.4 | **ACCEPTED** |
| deterministic criteria/blockers/score/readiness | FTR-021, FAC-011/013, VEN-010/011, ACC-022/023/028 | WP-2.5 | **ACCEPTED** |
| missing/stale/conflicting guidance | FTR-022 Lot-2, VEN-007, FAC-006/008/010 | WP-2.5, WP-2.11 | read model accepted; UI downstream |
| offer/date-pricing history | FTR-025 Lot-2, VEN-008 | WP-2.6A | **ACCEPTED** |
| availability observations/read model | FTR-025 Lot-2, VEN-009 | WP-2.6B | **ACCEPTED** |
| contacts/interactions persistence | FTR-026 Lot-2 | WP-2.6C, WP-2.6D, WP-2.11 | C+D **ACCEPTED** |
| contextual access-route observations/origin snapshots | VEN-016, ACC-030 | WP-2.7, WP-2.11 | WP-2.7 **ACCEPTED** |
| remote image references | FTR-024, VEN-013, MED-007/008/013 | WP-2.8A, WP-2.11 | WP-2.8A **ACCEPTED** |
| private archived Venue image lifecycle | FTR-024 private slice, FTR-092 Lot-2, VEN-013, MED-004/005/006/009/010, ACC-055/056/058 | WP-2.8B | **ACCEPTED / COMPLETE** |
| recoverable remote-media metadata lifecycle | FTR-024/FTR-092 Lot-2 continuation, MED-007/010/013 | WP-2.8C | **ACCEPTED / COMPLETE** |
| Venue-linked ordinary private PDFs, provenance and document links | FTR-089 Lot-2; MED-001/002/003/008/010; PRD-008 link slice; file-security/deletion-retention | WP-2.9A + WP-2.9C remediation + WP-2.11 presentation | **WP-2.9A/C + WP-2.11 presentation ACCEPTED**; FIR #17 remains open for later document responsibilities |
| private PDF exact-duplicate detection in the user flow, without cross-project disclosure or automatic logical merge | DOCUMENTS acceptance; FTR-089 presentation | WP-2.9A project-scoped SHA-256/index foundation + WP-2.11 user-facing signal | hash foundation accepted in A; presentation downstream |
| generic project Tags and Venue entity-tag assignments | FTR-093 Lot-2 | WP-2.9B, WP-2.11 | **WP-2.9B + WP-2.11 Venue presentation ACCEPTED**; later target types remain downstream |
| repository/read-model/provider ports and Supabase adapters | architecture, AUTHZ-006/020 | WP-2.1..WP-2.10 + WP-2.9C | accepted packets green through WP-2.10; Pass C and exact-head CI green |
| local cache/pending Venue edits | FTR-028 Lot-2, SYN-001..003/007..011, PWA-003/004/006 | WP-2.10, WP-2.12 | WP-2.10 **ACCEPTED**; WP-2.12 **BLOCKED/FROZEN behind U** — schema v2, pin/package + draft durability GREEN and preserved |
| gallery/table/detail/compare/deep-link workspace | FTR-015/016/017/027, VEN-010/011/014/015 | WP-2.11 | **ACCEPTED / COMPLETE — Pass C gap ∅** |
| mobile visit mode | FTR-028, PWA-004 | WP-2.12 + WP-2.12R/S/T/U support | WP-2.12 **BLOCKED/FROZEN behind U** with shell/package/draft GREEN preserved; WP-2.12R/S/T **ACCEPTED / COMPLETE**; U Pass C gap ∅ / acceptance-record CI `37854906006` 5/5 (final seal CI pending) |
| file/content validation, trusted binary lifecycle, no private production data in public artifacts | MED-001..010/013 + security/quality controls | WP-2.8A/B/C, WP-2.9A, WP-2.9C, WP-2.12 | media and A/C accepted; WP-2.12 local-binary store/logout safety GREEN and preserved while parent is BLOCKED/FROZEN; byte lifecycle/upload completion remains later parent scope |
| explicit permissions/grants/RLS/direct endpoint and Storage allow+deny evidence | AUTHZ-001..009/012/017/018/020 | owning packets WP-2.1..WP-2.9C | accepted authorization evidence green; C local/exact-head evidence green |
| synthetic complex Venue exit fixture/integrated workflows | Lot-2 acceptance | WP-2.12 + Lot Integration Pass | downstream |
| Lot reconciliation + separate Integration Pass | AI-LOT-ORCHESTRATION | after WP-2.1..WP-2.12 | downstream |

Required current-Lot responsibilities minus assigned packet responsibilities: **∅**.

Accepted/evidenced packets: **WP-2.1..WP-2.11**.

## WP-2.9 sequencing

The former monolithic WP-2.9 was split before code because it scored 12 points. Fresh review of WP-2.9A later required a separate remediation/control packet rather than silently expanding A.

- **WP-2.9A** — FTR-089 private Document foundation/product responsibility; **ACCEPTED / COMPLETE** after complete fresh Pass B closed A AR-001..005 and separate Pass C gap ∅ / CI `36542083037` 5/5.
- **WP-2.9C** — trusted Document ingress/lifecycle hardening; **ACCEPTED / COMPLETE** after full fresh Pass B, separate Pass C gap ∅ and exact-head CI `36494697647` 5/5. AR-001..009 are closed for C.
- **WP-2.9B** — generic Tags/entity-tags; Pass A `eeda5cb` / CI `36568868030`, remediation `bd39576` / CI `36572652546`, fresh Pass B/status `f812dc0` / CI `36575013966`, and Pass C acceptance-record `df0a3f0` / CI `36576346730` all passed **5/5**. AR-001/002 CLOSED / VERIFIED, Pass C gap ∅, **ACCEPTED / COMPLETE**.

C adds no new product Feature ID or permission key.

## WP-2.9A summary

- historical size **10**, cohesion **PASS**;
- Pass-A final `e533b5c53d1be074216ccaa92f74281b425de770` / `34826553890` — **5/5 SUCCESS**;
- `WP29A-AR-001/002/003` — **CLOSED / VERIFIED**;
- `WP29A-AR-004` — **CLOSED / VERIFIED in A**; accepted-C C1 remediation challenged in A's complete fresh Pass B;
- `WP29A-AR-005` — **CLOSED / VERIFIED in A**; accepted-C trusted-byte remediation challenged in A's complete fresh Pass B;
- durable AR-004/005 failure record `a58417f79e59e2bd2d2fcb4d202f568c15cfa947` / `34854785427` — **5/5 SUCCESS**.

## WP-2.9C summary

Architecture chain:

ADR 0008 trust/integrity intent → ADR 0009 bounded staging/bodyless promotion → ADR 0010 historical Pages boundary → ADR 0011 private stateless Worker (rejected by deployed Free CPU evidence) → ADR 0012 private per-document Durable Object → ADR 0013 Workers Static Assets ingress (current).

Pass-A evidence:

- `297ecdf3337e8522d6f200a90f96b481a9e6bdb1` / CI `34996240637` — **5/5 SUCCESS**, clean-checkout included.

Review-pending governance evidence:

- `e0854afb62cf5fcf834792fbad425d013b02af56` / CI `34997963836` — **5/5 SUCCESS**, clean-checkout included.

Fresh Pass-B result:

- **REVIEW_FAILED**, then remediation returned the packet to implementation before the current external block;
- record: `docs/roadmap/lot-2/WP-2.9C-PASS-B-REVIEW.md`;
- finding record commit: `deaa2432327b9512068a75635dde6f4c522467ad`;
- remediation-start status: `40b1995ffc31b0de70cb0b0b4411ab8558b83529`;
- remediation-start packet record: `839983bd4fa6c167d66f80e1dc847b8e86a37c32`.

Historical findings and failed-provider chronology:

The lines below describe earlier failed campaigns and preflight states. They
are superseded for current status by the full clean Pass B in
`WP-2.9C-FRESH-PASS-B-DISTINCT-PDF-2026-09-28.md`, which closes AR-001..009
for C. Pass C later accepted C; only parent-A reverification remains pending.

- `WP29C-AR-005` — **MAJOR / IMPLEMENTATION-REMEDIATED / EXACT-HEAD-GREEN** — cleanup/abandon-promotion race remediation implemented; formal closure waits for the later complete fresh Pass B.
- `WP29C-AR-006` — **MAJOR / OPEN / BLOCKING** — ADR 0011 failed deployed stateless Free CPU; ADR 0012 implementation/provider remediation is exact-head green and awaits isolated provider preflight, then a reviewed two-surface CPU evaluator/evidence campaign.
- `WP29C-AR-007` — **MAJOR / IMPLEMENTATION-REMEDIATED / EXACT-HEAD-GREEN** — Pages Function release/deployment/secret remediation implemented; formal closure waits for the later complete fresh Pass B.

Historical findings `WP29C-AR-001..004` remain implementation-green but await a later complete clean fresh Pass B for formal closure.

Repository-side AR-006 execution support and exact-head CI are green. An isolated read-only preflight passed at `d89b3601d066996c3958f30ad9067b34675f8b22` / `35138142860`. The exact evidence candidate `4f40613060b4c9de41a32d99ed43fcf6e12c9791` / `35138368708` deployed to Workers Free Pages preview and completed ten exact-25-MB promotions; however, the provider evidence job failed closed because Cloudflare returned no CPU rows (`providerCpuMeasurements: []`). See `WP-2.9C-AR-006-PROVIDER-ATTEMPT-2026-09-16.md`. AR-006 remains open.

ADR 0011 later produced decisive deployed CPU evidence and was rejected for final execution. ADR 0012 is now implemented: direct same-origin/bodyless Pages → private per-document SQLite Durable Object, with promotion/abandon serialization and Worker-only privileged secret placement. The implementation/provider-remediation candidate `7492dd06677f6d5c5ae7627a1c0129bf841c6175` / CI `36038873857` is **5/5 SUCCESS** including clean checkout; its fresh remediation review passes for isolated provider-preflight scope only. Exact-size evidence remains separately gated.

## Work Packet plan

| Packet | State | Responsibility |
|---|---|---|
| WP-2.1 | **ACCEPTED / COMPLETE** | venue identity/persistence/lifecycle |
| WP-2.2 | **ACCEPTED / COMPLETE** | spaces/capacity/member ratings |
| WP-2.3 | **ACCEPTED / COMPLETE** | fact definitions/typed values |
| WP-2.4 | **ACCEPTED / COMPLETE** | observations/sources/evidence/conflicts |
| WP-2.5 | **ACCEPTED / COMPLETE** | criteria/blockers/readiness |
| WP-2.6A | **ACCEPTED / COMPLETE** | offers/components |
| WP-2.6B | **ACCEPTED / COMPLETE** | availability |
| WP-2.6C | **ACCEPTED / COMPLETE** | contacts |
| WP-2.6D | **ACCEPTED / COMPLETE** | interactions |
| WP-2.7 | **ACCEPTED / COMPLETE** | access-route observations |
| WP-2.8A | **ACCEPTED / COMPLETE** | remote-image metadata/Venue links |
| WP-2.8B | **ACCEPTED / COMPLETE** | private archive lifecycle |
| WP-2.8C | **ACCEPTED / COMPLETE** | recoverable remote metadata lifecycle |
| WP-2.9A | **ACCEPTED / COMPLETE** | FTR-089 foundation; fresh full Pass B and separate Pass C gap ∅ / CI `36542083037` 5/5 |
| WP-2.9C | **ACCEPTED / COMPLETE** | trusted private-Document ingress/lifecycle hardening; full fresh Pass B and Pass C closed AR-001..009 |
| WP-2.9B | **ACCEPTED / COMPLETE** | generic project Tags + Venue entity-tags; FIR #27 downstream; AR-001/002 closed |
| WP-2.10 | **ACCEPTED / COMPLETE** | repositories/local cache/pending offline mutations; Pass C gap ∅ / CI `36849005712` 5/5 |
| WP-2.11 | **ACCEPTED / COMPLETE** | gallery/table/detail/compare/deep-link workspace; Pass C gap ∅ / CI `37240178167` 5/5 |
| WP-2.12 | **BLOCKED — WP-2.12U** | mobile/offline Venue visit + packet E2E completion; tranches 1–3 GREEN; structured reconnect draft #99 preserved; FIR #42 |
| WP-2.12R | **ACCEPTED / COMPLETE** | replay-safe fact-observation command identity; Pass C gap ∅ / CI `37335393969` 5/5; 3 points / cohesion PASS |
| WP-2.12S | **ACCEPTED / COMPLETE** | replay-safe Venue member-rating command identity with expand/switch compatibility; Pass C gap ∅ / CI `37463358444` 5/5; 3 points / cohesion PASS |
| WP-2.12T | **ACCEPTED / COMPLETE** | atomic in-person Fact source provenance link; Pass C gap ∅ / CI `37796626397` 5/5; final seal `091557f2b221923bf38debd9472fe51fbee1cdcc` / CI `37798476372` 5/5; AR-001..004 CLOSED / VERIFIED; 3 points / cohesion PASS |
| WP-2.12U | **ACCEPTED / COMPLETE — final accepted-status seal CI pending** | PostgREST-safe R/S/T conflict signaling; 7 points/cohesion PASS; Fresh Pass-B seal `4be36d5d86d9cc3b2073f9f4720b69ad4f9b72ba` / CI `37853700955` 5/5; AR-001..008 CLOSED / VERIFIED; parent #99 frozen |

## Sequencing

```text
WP-2.1..WP-2.8C [ACCEPTED]
  → WP-2.9C [ACCEPTED]
    → WP-2.9A [ACCEPTED]
                → WP-2.9B [ACCEPTED] → WP-2.10 [ACCEPTED] → WP-2.11 [ACCEPTED] → WP-2.12 [BLOCKED]
                                                                                           ↘ WP-2.12R [ACCEPTED]
                                                                                           ↘ WP-2.12S [ACCEPTED]
                                                                                           ↘ WP-2.12T [ACCEPTED]
                                                                                           ↘ WP-2.12U [ACCEPTED / final seal CI pending]
                                                                                              → WP-2.12 [resume A after U acceptance]
                                                                                                → Lot reconciliation → Integration Pass
```

Only one packet may be active at a time. WP-2.9A/B/C, WP-2.10, WP-2.11 and support packets WP-2.12R/S/T remain terminal accepted. U activation/RED/GREEN have been independently reviewed: PR #115 exact head `a4850a35...` / CI `37850249038` 5/5, clean Codex review and 0 unresolved threads. Canonical merge `45f28bbfa77ec1bf66e344a5d3cf3b1fecb95626` / CI `37852529610` passed 5/5 including clean checkout and shares the exact reviewed tree. AR-001..008 are CLOSED / VERIFIED, Fresh Pass B PASS; Pass C acceptance-record `18b706b3...` / CI `37854906006` passed 5/5 including clean checkout; only the final U accepted-status seal CI remains. Parent WP-2.12 and draft #99 stay BLOCKED/FROZEN until that gate is green. Parent WP-2.12 and draft #99 remain BLOCKED/FROZEN.

## Explicitly outside Lot 2

- full Tasks/follow-up workflow — Lot 3;
- full Budget/scenario engine — Lot 5;
- full Vendors — Lot 7;
- rendered map/routing-provider capability — Lot 9;
- generic offline/sync/PWA hardening beyond Venue-local responsibilities — Lot 10;
- full document version/contract-readiness workflow — later assigned lots;
- real/private candidate venue data migration/import — Lot 12.

## Current reconciliation

```text
required current-Lot-2 responsibilities - assigned product packet responsibilities = ∅
accepted/evidenced packets = WP-2.1..WP-2.11
WP-2.9C = ACCEPTED / COMPLETE — acceptance-record 21accd7f9ab1b845275507b7941a782c5e816a56 / CI 36494697647 5/5 including clean checkout
WP-2.9A = ACCEPTED / COMPLETE — acceptance-record 656398bcd5520cfa56d782023d150eb64317161d / CI 36542083037 5/5 including clean checkout; AR-001..005 closed in A; Pass C gap ∅
fresh Pass-B record = docs/roadmap/lot-2/WP-2.9C-FRESH-PASS-B-DISTINCT-PDF-2026-09-28.md — AR-001..009 CLOSED / VERIFIED for C
implementation-remediated = WP29C-AR-005 cleanup/race; WP29C-AR-007/008 production release contracts
open WP-2.9C/A acceptance gap = ∅; FTR-089 remains IN_PROGRESS for downstream scope
WP-2.9B = ACCEPTED / COMPLETE; AR-001/002 CLOSED / VERIFIED; FTR-093 FIR #27 remains IN_PROGRESS for downstream work
latest exact-size provider attempt = 4f40613060b4c9de41a32d99ed43fcf6e12c9791 / 35138368708 — 10 exact-size promotions successful, providerCpuMeasurements=[]
latest Observability capability attempt = bd3fdb4baab6ef59983e40f77b5b2f44ba6dc8b7 / 35213157767 / job 105175271234 / artifact 10494251279 — deny smoke passed, configured provider query found no attributable numeric CPU, pass=false; dedicated token revoked and GitHub Environment secret deleted
latest private-Worker campaign = 26da10e5aabd7d2a9b6105caef49dd87d6ee58b9 / CI 35977875774 / artifact 10799077529 — eight HTTP-200 exact-size successes, two HTTP-503 failures; read-only provider query: eight 237–273 ms CPU and two exceededCpu
latest ADR 0013 campaign = da19c6cbe339f060955cf2b852e4cfeb1c576023 / CI 36343818988 / artifact 10940276677 — 10/10 finalized and both CPU surfaces within Free limits, but identical PDF content hashes
latest distinct-PDF campaign attempt = 9822ba73fe328839df1a76e515e399e2d20a4287 / CI 36400324210 / artifact 10960925487 — paired ingress/DO version mismatch at marker preflight; zero 25 MB mutations, no acceptance sample
latest partial-marker attempt = fe03af21c0059d6d4344002f58ec4f5b170d65ff / CI 36425931984 / artifact 10972140652 — one valid DO marker, missing ingress marker, zero 25 MB mutations, no acceptance sample
partial-marker correction = 039e8fdddf7003adaa3ed0f433288f13903faf4c / CI 36428473034 — 5/5 including clean checkout; targeted review PASS in WP-2.9C-ADR-0013-PARTIAL-MARKER-REVIEW-2026-09-28.md
review seal = 15d4e4eac6973de5d00798ca849568d6692e898d / CI 36458756536 — 5/5 including clean checkout
latest distinct-PDF campaign = 2303df0c9e8d6f72561ec0ce42514663801229d8 / CI 36459949861 / artifact 10987866873 — provider PASS; 10 unique 25 MB PDF hashes, 10 finalized flows, 10 exact-version CPU readings per Workers Free surface
evidence-bound result = 78fb24e4dcb9551b041edd9079f0ac3c5b1e973a / CI 36461954215 — 5/5 including clean checkout; provider jobs skipped
Free-tier reconciliation = d3dad1623f0a878b43637200db31e7cf909f9869 / CI 36463139444 — 5/5 including clean checkout; provider jobs skipped
review-pending seal = 44fc3e14bdc55dc6ab0b3613a82a9eea7daa6293 / CI 36464200682 — 5/5 including clean checkout; full fresh Pass B PASS
Pass-B/status seal = 66b9396fc06b540a0a51a1fa948933c170728d65 / CI 36465390803 — 5/5 including clean checkout; Pass C reconciliation gap ∅ in WP-2.9C-ACCEPTANCE.md
acceptance-record seal = 21accd7f9ab1b845275507b7941a782c5e816a56 / CI 36494697647 — 5/5 including clean checkout; C ACCEPTED
A-resumption seal = c8f3dfd441e7ad583613c8b94bd9197b19b829fb / CI 36495622949 — 5/5 including clean checkout; A IN_PROGRESS
A reintegration record = WP-2.9A-REINTEGRATION-2026-09-29.md; Storage-RLS obsolete UPDATE wording corrected and sealed 5/5
A full review = WP-2.9A-FRESH-PASS-B-2026-09-29.md — PASS; no open A finding
A Pass C = WP-2.9A-ACCEPTANCE.md — ACCEPTED / gap ∅; record 656398bcd5520cfa56d782023d150eb64317161d / CI 36542083037 5/5
WP-2.10 = ACCEPTED / COMPLETE — Pass C gap ∅; acceptance-record `a2d48341515a516651d11454c3c5e89c01896c21` / CI `36849005712` 5/5 including clean checkout; FTR-028 remains IN_PROGRESS for WP-2.12
WP-2.11 = ACCEPTED / COMPLETE — Pass C gap ∅; acceptance-record `3167a380521119e9650859543778b040527332e2` / CI `37240178167` 5/5; final seal `0a2d051d3f0a45b638f5c1b5f8c81acf36491c36` / CI `37240817336` 5/5; FTR-015/016/017/027 closed completed
WP-2.12 = BLOCKED / FROZEN — tranches 1–3 GREEN through `1794a3d9...` / `37280907551`; R/S/T ACCEPTED; upstream retry-safety support U required before draft #99 resumes; FIR #42
WP-2.12R = ACCEPTED / COMPLETE — final support seal `cdad9eb82052ac3e2296769e5381b2371558ec4d` / CI `37341157497` 5/5
WP-2.12S = ACCEPTED / COMPLETE — final support seal `93f2916db125139f7694e56248c188a2cf21f794` / CI `37465538267` 5/5; AR-001/002/003 CLOSED / VERIFIED
WP-2.12T = ACCEPTED / COMPLETE — Pass C gap ∅; acceptance-record `6f460afc1d12134bc12f08e51145f29b01cf6e0f` / CI `37796626397` 5/5; final support seal `091557f2b221923bf38debd9472fe51fbee1cdcc` / CI `37798476372` 5/5 including clean checkout; AR-001..004 CLOSED / VERIFIED
WP-2.12U = ACCEPTED / COMPLETE — Pass C gap ∅; acceptance-record `18b706b3d3a3ba1a97691c4af18e58a46fb6424b` / CI `37854906006` 5/5 including clean checkout; final accepted-status seal exact-head CI pending; historical AR-001..008 CLOSED / VERIFIED; parent #99 frozen.
next permitted action = final WP-2.12U accepted support seal exact-head 5/5 CI → separate parent WP-2.12 resumption-governance gate exact-head 5/5 CI → only then reconcile draft #99; parent #99/media blocked meanwhile.
media-byte durability/upload remains a separate later parent tranche; no provider rerun is authorized
```

Lot-level reconciliation remains intentionally incomplete until WP-2.12 and the separate Lot Integration Pass are accepted; WP-2.1..WP-2.11 are complete.
