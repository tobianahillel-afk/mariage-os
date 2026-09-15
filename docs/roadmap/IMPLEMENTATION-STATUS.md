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
| WP-2.9C | trusted private-document ingestion hardening | **IN_PROGRESS / A-IMPLEMENT — RED FIRST / CURRENT** |
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

The former monolithic WP-2.9 was revalidated at **12 points** and split before code into WP-2.9A and WP-2.9B. Fresh adversarial review of A later found AR-005, requiring a trusted server/provider boundary. Because A was already 10 points, the stop/sizing rules created the separate WP-2.9C remediation packet rather than silently expanding A.

ADR 0008 originally froze trusted server-side private-document ingestion. ADR 0009 replaced only raw PDF request-body transport with bounded private staging plus bodyless promotion. ADR 0010 is now **ACCEPTED** and moves the trusted promotion compute/HTTP boundary from Supabase Edge Functions to one narrow same-origin Cloudflare Pages Function. WP-2.9C remains remediation/control work only; FTR-089 product ownership remains with A.

### WP-2.9A — Venue-linked private document foundation

- **BLOCKED**.
- FIR: `#17 / FTR-089`.
- Owns FTR-089 Lot-2, `MED-001/002/003/008/010`, ordinary private PDF metadata, Venue `document_links`, private Storage lifecycle, provenance, read/download authorization and recoverable metadata soft-delete/restore.
- Reuses `project-private` at `<project_id>/documents/<document_id>/original`.
- Reuses `documents.read` / `documents.write`; no new permission key.
- Historical size **10**, cohesion **PASS**.
- Pass-A implementation/evidence `e533b5c53d1be074216ccaa92f74281b425de770` / `34826553890` — **5/5 SUCCESS**; Core 152 files / 1465 tests / 100% coverage.
- `WP29A-AR-001` / `AR-002` / `AR-003` — **MAJOR / CLOSED / VERIFIED**.
- `WP29A-AR-004` — **MAJOR / OPEN in parent**: C1 control-character parity remediation is implemented in C; parent closure waits for C acceptance and A reverification.
- `WP29A-AR-005` — **MAJOR / OPEN in parent**: trusted stored-byte integrity remediation is implemented in C; parent closure waits for C acceptance and A reverification.
- Blocker resolution condition: **WP-2.9C ACCEPTED**. Then A returns to `IN_PROGRESS` for integration/reverification and fresh Pass B before Pass C.

### WP-2.9C — Trusted private-document ingestion hardening

- **IN_PROGRESS / A-IMPLEMENT — RED FIRST / CURRENT**.
- Architecture blocker record is **RESOLVED** by accepted ADR 0010; `WP29C-AR-001` itself remains MAJOR/open until implementation evidence closes it.
- Current architecture chain: ADR 0008 trust/integrity intent → ADR 0009 bounded staging/bodyless promotion → ADR 0010 Cloudflare Pages Function promotion compute/ingress boundary.
- Accepted promotion route: `POST /api/private-document-promote` on the same Cloudflare Pages deployment.
- The Pages Function **replaces**, rather than proxies, the old Supabase `private-document-ingest` Edge Function; the Supabase promotion function must be removed from deployable code/configuration to close direct-origin bypass.
- ADR 0001 is amended narrowly for this one security boundary; a general custom Cloudflare backend remains forbidden.
- Conservative size **10**, cohesion **PASS**.

Already implemented ADR-0009 controls include:

- private `document-ingest-staging` bucket with exact `25,000,000` byte and `application/pdf` constraints;
- one narrow authenticated pending-document INSERT policy and no ordinary staging SELECT/UPDATE/DELETE;
- authenticated client canonical Document INSERT denial while accepted Media behavior stays unchanged;
- browser staging with `upsert:false`;
- live current-user and `documents.write` authorization around privileged transitions;
- authoritative reservation/path derivation and staging metadata validation before materialization;
- actual staged-byte PDF signature, size and SHA-256 proof;
- privileged no-overwrite canonical copy plus exact canonical retry/recovery proof;
- service-only ingest attestation and independent finalization reauthorization;
- server-side staging cleanup;
- explicit/minimal CORS behavior;
- no application promotion-body read.

