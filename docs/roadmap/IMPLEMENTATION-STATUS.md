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
| WP-2.9A | Venue-linked private PDF/document foundation | **BLOCKED — waits for WP-2.9C ACCEPTED** |
| WP-2.9C | trusted private-document ingestion hardening | **REVIEW_FAILED / B-REVIEW-FAILED / CURRENT** |
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

## WP-2.9 activation / remediation split

The former monolithic WP-2.9 was revalidated at **12 points** and split before code into WP-2.9A and WP-2.9B. Fresh adversarial review of A later found AR-005, which requires a new trusted server/provider boundary. Because A was already 10 points, the stop/sizing rules require a separate remediation packet rather than silent scope expansion.

`ADR 0008 — Trusted server-side private-document binary ingestion` freezes that architecture. WP-2.9C is remediation/control work only; FTR-089 product ownership remains with A.

### WP-2.9A — Venue-linked private document foundation

- **BLOCKED**.
- FIR: `#17 / FTR-089`.
- Owns FTR-089 Lot-2, `MED-001/002/003/008/010`, ordinary private PDF metadata, Venue `document_links`, private Storage lifecycle, provenance, read/download authorization and recoverable metadata soft-delete/restore.
- Reuses `project-private` at `<project_id>/documents/<document_id>/original`.
- Reuses `documents.read` / `documents.write`; no new permission key.
- Historical size **10**, cohesion **PASS**.
- Split/spec freeze `40f17aba802e7faed9eade6096e2f3629fc80654` / `34788217062` — **5/5 SUCCESS**.
- READY governance `0b30b045ef05c318d25c92abb379364f95705c4e` / `34788670807` — **5/5 SUCCESS**.
- A-IMPLEMENT governance `f5a77c72cf5f28bccd823c7cdc78b01531b3b265` / `34789115986` — **5/5 SUCCESS**.
- RED-first `9322915252925d3f75f5a224a82f9d391ccfec9d` / `34789545716` — expected RED only on the three frozen document-boundary assertions.
- Pass-A implementation/evidence `e533b5c53d1be074216ccaa92f74281b425de770` / `34826553890` — **5/5 SUCCESS**; Core 152 files / 1465 tests / 100% coverage.
- `WP29A-AR-001` — **MAJOR / CLOSED / VERIFIED**; remediation `0072792d2eb67cce1bf98c4c312d9576feacc156` / `34836621394` — **5/5 SUCCESS**.
- `WP29A-AR-002` — **MAJOR / CLOSED / VERIFIED**; remediation `c78c22ff10c02cd6ab798a21e16b5c7acbc3effb` / `34841804605` — **5/5 SUCCESS**.
- `WP29A-AR-003` — **MAJOR / CLOSED / VERIFIED**; RED `79afff6c87f7033af008de3fb3b86c3ff833b15c` / `34846914610`; remediation `fec1195dcbcfa15d97fe55b17a0fb5aad25b3813` / `34848872192`; fresh review governance `6a4e8087e3b6f3b1d3501c0ef2f0378defc119e4` / `34850247706` — remediation and fresh-review gates **5/5 SUCCESS**.
- `WP29A-AR-004` — **MAJOR / OPEN**: TypeScript C1 control-character parity is incomplete for U+0080..U+009F.
- `WP29A-AR-005` — **MAJOR / OPEN / ARCHITECTURE BLOCKER**: direct authenticated Storage ingress does not bind committed ready metadata to actual uploaded-byte SHA-256/size/MIME.
- Durable AR-004/005 failure record `a58417f79e59e2bd2d2fcb4d202f568c15cfa947` / `34854785427` — **5/5 SUCCESS**, clean-checkout included.
- Blocker resolution condition: **WP-2.9C ACCEPTED**. Then A returns to `IN_PROGRESS` for integration/reverification and a fresh Pass B before Pass C.

### WP-2.9C — Trusted private-document ingestion hardening

