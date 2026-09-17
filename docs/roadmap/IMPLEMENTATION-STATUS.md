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
| WP-2.9C | trusted private-document ingestion hardening | **IN_PROGRESS — AR-006 private Worker implementation / provider verification** |
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

State: **IN_PROGRESS — WP29C-AR-006 ADR 0011 PRIVATE WORKER IMPLEMENTATION**.

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

Historical initial provider-readiness execution:

- no-content readiness head `55b02f40e8b4519db12f99ee8a38fe095e81a534`, using the exact tree of repository-green parent `2aa0b91da82b09f479cd93fb52763786f9a7874f`;
- CI `35083615839` / preflight job `104753395475`;
- `AR-006 isolated provider preflight` — **FAILURE BEFORE DEPLOYMENT / BEFORE DATA MUTATION** because the isolated GitHub Environment values were not yet configured;
- checkout, Node setup, dependency install and secret scan passed;
- the run did not reach the Cloudflare Pages API, Cloudflare Analytics, Supabase authentication or `has_project_permission`, and performed no deployment, document reservation, Storage upload, promotion/finalization or application-data mutation.

Historical isolated-provider setup and credential-readiness attempts earlier on **2026-09-16**:

- Dedicated Supabase Free project `rpdmqqvupmhxlxosasqi` (`mariage-os-ar006-isolated`, `eu-west-3`) has all **63** repository SQL migrations. Synthetic project `3651c5b8-fffa-494a-9686-2abcf0757a9d` exists.
- Dedicated Cloudflare Pages project `mariage-os-ar006-isolated` (project ID `1223854c-79fc-4617-855b-7919597e809f`) has preview `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and encrypted `PRIVATE_DOCUMENT_ADMIN_KEY` for this isolated Supabase project. Cloudflare dashboard displayed **Workers Free — Current plan** with the normal **10 ms CPU/request** limit.
- GitHub Environment `ar006-isolated` is restricted to `lot-2/venues-core`; runbook variables and scoped secrets were configured. Provider credential values are not stored in this board.
- Readiness heads `918ed0e198574f9c3e7f17d4c67cab7e1bc27c4d` / `35133580074` and `803b2e641b75074aa1d966cc6681c9523d36c1c1` / `35135570623` failed closed only at synthetic Supabase password authentication; no Pages deployment or application-data mutation occurred.
- Final confirmed synthetic user `ar006-synthetic-20260916-rpdm-final@example.com` (UUID `650241aa-fbf6-41ce-a277-9708f26b946a`) has active `editor` / `documents.write`. Its password is not retained in the repository.

Exact isolated provider execution on **2026-09-16**:

- No-content preflight head `d89b3601d066996c3958f30ad9067b34675f8b22` / CI `35138142860` / provider preflight job `104935966498` — **SUCCESS**.
- No-content evidence head `4f40613060b4c9de41a32d99ed43fcf6e12c9791` / CI `35138368708` — normal five repository jobs **5/5 SUCCESS**, including clean-checkout full verification. Provider evidence job `104939181956` deployed the exact head to isolated Workers Free Pages preview deployment `064d50b9-3c3d-414e-a6c3-afdcc1051be9` at `https://064d50b9.mariage-os-ar006-isolated.pages.dev`, branch `ar006-4f40613060b4`, preview script `pages-worker--19505720-preview`. Deployment identity, preview Functions/bindings and deny smoke passed.
- Sanitized schema-v2 Actions artifact `10464581885` (ZIP SHA-256 `56c809b27dadf42a3ef26a003855eb628dbf0ef437774bb76d82c02b33ada3c5`) records ten distinct exact `25,000,000`-byte synthetic promotions, all HTTP 200 and finalized. Controlled analytics window: `2026-09-16T19:13:57.417Z` to `19:16:29.334Z`.
- Provider CPU evidence was **absent, not above budget**: `providerCpuMeasurements: []`, `pass: false`. Cloudflare GraphQL `workersInvocationsAdaptive` returned no rows. No CPU value or CPU-limit outcome can be inferred from HTTP 200.
- Detailed attempt record: `docs/roadmap/lot-2/WP-2.9C-AR-006-PROVIDER-ATTEMPT-2026-09-16.md`.

AR-006 evidence-channel follow-up and architecture review:

- Read-only delayed requery trigger `9b139d23a7de47f8d3927a54c54d79298ca96a6b` / workflow `35149303081` re-read the same exact script/window roughly 1 h 40 later and still returned no provider CPU rows. Artifact `10468931194` remained fail-closed.
- Therefore the GraphQL aggregation-delay hypothesis did not unblock AR-006. `docs/roadmap/lot-2/WP-2.9C-AR-006-ARCHITECTURE-REVIEW.md` is **OPEN**.
- A bounded Pages deployment-tail capability support tree `d04edd0ed0d3daa3b9bfe20d954003bb13545200` was verified on parent `82e05a8dab9f61377f045b74005fd6582da0afe3` / CI `35152382433` — **5/5 SUCCESS**, including clean-checkout full verification.
- No-content exact-tree tail trigger `7645a9e769c641640f52fdba535deb6140401fc6` launched workflow `35153132971`, job `104986087784`. The exact deployment tail attached and the deny-only production smoke succeeded with no PDF upload, Supabase auth or application-data mutation.
- Sanitized tail artifact `10469354745`, ZIP SHA-256 `6b1c9db4b0b54d83881614867c1f68bd3e45b71fa767fec55c09203a72ac1f8c`, recorded `parsedJsonEventCount: 0`, `providerCpuTimeMs: []`, `pass: false`. Raw tail data was deliberately not retained.
- That result does not prove every Pages-tail event lacks CPU, but Cloudflare's documented standard Pages deployment-tail event shape does not define CPU time. Standard Pages tail is therefore **not approved as the final AR-006 CPU channel** and the ten exact-size promotions must not be rerun merely to retry it.
- Workers Observability capability preflight after dedicated secret configuration: no-content commit `bd3fdb4baab6ef59983e40f77b5b2f44ba6dc8b7`, workflow `35213157767`, job `105175271234`. The deny-only smoke passed and the query ran with the configured dedicated secret, but Cloudflare exposed no attributable numeric provider CPU for `pages-worker--19505720-preview`. Sanitized artifact `10494251279` (ZIP SHA-256 `02438aadb3e377f6c8e6ed66b3b00c0c0d3e473008c3bb710acbfb805f2dde7c`) failed closed. It contains no credentials or application data. The dedicated Cloudflare token was revoked and `AR006_CLOUDFLARE_OBSERVABILITY_TOKEN` was deleted from the GitHub Environment after the exercise.
- The three tested provider channels are now insufficient for this unchanged isolated Pages deployment: GraphQL, standard Pages tail and Workers Observability. No exact-size promotion, Paid entitlement, timing substitute, contract reduction or runtime migration is authorized by this result.
- The Observability capability probe must use a dedicated short-lived `AR006_CLOUDFLARE_OBSERVABILITY_TOKEN`; Cloudflare currently documents `Workers Observability Write` as the API permission for the telemetry query/key endpoints. This token must not replace/reuse the Pages deployment or Account Analytics tokens.

Current remediation status:

- `WP29C-AR-005` — **MAJOR / IMPLEMENTATION-REMEDIATED / EXACT-HEAD-GREEN** — trusted clean-abandon path, DB orphan backstop, immediate pre-copy reservation revalidation, safe post-copy compensation and race/retry coverage implemented. Formal closure waits for the later complete fresh Pass B after AR-006 is unblocked.
- `WP29C-AR-006` — **MAJOR / OPEN / IN_PROGRESS** — GraphQL, Pages tail and unchanged-Pages Observability did not yield numeric CPU. ADR 0011 now authorizes a private Worker Service Binding with persisted Worker invocation logs. Exact-size evidence remains absent; implementation, isolated binding configuration and final provider verification are required before review.
- `WP29C-AR-007` — **MAJOR / IMPLEMENTATION-REMEDIATED / EXACT-HEAD-GREEN** — ADR/release/CI-CD/secret contracts reconciled to Pages Functions and `PRIVATE_DOCUMENT_ADMIN_KEY`; fail-closed non-destructive deployment smoke added. Formal closure waits for the later complete fresh Pass B after AR-006 is unblocked.

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

Local Wrangler/workerd exact-25-MB success is functional evidence, not Workers Free CPU evidence. The frozen normal Workers Free acceptance budget remains `10 ms` CPU per request.

The original provider evidence harness and delayed requery used `workersInvocationsAdaptive` CPU quantiles as microseconds, retained raw values, normalized by division by `1000`, and failed closed because no provider rows were returned. That channel is now historical evidence, not the sole planned channel.

Unblock still requires an exact-commit isolated Pages deployment on Workers Free, exact `25,000,000`-byte trusted promotions, and provider-produced CPU-specific telemetry demonstrating at least ten controlled successes inside the normal Free CPU budget with no CPU-limit outcome, no Paid entitlement and no file-limit reduction.

Provider-observation exploration is now governed by the open architecture review:

- GraphQL `workersInvocationsAdaptive`: unavailable for this isolated Pages preview after immediate and delayed queries;
- standard Pages deployment tail: bounded deny-only probe executed, but no parseable CPU event was retained and the documented tail event contract does not define CPU time;
- Workers Observability telemetry REST API: next bounded capability candidate because its provider model defines `$workers.cpuTimeMs`; capability against the existing Pages script must be proven before any exact-size rerun;
- wall time, HTTP 200, application timing, Paid-only shortcuts and file-limit reduction remain invalid substitutes.

