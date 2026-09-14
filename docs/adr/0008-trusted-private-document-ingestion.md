# ADR 0008 — Trusted server-side private-document binary ingestion

- Status: Accepted
- Date: 2026-09-14

## Context

WP-2.9A implements the Lot-2 private PDF document foundation with PostgreSQL metadata, authenticated Supabase Storage and an `absent → pending → ready` lifecycle.

Fresh adversarial review found `WP29A-AR-005`: the current browser-authorized Storage path can reserve metadata for one PDF, upload different bytes at the same opaque path, then call `finalize_upload`. The database can prove object presence and project/path authorization, but `storage.objects` does not expose a trusted SHA-256 of the stored bytes that can be compared with the reserved document hash.

This conflicts with the frozen document/storage contract:

- SHA-256 is over the exact uploaded bytes;
- uploaded files are untrusted input;
- critical validation is repeated at the server/database boundary as appropriate;
- a pending document becomes committed/ready only after the required binary/metadata state is verified;
- direct REST/RPC/Storage access cannot rely on frontend behavior for security/domain integrity.

Supabase Storage system metadata can support server-owned size/MIME/object-state checks, but caller-controlled custom metadata is not trusted integrity evidence. The existing architecture has no privileged server upload boundary and local Edge Runtime is currently disabled.

## Decision

Introduce one narrow authenticated Supabase Edge Function for **private Document binary ingestion only**. It is an infrastructure/security boundary, not a new product capability.

The function will:

1. require a valid Supabase user JWT; anonymous invocation is denied;
2. accept only the identifiers needed to locate an existing pending Document reservation plus the PDF bytes;
3. derive/obtain the canonical Storage path from authoritative database state, never from caller path authority;
4. query the pending reservation through live project authorization and fail non-disclosing for foreign/revoked/unauthorized identity;
5. treat the received bytes as untrusted and independently verify PDF MIME intent, `%PDF-` signature and the 1..25,000,000-byte bound;
6. compute SHA-256 over the **actual received bytes** with platform Web Crypto and compare it with the reserved lowercase SHA-256 and reserved byte size;
7. upload those exact verified bytes to `project-private/<project_id>/documents/<document_id>/original` using a server-only Supabase secret with `upsert:false`;
8. never expose or log the server secret, private PDF bytes, private filename or hash unnecessarily;
9. keep `finalize_upload` as the database transition that re-checks live `documents.write` and object presence before `pending → ready`;
10. preserve recovery/idempotency: an already-present pending object is accepted only after trusted re-verification of the actual object or another proof equivalent to re-reading/re-hashing it; mismatched existing bytes fail closed and are never finalized as ready.

Authenticated clients will no longer receive direct `storage.objects` INSERT authority for the `/documents/.../original` namespace. Existing Media Storage behavior remains unchanged. Pending Document SELECT/recovery and exact pending cleanup may remain authenticated where the frozen recovery contract requires them.

The browser/application remains free to perform early PDF validation and hashing for UX and reservation semantics, but those checks are not authoritative proof of the stored binary.

## Authorization model

The Edge Function is an authenticated member endpoint, not an anonymous capability.

- The caller JWT identifies the user.
- Live `documents.write` and same-project pending-reservation identity are checked from current database authority.
- The server secret is used only for the exact Storage operation after user authorization and document-state validation.
- A caller cannot supply an arbitrary Storage path, project binding, ready state, audit identity or authoritative hash.
- Revocation/downgrade must fail closed. If authorization is lost around an in-flight upload, the function must not create committed truth; cleanup/recovery follows the existing pending lifecycle.
- The existing `finalize_upload` database command remains responsible for live authorization immediately before committed state.

No new permission key is introduced.

## Why an Edge Function

PostgreSQL cannot read the private object bytes directly from Supabase Storage to recompute SHA-256. Storage object metadata does not provide the required trusted exact SHA-256 field, and client/user metadata cannot attest itself.

