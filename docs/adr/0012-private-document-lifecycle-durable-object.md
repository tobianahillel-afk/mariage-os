# ADR 0012 — Private-document lifecycle Durable Object

- Status: Accepted
- Date: 2026-09-24
- Owner: WP-2.9C / FTR-089
- Related: ADR 0008, ADR 0009, ADR 0010, ADR 0011

## Context

ADR 0011 moved trusted private-document promotion behind the same-origin Pages
ingress into a private Service-Bound Worker. The bounded provider campaign on
2026-09-24 proved that architecture functionally but failed the frozen Workers
Free CPU condition: eight successful exact-`25,000,000`-byte invocations used
237–273 ms of provider CPU and two additional invocations ended
`exceededCpu`. A stateless Workers Free HTTP invocation has a normal 10 ms CPU
budget, so parser or correlation fixes cannot make the current execution model
acceptable.

Cloudflare Durable Objects are available on Workers Free with the SQLite
storage backend. Cloudflare currently documents a 30-second default CPU budget
per Durable Object request, direct Pages Function Durable Object bindings,
private binding-only invocation, provider observability fields including
`$workers.cpuTimeMs`, `$workers.executionModel` and
`$workers.durableObjectId`, and no separate Durable Object API-token
permission beyond access to the implementing Worker.

The existing trusted promotion already has the correct product semantics:
current-user authentication, live `documents.write`, exact reservation
binding, authoritative Storage metadata, actual-byte PDF/size/SHA-256 proof,
no-overwrite canonical copy, attestation, cleanup, compensation and independent
finalization. The architecture problem is compute placement, not a reason to
weaken those semantics.

The existing trusted abandon path is also safety-critical. Promotion and abandon
must not become independent privileged writers merely because promotion moves to
a different compute primitive.

## Decision

Use one private SQLite-backed Durable Object instance per
`(project_id, document_id)` lifecycle as the trusted promotion/abandon
coordinator.

```text
browser
  -> same-origin bodyless Pages Function
  -> PRIVATE_DOCUMENT_LIFECYCLE Durable Object binding
  -> Supabase Auth / RLS / Storage / PostgreSQL
```

The Durable Object class is exported by the existing
`mariage-os-private-document-promotion` Worker deployment, but that Worker has
no browser route and `workers_dev: false`. Pages binds directly to the Durable
Object namespace; the ADR-0011 HTTP Service Binding is removed after the new
path is verified.

### Pages responsibilities

Pages remains the only browser-reachable trusted route:

```text
POST   /api/private-document-promote
DELETE /api/private-document-promote
```

Before invoking the Durable Object, Pages must:

- enforce same-origin behavior;
- reject unsupported methods;
- reject `Transfer-Encoding`;
- require absent or exactly-zero `Content-Length`;
- never consume the request body;
- validate bounded UUID project/document targets;
- validate the DELETE operation UUID when applicable;
- require syntactically valid bearer framing;
- fail closed when the Durable Object binding is absent or invocation fails.

Pages does not authenticate the user against Supabase and does not perform
privileged Storage/database work. Those checks remain inside the trusted
lifecycle executor so a direct binding call cannot replace authorization.

After migration, Pages no longer needs `PRIVATE_DOCUMENT_ADMIN_KEY` for this
route. The privileged Supabase credential remains only on the Durable Object
host Worker.

### Durable Object identity and isolation

Pages derives the Durable Object using a server-controlled deterministic name
from the already validated UUID pair:

```text
private-document:<project_id>:<document_id>
```

The browser never supplies a Durable Object ID or namespace identifier.

One object coordinates only one document lifecycle. This preserves project
isolation and avoids a global singleton/chokepoint.

### Promotion and abandon execution

The Durable Object dispatches:

- `POST` to the existing trusted promotion implementation;
- `DELETE` to the existing trusted abandon implementation.

Both handlers still repeat all authentication, live permission, reservation and
domain checks. The Durable Object binding is a coordination/compute boundary,
not an authorization primitive.

