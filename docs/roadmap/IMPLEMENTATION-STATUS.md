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

External isolated-provider setup and readiness on **2026-09-16** (configuration only; **not AR-006 CPU evidence**):

- Dedicated Supabase Free project `rpdmqqvupmhxlxosasqi` (`mariage-os-ar006-isolated`, `eu-west-3`) has all **63** repository SQL migrations. Synthetic project `3651c5b8-fffa-494a-9686-2abcf0757a9d` and confirmed user `ar006-synthetic-20260916-rpdm@example.com` exist; the user is an active `editor` with `documents.write`. The user has not signed in successfully.
- Dedicated Cloudflare Pages project `mariage-os-ar006-isolated` (project ID `1223854c-79fc-4617-855b-7919597e809f`) has preview `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and encrypted `PRIVATE_DOCUMENT_ADMIN_KEY` for this isolated Supabase project. Cloudflare dashboard displays **Workers Free — Current plan** with the normal **10 ms CPU/request** limit. No Pages deployment has occurred.
- GitHub Environment `ar006-isolated` is restricted to `lot-2/venues-core`; all seven runbook variables and three scoped secrets are configured. Two Cloudflare tokens have only Pages Write and Account Analytics Read respectively and expire in seven days. The synthetic Supabase user password is stored only as an Environment secret, not in Git or this status board.
- No-content exact-tree readiness head `918ed0e198574f9c3e7f17d4c67cab7e1bc27c4d` triggered CI `35133580074`. All five repository jobs passed, including clean-checkout full verification. The isolated provider preflight job `104920622572` passed Cloudflare Pages and Analytics checks, then **FAILED** at synthetic Supabase password authentication. The provider-evidence job was **SKIPPED**. Preflight made no deployment or application-data mutation.
- Replacement confirmed synthetic user `ar006-synthetic-20260916-rpdm-retry@example.com` (UUID `5b89113d-4ed9-42b5-806c-d83a483bb271`) was created at 18:35:54 UTC and granted active `editor` membership on the same synthetic project. GitHub Environment `AR006_TEST_USER_EMAIL` points to this user. The password secret's latest observed update preceded user creation (about 18:33 UTC); the value is never read or recorded.
- No-content exact-tree readiness head `803b2e641b75074aa1d966cc6681c9523d36c1c1` triggered CI `35135570623`. All five normal repository jobs passed, including clean-checkout full verification. Preflight job `104927719402` again passed Cloudflare Pages/Analytics checks but **FAILED** at synthetic Supabase password authentication; evidence job was **SKIPPED**. No Pages deployment or application-data mutation occurred. The exact credential mismatch cause is not proven. The user must establish one explicitly known Supabase test password and place that same password in the isolated GitHub Environment secret; then rerun read-only `[AR006-PREFLIGHT]`. Do not trigger `[AR006-EVIDENCE]` while readiness is red.

Current remediation status:

- `WP29C-AR-005` — **MAJOR / IMPLEMENTATION-REMEDIATED / EXACT-HEAD-GREEN** — trusted clean-abandon path, DB orphan backstop, immediate pre-copy reservation revalidation, safe post-copy compensation and race/retry coverage implemented. Formal closure now waits only for the later complete fresh Pass B after AR-006 is unblocked.
- `WP29C-AR-006` — **MAJOR / OPEN / BLOCKING** — exact-25-MB Workers/Pages Free CPU feasibility still lacks deployed provider CPU evidence; the immediate prerequisite is to correct synthetic Supabase authentication and obtain a green read-only readiness preflight. Durable proof protocol: `docs/roadmap/lot-2/WP-2.9C-AR-006-CPU-EVIDENCE.md`; executable runbook: `docs/roadmap/lot-2/WP-2.9C-AR-006-RUNBOOK.md`.
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

Both jobs use the `ar006-isolated` GitHub Environment. Ordinary pushes/PRs skip both provider jobs and do not receive those credentials. The latest readiness run (`803b2e641b75074aa1d966cc6681c9523d36c1c1` / `35135570623`) reached Supabase after Cloudflare checks but failed synthetic password authentication, so `[AR006-EVIDENCE]` remains unauthorized.

No acceptance-grade deployed Pages identity plus provider CPU telemetry is recorded in the repository/FIR evidence used for this packet. Absence from repository evidence is not proof that no external deployment exists; it means the acceptance evidence is unavailable to the packet.

Until that evidence exists, WP-2.9C remains **BLOCKED**. If the proof fails after a correctly configured readiness gate, revisit architecture rather than silently enabling paid compute or shrinking the PDF contract.

### AR-007 operations gate retained

Normative release/deployment/secret contracts now require Pages Functions to deploy with the exact static candidate, `PRIVATE_DOCUMENT_ADMIN_KEY` to live only as an environment-specific Cloudflare encrypted secret, `/api/private-document-promote` to fail closed without static/origin fallback, and the removed Supabase promotion route to remain absent. `npm run smoke:private-document-production` provides deny-oriented deployment smoke without privileged credentials or real wedding data.

## Current next-action gate

1. WP-2.9C is **BLOCKED** on `WP29C-AR-006`.
2. Preserve AR-005 and AR-007 remediation behavior; do not weaken RLS/authorization/file limits or deployment/secret controls.
3. Correct isolated synthetic Supabase authentication. The replacement user already has active `documents.write`; reconcile its actual Supabase password with the isolated GitHub Environment password secret through the required user credential handoff.
4. Preserve the verified Pages preview bindings, scoped Cloudflare tokens and Workers Free/no-Paid basis. These prerequisites passed the latest read-only provider preflight.
5. Repeat a no-content `[AR006-PREFLIGHT]` commit using the exact current tree. The readiness job must pass before any evidence trigger is authorized.
6. Only after a green readiness preflight, trigger a no-content exact candidate with `[AR006-EVIDENCE]`; its preflight must pass again before build/deployment or document mutation occurs.
7. Inspect the sanitized schema-v2 artifact and require 10 successful exact-size controlled invocations, raw CPU microsecond values with arithmetically consistent millisecond normalization, and normalized CPU p50/p99 `<= 10 ms` for every retained invocation.
8. If that evidence cannot demonstrate the normal Free envelope, remain `BLOCKED` and revisit architecture; do not enable Paid or reduce the 25 MB contract silently.
9. After valid AR-006 evidence, preserve/run exact-head full CI + clean-checkout verification over the evidence-bound candidate.
10. Transition C back to `REVIEW_PENDING` only after all remediation evidence is green.
11. Run another complete fresh independent Pass B over the whole packet and all seven findings.
12. Only a clean Pass B may enter `ACCEPTANCE_PENDING`; only Pass C may mark C `ACCEPTED`.
13. WP-2.9A remains **BLOCKED** and WP-2.9B remains **PLANNED / AFTER A**.

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
Latest repository-green head: 803b2e641b75074aa1d966cc6681c9523d36c1c1 / 35135570623 — 5/5 repository jobs SUCCESS, clean checkout included; provider preflight FAILED at synthetic authentication, evidence job SKIPPED
Latest AR-006 readiness attempt: 803b2e641b75074aa1d966cc6681c9523d36c1c1 / 35135570623 / job 104927719402 — five repository jobs green; Pages/Analytics checks passed; replacement synthetic Supabase password authentication failed; no deployment or application-data mutation occurred
AR-005: implementation-remediated / exact-head-green — formal closure waits fresh Pass B after AR-006 unblock
AR-006: OPEN / BLOCKING — isolated provider setup and Environment complete; reconcile synthetic Supabase login with the GitHub password secret, obtain green [AR006-PREFLIGHT], then deployed exact-25-MB CPU evidence
AR-006 evidence protocol: docs/roadmap/lot-2/WP-2.9C-AR-006-CPU-EVIDENCE.md
AR-006 execution runbook: docs/roadmap/lot-2/WP-2.9C-AR-006-RUNBOOK.md
AR-007: implementation-remediated / exact-head-green — formal closure waits fresh Pass B after AR-006 unblock
FTR-089 FIR: #17 — BLOCKED
WP-2.9A resumes only after WP-2.9C ACCEPTED
WP-2.9B remains PLANNED / AFTER A
Lots 3–12: NOT_STARTED
Next permitted action: user credential handoff to establish one explicitly known Supabase test password and the same isolated GitHub password secret; rerun [AR006-PREFLIGHT]; [AR006-EVIDENCE] remains forbidden until readiness is green
```
