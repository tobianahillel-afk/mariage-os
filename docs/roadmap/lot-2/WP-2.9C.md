# WP-2.9C — Trusted private-document ingestion hardening

## Identity

- Work Packet ID: `WP-2.9C`
- Lot: `2`
- Name: Trusted private-document ingestion hardening
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT — RED FIRST`
- Primary bounded context: Documents — trusted binary promotion for the existing WP-2.9A private PDF lifecycle
- Branch/PR: `lot-2/venues-core` / Lot-2 integration PR not opened yet
- FIR: `#17 / FTR-089`
- Parent review failure: `WP-2.9A / WP29A-AR-004 + WP29A-AR-005`
- Architecture chain: ADR 0008 trust/integrity intent → ADR 0009 bounded staging/bodyless promotion → ADR 0010 accepted Cloudflare Pages Function promotion boundary
- Historical architecture blocker record: `docs/roadmap/lot-2/WP-2.9C-BLOCKER.md` — **RESOLVED by ADR 0010**
- Size: **10 points**; cohesion review **PASS**

## Current packet verdict

WP-2.9C is active again but **not acceptable yet**.

The prior design blocker is resolved by accepted ADR 0010. The security finding itself remains open and is now the focused RED target:

- `WP29C-AR-001` — **MAJOR / OPEN / RED TARGET**: the former Supabase promotion route waits for sender EOF on an intentionally open-ended framed request. The accepted replacement must prove EOF-independent rejection in a real Cloudflare Pages/Workers runtime and remove the old Supabase promotion route so no direct-origin bypass remains.

Already-implemented remediation remains green for:

- `WP29C-AR-002` — bounded canonical recovery;
- `WP29C-AR-003` — authoritative stored MIME proof;
- `WP29C-AR-004` — explicit/minimal CORS behavior.

Formal closure of AR-002/003/004 still waits for a complete fresh Pass B after the ADR-0010 migration.

## Why this packet exists

Fresh adversarial review of WP-2.9A found:

- `WP29A-AR-004`: TypeScript document text/filename validation missed Unicode C1 controls U+0080..U+009F rejected by PostgreSQL;
- `WP29A-AR-005`: direct authenticated Storage ingress could commit `ready` metadata without trusted proof that the actual stored bytes matched reserved SHA-256/size/MIME.

WP-2.9A was already a 10-point packet, so repository sizing rules required a separate remediation/control packet. WP-2.9C introduces no new product capability, Feature ID or permission.

WP-2.9A remains blocked until C is accepted. WP-2.9B remains inactive until A itself is accepted.

## Assigned responsibility

C owns only the remediation needed to make frozen FTR-089 true against an untrusted browser client:

1. exact TypeScript/PostgreSQL control-character parity;
2. trusted actual-byte PDF integrity proof;
3. bounded private staging and fail-closed promotion/recovery;
4. live authorization around trusted transitions;
5. exact runtime/CI evidence for the trusted HTTP/provider boundary;
6. preservation of accepted WP-2.9A and WP-2.8 Media behavior.

## Frozen architecture

### Browser/application

The browser may perform early validation/hash for UX and reservation semantics but is not trusted for authoritative byte integrity.

```text
local PDF validation/hash
→ reserve pending metadata
→ authenticated upload to bounded private Supabase staging
→ bodyless POST /api/private-document-promote on the same Cloudflare Pages origin
→ trusted promotion proof/copy/attestation/cleanup
→ independently authorized DB finalize pending → ready
```

### Bounded staging — ADR 0009

The staging bucket remains exactly `document-ingest-staging`:

- private;
- exact `file_size_limit=25000000`;
- MIME allowlist only `application/pdf`;
- no anonymous policy;
- no ordinary authenticated SELECT/UPDATE/DELETE;
- exactly one narrow authenticated INSERT path for a live pending private Document reservation;
- exact path `<project_id>/documents/<document_id>/original`;
- `upsert:false`.

Authenticated clients still have no ordinary canonical Document INSERT authority. Accepted Media policies remain unchanged.

### Trusted promotion compute — ADR 0010

The trusted promotion implementation is now one narrow Cloudflare Pages Function:

```text
POST /api/private-document-promote
```

It **replaces** the former Supabase `private-document-ingest` Edge Function. It is not a proxy in front of it.

Required migration invariant:

- remove `supabase/functions/private-document-ingest` from deployable code;
- remove its enabled function entry from `supabase/config.toml`;
- application code must stop invoking `supabase.functions.invoke("private-document-ingest", ...)`;
- runtime/source tests must prove the old promotion route is absent/not used;
- no second public promotion implementation may remain.

