# Lot 2 — Coverage Matrix and Work Packet Plan

Status: **IN_PROGRESS — WP-2.1..WP-2.8C ACCEPTED; WP-2.9A REVIEW_FAILED / CURRENT; WP-2.9B PLANNED**

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
| Venue-linked ordinary private documents, PDF lifecycle, provenance, document links | FTR-089 Lot-2; MED-001/002/003/008/010; PRD-008 link slice; file-security/deletion-retention controls | WP-2.9A, WP-2.11 | **WP-2.9A REVIEW_FAILED / CURRENT**; `AR-001/002/003` CLOSED/VERIFIED; `AR-004/005` MAJOR/OPEN; FIR #17 |
| generic project Tags and Venue entity-tag assignments | FTR-093 Lot-2; PHYSICAL-SCHEMA tags/entity_tags; deletion-retention; same-project integrity | WP-2.9B, WP-2.11 | **PLANNED / AFTER A** |
| repository/read-model ports and Supabase adapters | architecture, AUTHZ-006/020 | WP-2.1..WP-2.10 | accepted packets green; 2.9A review failed on AR-004/005; remediation pending |
| local cache/pending Venue edits | FTR-028 Lot-2, SYN-001..003/007..011, PWA-003/004/006 | WP-2.10, WP-2.12 | PLANNED |
| gallery browse surface | FTR-015 | WP-2.11 | PLANNED |
| analytical table | FTR-016, FTR-012 Lot-2, VEN-015 | WP-2.11 | PLANNED |
| summary-first Venue detail | FTR-017 | WP-2.11 | PLANNED |
| compare 2–5 candidates | FTR-027, VEN-010/011 | WP-2.11 | PLANNED |
| protected Venue deep links | routing responsibility, VEN-014 | WP-2.11 | PLANNED |
| mobile visit mode | FTR-028, PWA-004 | WP-2.12 | PLANNED |
| file/content validation and no private production data in public artifacts | MED-002/003/009/010/013 + security/quality controls | WP-2.8A/B/C, WP-2.9A, WP-2.12 | media accepted; 2.9A AR-004 control parity + AR-005 committed-object integrity open; downstream remains |
| explicit permissions/grants/RLS and direct allow+deny evidence | AUTHZ-001..009/012/017/018/020 | owning packets WP-2.1..WP-2.9B | accepted authorization evidence green; 2.9A validation/integrity findings do not weaken project isolation but block acceptance |
| synthetic complex Venue exit fixture/integrated workflows | Lot-2 acceptance | WP-2.12 + Lot Integration Pass | downstream |
| Lot reconciliation + separate Integration Pass | AI-LOT-ORCHESTRATION | after WP-2.1..WP-2.12 | downstream |

Required current-lot responsibilities minus assigned packet responsibilities: **∅**.

Accepted/evidenced packets: **WP-2.1..WP-2.8C**.

## WP-2.9 split reconciliation

The former single WP-2.9 scored **12 points**, so it was split before code.

### WP-2.9A

