# Lot 2 — Coverage Matrix and Work Packet Plan

Status: **IN_PROGRESS — WP-2.1..WP-2.8C ACCEPTED; WP-2.9A READY / CURRENT; WP-2.9B PLANNED**

Purpose: durable current responsibility-to-packet map for Lot 2 under `docs/engineering/AI-LOT-ORCHESTRATION.md`. Detailed historical packet evidence remains in each packet record, acceptance record, FIR and Git history.

## Lot 2 goal

Deliver the Venues core as a safe decision-and-action workspace: quick capture, lifecycle/history, spaces/capacity, independent partner ratings, facts/evidence/conflicts, deterministic criteria/blockers/readiness, commercial/access context, photos/documents basics, local/offline integration, gallery/table/detail/compare/deep links and mobile visit workflow.

Lot 2 reuses the accepted Lot-1 project/auth/RLS/local-data/Storage foundations and does not pre-implement later Tasks, Map, full Sync/PWA hardening, Import, Budget or Vendor lots.

## Integration prerequisite

- accepted Lot 0 + Lot 1 promoted to `main` through PR #7;
- `main` integration truth: `f6da05626f024431230ae46ca1ec8a4becc72a1f`;
- promotion CI `34030211097`: **5/5 SUCCESS**, clean-checkout included;
- Lot-2 branch: `lot-2/venues-core`.

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
| private archived Venue image lifecycle, immutable originals/derivatives, hash detection, orphan recovery, private Storage | FTR-024 private slice, FTR-092 Lot-2, VEN-013, MED-004/005/006/009/010, ACC-055/056/058 | WP-2.8B | **ACCEPTED / COMPLETE**, gap ∅ |
| recoverable remote-media metadata soft-delete/restore | FTR-024/FTR-092 Lot-2 continuation; MED-007/010/013 applicable; MED-008 regression; deletion-retention rule | WP-2.8C | **ACCEPTED / COMPLETE**, gap ∅; durable closure `7f97ab8...` / `34786974129` 5/5 |
| Venue-linked ordinary private documents, PDF Storage lifecycle, provenance and document links | FTR-089 Lot-2; MED-001/002/003/008/010; PRD-008 current-Lot link slice; file-security/deletion-retention controls | WP-2.9A, WP-2.11 | **WP-2.9A READY / A-READY / CURRENT**; split freeze `40f17aba...` / `34788217062` 5/5; FIR #17; presentation downstream WP-2.11 |
| generic project Tags and Venue entity-tag assignments | FTR-093 Lot-2; PHYSICAL-SCHEMA tags/entity_tags; deletion-retention; same-project target integrity | WP-2.9B, WP-2.11 | **WP-2.9B PLANNED / AFTER A**; UI downstream |
| repository/read-model ports and Supabase adapters follow accepted architecture | architecture, AUTHZ-006/020 | WP-2.1..WP-2.10 | accepted packets green; future packets responsible when introduced |
| local cache/pending Venue edits reuse account+project+device LocalProjectStore | FTR-028 Lot-2, SYN-001..003/007..011, PWA-003/004/006 | WP-2.10, WP-2.12 | PLANNED |
| gallery browse surface and robust states | FTR-015 | WP-2.11 | PLANNED |
| analytical table with controlled columns/personal preferences | FTR-016, FTR-012 Lot-2, VEN-015 | WP-2.11 | PLANNED |
| summary-first Venue detail | FTR-017 | WP-2.11 | PLANNED |
| compare 2–5 candidates, blockers before score, ratings separate from facts | FTR-027, VEN-010/011 | WP-2.11 | PLANNED |
| protected Venue deep links and generic outsider denial | routing responsibility, VEN-014 | WP-2.11 | PLANNED |
| mobile visit mode with cached detail/checklist/notes/measurement/photo/rating/finish summary | FTR-028, PWA-004 | WP-2.12 | PLANNED |
| file/content validation and no private production data in public fixtures/artifacts | MED-002/003/009/010/013 + security/quality controls | WP-2.8A/B/C, WP-2.9A, WP-2.12 as applicable | media foundation accepted; 2.9A READY; future owners remain |
| explicit permissions/grants/RLS and direct allow+deny evidence for every new resource | AUTHZ-001..009/012/017/018/020 | owning packets WP-2.1..WP-2.9B | accepted packet evidence green; 2.9A/B direct matrices required |
| synthetic complex Venue exit fixture and integrated workflows | Lot-2 acceptance | WP-2.12 + Lot Integration Pass | downstream |
| Lot reconciliation + separate Integration Pass | AI-LOT-ORCHESTRATION | after WP-2.1..WP-2.12 | downstream |