- **REVIEW_FAILED / B-REVIEW-FAILED / CURRENT**.
- Remediation packet for `WP29A-AR-004` and `WP29A-AR-005`; no new Feature ID or product scope.
- Architecture: ADR 0008.
- Introduces one narrow authenticated Supabase Edge Function for private Document bytes only.
- The server boundary resolves current user/live pending reservation, derives the canonical path, validates actual PDF bytes, computes actual-byte SHA-256, requires exact reserved size/hash, and uploads with server-only credentials and `upsert:false`.
- Ordinary authenticated clients lose direct Document Storage INSERT authority; existing Media behavior remains unchanged.
- Existing protected `finalize_upload` retains live `documents.write` authorization and pending→ready state responsibility.
- C1 control parity is implemented, but parent A findings remain open until C is accepted and A is reverified.
- Local Edge Runtime + real CI integration/adversarial evidence is required; mocks alone are insufficient.
- Exact 25 MB PDF ingest/finalize feasibility is green, but the fresh review found unresolved resource/recovery proof defects that prevent acceptance.
- Conservative size **10**, explicit cohesion **PASS** because endpoint, policy lock-down and exact-byte verification must ship atomically.
- Split/READY governance `d1e561c787798eb99f49024cc0c1db49880bcd82` / `34862521697` — **5/5 SUCCESS**, clean-checkout included.
- Initial Pass-A implementation `d90a643d929c35ef84444c19b7ec02ad9cd9e5a8` / `34896641824` — **5/5 SUCCESS**, clean-checkout included.
- Initial REVIEW_PENDING transition `95e5a1c2c1bccc292787b745c3ca112a3f22a39b` / `34898586925` — **5/5 SUCCESS**, clean-checkout included.
- Initial fresh Pass B found `WP29C-AR-001` MAJOR on unbounded request-body buffering.
- AR-001 remediation implementation head `264a504e4bc8208d9ff762ef71e90bea6d18216e` / `34905438530` — **5/5 SUCCESS**, clean-checkout included; Core `162` files / `1564` tests / `100%` coverage; DB `79` files / `1376` tests PASS; live Edge Runtime proves malformed-JWT denial, direct-runtime one-byte-oversize rejection, and exact `25,000,000`-byte feasibility.
- Fresh-review transition `e4efa0b74ffd5708d9888ff23e13174ec2032c68` / `34909259741` — **5/5 SUCCESS**, clean-checkout included.
- Fresh independent Pass B verdict: **REVIEW_FAILED**.
- `WP29C-AR-001` — **MAJOR / OPEN**: post-limit request draining still makes total ingress/read work depend on sender EOF; the frozen stop/cancel resource bound is not satisfied.
- `WP29C-AR-002` — **MAJOR / OPEN**: existing-object recovery uses SDK Blob download/full buffering before size validation, so an oversized poisoned object can bypass the resource bound through retry.
- `WP29C-AR-003` — **MAJOR / OPEN**: existing-object recovery accepts absent/empty stored MIME evidence instead of requiring authoritative `application/pdf` metadata.
- `WP29C-AR-004` — **MINOR / OPEN**: `Access-Control-Allow-Origin: *` is not the explicit/minimal app-origin policy required by `SEC-NET-008`.
- Pass C is forbidden until remediation is exact-head green and a later fresh independent Pass B closes all findings.

### WP-2.9B — Generic project tags and Venue entity-tag links

- **PLANNED / AFTER A**; cannot activate until A is accepted.
- Owns FTR-093 Lot-2, `tags`, `entity_tags`, active-key uniqueness, recoverable tag deletion and same-project Venue assignment.
- Reuses `project.read`, `project.settings.update`, `venues.read`, `venues.write`.
- Size **8**, cohesion **PASS**.

The original split repairs the old WP-2.9 traceability omission by assigning `MED-008` explicitly to WP-2.9A. C adds no product responsibility.

## Current next-action gate

1. WP-2.9A AR-004/005 failure record `a58417f79e59e2bd2d2fcb4d202f568c15cfa947` / `34854785427` is **5/5 SUCCESS**, clean-checkout included.
2. ADR 0008 freezes the trusted server-side Document binary-ingress architecture and WP-2.9A remains **BLOCKED** until WP-2.9C is accepted.
3. WP-2.9C split/READY `d1e561c787798eb99f49024cc0c1db49880bcd82` / `34862521697`, initial Pass-A `d90a643d929c35ef84444c19b7ec02ad9cd9e5a8` / `34896641824`, initial REVIEW_PENDING `95e5a1c2c1bccc292787b745c3ca112a3f22a39b` / `34898586925`, remediation head `264a504e4bc8208d9ff762ef71e90bea6d18216e` / `34905438530`, and fresh-review transition `e4efa0b74ffd5708d9888ff23e13174ec2032c68` / `34909259741` are all **5/5 SUCCESS**, clean-checkout included.
4. The fresh independent Pass B nevertheless fails on contract review: AR-001 remains MAJOR open, AR-002 and AR-003 are new MAJOR open findings, and AR-004 is MINOR open.
5. WP-2.9C is **REVIEW_FAILED / B-REVIEW-FAILED / CURRENT**. Green CI does not override the unresolved security-contract defects.
6. The only permitted next action is bounded remediation of `WP29C-AR-001..004`. When remediation begins, transition C back to `IN_PROGRESS / A-IMPLEMENT — RED FIRST`.
7. RED-first evidence must prove: continuing post-limit senders cannot force work to EOF; oversized existing objects are not fully materialized; missing/wrong stored MIME cannot be attested; unknown CORS origins are not allowed.
8. If the Supabase Edge runtime cannot support a hard 25 MB ingress boundary without unbounded draining, C must become `BLOCKED` and ADR 0008 must be revisited rather than weakening the contract or shrinking the 25 MB limit silently.
9. After remediation, require exact-head CI plus another complete fresh Pass B before Pass C.
10. C acceptance, WP-2.9A resumption and WP-2.9B activation remain forbidden until that sequence completes.

## Known localized repairs / stop conditions

