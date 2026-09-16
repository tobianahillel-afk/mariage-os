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

- execution-support head `2aa0b91da82b09f479cd93fb52763786f9a7874f`;
- CI `35082871383` — **5/5 SUCCESS**, including `Full verify from clean checkout`;
- Core quality/security, Local Supabase DB/RLS/Pages Function, browser/mutation, privacy-safe preview and clean-checkout full verify all passed on that exact head;
- the dedicated `AR-006 isolated provider preflight` job and `Exact 25 MB Workers Free provider evidence` job were both **SKIPPED** on that ordinary push, as required;
- `npm run test:ar006:metrics` passed in Core and is also part of `npm run verify`;
- provider CPU GraphQL quantiles are treated as microseconds, retained raw as `cpuTimeP50Us` / `cpuTimeP99Us`, normalized by exact division by `1000` to `cpuTimeP50Ms` / `cpuTimeP99Ms`, then compared with the `10 ms` Workers Free budget;
- regression controls prove `10,000 µs = 10 ms` is accepted and `10,001 µs = 10.001 ms` is rejected;
- `npm run preflight:ar006` is a read-only readiness guard. The dedicated `[AR006-PREFLIGHT]` job runs it separately before provider evidence is authorized; the `[AR006-EVIDENCE]` job also runs the same guard before build/deployment;
- post-deployment checks still independently require the exact candidate to expose Pages Functions, expected bindings, deployment identity and `preview_script_name` before smoke/evidence collection.

Latest external provider-readiness execution:

- no-content readiness head `55b02f40e8b4519db12f99ee8a38fe095e81a534`, using the exact tree of repository-green parent `2aa0b91da82b09f479cd93fb52763786f9a7874f`;
- CI `35083615839` / preflight job `104753395475`;
- `AR-006 isolated provider preflight` — **FAILURE BEFORE DEPLOYMENT / BEFORE DATA MUTATION**;
- checkout, Node setup, dependency install and secret scan passed;
- every required `ar006-isolated` Environment variable resolved empty: `AR006_PAGES_PROJECT`, `CLOUDFLARE_ACCOUNT_ID`, `AR006_SUPABASE_URL`, `AR006_SUPABASE_PUBLISHABLE_KEY`, `AR006_TEST_USER_EMAIL`, `AR006_PROJECT_ID`, `AR006_WORKERS_FREE_ATTESTATION`;
- all three required Environment secrets also resolved empty at the preflight step: `AR006_CLOUDFLARE_DEPLOY_TOKEN`, `AR006_CLOUDFLARE_ANALYTICS_TOKEN`, `AR006_TEST_USER_PASSWORD`;
- the first fail-closed error was `AR006_WORKERS_FREE_ATTESTATION is required.`;
- therefore the run did not reach the Cloudflare Pages API, Cloudflare Analytics, Supabase authentication or `has_project_permission`, and performed no deployment, document reservation, Storage upload, promotion/finalization or application-data mutation;
- this is an **external GitHub Environment/provider-test configuration blocker**, not CPU-feasibility evidence and not a repository implementation regression.

These repository-green gates validate the AR-005/AR-007 implementation remediations, preserve the local exact-25-MB functional path, and validate the AR-006 evidence harness/unit handling and fail-before-deploy readiness path. The first real readiness execution additionally proves the gate fails closed before provider mutation when its isolated configuration is absent. None of this satisfies AR-006 because that finding still requires provider-produced Cloudflare Workers Free CPU telemetry from the isolated deployed path.

Historical isolated-provider setup and failed readiness attempts earlier on **2026-09-16** (superseded by the successful execution below):