Requests for one document must execute through an explicit per-instance
serialization gate because Durable Object requests may otherwise interleave
while awaiting non-storage I/O. The implementation must not assume
single-threaded JavaScript alone prevents races across Supabase/Storage
`fetch()` waits.

The serialization mechanism must:

- queue only requests targeting that single Durable Object/document;
- release after success or failure;
- never retain bearer tokens, PDF bytes or credentials in persistent storage;
- preserve idempotent retry/recovery behavior after process restart or failed
  invocation;
- be covered by concurrent promotion/abandon tests.

The existing authoritative re-checks and compensation remain mandatory even
with serialization. Serialization is defense in depth, not permission to remove
server-side state validation.

### Durable Object storage

The class uses the SQLite backend because Workers Free supports only
SQLite-backed Durable Objects.

No product document bytes, bearer tokens, Supabase service credentials or raw
provider logs are stored in Durable Object storage. The initial implementation
does not require persistent application state; the SQLite namespace exists for
the Durable Object execution model and future bounded coordination metadata only
if a reviewed remediation later needs it.

### CPU and zero-cost acceptance

The old ADR-0011 requirement that the heavy promotion itself fit the stateless
10 ms Workers Free HTTP budget is superseded for the Durable Object execution
step.

Acceptance now requires deployed Workers Free evidence proving, for ten complete
exact-`25,000,000`-byte synthetic promotion flows:

1. the Pages ingress invocation remains within the stateless Workers Free CPU
   envelope and has no CPU-limit outcome;
2. the Durable Object invocation is provider-classified as
   `executionModel=durableObject`;
3. every Durable Object promotion invocation has a numeric provider
   `$workers.cpuTimeMs`, no `exceededCpu` outcome and remains below the
   provider's Durable Object Free CPU limit;
4. all ten promotions succeed functionally and retain the exact 25 MB contract;
5. no Workers Paid entitlement is enabled or relied upon;
6. Free Durable Object request/duration/storage quotas remain comfortably above
   the controlled evidence load;
7. evidence is tied to the exact commit/deployment and synthetic document set.

A repository guard may set a substantially lower internal regression budget
than the provider's 30-second maximum after the first successful provider
measurements, but it must not invent a budget before measurements exist.

### Provider observability

Workers Observability remains the evidence channel.

The final evaluator must distinguish stateless Pages events from Durable Object
events and may correlate the Durable Object using:

- exact script name;
- `$workers.executionModel`;
- `$workers.durableObjectId`;
- provider request/trace identifiers;
- one sanitized synthetic evidence UUID when available.

Missing CPU, ambiguous execution model, contaminated traffic, provider errors or
unattributable events fail closed.

### Deployment and credentials

The existing Worker deployment credential remains the intended CI credential.
Cloudflare documents no separate Durable Object permission: access follows the
Worker that implements the class.

The Worker must be deployed first so the SQLite Durable Object namespace exists.
The Pages preview is then configured with a
`PRIVATE_DOCUMENT_LIFECYCLE` Durable Object namespace binding and deployed from
the same exact candidate.

The provider workflow must verify before any 25 MB mutation:

- Workers Free attestation;
- exact Worker script;
- Durable Object class/namespace deployment;
- `workers_dev: false`;
- Pages preview Durable Object binding;
- absence of the obsolete ADR-0011 service binding once cut over;
- required Worker-only Supabase bindings/secrets;
- same-origin deny smoke.

No new Cloudflare credential is authorized unless the existing proven
Worker/Pages credentials demonstrably cannot perform these documented
operations.

## Alternatives considered

### Keep ADR 0011 and optimize the current single stateless Worker

Rejected as the primary path. Streaming SHA-256 may reduce copying/memory, but
the measured 237–273 ms CPU profile exceeds the 10 ms stateless budget by more
than twenty times and no provider evidence shows a simple optimization can close
that gap.

