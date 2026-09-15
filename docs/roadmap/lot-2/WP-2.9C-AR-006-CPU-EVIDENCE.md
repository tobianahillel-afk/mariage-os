# WP-2.9C / WP29C-AR-006 — Workers Free CPU evidence

State: **BLOCKING EVIDENCE GAP**

Date opened: 2026-09-15

Branch: `lot-2/venues-core`

Related packet: `WP-2.9C`

Related FIR: `#17 / FTR-089`

Architecture: `ADR 0010 — Private-document promotion ingress termination boundary`

## Acceptance question

Can the frozen exact `25,000,000`-byte trusted private-document promotion complete on the intended Cloudflare Pages Functions / Workers **Free** runtime without relying on paid CPU entitlement or on occasional CPU-limit flexibility?

Until provider-produced CPU evidence answers that question positively, `WP29C-AR-006` remains open and blocks WP-2.9C.

## Provider envelope rechecked on 2026-09-15

Cloudflare's current published Workers Free envelope includes:

- `100,000` requests/day;
- `10 ms` CPU time per HTTP request;
- `128 MB` memory;
- `100 MB` request-body maximum for Free-zone requests.

Pages Functions run on the Workers runtime. The Mariage OS promotion request remains bodyless; the 100 MB platform request-body maximum is not used to justify the 25 MB document contract because the PDF bytes are read from private Supabase Storage after authorization.

Cloudflare exposes CPU separately from wall time through Pages Functions metrics (`CPU Time per execution`) and Workers invocation telemetry (`CPUTimeMs` / `cloudflare.cpu_time_ms`). Wall/network duration is not an acceptable substitute for this finding.

Provider references:

- <https://developers.cloudflare.com/workers/platform/limits/>
- <https://developers.cloudflare.com/pages/functions/metrics/>
- <https://developers.cloudflare.com/changelog/post/2025-04-09-workers-timing/>
- <https://developers.cloudflare.com/logs/logpush/logpush-job/datasets/account/workers_trace_events/>

## Evidence already available

Local/runtime implementation evidence proves that the exact-size path is functionally executable under the repository harness:

- local Supabase + Wrangler/workerd promotion harness includes exact `25,000,000`-byte staging and promotion;
- post-AR-005 CI `35021446818` completed the `Local Supabase DB, RLS and Pages Function` job successfully, including `npm run test:promotion`;
- final remediation implementation head `68a4f6bdb7b55acc80c4c6fbb8c0afc0295bfde5` / CI `35025384594` completed **5/5 SUCCESS**, including `Core quality and security`, `Local Supabase DB, RLS and Pages Function`, `Browser and mutation harnesses`, `Privacy-safe preview artifact` and `Full verify from clean checkout`;
- on that exact implementation head, `db:verify`, `test:promotion`, unit/coverage, dependency audit, build, E2E and mutation gates all passed;
- the remediation retains bounded staging, exact stored MIME/size checks, `%PDF-` signature validation, actual-byte SHA-256, no-overwrite canonical handling, live authorization, trusted clean-abandon/compensation and independent finalization authorization.

This evidence is necessary but **not sufficient** for AR-006 because local workerd/repository CI success does not demonstrate Workers Free CPU enforcement or provider-measured CPU consumption.

No provider `CPUTimeMs`, Pages Functions CPU quantile, deployment identity or equivalent deployed-Free CPU record is currently present in the repository/FIR evidence inspected for this packet. No concrete Pages deployment URL was found in that evidence either. This does not prove that no external deployment exists; it means no acceptance-grade provider record is available to the packet.

## Required deployed proof

Use an isolated non-production Cloudflare Pages + Supabase environment. Do not use real wedding data or production secrets in repository artifacts.

The proof must:

1. deploy one exact Mariage OS commit containing the current Pages Function to a Cloudflare Pages project operating on Workers Free;
2. record the exact Git commit and Cloudflare deployment/version identity;
3. configure `SUPABASE_URL`, the non-secret publishable/anon-equivalent key and encrypted `PRIVATE_DOCUMENT_ADMIN_KEY` for the isolated Supabase project without recording secret values;
4. create a synthetic authorized project/user and pending private-document reservation;
5. stage a synthetic valid PDF of exactly `25,000,000` bytes at the server-derived `document-ingest-staging` path with exact reserved MIME/size/SHA-256;
6. invoke the same-origin bodyless `POST /api/private-document-promote` route and require successful trusted promotion;
7. record the provider invocation outcome and **CPU-specific** measurement (`CPUTimeMs`, `cloudflare.cpu_time_ms` or a Cloudflare Pages Functions CPU-time record attributable to the invocation/deployment);
8. record wall time separately if useful, but never use it as the CPU result;
9. repeat the exact-size proof sufficiently to demonstrate normal operation rather than one lucky rollover excursion; the evidence set must include at least 10 successful exact-size invocations with no `exceededCpu` / CPU-limit outcome and with each recorded provider CPU measurement within the normal `10 ms` Free budget;
10. run `npm run smoke:private-document-production` (or the same deny contract against the isolated deployment) to prove the route is a Function, fails closed and does not fall through to static/SPA content;
11. retain only metadata, synthetic identifiers/results and CPU measurements; no credential value, bearer token, private PDF content or real wedding data may be committed.

If provider aggregation is the only available view, the evidence must still be attributable to an isolated test window/deployment containing only the controlled exact-size invocations; otherwise it cannot establish the per-invocation acceptance condition.

## Pass condition

AR-006 may become implementation-green only when durable evidence demonstrates all of the following:

```text
exact bytes = 25,000,000
plan/runtime = Workers Free / Pages Functions
trusted promotion = SUCCESS
provider CPU measurement = present and CPU-specific
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
- controlled exact-size invocations require CPU above the normal 10 ms Free envelope;
- evidence depends on a Paid entitlement;
- evidence substitutes local timing or wall time for CPU time;
- satisfying the test would require silently lowering the 25 MB PDF contract.

The approved response is architecture review, not automatic Workers Paid activation and not silent file-limit reduction.

## Current verdict

**BLOCKED ON EXTERNAL RUNTIME EVIDENCE.**

Repository remediation is now exact-head green at `68a4f6bdb7b55acc80c4c6fbb8c0afc0295bfde5` / CI `35025384594` — **5/5 SUCCESS**, clean checkout included. The repository can prepare and validate the implementation, test harness, release contract and fail-closed smoke locally, but it cannot manufacture Cloudflare provider CPU telemetry.

No acceptance-grade Cloudflare deployment identity/URL and provider CPU record are currently available in the repository/FIR evidence used for this packet. Therefore AR-006 is not closed, WP-2.9C must not transition to `REVIEW_PENDING`, and WP-2.9A remains blocked until this gate is resolved and WP-2.9C later reaches acceptance.