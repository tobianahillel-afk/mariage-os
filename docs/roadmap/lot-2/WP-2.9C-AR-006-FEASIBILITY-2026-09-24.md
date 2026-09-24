# WP-2.9C / AR-006 — Workers Free CPU feasibility after the failed campaign

Status: **READ-ONLY ARCHITECTURE REVIEW — WP-2.9C REMAINS BLOCKED**

This note evaluates whether the exact `25,000,000`-byte trusted PDF contract can
realistically remain on Workers Free. It does not authorize a provider campaign,
token change, production implementation, Paid plan, or smaller PDF limit. The
current provider result and stop condition are in
`WP-2.9C-AR-006-PROVIDER-ATTEMPT-2026-09-24.md`.

## What the evidence establishes

The current private Worker performs bounded Storage downloads and actual-byte
SHA-256 verification of both staged and canonical objects. The single
authorized campaign observed eight successful invocations at 237–273 ms CPU
and two `exceededCpu` outcomes. All successful invocations exceeded the normal
10 ms Workers Free CPU budget by more than 20 times. The provider event is for
the whole invocation; it does not apportion CPU among downloads, copies,
cryptography, Supabase client work and JSON processing.

A local Windows/Node directional microbenchmark on 25,000,000 bytes measured
approximately 20–24 ms for one `crypto.subtle.digest("SHA-256", ...)` after
warm-up, plus approximately 4–6 ms to copy the input buffer. Those figures
are **not** Cloudflare CPU measurements and cannot establish the deployed
acceptance result. They do make a one-request buffer-only patch an implausible
answer to a greater-than-20-fold provider overrun.

## Candidate assessment

### Stream the current single invocation

Cloudflare provides `crypto.DigestStream("SHA-256")`, avoiding full-file
materialization for hashing. This may reduce memory and copying, but still
performs the complete 25 MB digest inside one 10 ms invocation, with
authorization and Storage work. It has no provider CPU proof and is not an
approved AR-006 remedy on its own.

### Move the heavy work to Supabase Edge Functions

Supabase documents a 2 s CPU allowance per Edge Function request, which is
larger than the CPU observed for the current Cloudflare Worker. However ADR
0010 rejected a second publicly reachable Supabase promotion origin because
it bypasses the bodyless Pages ingress and its open-ended-body protection.
Placing a secret check in a new Edge handler does not itself prove that the
gateway rejects an open-ended attacker request before waiting for EOF.
This route cannot be adopted by treating Cloudflare ingress CPU alone as proof
that the trusted 25 MB promotion runs within Workers Free. It would require a
separate security and acceptance-contract decision.

### Split trusted SHA-256 across independent Workers Free requests

This is a **plausible but unproven** Free-plan direction. Supabase documents
`GetObject` byte `Range` and `If-Match` on its S3-compatible surface.
`hash-wasm` documents resumable SHA-256 state through `save()` and `load()`.
Together they could let server-owned progress process a bounded byte range
per request without accepting a browser-supplied offset or trusting a browser
digest. For illustration, 512 KiB chunks need 48 reads for one 25,000,000-byte
object, or 96 reads to verify both staged and canonical objects. Ten proof
flows would require at least 960 chunk invocations plus control requests;
that arithmetic is below Cloudflare's published 100,000-requests/day Free
allowance, but is **not** a measured CPU or product-throughput result.

The design must specify and review all of the following before implementation:

1. a server-owned progress record bound to one reservation, bucket, exact path,
   object version/ETag, expected size and hash, with a short expiry;
2. authenticated, bodyless step requests with server-derived next byte range,
   bounded response and exact `Content-Range`/length checks;
3. atomic compare-and-set of offset and serialized hash state so duplicate,
   concurrent, stale and reordered steps cannot skip or repeat bytes;
4. live `documents.write` and unchanged reservation checks at the required
   privileged boundaries, including immediately before canonical copy and
   attestation; role revocation must never create ready truth;
5. staged and canonical actual-byte proof, exact `%PDF-`/MIME/size checks,
   no-overwrite copy, safe retry/compensation and server cleanup;
6. a pinned and security-reviewed incremental SHA-256 dependency, with test
   vectors, checkpoint corruption tests and cross-runtime resume tests;
7. abuse limits, abandoned-progress cleanup, credential scope and deployment
   configuration without private bytes or hash state in client-visible logs;
8. a revised AR-006 evidence protocol that proves at least ten complete
   exact-size promotion **flows**, with attributable provider CPU at or below
   10 ms for **every** trusted compute step and no `exceededCpu` outcome.

The existing one-invocation evidence contract cannot simply be relabeled as a
pass for a multi-request protocol. A new explicit ADR and adversarial security
review must decide those semantics before any new evidence campaign or state
transition. The Range/authentication path and per-step CPU must then be
verified in the isolated environment; documentation and local benchmarks are
insufficient.

## Feasibility verdict and next gate

Preserving the 25 MB file contract on Workers Free appears technically
**realistic only as a substantial, stateful redesign**, not as a quick
correction of the current SHA-256 call or an Observability parser change.
The strongest candidate is bounded multi-request hashing, but it remains
unproven and may fail CPU, Storage-range, cost/abuse or security review.
WP-2.9C and FTR-089 stay **BLOCKED**; AR-006 stays open. The next permitted
action is to specify a complete ADR for that candidate and its security and
evidence gates. No credential cleanup is part of this CPU investigation.

## Current provider and library references

- <https://developers.cloudflare.com/workers/platform/limits/>
- <https://developers.cloudflare.com/workers/runtime-apis/web-crypto/>
- <https://supabase.com/docs/guides/storage/s3/compatibility>
- <https://supabase.com/docs/guides/storage/s3/authentication>
- <https://supabase.com/docs/guides/functions/limits>
- <https://github.com/Daninet/hash-wasm/blob/master/README.md>
