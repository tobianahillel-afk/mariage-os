# Lot 2 — Coverage Matrix and Work Packet Plan

Status: **IN_PROGRESS — WP-2.1..WP-2.8C ACCEPTED; WP-2.9A BLOCKED; WP-2.9C IN_PROGRESS / A-IMPLEMENT / CURRENT; WP-2.9B PLANNED / AFTER A**

Purpose: durable current responsibility-to-packet map for Lot 2 under `docs/engineering/AI-LOT-ORCHESTRATION.md`. Detailed historical packet evidence remains in packet records, acceptance records, FIRs and Git history.

## Lot 2 goal

Deliver the Venues core as a safe decision-and-action workspace: quick capture, lifecycle/history, spaces/capacity, independent partner ratings, facts/evidence/conflicts, deterministic criteria/blockers/readiness, commercial/access context, photos/documents basics, local/offline integration, gallery/table/detail/compare/deep links and mobile visit workflow.

Integration prerequisite is accepted Lot 0 + Lot 1 on `main` through PR #7; `main` integration truth is `f6da05626f024431230ae46ca1ec8a4becc72a1f`. Lot-2 branch is `lot-2/venues-core`.

## Required Feature/current-lot responsibilities

| Required item | Owning Feature/control | Packet(s) | Current evidence/state |
|---|---|---|---|
| stable venue UUID/project identity, code/name/location core and lifecycle/history | FTR-013, FTR-014, VEN-001/002/006, PRD-007, ACC-032 | WP-2.1, WP-2.11 | WP-2.1 **ACCEPTED**; presentation downstream |
| minimal quick-add and duplicate-warning/read-model flow | FTR-013, VEN-012, ACC-021 | WP-2.1, WP-2.10, WP-2.11 | persistence accepted; local/UI downstream |
| spaces, dimensions, commercial capacity | FTR-018, VEN-003/004/005 | WP-2.2, WP-2.11 | WP-2.2 **ACCEPTED** |
| independent member favorites/ratings/preferences | FTR-023, FTR-012 Lot-2, VEN-015/017, PRD-004, ACC-029 | WP-2.2, WP-2.11 | WP-2.2 **ACCEPTED** |
| typed fact definitions/value semantics | FTR-019, FAC-001/003/011/012, ACC-024 | WP-2.3 | **ACCEPTED** |
| multi-source observations/provenance/conflicts/freshness | FTR-020, FAC-002/004..009, ACC-015/025..027 | WP-2.4 | **ACCEPTED** |
| deterministic criteria/blockers/score/readiness | FTR-021, FAC-011/013, VEN-010/011, ACC-022/023/028 | WP-2.5 | **ACCEPTED** |
| missing/stale/conflicting guidance without implicit Task | FTR-022 Lot-2, VEN-007, FAC-006/008/010 | WP-2.5, WP-2.11 | read model accepted; UI downstream |
| offer/date-pricing history | FTR-025 Lot-2, VEN-008 | WP-2.6A | **ACCEPTED** |
| availability observations/read model | FTR-025 Lot-2, VEN-009 | WP-2.6B | **ACCEPTED** |
| contacts/interactions persistence | FTR-026 Lot-2 | WP-2.6C, WP-2.6D, WP-2.11 | C+D **ACCEPTED** |
| contextual access-route observations/origin snapshots | VEN-016, ACC-030 | WP-2.7, WP-2.11 | WP-2.7 **ACCEPTED** |
| remote image references | FTR-024, VEN-013, MED-007/008/013 | WP-2.8A, WP-2.11 | WP-2.8A **ACCEPTED** |
| private archived Venue image lifecycle | FTR-024 private slice, FTR-092 Lot-2, VEN-013, MED-004/005/006/009/010, ACC-055/056/058 | WP-2.8B | **ACCEPTED / COMPLETE**, gap ∅ |
| recoverable remote-media metadata lifecycle | FTR-024/FTR-092 Lot-2 continuation, MED-007/010/013, MED-008 regression | WP-2.8C | **ACCEPTED / COMPLETE**, gap ∅ |
| Venue-linked ordinary private documents, PDF lifecycle, provenance, document links | FTR-089 Lot-2; MED-001/002/003/008/010; PRD-008 link slice; file-security/deletion-retention controls | WP-2.9A, WP-2.9C remediation, WP-2.11 | **WP-2.9A BLOCKED** on AR-005 architecture dependency; **WP-2.9C IN_PROGRESS / A-IMPLEMENT / CURRENT**; `AR-001/002/003` CLOSED/VERIFIED; `AR-004/005` MAJOR/OPEN; FIR #17 |
| generic project Tags and Venue entity-tag assignments | FTR-093 Lot-2; PHYSICAL-SCHEMA tags/entity_tags; deletion-retention; same-project integrity | WP-2.9B, WP-2.11 | **PLANNED / AFTER A** |
| repository/read-model/provider ports and Supabase adapters | architecture, AUTHZ-006/020 | WP-2.1..WP-2.10 + WP-2.9C remediation | accepted packets green; C implements the reviewed trusted document-ingest boundary required to close AR-005 |
| local cache/pending Venue edits | FTR-028 Lot-2, SYN-001..003/007..011, PWA-003/004/006 | WP-2.10, WP-2.12 | PLANNED |
| gallery browse surface | FTR-015 | WP-2.11 | PLANNED |
| analytical table | FTR-016, FTR-012 Lot-2, VEN-015 | WP-2.11 | PLANNED |
| summary-first Venue detail | FTR-017 | WP-2.11 | PLANNED |
| compare 2–5 candidates | FTR-027, VEN-010/011 | WP-2.11 | PLANNED |
| protected Venue deep links | routing responsibility, VEN-014 | WP-2.11 | PLANNED |
| mobile visit mode | FTR-028, PWA-004 | WP-2.12 | PLANNED |
| file/content validation and no private production data in public artifacts | MED-002/003/009/010/013 + security/quality controls | WP-2.8A/B/C, WP-2.9A, WP-2.9C remediation, WP-2.12 | media accepted; C must close C1 parity plus authoritative exact-byte Document ingress; downstream remains |
| explicit permissions/grants/RLS/direct endpoint and Storage allow+deny evidence | AUTHZ-001..009/012/017/018/020 | owning packets WP-2.1..WP-2.9C | accepted authorization evidence green; C owns direct endpoint/Storage bypass evidence for the new server boundary without adding a permission key |
| synthetic complex Venue exit fixture/integrated workflows | Lot-2 acceptance | WP-2.12 + Lot Integration Pass | downstream |
| Lot reconciliation + separate Integration Pass | AI-LOT-ORCHESTRATION | after WP-2.1..WP-2.12 | downstream |

