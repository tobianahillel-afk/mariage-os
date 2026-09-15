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
| WP-2.9C | trusted private-document ingestion hardening | **BLOCKED — WP29C-AR-001 ingress architecture** |
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

ADR 0008 originally froze trusted server-side private-document ingestion. ADR 0009 later superseded only the raw PDF request-body transport with bounded private staging plus bodyless promotion. WP-2.9C remains remediation/control work only; FTR-089 product ownership remains with A.

### WP-2.9A — Venue-linked private document foundation

- **BLOCKED**.
- FIR: `#17 / FTR-089`.
- Owns FTR-089 Lot-2, `MED-001/002/003/008/010`, ordinary private PDF metadata, Venue `document_links`, private Storage lifecycle, provenance, read/download authorization and recoverable metadata soft-delete/restore.
- Reuses `project-private` at `<project_id>/documents/<document_id>/original`.
- Reuses `documents.read` / `documents.write`; no new permission key.
- Historical size **10**, cohesion **PASS**.
- Split/spec freeze `40f17aba802e7faed9eade6096e2f3629fc80654` / `34788217062` — **5/5 SUCCESS**.
- READY governance `0b30b045ef05c318d25c92abb379364f95705c4e` / `34788670807` — **5/5 SUCCESS**.
- Pass-A implementation/evidence `e533b5c53d1be074216ccaa92f74281b425de770` / `34826553890` — **5/5 SUCCESS**; Core 152 files / 1465 tests / 100% coverage.
- `WP29A-AR-001` — **MAJOR / CLOSED / VERIFIED**.
- `WP29A-AR-002` — **MAJOR / CLOSED / VERIFIED**.
- `WP29A-AR-003` — **MAJOR / CLOSED / VERIFIED**.
- `WP29A-AR-004` — **MAJOR / OPEN in parent**: C1 control-character parity remediation is implemented in C; parent closure waits for C acceptance and A reverification.
- `WP29A-AR-005` — **MAJOR / OPEN / ARCHITECTURE BLOCKER in parent**: trusted stored-byte integrity remediation is implemented in C; parent closure waits for C acceptance and A reverification.
- Blocker resolution condition: **WP-2.9C ACCEPTED**. Then A returns to `IN_PROGRESS` for integration/reverification and a fresh Pass B before Pass C.

### WP-2.9C — Trusted private-document ingestion hardening

- **BLOCKED**.
- Current/next pass: **ARCHITECTURE-DECISION**.
- Remediation packet for `WP29A-AR-004` and `WP29A-AR-005`; no new Feature ID or product scope.
- Current accepted transport architecture: **ADR 0009 — bounded private-document staging**.
- Proposed architecture review: **ADR 0010 — private-document promotion ingress termination boundary**.
- Durable blocker record: `docs/roadmap/lot-2/WP-2.9C-BLOCKER.md`.
- Conservative size **10**, cohesion **PASS**.

Implemented ADR-0009 controls now include:

- private `document-ingest-staging` bucket with exact `25,000,000` byte and `application/pdf` constraints;
- one narrow authenticated pending-document INSERT policy and no ordinary staging SELECT/UPDATE/DELETE;
- authenticated client canonical Document INSERT denial while accepted Media behavior stays unchanged;
- browser staging with `upsert:false` followed by an application-level bodyless promotion call;
- live current-user and `documents.write` authorization around privileged transitions;
- authoritative reservation/path derivation and staging metadata validation before materialization;
- actual staged-byte PDF signature, size and SHA-256 proof;
- privileged no-overwrite canonical copy plus exact canonical retry/recovery proof;
- service-only ingest attestation and independent finalization reauthorization;
- server-side staging cleanup;
- explicit/minimal CORS;
- no application request-body read in the promotion handler.

Current finding state:

- `WP29C-AR-001` — **MAJOR / OPEN / ARCHITECTURE BLOCKER**: both the direct local Edge Runtime and the public local Supabase gateway wait for an intentionally open-ended framed request to reach sender EOF before the handler can terminate it. The current user Edge handler therefore cannot provide the frozen EOF-independent ingress bound.
- `WP29C-AR-002` — **remediation implemented / runtime-green**, pending packet acceptance and later fresh Pass B closure.
- `WP29C-AR-003` — **remediation implemented / runtime-green**, pending packet acceptance and later fresh Pass B closure.
- `WP29C-AR-004` — **remediation implemented / runtime-green**, pending packet acceptance and later fresh Pass B closure.

Key remediation history:

