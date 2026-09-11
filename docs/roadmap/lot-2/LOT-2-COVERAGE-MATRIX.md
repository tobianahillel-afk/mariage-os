# Lot 2 — Coverage Matrix and Work Packet Plan

Status: **IN_PROGRESS — WP-2.1..WP-2.8B ACCEPTED; WP-2.8C PLANNED / NEXT**

Purpose: durable current responsibility-to-packet map for Lot 2 under `docs/engineering/AI-LOT-ORCHESTRATION.md`. Detailed historical packet evidence remains in each packet record and Git history; the immediate pre-WP-2.8B-acceptance matrix is recoverable at commit `70c251fee7a54bf1f5de9e3fca4dee6ce067d778`.

## Lot 2 goal

Deliver the Venues core as a safe decision-and-action workspace: quick capture, lifecycle/history, spaces/capacity, independent partner ratings, facts/evidence/conflicts, deterministic criteria/blockers/readiness, commercial/access context, photos/documents basics, local/offline integration, gallery/table/detail/compare/deep links and mobile visit workflow.

Lot 2 reuses the accepted Lot-1 project/auth/RLS/local-data/Storage foundations and does not pre-implement later Tasks, Map, full Sync/PWA hardening, Import, Budget or Vendor lots.

## Integration prerequisite

- accepted Lot 0 + Lot 1 promoted to `main` through PR #7;
- `main` integration truth: `f6da05626f024431230ae46ca1ec8a4becc72a1f`;
- promotion CI `34030211097`: **5/5 SUCCESS**, clean-checkout included;
- Lot-2 branch: `lot-2/venues-core` from that exact main commit.

## Required Feature/current-lot responsibilities

| Required item | Owning Feature/control | Packet(s) | Current evidence/state |
|---|---|---|---|
| stable venue UUID/project identity, code/name/location core and lifecycle/history | FTR-013, FTR-014, VEN-001/002/006, PRD-007, ACC-032 | WP-2.1, WP-2.11 | WP-2.1 **ACCEPTED** foundation; presentation later WP-2.11 |
| minimal quick-add and later duplicate-warning/read-model flow | FTR-013, VEN-012, ACC-021 | WP-2.1, WP-2.10, WP-2.11 | persistence accepted; local/UI downstream |
| spaces, dimensions and commercial capacity | FTR-018, VEN-003/004 + physical-input VEN-005 | WP-2.2, WP-2.11 | WP-2.2 **ACCEPTED**; UI downstream |
| independent member favorites/ratings/preferences | FTR-023, FTR-012 Lot-2, VEN-015/017, PRD-004, ACC-029 | WP-2.2, WP-2.11 | WP-2.2 **ACCEPTED**; UI downstream |
| typed fact definitions, explicit fact state/value semantics | FTR-019, FAC-001/003/011/012, ACC-024 | WP-2.3 | WP-2.3 **ACCEPTED** |
| multi-source observations, provenance, conflicts, freshness/evidence | FTR-020, FAC-002/004..009, ACC-015/025..027 | WP-2.4 | WP-2.4 **ACCEPTED** |
| deterministic criteria, blockers, score/readiness explanation | FTR-021, FAC-011/013, VEN-010/011, ACC-022/023/028 | WP-2.5 | WP-2.5 **ACCEPTED** |
| missing/stale/conflicting guidance without implicit Task creation | FTR-022 Lot-2, VEN-007, FAC-006/008/010 | WP-2.5, WP-2.11 | read model accepted; presentation downstream |
| offer/date-pricing history without full Budget engine | FTR-025 Lot-2, VEN-008 | WP-2.6A | WP-2.6A **ACCEPTED** |
| availability observations and relevant/latest read model | FTR-025 Lot-2, VEN-009 | WP-2.6B | WP-2.6B **ACCEPTED** |
| contacts/interactions/quote-follow-up persistence without Task workflow | FTR-026 Lot-2 | WP-2.6C, WP-2.6D, WP-2.11 | C+D **ACCEPTED** persistence; UI downstream |
| contextual access-route observations, immutable origin snapshots | VEN-016, ACC-030, access responsibility | WP-2.7, WP-2.11 | WP-2.7 **ACCEPTED**; presentation downstream |
| remote image references | FTR-024, VEN-013, MED-007/008/013 | WP-2.8A, WP-2.11 | WP-2.8A **ACCEPTED**; rendering/UI downstream |
| private archived Venue image lifecycle, immutable originals/derivatives, hash detection, orphan recovery, private Storage | FTR-024 private slice, FTR-092 Lot-2, VEN-013, MED-004/005/006/009/010, ACC-055/056/058 | WP-2.8B | **WP-2.8B ACCEPTED / COMPLETE**; `WP-2.8B-ACCEPTANCE.md`, responsibility gap **∅** |
| recoverable remote-media metadata soft-delete/restore | FTR-024/FTR-092 assigned continuation | WP-2.8C | **PLANNED / NEXT**; activation revalidation required |
| venue-linked ordinary documents and generic tag/link basics | FTR-089 Lot-2, FTR-093 Lot-2, MED-001..003/010 | WP-2.9, WP-2.11 | PLANNED |
| repository/read-model ports and Supabase adapters follow accepted architecture | architecture, AUTHZ-006/020 | WP-2.1..WP-2.10 | accepted packets green; future packets responsible when introduced |
| local cache/pending Venue edits reuse account+project+device LocalProjectStore | FTR-028 Lot-2, SYN-001..003/007..011, PWA-003/004/006 | WP-2.10, WP-2.12 | PLANNED |
| gallery browse surface and robust states | FTR-015 | WP-2.11 | PLANNED |
| analytical table with controlled columns/personal preferences | FTR-016, FTR-012 Lot-2, VEN-015 | WP-2.11 | PLANNED |
| summary-first Venue detail | FTR-017 | WP-2.11 | PLANNED |
| compare 2–5 candidates, blockers before score, ratings separate from facts | FTR-027, VEN-010/011 | WP-2.11 | PLANNED |
| protected Venue deep links and generic outsider denial | routing responsibility, VEN-014 | WP-2.11 | PLANNED |
| mobile visit mode with cached detail/checklist/notes/measurement/photo/rating/finish summary | FTR-028, PWA-004 | WP-2.12 | PLANNED |
| file/content validation and no private production data in public fixtures/artifacts | MED-002/003/009/010/013 + security/quality controls | WP-2.8A/B/C, WP-2.9, WP-2.12 as applicable | A+B accepted evidence; future owners remain |
| explicit permissions/grants/RLS and direct allow+deny evidence for every new resource | AUTHZ-001..009/012/017/018/020 | owning packets WP-2.1..WP-2.9 | accepted packet pgTAP green; future owners remain |
| synthetic complex Venue exit fixture and integrated workflows | Lot-2 acceptance | WP-2.12 + Lot Integration Pass | downstream |
| Lot reconciliation + separate Integration Pass | AI-LOT-ORCHESTRATION | after WP-2.1..WP-2.12 | downstream |