Current finding state:

- `WP29C-AR-001` — **MAJOR / OPEN / RED TARGET**: current Supabase public promotion route waits for sender EOF; accepted ADR 0010 requires a real Pages/Workers runtime test where an intentionally open-ended framed sender is rejected without EOF, plus proof the old Supabase promotion route is absent/unusable.
- `WP29C-AR-002` — **remediation implemented / runtime-green**, formal closure waits for complete fresh Pass B.
- `WP29C-AR-003` — **remediation implemented / runtime-green**, formal closure waits for complete fresh Pass B.
- `WP29C-AR-004` — **remediation implemented / runtime-green**, formal closure waits for complete fresh Pass B.

Key remediation history:

- split/READY `d1e561c787798eb99f49024cc0c1db49880bcd82` / `34862521697` — **5/5 SUCCESS**;
- initial Pass-A `d90a643d929c35ef84444c19b7ec02ad9cd9e5a8` / `34896641824` — **5/5 SUCCESS**;
- first AR-001 remediation `264a504e4bc8208d9ff762ef71e90bea6d18216e` / `34905438530` — **5/5 SUCCESS**, later review proved EOF dependence;
- fresh-review transition `e4efa0b74ffd5708d9888ff23e13174ec2032c68` / `34909259741` — **5/5 SUCCESS**;
- durable review failure `54ccc8865ea67a4835a7627b14739c3eaac53f5a` / `34910156654` — **5/5 SUCCESS**;
- ADR-0009 implementation began `3ed4bafe7fc1bcb2dc5d2ba506d472b288ac06cb`;
- bodyless runtime fix `ee85d747510a36b559f6fcecbf433dfe4beeabde`;
- public-gateway adversarial evidence `f45c322c6da7765f09a6a9607c898003af85ce00`;
- exact implementation evidence `a8ee1db32bfa41b40d4fcd5dd841146f97676881` / `34975265838`;
- blocker docs/status `52572b24bba83a2aadb22c80f2764c92875219f1` / `34975858942`;
- packet record synchronization `ae45fe740c59774f5da86cc54bc49e449f5c6749`;
- ADR 0010 accepted `c369e33541dcb984e15f690a254992d0b7149830`;
- ADR 0001 narrow amendment `f1869cd6b4751d579d34262f8efa0392a2fdcdfc`;
- blocker record resolved `7c355b472cbf8e060736bb7eb302f4ed4862d8d1`.

Exact pre-ADR0010 implementation evidence `a8ee1db32bfa41b40d4fcd5dd841146f97676881` / `34975265838` remains:

- Core quality/security: **PASS**;
- Browser/mutation: **PASS**;
- Privacy-safe preview: **PASS**;
- DB/RLS: **PASS**, `80` files / `1382` tests;
- all ADR-0009 Edge staging/auth/promotion/recovery/CORS/25 MB checks: **PASS** except AR-001;
- AR-001: **FAIL** — `Public promotion endpoint waited for sender EOF on a framed body.`

That failing condition is intentionally preserved as the RED to migrate to the accepted Pages Function boundary.

### WP-2.9B — Generic project tags and Venue entity-tag links

- **PLANNED / AFTER A**; cannot activate until A is accepted.
- Owns FTR-093 Lot-2, `tags`, `entity_tags`, active-key uniqueness, recoverable tag deletion and same-project Venue assignment.
- Reuses `project.read`, `project.settings.update`, `venues.read`, `venues.write`.
- Size **8**, cohesion **PASS**.

## Current next-action gate

