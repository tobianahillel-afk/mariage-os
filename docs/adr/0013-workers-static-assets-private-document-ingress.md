# ADR 0013 — Workers Static Assets ingress for private-document lifecycle

- Status: Accepted
- Date: 2026-09-25
- Owner: WP-2.9C / FTR-089 / AR-006
- Related: ADR 0010, ADR 0012

## Context

ADR 0012 successfully moved the heavy exact-25-MB private-document lifecycle
work into a private SQLite-backed Durable Object. Local/runtime tests, provider
binding preflight and exact-preview route checks are green.

The remaining AR-006 proof design still required per-invocation CPU evidence for
both surfaces:

- stateless browser ingress: normal Workers Free CPU <= 10 ms;
- lifecycle Durable Object: provider-classified durable-object execution,
  numeric CPU, no CPU-limit outcome, and CPU below the provider Durable Object
  Free limit.

Cloudflare Pages Functions cannot satisfy the persistence assumption behind that
proof. Cloudflare documents that Pages Functions logs are live-only and are not
stored. Workers Observability Query Builder / REST, by contrast, queries logs
stored by Workers Logs. The 2026-09-25 marker recheck confirmed the mismatch:
the marker-filtered persisted query returned zero events while a broad query of
the Durable Object host returned persisted Worker events.

