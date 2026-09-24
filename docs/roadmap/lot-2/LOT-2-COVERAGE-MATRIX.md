# Lot 2 — Coverage Matrix and Work Packet Plan

Status: **IN_PROGRESS — WP-2.1..WP-2.8C ACCEPTED; WP-2.9A BLOCKED; WP-2.9C ADR 0012 PROVIDER PREFLIGHT GATE / AR-006 OPEN; WP-2.9B PLANNED / AFTER A**

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
| Venue-linked ordinary private PDFs, provenance and document links | FTR-089 Lot-2; MED-001/002/003/008/010; PRD-008 link slice; file-security/deletion-retention | WP-2.9A + WP-2.9C remediation + WP-2.11 | **WP-2.9A BLOCKED**; **WP-2.9C IN_PROGRESS / ADR 0012 PREFLIGHT GATE**; AR-006 OPEN; FIR #17 |
| generic project Tags and Venue entity-tag assignments | FTR-093 Lot-2 | WP-2.9B, WP-2.11 | **PLANNED / AFTER A** |
| repository/read-model/provider ports and Supabase adapters | architecture, AUTHZ-006/020 | WP-2.1..WP-2.10 + WP-2.9C | accepted packets green; C repository remediation green, provider evidence blocked |
| local cache/pending Venue edits | FTR-028 Lot-2, SYN-001..003/007..011, PWA-003/004/006 | WP-2.10, WP-2.12 | PLANNED |
| gallery/table/detail/compare/deep-link workspace | FTR-015/016/017/027, VEN-010/011/014/015 | WP-2.11 | PLANNED |
| mobile visit mode | FTR-028, PWA-004 | WP-2.12 | PLANNED |
| file/content validation, trusted binary lifecycle, no private production data in public artifacts | MED-001..010/013 + security/quality controls | WP-2.8A/B/C, WP-2.9A, WP-2.9C, WP-2.12 | media accepted; C repository remediations green; AR-006 provider evidence blocked |
| explicit permissions/grants/RLS/direct endpoint and Storage allow+deny evidence | AUTHZ-001..009/012/017/018/020 | owning packets WP-2.1..WP-2.9C | accepted authorization evidence green; C local/exact-head evidence green |
| synthetic complex Venue exit fixture/integrated workflows | Lot-2 acceptance | WP-2.12 + Lot Integration Pass | downstream |
| Lot reconciliation + separate Integration Pass | AI-LOT-ORCHESTRATION | after WP-2.1..WP-2.12 | downstream |

Required current-Lot responsibilities minus assigned packet responsibilities: **∅**.

Accepted/evidenced packets: **WP-2.1..WP-2.8C**.

## WP-2.9 sequencing

The former monolithic WP-2.9 was split before code because it scored 12 points. Fresh review of WP-2.9A later required a separate remediation/control packet rather than silently expanding A.

- **WP-2.9A** — FTR-089 private Document foundation/product responsibility; currently **BLOCKED** until C is accepted.
- **WP-2.9C** — trusted Document ingress/lifecycle hardening; currently **IN_PROGRESS — ADR 0012 provider preflight gate; WP29C-AR-006 OPEN / BLOCKING**.
- **WP-2.9B** — generic Tags/entity-tags; remains **PLANNED / AFTER A**.

C adds no new product Feature ID or permission key.

## WP-2.9A summary

- historical size **10**, cohesion **PASS**;
- Pass-A final `e533b5c53d1be074216ccaa92f74281b425de770` / `34826553890` — **5/5 SUCCESS**;
- `WP29A-AR-001/002/003` — **CLOSED / VERIFIED**;
- `WP29A-AR-004` — **MAJOR / OPEN in parent**; C1 remediation implemented in C, closure waits for C acceptance + A reverification;
- `WP29A-AR-005` — **MAJOR / OPEN in parent**; trusted-byte remediation implemented in C, closure waits for C acceptance + A reverification;
- durable AR-004/005 failure record `a58417f79e59e2bd2d2fcb4d202f568c15cfa947` / `34854785427` — **5/5 SUCCESS**.

## WP-2.9C summary

Architecture chain:

