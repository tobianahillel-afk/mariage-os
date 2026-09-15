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
| WP-2.9C | trusted private-document ingestion hardening | **REVIEW_FAILED / CURRENT — AR-005, AR-006, AR-007 MAJOR** |
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
- WP-2.8C: durable closure `7f97ab8bab9c60ba538b5c900845ca77e9b9f34c` / `34786974129` — **5/5 SUCCESS**, gap **∅**.

## WP-2.9A

- **BLOCKED**.
- FIR: `#17 / FTR-089`.
- Pass-A implementation/evidence `e533b5c53d1be074216ccaa92f74281b425de770` / `34826553890` — **5/5 SUCCESS**.
- `WP29A-AR-001/002/003` — **CLOSED / VERIFIED**.
- `WP29A-AR-004` — **MAJOR / OPEN in parent**: C1 parity remediation is implemented in C; parent closure waits for C acceptance and A reverification.
- `WP29A-AR-005` — **MAJOR / OPEN in parent**: trusted stored-byte integrity remediation is implemented in C; parent closure waits for C acceptance and A reverification.
- Blocker resolution condition: **WP-2.9C ACCEPTED**. Then A returns to `IN_PROGRESS` for integration/reverification and fresh Pass B before Pass C.

## WP-2.9C — current packet

State: **REVIEW_FAILED**.

Architecture blocker from ADR 0010 is resolved, and Pass A itself is green:

- implementation head `297ecdf3337e8522d6f200a90f96b481a9e6bdb1` / CI `34996240637` — **5/5 SUCCESS**, clean-checkout included;
- review-pending governance head `e0854afb62cf5fcf834792fbad425d013b02af56` / CI `34997963836` — **5/5 SUCCESS**, clean-checkout included.

Fresh independent Pass B failed. Full record:

`docs/roadmap/lot-2/WP-2.9C-PASS-B-REVIEW.md`

Durable finding record commit:

`deaa2432327b9512068a75635dde6f4c522467ad`

Open findings:

- `WP29C-AR-005` — **MAJOR** — interrupted staging/clean-abandon cleanup is incomplete; concurrent abandon can race promotion and leave Storage/DB orphan divergence.
- `WP29C-AR-006` — **MAJOR** — exact-25-MB Workers/Pages Free CPU feasibility is not actually evidenced by the local workerd harness because local development does not enforce the deployed Free CPU quota.
- `WP29C-AR-007` — **MAJOR** — deployment/release/secret operations still describe a static app and do not reconcile the new security-critical Pages Function or concrete `PRIVATE_DOCUMENT_ADMIN_KEY` inventory/rotation obligations.

Historical findings remain remediation-green but cannot be formally closed until a later complete clean fresh Pass B:

- `WP29C-AR-001` — raw request EOF dependence;
- `WP29C-AR-002` — bounded canonical recovery;
- `WP29C-AR-003` — authoritative stored MIME;
- `WP29C-AR-004` — wildcard CORS.

## Current next-action gate

1. WP-2.9C is **REVIEW_FAILED**.
2. Next permitted transition: `REVIEW_FAILED → IN_PROGRESS` only when remediation starts.
3. Remediation must begin RED/evidence-first for AR-005/006/007; do not weaken 25 MB, authorization, coverage, static-analysis, security or runtime gates.
4. AR-005 requires trusted project/document-bound idempotent staging/canonical cleanup and reservation-state TOCTOU closure.
5. AR-006 requires CPU-specific Free-plan evidence; if that evidence cannot establish the Free envelope, transition C to `BLOCKED` and revisit architecture rather than using paid compute or lowering the PDF limit silently.
6. AR-007 requires normative Pages Function deployment, fail-closed smoke and secret inventory/rotation documentation.
7. After remediation, obtain exact-head full CI + clean-checkout evidence and return C to `REVIEW_PENDING`.
8. Run another complete fresh independent Pass B over the whole packet and all seven findings.
9. Only a clean Pass B may enter `ACCEPTANCE_PENDING`; only Pass C may mark C `ACCEPTED`.
10. WP-2.9A remains **BLOCKED** until C is accepted; WP-2.9B remains **PLANNED / AFTER A**.

## Known localized repairs / stop conditions

- WP-2.4 through WP-2.8C accepted findings: **CLOSED / VERIFIED**.
- WP29A-AR-001 / AR-002 / AR-003: **CLOSED / VERIFIED**.
- WP29A-AR-004 / AR-005: **MAJOR / OPEN in parent**, closure waits for C acceptance + A reverification.
- WP29C historical architecture blocker: **RESOLVED by ADR 0010**.
- WP29C-AR-001..004: **implementation remediation green; formal closure deferred**.
- WP29C-AR-005 / AR-006 / AR-007: **MAJOR / OPEN — current remediation targets**.

## Durable handoff

```text
main integration truth: f6da05626f024431230ae46ca1ec8a4becc72a1f
Lot 0: ACCEPTED
Lot 1: ACCEPTED
Lot 2: IN_PROGRESS
Lot 2 branch: lot-2/venues-core
Accepted durable Lot-2 packets: WP-2.1..WP-2.8C
WP-2.9A: BLOCKED — waits for WP-2.9C ACCEPTED
Current packet: WP-2.9C — REVIEW_FAILED
Current/next pass: REMEDIATION after failed fresh Pass B
Fresh Pass-B record: docs/roadmap/lot-2/WP-2.9C-PASS-B-REVIEW.md
Open: WP29C-AR-005 MAJOR — orphan cleanup / abandon-promotion race
Open: WP29C-AR-006 MAJOR — Free-plan exact-25-MB CPU evidence gap
Open: WP29C-AR-007 MAJOR — Pages Function deployment/secret operations gap
Pass-A evidence: 297ecdf3337e8522d6f200a90f96b481a9e6bdb1 / 34996240637 — 5/5 SUCCESS
Review-pending evidence: e0854afb62cf5fcf834792fbad425d013b02af56 / 34997963836 — 5/5 SUCCESS
FTR-089 FIR: #17
WP-2.9A resumes only after WP-2.9C ACCEPTED
WP-2.9B remains PLANNED / AFTER A
Lots 3–12: NOT_STARTED
Next permitted action: transition WP-2.9C to IN_PROGRESS and begin remediation RED/evidence-first
```