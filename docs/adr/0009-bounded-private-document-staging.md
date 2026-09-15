# ADR 0009 — Bounded Storage staging for trusted private-document ingestion

- Status: Accepted
- Date: 2026-09-15
- Supersedes: the raw-binary Edge request transport selected by ADR 0008

## Context

ADR 0008 correctly moved authoritative private-Document byte integrity away from the browser, but it selected a Supabase Edge Function request body as the binary ingress transport.

Fresh WP-2.9C adversarial review and focused real-runtime RED evidence proved that this transport cannot satisfy the frozen resource-bound contract on the local Supabase Edge Runtime used by CI:

- a user worker can stop retaining bytes after `25,000,000`, but draining the request still makes total ingress/read work depend on sender EOF;
- changing the user worker to `reader.cancel()` does not make the outer Edge Runtime return the rejection while an over-limit sender deliberately keeps the request body open;
- the Supabase main runtime owns the ingress request and dispatches it to the user worker, so user-worker cancellation is not equivalent to terminating the client connection;
- the hosted Edge limits/configuration do not provide a documented per-function `25,000,000`-byte request limit that Mariage OS can freeze and verify as its own security boundary.

Therefore the ADR-0008 raw-binary request shape cannot prove `SEC-FILE-004` and `SEC-ABUSE-001` for a malicious open-ended sender. Keeping that transport and weakening the RED would convert a known runtime limitation into a silent security exception, which is forbidden.

The rest of ADR 0008 remains sound: the browser is not trusted to attest stored bytes; canonical Document Storage INSERT remains server-owned; live `documents.write`, exact path/state binding, exact byte SHA-256/size/PDF validation, service-only attestation and independent finalization authorization remain required.

## Decision

Replace raw PDF bytes in the Edge Function request with a **private, provider-bounded Storage staging boundary**.

The resulting flow is:

```text
browser local validation/hash
→ reserve pending Document metadata
→ authenticated INSERT into bounded private staging bucket
→ bodyless authenticated Edge promotion request
→ live authorization + authoritative staging inspection
→ bounded server re-read + PDF signature + exact size/SHA-256 verification
→ privileged provider-side copy to canonical project-private path
→ service-only ingest attestation
→ independent DB finalize pending → ready
→ server cleanup of staging object
```

No product capability, Feature ID or permission key is added.

## Staging bucket

Create one dedicated private bucket:

```text
document-ingest-staging
```

Migration-controlled bucket requirements:

- `public = false`;
- `file_size_limit = 25000000` bytes exactly;
- `allowed_mime_types = ['application/pdf']`;
- no anonymous policy;
- no authenticated SELECT/UPDATE/DELETE policy;
- one narrow authenticated INSERT policy only for the exact pending-Document staging namespace.

Canonical staging path:

```text
<project_id>/documents/<document_id>/original
```

The INSERT policy must validate the complete path and require a matching live pending private Document reservation plus current `documents.write`. A caller cannot choose another project, document, namespace or arbitrary path merely by knowing identifiers.

The canonical `project-private/<project_id>/documents/<document_id>/original` namespace remains unavailable for ordinary authenticated INSERT. Existing Media Storage policies remain unchanged.

## Why staging is the ingress resource boundary

The browser still supplies untrusted bytes, but it supplies them to Supabase Storage rather than through the Edge user-worker request body.

The staging bucket's provider-enforced file-size and MIME restrictions apply before the trusted promotion worker reads the object. This makes the accepted 25 MB file bound part of the Storage ingress contract instead of asking the user worker to terminate a connection it does not own.

Application validation remains defense in depth. Storage MIME metadata is necessary but not sufficient: promotion still independently checks `%PDF-`, exact authoritative size, and SHA-256 over the staged bytes.

## Browser authorization and immutability

The browser receives no service key and no canonical Document write authority.

Authenticated staging INSERT is allowed only when all of the following are true:

- the path has the exact staging grammar;
- the project/document IDs identify one existing pending Document reservation;
- the reservation belongs to that project and has the exact canonical Document shape;
- the current user has live `documents.write`.

No ordinary authenticated UPDATE or DELETE is granted on the staging bucket. Once an object exists, a browser cannot mutate the bytes being validated or delete them during promotion.

Uploads use `upsert:false`. If a retry finds an existing staging object, the client does not treat the conflict as proof of success; it proceeds only to the trusted promotion boundary, which validates the actual existing staging object.

## Edge promotion boundary

The existing `private-document-ingest` function becomes a **promotion/verification endpoint**, not a binary upload endpoint.

Required behavior:

1. require a valid Supabase user JWT and resolve the current user from provider auth;
2. require the request to carry no binary body; the handler must not consume an untrusted request body;
3. reject body-framed requests before reading them and prove in real-runtime tests that an open-ended chunked sender cannot keep the endpoint working to EOF;
4. accept only target identifiers needed to locate the pending reservation;
5. check live `documents.write` before reading reservation state and again immediately before the first privileged canonical mutation;
6. derive both staging and canonical paths from authoritative project/document state;
7. require the reservation to remain pending, active, private, non-remote and non-deleted;
8. use service credentials only after user authorization and state validation;
9. inspect authoritative staging object metadata before materialization and require exact `application/pdf`, exact reserved byte size and `1..25,000,000` bounds;
10. read staged bytes through an explicitly bounded server path, independently require `%PDF-` and recompute SHA-256 over those actual bytes;
11. require exact equality with the reserved lowercase SHA-256 and reserved byte size;
12. copy the already-verified staging object to the exact canonical `project-private` path with server-only authority and no overwrite semantics;
13. if the canonical object already exists, use the existing bounded trusted recovery proof: authoritative metadata first, then bounded re-read/signature/hash equality before attestation;
14. create the service-only ingest attestation only after canonical presence is backed by trusted exact-byte proof;
15. remove the staging object server-side after successful canonical proof/attestation; invalid staging objects may be server-cleaned without creating canonical or ready truth;
16. never expose/log service credentials, private bytes, private filename or unnecessary digest material.

