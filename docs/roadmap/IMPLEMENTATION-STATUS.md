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
| WP-2.9C | trusted private-document ingestion hardening | **BLOCKED — AR-006 deployed Workers Free CPU evidence** |
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

State: **BLOCKED — WP29C-AR-006 DEPLOYED WORKERS FREE CPU EVIDENCE**.

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

Remediation exact-head verification:

- implementation head `68a4f6bdb7b55acc80c4c6fbb8c0afc0295bfde5`;
- CI `35025384594` — **5/5 SUCCESS**, including `Full verify from clean checkout`;
- Core quality/security, Local Supabase DB/RLS/Pages Function, browser/mutation, privacy-safe preview and clean-checkout full verify all passed on the same exact implementation head.

Latest AR-006 execution-support verification:

- evidence-support head `f7c9d05046b8374c685cf9bbe219706d925c07f6`;
- CI `35080989572` — **5/5 SUCCESS**, including `Full verify from clean checkout`;
- `npm run test:ar006:metrics` passed in Core and is also part of `npm run verify`;
- provider CPU GraphQL quantiles are treated as microseconds, retained raw as `cpuTimeP50Us` / `cpuTimeP99Us`, normalized by exact division by `1000` to `cpuTimeP50Ms` / `cpuTimeP99Ms`, then compared with the `10 ms` Workers Free budget;
- regression controls prove `10,000 µs = 10 ms` is accepted and `10,001 µs = 10.001 ms` is rejected;
- `npm run preflight:ar006` is a read-only readiness guard executed inside the evidence job before build/deployment; it checks the isolated Pages project and preview bindings, Analytics access, synthetic Supabase authentication and live `documents.write` without deploying or mutating document data;
- post-deployment checks still independently require the exact candidate to expose Pages Functions, expected bindings, deployment identity and `preview_script_name` before smoke/evidence collection;
- `Exact 25 MB Workers Free provider evidence` was **SKIPPED** on this ordinary push, as required because the commit did not carry `[AR006-EVIDENCE]` and no provider evidence was requested.

These repository-green gates validate the AR-005/AR-007 implementation remediations, preserve the local exact-25-MB functional path, and validate the AR-006 evidence harness/unit handling and fail-before-deploy readiness path. They do **not** satisfy AR-006 because that finding still requires provider-produced Cloudflare Workers Free CPU telemetry from the isolated deployed path.

Current remediation status:

- `WP29C-AR-005` — **MAJOR / IMPLEMENTATION-REMEDIATED / EXACT-HEAD-GREEN** — trusted clean-abandon path, DB orphan backstop, immediate pre-copy reservation revalidation, safe post-copy compensation and race/retry coverage implemented. Formal closure now waits only for the later complete fresh Pass B after AR-006 is unblocked.
- `WP29C-AR-006` — **MAJOR / OPEN / BLOCKING** — exact-25-MB Workers/Pages Free CPU feasibility still lacks deployed provider CPU evidence. Durable proof protocol: `docs/roadmap/lot-2/WP-2.9C-AR-006-CPU-EVIDENCE.md`; executable runbook: `docs/roadmap/lot-2/WP-2.9C-AR-006-RUNBOOK.md`.
- `WP29C-AR-007` — **MAJOR / IMPLEMENTATION-REMEDIATED / EXACT-HEAD-GREEN** — ADR/release/CI-CD/secret contracts reconciled to Pages Functions and `PRIVATE_DOCUMENT_ADMIN_KEY`; fail-closed non-destructive deployment smoke added. Formal closure now waits only for the later complete fresh Pass B after AR-006 is unblocked.

Historical `WP29C-AR-001..004` remain implementation-green but await a later complete clean fresh Pass B for formal closure.

### AR-005 guardrails retained

Trusted cleanup remains inside the same narrow Pages security boundary and must remain:

- bodyless;
- current-user authenticated;
- live `documents.write` authorized;
- project/document bound with server-derived exact paths;
- safe for pending/absent retry state only;
- idempotent across response loss;
- unable to delete ready documents, another project/document or Media;
- verified absent before metadata abandon completes.

Promotion retains authoritative reservation-state recheck immediately before privileged canonical mutation and safe compensation only for canonical bytes created by the failing request.

### AR-006 blocking evidence gate

Local Wrangler/workerd exact-25-MB success is functional evidence, not Workers Free CPU evidence. Current Cloudflare limits rechecked on **2026-09-16** keep the normal Workers Free CPU budget at `10 ms` per HTTP request and memory at `128 MB`.

The provider evidence harness consumes `workersInvocationsAdaptive` CPU quantiles as microseconds, stores both the raw microsecond values and their millisecond normalization, and applies the `<= 10 ms` acceptance gate only to normalized millisecond values. `npm run test:ar006:metrics` is a deterministic repository regression control for that unit boundary.

Unblock requires an exact-commit isolated Pages deployment on Workers Free, a synthetic exact `25,000,000`-byte trusted promotion, and provider-produced CPU-specific telemetry demonstrating controlled successful invocations inside the normal Free CPU budget with no `exceededCpu`, no Paid entitlement and no file-limit reduction.

