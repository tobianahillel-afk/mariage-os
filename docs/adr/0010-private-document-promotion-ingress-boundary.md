# ADR 0010 — Private-document promotion ingress termination boundary

- Status: Accepted
- Date: 2026-09-15
- Owner: WP-2.9C / FTR-089
- Related: ADR 0001, ADR 0008, ADR 0009

## Context

ADR 0009 moved private PDF bytes out of the Supabase Edge Function request body and into the bounded private `document-ingest-staging` Storage bucket. The browser stages a PDF under Storage's exact `25,000,000`-byte and `application/pdf` limits, while trusted code verifies and promotes the staged object before finalization.

ADR 0009 also requires the promotion ingress boundary to reject any framed/non-empty request without consuming arbitrary attacker-controlled body bytes and without depending on sender EOF. This is required by `SEC-FILE-004`, `SEC-ABUSE-001` and `WP29C-AR-001`.

Real runtime evidence proved that the current Supabase Edge request path cannot satisfy that boundary:

- direct local Edge Runtime evidence: CI `34973827681`;
- public local Supabase gateway evidence: CI `34974264827`;
- exact implementation evidence `a8ee1db32bfa41b40d4fcd5dd841146f97676881` / CI `34975265838`;
- blocked-state evidence `52572b24bba83a2aadb22c80f2764c92875219f1` / CI `34975858942`.

In all cases the ADR-0009 staging/auth/recovery/CORS/25 MB controls pass, but an intentionally open-ended framed promotion request waits for sender EOF before application code can terminate it.

The handler itself does not need the request body. The defect exists earlier in the Supabase request pipeline: dispatch to user Edge code happens too late to make a bodyless application handler the ingress-termination layer.

Current Supabase documentation exposes runtime limits and an idle timeout but does not expose a documented inbound request-body rule that can serve as the required EOF-independent security boundary. Supabase S3 compatibility also does not provide a replacement trusted SHA-256 path for this packet: `PutObject` does not support `Content-MD5`, and S3 checksum controls required for a provider-only SHA-256 proof are not implemented on the relevant upload/copy surface.

## Decision

Replace the browser-reachable Supabase Edge promotion endpoint with **one narrow same-origin Cloudflare Pages Function**:

```text
POST /api/private-document-promote
```

The Pages Function is the trusted promotion implementation. It is **not** a proxy in front of the existing Supabase Edge Function.

The Supabase `private-document-ingest` Edge Function must be removed from the deployable repository/configuration. There must be no alternate browser-reachable Supabase promotion route that can bypass the Cloudflare ingress boundary.

The frozen file flow becomes:

```text
browser local validation/hash
→ reserve pending document metadata in Supabase
→ authenticated browser upload to bounded private Supabase staging bucket
→ same-origin bodyless POST to Cloudflare Pages Function
→ Pages Function verifies current Supabase user/JWT
→ live project/document authorization
→ authoritative staging metadata inspection
→ bounded staged-object read + PDF signature + exact size/SHA-256 proof
→ privileged no-overwrite copy to canonical project-private
→ service-only ingest attestation
→ server staging cleanup
→ browser performs independently authorized finalize pending → ready
```

ADR 0009 remains authoritative for staging, byte-integrity, attestation, cleanup and finalization semantics. ADR 0010 changes only the trusted compute/HTTP ingress location used for promotion.

## Why Pages Functions

Mariage OS already targets Cloudflare Pages for the application deployment. Pages Functions run on the Cloudflare Workers runtime and can add a narrow server route to that same deployment without operating a separate VPS or general-purpose backend.

This is a deliberately narrow amendment to ADR 0001, not adoption of a general Cloudflare backend:

- the PWA/static application remains a Cloudflare Pages application;
- PostgreSQL/Auth/Storage/Realtime remain Supabase-managed;
- only the security-sensitive private-document promotion boundary moves to Pages Functions;
- no D1/R2/KV application datastore is introduced;
- no generic API layer is introduced;
- no product feature is moved out of Supabase unless a later ADR explicitly decides so.

Pages Functions use the Workers runtime. Current Cloudflare Free limits include `100,000` Worker/Pages Function requests per day, `128 MB` memory and a `100 MB` request-body outer limit for Free-zone requests. The packet must still prove its stricter bodyless contract itself; the `100 MB` platform maximum is defense in depth, not the acceptance condition.