A provider-owned same-service Storage copy is treated as a trusted byte-preserving transport only after the source object has been independently verified and only because the browser has no canonical write/update authority. Acceptance evidence must still demonstrate that the resulting canonical object matches the reserved bytes.

## Finalization remains independent

`manage_private_document(... finalize_upload ...)` remains the authoritative `pending → ready` transition and must continue to:

- re-check live `documents.write`;
- validate the exact project/document/path/state invariants;
- require trusted ingest attestation;
- require canonical object presence;
- preserve audit/revision/replay semantics.

A role downgrade or membership revocation after staging or promotion cannot create ready truth without passing this independent final authorization.

## Retry and recovery semantics

Retries are deliberately fail closed.

- Existing matching staging object: promotion may validate it; client conflict alone is not success.
- Invalid/oversized/wrong-MIME staging object: no attestation, no canonical promotion, no ready transition; server cleanup may make a later clean retry possible.
- Existing canonical object: no overwrite. The server must re-prove canonical MIME/size/signature/SHA-256 with bounded reads before attestation.
- Canonical object plus failed attestation: a retry re-validates canonical truth before attempting attestation again.
- Ready document: staging INSERT policy and promotion state validation both deny re-entry.

## CORS and secrets

The Edge promotion endpoint remains app-controlled and authenticated. `SEC-NET-008` therefore still requires explicit/minimal CORS for configured application origins; CORS never substitutes for authorization.

The service/secret key remains restricted to the Edge runtime. It is never bundled into the browser, committed to Git, returned to the client or logged.

## Alternatives considered

### Keep raw binary Edge request and drain after the limit

Rejected. It bounds retained user-worker memory but not ingress bytes/read duration/runtime work; the real-runtime RED proves dependence on sender EOF.

### Keep raw binary Edge request and call `reader.cancel()`

Rejected as the complete architecture. The user worker stops reading, but the real local main runtime does not return the over-limit response while the sender intentionally keeps the request open.

### Require `Content-Length` and reject chunked uploads

Rejected as the authoritative security boundary. A browser/provider transport detail would become a fragile application precondition, and it would still not provide a provider-owned exact 25 MB binary ingress boundary comparable to Storage bucket limits.

### Signed upload URLs

Not selected. They can provide narrow upload capability, but they add token issuance/expiry/replay lifecycle that is unnecessary here. Existing authenticated project membership and RLS are sufficient to authorize a deterministic staging INSERT while the bucket itself enforces size/MIME.

### Direct authenticated upload to canonical Document path

Rejected. It recreates parent finding `WP29A-AR-005`: a modified client could reserve one digest and write different bytes into committed canonical Storage.

### Custom VPS / second backend

Not required. Supabase Storage already supplies the missing provider-owned ingress bound while the existing Edge Function can retain trusted verification/promotion within the accepted Cloudflare + Supabase architecture.

## Work Packet consequence

WP-2.9C remains the remediation/control packet. The transport implementation changes, but the objective is unchanged: only authorized, exact, independently verified PDF bytes may enter canonical Document Storage and become ready.

The packet remains a 10-point cohesive security boundary rather than gaining a new product feature. The staging bucket replaces the unsafe raw-binary Edge transport; it does not add an independently deployable user capability. Endpoint, staging authorization, canonical lock-down, integrity proof and attestation still must ship atomically.

ADR 0008 is superseded only where it requires the PDF bytes themselves to enter through the Edge request. Its integrity, authorization, canonical-path, attestation and finalization requirements are retained here.

## Required verification before acceptance

WP-2.9C must add direct evidence for at least:

- staging bucket is private and migration-controlled with exact `25,000,000` byte limit and only `application/pdf` allowed;
- exact 25,000,000-byte staged PDF succeeds and 25,000,001-byte staging upload is rejected by Storage before promotion;
- wrong staging MIME is rejected by Storage;
- writer pending-path INSERT allowed; viewer, outsider, revoked, project substitution and ready/nonpending targets denied;
- ordinary authenticated staging UPDATE/DELETE/SELECT are denied unless a later narrowly reviewed recovery need explicitly proves otherwise;
- ordinary authenticated canonical Document INSERT remains denied while accepted Media behavior remains unchanged;
- promotion request carries no binary body and an open-ended body-framed sender is rejected without waiting for sender EOF;
- promotion rechecks live authorization and exact reservation state;
- authoritative staging MIME/size are checked before materialization;
- `%PDF-`, exact size and actual SHA-256 are independently verified from staged bytes;
- poisoned/mismatched staging object never creates canonical/attested/ready truth;
- exact verified staging bytes promote to canonical and can finalize;
- retry on existing canonical object is bounded, MIME-strict and exact-hash verified;
- role downgrade/revocation before promotion and before finalization fail closed;
- staging cleanup cannot cross project/document identity and cannot delete canonical/Media objects;
- explicit CORS allow/deny evidence remains green;
- server secrets/private bytes/private filenames remain absent from logs and public artifacts;
- full clean-checkout CI and a new fresh independent Pass B cover the complete packet before Pass C.
