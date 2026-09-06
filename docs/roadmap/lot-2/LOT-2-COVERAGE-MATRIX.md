# Lot 2 — Coverage Matrix and Work Packet Plan

Status: **IN_PROGRESS — WP-2.1 ACCEPTED; WP-2.2 is next**

Purpose: durable responsibility-to-packet map for Lot 2 under `docs/engineering/AI-LOT-ORCHESTRATION.md`.

## Lot 2 goal

Deliver the Venues core as a safe decision-and-action workspace: quick capture, lifecycle/history, spaces/capacity, independent partner ratings, facts/evidence/conflicts, deterministic criteria/blockers/readiness, commercial/access context, photos/documents basics, local/offline integration, gallery/table/detail/compare/deep links and mobile visit workflow.

Lot 2 must reuse the accepted Lot 1 project/auth/RLS/local-data/Storage foundations and must not pre-implement later Tasks, Map, full Sync/PWA hardening, Import, Budget or Vendor lots.

## Integration prerequisite

The previously accepted Lot 0 + Lot 1 implementation was promoted to `main` through PR #7 before Lot 2 started.

- `main` promotion merge: `f6da05626f024431230ae46ca1ec8a4becc72a1f`;
- PR #7 CI run `34030211097`: **5/5 SUCCESS**, including clean-checkout `npm run verify`;
- Lot 2 branch: `lot-2/venues-core`, created from that exact `main` commit.

## Required Feature/current-lot responsibilities

| Required item | Owning Feature/control | Packet(s) | Dependencies | Final evidence |
|---|---|---|---|---|
| stable venue UUID/project identity, human code/name/location core and natural code ordering | FTR-013, VEN-001, VEN-002 | WP-2.1, WP-2.11 | Lot 1 project isolation | WP-2.1 ACCEPTED foundation + later UI/E2E |
| minimal venue quick-add without giant form; duplicate warning inputs retained for later detector/read model | FTR-013, VEN-012, ACC-021 | WP-2.1, WP-2.10, WP-2.11 | venue identity + local store | WP-2.1 create command/repository accepted + later local durability/E2E |
| venue lifecycle, rejection reason/history and reversible restore | FTR-014, VEN-006, PRD-007, ACC-032 | WP-2.1, WP-2.11 | authorized venue persistence | WP-2.1 ACCEPTED state-transition/activity evidence + later UI/E2E |
| multiple spaces, dimensions, commercial capacities and wedding-specific configuration inputs | FTR-018, VEN-003, VEN-004, VEN-005 | WP-2.2, WP-2.11 | WP-2.1 | same-project DB tests + domain tests + detail UI |
| independent member favorites/ratings and Lot-2 personal display/venue preference responsibilities | FTR-023, FTR-012 (Lot 2), VEN-015, VEN-017, PRD-004, ACC-029 | WP-2.2, WP-2.11 | Lot 1 membership/preferences | author-only RLS + partner-isolation tests + UI |
| typed fact definitions, retained fact state/value and explicit unknown/known/not-applicable/conflict semantics | FTR-019, FAC-001, FAC-003, FAC-011, FAC-012, ACC-024 | WP-2.3 | WP-2.1 | runtime/domain validation + DB constraints/RLS |
| multi-source append-oriented observations, sources/provenance, conflict retention and stronger-evidence protection inputs | FTR-020, FAC-002, FAC-004..009, ACC-015, ACC-025..027 | WP-2.4 | WP-2.3 | append/history/RLS tests + conflict/freshness tests |
| deterministic criterion evaluation, blockers, weighted score explanation and dynamic recomputation | FTR-021, FAC-011, FAC-013, VEN-010, VEN-011, ACC-022, ACC-023, ACC-028 | WP-2.5 | WP-2.3, WP-2.4 | unit/property/mutation tests + explanation reconstruction |
| missing/stale/conflicting information guidance without silently creating tasks | FTR-022 (Lot 2 responsibility), VEN-007, FAC-006, FAC-008, FAC-010 | WP-2.5, WP-2.11 | criteria/facts | deterministic missing-info read model + UI |
| venue offers/date pricing and availability observation basics without full Budget engine | FTR-025 (Lot 2 responsibility), VEN-008, VEN-009 | WP-2.6 | WP-2.1, wedding dates | migration/RLS + date/source/history tests |
| venue contacts/interactions/quote-follow-up data basics without Task workflow | FTR-026 (Lot 2 responsibility) | WP-2.6, WP-2.11 | WP-2.1 | same-project tests + detail read model |
| contextual access-route observations by origin/mode; default-origin switch never overwrites route history | Lot-2 acceptance, VEN-016, ACC-030, access responsibility | WP-2.7, WP-2.11 | Lot 1 reference origins | access.read/write RLS + contextual-history tests |
| remote image references, archived/private venue photo metadata and source privacy | FTR-024, FTR-092 (Lot 2 media responsibility), VEN-013, MED-004..010, MED-013 | WP-2.8, WP-2.11, WP-2.12 | Lot 1 private Storage | metadata/RLS/Storage tests + external-image security tests |
| venue-linked ordinary document basics and generic venue tag/link basics | FTR-089 (Lot 2 responsibility), FTR-093 (Lot 2 responsibility), MED-001..003, MED-010 | WP-2.9, WP-2.11 | Lot 1 Storage/permissions | same-project link tests + safe metadata UI |
| venue repository/read-model ports and Supabase adapters use accepted architecture boundaries | Lot acceptance, AUTHZ-006/020, architecture controls | WP-2.1..WP-2.10 as owning adapters are introduced | Lot 1 ports/composition | static architecture + adapter tests |
| local cache/pending venue edits reuse account+project+device LocalProjectStore; no parallel IndexedDB design | FTR-028 (Lot 2 responsibility), SYN-001..003, SYN-007..011, PWA-003/004/006 | WP-2.10, WP-2.12 | Lot 1 WP-1.7/1.8 | local persistence/reload/isolation/offline tests |
| gallery is default venue browse surface with robust empty/loading/offline states | FTR-015 | WP-2.11 | WP-2.10 read models, WP-2.8 media | browser/accessibility/performance evidence |
| analytical table with controlled columns and personal saved preferences | FTR-016, FTR-012 (Lot 2 responsibility), VEN-015 | WP-2.11 | WP-2.2, WP-2.10 | sort/filter/prefs/browser tests |
| summary-first venue detail with spaces/facts/missing/commercial/access/media/docs/history | FTR-017 | WP-2.11 | WP-2.1..WP-2.10 | detail E2E + visual/accessibility review |
| compare 2–5 venues, blockers before score, differences-only and ratings separate from facts | FTR-027, VEN-010, VEN-011 | WP-2.11 | WP-2.5 + read models | compare E2E + blocked criterion visibility |
| protected venue deep links preserve project authorization and generic outsider denial | FTR-014/FTR-017/FTR-027 routing responsibility, VEN-014 | WP-2.11 | Lot 1 protected shell | route/unit/E2E outsider tests |
| mobile visit mode: cached detail/checklist/notes/measurement/photo/rating/finish summary with queued local edits | FTR-028, PWA-004, venue feature contract | WP-2.12 | WP-2.2, WP-2.5, WP-2.8, WP-2.10 | mobile Playwright/offline reload tests |
| remote-image/file/content validation and no private data in public fixtures/artifacts | MED-002/003/009/010/013, security/quality controls | WP-2.8, WP-2.9, WP-2.12 | Lot 1 security foundation | adversarial tests + secret/privacy scans |
| every new table/resource has explicit permissions, grants, RLS and direct anon/outsider/project-B/revoked allow/deny evidence | AUTHZ-001..008, AUTHZ-009, AUTHZ-012/017/018/020 | WP-2.1..WP-2.9 according to resource | Lot 1 authorization catalog | per-packet pgTAP direct security matrix |
| synthetic complex venue exit fixture: conflicting evidence, multiple spaces, route observations, offers, two partner ratings, reject/restore/compare | Lot 2 acceptance | WP-2.12 + separate Lot Integration Pass | all packets | integrated DB/browser scenario |
| Lot reconciliation + separate Integration Pass | AI-LOT-ORCHESTRATION | after WP-2.1..WP-2.12 | all packets | required - accepted/evidenced = ∅ + full verify + integration PASS |