Cloudflare now documents Workers Static Assets as the preferred full-stack
platform and publishes an official Pages-to-Workers migration guide. Workers
Static Assets can serve the built frontend for free and selectively invoke a
Worker script first for /api/* routes. Workers additionally support persisted
Workers Logs and the broader Observability surface required by AR-006.

The Durable Object architecture itself remains valid and is not reopened.

## Decision

Replace the Pages Function browser ingress with a dedicated public Worker using
Workers Static Assets.

The target V1 boundary becomes:

```text
browser
  -> public Workers Static Assets ingress
       - static frontend assets
       - Worker-first only for /api/*
       - no Supabase admin/service credential
       - Workers Logs enabled
       - normal Workers Free stateless CPU budget
  -> PRIVATE_DOCUMENT_LIFECYCLE external Durable Object binding
  -> private Durable Object host Worker
       - workers_dev: false
       - Supabase admin credential
       - SQLite-backed PrivateDocumentLifecycle
  -> Supabase Auth / RLS / Storage / PostgreSQL
```

ADR 0012 remains authoritative for the Durable Object host, per-document
identity, explicit lifecycle serialization, authorization, actual-byte
integrity, cleanup, compensation and finalization.

ADR 0010's security semantics remain authoritative — one same-origin bodyless
browser boundary — but its Pages-specific implementation is superseded by this
Worker ingress.

## Public ingress Worker

Create a dedicated ingress Worker with these invariants:

- no Supabase service/admin key;
- no direct privileged Supabase database or Storage mutation;
- external Durable Object binding only:
  `PRIVATE_DOCUMENT_LIFECYCLE -> PrivateDocumentLifecycle @ mariage-os-private-document-promotion`;
- Workers Logs enabled with invocation logs and 100% head sampling for the
  isolated AR-006 evidence deployment;
- static assets served from the normal Vite `dist/` output;
- Worker-first routing for `/api/*`;
- unknown `/api/*` paths fail closed and never fall through to SPA/static
  assets;
- `/api/private-document-promote` retains the existing origin, method,
  zero-body framing, UUID and bearer-framing checks before invoking the DO;
- non-API assets remain on the static asset path and do not require Worker
  execution.

For the isolated provider proof, use a separate Worker name
`mariage-os-ar006-ingress`. Its workers.dev endpoint is synthetic-test-only
and does not replace a production custom-domain rollout.

Before release, the production deployment contract must use the same Workers
Static Assets architecture rather than the historical Pages Function route.

## Structured evidence logging

Custom AR-006 logs must be emitted as native structured objects:

```ts
console.log({
  event: "mariage-os.ar006.promotion",
  surface,
  evidenceId,
  status,
});
```

Do not pre-stringify the object.

The collector must treat Cloudflare's event `source` object as the canonical
custom-log payload. A legacy `$metadata.message` JSON parser may be retained
only for historical artifacts/tests and must not be required by the new
campaign.

The final evidence collector queries each exact script name independently. It
does not depend on a global hard-coded `$metadata.message includes ...`
filter to discover either surface.

## Observability discovery

Before any exact-size mutation, the isolated ingress/DO preflight must:

1. deploy the exact private DO host candidate;
2. deploy the exact Workers Static Assets ingress candidate;
3. verify the ingress Worker is exposed only on the isolated workers.dev
   endpoint used for the synthetic test;
4. verify the private DO host still has `workers_dev: false`;
5. verify the external Durable Object binding points to the expected class and
   private host Worker;
6. verify the ingress Worker has no privileged Supabase secret;
7. run deny-oriented smoke;
8. emit one safe random-unreserved-document marker, causing no document
   reservation/upload/promotion;
9. query Workers Observability separately for the exact ingress and DO script
   names;
10. retain only a sanitized schema receipt proving which structured marker keys
    are present and that both surfaces are persisted and attributable.

The Observability API keys/values endpoints may be used read-only to discover
provider-indexed structured fields. No raw credential, authorization header,
PDF bytes, wedding data or unrestricted raw log body may be retained.

### Exact-version readiness after deployment

The provider deployment record identifies the intended version, but a safe
request may still reach the prior version during deployment propagation. The
exact-size harness must prove that a fresh, random-unreserved marker request
actually ran on the intended ingress **and** Durable Object versions before it
constructs or reserves a 25 MB document. Re-reading the old-version marker
cannot establish new-version readiness.

Only a complete two-surface observation whose sole failure is an ingress
`script_version_mismatch` may cause another safe marker request. The new marker
must use a fresh evidence UUID and random unreserved document ID, remain
bounded to at most three rounds total, and retain sanitized mismatch metadata.
Wait at least 20 seconds between rounds so the previous marker falls outside
the collector's 10-second pre-request timestamp margin; an unexpected marker
still fails closed rather than being ignored.
Any CPU-budget failure, provider outcome/model/event/status/identity/truncation
failure, Durable Object version mismatch, ambiguity or incomplete telemetry
must fail closed. Each exact-size promotion is still checked independently
against the exact deployed versions; this readiness gate does not relax the
final ten-flow acceptance test.

## Revised AR-006 CPU acceptance

A new exact-size campaign is authorized only after the Workers ingress
implementation is:

- RED-first proven;
- repository CI green;
- clean-checkout green;
- adversarially reviewed;
- isolated ingress/DO binding + structured-log preflight green.

The exact-size campaign still requires ten distinct synthetic
`25,000,000`-byte PDFs.

For every flow:

### ingress Worker

- exact ingress script identity;
- one structured marker for the expected evidence UUID;
- one exact provider invocation correlated by provider request identity;
- `executionModel=stateless`;
- numeric `$workers.cpuTimeMs` between 0 and 10 ms inclusive;
- provider outcome `ok`;
- HTTP status 200;
- no truncation.

### Durable Object

- exact private-host script and deployed version identity;
- one structured marker for the same evidence UUID;
- one exact provider invocation;
- `executionModel=durableObject`;
- non-null `durableObjectId`;
- ten distinct DO identities for ten distinct document IDs;
- numeric provider CPU within the documented Durable Object Free limit;
- outcome `ok`;
- HTTP status 200;
- no truncation.

Missing markers, duplicate markers, ambiguous invocation identity, missing CPU,
provider query errors, contamination or CPU-limit outcomes fail closed.

Workers Paid, wall-time substitution, dashboard aggregates and a lower PDF
limit remain prohibited.

## Credentials

No new credential is authorized by this ADR.

The already proven isolated `Workers Scripts Write` credential is the intended
deployment credential for both:

- private DO host Worker;
- isolated public Static Assets ingress Worker.

Cloudflare documents that Workers Scripts Write is sufficient to read the
account workers.dev subdomain as well.

The existing Workers Observability credential remains read-only evidence
capability. The historical Pages Write token is no longer part of the final
AR-006 evidence path.

## RED-first requirements

Before implementation:

- current repo must fail an architecture test because no Static Assets ingress
  Worker exists;
- current evidence logger must fail because it stringifies structured data;
- current collector must fail because it requires
  `$metadata.message` marker discovery;
- current provider workflow must fail the new contract because it deploys Pages
  rather than the ingress Worker.

Implementation must then make those same tests green without weakening any
existing security test.

## State transition

This ADR supersedes only the Pages ingress/evidence portion of ADR 0012.

WP-2.9C remains IN_PROGRESS and AR-006 remains OPEN.

Permitted sequence:

1. RED staging proof;
2. Workers Static Assets ingress + structured logging + collector remediation;
3. exact-head repository CI and clean checkout;
4. fresh adversarial implementation review;
5. one isolated no-document-mutation ingress/DO Observability preflight;
6. if and only if green, one ten-flow exact-size provider campaign;
7. if campaign evidence passes, exact-head verification, complete fresh Pass B,
   then Pass C;
8. only Pass C may mark WP-2.9C ACCEPTED and unblock WP-2.9A.

## Provider references

- https://developers.cloudflare.com/pages/functions/debugging-and-logging/
- https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/
- https://developers.cloudflare.com/workers/static-assets/
- https://developers.cloudflare.com/workers/static-assets/routing/worker-script/
- https://developers.cloudflare.com/workers/wrangler/configuration/
- https://developers.cloudflare.com/workers/observability/logs/workers-logs/
- https://developers.cloudflare.com/workers/observability/query-builder/
- https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/
- https://developers.cloudflare.com/api/resources/workers/subresources/subdomains/methods/get/