Required current-lot responsibilities minus assigned packet responsibilities: **∅**.

Accepted/evidenced packet responsibilities so far: **WP-2.1, WP-2.2, WP-2.3, WP-2.4, WP-2.5, WP-2.6A, WP-2.6B, WP-2.6C, WP-2.6D, WP-2.7, WP-2.8A, WP-2.8B**.

Required WP-2.8B responsibilities minus accepted/evidenced WP-2.8B responsibilities: **∅**. This accepts only its assigned private-media foundation. Whole `FTR-024` / `FTR-092` remains incomplete because WP-2.8C, WP-2.11, WP-2.12 and later Lots 10/11 retain downstream responsibilities.

## Work Packet plan

| Packet | State | Current responsibility / evidence |
|---|---|---|
| WP-2.1 | **ACCEPTED / COMPLETE** | venue identity/persistence/lifecycle; governance CI `34040803267` 5/5 |
| WP-2.2 | **ACCEPTED / COMPLETE** | spaces/capacity/member ratings; governance CI `34048565452` 5/5 |
| WP-2.3 | **ACCEPTED / COMPLETE** | fact definitions/typed values; final reviewed `2e3194f...` / `34068703691` 5/5 |
| WP-2.4 | **ACCEPTED / COMPLETE** | observations/sources/evidence/conflicts; `93262f9...` / `34137822804` 5/5 |
| WP-2.5 | **ACCEPTED / COMPLETE** | criteria/blockers/readiness; acceptance `902ac6f...` / `34167062632` 5/5 |
| WP-2.6A | **ACCEPTED / COMPLETE** | offers/components; `186933e...` / `34238484533` 5/5 |
| WP-2.6B | **ACCEPTED / COMPLETE** | availability; `8911f15...` / `34275967235` 5/5 |
| WP-2.6C | **ACCEPTED / COMPLETE** | contacts; `f6c93b7...` / `34287865010` attempt 2 5/5 |
| WP-2.6D | **ACCEPTED / COMPLETE** | interactions; `7670171...` / `34322712448` 5/5 |
| WP-2.7 | **ACCEPTED / COMPLETE** | access-route observations; `db1dae6...` / `34377221997` 5/5, gap ∅ |
| WP-2.8A | **ACCEPTED / COMPLETE** | remote-image metadata/Venue links; packet acceptance `925cf86...` / `34418721439`, coverage `432e0cf...` / `34420275595`, both 5/5 |
| WP-2.8B | **ACCEPTED / COMPLETE** | private archive lifecycle; Pass-C evidence `WP-2.8B-ACCEPTANCE.md`; gap ∅ |
| WP-2.8C | **PLANNED / NEXT** | recoverable remote-media metadata lifecycle; revalidate before READY |
| WP-2.9 | PLANNED | venue document/tag/link basics |
| WP-2.10 | PLANNED | repositories/local cache/pending offline mutations |
| WP-2.11 | PLANNED | gallery/table/detail/compare/deep-link workspace |
| WP-2.12 | PLANNED | mobile/offline Venue visit + packet E2E completion |

