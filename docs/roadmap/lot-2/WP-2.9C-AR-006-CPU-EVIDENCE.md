# WP-2.9C / WP29C-AR-006 — Workers Free CPU evidence

State: **BLOCKING EVIDENCE GAP**

Date opened: 2026-09-15

Branch: `lot-2/venues-core`

Related packet: `WP-2.9C`

Related FIR: `#17 / FTR-089`

Architecture: `ADR 0010 — Private-document promotion ingress termination boundary`

Execution runbook: `WP-2.9C-AR-006-RUNBOOK.md`

## Acceptance question

Can the frozen exact `25,000,000`-byte trusted private-document promotion complete on the intended Cloudflare Pages Functions / Workers **Free** runtime without relying on paid CPU entitlement or on occasional CPU-limit flexibility?

Until provider-produced CPU evidence answers that question positively, `WP29C-AR-006` remains open and blocks WP-2.9C.

## Provider envelope rechecked on 2026-09-16

Cloudflare's current published Workers Free envelope includes:

- `100,000` requests/day;
- `10 ms` CPU time per HTTP request;
- `128 MB` memory;
- `100 MB` request-body maximum for Free-zone requests.

Pages Functions run on the Workers runtime. The Mariage OS promotion request remains bodyless; the 100 MB platform request-body maximum is not used to justify the 25 MB document contract because the PDF bytes are read from private Supabase Storage after authorization.

Cloudflare exposes CPU separately from wall time through Pages Functions metrics and Workers invocation telemetry. Wall/network duration is not an acceptable substitute for this finding.

For the `workersInvocationsAdaptive` GraphQL path used by the repository harness, CPU-time aggregation is expressed in microseconds (`cpuTimeUs`) and the `cpuTimeP50` / `cpuTimeP99` quantiles are treated as microsecond values. The evidence harness therefore retains the raw quantiles in microseconds, divides by exactly `1000`, and compares the derived millisecond values with the normal `10 ms` Workers Free budget. `npm run test:ar006:metrics` regression-tests the conversion and the exact 10 ms boundary.

Provider references:

- <https://developers.cloudflare.com/workers/platform/limits/>
- <https://developers.cloudflare.com/pages/functions/metrics/>
- <https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-workers-metrics/>
- Cloudflare GraphQL reference for `workersInvocationsAdaptive` CPU fields.

## Evidence already available

Local/runtime implementation evidence proves that the exact-size path is functionally executable under the repository harness:

- local Supabase + Wrangler/workerd promotion harness includes exact `25,000,000`-byte staging and promotion;
- post-AR-005 CI `35021446818` completed the `Local Supabase DB, RLS and Pages Function` job successfully, including `npm run test:promotion`;
- final remediation implementation head `68a4f6bdb7b55acc80c4c6fbb8c0afc0295bfde5` / CI `35025384594` completed **5/5 SUCCESS**, including `Core quality and security`, `Local Supabase DB, RLS and Pages Function`, `Browser and mutation harnesses`, `Privacy-safe preview artifact` and `Full verify from clean checkout`;
- later repository heads added a guarded branch-runnable AR-006 evidence job, exact-size provider harness and fail-closed deployment checks while keeping WP-2.9C blocked;
- the remediation retains bounded staging, exact stored MIME/size checks, `%PDF-` signature validation, actual-byte SHA-256, no-overwrite canonical handling, live authorization, trusted clean-abandon/compensation and independent finalization authorization.

This evidence is necessary but **not sufficient** for AR-006 because local workerd/repository CI success does not demonstrate Workers Free CPU enforcement or provider-measured CPU consumption.

An exact-commit provider deployment and ten successful controlled promotions are now recorded in the 2026-09-16 attempt, but the artifact has no provider CPU rows. See `WP-2.9C-AR-006-PROVIDER-ATTEMPT-2026-09-16.md`. Functional success does not satisfy this CPU gate.