A server function can see the real bytes, compute their digest and perform the privileged exact-path upload without exposing a service/secret key to the browser. This keeps the deployment within the accepted Cloudflare Pages + Supabase architecture rather than adding a VPS or second backend provider.

## Alternatives considered

### Keep direct authenticated Storage upload and trust browser-computed SHA-256

Rejected. A malicious or modified client can reserve one digest and upload other bytes.

### Store the browser hash in Storage user metadata and compare it in PostgreSQL

Rejected. Caller-supplied metadata is not independent proof of caller-supplied bytes.

### Compare only Storage size/MIME/eTag at finalize

Rejected as insufficient for the frozen exact-byte SHA-256 invariant. Size and MIME improve validation but do not prove byte identity; eTag is provider semantics rather than the frozen SHA-256 contract.

### Recompute SHA-256 on every application download

Insufficient as the commit boundary. It would detect some corruption late but would still permit invalid bytes to become committed `ready` truth and would not protect direct consumers of authoritative metadata.

### Custom VPS/second backend

Rejected unless the Supabase function runtime later proves unable to satisfy the frozen 25 MB document limit or security/test requirements. ADR 0001 intentionally minimizes custom backend operations.

## Work Packet / complexity consequence

This boundary is not absorbed silently into the existing 10-point WP-2.9A.

A new remediation packet **WP-2.9C — Trusted private-document ingestion hardening** owns the implementation and verification of AR-004/AR-005. Conservative score:

| Change | Points |
|---|---:|
| new authenticated server endpoint | 2 |
| changed Storage/privileged authorization boundary | 2 |
| Supabase Edge Function/provider runtime integration | 3 |
| forward-only migration/policy hardening family | 1 |
| security-sensitive exact-byte SHA-256 integrity boundary | 2 |
| **Total** | **10** |

Cohesion review: **PASS**. Every point exists for one atomic trust-boundary objective: only exact, authorized, server-verified private PDF bytes may enter the Document Storage namespace and later become ready. Splitting the endpoint, policy lock-down and integrity check into separate independently deployable packets would create unsafe intermediate states.

WP-2.9A is blocked until WP-2.9C is accepted; it then resumes for integration/fresh review. WP-2.9B remains after WP-2.9A acceptance.

## Verification consequences

WP-2.9C must provide direct evidence for at least:

- unauthenticated/outsider/project-B/revoked upload denial;
- direct authenticated Storage Document INSERT denial while accepted Media behavior remains green;
- exact pending project/document binding and no caller path authority;
- invalid MIME/signature/empty/oversize bytes rejected before privileged upload;
- actual-byte SHA-256 mismatch and size mismatch rejected;
- exact reserved bytes succeed and can then finalize;
- retry/recovery does not overwrite and does not bless a mismatched pre-existing object;
- `upsert:false` and ready-object immutability remain true;
- server secrets/private bytes/private filenames are absent from logs/public artifacts;
- local Edge Function integration is exercised in CI, not represented only by mocks;
- the 25 MB accepted boundary receives a runtime/resource feasibility test or equivalent evidence before packet acceptance.

If hosted/local Edge Function constraints cannot safely support the frozen 25 MB boundary, WP-2.9C becomes `BLOCKED` and a new reviewed architecture decision is required before changing the file-size contract or choosing another trusted runtime.

## Consequences

Positive:

- exact stored-byte integrity becomes enforceable against a modified browser client;
- existing reserve/finalize/recovery database semantics remain useful;
- no service-role/secret key enters the browser;
- project-private Media behavior remains independently scoped;
- provider coupling remains isolated behind application/infrastructure boundaries.

Tradeoffs:

- Edge Runtime becomes an additional deployed Supabase component;
- CI must add local Function execution/security evidence;
- private Document uploads take one server hop rather than writing directly from the browser;
- upload reliability/resource behavior at the 25 MB boundary must be verified explicitly.