Required current-lot responsibilities minus assigned packet responsibilities: **∅**.

Accepted/evidenced packet responsibilities so far: **WP-2.1 only**. Lot-level accepted/evidenced reconciliation is intentionally incomplete until all packets and the separate Integration Pass finish.

## Work Packet plan

### WP-2.1 — Venue identity, authorized persistence and lifecycle-history foundation

State: **ACCEPTED**  
Current pass: **COMPLETE**

Primary Features: FTR-013, FTR-014 responsibilities for canonical venue identity/persistence/lifecycle.  
Planning complexity: **10/10** — cohesive because `venues`, lifecycle transition/history and their authorization were reviewed together to prevent generic mutation bypasses.  
Acceptance record: `WP-2.1.md`.  
Reviewed implementation head: `3418659d94d35f61183f0a20c367c74e38e86802`.  
Exact implementation CI run `34039296392`: **5/5 SUCCESS**; 350 unit tests, 17 DB files / 359 pgTAP tests, 40/40 E2E, clean-checkout `npm run verify` PASS.  
Required WP-2.1 responsibilities minus accepted/evidenced WP-2.1 responsibilities: **∅**.

### WP-2.2 — Spaces, capacity and member ratings/preferences

State: **PLANNED**

Primary Features: FTR-018, FTR-023, Lot-2 portion of FTR-012.  
Dependencies: WP-2.1 **ACCEPTED**.

### WP-2.3 — Fact definitions, typed retained facts and value validation

State: **PLANNED**