## Required deployed proof

Use an isolated non-production Cloudflare Pages + Supabase environment. Do not use real wedding data or production secrets in repository artifacts.

The proof must:

1. deploy one exact Mariage OS commit containing the current Pages Function to a Cloudflare Pages project operating on Workers Free;
2. record the exact Git commit and Cloudflare deployment/version identity;
3. configure `SUPABASE_URL`, the non-secret publishable/anon-equivalent key and encrypted `PRIVATE_DOCUMENT_ADMIN_KEY` for the isolated Supabase project without recording secret values;
4. create a synthetic authorized project/user and pending private-document reservation;
5. stage a synthetic valid PDF of exactly `25,000,000` bytes at the server-derived `document-ingest-staging` path with exact reserved MIME/size/SHA-256;
6. invoke the same-origin bodyless `POST /api/private-document-promote` route and require successful trusted promotion;
7. record the provider invocation outcome and CPU-specific GraphQL measurements attributable to the invocation/deployment;
8. preserve raw provider CPU quantiles in microseconds and derived values in milliseconds, with `cpu_ms = cpu_us / 1000`;
9. record wall time separately only if useful, never as the CPU result;
10. repeat the exact-size proof sufficiently to demonstrate normal operation rather than one lucky rollover excursion; the evidence set must include at least 10 successful exact-size invocations with no `exceededCpu` / CPU-limit outcome and with each normalized provider CPU measurement within the normal `10 ms` Free budget;
11. run `npm run smoke:private-document-production` against the isolated deployment to prove the route is a Function, fails closed and does not fall through to static/SPA content;
12. retain only metadata, synthetic identifiers/results and CPU measurements; no credential value, bearer token, private PDF content or real wedding data may be committed.

If provider aggregation is the only available view, the evidence must still be attributable to an isolated test window/deployment containing only the controlled exact-size invocations; otherwise it cannot establish the per-invocation acceptance condition.

## Pass condition

AR-006 may become implementation-green only when durable evidence demonstrates all of the following:

```text
exact bytes = 25,000,000
plan/runtime = Workers Free / Pages Functions
trusted promotion = SUCCESS
provider CPU measurement = present and CPU-specific
raw CPU unit = microseconds
normalization = raw microseconds / 1000 -> milliseconds
normal CPU budget = <= 10 ms for every retained controlled invocation
CPU-limit outcome = absent
paid CPU entitlement = absent
file-size contract = unchanged
```

A later fresh Pass B still decides formal finding closure.

## Fail / blocker condition

WP-2.9C remains or returns `BLOCKED` if any of these is true:

- no deployed Workers Free provider CPU evidence is available;
- exact-size promotion receives `exceededCpu` / equivalent CPU-limit failure;
- controlled exact-size invocations require normalized CPU above the normal 10 ms Free envelope;
- provider CPU units/semantics cannot be established safely;
- evidence depends on a Paid entitlement;
- evidence substitutes local timing or wall time for CPU time;
- satisfying the test would require silently lowering the 25 MB PDF contract.

The approved response is architecture review, not automatic Workers Paid activation and not silent file-limit reduction.

## Current verdict

**BLOCKED ON EXTERNAL RUNTIME EVIDENCE.**

Repository remediation, exact-head CI and the isolated exact-size functional path are green, but the provider-evidence artifact failed closed because CPU telemetry is absent. The repository can prepare and validate the implementation, harness, unit conversion, release contract and fail-closed smoke locally, but it cannot manufacture Cloudflare provider CPU telemetry.

The deployment identity is recorded, but provider CPU measurements are absent (`providerCpuMeasurements: []`). Re-query after Cloudflare's possible aggregation delay; if telemetry remains unavailable or unattributable, reopen architecture review under the runbook. AR-006 is not closed, WP-2.9C must not transition to `REVIEW_PENDING`, and WP-2.9A remains blocked.