Required current-lot responsibilities minus assigned packet responsibilities: **∅**.

Accepted/evidenced packet responsibilities so far: **WP-2.1, WP-2.2, WP-2.3, WP-2.4, WP-2.5, WP-2.6A, WP-2.6B, WP-2.6C, WP-2.6D, WP-2.7, WP-2.8A, WP-2.8B, WP-2.8C**.

The pre-activation 2.9 decomposition changed packet boundaries only; the split freeze is now mechanically green but does not claim implementation evidence for A/B.

## WP-2.9 pre-activation split reconciliation

The former single WP-2.9 was conservatively **12 points** and therefore split before code under `AI-LOT-ORCHESTRATION.md`.

### WP-2.9A

- FTR-089 current-Lot private-document foundation;
- `documents` + `document_links`;
- `MED-001/002/003/008/010`;
- private PDF validation/storage/recovery/read/download;
- same-project Venue links and Source provenance;
- recoverable metadata soft-delete/restore;
- existing `documents.read` / `documents.write` authorization;
- size **10**, cohesion review **PASS**;
- split/specification freeze `40f17aba802e7faed9eade6096e2f3629fc80654` / CI `34788217062` — **5/5 SUCCESS**, clean-checkout included;
- FIR `#17 / FTR-089`;
- current state **READY / A-READY**.

The inclusion of `MED-008` repairs a traceability omission in the old WP-2.9 row; the frozen requirement-feature matrix already maps MED-008 to FTR-089.

### WP-2.9B

- FTR-093 current-Lot generic tagging foundation;
- `tags` + `entity_tags`;
- project tag dictionary + same-project Venue assignments;
- tag recovery semantics;
- existing permissions reused: `project.read`, `project.settings.update`, `venues.read`, `venues.write`;
- size **8**, cohesion **PASS**;
- remains **PLANNED / AFTER A**.

Required former-WP-2.9 current-Lot responsibilities minus assigned WP-2.9A/B responsibilities: **∅**.

## Work Packet plan