### Promotion ingress contract

Before any request-body read:

- only `POST` is accepted;
- `Transfer-Encoding` is rejected;
- `Content-Length` must be absent or exactly `0`;
- malformed/non-zero/ambiguous body framing is rejected;
- the handler never calls `arrayBuffer()`, `text()`, `json()`, `formData()` or otherwise consumes inbound promotion bytes;
- project/document identity remains bounded request metadata;
- real Wrangler/workerd evidence must keep a chunked sender open and receive rejection without sender EOF.

### Authentication and authorization

The browser sends its current Supabase user access token to the same-origin Pages Function.

The Function must:

1. reject missing/malformed authorization generically;
2. verify current user through Supabase Auth using the supplied user token, never caller-supplied user identity;
3. use live user/RLS authority for project/document access;
4. require `documents.write` before authoritative reservation use;
5. re-check `documents.write` immediately before the first privileged canonical mutation;
6. preserve independent authorization in DB finalization.

### Trusted byte proof

Preserve ADR-0009 proof strength:

- derive staging/canonical paths from authoritative Document state;
- require pending, active, ordinary-private, non-remote, non-deleted state;
- inspect authoritative staging metadata before materialization;
- require stored MIME exactly `application/pdf`;
- require exact reserved size and `1..25,000,000` bytes;
- bounded-read staged bytes;
- validate `%PDF-`;
- compute actual staged-byte SHA-256;
- require exact reserved digest/size;
- copy to canonical storage without overwrite;
- recover existing canonical object only after equally strong authoritative metadata + bounded byte proof;
- attest only after trusted canonical proof;
- clean staging server-side after trusted success and safely after invalid staging where appropriate;
- preserve independent finalization authorization.

### Server credentials

Production service/server credentials exist only as Cloudflare secret bindings. They are never bundled into Vite assets, committed, returned, or logged.

ADR 0010 does not authorize a paid dependency or general Cloudflare backend.

## AR-004 TypeScript/PostgreSQL parity

The canonical scalar-control predicate rejects:

```text
U+0000..U+001F
U+007F..U+009F
```

This remediation is implemented and green. Parent `WP29A-AR-004` remains formally open until C acceptance + A reverification.

## Security requirements

At minimum evidence applicable forms of:

- `SEC-AUTHZ-001..009`;
- `SEC-VAL-001/002/003/008`;
- `SEC-FILE-001/002/003/004/008/009`;
- `AUTHZ-001/002/005/007/008/018/020`;
- `SEC-ABUSE-001`;
- `SEC-NET-008`;
- secret/public-artifact safety.

## Review history

### Parent A findings assigned to C

- `WP29A-AR-004` — MAJOR/open in parent; implementation present in C, formal closure waits for C acceptance + A reverification.
- `WP29A-AR-005` — MAJOR/open in parent; trusted-byte implementation present in C, formal closure waits for C acceptance + A reverification.

### Fresh C Pass B findings

Fresh review of `e4efa0b74ffd5708d9888ff23e13174ec2032c68` / CI `34909259741` found:

- `WP29C-AR-001` MAJOR — ingress work sender-EOF dependent;
- `WP29C-AR-002` MAJOR — canonical recovery Blob-first buffering;
- `WP29C-AR-003` MAJOR — missing/empty stored MIME accepted;
- `WP29C-AR-004` MINOR — wildcard CORS.

Durable review failure: `54ccc8865ea67a4835a7627b14739c3eaac53f5a` / CI `34910156654`.

### ADR-0009 implementation evidence

Quality-preserving implementation head:

`a8ee1db32bfa41b40d4fcd5dd841146f97676881` / CI `34975265838`:

- Core quality/security: PASS;
- Browser/mutation: PASS;
- Privacy-safe preview: PASS;
- DB/RLS: PASS — 80 files / 1382 tests;
- staging RLS/canonical bypass: PASS;
- malformed JWT denial: PASS;
- bodyless promotion/retry/recovery/ready-state denial: PASS;
- finalization reauthorization: PASS;
- poisoned canonical recovery: PASS/fail-closed;
- exact `25,000,000`-byte staging/promotion: PASS;
- AR-002 source/live remediation: PASS;
- AR-003 source/live remediation: PASS;
- AR-004 CORS remediation: PASS;
- AR-001: FAIL — `Public promotion endpoint waited for sender EOF on a framed body.`

Blocked-state documentation `52572b24bba83a2aadb22c80f2764c92875219f1` / CI `34975858942` reproduced the same single security RED while Core/browser/preview/DB stayed green.

## Architecture-blocker resolution history