Primary Feature: FTR-019.  
Dependencies: WP-2.1.

### WP-2.4 — Observations, sources, evidence/confidence/freshness and conflicts

State: **PLANNED**

Primary Feature: FTR-020.  
Dependencies: WP-2.3.  
Pre-implementation stop-condition: first document the distinct semantics of `evidence_level` and `confidence` without changing frozen Feature scope.

### WP-2.5 — Deterministic criteria, blockers, score/readiness and missing information

State: **PLANNED**

Primary Features: FTR-021, FTR-022 Lot-2 responsibility.  
Dependencies: WP-2.3, WP-2.4.  
Pre-implementation stop-condition: define the deterministic `evidenceReadiness` formula in the governing criteria contract before code.

### WP-2.6 — Venue offers, availability, contacts and interactions basics

State: **PLANNED**

Primary Features: FTR-025 and FTR-026 Lot-2 responsibilities.  
Dependencies: WP-2.1, Lot-1 wedding dates.

### WP-2.7 — Contextual venue access-route observations

State: **PLANNED**

Primary control: Lot-2 acceptance + VEN-016 access-route basics.  
Dependencies: WP-2.1, Lot-1 reference origins.

### WP-2.8 — Venue media/photo foundation and private/remote media safety

State: **PLANNED**

Primary Features: FTR-024, Lot-2 portion of FTR-092.  
Dependencies: WP-2.1, Lot-1 Storage.  
Pre-implementation governance repair: restore the missing `docs/security/STORAGE-RLS.md` contract from already frozen/tested Storage authorization semantics.

### WP-2.9 — Venue document and tag/link basics

State: **PLANNED**

Primary Features: Lot-2 portions of FTR-089 and FTR-093.  
Dependencies: WP-2.1, WP-2.8 where shared file/link primitives are reused.

### WP-2.10 — Venue repositories, local cache and pending/offline mutation integration

State: **PLANNED**

Primary Feature: FTR-028 local/offline foundation responsibility.  
Dependencies: WP-2.1 through WP-2.9 persistence contracts as needed.  
Must extend `LocalProjectStore`; a parallel IndexedDB architecture is forbidden.

### WP-2.11 — Gallery/table/detail/compare/deep-link workspace

State: **PLANNED**

Primary Features: FTR-015, FTR-016, FTR-017, FTR-027 plus Lot-2 UI portion of FTR-012.  
Dependencies: WP-2.1..WP-2.10.  
Packet review must ensure one coherent Venues workspace rather than four disconnected CRUD pages.

### WP-2.12 — Mobile/offline venue-visit workflow and packet-level end-to-end completion

State: **PLANNED**

Primary Feature: FTR-028 visit workflow.  
Dependencies: WP-2.2, WP-2.5, WP-2.8, WP-2.10, WP-2.11.  
Provides the complete visit workflow and the final packet-owned synthetic venue journey; it does **not** replace the separate Lot Integration Pass.

## Sequencing

```text
WP-2.1 [ACCEPTED]
  ├─→ WP-2.2 [NEXT]
  ├─→ WP-2.3 → WP-2.4 → WP-2.5
  ├─→ WP-2.6
  ├─→ WP-2.7
  └─→ WP-2.8 → WP-2.9

WP-2.1..2.9
  ↓
WP-2.10
  ↓
WP-2.11
  ↓
WP-2.12
  ↓
mechanical Lot reconciliation
  ↓
separate Lot 2 Integration Pass
  ↓
Lot 2 acceptance
```

Default execution remains one packet `IN_PROGRESS` at a time. After WP-2.1 acceptance and governance reconciliation, WP-2.2 is the next permitted packet.

## Explicitly out of Lot 2

- automatic task creation/workflow from missing information (Lot 3 owns Tasks; Lot 2 only produces deterministic suggestions/read models);
- generic Inbox or Decisions;
- canonical import engine and external-ID application semantics beyond duplicate-warning inputs (Lot 4);
- full budget/scenario/payment calculation (Lot 5);
- guest/invitation/communications/seating domains (Lot 6);
- generic vendor domain and full contract-readiness workflow (Lot 7);
- Dashboard/global Search implementation (Lot 8);
- rendered map/pins/provider routing integration (Lot 9); Lot 2 stores textual/contextual access observations only;
- full conflict-resolution/retry engine, PWA update hardening and offline pinning engine (Lot 10); Lot 2 only integrates venue work with already established local queue/cache primitives;
- production backup/recovery/provider cutover (Lot 11);
- real venue data migration from the couple's research (Lot 12);
- real wedding/private data in public Git, tests, screenshots or CI artifacts.

## Lot closure gate

Lot 2 cannot be accepted until:

```text
required current-lot responsibilities - accepted/evidenced responsibilities = ∅
```

and a fresh separate Integration Pass proves the synthetic complex-venue exit scenario, cross-project isolation, offline/visit behavior, UI coherence and full `npm run verify` on the exact reviewed head.
