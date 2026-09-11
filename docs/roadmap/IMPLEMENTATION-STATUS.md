# Mariage OS — Implementation Status Board

Status: **Living repository source of truth for development progress**

This board is intentionally current and context-free. Exhaustive historical packet evidence remains in packet records, coverage matrices and Git history.

## Current phase

- V1 documentation/design: **COMPLETE / FROZEN**.
- Guest RSVP + Email/SMS/WhatsApp scope: **MERGED / FROZEN**.
- AI Lot Orchestration governance: **MERGED / FROZEN**.
- Final Design Review: **PASS**.
- Implementation gate: **OPEN**.
- Lot 0: **ACCEPTED** — completed 2026-09-03.
- Lot 1: **ACCEPTED** — completed 2026-09-06.
- Lot 2: **IN_PROGRESS — Venues core**.
- Lots 3–12: **NOT_STARTED**.

`main` integration truth after accepted Lot 0 + Lot 1 promotion is `f6da05626f024431230ae46ca1ec8a4becc72a1f` (PR #7). Promotion CI `34030211097`: **5/5 SUCCESS**, including clean-checkout `npm run verify`.

## Lot 2 — packet status

Required current-lot responsibilities minus assigned packet responsibilities: **∅**.

| Packet | Responsibility | State |
|---|---|---|
| WP-2.1 | venue identity, authorized persistence, lifecycle history | **ACCEPTED** |
| WP-2.2 | spaces, capacity, member ratings/preferences | **ACCEPTED** |
| WP-2.3 | fact definitions, typed retained facts, value validation | **ACCEPTED** |
| WP-2.4 | observations, sources, evidence/confidence/freshness, conflicts | **ACCEPTED** |
| WP-2.5 | deterministic criteria, blockers, score/readiness, missing information | **ACCEPTED** |
| WP-2.6A | Venue offers and offer components | **ACCEPTED** |
| WP-2.6B | Venue availability observations | **ACCEPTED** |
| WP-2.6C | Venue contacts | **ACCEPTED** |
| WP-2.6D | Venue interaction history | **ACCEPTED** |
| WP-2.7 | contextual venue access-route observations | **ACCEPTED** |
| WP-2.8A | Venue remote-image metadata and Venue links | **ACCEPTED** |
| WP-2.8B | Venue private archived media lifecycle | **ACCEPTED / COMPLETE** |
| WP-2.8C | recoverable Venue remote-media metadata lifecycle | **PLANNED / NEXT** |
| WP-2.9 | venue document/tag/link basics | PLANNED |
| WP-2.10 | repositories, local cache, pending/offline mutations | PLANNED |
| WP-2.11 | gallery/table/detail/compare/deep-link workspace | PLANNED |
| WP-2.12 | mobile/offline venue-visit workflow and packet E2E completion | PLANNED |

## Accepted packet evidence summary

- WP-2.1 **ACCEPTED**; governance CI `34040803267` **5/5 SUCCESS**.
- WP-2.2 **ACCEPTED**; governance CI `34048565452` **5/5 SUCCESS**.
- WP-2.3 **ACCEPTED**; final reviewed head `2e3194f7109eb30eee4e73ace7ecbdd329fd321c`, CI `34068703691` **5/5 SUCCESS**.
- WP-2.4 **ACCEPTED**; final fresh reviewed head `93262f9459e720d97a6dfa3a83f84f02f3a02c7c`, CI `34137822804` **5/5 SUCCESS**.
- WP-2.5 **ACCEPTED**; final acceptance governance `902ac6f56b84fed56da0113efc610617943e9449` / `34167062632` **5/5 SUCCESS**.
- WP-2.6A **ACCEPTED**; `186933ed0af8c45ddaa1b5c883bfd3f70086c6fe` / `34238484533` **5/5 SUCCESS**.
- WP-2.6B **ACCEPTED**; `8911f1523d96b95cf1329c4b144bfec2356a4a47` / `34275967235` **5/5 SUCCESS**.
- WP-2.6C **ACCEPTED**; `f6c93b7991d832363da92a9081540b9bad95441b` / `34287865010` attempt 2 **5/5 SUCCESS**.
- WP-2.6D **ACCEPTED**; `767017112445a38863abd114e8c62feb27af6421` / `34322712448` **5/5 SUCCESS**.
- WP-2.7 **ACCEPTED / COMPLETE**; `db1dae663129c3281618c932fa7f5a8184a5a2ad` / `34377221997` **5/5 SUCCESS**; responsibility gap **∅**.
- WP-2.8A **ACCEPTED / COMPLETE**; packet acceptance `925cf86f3e38bf08807ed408f6d100fbbbd5c9c2` / `34418721439` and coverage reconciliation `432e0cf893e0adc079ba3c25eb325efb9d01e3ec` / `34420275595` — **5/5 SUCCESS**; responsibility gap **∅**.
- WP-2.8B **ACCEPTED / COMPLETE** by Pass-C reconciliation `lot-2/WP-2.8B-ACCEPTANCE.md`; Pass-A checkpoint `150c10c07452748e3092e316a3cb9a26f272ff3e` / `34555183344` **5/5 SUCCESS**; first fresh Pass B `a23e6925f4d95e5d49cdea5b4e62b899cdd7a605` / `34555832894` **5/5 SUCCESS**; MED-006 RED diagnostic `4eddca8aa94a2ed95d37bac47b8f3efeb3b4faf4` / `34556856411`; remediation `f815844d9f4a2c62575ee91530af94febf78dab0` / `34605466532` **5/5 SUCCESS**; fresh affected Pass B **PASS**; Pass-C entry `70c251fee7a54bf1f5de9e3fca4dee6ce067d778` / `34614442341` **5/5 SUCCESS**; responsibility gap **∅**, open BLOCKING/MAJOR/MINOR-carried findings **∅**.

The WP-2.8B acceptance claim becomes durable only when the final acceptance-governance HEAD containing this status/coverage reconciliation itself passes exact-head CI. Until then WP-2.8C remains **PLANNED** and is not activated.

## WP-2.8 media foundation

### WP-2.8A — remote-image metadata and links

- **ACCEPTED / COMPLETE**.
- Owns remote image metadata, same-project Venue gallery links, privacy-safe/canonical remote URL persistence and accepted provider boundaries.
- Does not own private binary lifecycle, recoverable remote metadata deletion, rendering/UI or offline capture.

### WP-2.8B — private archived media lifecycle

- **ACCEPTED / COMPLETE** through Pass A/B/C.
- Packet record: `lot-2/WP-2.8B.md`.
- Pass-C reconciliation: `lot-2/WP-2.8B-ACCEPTANCE.md`.
- Owns private JPEG/PNG/WebP archive validation, pending/ready lifecycle, immutable originals, versioned thumbnail/preview derivatives, exact reservation-bound Storage RLS, interrupted-upload recovery/cleanup and project-scoped SHA-256 detect-only duplicate reporting.
- MED-006 finalization receipt returns deterministic same-project ready-original duplicate IDs; current media, pending media, derivatives, remote refs and foreign-project equal hashes are excluded. Replay preserves the stored receipt snapshot. No automatic merge/reuse/delete occurs.
- Reuses the accepted `project-private` bucket and `media.read` / `media.write` model; no parallel bucket/Media architecture exists.
- `ACC-055`, `ACC-056`, `ACC-058` are persisted acceptance evidence.
- Required WP-2.8B responsibility gap: **∅**.

### WP-2.8C — recoverable remote-media metadata lifecycle

- **PLANNED / NEXT** only; not READY and not activated.
- Owns remote-media metadata soft-delete/restore, active-read filtering, retained Venue links, idempotent lifecycle replay, live `media.write` authorization and non-disclosure.
- Before READY, revalidate its provisional size and still-open optimistic revision/receipt activation details against the now-accepted A+B foundation.
- Does not own global 30-day physical purge/trash UI or private-binary lifecycle.

Whole `FTR-024` / `FTR-092` remains incomplete because WP-2.8C, WP-2.11, WP-2.12 and later Lot 10/11 responsibilities remain downstream.

## Current next-action gate

After the final WP-2.8B acceptance-governance HEAD is exact-head **5/5 SUCCESS**:

1. WP-2.8B is durably accepted and must not be reopened absent a new finding.
2. Revalidate WP-2.8C activation contract/sizing/coverage.
3. If that revalidation is green, transition WP-2.8C `PLANNED → READY` in a separate governance commit and require its exact-head CI before implementation.
4. Do not combine WP-2.8B acceptance with WP-2.8C product implementation.

## Known localized specification repairs / stop-conditions

- WP-2.4 evidence/confidence: **CLOSED / VERIFIED**.
- WP-2.5 readiness/manual-assessment/dynamic guest-count semantics: **CLOSED / VERIFIED**.
- WP-2.6 commercial/availability/contact/interaction boundaries: **CLOSED / VERIFIED**.
- WP-2.7 origin-location snapshots/canonical portability/ACC-030: **CLOSED / VERIFIED**.
- `docs/security/STORAGE-RLS.md` repair: **CLOSED / VERIFIED**.
- WP-2.8 media split/type/category/remote lifecycle ambiguity: **CLOSED / VERIFIED**.
- WP-2.8A URL/replay identity parity: **CLOSED / VERIFIED**.
- WP-2.8B private lifecycle/Storage↔DB recovery contract: **CLOSED / VERIFIED**.
- WP-2.8B MED-006 finalization receipt gap: **CLOSED / VERIFIED** by `f815844...` / `34605466532`, fresh affected Pass B PASS and Pass-C reconciliation.
- WP-2.8C optimistic revision/receipt activation detail: **OPEN for WP-2.8C only**; resolve/revalidate before READY.

## Lot status

| Lot | State |
|---:|---|
| 0 | **ACCEPTED** |
| 1 | **ACCEPTED** |
| 2 | **IN_PROGRESS** |
| 3–12 | NOT_STARTED |

## Durable handoff

```text
main integration truth: f6da05626f024431230ae46ca1ec8a4becc72a1f
Lot 0: ACCEPTED
Lot 1: ACCEPTED
Lot 2: IN_PROGRESS
Lot 2 branch: lot-2/venues-core
Accepted Lot-2 packets: WP-2.1, WP-2.2, WP-2.3, WP-2.4, WP-2.5, WP-2.6A, WP-2.6B, WP-2.6C, WP-2.6D, WP-2.7, WP-2.8A, WP-2.8B
Last completed packet: WP-2.8B — ACCEPTED / COMPLETE
Next packet: WP-2.8C — PLANNED / NEXT
WP-2.8B Pass-A: 150c10c07452748e3092e316a3cb9a26f272ff3e / 34555183344 — 5/5 SUCCESS
WP-2.8B first Pass-B: a23e6925f4d95e5d49cdea5b4e62b899cdd7a605 / 34555832894 — 5/5 SUCCESS
WP-2.8B MED-006 diagnostic: 4eddca8aa94a2ed95d37bac47b8f3efeb3b4faf4 / 34556856411 — EXPECTED RED
WP-2.8B remediation: f815844d9f4a2c62575ee91530af94febf78dab0 / 34605466532 — 5/5 SUCCESS
WP-2.8B fresh affected Pass-B: PASS; findings carried = ∅
WP-2.8B Pass-C entry: 70c251fee7a54bf1f5de9e3fca4dee6ce067d778 / 34614442341 — 5/5 SUCCESS
WP-2.8B Pass-C reconciliation: PASS; required-minus-evidenced = ∅
Current gate: final acceptance-governance HEAD exact-head CI
Next permitted action after final 5/5: WP-2.8C activation revalidation only; no WP-2.8C implementation yet
Lots 3–12: NOT_STARTED
```