ADR 0008 trust/integrity intent → ADR 0009 bounded staging/bodyless promotion → ADR 0010 same-origin Cloudflare Pages Function promotion → ADR 0011 private stateless Worker (rejected by deployed Free CPU evidence) → ADR 0012 direct Pages → per-document Durable Object (current).

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

Current findings:

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
| WP-2.9A | **BLOCKED** | FTR-089 foundation; waits for C acceptance |
| WP-2.9C | **IN_PROGRESS — ADR 0012 PROVIDER PREFLIGHT GATE** | trusted private-Document ingress/lifecycle hardening; AR-005/007 implementation-remediated, AR-006 open |
| WP-2.9B | **PLANNED / AFTER A** | generic project Tags + Venue entity-tags |
| WP-2.10 | PLANNED | repositories/local cache/pending offline mutations |
| WP-2.11 | PLANNED | gallery/table/detail/compare/deep-link workspace |
| WP-2.12 | PLANNED | mobile/offline Venue visit + packet E2E completion |

## Sequencing

```text
WP-2.1..WP-2.8C [ACCEPTED]
  → WP-2.9A [BLOCKED until WP-2.9C ACCEPTED]
    → WP-2.9C [IN_PROGRESS — ADR 0012 PROVIDER PREFLIGHT GATE]
      → exact-head green review/status handoff
        → one bounded [AR006-DO-PREFLIGHT]
          → green ? implement/review two-surface CPU evaluator
            → reviewed [AR006-DO-EVIDENCE] exact-25-MB campaign
              → valid evidence ? exact-head verify → REVIEW_PENDING → fresh Pass B
                → clean ? ACCEPTANCE_PENDING → Pass C → WP-2.9C ACCEPTED
                  → WP-2.9A reverification/fresh B/C
                    → WP-2.9B → WP-2.10 → WP-2.11 → WP-2.12
                      → Lot reconciliation → Integration Pass
```

Only one packet may be implementing at a time. WP-2.9A is blocked, not concurrently implementing. Pass C, A resumption and WP-2.9B are forbidden until the canonical transitions permit them.

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
accepted/evidenced packets = WP-2.1..WP-2.8C
WP-2.9A = BLOCKED until WP-2.9C ACCEPTED
WP-2.9C = IN_PROGRESS — ADR 0012 PROVIDER PREFLIGHT GATE; WP29C-AR-006 OPEN
fresh Pass-B record = docs/roadmap/lot-2/WP-2.9C-PASS-B-REVIEW.md
implementation-remediated = WP29C-AR-005 MAJOR — cleanup/abandon-promotion race
open/blocking = WP29C-AR-006 MAJOR — ADR 0012 isolated preflight + reviewed two-surface exact-25-MB CPU evidence still required
implementation-remediated = WP29C-AR-007 MAJOR — Pages Function deployment/secret operations gap
WP-2.9B = PLANNED / AFTER A
latest exact-size provider attempt = 4f40613060b4c9de41a32d99ed43fcf6e12c9791 / 35138368708 — 10 exact-size promotions successful, providerCpuMeasurements=[]
latest Observability capability attempt = bd3fdb4baab6ef59983e40f77b5b2f44ba6dc8b7 / 35213157767 / job 105175271234 / artifact 10494251279 — deny smoke passed, configured provider query found no attributable numeric CPU, pass=false; dedicated token revoked and GitHub Environment secret deleted
latest private-Worker campaign = 26da10e5aabd7d2a9b6105caef49dd87d6ee58b9 / CI 35977875774 / artifact 10799077529 — eight HTTP-200 exact-size successes, two HTTP-503 failures; read-only provider query: eight 237–273 ms CPU and two exceededCpu
next permitted action = exact-head-green ADR 0012 review/status handoff → one bounded [AR006-DO-PREFLIGHT]; exact-size evidence remains disabled pending evaluator review
Pass C forbidden until valid AR-006 evidence, exact-head verification and a later clean Pass B yield ACCEPTANCE_PENDING
```

Lot-level reconciliation remains intentionally incomplete until WP-2.9A/C/B, WP-2.10..WP-2.12 and the separate Lot Integration Pass are accepted.