- Dedicated Supabase Free project `rpdmqqvupmhxlxosasqi` (`mariage-os-ar006-isolated`, `eu-west-3`) has all **63** repository SQL migrations. Synthetic project `3651c5b8-fffa-494a-9686-2abcf0757a9d` and confirmed user `ar006-synthetic-20260916-rpdm@example.com` exist; the user is an active `editor` with `documents.write`. The user has not signed in successfully.
- Dedicated Cloudflare Pages project `mariage-os-ar006-isolated` (project ID `1223854c-79fc-4617-855b-7919597e809f`) has preview `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and encrypted `PRIVATE_DOCUMENT_ADMIN_KEY` for this isolated Supabase project. Cloudflare dashboard displays **Workers Free — Current plan** with the normal **10 ms CPU/request** limit. No Pages deployment has occurred.
- GitHub Environment `ar006-isolated` is restricted to `lot-2/venues-core`; all seven runbook variables and three scoped secrets are configured. Two Cloudflare tokens have only Pages Write and Account Analytics Read respectively and expire in seven days. The synthetic Supabase user password is stored only as an Environment secret, not in Git or this status board.
- No-content exact-tree readiness head `918ed0e198574f9c3e7f17d4c67cab7e1bc27c4d` triggered CI `35133580074`. All five repository jobs passed, including clean-checkout full verification. The isolated provider preflight job `104920622572` passed Cloudflare Pages and Analytics checks, then **FAILED** at synthetic Supabase password authentication. The provider-evidence job was **SKIPPED**. Preflight made no deployment or application-data mutation.
- Replacement confirmed synthetic user `ar006-synthetic-20260916-rpdm-retry@example.com` (UUID `5b89113d-4ed9-42b5-806c-d83a483bb271`) was created at 18:35:54 UTC and granted active `editor` membership on the same synthetic project. GitHub Environment `AR006_TEST_USER_EMAIL` points to this user. The password secret's latest observed update preceded user creation (about 18:33 UTC); the value is never read or recorded.
- No-content exact-tree readiness head `803b2e641b75074aa1d966cc6681c9523d36c1c1` triggered CI `35135570623`. All five normal repository jobs passed, including clean-checkout full verification. Preflight job `104927719402` again passed Cloudflare Pages/Analytics checks but **FAILED** at synthetic Supabase password authentication; evidence job was **SKIPPED**. No Pages deployment or application-data mutation occurred. The exact credential mismatch cause is not proven. At that time, the credential handoff remained unresolved; it was completed by the later confirmed synthetic user and green preflight recorded below.

Latest isolated provider execution on **2026-09-16** (functional path succeeded; CPU evidence unavailable):

- The replacement confirmed synthetic user `ar006-synthetic-20260916-rpdm-final@example.com` (UUID `650241aa-fbf6-41ce-a277-9708f26b946a`) has active `editor` / `documents.write` on the isolated synthetic project. Its password was entered by the user in Supabase and the same value was entered by the user into GitHub Environment secret `AR006_TEST_USER_PASSWORD`; neither value was read or retained in this repository.
- No-content preflight head `d89b3601d066996c3958f30ad9067b34675f8b22` / CI `35138142860` / provider preflight job `104935966498` — **SUCCESS**. The normal five repository jobs also passed, including clean-checkout full verification.
- No-content evidence head `4f40613060b4c9de41a32d99ed43fcf6e12c9791` / CI `35138368708` — normal five repository jobs **5/5 SUCCESS**, including clean-checkout full verification. Provider evidence job `104939181956` deployed the exact head to isolated Workers Free Pages preview deployment `064d50b9-3c3d-414e-a6c3-afdcc1051be9` at `https://064d50b9.mariage-os-ar006-isolated.pages.dev`, branch `ar006-4f40613060b4`, preview script `pages-worker--19505720-preview`. Deployment identity, preview Functions/bindings and deny smoke passed.
- The sanitized schema-v2 [Actions artifact](https://github.com/tobianahillel-afk/mariage-os/actions/runs/35138368708/artifacts/10464581885) (ZIP SHA-256 `56c809b27dadf42a3ef26a003855eb628dbf0ef437774bb76d82c02b33ada3c5`) records ten distinct exact `25,000,000`-byte synthetic promotions, all HTTP 200 and finalized. Its controlled analytics window is `2026-09-16T19:13:57.417Z` to `19:16:29.334Z`.
- Provider CPU evidence is **absent**, not above budget: artifact `providerCpuMeasurements: []`, `pass: false`, and provider job **FAILURE**. Cloudflare GraphQL `workersInvocationsAdaptive` returned no rows even without script filter over the full account day; the Pages Preview metrics dashboard also displayed no request/CPU data as of 19:25 UTC. Cloudflare documents possible aggregation delay. No CPU value or CPU-limit outcome can be inferred from HTTP 200 or zero dashboard counts.
- Detailed durable attempt record: `docs/roadmap/lot-2/WP-2.9C-AR-006-PROVIDER-ATTEMPT-2026-09-16.md`. WP-2.9C remains **BLOCKED**. Re-query provider telemetry after aggregation delay. If still unavailable or unattributable, reopen AR-006 architecture review per the runbook; do not accept, enable Workers Paid or reduce the PDF limit.

Current remediation status:

- `WP29C-AR-005` — **MAJOR / IMPLEMENTATION-REMEDIATED / EXACT-HEAD-GREEN** — trusted clean-abandon path, DB orphan backstop, immediate pre-copy reservation revalidation, safe post-copy compensation and race/retry coverage implemented. Formal closure now waits only for the later complete fresh Pass B after AR-006 is unblocked.
- `WP29C-AR-006` — **MAJOR / OPEN / BLOCKING** — exact-25-MB Workers/Pages Free CPU feasibility still lacks deployed provider CPU evidence; the isolated exact-25-MB deployment and ten functional promotions succeeded, but provider CPU metrics have not appeared; re-query after provider aggregation delay and keep the packet blocked until attributable CPU evidence exists. Durable proof protocol: `docs/roadmap/lot-2/WP-2.9C-AR-006-CPU-EVIDENCE.md`; executable runbook: `docs/roadmap/lot-2/WP-2.9C-AR-006-RUNBOOK.md`.
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

The branch CI contains two distinct guarded jobs:

- `ar006-provider-preflight` runs only after `core` on a push to `lot-2/venues-core` whose head commit contains `[AR006-PREFLIGHT]`. It is read-only and may not deploy or mutate application data.
- `ar006-provider-evidence` runs only after `full-verify` on a push to the same branch whose head commit contains `[AR006-EVIDENCE]`. It repeats the read-only preflight before building/deploying and collecting exact-size provider CPU evidence.

Both jobs use the `ar006-isolated` GitHub Environment. Ordinary pushes/PRs skip both provider jobs and do not receive those credentials. The later readiness run (`d89b3601d066996c3958f30ad9067b34675f8b22` / `35138142860`) passed. The authorized evidence run (`4f40613060b4c9de41a32d99ed43fcf6e12c9791` / `35138368708`) completed ten exact-size promotions but failed closed because Cloudflare returned no CPU rows.

An exact-commit isolated Pages deployment identity and ten successful controlled promotions are now recorded, but no provider CPU measurement is available. The missing CPU evidence prevents AR-006 closure.

Until that evidence exists, WP-2.9C remains **BLOCKED**. If the proof fails after a correctly configured readiness gate, revisit architecture rather than silently enabling paid compute or shrinking the PDF contract.

### AR-007 operations gate retained

Normative release/deployment/secret contracts now require Pages Functions to deploy with the exact static candidate, `PRIVATE_DOCUMENT_ADMIN_KEY` to live only as an environment-specific Cloudflare encrypted secret, `/api/private-document-promote` to fail closed without static/origin fallback, and the removed Supabase promotion route to remain absent. `npm run smoke:private-document-production` provides deny-oriented deployment smoke without privileged credentials or real wedding data.

## Current next-action gate

1. WP-2.9C remains **BLOCKED** on `WP29C-AR-006`; preserve AR-005 and AR-007 controls.
2. Re-query Cloudflare provider metrics for the exact isolated preview script and controlled window after the documented aggregation delay. Require attributable request count, status and raw CPU p50/p99 for all ten promotions, normalize µs / 1000, and check every value against 10 ms. Do not interpret empty rows as zero CPU.
3. If the current deployment's provider telemetry remains unavailable or unattributable, reopen AR-006 architecture review according to the runbook. Any revised evidence path must be explicitly justified and must still prove CPU-specific normal Free-plan operation for exact 25 MB. Do not silently change the file limit or enable Paid.
4. Only after valid AR-006 evidence, record it durably, verify exact-head CI/clean checkout, transition C to `REVIEW_PENDING`, run a complete fresh independent Pass B and then Pass C before acceptance.
5. WP-2.9A remains **BLOCKED** until C is accepted; WP-2.9B and later Lots remain inactive.

## Durable handoff

```text
main integration truth: f6da05626f024431230ae46ca1ec8a4becc72a1f
Lot 0: ACCEPTED
Lot 1: ACCEPTED
Lot 2: IN_PROGRESS
Lot 2 branch: lot-2/venues-core
Accepted durable Lot-2 packets: WP-2.1..WP-2.8C
WP-2.9A: BLOCKED — waits for WP-2.9C ACCEPTED
Current packet: WP-2.9C — BLOCKED on AR-006 provider CPU telemetry
Latest green readiness: d89b3601d066996c3958f30ad9067b34675f8b22 / 35138142860 / job 104935966498 — SUCCESS
Latest evidence candidate: 4f40613060b4c9de41a32d99ed43fcf6e12c9791 / 35138368708 — 5/5 normal jobs SUCCESS, provider job 104939181956 FAILURE only on absent CPU telemetry
Provider deployment: 064d50b9-3c3d-414e-a6c3-afdcc1051be9, exact commit and Pages preview verified; ten exact 25,000,000-byte promotions HTTP 200/finalized
Evidence artifact: Actions artifact 10464581885, ZIP SHA-256 56c809b27dadf42a3ef26a003855eb628dbf0ef437774bb76d82c02b33ada3c5; providerCpuMeasurements=[]; pass=false
AR-006 attempt record: docs/roadmap/lot-2/WP-2.9C-AR-006-PROVIDER-ATTEMPT-2026-09-16.md
AR-005 and AR-007: implementation-remediated / exact-head-green — formal closure waits fresh Pass B after AR-006 unblock
FTR-089 FIR: #17 — BLOCKED
WP-2.9B: PLANNED / AFTER A
Lots 3–12: NOT_STARTED
Next permitted action: re-query provider CPU telemetry after aggregation delay; if unavailable or unattributable, reopen AR-006 architecture review without weakening Workers Free/25 MB contract
```