Required current-lot responsibilities minus assigned packet responsibilities: **∅**.

Accepted/evidenced packets: **WP-2.1..WP-2.8C**.

## WP-2.9 split reconciliation

The former single WP-2.9 scored **12 points**, so it was split before code into A and B. Fresh adversarial review later discovered that correcting AR-005 requires a new privileged/server provider boundary. Because WP-2.9A was already 10 points, the repository stop/sizing rules require a second implementation-control split rather than silently expanding A.

The resulting control sequence is:

- **WP-2.9A** — original FTR-089 private Document foundation/product responsibility;
- **WP-2.9C** — remediation-only trusted Document binary ingress + AR-004 parity hardening;
- **WP-2.9B** — generic project Tags + Venue entity-tags, still after A.

WP-2.9C does **not** add or take ownership of new product scope. It supplies the architecture/security correction required for A to satisfy its already-frozen contracts.

### WP-2.9A

- FTR-089 current-Lot private-document foundation;
- `documents` + `document_links`;
- `MED-001/002/003/008/010`;
- PDF validation/private Storage/recovery/read/download;
- same-project Venue links and Source provenance;
- recoverable metadata soft-delete/restore;
- existing `documents.read` / `documents.write` authorization;
- historical size **10**, cohesion **PASS**;
- split/spec freeze `40f17aba802e7faed9eade6096e2f3629fc80654` / `34788217062` — **5/5 SUCCESS**;
- READY governance `0b30b045ef05c318d25c92abb379364f95705c4e` / `34788670807` — **5/5 SUCCESS**;
- A-IMPLEMENT governance `f5a77c72cf5f28bccd823c7cdc78b01531b3b265` / `34789115986` — **5/5 SUCCESS**;
- RED-first `9322915252925d3f75f5a224a82f9d391ccfec9d` / `34789545716` — expected RED only on the three frozen boundary assertions;
- Pass-A final `e533b5c53d1be074216ccaa92f74281b425de770` / `34826553890` — **5/5 SUCCESS**, Core 152 files / 1465 tests / 100% coverage;
- `WP29A-AR-001` — **MAJOR / CLOSED / VERIFIED** after remediation `0072792d2eb67cce1bf98c4c312d9576feacc156` / `34836621394`;
- `WP29A-AR-002` — **MAJOR / CLOSED / VERIFIED** after remediation `c78c22ff10c02cd6ab798a21e16b5c7acbc3effb` / `34841804605` and fresh review;
- `WP29A-AR-003` — **MAJOR / CLOSED / VERIFIED** after RED `79afff6c87f7033af008de3fb3b86c3ff833b15c` / `34846914610`, remediation `fec1195dcbcfa15d97fe55b17a0fb5aad25b3813` / `34848872192`, and fresh review `6a4e8087e3b6f3b1d3501c0ef2f0378defc119e4` / `34850247706`;
- fresh Pass B found `WP29A-AR-004` — **MAJOR / OPEN**: TypeScript misses C1 controls U+0080..U+009F rejected by PostgreSQL `[[:cntrl:]]`;
- fresh Pass B found `WP29A-AR-005` — **MAJOR / OPEN / ARCHITECTURE BLOCKER**: authenticated direct Storage ingress can create bytes not bound to reserved SHA-256/size/MIME before ready commit;
- durable AR-004/005 review-failure record `a58417f79e59e2bd2d2fcb4d202f568c15cfa947` / `34854785427` — **5/5 SUCCESS**, clean-checkout included;
- current state **BLOCKED** until WP-2.9C is **ACCEPTED**, then A returns to `IN_PROGRESS` for integration/reverification → fresh Pass B → Pass C.

