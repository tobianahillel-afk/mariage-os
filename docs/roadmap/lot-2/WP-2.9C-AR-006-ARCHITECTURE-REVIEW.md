# WP-2.9C / WP29C-AR-006 — CPU evidence architecture review

Status: **OPEN — GRAPHQL EVIDENCE CHANNEL UNAVAILABLE; LIVE PROVIDER TELEMETRY CHANNEL UNDER VALIDATION**

Date reopened: 2026-09-16

Related packet: `WP-2.9C`

Related FIR: `#17 / FTR-089`

Normative acceptance contract: `WP-2.9C-AR-006-CPU-EVIDENCE.md`

Execution runbook: `WP-2.9C-AR-006-RUNBOOK.md`

## Why this review reopened

The isolated Workers Free evidence candidate `4f40613060b4c9de41a32d99ed43fcf6e12c9791` successfully deployed the exact Pages Function and completed ten distinct synthetic `25,000,000`-byte promotions with HTTP `200`, `success: true` and final `ready` document state. The immediate provider artifact nevertheless contained `providerCpuMeasurements: []`.

A later read-only requery at `9b139d23a7de47f8d3927a54c54d79298ca96a6b` used the same exact script and controlled time window after the aggregation-delay hypothesis had ample time to resolve. Cloudflare still returned no `workersInvocationsAdaptive` CPU rows. Empty telemetry is not zero CPU and cannot close AR-006.

The functional architecture is therefore not shown to be defective. The current **evidence channel** is the blocker: the GraphQL dataset used by the first harness is not producing attributable CPU data for this isolated Pages preview execution.

## Frozen constraints

This review may change the provider-observation mechanism only. It must not weaken any frozen product/security contract:

- Pages Functions / Workers Free remains the intended runtime for the current architecture unless a later explicit ADR changes it;
- exact PDF contract remains `25,000,000` bytes;
- no Workers Paid entitlement;
- provider CPU, not wall time or application timing, must prove the runtime envelope;
- normal Workers Free budget remains `10 ms` CPU per request;
- at least ten controlled successful exact-size promotions remain required for final evidence;
- no real wedding data, bearer tokens, secret values or PDF bytes may enter durable artifacts;
- authorization, RLS, staging, integrity, finalize and cleanup controls remain unchanged.

## Provider evidence channels considered

### A. `workersInvocationsAdaptive` GraphQL — observed unavailable

This was the original approved harness. It remains a valid provider API in principle, but the isolated Pages preview returned no rows during the evidence run and again during a delayed read-only requery. It must not remain the sole acceptance channel for this packet.

### B. Pages deployment live tail — next bounded experiment

Cloudflare exposes an API and Wrangler command to create a tail session for one exact Pages deployment. This is attractive because it can be bound directly to the already-known isolated deployment and can be exercised without redeploying or mutating application data.

Cloudflare also documents provider CPU time on Workers invocation observability/trace records. Before relying on Pages tail for final evidence, Mariage OS must empirically prove that the exact Pages deployment tail event available to this account/runtime actually contains a provider CPU field with established units and enough identity to attribute the event to the request.

The first experiment is therefore intentionally **deny-only and non-mutating**:

1. open a tail on deployment `064d50b9-3c3d-414e-a6c3-afdcc1051be9`;
2. issue only unauthorized/deny-oriented requests to `/api/private-document-promote` on that exact deployment;
3. capture and sanitize the provider event shape;
4. close/delete the tail session;
5. pass only if an invocation event includes provider CPU data with unambiguous units and deployment/request attribution.

A successful capability preflight does **not** close AR-006. It only authorizes redesigning the exact-size evidence harness to capture provider CPU during the ten controlled promotions.

### C. Workers Observability persisted invocation logs / REST API — secondary candidate

Cloudflare Workers Observability exposes invocation records containing `cpuTimeMs`, outcome, request ID, script name and wall time. This is provider-native and suitable in semantics, but Pages-specific enablement/retention and the exact token permission required by the account must be demonstrated before it becomes an approved packet mechanism.

Use this path only if the deployment-tail capability preflight cannot expose CPU or if persisted invocation records provide materially stronger attribution without changing the runtime contract.

### D. Tail Workers — rejected for this packet

Cloudflare Tail Workers are a separate producer/consumer feature available on Paid/Enterprise tiers. They are not acceptable because AR-006 explicitly forbids relying on Paid entitlement.

### E. application timing, wall time, custom Analytics Engine metrics — rejected

These mechanisms do not provide Cloudflare's authoritative CPU consumption for the invocation. They cannot substitute for provider CPU evidence.

## Current decision

**Proceed with a bounded Pages deployment-tail capability preflight before any new exact-25-MB mutation run.**

The capability preflight must be separately guarded, use the existing isolated Pages deployment, perform no deployment and no Supabase/application mutation, and retain only a sanitized event-shape result. If CPU is absent from the Pages live-tail event, do not rerun the ten promotions. Move to a focused Workers Observability API capability probe instead.

If neither provider-native Free-plan channel can expose attributable CPU for the Pages Function, this review must escalate to an explicit architecture decision rather than weakening the acceptance contract.

## Provider references

- <https://developers.cloudflare.com/workers/wrangler/commands/pages/#pages-deployment-tail>
- <https://developers.cloudflare.com/api/resources/pages/subresources/projects/subresources/deployments/>
- <https://developers.cloudflare.com/workers/observability/>
- <https://developers.cloudflare.com/workers/observability/logs/workers-logs/>
- <https://developers.cloudflare.com/api/typescript/resources/workers/subresources/observability/>
- <https://developers.cloudflare.com/logs/logpush/logpush-job/datasets/account/workers_trace_events/>
- <https://developers.cloudflare.com/changelog/post/2025-04-09-workers-timing/>

## Governance

WP-2.9C remains **BLOCKED** throughout this review. No `REVIEW_PENDING`, fresh Pass B, Pass C, WP-2.9A resumption, Workers Paid activation or 25 MB reduction is authorized until valid AR-006 evidence exists.