- WP-2.4 evidence/confidence: **CLOSED / VERIFIED**.
- WP-2.5 readiness/manual-assessment/dynamic guest-count semantics: **CLOSED / VERIFIED**.
- WP-2.6 commercial/availability/contact/interaction boundaries: **CLOSED / VERIFIED**.
- WP-2.7 origin-location snapshots/canonical portability/ACC-030: **CLOSED / VERIFIED**.
- `docs/security/STORAGE-RLS.md`: **CLOSED / VERIFIED** for its prior defect; WP-2.9C now introduces a deliberate Document-only policy hardening under ADR 0008.
- WP-2.8A URL/replay identity parity: **CLOSED / VERIFIED**.
- WP-2.8B private lifecycle/Storage↔DB recovery and MED-006 receipt: **CLOSED / VERIFIED**.
- WP-2.8C optimistic revision/provider/adversarial gaps: **CLOSED / VERIFIED**.
- WP-2.9 pre-activation sizing and MED-008 traceability: **CLOSED / VERIFIED** by `40f17aba...` / `34788217062`.
- WP-2.9A Pass-A coverage/format/maintainability closure: historical **CLOSED / VERIFIED** by `e533b5c5...` / `34826553890`; affected integrity verification is reopened by later review findings.
- WP29A-AR-001 Document read/list/download foundation: **CLOSED / VERIFIED**.
- WP29A-AR-002 read-parser Unicode-scalar filename parity: **CLOSED / VERIFIED**.
- WP29A-AR-003 lifecycle receipt/bounded-text Unicode parity: **CLOSED / VERIFIED**.
- WP29A-AR-004 C1 control-character parity: **MAJOR / OPEN**, assigned remediation WP-2.9C; implementation present, parent closure waits for C acceptance and A reverification.
- WP29A-AR-005 committed-object integrity: **MAJOR / OPEN / ARCHITECTURE BLOCKER**, assigned remediation WP-2.9C under ADR 0008; parent closure waits for C acceptance and A reverification.
- WP29C-AR-001 bounded Edge request-body resource consumption: **MAJOR / OPEN**; memory is bounded but ingress/read work still depends on EOF.
- WP29C-AR-002 existing-object recovery resource bound: **MAJOR / OPEN**; Blob download materializes the object before size rejection.
- WP29C-AR-003 existing-object MIME proof: **MAJOR / OPEN**; absent/empty provider MIME is currently accepted.
- WP29C-AR-004 explicit/minimal Edge CORS: **MINOR / OPEN**.

## Durable handoff

```text
main integration truth: f6da05626f024431230ae46ca1ec8a4becc72a1f
Lot 0: ACCEPTED
Lot 1: ACCEPTED
Lot 2: IN_PROGRESS
Lot 2 branch: lot-2/venues-core
Accepted durable Lot-2 packets: WP-2.1..WP-2.8C
Last completed packet: WP-2.8C — ACCEPTED / COMPLETE
WP-2.9A: BLOCKED — waits for WP-2.9C ACCEPTED
Current packet: WP-2.9C — REVIEW_FAILED / B-REVIEW-FAILED
WP-2.9C architecture: ADR 0008 — trusted server-side private-document binary ingestion
Closed findings: WP29A-AR-001 / AR-002 / AR-003 — MAJOR — VERIFIED
Parent open finding: WP29A-AR-004 — MAJOR — C1 control-character parity — remediation implemented in C; closure waits for C acceptance + A reverification
Parent open finding: WP29A-AR-005 — MAJOR / architecture blocker — exact stored-byte integrity — remediation implemented in C but parent closure waits for C acceptance + A reverification
WP29C-AR-001: MAJOR / OPEN — post-limit ingress still drains to sender EOF
WP29C-AR-002: MAJOR / OPEN — replay path fully buffers existing object before size validation
WP29C-AR-003: MAJOR / OPEN — replay MIME proof accepts absent/empty MIME
WP29C-AR-004: MINOR / OPEN — wildcard CORS conflicts with SEC-NET-008
FTR-089 FIR: #17
AR-004/005 durable failure: a58417f79e59e2bd2d2fcb4d202f568c15cfa947 / 34854785427 — 5/5 SUCCESS
WP-2.9C split/READY: d1e561c787798eb99f49024cc0c1db49880bcd82 / 34862521697 — 5/5 SUCCESS
WP-2.9C initial Pass-A: d90a643d929c35ef84444c19b7ec02ad9cd9e5a8 / 34896641824 — 5/5 SUCCESS
WP-2.9C initial REVIEW_PENDING: 95e5a1c2c1bccc292787b745c3ca112a3f22a39b / 34898586925 — 5/5 SUCCESS
WP29C-AR-001 remediation implementation: 264a504e4bc8208d9ff762ef71e90bea6d18216e / 34905438530 — 5/5 SUCCESS
Fresh-review transition: e4efa0b74ffd5708d9888ff23e13174ec2032c68 / 34909259741 — 5/5 SUCCESS
Fresh Pass B verdict: REVIEW_FAILED
WP-2.9C size: 10 points — cohesion PASS
Current gate: remediate WP29C-AR-001..004 RED-first; then exact-head CI and another fresh Pass B
WP-2.9A resumes only after WP-2.9C ACCEPTED
WP-2.9B remains PLANNED / AFTER A
Lots 3–12: NOT_STARTED
```
