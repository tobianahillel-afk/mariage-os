# WP-2.9C — Trusted private-document ingestion hardening

## Identity

- Work Packet ID: `WP-2.9C`
- Lot: `2`
- Name: Trusted private-document ingestion hardening
- State: `REVIEW_PENDING`
- Current pass: `B-ADVERSARIAL-REVIEW — FRESH RE-REVIEW`
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
- REVIEW_PENDING transition: `95e5a1c2c1bccc292787b745c3ca112a3f22a39b` / CI `34898586925` — **5/5 SUCCESS**, clean-checkout included.
- Fresh Pass B on that reviewed head found `WP29C-AR-001` below. C therefore returned to implementation/remediation and could not advance to Pass C.
- `WP29C-AR-001` remediation exact-head evidence: `264a504e4bc8208d9ff762ef71e90bea6d18216e` / CI `34905438530` — **5/5 SUCCESS**, clean-checkout included; Core `162` files / `1564` tests / `100%` statements, branches, functions and lines; DB `79` files / `1376` tests PASS; real Edge Runtime PASS includes malformed-JWT denial, direct-runtime chunked oversize rejection without trusting `Content-Length`, and exact `25,000,000`-byte feasibility.
- Current transition: remediation `A-IMPLEMENT → REVIEW_PENDING / B-ADVERSARIAL-REVIEW`. AR-001 is remediated but remains **pending independent verification** until fresh Pass B completes.

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
- secret handling / public-artifact safety for the new server runtime.

The service/secret key exists only in the Edge Function runtime environment. It is never bundled in the Vite app, committed in Git, returned to the client or logged.

## Required RED-first evidence

Before remediation implementation, add focused tests that fail for the exact defects:

1. C1 control-character input is currently accepted by the shared TypeScript predicate/provider boundary when PostgreSQL rejects it.
2. An authenticated writer can currently create a Document Storage object directly at a valid pending path and finalize metadata whose reserved SHA-256 does not describe those actual bytes.

The RED must not weaken/delete the existing WP-2.9A RED contract or unrelated accepted tests.

## Fresh Pass-B finding

### `WP29C-AR-001` — MAJOR / REMEDIATED / RE-REVIEW PENDING — request body can exceed the accepted byte bound before rejection

The reviewed Edge implementation performed an early optimization using `Content-Length`, but authoritative actual-byte enforcement happened only after:

```text
await request.arrayBuffer()
```

A request with absent/unusable `Content-Length` could therefore cause the worker to buffer the complete body before discovering that it exceeded `25,000,000` bytes. The endpoint correctly rejected the payload eventually, but the resource bound was applied too late to satisfy the packet's untrusted-file boundary, `SEC-FILE-004` and `SEC-ABUSE-001`.

Required remediation:

- consume the request body through a bounded streaming reader;
- stop/cancel as soon as cumulative received bytes exceed `25,000,000`;
- do not call `request.arrayBuffer()` for the untrusted request body;
- preserve exact `25,000,000`-byte acceptance and `25,000,001` rejection;
- preserve exact-byte signature/SHA-256/upload semantics after bounded collection;
- add focused RED evidence proving the body is bounded during reading, not merely rejected after full buffering;
- add direct malformed-JWT runtime evidence while this Edge harness is being revisited, because the frozen verification plan requires missing **and invalid** JWT denial.

Remediation evidence on `264a504e4bc8208d9ff762ef71e90bea6d18216e` / CI `34905438530` proves the bounded reader no longer uses `request.arrayBuffer()` for the untrusted body, the live Edge Runtime rejects an absent-`Content-Length` chunked payload above the bound, malformed JWT is denied, exact `25,000,000` bytes remain feasible, and the full clean-checkout gate is green. Because the local Supabase main runtime tees request bodies, the implementation discards post-overflow bytes without retaining them until EOF so the runtime can surface the rejection while keeping application memory bounded. Fresh Pass B must independently verify that this runtime-specific drain preserves the security invariant and does not reopen any exact-byte or authorization property.

This finding does not reopen the already-demonstrated path/hash/authorization/replay integrity properties. It remains pending independent verification and blocks Pass C until fresh Pass B explicitly verifies closure.

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
- actual body consumption is bounded while streaming, including when `Content-Length` is absent/unusable;
- actual size mismatch rejected;
- actual SHA-256 mismatch rejected;
- exact reserved bytes upload successfully with `upsert:false`;
- retry on exact existing object is idempotent only after trusted verification;
- mismatched existing object never becomes trusted/ready;
- provider/runtime failures map to safe retryable/non-disclosing errors;
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
- 25 MB accepted PDF limit gets runtime/resource feasibility evidence before C acceptance; if the runtime cannot safely support it, C becomes BLOCKED rather than silently shrinking the frozen product contract.

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

Current state: **REVIEW_PENDING / B-ADVERSARIAL-REVIEW — FRESH RE-REVIEW**.

Current gate:

1. Pass-A implementation HEAD `d90a643d929c35ef84444c19b7ec02ad9cd9e5a8` / CI `34896641824` is **5/5 SUCCESS**, clean-checkout included;
2. REVIEW_PENDING transition `95e5a1c2c1bccc292787b745c3ca112a3f22a39b` / CI `34898586925` is **5/5 SUCCESS**, clean-checkout included;
3. fresh Pass B found `WP29C-AR-001` MAJOR: untrusted request bodies could be fully buffered before authoritative actual-byte size rejection when the header shortcut could not reject early;
4. remediation exact-head `264a504e4bc8208d9ff762ef71e90bea6d18216e` / CI `34905438530` is **5/5 SUCCESS**, clean-checkout included; Core `162` files / `1564` tests / `100%` coverage, DB `79` files / `1376` tests PASS, and live Edge Runtime proves malformed-JWT denial, chunked oversize rejection and exact `25,000,000`-byte feasibility;
5. `WP29C-AR-001` is **REMEDIATED / RE-REVIEW PENDING**, not closed by implementation evidence alone;
6. perform a new fresh independent Pass B from the frozen contracts and ADR, explicitly re-challenging bounded streaming with absent/unusable `Content-Length`, the runtime-specific post-overflow drain, exact-byte integrity, authorization, retry/recovery and log/secret safety;
7. if Pass B finds any remaining defect, record it durably and return to remediation with focused RED-first evidence before acceptance;
8. only a clean fresh Pass B may mark AR-001 **CLOSED / VERIFIED** and advance C to Pass C;
9. only after **WP-2.9C ACCEPTED**, resolve WP-2.9A blocker and return A to `IN_PROGRESS` for integration/reverification;
10. WP-2.9B remains `PLANNED / AFTER A` until A is accepted.
