# Lot 2 — Coverage Matrix and Work Packet Plan

Status: **IN_PROGRESS — WP-2.1..WP-2.8C ACCEPTED; WP-2.9A REVIEW_FAILED / B-ADVERSARIAL-REVIEW / CURRENT; WP-2.9B PLANNED**

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
| Venue-linked ordinary private documents, PDF lifecycle, provenance, document links | FTR-089 Lot-2; MED-001/002/003/008/010; PRD-008 link slice; file-security/deletion-retention controls | WP-2.9A, WP-2.11 | **WP-2.9A REVIEW_FAILED / B-ADVERSARIAL-REVIEW / CURRENT**; `WP29A-AR-001` CLOSED/VERIFIED; `WP29A-AR-002` MAJOR/OPEN — Unicode-scalar filename parser mismatch; FIR #17 |
| generic project Tags and Venue entity-tag assignments | FTR-093 Lot-2; PHYSICAL-SCHEMA tags/entity_tags; deletion-retention; same-project integrity | WP-2.9B, WP-2.11 | **PLANNED / AFTER A** |
| repository/read-model ports and Supabase adapters | architecture, AUTHZ-006/020 | WP-2.1..WP-2.10 | accepted packets green; 2.9A read/download foundation exists but fresh review found Unicode filename parity defect; future owners as introduced |
| local cache/pending Venue edits | FTR-028 Lot-2, SYN-001..003/007..011, PWA-003/004/006 | WP-2.10, WP-2.12 | PLANNED |
| gallery browse surface | FTR-015 | WP-2.11 | PLANNED |
| analytical table | FTR-016, FTR-012 Lot-2, VEN-015 | WP-2.11 | PLANNED |
| summary-first Venue detail | FTR-017 | WP-2.11 | PLANNED |
| compare 2–5 candidates | FTR-027, VEN-010/011 | WP-2.11 | PLANNED |
| protected Venue deep links | routing responsibility, VEN-014 | WP-2.11 | PLANNED |
| mobile visit mode | FTR-028, PWA-004 | WP-2.12 | PLANNED |
| file/content validation and no private production data in public artifacts | MED-002/003/009/010/013 + security/quality controls | WP-2.8A/B/C, WP-2.9A, WP-2.12 | media accepted; 2.9A fresh Pass B found Unicode read-parser mismatch; downstream remains |
| explicit permissions/grants/RLS and direct allow+deny evidence | AUTHZ-001..009/012/017/018/020 | owning packets WP-2.1..WP-2.9B | accepted evidence green; 2.9A fresh review did not find a new authorization defect |
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
- first Pass B finding `WP29A-AR-001` — **MAJOR / CLOSED / VERIFIED** after narrow read/list/download remediation;
- remediation final `0072792d2eb67cce1bf98c4c312d9576feacc156` / `34836621394` — **5/5 SUCCESS**, clean-checkout included; Core 1539 tests / 100% statements, branches, functions and lines;
- fresh Pass-B entry/governance `78904546f3d8f4c15276a1bbe0825455f1262ee4` / `34837421096` — **5/5 SUCCESS**, clean-checkout included;
- fresh Pass B finding `WP29A-AR-002` — **MAJOR / OPEN**: read parser counts UTF-16 code units for private filename length while upload/frozen contract counts Unicode scalar values;
- current state **REVIEW_FAILED / B-ADVERSARIAL-REVIEW**; remediation cannot begin until this failure state itself has exact-head green governance and a separate remediation transition.

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
| WP-2.9A | **REVIEW_FAILED / B-ADVERSARIAL-REVIEW / CURRENT** | `AR-001` closed; `AR-002` MAJOR/open; durable failure gate then separate remediation transition |
| WP-2.9B | **PLANNED / AFTER A** | generic project Tags + Venue entity-tags |
| WP-2.10 | PLANNED | repositories/local cache/pending offline mutations |
| WP-2.11 | PLANNED | gallery/table/detail/compare/deep-link workspace |
| WP-2.12 | PLANNED | mobile/offline Venue visit + packet E2E completion |

## Sequencing

```text
WP-2.1..WP-2.8C [ACCEPTED]
  → WP-2.9A [REVIEW_FAILED / B-ADVERSARIAL-REVIEW / CURRENT]
    → durable review-failure gate
      → remediation WP29A-AR-002
        → fresh Pass B → Pass C
          → WP-2.9B [PLANNED]
            → WP-2.10
              → WP-2.11
                → WP-2.12
                  → Lot reconciliation
                    → Integration Pass
```

Only one packet may be active. `WP29A-AR-001` is now closed/verified, but fresh Pass B found `WP29A-AR-002` MAJOR. The review-failed state must be durably green before a separate remediation transition. Pass C and WP-2.9B remain forbidden while `AR-002` is unresolved.

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
WP-2.9A = REVIEW_FAILED / B-ADVERSARIAL-REVIEW
closed finding = WP29A-AR-001 — MAJOR — remediation verified by fresh review
open finding = WP29A-AR-002 — MAJOR — Unicode-scalar filename parser mismatch
WP-2.9B = PLANNED / AFTER A
WP-2.9A Pass-A historical evidence = e533b5c53d1be074216ccaa92f74281b425de770 / 34826553890 — 5/5 SUCCESS
WP-2.9A AR-001 remediation evidence = 0072792d2eb67cce1bf98c4c312d9576feacc156 / 34836621394 — 5/5 SUCCESS
fresh Pass-B entry evidence = 78904546f3d8f4c15276a1bbe0825455f1262ee4 / 34837421096 — 5/5 SUCCESS
next permitted action = exact-head durable REVIEW_FAILED gate, then separate AR-002 remediation transition
Pass C / WP-2.9B forbidden while AR-002 remains open
```

Lot-level reconciliation remains intentionally incomplete until WP-2.9A/B, WP-2.10..WP-2.12 and the separate Lot Integration Pass are accepted.
