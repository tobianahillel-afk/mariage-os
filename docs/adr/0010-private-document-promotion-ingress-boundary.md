# ADR 0010 — Private-document promotion ingress termination boundary

- Status: Proposed
- Date: 2026-09-15
- Owner: WP-2.9C / FTR-089
- Related: ADR 0001, ADR 0008, ADR 0009

## Context

ADR 0009 moved private PDF bytes out of the Supabase Edge Function request body and into the bounded private `document-ingest-staging` Storage bucket. The browser now stages a PDF under Storage's exact 25,000,000-byte and `application/pdf` limits, and the Edge Function receives only project/document identifiers before verifying and promoting the staged object.

That architecture closes the original raw-binary integrity/resource defects, but ADR 0009 also requires the public promotion endpoint to reject any framed/request body before consuming it and without depending on sender EOF. This is required by `SEC-FILE-004`, `SEC-ABUSE-001` and `WP29C-AR-001`.

Real local-runtime evidence now proves that the current Supabase request path does not expose the request to application code early enough to satisfy that requirement:

- direct Edge Runtime evidence: CI `34973827681` — the bodyless promotion flow and all other remediation checks pass, but an intentionally open-ended framed request does not receive rejection before sender EOF;
- public Supabase gateway evidence: CI `34974264827` and exact-head CI `34975265838` — the same open-ended sender still waits for EOF when targeting `/functions/v1/private-document-ingest` through the public local gateway;
- exact-head `a8ee1db32bfa41b40d4fcd5dd841146f97676881` / CI `34975265838`: Core quality/security PASS, browser/mutation PASS, preview PASS, DB/RLS `80` files / `1382` tests PASS, and all Edge staging/promotion/auth/recovery/CORS/25 MB scenarios PASS except `WP29C-AR-001`.

The handler itself no longer reads untrusted request bytes. It rejects `transfer-encoding` or non-zero/invalid `content-length` before any application body read, but the request is not dispatched to that handler early enough for the rejection to terminate an open-ended sender.

Current Supabase hosted Edge Function documentation lists runtime limits such as a 150-second request idle timeout, memory and CPU limits, but does not publish a maximum inbound request-body size that can be used as an EOF-independent ingress security bound:

- <https://supabase.com/docs/guides/functions/limits>
- <https://supabase.com/docs/guides/functions>

A timeout is a finite outer failure mode, but it does not satisfy the frozen contract that arbitrary post-limit ingress work must not depend on sender EOF.

## Stop condition

This is an architecture/security dependency, not an implementation defect that can be safely patched inside the current Edge handler.

Under `AI-LOT-ORCHESTRATION.md`, WP-2.9C must therefore remain blocked until an architecture capable of terminating/rejecting the request before arbitrary body drain is explicitly accepted and verified.

No option below is accepted by this ADR yet.

## Non-solutions already disproved

The following do **not** close `WP29C-AR-001`:

- `request.arrayBuffer()` or any full request buffering;
- bounded retained-memory streaming followed by draining to EOF;
- `ReadableStream.cancel()`/reader cancellation inside the user worker when the platform has not dispatched the request early enough;
- checking `Content-Length` while accepting chunked/open-ended framing;
- relying on normal browser behavior to keep the request body empty;
- relying on the 150-second request idle timeout;
- deleting or weakening the open-ended sender test;
- shrinking the 25 MB PDF product limit, because the promotion endpoint is bodyless and the abuse exists independently of the staged file size.

## Candidate architecture A — provider/gateway hard ingress policy

Use a Supabase/provider gateway control only if the platform exposes a documented and enforceable rule that rejects framed/non-empty promotion requests before arbitrary body consumption or dispatch.

Required proof:

- the rule applies to the public production function route, not only application code;
- it is configured/deployed as code or otherwise durably controlled;
- a sender can remain open after beginning a framed request and receives deterministic rejection without EOF;
- direct route bypass is impossible;
- the rule is available on the intended free-tier deployment and has a local/CI verification strategy or an explicitly approved production-only verification exception.

No such documented request-body limit/control has been identified as of 2026-09-15.

## Candidate architecture B — non-browser promotion trigger

Remove the browser-reachable arbitrary HTTP promotion request from the trust boundary. A server-owned event/queue/database/storage-triggered mechanism could promote a newly staged object without accepting an attacker-controlled streaming HTTP body for the promotion step.

Required investigation/proof:

- the trigger is generated from authoritative staging/reservation state rather than caller-controlled identity;
- current-user authorization semantics remain correct for the staging operation and finalization;
- revocation/race behavior remains fail-closed;
- retries are idempotent;
- no new public endpoint recreates the same ingress problem;
- the mechanism is supported by the frozen Supabase/zero-cost operating constraints.

This is a material flow change and requires a superseding/accepted ADR before implementation.

## Candidate architecture C — external upstream request guard

Introduce an upstream component capable of rejecting framed/non-empty requests before forwarding a strictly bodyless promotion call.

A narrow Cloudflare Worker/Pages Function is one possible technology, but ADR 0001 currently freezes Cloudflare Pages as static hosting and explicitly rejected a custom Cloudflare backend as unnecessary maintenance. Therefore this option is an architecture widening, not a routine implementation detail.

It is also insufficient unless the direct Supabase function origin cannot be used to bypass the guard. Any accepted version must prove that an authenticated attacker cannot send the same open-ended request directly to the Supabase route and consume the protected runtime/gateway resource.

Required proof:

- direct-origin bypass is closed at a layer that acts before body drain;
- no service secret is exposed to the browser;
- JWT/project authorization remains end-to-end;
- the guard is deployment-managed and covered by adversarial runtime evidence;
- operating-cost and maintenance consequences are reconciled with ADR 0001.

## Decision required

Choose and accept a termination boundary that can actually act before arbitrary request-body drain. Until then:

- WP-2.9C is `BLOCKED`;
- `WP29C-AR-001` remains **MAJOR / OPEN / ARCHITECTURE BLOCKER**;
- AR-002, AR-003 and AR-004 remediation remains implemented and runtime-green but does not make the packet acceptable;
- WP-2.9A remains blocked waiting for WP-2.9C acceptance;
- WP-2.9B remains inactive;
- Pass B/Pass C advancement is forbidden.

## Acceptance criteria for a later decision

A superseding or accepted revision must provide all of the following before WP-2.9C returns to `IN_PROGRESS`:

1. a named ingress-termination layer with an enforceable deployment contract;
2. a real-runtime adversarial test that keeps a framed sender open and receives rejection without sender EOF;
3. explicit direct-origin/bypass coverage;
4. no client-visible service credentials;
5. preservation of the ADR-0009 staging bucket limits and exact 25,000,000-byte successful PDF path;
6. preservation of live `documents.write` authorization, canonical exact-byte proof, service-only attestation and independent finalization;
7. updated ADR/packet/security/deployment documentation and clean exact-head CI before fresh Pass B.