The inclusion of `MED-008` repairs the old WP-2.9 row omission; the frozen requirement-feature matrix already maps MED-008 to FTR-089.

### WP-2.9C — Trusted private-document ingestion hardening

- remediation-only packet for `WP29A-AR-004` + `WP29A-AR-005`;
- architecture decision: `ADR 0008 — Trusted server-side private-document binary ingestion`;
- no new Feature ID, permission key or product workflow;
- authenticated Supabase Edge Function becomes the only creator of Document Storage original objects after independently checking live identity/pending reservation, PDF bytes, exact byte size and SHA-256;
- ordinary authenticated direct Document Storage INSERT is removed while accepted Media behavior remains unchanged;
- existing protected `finalize_upload` retains live writer authorization and final state transition responsibility;
- C1 control parity is fixed through the existing canonical TypeScript Unicode predicate;
- local Edge Runtime + CI integration/adversarial evidence is required, including the 25 MB accepted boundary feasibility check;
- conservative size **10**, explicit cohesion **PASS** because endpoint + policy lock-down + exact-byte verification must ship atomically;
- split/READY governance `d1e561c787798eb99f49024cc0c1db49880bcd82` / CI `34862521697` — **5/5 SUCCESS**, clean-checkout included;
- state **IN_PROGRESS / A-IMPLEMENT / CURRENT**;
- current gate: exact-head CI for this separate A-IMPLEMENT transition; after green, focused RED-first evidence for AR-004/005 is the only permitted implementation action before production code.

### WP-2.9B