## WP-2.8 decomposition and current evidence

### WP-2.8A — remote metadata

State: **ACCEPTED / COMPLETE**.

Accepted evidence includes privacy-safe/canonical remote URL persistence, same-project Venue media links, replay/authorization/provider parity and the A/B/C coverage reconciliation. A does not claim private bytes, recoverable metadata deletion, rendering or offline capture.

### WP-2.8B — private archived media lifecycle

State: **ACCEPTED / COMPLETE**.

- activation freeze `dd2b03c736210f5145ece58ef8b4f55918c43b00` / `34421686462` — 5/5;
- READY `3e6fe6683cccb21ffa0ef96b87911280ab07737f` / `34423597208` — 5/5;
- Pass A `150c10c07452748e3092e316a3cb9a26f272ff3e` / `34555183344` — 5/5;
- first fresh Pass B `a23e6925f4d95e5d49cdea5b4e62b899cdd7a605` / `34555832894` — 5/5;
- Pass-C MED-006 diagnostic `4eddca8aa94a2ed95d37bac47b8f3efeb3b4faf4` / `34556856411` — expected RED;
- remediation `f815844d9f4a2c62575ee91530af94febf78dab0` / `34605466532` — 5/5;
- fresh affected Pass B after remediation — **PASS**, findings carried = ∅;
- Pass-C entry `70c251fee7a54bf1f5de9e3fca4dee6ce067d778` / `34614442341` — 5/5;
- mechanical reconciliation `WP-2.8B-ACCEPTANCE.md` — **PASS**, required-minus-evidenced = ∅.

Accepted B guarantees include private JPEG/PNG/WebP validation, 20,000,000-byte/resource bounds, pending/ready visibility, exact reservation-bound Storage RLS, immutable originals, append-version thumbnail/preview derivatives, explicit interrupted-upload recovery/cleanup, and project-scoped detect-only SHA-256 duplicate receipts with durable replay snapshots and no cross-project disclosure/automatic merge.

The final acceptance-governance HEAD containing this matrix/packet/status reconciliation must itself pass exact-head 5/5 before B acceptance is considered durable.

### WP-2.8C — recoverable remote metadata

State: **PLANNED / NEXT**. Current pass: **PLAN**.

Semantic dependency WP-2.8A+B: satisfied only after B final acceptance-governance CI is green. Before `PLANNED → READY`, revalidate the provisional 8-point sizing, the still-open optimistic revision/receipt activation detail, current schema/RPC compatibility and responsibility map. C remains limited to recoverable soft-delete/restore for A-created remote Venue references; it does not own private binary lifecycle, global 30-day purge/trash UI or presentation/offline responsibilities.

## Sequencing

```text
WP-2.1 [ACCEPTED]
  → WP-2.2 [ACCEPTED]
    → WP-2.3 [ACCEPTED]
      → WP-2.4 [ACCEPTED]
        → WP-2.5 [ACCEPTED]
          → WP-2.6A/B/C/D [ACCEPTED]
            → WP-2.7 [ACCEPTED]
              → WP-2.8A [ACCEPTED]
                → WP-2.8B [ACCEPTED]
                  → WP-2.8C [PLANNED / NEXT]
                    → WP-2.9
                      → WP-2.10
                        → WP-2.11
                          → WP-2.12
                            → Lot reconciliation
                              → Integration Pass
```

Only one packet may be active at a time. WP-2.8C product implementation is not authorized merely because WP-2.8B acceptance documentation exists; C requires its own activation revalidation, READY transition and exact-head CI gate.

## Explicitly outside Lot 2

- full Tasks/follow-up workflow — Lot 3;
- full Budget/scenario engine — Lot 5;
- full Vendors — Lot 7;
- rendered map/routing-provider capability — Lot 9;
- generic offline/sync/PWA hardening beyond Venue-local responsibilities — Lot 10;
- full document/contract workflow — Lots 7/11 according to feature assignment;
- real/private candidate venue data migration/import — Lot 12.

## Current reconciliation

```text
required current-Lot-2 responsibilities
- assigned packet responsibilities
= ∅

accepted/evidenced packets
= WP-2.1..WP-2.8B

WP-2.8B required responsibilities
- WP-2.8B accepted/evidenced responsibilities
= ∅

open WP-2.8B BLOCKING = ∅
open WP-2.8B MAJOR = ∅
open WP-2.8B MINOR carried into acceptance = ∅
```

Lot-level accepted/evidenced reconciliation remains intentionally incomplete until WP-2.8C..WP-2.12 and the separate Lot Integration Pass are accepted.
