# Lot 2 Coverage Matrix — WP-2.8 Reconciliation Addendum

Status: **Normative WP-2.8 responsibility addendum to `LOT-2-COVERAGE-MATRIX.md`; responsibility repair retained, current packet state folded into the regenerated matrix**

Purpose: repair a responsibility-assignment omission discovered before WP-2.8A entered READY, without rewriting accepted Lot-2 history. The responsibility decomposition below remains normative history and must continue to constrain WP-2.8B/C activation. The regenerated `LOT-2-COVERAGE-MATRIX.md` now carries the same A/B/C assignment and current packet states, so there is no longer a state conflict between the two files.

## Why this repair was required

The earlier matrix decomposed the original WP-2.8 into:

- WP-2.8A — remote-reference metadata and Venue links;
- WP-2.8B — private archived bytes/original/derivative/hash/orphan lifecycle;
- WP-2.11 — Venue media presentation;
- WP-2.12 — mobile/offline capture.

A pre-READY reread of normative `DELETION-RETENTION.md` identified an unassigned Lot-2 media-metadata responsibility: media/document metadata is soft-deleted first and restorable. Adding that lifecycle to A would push its already reviewed 10-point scope over the mandatory `>10` split threshold. The responsibility was therefore assigned to a separate WP-2.8C before any WP-2.8 product code existed.

## Corrected WP-2.8 responsibility map

| Required item | Owning Feature/control | Packet(s) | Dependencies | Final evidence |
|---|---|---|---|---|
| Venue remote image-reference metadata, same-project Venue gallery links, bounded provenance/caption and remote URL privacy | FTR-024, FTR-092 Lot-2 media foundation, VEN-013, MED-007, MED-008, MED-010, MED-013 | WP-2.8A, WP-2.11 | Lot-1 private Storage/RLS; A before later media packets | **WP-2.8A ACCEPTED** for metadata/link/RLS/replay/privacy/boundary evidence; WP-2.11 still owns rendering/presentation evidence |
| private archived Venue image bytes, immutable originals, derivatives, project-scoped exact-byte dedup and interrupted/orphan recovery | FTR-024, FTR-092 Lot-2 private-media responsibility, VEN-013, MED-004..006, MED-009, MED-010 | WP-2.8B, WP-2.11, WP-2.12 | WP-2.8A ACCEPTED; Lot-1 private Storage/RLS | B remains PLANNED/NEXT; Storage/file lifecycle/original-derivative/orphan evidence not yet accepted |
| recoverable soft-delete/restore of Venue remote-media metadata without destroying remote/private content | FTR-024, FTR-092 metadata-retention responsibility, DELETION-RETENTION, MED-007, MED-010, MED-013 | WP-2.8C | WP-2.8A ACCEPTED; default sequence after B | C remains PLANNED; `deleted_at`, active-read filtering, retained link, restore/idempotence, RLS/non-disclosure evidence not yet accepted |
| remote-image/file/content validation and no private data in public fixtures/artifacts | MED-002/003/009/010/013, security/quality controls | WP-2.8A, WP-2.8B, WP-2.8C where lifecycle/provider boundaries apply, WP-2.9, WP-2.12 | Lot-1 security foundation | A evidence accepted for its remote-reference slice; B/C/downstream adversarial evidence remains required |

The regenerated main matrix now includes WP-2.8C directly. This addendum remains the durable record explaining why C exists and why its soft-delete/restore responsibility must not be folded back into A or silently omitted later.

## Packet sequence and state

```text
WP-2.8A — ACCEPTED / COMPLETE
  ↓
WP-2.8B — PLANNED / NEXT
  ↓ after ACCEPTED
WP-2.8C — PLANNED
  ↓ after ACCEPTED
WP-2.9 — PLANNED
```

Only one packet may be active at a time. WP-2.8B is not a semantic dependency of C; the B-before-C order preserves the already published A/B execution sequence and keeps the media work linear. C's semantic dependency is the accepted A metadata foundation.

WP-2.8A packet acceptance head/run: `925cf86f3e38bf08807ed408f6d100fbbbd5c9c2` / `34418721439` — **5/5 SUCCESS**, including clean-checkout `npm run verify`. Required WP-2.8A responsibilities minus accepted/evidenced responsibilities: **∅**; open BLOCKING/MAJOR findings: **∅**. This accepts only A's remote-reference responsibility and does not promote whole `FTR-024` / `FTR-092`.

## Sizing / fragmentation reconciliation

- WP-2.8A remains **10 points** and is **ACCEPTED / COMPLETE**; it did not absorb soft-delete/restore.
- WP-2.8B remains provisionally **8 points**, with its private Storage state-machine stop-condition still **OPEN** until B activation freezes exact states/commit/recovery semantics.
- WP-2.8C remains provisionally **8 points**, assuming reuse of A's tables/service/adapter and one protected lifecycle transition command; activation revalidation remains required.
- This is responsibility-level fragmentation, not file-level fragmentation: A handles atomic remote create/replay, B handles binary Storage recovery/original/derivative lifecycle, C handles recoverable metadata trash lifecycle.
- If activation revalidation pushes B or C over 10, split before product code rather than weakening responsibilities.

## Explicit non-assignment

WP-2.8C does **not** absorb the global 30-day Empty-trash/physical-purge scheduler or trash UI. `DELETION-RETENTION.md` remains authoritative for that later lifecycle. Lot 2 only establishes the recoverable metadata transition foundation required for Venue media.

Remote URL references and private archived copies remain independent records/assets. Soft-deleting one remote reference must not destroy a separate private archive; later physical purge must preserve the same independence rule.

## Reconciliation result

After the pre-READY repair and this post-WP-2.8A matrix regeneration:

```text
required Lot-2 WP-2.8 responsibilities - assigned packet responsibilities = ∅
required WP-2.8A responsibilities - accepted/evidenced WP-2.8A responsibilities = ∅
```

WP-2.8A is accepted only for its remote-reference foundation. WP-2.8B and WP-2.8C remain unaccepted until their own Pass A/B/C and exact-head governance gates complete. Whole `FTR-024` / `FTR-092` remains incomplete downstream.