- FTR-093 generic tagging foundation;
- `tags` + `entity_tags`;
- project tag dictionary + same-project Venue assignments;
- recovery semantics;
- permissions reused: `project.read`, `project.settings.update`, `venues.read`, `venues.write`;
- size **8**, cohesion **PASS**;
- **PLANNED / AFTER A**.

Required former-WP-2.9 product responsibilities minus assigned A/B product responsibilities: **∅**. C is remediation/control work and adds no product responsibility.

## Work Packet plan

| Packet | State | Current responsibility / evidence |
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
| WP-2.8B | **ACCEPTED / COMPLETE** | private archive lifecycle; gap ∅ |
| WP-2.8C | **ACCEPTED / COMPLETE** | recoverable remote metadata lifecycle; durable closure `7f97ab8...` / `34786974129` 5/5 |
| WP-2.9A | **BLOCKED** | FTR-089 foundation; AR-004/005 open; blocker resolves only after WP-2.9C ACCEPTED |
| WP-2.9C | **IN_PROGRESS / A-IMPLEMENT / CURRENT** | trusted private-Document binary ingress + C1 parity remediation under ADR 0008; transition CI next, then focused RED-first |
| WP-2.9B | **PLANNED / AFTER A** | generic project Tags + Venue entity-tags |
| WP-2.10 | PLANNED | repositories/local cache/pending offline mutations |
| WP-2.11 | PLANNED | gallery/table/detail/compare/deep-link workspace |
| WP-2.12 | PLANNED | mobile/offline Venue visit + packet E2E completion |

## Sequencing

```text
WP-2.1..WP-2.8C [ACCEPTED]
  → WP-2.9A [BLOCKED on AR-005 architecture dependency]
    → WP-2.9C [IN_PROGRESS / A-IMPLEMENT / CURRENT]
      → A-IMPLEMENT transition exact-head CI
        → focused RED-first AR-004/005
          → implementation → review → acceptance
            → WP-2.9A BLOCKED → IN_PROGRESS
              → A integration/reverification → fresh Pass B → Pass C
                → WP-2.9B [PLANNED / AFTER A]
                  → WP-2.10 → WP-2.11 → WP-2.12
                    → Lot reconciliation → Integration Pass
```

Only one packet may be implementing at a time. A is blocked, not concurrently implementing. C is the sole active implementation packet. No RED test may be committed until the A-IMPLEMENT transition itself is exact-head green. Pass C for A and WP-2.9B remain forbidden while AR-004/005 are unresolved.

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
WP-2.9A = BLOCKED
closed findings = WP29A-AR-001 / AR-002 / AR-003 — MAJOR — VERIFIED
open finding = WP29A-AR-004 — MAJOR — C1 control-character parity — remediation WP-2.9C
open finding = WP29A-AR-005 — MAJOR / architecture blocker — actual stored bytes not bound to reserved integrity — remediation WP-2.9C
AR-004/005 durable failure record = a58417f79e59e2bd2d2fcb4d202f568c15cfa947 / 34854785427 — 5/5 SUCCESS
WP-2.9C split/READY evidence = d1e561c787798eb99f49024cc0c1db49880bcd82 / 34862521697 — 5/5 SUCCESS
WP-2.9C = IN_PROGRESS / A-IMPLEMENT / CURRENT — 10 points — cohesion PASS — ADR 0008
WP-2.9A blocker resolution = WP-2.9C ACCEPTED, then A returns to IN_PROGRESS for integration/reverification/fresh Pass B
WP-2.9B = PLANNED / AFTER A
next permitted action = exact-head CI for the WP-2.9C A-IMPLEMENT transition; after green, focused test-only RED for AR-004/005
production remediation code forbidden until focused RED is isolated and recorded
Pass C / WP-2.9B forbidden while AR-004 or AR-005 remains unresolved
```

Lot-level reconciliation remains intentionally incomplete until WP-2.9A/C/B, WP-2.10..WP-2.12 and the separate Lot Integration Pass are accepted.