### Split SHA-256 over many stateless Worker requests

Retained only as fallback. It can theoretically fit per-request CPU by using
Range reads and resumable SHA state, but it adds durable progress state,
ordering, retry, concurrency and hundreds of provider invocations for the ten
flow evidence set. Durable Objects provide a simpler Free execution envelope
without changing the 25 MB contract.

### Move trusted promotion back to Supabase Edge Functions

Rejected without a separate security redesign. ADR 0010 exists because the
browser-reachable Supabase Edge request pipeline could not prove the required
EOF-independent bodyless ingress termination. A second public promotion origin
would reintroduce the bypass.

### Workers Paid

Rejected. The private V1 zero-cost target and existing AR-006 contract prohibit
silently solving this packet by enabling Paid compute.

### Lower the 25 MB PDF limit

Rejected. The exact `25,000,000`-byte contract remains frozen.

## Security consequences

Positive:

- preserves the ADR-0010 same-origin bodyless browser boundary;
- removes one stateless Worker hop from the trusted path;
- confines the privileged Supabase service credential to the non-public
  Durable Object host Worker;
- gives promotion and abandon one per-document coordination boundary;
- retains all existing authorization, byte-integrity, replay and compensation
  checks;
- provides a Free CPU envelope far above the measured promotion CPU while still
  requiring provider proof.

Risks to verify:

- incorrect Durable Object naming could merge unrelated documents/projects;
- assuming DO single-threading prevents external-I/O interleaving would leave a
  race;
- Pages binding/config drift could bypass the intended executor or fail open;
- provider evidence could accidentally measure the stateless caller rather than
  the Durable Object;
- namespace/class lifecycle changes require deployment-specific review.

## Required RED-first evidence

Before production cutover:

- Pages fails closed when the DO binding is missing;
- invalid origin/method/body framing/targets/bearer never invoke the DO;
- project/document pair deterministically selects one object and different pairs
  cannot share an object;
- POST and DELETE for the same document serialize under forced overlapping
  provider I/O;
- different documents are not globally serialized;
- revoked permissions and changed reservation state still fail closed;
- canonical replay/idempotence and compensation remain green;
- exact 25 MB remains green in local Workers runtime;
- old Service Binding path is absent after cutover;
- Pages no longer carries the privileged admin secret after cutover;
- deployed provider evidence proves the revised CPU contract.

## 2026-09-25 ingress supersession

ADR 0013 supersedes the Pages-specific ingress and evidence portions of this
ADR after Cloudflare's persistent-log contract was revalidated. The private
Durable Object class, one-object-per-document identity, explicit serialization,
authorization, integrity, compensation and CPU model defined here remain
accepted and unchanged. References below to a direct Pages ingress are
historical; the active ingress is Workers Static Assets.

## State transition

This ADR resolves the post-campaign architecture decision only. It does not
close AR-006.

WP-2.9C may move:

```text
BLOCKED
-> IN_PROGRESS / A-IMPLEMENT — ADR 0012 RED FIRST
```

The permitted sequence is:

1. add RED tests for the Durable Object boundary and serialization;
2. implement the direct Pages -> Durable Object path;
3. run repository CI and clean-checkout verification;
4. perform an adversarial implementation review;
5. run one bounded isolated provider preflight for the new binding;
6. only after green preflight, run one exact-size provider evidence campaign;
7. if provider evidence is valid, rerun complete fresh Pass B and Pass C;
8. if the Durable Object path fails Free-plan CPU/security/deployment gates,
   return to architecture review without Paid or file-limit reduction.

## Provider references

- https://developers.cloudflare.com/durable-objects/platform/limits/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/
- https://developers.cloudflare.com/durable-objects/examples/testing-with-durable-objects/
- https://developers.cloudflare.com/pages/functions/bindings/
- https://developers.cloudflare.com/workers/authorization/durable-objects/
- https://developers.cloudflare.com/workers/observability/query-builder/
- https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/methods/query/