## Ingress contract

The Pages Function must reject request framing before reading `request.body`:

- only `POST` is accepted for promotion;
- `Transfer-Encoding` is rejected;
- `Content-Length` must be absent or exactly `0`;
- any non-zero, malformed or ambiguous framing is rejected;
- the handler never calls `arrayBuffer()`, `text()`, `json()`, `formData()` or otherwise consumes the inbound promotion body;
- the project/document target remains in bounded headers or an equivalently bounded non-body representation;
- real Workers/Pages runtime evidence must hold a chunked sender open and receive rejection without sender EOF.

A synthetic unit test alone is insufficient.

## Direct-origin / bypass contract

The old Supabase Edge route is removed rather than hidden behind Cloudflare.

Acceptance must prove:

- `supabase/functions/private-document-ingest` is not deployable after the migration;
- `supabase/config.toml` contains no enabled promotion Edge Function entry;
- application code no longer invokes `supabase.functions.invoke("private-document-ingest", ...)`;
- local/runtime tests treat the old Supabase function route as absent/not usable;
- production deployment documentation does not deploy the removed Edge Function;
- no second public promotion implementation exists.

This is what closes candidate-C's direct-origin bypass problem.

## Authentication and authorization

The browser sends its current Supabase user access token in `Authorization: Bearer <token>` to the same-origin Pages Function.

The Pages Function must:

1. reject missing/malformed authorization generically;
2. verify the current user against Supabase Auth using the user token, never caller-supplied user identity;
3. use a user-scoped Supabase client/RLS path for live project/document authorization;
4. require `documents.write` before authoritative reservation use;
5. re-check `documents.write` immediately before the first privileged canonical mutation;
6. preserve independent authorization in the existing DB finalization transition.

A later revocation must never create `ready` truth without the independently authorized finalization step.

## Trusted server credentials

The Pages Function may use a Supabase server/service credential only after caller authentication and authoritative target-state validation.

Required Cloudflare bindings/secrets:

- `SUPABASE_URL` — server configuration;
- a non-secret Supabase browser/publishable/anon key as required to verify/use the caller's user token;
- `SUPABASE_SERVICE_ROLE_KEY` (or current server-secret equivalent) — Cloudflare secret, never static asset, Git value, response or log field.

CI/local development may derive synthetic local Supabase credentials from `supabase status`; production credentials must never enter GitHub artifacts or repository history.

## Trusted byte proof

The Pages Function preserves ADR-0009 proof strength:

- derive staging/canonical paths from authoritative reservation state;
- require pending, active, ordinary-private, non-remote, non-deleted state;
- inspect authoritative staging metadata before materializing bytes;
- require stored MIME exactly `application/pdf`;
- require exact reserved size and `1..25,000,000` bytes;
- bounded-read the staged object;
- validate `%PDF-`;
- compute SHA-256 over actual staged bytes;
- require exact reserved digest and size;
- copy to canonical storage without overwrite;
- if canonical already exists, use authoritative metadata first and then bounded signature/size/SHA-256 verification before treating it as trusted;
- attest only after trusted canonical proof;
- clean staging server-side after success and safely after invalid staging where appropriate.

The browser remains unable to create canonical Document objects directly.

## CORS / origin behavior

Because the Pages Function is deployed with the application, normal browser invocation is same-origin.

The promotion route must not emit wildcard CORS. The preferred default is no cross-origin allowance at all. Authorization must remain JWT/permission based rather than treating `Origin` as an authorization control.

Preview deployments remain same-origin with their own Pages Function route.

## Zero-cost and runtime feasibility

This ADR does **not** authorize a paid Cloudflare dependency or automatic paid upgrade.

Before WP-2.9C can be accepted, real-runtime evidence must prove:

- exact `25,000,000`-byte staged PDF promotion remains feasible within the intended Cloudflare Pages Functions / Workers Free operating envelope;
- no implementation buffers the inbound promotion request;
- trusted staged/canonical materialization stays below the `128 MB` Worker memory limit;
- SHA-256 and authorization work is viable without relying on a paid CPU entitlement;
- if the Free runtime cannot safely support the exact 25 MB proof, WP-2.9C returns to `BLOCKED` and architecture is revisited rather than silently enabling Workers Paid or lowering the PDF limit.

Cloudflare's Free Worker CPU limit is currently `10 ms` per HTTP request with some platform flexibility; this is therefore an explicit feasibility gate, not an assumption.