- split/READY `d1e561c787798eb99f49024cc0c1db49880bcd82` / `34862521697` — **5/5 SUCCESS**, clean-checkout included;
- initial Pass-A `d90a643d929c35ef84444c19b7ec02ad9cd9e5a8` / `34896641824` — **5/5 SUCCESS**;
- initial REVIEW_PENDING `95e5a1c2c1bccc292787b745c3ca112a3f22a39b` / `34898586925` — **5/5 SUCCESS**;
- initial fresh Pass B found AR-001;
- first AR-001 remediation `264a504e4bc8208d9ff762ef71e90bea6d18216e` / `34905438530` — **5/5 SUCCESS** but later adversarial review proved EOF-dependent draining;
- fresh-review transition `e4efa0b74ffd5708d9888ff23e13174ec2032c68` / `34909259741` — **5/5 SUCCESS**;
- durable review failure `54ccc8865ea67a4835a7627b14739c3eaac53f5a` / `34910156654` — **5/5 SUCCESS**;
- ADR-0009 implementation started at `3ed4bafe7fc1bcb2dc5d2ba506d472b288ac06cb`;
- bodyless runtime fix `ee85d747510a36b559f6fcecbf433dfe4beeabde`;
- public-gateway adversarial evidence `f45c322c6da7765f09a6a9607c898003af85ce00`;
- quality-preserving harness refactor exact-head `a8ee1db32bfa41b40d4fcd5dd841146f97676881` / CI `34975265838`.

Exact-head evidence `a8ee1db32bfa41b40d4fcd5dd841146f97676881` / `34975265838`:

- Core quality/security: **PASS**;
- Browser/mutation: **PASS**;
- Privacy-safe preview: **PASS**;
- DB/RLS: **PASS**, `80` files / `1382` tests;
- Edge staging/auth/promotion/recovery/CORS/25 MB checks: **PASS** except AR-001;
- AR-001: **FAIL** — `Public promotion endpoint waited for sender EOF on a framed body.`

The public gateway failure independently reproduces earlier direct-runtime evidence from CI `34973827681` and gateway evidence from `34974264827`.

Current Supabase documentation checked on 2026-09-15 publishes a 150-second request idle timeout and other runtime limits but no inbound request-body maximum that can serve as the required EOF-independent ingress security bound. The provider timeout therefore does not close AR-001.

### WP-2.9B — Generic project tags and Venue entity-tag links

- **PLANNED / AFTER A**; cannot activate until A is accepted.
- Owns FTR-093 Lot-2, `tags`, `entity_tags`, active-key uniqueness, recoverable tag deletion and same-project Venue assignment.
- Reuses `project.read`, `project.settings.update`, `venues.read`, `venues.write`.
- Size **8**, cohesion **PASS**.

The original split repairs the old WP-2.9 traceability omission by assigning `MED-008` explicitly to WP-2.9A. C adds no product responsibility.

## Current next-action gate

1. WP-2.9C is **BLOCKED** on `WP29C-AR-001`.
2. The only permitted next action is architecture review of proposed ADR 0010.
3. Do not weaken/delete the open-ended sender test or reinterpret the 150-second timeout as closure.
4. Do not add a Cloudflare Worker/Pages Function, proxy, queue/event trigger or other backend boundary before the architecture is explicitly accepted and direct-origin bypass is addressed.
5. WP-2.9A remains **BLOCKED** until WP-2.9C is accepted.
6. WP-2.9B remains **PLANNED / AFTER A**.
7. After an ingress architecture is accepted, transition C `BLOCKED → IN_PROGRESS`, implement the accepted boundary, require exact-head CI, then perform a complete fresh Pass B before Pass C.

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
- WP29C-AR-001: **MAJOR / OPEN / ARCHITECTURE BLOCKER** — public promotion ingress remains EOF-dependent before application dispatch.
- WP29C-AR-002: **remediation implemented / runtime-green**, later fresh Pass B required after unblock.
- WP29C-AR-003: **remediation implemented / runtime-green**, later fresh Pass B required after unblock.
- WP29C-AR-004: **remediation implemented / runtime-green**, later fresh Pass B required after unblock.

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
Current packet: WP-2.9C — BLOCKED
Current/next pass: ARCHITECTURE-DECISION
WP-2.9C current architecture: ADR 0009 — bounded private-document staging
Proposed review: ADR 0010 — private-document promotion ingress termination boundary
Blocker record: docs/roadmap/lot-2/WP-2.9C-BLOCKER.md
WP29C-AR-001: MAJOR / OPEN / ARCHITECTURE BLOCKER — public gateway waits for sender EOF on framed body
WP29C-AR-002: remediation implemented / runtime-green
WP29C-AR-003: remediation implemented / runtime-green
WP29C-AR-004: remediation implemented / runtime-green
Exact implementation evidence: a8ee1db32bfa41b40d4fcd5dd841146f97676881 / 34975265838
Core: PASS
Browser/mutation: PASS
Preview: PASS
DB/RLS: PASS — 80 files / 1382 tests
Edge: all ADR-0009 checks PASS except WP29C-AR-001
FTR-089 FIR: #17
WP-2.9A resumes only after WP-2.9C ACCEPTED
WP-2.9B remains PLANNED / AFTER A
Lots 3–12: NOT_STARTED
Next permitted action: review/resolve ADR 0010; no implementation beyond the frozen boundary while blocked
```