- FTR-089 current-Lot private-document foundation;
- `documents` + `document_links`;
- `MED-001/002/003/008/010`;
- PDF validation/private Storage/recovery/read/download;
- same-project Venue links and Source provenance;
- recoverable metadata soft-delete/restore;
- existing `documents.read` / `documents.write` authorization;
- size **10**, cohesion **PASS**;
- split/spec freeze `40f17aba802e7faed9eade6096e2f3629fc80654` / `34788217062` — **5/5 SUCCESS**;
- READY governance `0b30b045ef05c318d25c92abb379364f95705c4e` / `34788670807` — **5/5 SUCCESS**, clean-checkout included;
- A-IMPLEMENT governance `f5a77c72cf5f28bccd823c7cdc78b01531b3b265` / `34789115986` — **5/5 SUCCESS**, clean-checkout included;
- RED-first `9322915252925d3f75f5a224a82f9d391ccfec9d` / `34789545716` — expected RED only on the three frozen boundary assertions;
- Pass-A final `e533b5c53d1be074216ccaa92f74281b425de770` / `34826553890` — **5/5 SUCCESS**, clean-checkout included, Core 152 files / 1465 tests / 100% statements, branches, functions and lines;
- FIR `#17 / FTR-089`;
- `WP29A-AR-001` — **MAJOR / CLOSED / VERIFIED** after narrow read/list/download remediation `0072792d2eb67cce1bf98c4c312d9576feacc156` / `34836621394` 5/5;
- prior fresh Pass-B entry/governance `78904546f3d8f4c15276a1bbe0825455f1262ee4` / `34837421096` — **5/5 SUCCESS**;
- `WP29A-AR-002` — **MAJOR / CLOSED / VERIFIED**: read parser filename Unicode-scalar parity; failure record `9654c90ed7da27033d1f08d6effc6f47cac3dff9` / `34839274681`, remediation transition `b2e94c47f6d523adbf731fdd15cf796cca4c5ca9` / `34840180167`, RED `2f06b7963e7d09e3c00264d3351745213a75f964` / `34840851767`, remediation `c78c22ff10c02cd6ab798a21e16b5c7acbc3effb` / `34841804605` 5/5;
- fresh Pass-B entry/governance `c6c3afa56a66be97a590d4ce2b63932e6af5a46e` / `34842684753` — **5/5 SUCCESS**, clean-checkout included;
- prior fresh Pass B found `WP29A-AR-003` — **MAJOR**: lifecycle receipt parser counted filename with UTF-16 code units, and bounded `document_type`/`title` provider parsers disagreed with authoritative PostgreSQL `char_length` semantics;
- durable AR-003 review-failure record `39ea780ac9ac724a9450a5ac8a5d0179986591ed` / `34844606086` — **5/5 SUCCESS**, clean-checkout included;
- AR-003 remediation-transition governance `9b266ca9ba3c6e737525db03a5856c39d4f44ed7` / `34845524190` — **5/5 SUCCESS**, clean-checkout included;
- AR-003 focused RED `79afff6c87f7033af008de3fb3b86c3ff833b15c` / `34846914610` — expected RED with 1546 passing / 4 failing Unicode-parity tests; static, DB/RLS and Browser/mutation remained green;
- AR-003 remediation/evidence `fec1195dcbcfa15d97fe55b17a0fb5aad25b3813` / `34848872192` — **5/5 SUCCESS**, clean-checkout included; Core 159 files / 1550 tests / 100% statements, branches, functions and lines;
- fresh Pass-B governance entry `6a4e8087e3b6f3b1d3501c0ef2f0378defc119e4` / `34850247706` — **5/5 SUCCESS**, clean-checkout included;
- fresh Pass B independently verifies `WP29A-AR-003` as **CLOSED / VERIFIED**;
- fresh Pass B finds `WP29A-AR-004` — **MAJOR / OPEN**: TypeScript control validation misses C1 U+0080..U+009F rejected by PostgreSQL `[[:cntrl:]]`;
- fresh Pass B finds `WP29A-AR-005` — **MAJOR / OPEN**: `finalize_upload` proves only object presence, not that actual stored bytes/size/MIME/SHA-256 match the reservation;
- current state **REVIEW_FAILED**; remediation is forbidden until the durable review-failure record passes exact-head CI. AR-005 requires stop/rescore/split first if trusted object-integrity proof needs a new privileged/provider architecture or materially expands this already-10-point packet.

The inclusion of `MED-008` repairs the old WP-2.9 row omission; the frozen requirement-feature matrix already maps MED-008 to FTR-089.

### WP-2.9B

- FTR-093 generic tagging foundation;
- `tags` + `entity_tags`;
- project tag dictionary + same-project Venue assignments;
- recovery semantics;
- permissions reused: `project.read`, `project.settings.update`, `venues.read`, `venues.write`;
- size **8**, cohesion **PASS**;
- **PLANNED / AFTER A**.

