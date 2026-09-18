# WP-2.9C / WP29C-AR-006 — private Worker telemetry requery

Status: **AUTHORIZED READ-ONLY EVIDENCE FOLLOW-UP — DOES NOT CLOSE AR-006 BY ITSELF**

Related packet: `WP-2.9C`

Related finding: `WP29C-AR-006`

Related architecture: `ADR 0011 — Private-document promotion Worker execution and CPU evidence`

Related runbook: `WP-2.9C-AR-006-RUNBOOK.md`

## Source attempt

The source artifact is the failed-closed Worker evidence run at exact commit
`bdb3d95cc788d4b43205fe9c0e109966f72c7798`:

- workflow `35286381507`, final provider job `105421188996`;
- isolated Pages preview deployment
  `25e6f215-b57b-4a7b-b712-061232414c91`;
- private Worker `mariage-os-private-document-promotion`;
- sanitized artifact `10525006138`, ZIP SHA-256
  `42ce5db8d9b8d046bbfada9b34494bfa93d0b6c58e21adef8a4cf3adead3e25f`.

That artifact records ten sequential, synthetic exact `25,000,000`-byte PDF
promotions. Every promotion returned HTTP `200` and `success: true`. The sixth
Workers Observability REST query returned HTTP `429`, provider code `10429`.
The earlier five queries did not yet yield the required UUID-correlated
markers. Thus the failed run contains no acceptable CPU measurement and does
not establish either CPU compliance or provider-event absence.

Cloudflare documents `Retry-After` for REST API rate limits and says callers
must wait before retrying. The returned rate-limit response is a transient
provider condition, not a reason to repeat the ten application mutations.

## 2026-09-18 authentication recovery

The first execution of this requery support at
`2ef0e13b755ffc609972ac83c1d2260ca73ff8de` / workflow `35337938664`
completed the five normal repository jobs successfully, including clean-checkout
`full-verify`. Its isolated read-only requery job `105579141917` then wrote
sanitized artifact `10544340701` (ZIP SHA-256
`d048098fa251b409ca8545fcda4d9e72c50cd76ebb3810d1b290e88be0bb0424`).

All three provider queries returned HTTP `401` with provider code `10000`; the
artifact retained zero measurements and `pass: false`. This is a credential or
provider-authentication failure before event retrieval. It establishes neither
CPU compliance nor absence of Worker telemetry. The job made no deployment,
configuration, Supabase or application-data mutation.

The prior observability credential had no demonstrated successful use. A new
dedicated Cloudflare account token scoped only to Workers Observability telemetry
write was created with one-year expiry and saved only as the encrypted
`AR006_CLOUDFLARE_OBSERVABILITY_TOKEN` Environment secret. Its value is not
retained in the repository or in any artifact.

One recovery execution is authorized after `full-verify`: it repeats exactly the
same retained-source query with the corrected secret and the same marker. It
must not deploy, reconfigure, authenticate to Supabase or repeat a promotion.


## Authorized action

The `AR-006 private Worker telemetry requery` job in `.github/workflows/ci.yml`
runs only when a branch push has the exact marker:

```text
[AR006-WORKER-REQUERY]
```

It depends on `full-verify` in the same CI run. It receives only the isolated
Cloudflare account identifier, Workers Free attestation and the dedicated
`AR006_CLOUDFLARE_OBSERVABILITY_TOKEN`. It never receives a deployment token,
Supabase credential, browser bearer or `PRIVATE_DOCUMENT_ADMIN_KEY`.

The script `run-private-document-ar006-worker-requery.mjs` queries the retained
Worker logs from the source promotion start through the requery time. It uses
the ten opaque source UUIDs only to join one Worker JSON marker to one
`cf-worker-event` by provider request ID. It respects a numeric `Retry-After`
on HTTP `429`, writes a sanitized result, and fails closed for every other
missing, duplicate, non-200, non-numeric, over-budget or CPU-limit condition.

The job does **not** deploy Pages or the Worker, authenticate to Supabase,
reserve/finalize a document, upload a PDF, call the promotion route, change
Cloudflare configuration, enable Paid compute or alter the `25,000,000`-byte
contract.

## Result handling

A passing requery is valid only when it records exactly ten source-correlated
HTTP-200 Worker invocations, each with numeric provider `cpuTimeMs <= 10` and
no CPU-limit outcome. It remains evidence input rather than packet acceptance:
inspect the artifact, reconcile the source run and exact CI, update the AR-006
record, then run the required fresh Pass B and Pass C.

The initial execution documented above returned an authentication failure before
event retrieval. The one authorized recovery execution may correct only the
dedicated encrypted credential and re-run this identical read-only source query.
If that recovery returns an authentication or provider-query error, no
attributable numeric CPU, a rate-limit error after bounded backoff, duplicate
correlation or an over-budget value, AR-006 remains open. Do not rerun the ten
promotions automatically; return to the architecture review under the runbook.

## Provider references

- <https://developers.cloudflare.com/fundamentals/api/reference/limits/>
- <https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/methods/query/>