1. ADR 0010 is **ACCEPTED**; WP-2.9C architecture blocker is resolved and C is `IN_PROGRESS / A-IMPLEMENT — RED FIRST`.
2. Add focused **test-only RED-first evidence** for the accepted Pages Function boundary before production migration:
   - real Pages/Workers runtime open-ended framed sender must not depend on EOF;
   - old Supabase promotion route/function must be proven removable/absent;
   - application promotion contract must target same-origin `/api/private-document-promote` with no body.
3. Keep RED isolated to the intended migration boundary; do not weaken existing ADR-0009 security scenarios.
4. Only after isolated RED may production code move from Supabase Edge to Pages Function.
5. Exact `25,000,000`-byte promotion must be proven feasible on the intended Workers/Pages Free runtime; failure re-blocks the packet instead of enabling paid infrastructure or shrinking the contract.
6. After implementation require exact-head CI/full verification and a complete fresh independent Pass B before Pass C.
7. WP-2.9A remains **BLOCKED** until WP-2.9C is accepted.
8. WP-2.9B remains **PLANNED / AFTER A**.

## Known localized repairs / stop conditions

- WP-2.4 evidence/confidence: **CLOSED / VERIFIED**.
- WP-2.5 readiness/manual-assessment/dynamic guest-count semantics: **CLOSED / VERIFIED**.
- WP-2.6 commercial/availability/contact/interaction boundaries: **CLOSED / VERIFIED**.
- WP-2.7 origin-location snapshots/canonical portability/ACC-030: **CLOSED / VERIFIED**.
- WP-2.8A URL/replay identity parity: **CLOSED / VERIFIED**.
- WP-2.8B private lifecycle/Storage↔DB recovery and MED-006 receipt: **CLOSED / VERIFIED**.
- WP-2.8C optimistic revision/provider/adversarial gaps: **CLOSED / VERIFIED**.
- WP-2.9 pre-activation sizing and MED-008 traceability: **CLOSED / VERIFIED**.
- WP29A-AR-001 / AR-002 / AR-003: **CLOSED / VERIFIED**.
- WP29A-AR-004: **MAJOR / OPEN in parent**, remediation implemented in C; parent closure waits for C acceptance + A reverification.
- WP29A-AR-005: **MAJOR / OPEN in parent**, trusted-byte remediation implemented in C; parent closure waits for C acceptance + A reverification.
- WP29C architecture blocker: **RESOLVED by ADR 0010**.
- WP29C-AR-001: **MAJOR / OPEN / RED TARGET** — accepted Pages Function boundary must prove EOF-independent rejection and no direct Supabase promotion bypass.
- WP29C-AR-002: **remediation implemented / runtime-green**, later fresh Pass B required.
- WP29C-AR-003: **remediation implemented / runtime-green**, later fresh Pass B required.
- WP29C-AR-004: **remediation implemented / runtime-green**, later fresh Pass B required.

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
Current packet: WP-2.9C — IN_PROGRESS
Current pass: A-IMPLEMENT — RED FIRST
Architecture: ADR 0009 bounded staging + ADR 0010 accepted Pages Function promotion boundary
ADR 0010 route: POST /api/private-document-promote
Old Supabase private-document-ingest Edge Function: must be removed during GREEN implementation
Blocker record: RESOLVED by ADR 0010
WP29C-AR-001: MAJOR / OPEN / RED TARGET — prove Pages runtime rejects framed open sender without EOF and old Supabase route is absent
WP29C-AR-002: remediation implemented / runtime-green
WP29C-AR-003: remediation implemented / runtime-green
WP29C-AR-004: remediation implemented / runtime-green
Exact existing implementation evidence: a8ee1db32bfa41b40d4fcd5dd841146f97676881 / 34975265838
FTR-089 FIR: #17
WP-2.9A resumes only after WP-2.9C ACCEPTED
WP-2.9B remains PLANNED / AFTER A
Lots 3–12: NOT_STARTED
Next permitted action: focused test-only RED for Pages Function migration boundary, then GREEN implementation
```
