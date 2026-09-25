# WP-2.9C ADR 0013 — Adversarial implementation review

Status: **PASS — ONE ISOLATED NO-DOCUMENT-MUTATION INGRESS PREFLIGHT AUTHORIZED AFTER REVIEW SEAL CI**

Review date: 2026-09-25  
Reviewed implementation head: `b06a823e1d6e3b1a4693c683afe11e1771449365`  
Exact-head CI: `36150541994` — **5/5 SUCCESS**, including `Full verify from clean checkout`  
Provider-specific jobs on reviewed head: **SKIPPED**

## Scope

Fresh adversarial review of the ADR 0013 Workers Static Assets browser ingress, same-origin/bodyless route semantics, external per-document Durable Object binding, privilege separation, native structured logging, Workers Observability attribution, exact-script/version CPU evaluator, isolated preflight and guarded exact-size workflow.

ADR 0012 remains authoritative for the private lifecycle Durable Object, per-document identity, explicit serialization, Supabase authentication/live authorization, exact-byte integrity, canonical no-overwrite behavior, attestation, cleanup, compensation and independent finalization.

## Findings

### ADR13-IR-001 — CLOSED / VERIFIED — public ingress privilege boundary

The public ingress contains no `PRIVATE_DOCUMENT_ADMIN_KEY`. The provider preflight independently inspects the deployed ingress version and fails if that privileged binding exists.

### ADR13-IR-002 — CLOSED / VERIFIED — API routing fails closed

Static assets use Worker-first `/api/*`. The ingress Worker accepts only `/api/private-document-promote`; unknown API paths return generic unavailable instead of falling through to SPA/static content. Shared validation preserves origin, POST/DELETE, zero-body framing, UUID, bearer and deterministic server-side DO naming checks.

### ADR13-IR-003 — CLOSED / VERIFIED — lifecycle authority remains private

The ingress forwards only through `PRIVATE_DOCUMENT_LIFECYCLE`. The host remains `workers_dev:false`, SQLite-backed and privileged. Promotion and abandon share the explicit per-document serial gate while retaining all existing authoritative Supabase permission/reservation/integrity/cleanup/compensation/finalization checks.

### ADR13-IR-004 — CLOSED / VERIFIED — structured evidence persists without message-string dependence

Evidence is emitted with native `console.log({ ... })`. The new collector queries each exact script separately and treats structured `source` as canonical; historical `$metadata.message` parsing is fallback only.

### ADR13-IR-005 — CLOSED / VERIFIED — attribution fails closed

A marker requires a valid evidence UUID, expected surface and non-ambiguous provider request identity. The provider invocation must be unique, type `cf-worker-event`, exact script/version, correct status/model/event type/outcome, finite non-negative CPU within budget and non-truncated. Durable evidence additionally requires a non-null DO ID; final ten-flow evidence requires ten distinct DO IDs.

### ADR13-IR-006 — CLOSED / VERIFIED — incomplete telemetry cannot pass

Provider event count must equal the returned event page length. Rate limiting honors `Retry-After`. Missing/duplicate/malformed/unexpected evidence, provider errors, incomplete pages and CPU/type/unit failures remain fail-closed.

### ADR13-IR-007 — CLOSED / VERIFIED — preflight is application-document non-mutating

The preflight signs in only as the synthetic user and issues one random-unreserved probe with an evidence UUID. It does not construct an exact PDF, reserve/upload/promote/finalize a document or run ten flows. Its receipt records `documentMutation:false` and `exactSizeMutation:false`.

### ADR13-IR-008 — CLOSED / VERIFIED — exact-size campaign remains separately gated

The exact-size job requires `[AR006-INGRESS-EVIDENCE]` and full verification. This review does not authorize that marker. The final harness also performs its own structured marker/route preflight before exact-size mutation.

## Provider-contract check

Current Cloudflare contracts used by the implementation were rechecked on 2026-09-25: Workers Static Assets selective Worker-first routing; persisted structured Workers Logs; Observability request/script/version/execution-model/Durable-Object/provider-CPU fields; normal Workers Free stateless CPU budget `10 ms`; Durable Object request CPU ceiling `30,000 ms`.

## Conclusion and authorization

**PASS.** No BLOCKING/MAJOR finding remains in the reviewed ADR 0013 implementation.

This is not AR-006 acceptance evidence and does not move WP-2.9C to `REVIEW_PENDING`.

Exactly one `[AR006-INGRESS-PREFLIGHT]` is authorized **only after the commit containing this review/status/runbook reconciliation passes ordinary exact-head CI and `Full verify from clean checkout`**.

If that preflight fails, do not repeat it automatically and do not run exact-size evidence. Record/review the failure and return to remediation. If it passes, inspect and durably review the sanitized exact-deployment/version/marker receipt; only a separate green seal may authorize one `[AR006-INGRESS-EVIDENCE]` campaign.

No Workers Paid entitlement, wall-time substitute, dashboard aggregate or lower file limit is authorized.
