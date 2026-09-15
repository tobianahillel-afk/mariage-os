# WP-2.9C — Trusted private-document ingestion hardening

## Identity

- Work Packet ID: `WP-2.9C`
- Lot: `2`
- Name: Trusted private-document ingestion hardening
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT — RED FIRST`
- Primary bounded context: Documents — authoritative binary ingress for the existing WP-2.9A private PDF lifecycle
- Branch/PR: `lot-2/venues-core` / Lot-2 integration PR not opened yet
- FIR: `#17 / FTR-089`
- Parent review failure: `WP-2.9A / WP29A-AR-004 + WP29A-AR-005`
- Architecture decision: `ADR 0008 — Trusted server-side private-document binary ingestion`
- Size: **10 points**; explicit cohesion review **PASS**

## Activation evidence

- WP-2.9A durable AR-004/005 failure record: `a58417f79e59e2bd2d2fcb4d202f568c15cfa947` / CI `34854785427` — **5/5 SUCCESS**, clean-checkout included.
- ADR 0008 + WP-2.9C split/READY governance: `d1e561c787798eb99f49024cc0c1db49880bcd82` / CI `34862521697` — **5/5 SUCCESS**, clean-checkout included.
- Pass-A implementation evidence: `d90a643d929c35ef84444c19b7ec02ad9cd9e5a8` / CI `34896641824` — **5/5 SUCCESS**, clean-checkout included; DB `79` files / `1376` tests PASS; real Edge-runtime adversarial harness PASS including exact `25,000,000`-byte feasibility.
- Initial REVIEW_PENDING transition: `95e5a1c2c1bccc292787b745c3ca112a3f22a39b` / CI `34898586925` — **5/5 SUCCESS**, clean-checkout included.
- Initial fresh Pass B found `WP29C-AR-001` below. C therefore returned to implementation/remediation and could not advance to Pass C.
- `WP29C-AR-001` remediation implementation evidence: `264a504e4bc8208d9ff762ef71e90bea6d18216e` / CI `34905438530` — **5/5 SUCCESS**, clean-checkout included; Core `162` files / `1564` tests / `100%` statements, branches, functions and lines; DB `79` files / `1376` tests PASS; real Edge Runtime PASS includes malformed-JWT denial, direct-runtime chunked oversize rejection without trusting `Content-Length`, and exact `25,000,000`-byte feasibility.
- Fresh-review transition: `e4efa0b74ffd5708d9888ff23e13174ec2032c68` / CI `34909259741` — **5/5 SUCCESS**, clean-checkout included.
- Fresh Pass B durable failure record: `54ccc8865ea67a4835a7627b14739c3eaac53f5a` / CI `34910156654` — **5/5 SUCCESS**, clean-checkout included; unresolved `WP29C-AR-001..004` block Pass C.
- Current transition: `REVIEW_FAILED → IN_PROGRESS / A-IMPLEMENT — RED FIRST`. Exact-head CI for this transition must be green before focused remediation RED tests are committed.

## Why this packet exists

Fresh adversarial review of WP-2.9A closed AR-003 but found two MAJOR defects:

- `WP29A-AR-004`: TypeScript document text/filename validation misses Unicode C1 controls U+0080..U+009F that PostgreSQL 17 rejects through `[[:cntrl:]]`.
- `WP29A-AR-005`: the existing direct authenticated Storage path can commit `ready` metadata without proving that the actual stored bytes match the reserved SHA-256/size/MIME.

AR-005 requires a new privileged server/provider boundary. WP-2.9A was already a 10-point packet, so `AI-LOT-ORCHESTRATION.md` requires a split rather than silently expanding it above the normal maximum. WP-2.9C is a remediation implementation-control unit; it introduces no new product capability.

WP-2.9A is blocked until C is accepted. After C acceptance, A returns to `IN_PROGRESS` for integration/reverification, then fresh Pass B. WP-2.9B remains inactive until A itself is accepted.

## Complexity / cohesion review

| Change type | Points |
|---|---:|
| new authenticated server endpoint | 2 |
| changed Storage/privileged authorization boundary | 2 |
| Supabase Edge Function/provider runtime integration | 3 |
| forward-only migration/policy hardening family | 1 |
| security-sensitive exact-byte SHA-256 integrity boundary | 2 |
| **Total** | **10** |