Required former-WP-2.9 responsibilities minus assigned A/B responsibilities: **∅**.

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
| WP-2.9A | **REVIEW_FAILED / CURRENT** | `AR-001/002/003` closed; `AR-004/005` MAJOR/open; durable failure-record CI next |
| WP-2.9B | **PLANNED / AFTER A** | generic project Tags + Venue entity-tags |
| WP-2.10 | PLANNED | repositories/local cache/pending offline mutations |
| WP-2.11 | PLANNED | gallery/table/detail/compare/deep-link workspace |
| WP-2.12 | PLANNED | mobile/offline Venue visit + packet E2E completion |

## Sequencing

```text
WP-2.1..WP-2.8C [ACCEPTED]
  → WP-2.9A [REVIEW_FAILED / CURRENT]
    → exact-head CI for durable failure record
      → remediation planning / IN_PROGRESS (or stop/rescore/split for AR-005 if required)
        → focused RED/remediation/reverification
          → fresh Pass B
            → Pass C
              → WP-2.9B [PLANNED]
                → WP-2.10
                  → WP-2.11
                    → WP-2.12
                      → Lot reconciliation
                        → Integration Pass
```

Only one packet may be active. `WP29A-AR-001`, `WP29A-AR-002` and `WP29A-AR-003` are closed/verified. `WP29A-AR-004` and `WP29A-AR-005` are MAJOR/OPEN. Pass C and WP-2.9B remain forbidden while either finding is unresolved.

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
required current-Lot-2 responsibilities - assigned packet responsibilities = ∅
accepted/evidenced packets = WP-2.1..WP-2.8C
former WP-2.9 responsibilities - WP-2.9A - WP-2.9B = ∅
WP-2.9A = REVIEW_FAILED
closed finding = WP29A-AR-001 — MAJOR — remediation verified by fresh review
closed finding = WP29A-AR-002 — MAJOR — read-parser remediation verified by fresh review
closed finding = WP29A-AR-003 — MAJOR — remediation independently verified by fresh review
open finding = WP29A-AR-004 — MAJOR — C1 control-character parity
open finding = WP29A-AR-005 — MAJOR — ready commit not bound to actual stored-object integrity
WP-2.9B = PLANNED / AFTER A
WP-2.9A Pass-A historical evidence = e533b5c53d1be074216ccaa92f74281b425de770 / 34826553890 — 5/5 SUCCESS
WP-2.9A AR-001 remediation evidence = 0072792d2eb67cce1bf98c4c312d9576feacc156 / 34836621394 — 5/5 SUCCESS
AR-002 remediation evidence = c78c22ff10c02cd6ab798a21e16b5c7acbc3effb / 34841804605 — 5/5 SUCCESS
prior fresh Pass-B entry evidence = c6c3afa56a66be97a590d4ce2b63932e6af5a46e / 34842684753 — 5/5 SUCCESS
AR-003 durable review-failure evidence = 39ea780ac9ac724a9450a5ac8a5d0179986591ed / 34844606086 — 5/5 SUCCESS
AR-003 remediation-transition evidence = 9b266ca9ba3c6e737525db03a5856c39d4f44ed7 / 34845524190 — 5/5 SUCCESS
AR-003 focused RED evidence = 79afff6c87f7033af008de3fb3b86c3ff833b15c / 34846914610 — expected RED, 1546 passing / 4 failing
AR-003 remediation evidence = fec1195dcbcfa15d97fe55b17a0fb5aad25b3813 / 34848872192 — 5/5 SUCCESS, 159 files / 1550 tests / 100% coverage
fresh Pass-B governance evidence = 6a4e8087e3b6f3b1d3501c0ef2f0378defc119e4 / 34850247706 — 5/5 SUCCESS
next permitted action = exact-head CI for this REVIEW_FAILED record; then separate remediation-planning / IN_PROGRESS transition
Pass C / WP-2.9B forbidden while AR-004 or AR-005 remains unresolved
```

Lot-level reconciliation remains intentionally incomplete until WP-2.9A/B, WP-2.10..WP-2.12 and the separate Lot Integration Pass are accepted.