## CI / runtime proof

WP-2.9C must add a real Pages/Workers runtime harness, not only direct handler unit tests.

At minimum it must prove:

- a normal bodyless promotion reaches the function;
- an intentionally open-ended `Transfer-Encoding: chunked` request is rejected promptly before EOF;
- a non-zero `Content-Length` request is rejected before body consumption;
- missing/malformed JWT denied;
- viewer/outsider/revoked/project substitution denied;
- direct canonical authenticated Document upload remains denied;
- exact staged-byte promotion succeeds;
- wrong staging MIME, size mismatch, SHA mismatch and bad PDF signature fail closed;
- poisoned existing canonical object fails closed;
- exact canonical replay is idempotent;
- finalization reauthorizes after promotion;
- exact `25,000,000` bytes succeeds;
- old Supabase promotion route is absent/not used;
- service credentials are absent from logs/static artifacts.

The harness should run against local Supabase plus a real local Cloudflare Workers/Pages runtime such as Wrangler/workerd.

## Deployment consequences

Cloudflare deployment is no longer purely static: the Pages project contains one narrow Function route.

Release/deployment documentation must therefore ensure:

- Pages Functions are deployed with the static application;
- required server bindings/secrets are configured outside Git;
- `/api/private-document-promote` is security-critical and must fail closed rather than bypassing to an unprotected origin;
- static asset behavior remains unchanged;
- preview artifacts/configuration contain only synthetic/non-production values;
- the removed Supabase Edge Function is not redeployed by legacy scripts.

## Alternatives rejected

### A — rely on Supabase gateway/body limit

Rejected because no documented/configurable EOF-independent rule satisfying this packet was found, and the real local public gateway reproduces AR-001.

### B — database/storage webhook to the same Supabase Edge Function

Rejected because triggering the call server-side does not remove the browser-reachable Edge Function origin. An authenticated attacker could still target that route directly and reproduce the ingress abuse.

### B2 — replace SHA-256 proof with Supabase Storage/S3 metadata

Rejected. Supabase Storage metadata/ETag is useful for provider metadata, but the frozen FTR-089 contract requires exact SHA-256 byte binding. Current Supabase S3 compatibility does not expose the needed checksum upload/copy guarantees on the relevant surface, and `Content-MD5` is not a substitute for the frozen SHA-256 contract.

### C1 — Cloudflare only as a proxy in front of Supabase Edge

Rejected because the direct Supabase function URL would remain a bypass.

### C2 — general custom Cloudflare backend

Rejected as unnecessary. Only the narrow promotion function is authorized.

## Consequences

Positive:

- closes the architecture cause of `WP29C-AR-001` if the runtime RED becomes green;
- removes direct Supabase promotion-origin bypass by deleting that public function;
- keeps file upload on bounded Supabase Storage rather than sending PDF bytes through Cloudflare ingress;
- preserves Supabase Auth/RLS/Storage/Postgres as the core backend;
- same-origin browser call removes the need for permissive CORS;
- reuses the already-chosen Cloudflare Pages deployment and Free-plan request allowance.

Tradeoffs:

- Pages deployment now includes one server-side Function;
- one additional production secret must be configured in Cloudflare;
- local/CI tooling must include Wrangler/workerd runtime evidence;
- Free-plan CPU feasibility for the exact 25 MB trusted hash/read path must be proven rather than assumed;
- provider coupling increases slightly at this one security boundary.

## Supersession / amendment

- ADR 0008 remains authoritative for trusted byte integrity, authorization, attestation and finalization intent.
- ADR 0009 remains authoritative for bounded staging and bodyless promotion semantics.
- ADR 0010 supersedes the **Supabase Edge Function compute location** for promotion and moves that trusted compute to Cloudflare Pages Functions.
- ADR 0001 is amended narrowly: Cloudflare Pages remains the application host, with one approved Pages Function security boundary; the rejection of a general custom Cloudflare backend remains in force.

## Unblock condition

ADR 0010 is accepted, so WP-2.9C may transition:

```text
BLOCKED
→ IN_PROGRESS / A-IMPLEMENT — RED FIRST
```

The existing AR-001 runtime failure remains the required RED until the Pages Function boundary is implemented and proven. Pass B and Pass C remain forbidden until implementation is exact-head verified and a later complete fresh Pass B is clean.
