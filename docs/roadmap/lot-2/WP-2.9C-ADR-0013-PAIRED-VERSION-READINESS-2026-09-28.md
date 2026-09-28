# WP-2.9C / ADR 0013 — paired-version marker readiness

State: **PROVIDER ATTEMPT FAILED CLOSED; TARGETED REMEDIATION IMPLEMENTED;
EXACT-HEAD CI AND REVIEW PENDING**.

## Failed isolated campaign

The single campaign authorized by the AR-009 review seal
`0cffaf2dbf2b351d31a4c22830ebd236d2f9b7c2` (CI `36399469688`,
5/5 success) ran on its same-tree trigger
`9822ba73fe328839df1a76e515e399e2d20a4287` (CI `36400324210`).
All five ordinary jobs passed. Isolated provider job `108859090242` **failed**
at the non-mutating marker preflight. Artifact `10960925487`, ZIP SHA-256
`891667aebb9be726fa9a0a963d02772e5ff930ba67a069ed8059580c40d8bf73`,
records `pass:false`, `failureStage:"marker_preflight"`, zero completed
invocations, zero PDF hashes and no document creation, upload, promotion or
finalization. The ten-distinct-PDF AR-006 acceptance gap is still open.

Both structured Observability queries completed with HTTP 200. The final
marker round observed exactly two markers and two provider invocations, but
neither could be attributed to the newly deployed exact script version. The
only two discovery failures were `invalid_provider_invocation`, one on each
surface, each with the sole reason `script_version_mismatch`:

| Surface                       | Exact deployed version                 | Marker-observed version                |
| ----------------------------- | -------------------------------------- | -------------------------------------- |
| Workers Static Assets ingress | `a076779a-bed9-4186-b806-48d48f13801d` | `b0d82906-cf10-4a45-9c12-85acda18a52d` |
| Private Durable Object host   | `01783362-b589-4ea4-83e5-8f8fd5baced9` | `15419161-360c-435a-9b14-34c0a2691525` |

The marker's observed ingress/DO CPU was 1/12 ms and both outcomes were `ok`;
these values are **marker diagnostics only**, not ten-flow acceptance CPU
measurements. A subsequent read-only Cloudflare deployment inventory reported
each newly deployed version at 100% and the observed versions as previous
deployments. This is compatible with a serving-version transition, but the
inventory does not establish Cloudflare's internal cause or prove the exact
serving state at marker time. Cloudflare's
[Versions and deployments](https://developers.cloudflare.com/workers/versions-and-deployments/)
documents that deployment controls which version receives traffic; the
provider marker remains the authoritative observation for this attempt.

## Narrow correction and safety boundary

The previous reviewed readiness rule retried a new marker only when ingress
alone had a version-only mismatch and the Durable Object was already exactly
attributed. This newly observed **paired** shape returned `blocked`. A
RED-first test reproduced that classification. The corrected classifier
allows `retry_marker` also when both complete queries show exactly two
markers, zero attributed invocations and exactly two version-only failures,
one for each named surface. A missing/incomplete query waits for persisted
logs within the existing query bound. Any extra failure, duplicate marker,
CPU/outcome/status mismatch, unexpected surface, or single wrong DO version
still blocks.

The unchanged harness makes at most three distinct, bodyless, authenticated
marker probes, 20 seconds apart; each expects HTTP 409 and never reserves or
uploads a document. A final marker must attribute both exact deployed
versions with complete queries before `createExactPdf` or any 25 MB mutation.
The sanitized receipt now retains both observed version IDs for prior
version-skew rounds. It never retains provider credentials or document bytes.
Production ingress/DO runtime, Supabase, GitHub secrets and token permissions
are unchanged. No provider rerun is authorized by this implementation alone.

Focused tests, application/Node TypeScript, ESLint and Prettier passed locally.
Next: commit this evidence and correction, require five ordinary exact-head
CI jobs including clean checkout, perform a fresh targeted adversarial review
of the paired retry boundary, then seal a single new campaign authorization
only if that review passes. A red campaign returns to review; WP-2.9C stays
`IN_PROGRESS / REMEDIATION`, WP-2.9A remains `BLOCKED`, and Pass C is forbidden.