| Packet | State | Current responsibility / evidence |
|---|---|---|
| WP-2.1 | **ACCEPTED / COMPLETE** | venue identity/persistence/lifecycle; governance CI `34040803267` 5/5 |
| WP-2.2 | **ACCEPTED / COMPLETE** | spaces/capacity/member ratings; governance CI `34048565452` 5/5 |
| WP-2.3 | **ACCEPTED / COMPLETE** | fact definitions/typed values; `2e3194f...` / `34068703691` 5/5 |
| WP-2.4 | **ACCEPTED / COMPLETE** | observations/sources/evidence/conflicts; `93262f9...` / `34137822804` 5/5 |
| WP-2.5 | **ACCEPTED / COMPLETE** | criteria/blockers/readiness; `902ac6f...` / `34167062632` 5/5 |
| WP-2.6A | **ACCEPTED / COMPLETE** | offers/components; `186933e...` / `34238484533` 5/5 |
| WP-2.6B | **ACCEPTED / COMPLETE** | availability; `8911f15...` / `34275967235` 5/5 |
| WP-2.6C | **ACCEPTED / COMPLETE** | contacts; `f6c93b7...` / `34287865010` attempt 2 5/5 |
| WP-2.6D | **ACCEPTED / COMPLETE** | interactions; `7670171...` / `34322712448` 5/5 |
| WP-2.7 | **ACCEPTED / COMPLETE** | access-route observations; `db1dae6...` / `34377221997` 5/5, gap ∅ |
| WP-2.8A | **ACCEPTED / COMPLETE** | remote-image metadata/Venue links; packet acceptance + coverage reconciliation both 5/5 |
| WP-2.8B | **ACCEPTED / COMPLETE** | private archive lifecycle; `WP-2.8B-ACCEPTANCE.md`, gap ∅ |
| WP-2.8C | **ACCEPTED / COMPLETE** | recoverable remote metadata lifecycle; `WP-2.8C-ACCEPTANCE.md`, gap ∅; durable closure `7f97ab8...` / `34786974129` 5/5 |
| WP-2.9A | **READY / A-READY / CURRENT** | Venue-linked private PDF/document foundation; split freeze `40f17aba...` / `34788217062` 5/5; FIR #17; READY exact-head CI now required |
| WP-2.9B | **PLANNED / AFTER A** | generic project Tags + Venue entity-tags; cannot activate until A accepted |
| WP-2.10 | PLANNED | repositories/local cache/pending offline mutations |
| WP-2.11 | PLANNED | gallery/table/detail/compare/deep-link workspace |
| WP-2.12 | PLANNED | mobile/offline Venue visit + packet E2E completion |

## Accepted WP-2.8 media foundation

### WP-2.8A

State: **ACCEPTED / COMPLETE** — remote image metadata/Venue links; private bytes/recovery/rendering remained outside A.

### WP-2.8B

State: **ACCEPTED / COMPLETE** — private archived media lifecycle, immutable originals/derivatives, project-scoped hash detection, Storage authorization and recovery; required-minus-evidenced **∅**.

### WP-2.8C

State: **ACCEPTED / COMPLETE** — recoverable remote metadata lifecycle; acceptance-governance `ecaa3900bbccd070e613e51bc99f3f133b436d0f` / `34786115925` and durable closure `7f97ab8bab9c60ba538b5c900845ca77e9b9f34c` / `34786974129`, both **5/5 SUCCESS**; required-minus-implemented-minus-verified **∅**.

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
                  → WP-2.8C [ACCEPTED]
                    → WP-2.9A [READY / CURRENT]
                      → WP-2.9B [PLANNED]
                        → WP-2.10
                          → WP-2.11
                            → WP-2.12
                              → Lot reconciliation
                                → Integration Pass
```

Only one packet may be active. WP-2.9A product implementation remains prohibited until this READY governance head passes exact-head 5/5 and a separate `READY → IN_PROGRESS / A-IMPLEMENT` head also passes exact-head 5/5. WP-2.9B remains inactive until WP-2.9A is accepted.

## Explicitly outside Lot 2

- full Tasks/follow-up workflow — Lot 3;
- full Budget/scenario engine — Lot 5;
- full Vendors — Lot 7;
- rendered map/routing-provider capability — Lot 9;
- generic offline/sync/PWA hardening beyond Venue-local responsibilities — Lot 10;
- full document version/contract-readiness workflow — Lots 7/11 according to feature assignment;
- real/private candidate venue data migration/import — Lot 12.

## Current reconciliation

```text
required current-Lot-2 responsibilities
- assigned packet responsibilities
= ∅

accepted/evidenced packets
= WP-2.1..WP-2.8C

former WP-2.9 required current-Lot responsibilities
- assigned WP-2.9A responsibilities
- assigned WP-2.9B responsibilities
= ∅

WP-2.9A state = READY / A-READY
WP-2.9B state = PLANNED / AFTER A
WP-2.9A product implementation authorized = no, pending READY exact-head 5/5 then separate IN_PROGRESS gate
```

Lot-level accepted/evidenced reconciliation remains intentionally incomplete until WP-2.9A/B, WP-2.10..WP-2.12 and the separate Lot Integration Pass are accepted.