Cohesion: **PASS**. Endpoint, Storage lock-down, exact-byte digest verification and recovery behavior form one atomic trust boundary. Splitting them further would create an intermediate state where either clients retain an integrity bypass or the application cannot upload Documents.

## Assigned responsibility

C owns only the remediation necessary to make the already-frozen FTR-089 Lot-2 Document foundation true against an untrusted browser client:

1. close `WP29A-AR-004` with exact Unicode-control parity;
2. close `WP29A-AR-005` with trusted actual-byte ingestion/verification;
3. preserve all already-accepted WP-2.9A behavior and WP-2.8 Media behavior;
4. add the minimum runtime/CI/deployment evidence required by the new server boundary.

No feature/requirement is newly added. Current responsibility remains under `FTR-089`, `MED-002`, `MED-003`, `MED-010`, the inherited interrupted-upload validity invariant, and packet-applicable `SEC-VAL-*`, `SEC-FILE-*`, `SEC-AUTHZ-*` controls.

## Frozen remediation architecture

### Browser/application

The browser may continue early PDF validation/hash calculation for immediate UX and reservation semantics, but it is untrusted for authoritative byte integrity.

The application flow remains conceptually:

```text
validate locally
→ reserve pending metadata
→ trusted server binary ingest
→ inspect/recover as needed
→ finalize pending → ready
```

The application no longer uploads `/documents/.../original` directly through an authenticated client Storage INSERT.

### Authenticated server ingest

One narrow Supabase Edge Function receives the pending document identity and PDF bytes.

Required behavior:

- JWT verification enabled; no anonymous mode;
- resolve current user from the request, never from a caller-supplied user ID;
- obtain the pending Document row through live authorization;
- derive the exact canonical Storage path from authoritative row state;
- require pending, active, ordinary-private Document state;
- reject foreign/missing/revoked/unauthorized identity generically;
- validate actual received bytes as PDF: expected MIME intent, `%PDF-`, size `1..25,000,000`;
- compute SHA-256 from the actual received bytes with Web Crypto;
- require exact equality with reserved `size_bytes` and lowercase `sha256`;
- upload only those bytes with a server-only Supabase secret and `upsert:false`;
- never accept caller-provided path/storage identity as authority;
- never expose/log the server secret or private bytes;
- make retry behavior safe if the exact pending object already exists.

### Storage authorization

Authenticated clients lose direct INSERT permission for the Document namespace only.

- accepted Media INSERT/SELECT/DELETE behavior remains unchanged;
- Document pending SELECT/recovery may remain writer-authorized;
- exact pending Document DELETE cleanup may remain writer-authorized;
- no UPDATE policy is added;
- ready objects remain immutable and non-deletable through ordinary authenticated client policy.

### Finalization

The existing protected DB `finalize_upload` transition remains responsible for:

- locking/validating the target Document;
- live `documents.write` re-authorization;
- exact canonical path/state invariants;
- verifying object presence before `pending → ready`;
- audit/revision/replay behavior.

Because only the trusted server ingest can create a Document object after C, object presence at that path becomes evidence that the binary passed the trusted byte validation boundary. C must prove there is no remaining ordinary authenticated INSERT path that recreates AR-005.

### Existing-object recovery

A retry must never treat mere pre-existence as trustworthy without proof.

If the pending object is already present, the server boundary must either:

- re-read and revalidate/re-hash the actual object and confirm it matches the reservation, or
- use an equivalently strong server-owned proof created only by this boundary.

Caller-controlled object/user metadata is not sufficient proof. Mismatch fails closed and must not transition the document to ready.

## AR-004 exact remediation

The canonical TypeScript scalar-control predicate must reject:

```text
U+0000..U+001F
U+007F..U+009F
```

It remains scalar-aware, rejects malformed surrogate input, preserves ECMAScript trim semantics and remains the single predicate reused by bounded `document_type`/`title` and private filename validation.

Focused RED must include at least representative U+0080, U+0085 and U+009F cases at meaningful service/provider boundaries before the fix is applied.

## Security requirements

At minimum directly evidence applicable forms of:

- `SEC-AUTHZ-001..009`, especially direct endpoint/Storage bypass resistance;
- `SEC-VAL-001`, `SEC-VAL-002`, `SEC-VAL-003`, `SEC-VAL-008`;
- `SEC-FILE-001`, `SEC-FILE-002`, `SEC-FILE-003`, `SEC-FILE-004`, `SEC-FILE-008`, `SEC-FILE-009`;
- `AUTHZ-001`, `AUTHZ-002`, `AUTHZ-005`, `AUTHZ-007`, `AUTHZ-008`, `AUTHZ-018`, `AUTHZ-020`;
- `SEC-ABUSE-001` for bounded expensive-upload resource consumption;
- `SEC-NET-008` for explicit/minimal CORS at the app-controlled Edge endpoint;
- secret handling / public-artifact safety for the new server runtime.

The service/secret key exists only in the Edge Function runtime environment. It is never bundled in the Vite app, committed in Git, returned to the client or logged.

## Required RED-first evidence

Before remediation implementation, add focused tests that fail for the exact defects:

1. C1 control-character input is currently accepted by the shared TypeScript predicate/provider boundary when PostgreSQL rejects it.
2. An authenticated writer can currently create a Document Storage object directly at a valid pending path and finalize metadata whose reserved SHA-256 does not describe those actual bytes.

The RED must not weaken/delete the existing WP-2.9A RED contract or unrelated accepted tests.

## Pass B — ADVERSARIAL REVIEW

### First fresh review — `WP29C-AR-001`

`WP29C-AR-001` — **MAJOR**: the initial Edge implementation used `await request.arrayBuffer()`, so absent/unusable `Content-Length` could cause the full untrusted body to be buffered before authoritative `25,000,000`-byte rejection. The required remediation explicitly froze a bounded streaming reader that stops/cancels once the cumulative body exceeds the limit, while preserving exact 25 MB acceptance and exact-byte validation.

### Fresh post-remediation review — REVIEW_FAILED

Reviewed exact transition head: `e4efa0b74ffd5708d9888ff23e13174ec2032c68`, CI `34909259741` — **5/5 SUCCESS**, clean-checkout included.

The review was reconstructed from ADR 0008, this packet, `SECURITY-REQUIREMENTS.md`, `FILE-SECURITY.md`, `STORAGE-RLS.md`, `AUTHORIZATION-REQUIREMENTS.md`, the current Edge/migration/client implementation, the real-runtime harness and the exact pinned Supabase SDK behavior. Green CI was treated as evidence, not as a substitute for adversarial contract review.

Open findings:

### `WP29C-AR-001` — MAJOR / OPEN — oversize ingress still depends on consuming the sender to EOF

The remediation bounds **retained application memory**, but it does not implement the frozen stop/cancel behavior. Once `totalBytes > MAX_BYTES`, `readBoundedRequestBody` sets `exceededLimit = true`, clears retained chunks, and then continues `reader.read()` until `done`, discarding every remaining chunk.

Consequences:

- a client that sends `25,000,001` bytes and closes is rejected, which the current direct-runtime test proves;
- a malicious or malfunctioning client can continue streaming arbitrarily beyond the accepted body limit and keep the worker/runtime consuming ingress until EOF or an outer timeout;
- input bytes, read duration and network/runtime work are therefore not bounded by the 25 MB product limit;
- the current test ends immediately after the first excess byte and therefore does not prove rejection is independent of sender EOF;
- this remains inconsistent with the frozen AR-001 remediation, `SEC-FILE-004` and `SEC-ABUSE-001`.

The Supabase main runtime request tee explains why an early user-worker cancellation caused the local public route to stall/504 during remediation experiments, but that runtime constraint does not make an unbounded drain satisfy the frozen security contract. Remediation must enforce a hard ingress boundary at a layer that can actually terminate/reject the request without consuming arbitrary post-limit bytes, or the ADR/runtime architecture must be revisited explicitly. A RED must keep the sender open/continue past the limit and prove the trusted boundary does not depend on EOF to bound work.

### `WP29C-AR-002` — MAJOR / OPEN — existing-object recovery fully buffers an untrusted object before size validation

The idempotent retry path treats a pre-existing canonical object as untrusted until revalidated, but `readExistingBytes` currently calls:

```text
admin.storage.from(BUCKET).download(path)
→ BlobDownloadBuilder
→ await Response.blob()
→ await data.arrayBuffer()
```