The branch CI contains a guarded `ar006-provider-evidence` job that runs only after `full-verify` on a `push` to `lot-2/venues-core` whose head commit message contains `[AR006-EVIDENCE]`, and only inside the `ar006-isolated` GitHub Environment with the explicit Workers Free attestation and required isolated provider configuration. The job now runs the read-only `preflight:ar006` guard before building or deploying; ordinary pushes/PRs skip the provider job and do not receive those credentials.

No acceptance-grade deployed Pages identity plus provider CPU telemetry is recorded in the repository/FIR evidence used for this packet. Absence from repository evidence is not proof that no external deployment exists; it means the acceptance evidence is unavailable to the packet.

Until that evidence exists, WP-2.9C remains **BLOCKED**. If the proof fails, revisit architecture rather than silently enabling paid compute or shrinking the PDF contract.

### AR-007 operations gate retained

Normative release/deployment/secret contracts now require Pages Functions to deploy with the exact static candidate, `PRIVATE_DOCUMENT_ADMIN_KEY` to live only as an environment-specific Cloudflare encrypted secret, `/api/private-document-promote` to fail closed without static/origin fallback, and the removed Supabase promotion route to remain absent. `npm run smoke:private-document-production` provides deny-oriented deployment smoke without privileged credentials or real wedding data.

## Current next-action gate

1. WP-2.9C is **BLOCKED** on `WP29C-AR-006`.
2. Preserve AR-005 and AR-007 remediation behavior; do not weaken RLS/authorization/file limits or deployment/secret controls.
3. Configure the isolated Cloudflare Pages/Workers Free + Supabase test environment and GitHub Environment `ar006-isolated` described in `docs/roadmap/lot-2/WP-2.9C-AR-006-RUNBOOK.md`.
4. Only after that environment exists, trigger the guarded evidence job with an exact candidate commit whose message contains `[AR006-EVIDENCE]`; its read-only preflight must pass before any build/deployment or document mutation occurs.
5. Inspect the sanitized schema-v2 artifact and require 10 successful exact-size controlled invocations, raw CPU microsecond values with arithmetically consistent millisecond normalization, and normalized CPU p50/p99 `<= 10 ms` for every retained invocation.
6. If that evidence cannot demonstrate the normal Free envelope, remain `BLOCKED` and revisit architecture; do not enable Paid or reduce the 25 MB contract silently.
7. After valid AR-006 evidence, preserve/run exact-head full CI + clean-checkout verification over the evidence-bound candidate.
8. Transition C back to `REVIEW_PENDING` only after all remediation evidence is green.
9. Run another complete fresh independent Pass B over the whole packet and all seven findings.
10. Only a clean Pass B may enter `ACCEPTANCE_PENDING`; only Pass C may mark C `ACCEPTED`.
11. WP-2.9A remains **BLOCKED** and WP-2.9B remains **PLANNED / AFTER A**.

## Durable handoff

```text
main integration truth: f6da05626f024431230ae46ca1ec8a4becc72a1f
Lot 0: ACCEPTED
Lot 1: ACCEPTED
Lot 2: IN_PROGRESS
Lot 2 branch: lot-2/venues-core
Accepted durable Lot-2 packets: WP-2.1..WP-2.8C
WP-2.9A: BLOCKED — waits for WP-2.9C ACCEPTED
Current packet: WP-2.9C — BLOCKED
Fresh Pass-B record: docs/roadmap/lot-2/WP-2.9C-PASS-B-REVIEW.md
Remediation implementation evidence: 68a4f6bdb7b55acc80c4c6fbb8c0afc0295bfde5 / 35025384594 — 5/5 SUCCESS, clean checkout included
Latest AR-006 evidence-support head: f7c9d05046b8374c685cf9bbe219706d925c07f6 / 35080989572 — 5/5 SUCCESS, clean checkout included; CPU µs→ms regression control green; read-only fail-before-deploy provider preflight repository-green; provider job SKIPPED on ordinary push
AR-005: implementation-remediated / exact-head-green — formal closure waits fresh Pass B after AR-006 unblock
AR-006: OPEN / BLOCKING — deployed Workers Free exact-25-MB CPU evidence required
AR-006 evidence protocol: docs/roadmap/lot-2/WP-2.9C-AR-006-CPU-EVIDENCE.md
AR-006 execution runbook: docs/roadmap/lot-2/WP-2.9C-AR-006-RUNBOOK.md
AR-007: implementation-remediated / exact-head-green — formal closure waits fresh Pass B after AR-006 unblock
FTR-089 FIR: #17 — BLOCKED
WP-2.9A resumes only after WP-2.9C ACCEPTED
WP-2.9B remains PLANNED / AFTER A
Lots 3–12: NOT_STARTED
Next permitted action: configure isolated AR-006 provider environment, then obtain provider CPU evidence; otherwise architecture review remains blocked
```