- ADR 0010 initially proposed: `d6beb3c8fa9d68b8ee88e3472db0f3744dd1a7e9`.
- blocker record opened: `173baa83fd6592aefd45da4f933d72f17f09aceb`.
- blocked implementation cursor: `52572b24bba83a2aadb22c80f2764c92875219f1`.
- packet record synchronized blocked: `ae45fe740c59774f5da86cc54bc49e449f5c6749`.
- ADR 0010 accepted: `c369e33541dcb984e15f690a254992d0b7149830`.
- ADR 0001 narrowly amended: `f1869cd6b4751d579d34262f8efa0392a2fdcdfc`.
- blocker record marked resolved: `7c355b472cbf8e060736bb7eb302f4ed4862d8d1`.
- implementation-status resume cursor: `54f2bdc4a7419062d6279004138c9c14f0be0f36`.

ADR 0010 resolves the **design dependency**. It does not close AR-001; AR-001 remains the implementation RED target.

## RED-first contract for current pass

Before production migration, focused tests must fail for exactly the still-unimplemented ADR-0010 boundary:

1. application promotion adapter must target same-origin `/api/private-document-promote` with no body rather than Supabase Functions;
2. deployable Supabase configuration/source must not retain `private-document-ingest` after GREEN;
3. real Pages/Workers runtime must reject an intentionally open-ended framed sender before EOF;
4. non-zero `Content-Length` must be rejected before body consumption;
5. all existing staging/auth/integrity/recovery/finalization scenarios must remain represented and must not be deleted to obtain green.

The initial RED may include missing Pages Function/runtime infrastructure. Production removal/porting begins only after those failures are isolated to this boundary.

## Verification contract after GREEN

### Application

- same-origin promotion call with current user authorization and no body;
- no Supabase Functions invocation for private-document promotion;
- existing local PDF/hash/reservation/finalization behavior preserved.

### Storage

- exact 25,000,000 staging succeeds;
- 25,000,001 rejected before promotion;
- wrong MIME rejected;
- writer-only exact pending staging path;
- viewer/outsider/revoked/project substitution/non-pending denied;
- staging SELECT/UPDATE/DELETE denied;
- canonical client Document INSERT denied;
- Media behavior unchanged.

### Pages Function/runtime

- open-ended framed sender rejected without sender EOF;
- direct old Supabase promotion route absent/not used;
- missing/invalid JWT denied;
- outsider/project-B/revoked/downgraded denied;
- authoritative reservation/path derivation;
- exact staged-byte signature/size/SHA proof;
- bounded canonical recovery;
- authoritative stored MIME proof;
- poisoned staging/canonical fail closed;
- role revocation before promotion/finalization fails closed;
- project/document-bound cleanup;
- same-origin/no wildcard CORS;
- no secrets/private bytes/private filename in logs/artifacts;
- exact 25 MB successful path feasible on intended Workers/Pages Free runtime.

If the intended Free runtime cannot safely satisfy the exact 25 MB proof, C returns to `BLOCKED` rather than enabling paid infrastructure or shrinking the file contract silently.

### CI / review

- exact-head CI and clean full verification after implementation;
- real local Pages/Workers runtime evidence, not only handler mocks;
- then complete fresh independent Pass B over the whole packet;
- any BLOCKING/MAJOR finding returns to remediation;
- only clean Pass B may advance to Pass C;
- only Pass C may mark C accepted.

## Explicit non-goals

- no UI/presentation work;
- no document versioning or contract-readiness workflow;
- no generic Cloudflare API/backend;
- no D1/R2/KV application datastore;
- no new permission key;
- no signed-URL product flow;
- no offline pending-file queue;
- no automatic deduplication;
- no change to 25 MB PDF contract without separate approved scope decision;
- no real/private wedding data.

## State / sequencing

Current state: **IN_PROGRESS / A-IMPLEMENT — RED FIRST**.

Current gate:

1. ADR 0010 is accepted and architecture blocker is resolved;
2. add focused **test-only RED** for Pages Function migration/runtime/direct-origin absence;
3. confirm RED is isolated to the intended boundary;
4. implement Pages Function and remove the old Supabase promotion Edge Function;
5. port/preserve all existing security scenarios;
6. prove exact 25 MB Free-runtime feasibility;
7. exact-head CI/full verification;
8. complete fresh independent Pass B;
9. only clean Pass B may advance to Pass C;
10. only after C ACCEPTED may WP-2.9A resume;
11. WP-2.9B remains `PLANNED / AFTER A` until A is accepted.

## Deviations

No security-contract deviation is authorized. ADR 0010 is accepted; AR-001 remains open until implementation evidence closes it.