The packet pins `@supabase/supabase-js@2.112.4`; that exact SDK's `BlobDownloadBuilder` materializes the entire response with `await result.blob()` before returning it. `bytesMatchReservation` checks size only **after** that materialization. A stale/poisoned/privileged object larger than the 25 MB contract can therefore force the trusted worker to buffer the entire object on replay before it fails closed.

This bypasses the same file/resource boundary through recovery and violates `SEC-FILE-004` / `SEC-ABUSE-001`. The pinned SDK already exposes `download(...).asStream()`, and `info(path)` exposes object size/content type; remediation must use an equivalently bounded recovery path rather than Blob-first download. RED evidence must exercise an oversized existing object at the canonical path and prove no full-object materialization, no attestation and no ready transition.

### `WP29C-AR-003` — MAJOR / OPEN — existing-object MIME proof is fail-open when content type is absent

Recovery currently accepts MIME with:

```ts
if (data.type && data.type !== "application/pdf") return null;
```

That rejects a wrong **non-empty** Blob type but accepts an empty/absent type. ADR 0008 and parent AR-005 require the existing object to receive equally strong trusted proof of reserved size/hash/**MIME**, not merely PDF signature plus hash/size when provider MIME evidence is absent.

Recovery must fail closed unless authoritative Storage metadata proves `application/pdf`, while still independently validating `%PDF-`, exact size and exact SHA-256. RED evidence must cover missing/empty and wrong stored content type and prove neither can create a trusted attestation/ready truth.

### `WP29C-AR-004` — MINOR / OPEN — Edge CORS is wildcard rather than explicit/minimal

The app-controlled Edge endpoint currently emits `Access-Control-Allow-Origin: *` for ordinary and preflight responses. Authorization remains JWT/permission based, so this is not treated as an authorization bypass, but it does not satisfy `SEC-NET-008`'s explicit/minimal CORS requirement.

Remediation must define the allowed app-origin policy/configuration, emit CORS only for allowed origins, preserve local/preview needs explicitly, and add positive/negative preflight evidence. CORS must remain independent from authorization decisions.

Reviewed and currently clean/non-blocking:

- malformed/missing JWT denial is runtime-tested; current user identity comes from verified auth rather than caller-supplied user ID;
- project/document IDs are only request targets; canonical Storage path derives from authoritative IDs/state and caller path substitution is absent;
- live `documents.write` is checked before reservation access and again immediately before the first privileged Storage mutation;
- foreign/outsider/viewer/revoked/downgraded access fails generically in the live harness;
- ordinary authenticated Document Storage INSERT is removed while accepted Media behavior remains covered;
- actual new-upload bytes are bounded in retained memory, signature-checked, exact-size checked and SHA-256 checked before service-role upload with `upsert:false`;
- attestation RPC/table authority is service-only and finalization independently reauthorizes current `documents.write`;
- exact-object replay rejects mismatched bytes in current tests; the remaining findings concern resource/MIME completeness of that recovery proof;
- the second authorization check immediately before the first privileged side effect satisfies the ADR's stated race-window rule; a later revocation cannot produce ready truth because finalization independently reauthorizes;
- service/secret credentials are server-only and current code does not log secrets/private bytes/private filenames;
- C1 control-character parity remediation and associated parent behavior remain implementation-green;
- exact `25,000,000`-byte ingest/finalize feasibility remains proven by the real-runtime harness.

Because unresolved MAJOR findings remain, Pass B verdict is **REVIEW_FAILED**. Pass C is forbidden.

## Verification plan

### Domain/application

- U+0080/U+0085/U+009F rejected in bounded text/private filename paths;
- existing Unicode scalar-limit, surrogate, trim, PDF and SHA boundaries remain green;
- application uses a typed trusted-ingest port rather than direct Document Storage upload for new bytes;
- recovery/delete semantics remain exact-path and fail closed.

### Edge Function

- missing/invalid JWT denied;
- outsider/project-B/revoked/downgraded user denied;
- caller cannot substitute path/project/document/user identity;
- missing/non-pending/deleted/ready target rejected appropriately;
- non-PDF MIME intent, bad signature, empty and oversize bytes rejected before privileged upload;
- actual request-body work is bounded even when `Content-Length` is absent/unusable and the sender continues transmitting after the first excess byte;
- actual size mismatch rejected;
- actual SHA-256 mismatch rejected;
- exact reserved bytes upload successfully with `upsert:false`;
- retry on exact existing object is idempotent only after bounded trusted verification;
- oversized existing object is rejected without full-object buffering/materialization;
- existing object requires authoritative stored MIME `application/pdf` plus signature/size/hash equality;
- mismatched existing object never becomes trusted/ready;
- provider/runtime failures map to safe retryable/non-disclosing errors;
- CORS allows only explicitly configured app origins and rejects/omits allowance for unknown origins;
- secret/private bytes/private filename absent from logs and public build artifacts.

### DB / Storage

- ordinary authenticated direct Document INSERT denied after policy hardening;
- accepted Media Storage policy matrix remains green;
- pending Document writer read/recovery semantics remain as frozen;
- exact pending cleanup remains project-safe;
- ready update/delete/overwrite remains denied;
- function-created exact object can be finalized by an authorized current writer;
- finalize after revocation/downgrade is denied and does not create ready truth.

### CI / runtime

- local Edge Runtime enabled only as needed for reviewed Functions;
- CI runs a real local function integration/adversarial harness in addition to unit mocks;
- clean-checkout full verification includes the new boundary;
- 25 MB accepted PDF limit gets runtime/resource feasibility evidence before C acceptance; if the runtime cannot safely support the required hard ingress boundary, C becomes `BLOCKED` rather than silently weakening the frozen product/security contract.

## Explicit non-goals

- no UI/presentation work;
- no document versioning or contract-readiness workflow;
- no generic upload gateway for Media/import/backup;
- no new permission key;
- no signed-URL product flow;
- no offline pending-file queue;
- no automatic deduplication;
- no change to the 25 MB PDF contract without a separate approved scope decision;
- no real wedding data.

## State / sequencing

Current state: **IN_PROGRESS / A-IMPLEMENT — RED FIRST**.

Current gate:

1. Pass-A implementation HEAD `d90a643d929c35ef84444c19b7ec02ad9cd9e5a8` / CI `34896641824` is **5/5 SUCCESS**, clean-checkout included;
2. initial REVIEW_PENDING transition `95e5a1c2c1bccc292787b745c3ca112a3f22a39b` / CI `34898586925` is **5/5 SUCCESS**, clean-checkout included;
3. initial fresh Pass B found `WP29C-AR-001` MAJOR;
4. remediation implementation head `264a504e4bc8208d9ff762ef71e90bea6d18216e` / CI `34905438530` is **5/5 SUCCESS**, clean-checkout included; Core `162` files / `1564` tests / `100%` coverage, DB `79` files / `1376` tests PASS, and real Edge Runtime proves malformed-JWT denial, one-byte-oversize rejection and exact `25,000,000`-byte feasibility;
5. fresh-review transition `e4efa0b74ffd5708d9888ff23e13174ec2032c68` / CI `34909259741` is **5/5 SUCCESS**, clean-checkout included;
6. fresh Pass B durable failure record `54ccc8865ea67a4835a7627b14739c3eaac53f5a` / CI `34910156654` is **5/5 SUCCESS**, clean-checkout included; `WP29C-AR-001`, `WP29C-AR-002`, `WP29C-AR-003` remain MAJOR open and `WP29C-AR-004` MINOR open;
7. this remediation transition must pass exact-head CI before focused RED tests are committed;
8. once green, add focused **test-only RED-first evidence** proving: continued post-limit senders cannot force work to EOF; oversized existing objects are not fully materialized; missing/wrong stored MIME cannot be attested; unknown CORS origins are not allowed;
9. production remediation is forbidden until those failures are isolated to the intended findings;
10. if the Supabase Edge runtime cannot support a hard 25 MB ingress boundary without unbounded draining, C becomes `BLOCKED` and ADR 0008 must be revisited rather than weakening the contract;
11. after remediation, require exact-head CI and then another fresh independent Pass B over the complete packet, not only patched lines;
12. only a clean fresh Pass B may advance C to Pass C;
13. only after **WP-2.9C ACCEPTED**, resolve WP-2.9A blocker and return A to `IN_PROGRESS` for integration/reverification;
14. WP-2.9B remains `PLANNED / AFTER A` until A is accepted.
