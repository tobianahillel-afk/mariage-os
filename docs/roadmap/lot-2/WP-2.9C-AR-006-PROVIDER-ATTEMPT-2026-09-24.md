# WP-2.9C / AR-006 — 2026-09-24 Workers Free provider attempt

Status: **FAILED / BLOCKING — NOT ACCEPTANCE EVIDENCE**

## Exact candidate and controls

- Candidate: `26da10e5aabd7d2a9b6105caef49dd87d6ee58b9` on `lot-2/venues-core`.
- GitHub CI run: `35977875774`; all five ordinary jobs succeeded, including
  `Full verify from clean checkout`.
- Isolated evidence job: `107565190064` — failed at `Collect exact-size
promotion and CPU evidence`; environment guard, preflight, private-Worker
  deploy, Pages preview deploy, deployment/binding validation and deny smoke
  all succeeded first.
- Isolated Pages deployment: `7ddcd68e-9165-4b0d-86f3-d220de921a82`, branch
  `ar006-26da10e5aabd`, with private Worker
  `mariage-os-private-document-promotion` and Workers Free attestation.
- Sanitized GitHub artifact: `10799077529`, archive SHA-256
  `b11e62221fa82f1697133e51f19eeeb546ff562a5615327da14882924025003e`.
  The downloaded ZIP matched GitHub's digest. It contains only
  `ar006-workers-free-evidence.json`; no token, bearer header, PDF bytes or
  private wedding content is retained in this record.

## Observed result

The harness reserved and staged ten distinct synthetic PDFs of exactly
`25,000,000` bytes, then invoked the exact preview promotion route. The
sanitized artifact records eight HTTP `200` successful promotions and two HTTP
`503` failures. Its sixth Workers Observability query returned HTTP `200`,
`success: true`, no provider error codes, but no UUID-correlated marker and no
accepted measurement; `pass: false`. Do not reinterpret its empty
`provider.measurements` as zero CPU.

A subsequent **read-only** Cloudflare connector query, filtered to the exact
private Worker and the bounded 2026-09-24 `09:02:11–09:08:00 UTC` window,
returned HTTP `200`, `success: true`, twenty stored events: ten
`cf-worker-event` invocation rows and ten `cf-worker` log rows. The query used
`view: events`, `dry: true`, `limit: 100`, and did not deploy, promote or change
provider state. The invocation rows expose provider-native
`$workers.cpuTimeMs` directly in **milliseconds**:

| Invocation outcome | Count | Provider CPU time (ms)                 | Provider response                                                        |
| ------------------ | ----: | -------------------------------------- | ------------------------------------------------------------------------ |
| `ok`               |     8 | 237, 239, 256, 256, 261, 267, 270, 273 | HTTP 200                                                                 |
| `exceededCpu`      |     2 | 10, 27                                 | no successful Worker response; the client recorded two HTTP 503 failures |

The event window, script name, exact preview request path, ten invocation
rows, eight provider HTTP-200 responses and two `exceededCpu` outcomes align
with the ten controlled attempts. The stored provider events do not contain
the synthetic UUID marker in `$metadata.message`, so an individual
UUID-to-provider-request mapping is **not claimed**. This limits per-document
attribution, but does not erase the direct budget failure: all eight observed
successful invocations exceed the normal `10 ms` Workers Free CPU budget by
over 20×, and two invocations have an explicit CPU-limit outcome.

The evidence evaluator also expects `$workers.requestId` and
`$metadata.statusCode`; the observed provider rows instead have
`$metadata.requestId` and, for successful invocations,
`$workers.event.response.status`. Its `missing_marker` classification is
therefore a separate telemetry-correlation defect. Repairing that parser
alone cannot turn 237–273 ms of CPU or `exceededCpu` into a Free-budget pass.

Cloudflare's [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
define CPU as execution time excluding network wait, specify `10 ms` per HTTP
request on Workers Free, and document `exceededCpu` as the provider outcome
when CPU limits terminate a Worker. Occasional runtime flexibility does not
satisfy the repository's normal-envelope acceptance condition.

## Verdict and permitted continuation

`WP29C-AR-006` remains **MAJOR / OPEN**. The current ADR 0011 private-Worker
design fails the frozen exact-size Workers Free CPU condition. WP-2.9C returns
to **BLOCKED**. No further exact-size campaign, old-log requery, silent Workers
Paid activation or reduction of the 25 MB contract is authorized by this
result. Next work is an explicit architecture review of the trust/CPU boundary
before any new implementation or provider mutation. WP-2.9A remains blocked;
fresh Pass B and Pass C cannot begin.
