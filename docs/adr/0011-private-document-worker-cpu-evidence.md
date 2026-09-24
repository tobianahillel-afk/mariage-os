# ADR 0011 — Private-document promotion Worker execution and CPU evidence

- Status: Superseded for final execution by ADR 0012 after deployed Free CPU failure
- Date: 2026-09-17
- Owner: WP-2.9C / FTR-089
- Related: ADR 0008, ADR 0009, ADR 0010

## Context

ADR 0010 keeps the browser-reachable private-document promotion ingress in a
narrow same-origin Pages Function. AR-006 still requires provider CPU evidence
for ten successful `25,000,000`-byte promotions on Workers Free. The deployed
Pages candidate completed the functional promotions, but GraphQL, the standard
Pages tail and a correctly authorized Workers Observability query returned no
attributable numeric CPU for the Pages script. Empty telemetry is not zero CPU.

Workers Observability queries persisted Workers Logs, including
`$workers.cpuTimeMs`. Cloudflare Service Bindings allow Pages/Workers code to
call an internal Worker without using a public URL. This preserves the frozen
file contract, avoids Paid compute and supplies a provider-supported CPU path.

## Decision

```text
browser -> same-origin Pages promotion route -> private Worker Service Binding -> Supabase
```

- Pages remains the sole browser-reachable route and rejects invalid origin,
  method, targets, bearer framing and any request body before forwarding.
- The existing DELETE abandon route stays in Pages. It is not the CPU-evidence
  operation.
- The Worker repeats promotion input, bearer, authorization, reservation,
  staging-byte, SHA-256, no-overwrite, attestation, cleanup and compensation
  checks. A Service Binding never replaces input validation.
- The Worker has `workers_dev: false`, no public route, observability enabled,
  invocation logs enabled and `head_sampling_rate: 1` in the isolated evidence
  environment.
- Pages declares `PRIVATE_DOCUMENT_PROMOTION_WORKER` as the Service Binding.
- Both runtimes use the same isolated non-secret Supabase URL/publishable key.
  Each has its own encrypted Cloudflare `PRIVATE_DOCUMENT_ADMIN_KEY` binding.
  This credential is never copied into GitHub Actions, source, artifacts or logs.

Final evidence uses opaque synthetic UUID correlation identifiers. The Worker
may retain only the UUID, provider request identifier, outcome and CPU metadata
needed to associate each controlled promotion with its invocation. It retains no
PDF bytes, bearer token, password, service credential, raw provider log or real
wedding identifier.

## Credential model

| Secret | Minimum scope | Lifecycle |
|---|---|---|
| `AR006_CLOUDFLARE_DEPLOY_TOKEN` | isolated Pages deployment/configuration write | short-lived; revoke after evidence |
| `AR006_CLOUDFLARE_WORKER_DEPLOY_TOKEN` | isolated Worker Scripts write | short-lived; revoke after evidence |
| `AR006_CLOUDFLARE_OBSERVABILITY_TOKEN` | Workers Observability query only | short-lived; revoke after evidence |
| `PRIVATE_DOCUMENT_ADMIN_KEY` | isolated Supabase server credential | encrypted Pages/Worker binding, provider-first rotation |

The evidence workflow deploys the private Worker first, verifies its private
configuration, then deploys the same exact Pages candidate with the matching
binding. Ordinary repository CI must be green first. Any deployment,
configuration, correlation or telemetry failure is fail-closed.

## Supersession

The exact-size provider campaign on 2026-09-24 measured eight successful
stateless private-Worker invocations at 237–273 ms CPU and two additional
`exceededCpu` outcomes. That fails ADR 0011's own 10 ms normal Workers Free
acceptance condition. ADR 0012 therefore supersedes this execution location
with a direct Pages → private per-document Durable Object path. This ADR remains
historical evidence for why the stateless Service Binding must not be restored
as the final V1 solution.

## Consequences

- The public same-origin and bodyless ADR 0010 boundary remains intact.
- Provider CPU is collected from the Worker executing the expensive trusted
  staged-byte verification.
- The acceptance remains ten exact-size successes, ten attributable CPU values
  at or below `10 ms`, no CPU-limit outcome, no Paid entitlement and no
  contaminating traffic.
- No public Worker endpoint, database, Storage bucket, lower file limit,
  permanent token, wall-time substitute or dashboard quantile proof is allowed.

## Unblock condition

This ADR moves WP-2.9C to `IN_PROGRESS / A-IMPLEMENT` only for implementation
and verification of this architecture. AR-006 is still open. `REVIEW_PENDING`
requires exact-head repository verification plus a reviewed final harness. A
fresh complete Pass B and Pass C remain mandatory after provider evidence.
