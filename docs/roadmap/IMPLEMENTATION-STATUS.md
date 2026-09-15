# Mariage OS — Implementation Status Board

Status: **Living repository source of truth for development progress**

Detailed historical packet evidence remains in packet records, acceptance records, coverage matrices, FIRs and Git history.

## Current phase

- V1 documentation/design: **COMPLETE / FROZEN**.
- Guest RSVP + Email/SMS/WhatsApp scope: **MERGED / FROZEN**.
- AI Lot Orchestration governance: **MERGED / FROZEN**.
- Final Design Review: **PASS**.
- Implementation gate: **OPEN**.
- Lot 0: **ACCEPTED**.
- Lot 1: **ACCEPTED**.
- Lot 2: **IN_PROGRESS — Venues core**.
- Lots 3–12: **NOT_STARTED**.

`main` integration truth: `f6da05626f024431230ae46ca1ec8a4becc72a1f` (PR #7). Lot-2 branch: `lot-2/venues-core`.

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
| WP-2.9C | trusted private-document ingestion hardening | **IN_PROGRESS / REMEDIATION — AR-005/006/007 / CURRENT** |
| WP-2.9B | generic project tags and Venue entity-tag links | **PLANNED / AFTER A** |
| WP-2.10 | repositories, local cache, pending/offline mutations | PLANNED |
| WP-2.11 | gallery/table/detail/compare/deep-link workspace | PLANNED |
| WP-2.12 | mobile/offline venue-visit workflow and packet E2E completion | PLANNED |

## Accepted packet evidence summary

WP-2.1..WP-2.8C are accepted and complete. Durable evidence remains in their packet/acceptance records. Latest accepted packet closure: WP-2.8C `7f97ab8bab9c60ba538b5c900845ca77e9b9f34c` / `34786974129` — **5/5 SUCCESS**, gap **∅**.

## WP-2.9A

- **BLOCKED**; FIR `#17 / FTR-089`.
- Pass-A `e533b5c53d1be074216ccaa92f74281b425de770` / `34826553890` — **5/5 SUCCESS**.
- `WP29A-AR-001/002/003` — **CLOSED / VERIFIED**.
- `WP29A-AR-004` — **MAJOR / OPEN in parent**; C1 remediation implemented in C; closure waits for C acceptance + A reverification.
- `WP29A-AR-005` — **MAJOR / OPEN in parent**; trusted-byte remediation implemented in C; closure waits for C acceptance + A reverification.
- A resumes only after **WP-2.9C ACCEPTED**, then integration/reverification → fresh Pass B → Pass C.

## WP-2.9C — current packet

State: **IN_PROGRESS / REMEDIATION** after failed fresh Pass B.

Pass-A exact evidence:

- `297ecdf3337e8522d6f200a90f96b481a9e6bdb1` / CI `34996240637` — **5/5 SUCCESS**, clean-checkout included.

Review-pending exact evidence:

- `e0854afb62cf5fcf834792fbad425d013b02af56` / CI `34997963836` — **5/5 SUCCESS**, clean-checkout included.

Fresh Pass-B failure:

- review record: `docs/roadmap/lot-2/WP-2.9C-PASS-B-REVIEW.md`;
- finding record commit: `deaa2432327b9512068a75635dde6f4c522467ad`;
- packet REVIEW_FAILED record: `d7fd7ae94792600d5d50afb51a7e6c96487e93a9`;
- status REVIEW_FAILED record: `16dac2577f1ef63afddf79e48fc4ce421c2b7c60`;
- matrix REVIEW_FAILED record: `f0ad5fab0d46a526a726028c7805b78bdb43b1d9`.

Open remediation targets:

- `WP29C-AR-005` — **MAJOR** — interrupted staging/clean-abandon cleanup is incomplete; concurrent abandon can race promotion and leave Storage/DB orphan divergence.
- `WP29C-AR-006` — **MAJOR** — exact-25-MB Workers/Pages Free CPU feasibility is not actually evidenced by local workerd success.
- `WP29C-AR-007` — **MAJOR** — deployment/release/secret operations are not reconciled with the Pages Function trust boundary.

Historical `WP29C-AR-001..004` remain implementation-green but await a later complete clean fresh Pass B for formal closure.

### Remediation design guardrails

AR-005 remediation must not grant ordinary browser staging DELETE. Trusted cleanup remains inside the same narrow Pages security boundary and must be:

- bodyless;
- current-user authenticated;
- live `documents.write` authorized;
- project/document bound with server-derived exact paths;
- safe for pending/absent retry state only;
- idempotent across response loss;
- unable to delete ready documents, another project/document or Media;
- verified absent before metadata abandon completes.

Promotion must also close post-copy failure/orphan paths and revalidate authoritative reservation state immediately before privileged canonical mutation.

AR-006 remediation must produce CPU-specific evidence; if the Workers Free envelope cannot safely support exact 25 MB, transition to `BLOCKED` and revisit architecture rather than silently enabling paid compute or shrinking the file contract.

AR-007 remediation must update normative deployment/release/secret contracts and fail-closed production smoke without committing any secret value.

## Current next-action gate

1. WP-2.9C is **IN_PROGRESS / REMEDIATION**.
2. Add focused RED/evidence-first coverage for AR-005/006/007.
3. Implement AR-005 trusted cleanup and promotion compensation/state revalidation without weakening RLS/authorization/file limits.
4. Produce valid AR-006 Free CPU evidence; if impossible, stop in `BLOCKED`.
5. Reconcile ADR/release/secret docs for AR-007.
6. Run exact-head full CI + clean-checkout verification.
7. Transition C back to `REVIEW_PENDING` only after remediation evidence is green.
8. Run another complete fresh independent Pass B over the whole packet and all seven findings.
9. Only a clean Pass B may enter `ACCEPTANCE_PENDING`; only Pass C may mark C `ACCEPTED`.
10. WP-2.9A remains **BLOCKED** and WP-2.9B remains **PLANNED / AFTER A**.

## Durable handoff

```text
main integration truth: f6da05626f024431230ae46ca1ec8a4becc72a1f
Lot 0: ACCEPTED
Lot 1: ACCEPTED
Lot 2: IN_PROGRESS
Lot 2 branch: lot-2/venues-core
Accepted durable Lot-2 packets: WP-2.1..WP-2.8C
WP-2.9A: BLOCKED — waits for WP-2.9C ACCEPTED
Current packet: WP-2.9C — IN_PROGRESS / REMEDIATION
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
Next permitted action: AR-005/006/007 remediation RED/evidence-first
```