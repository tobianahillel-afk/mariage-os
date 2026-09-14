# Mariage OS — Implementation Status Board

Status: **Living repository source of truth for development progress**

Detailed historical packet evidence remains in packet records, acceptance records, coverage matrices, FIRs and Git history.

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

`main` integration truth after accepted Lot 0 + Lot 1 promotion is `f6da05626f024431230ae46ca1ec8a4becc72a1f` (PR #7). Promotion CI `34030211097`: **5/5 SUCCESS**, clean-checkout included.

Lot-2 branch: `lot-2/venues-core`.

## Lot 2 — packet status

Required current-lot responsibilities minus assigned packet responsibilities: **∅**.

| Packet | Responsibility | State |
|---|---|---|
| WP-2.1 | venue identity, authorized persistence, lifecycle history | **ACCEPTED / COMPLETE** |
| WP-2.2 | spaces, capacity, member ratings/preferences | **ACCEPTED / COMPLETE** |
| WP-2.3 | fact definitions, typed retained facts, value validation | **ACCEPTED / COMPLETE** |
| WP-2.4 | observations, sources, evidence/confidence/freshness, conflicts | **ACCEPTED / COMPLETE** |
| WP-2.5 | deterministic criteria, blockers, score/readiness, missing information | **ACCEPTED / COMPLETE** |
| WP-2.6A | Venue offers and offer components | **ACCEPTED / COMPLETE** |
| WP-2.6B | Venue availability observations | **ACCEPTED / COMPLETE** |
| WP-2.6C | Venue contacts | **ACCEPTED / COMPLETE** |
| WP-2.6D | Venue interaction history | **ACCEPTED / COMPLETE** |
| WP-2.7 | contextual venue access-route observations | **ACCEPTED / COMPLETE** |
| WP-2.8A | Venue remote-image metadata and Venue links | **ACCEPTED / COMPLETE** |
| WP-2.8B | Venue private archived media lifecycle | **ACCEPTED / COMPLETE** |
| WP-2.8C | recoverable Venue remote-media metadata lifecycle | **ACCEPTED / COMPLETE** |
| WP-2.9A | Venue-linked private PDF/document foundation | **REVIEW_PENDING / B-ADVERSARIAL-REVIEW / CURRENT** |
| WP-2.9B | generic project tags and Venue entity-tag links | **PLANNED / AFTER A** |
| WP-2.10 | repositories, local cache, pending/offline mutations | PLANNED |
| WP-2.11 | gallery/table/detail/compare/deep-link workspace | PLANNED |
| WP-2.12 | mobile/offline venue-visit workflow and packet E2E completion | PLANNED |

## Accepted packet evidence summary

- WP-2.1: governance CI `34040803267` — **5/5 SUCCESS**.
- WP-2.2: governance CI `34048565452` — **5/5 SUCCESS**.
- WP-2.3: `2e3194f7109eb30eee4e73ace7ecbdd329fd321c` / `34068703691` — **5/5 SUCCESS**.
- WP-2.4: `93262f9459e720d97a6dfa3a83f84f02f3a02c7c` / `34137822804` — **5/5 SUCCESS**.
- WP-2.5: `902ac6f56b84fed56da0113efc610617943e9449` / `34167062632` — **5/5 SUCCESS**.
- WP-2.6A: `186933ed0af8c45ddaa1b5c883bfd3f70086c6fe` / `34238484533` — **5/5 SUCCESS**.
- WP-2.6B: `8911f1523d96b95cf1329c4b144bfec2356a4a47` / `34275967235` — **5/5 SUCCESS**.
- WP-2.6C: `f6c93b7991d832363da92a9081540b9bad95441b` / `34287865010` attempt 2 — **5/5 SUCCESS**.
- WP-2.6D: `767017112445a38863abd114e8c62feb27af6421` / `34322712448` — **5/5 SUCCESS**.
- WP-2.7: `db1dae663129c3281618c932fa7f5a8184a5a2ad` / `34377221997` — **5/5 SUCCESS**, gap **∅**.
- WP-2.8A: acceptance `925cf86f3e38bf08807ed408f6d100fbbbd5c9c2` / `34418721439`; reconciliation `432e0cf893e0adc079ba3c25eb325efb9d01e3ec` / `34420275595` — both **5/5 SUCCESS**, gap **∅**.
- WP-2.8B: acceptance `3b28c7b734a2258db455bbdabb567fcee2ee2bd1` / `34615830961`; durable closure `8317125183bc5521d6d4aac8e132f64a57aa4ca8` / `34616938470` — both **5/5 SUCCESS**, gap **∅**.
- WP-2.8C: Pass-A `e7510b64471a85b3894ba26345df7fe71533b1c3` / `34628542194`; fresh Pass-B `5e4246e6f63db899fb8a683d9381614a6ee75b11` / `34785068206`; Pass-C entry `fc2358a85cb367a7f3aa17cc9757a00c5888ed39` / `34785516861`; acceptance `ecaa3900bbccd070e613e51bc99f3f133b436d0f` / `34786115925`; durable closure `7f97ab8bab9c60ba538b5c900845ca77e9b9f34c` / `34786974129` — final closure **5/5 SUCCESS**, gap **∅**.

## WP-2.9 activation / split

The former monolithic WP-2.9 was revalidated at **12 points** and split before code under `AI-LOT-ORCHESTRATION.md`.

### WP-2.9A — Venue-linked private document foundation

- **REVIEW_PENDING / B-ADVERSARIAL-REVIEW / CURRENT**.
- FIR: `#17 / FTR-089`.
- Owns FTR-089 Lot-2, `MED-001/002/003/008/010`, ordinary private PDF metadata, Venue `document_links`, private Storage lifecycle, provenance, read/download authorization and recoverable metadata soft-delete/restore.
- Reuses `project-private` at `<project_id>/documents/<document_id>/original`.
- Reuses `documents.read` / `documents.write`; no new permission key.
- Size **10**, cohesion **PASS**.
- Split/spec freeze `40f17aba802e7faed9eade6096e2f3629fc80654` / `34788217062` — **5/5 SUCCESS**.
- READY governance `0b30b045ef05c318d25c92abb379364f95705c4e` / `34788670807` — **5/5 SUCCESS**, clean-checkout included.
- A-IMPLEMENT governance `f5a77c72cf5f28bccd823c7cdc78b01531b3b265` / `34789115986` — **5/5 SUCCESS**, clean-checkout included.
- RED-first `9322915252925d3f75f5a224a82f9d391ccfec9d` / `34789545716` — expected RED only on the three frozen document-boundary assertions.
- Pass-A implementation/evidence `e533b5c53d1be074216ccaa92f74281b425de770` / `34826553890` — **5/5 SUCCESS**, clean-checkout included; Core 152 files / 1465 tests / 100% statements, branches, functions and lines.
- `WP29A-AR-001` — **MAJOR / CLOSED / VERIFIED**: missing typed `list/download-auth` boundary; remediation `0072792d2eb67cce1bf98c4c312d9576feacc156` / `34836621394` — **5/5 SUCCESS**.
- Fresh Pass-B entry/governance `78904546f3d8f4c15276a1bbe0825455f1262ee4` / `34837421096` — **5/5 SUCCESS**.
- `WP29A-AR-002` — **MAJOR / CLOSED / VERIFIED**: read parser UTF-16 filename counting; durable failure `9654c90ed7da27033d1f08d6effc6f47cac3dff9` / `34839274681`, remediation transition `b2e94c47f6d523adbf731fdd15cf796cca4c5ca9` / `34840180167`, focused RED `2f06b7963e7d09e3c00264d3351745213a75f964` / `34840851767`, remediation `c78c22ff10c02cd6ab798a21e16b5c7acbc3effb` / `34841804605` — remediation **5/5 SUCCESS**, Core 158 files / 1546 tests / 100% coverage.
- Review-pending transition `c6c3afa56a66be97a590d4ce2b63932e6af5a46e` / `34842684753` — **5/5 SUCCESS**, clean-checkout included.
- Fresh Pass B verifies the AR-002 read-parser remediation but finds `WP29A-AR-003` — **MAJOR / OPEN**: Unicode-length parity remains broken in the lifecycle receipt parser and bounded `document_type`/`title` provider parsing.
- Durable AR-003 review-failure record `39ea780ac9ac724a9450a5ac8a5d0179986591ed` / `34844606086` — **5/5 SUCCESS**, clean-checkout included.
- AR-003 remediation-transition governance `9b266ca9ba3c6e737525db03a5856c39d4f44ed7` / `34845524190` — **5/5 SUCCESS**, clean-checkout included.
- AR-003 focused RED `79afff6c87f7033af008de3fb3b86c3ff833b15c` / `34846914610` — expected RED isolated to **4 Unicode-parity tests**; Core 1546 passing / 4 failing tests while static, DB/RLS and Browser/mutation remained green.
- AR-003 remediation/evidence `fec1195dcbcfa15d97fe55b17a0fb5aad25b3813` / `34848872192` — **5/5 SUCCESS**, clean-checkout included; Core **159 files / 1550 tests / 100% statements, branches, functions and lines**.
- AR-003 remains **MAJOR / OPEN** until a fresh adversarial review independently verifies the remediation.

### WP-2.9B — Generic project tags and Venue entity-tag links

- **PLANNED / AFTER A**; cannot activate while A is active.
- Owns FTR-093 Lot-2, `tags`, `entity_tags`, active-key uniqueness, recoverable tag deletion and same-project Venue assignment.
- Reuses `project.read`, `project.settings.update`, `venues.read`, `venues.write`.
- Size **8**, cohesion **PASS**.

The split repairs the old WP-2.9 traceability omission by assigning `MED-008` explicitly to WP-2.9A, matching the frozen requirement-feature matrix for FTR-089.

## Current next-action gate

1. Pass-A historical evidence remains `e533b5c53d1be074216ccaa92f74281b425de770` / `34826553890` — **5/5 SUCCESS**.
2. `WP29A-AR-001` and `WP29A-AR-002` are **CLOSED / VERIFIED**.
3. `WP29A-AR-003` remains **MAJOR / OPEN** pending fresh review; its focused RED is `79afff6c87f7033af008de3fb3b86c3ff833b15c` / `34846914610`.
4. AR-003 remediation/evidence `fec1195dcbcfa15d97fe55b17a0fb5aad25b3813` / `34848872192` is **5/5 SUCCESS**, clean-checkout included, with Core **159 files / 1550 tests / 100% coverage**.
5. WP-2.9A is now **REVIEW_PENDING / B-ADVERSARIAL-REVIEW**. This governance-transition commit must pass exact-head CI before fresh Pass B begins.
6. Once that gate is green, the only permitted next phase is a fresh adversarial review of the full WP-2.9A surface, including AR-001/002 regression, AR-003 Unicode parity, RLS/Storage/path/identity and list/read/download boundaries.
7. Pass C, WP-2.9B and later packets remain forbidden until fresh Pass B leaves no BLOCKING/MAJOR finding unresolved.

## Known localized repairs / stop conditions

- WP-2.4 evidence/confidence: **CLOSED / VERIFIED**.
- WP-2.5 readiness/manual-assessment/dynamic guest-count semantics: **CLOSED / VERIFIED**.
- WP-2.6 commercial/availability/contact/interaction boundaries: **CLOSED / VERIFIED**.
- WP-2.7 origin-location snapshots/canonical portability/ACC-030: **CLOSED / VERIFIED**.
- `docs/security/STORAGE-RLS.md`: **CLOSED / VERIFIED**.
- WP-2.8A URL/replay identity parity: **CLOSED / VERIFIED**.
- WP-2.8B private lifecycle/Storage↔DB recovery and MED-006 receipt: **CLOSED / VERIFIED**.
- WP-2.8C optimistic revision/provider/adversarial gaps: **CLOSED / VERIFIED**.
- WP-2.9 pre-activation sizing and MED-008 traceability: **CLOSED / VERIFIED** by `40f17aba...` / `34788217062` 5/5.
- WP-2.9A Pass-A coverage/format/maintainability closure: **CLOSED / VERIFIED** by `e533b5c5...` / `34826553890` 5/5.
- WP29A-AR-001 Document read/list/download foundation: **CLOSED / VERIFIED** by remediation `0072792d...` / `34836621394` and fresh review gate `78904546...` / `34837421096`, both 5/5.
- WP29A-AR-002 read-parser Unicode-scalar filename parity: **CLOSED / VERIFIED** by remediation `c78c22ff...` / `34841804605` and fresh review on `c6c3afa5...` / `34842684753`.
- WP29A-AR-003 lifecycle receipt/bounded-text Unicode parity: **MAJOR / OPEN / REVIEW_PENDING**; RED `79afff6c...` / `34846914610`, remediation `fec1195d...` / `34848872192` **5/5 SUCCESS**. Fresh adversarial review is required before closure.

## Durable handoff

```text
main integration truth: f6da05626f024431230ae46ca1ec8a4becc72a1f
Lot 0: ACCEPTED
Lot 1: ACCEPTED
Lot 2: IN_PROGRESS
Lot 2 branch: lot-2/venues-core
Accepted durable Lot-2 packets: WP-2.1..WP-2.8C
Last completed packet: WP-2.8C — ACCEPTED / COMPLETE
Current packet: WP-2.9A — REVIEW_PENDING / B-ADVERSARIAL-REVIEW
Closed finding: WP29A-AR-001 — MAJOR — remediation verified by fresh Pass B
Closed finding: WP29A-AR-002 — MAJOR — read-parser remediation verified by fresh Pass B
Open finding: WP29A-AR-003 — MAJOR — remediation green, fresh verification pending
FTR-089 FIR: #17
Following packet: WP-2.9B — PLANNED / AFTER A
Pass-A final: e533b5c53d1be074216ccaa92f74281b425de770 / 34826553890 — 5/5 SUCCESS
AR-001 remediation: 0072792d2eb67cce1bf98c4c312d9576feacc156 / 34836621394 — 5/5 SUCCESS
AR-002 remediation final: c78c22ff10c02cd6ab798a21e16b5c7acbc3effb / 34841804605 — 5/5 SUCCESS
Prior fresh-review entry: c6c3afa56a66be97a590d4ce2b63932e6af5a46e / 34842684753 — 5/5 SUCCESS
AR-003 durable review failure: 39ea780ac9ac724a9450a5ac8a5d0179986591ed / 34844606086 — 5/5 SUCCESS
AR-003 remediation transition: 9b266ca9ba3c6e737525db03a5856c39d4f44ed7 / 34845524190 — 5/5 SUCCESS
AR-003 focused RED: 79afff6c87f7033af008de3fb3b86c3ff833b15c / 34846914610 — expected RED, 1546 passing / 4 failing
AR-003 remediation evidence: fec1195dcbcfa15d97fe55b17a0fb5aad25b3813 / 34848872192 — 5/5 SUCCESS, 159 files / 1550 tests / 100% coverage
Current gate: exact-head CI for REVIEW_PENDING governance transition; then fresh Pass B
Pass C forbidden until no BLOCKING/MAJOR finding remains unresolved
WP-2.9B and later packets untouched
Lots 3–12: NOT_STARTED
```