Until provider CPU evidence exists, WP-2.9C remains **IN_PROGRESS** only for ADR 0011 implementation and configuration; it cannot enter `REVIEW_PENDING`.

### AR-007 operations gate retained

Normative release/deployment/secret contracts require Pages Functions to deploy with the exact static candidate, `PRIVATE_DOCUMENT_ADMIN_KEY` to live only as an environment-specific Cloudflare encrypted secret, `/api/private-document-promote` to fail closed without static/origin fallback, and the removed Supabase promotion route to remain absent. `npm run smoke:private-document-production` provides deny-oriented deployment smoke without privileged credentials or real wedding data.

## Current next-action gate

1. Finish ADR 0011 Worker/Pages delegation and the exact Worker-telemetry harness; preserve AR-005 and AR-007 controls.
2. Run ordinary exact-head CI, then `[AR006-WORKER-BOOTSTRAP]` to deploy the private Worker without application mutation.
3. Configure only the isolated Worker/Page bindings and encrypted provider secret, then require `[AR006-PREFLIGHT]` to pass.
4. Trigger `[AR006-EVIDENCE]` only for the final Worker-correlated ten-promotion exercise. Do not repeat the historical GraphQL, Pages-tail or unchanged-Pages channels.
5. If telemetry is absent/ambiguous or a measurement exceeds the Free budget, keep AR-006 open and return to architecture review. Do not substitute wall time, dashboard aggregate, Paid entitlement or a lower file limit.
6. Only after valid AR-006 exact-size CPU evidence, record it durably, verify exact-head CI/clean checkout, transition C to `REVIEW_PENDING`, run a complete fresh independent Pass B and then Pass C before acceptance.
7. WP-2.9A remains **BLOCKED** until C is accepted; WP-2.9B and later Lots remain inactive.

## Durable handoff

```text
main integration truth: f6da05626f024431230ae46ca1ec8a4becc72a1f
Lot 0: ACCEPTED
Lot 1: ACCEPTED
Lot 2: IN_PROGRESS
Lot 2 branch: lot-2/venues-core
Accepted durable Lot-2 packets: WP-2.1..WP-2.8C
WP-2.9A: BLOCKED — waits for WP-2.9C ACCEPTED
Current packet: WP-2.9C — IN_PROGRESS on ADR 0011 Worker implementation and isolated provider configuration
Latest green readiness: d89b3601d066996c3958f30ad9067b34675f8b22 / 35138142860 / job 104935966498 — SUCCESS
Exact-size evidence candidate: 4f40613060b4c9de41a32d99ed43fcf6e12c9791 / 35138368708 — 5/5 normal jobs SUCCESS; ten exact 25,000,000-byte promotions HTTP 200/finalized; provider CPU rows absent
Provider deployment: 064d50b9-3c3d-414e-a6c3-afdcc1051be9 / pages-worker--19505720-preview / Workers Free Pages preview
Exact-size evidence artifact: 10464581885 / ZIP SHA-256 56c809b27dadf42a3ef26a003855eb628dbf0ef437774bb76d82c02b33ada3c5 / providerCpuMeasurements=[] / pass=false
Delayed GraphQL requery: 9b139d23a7de47f8d3927a54c54d79298ca96a6b / workflow 35149303081 / artifact 10468931194 — still no CPU rows
AR-006 architecture review: DECISION RECORDED IN ADR 0011; implementation/verification open
Tail support green tree: d04edd0ed0d3daa3b9bfe20d954003bb13545200 / parent 82e05a8dab9f61377f045b74005fd6582da0afe3 / CI 35152382433 — 5/5 SUCCESS
Tail capability trigger: 7645a9e769c641640f52fdba535deb6140401fc6 / workflow 35153132971 / job 104986087784 / artifact 10469354745 — deny smoke SUCCESS; parsedJsonEventCount=0; providerCpuTimeMs=[]; pass=false
Workers Observability configured capability preflight: bd3fdb4baab6ef59983e40f77b5b2f44ba6dc8b7 / workflow 35213157767 / job 105175271234 / artifact 10494251279 (ZIP SHA-256 02438aadb3e377f6c8e6ed66b3b00c0c0d3e473008c3bb710acbfb805f2dde7c) — deny smoke passed; no attributable numeric provider CPU; pass=false
AR-006 architecture review: ADR 0011 accepted after the three Pages channels were insufficient; private Worker evidence path in implementation
AR-005 and AR-007: implementation-remediated / exact-head-green — formal closure waits fresh Pass B after AR-006 unblock
FTR-089 FIR: #17 — BLOCKED
WP-2.9B: PLANNED / AFTER A
Lots 3–12: NOT_STARTED
Next permitted action: finish and verify ADR 0011, deploy/configure the isolated private Worker, then run the governed Worker-correlated evidence sequence
```
