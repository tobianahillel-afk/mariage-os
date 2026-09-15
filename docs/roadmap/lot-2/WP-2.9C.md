# WP-2.9C — Trusted private-document ingestion hardening

## Identity

- Work Packet ID: `WP-2.9C`
- Lot: `2`
- Name: Trusted private-document ingestion hardening
- State: `BLOCKED`
- Current/next pass: `ARCHITECTURE-DECISION`
- Primary bounded context: Documents — authoritative binary ingress for the existing WP-2.9A private PDF lifecycle
- Branch/PR: `lot-2/venues-core` / Lot-2 integration PR not opened yet
- FIR: `#17 / FTR-089`
- Parent review failure: `WP-2.9A / WP29A-AR-004 + WP29A-AR-005`
- Current accepted transport architecture: `ADR 0009 — Bounded private-document staging`
- Proposed blocker-resolution architecture review: `ADR 0010 — Private-document promotion ingress termination boundary`
- Durable blocker record: `docs/roadmap/lot-2/WP-2.9C-BLOCKER.md`
- Size: **10 points**; explicit cohesion review **PASS**

## Current packet verdict

WP-2.9C is **not acceptable yet**.

ADR 0009 remediation is implemented and real-runtime evidence closes the previously open recovery, stored-MIME and CORS defects at the implementation level. One MAJOR security finding remains:

- `WP29C-AR-001` — **MAJOR / OPEN / ARCHITECTURE BLOCKER**: both the direct local Supabase Edge Runtime and the public local Supabase gateway wait for an intentionally open-ended framed request to reach sender EOF before application code can terminate it.

The promotion handler itself does not consume request bytes and rejects body-framing headers before any application body read. The remaining defect exists earlier in the request pipeline: the request is not dispatched early enough for that rejection to terminate an open sender.

Under `AI-LOT-ORCHESTRATION.md`, this is an external/design/security dependency and therefore requires:

```text
ANY NON-TERMINAL STATE
→ BLOCKED
```

No test may be weakened to make the packet green. No new proxy, Worker, queue/event trigger or other backend boundary may be introduced without an explicitly accepted architecture decision.

## Why this packet exists

Fresh adversarial review of WP-2.9A found two MAJOR defects:

- `WP29A-AR-004`: TypeScript document text/filename validation missed Unicode C1 controls U+0080..U+009F that PostgreSQL 17 rejects through `[[:cntrl:]]`.
- `WP29A-AR-005`: the direct authenticated Storage path could commit `ready` metadata without proving that the actual stored bytes matched reserved SHA-256/size/MIME.

WP-2.9A was already a 10-point packet, so repository sizing rules required a separate remediation/control packet rather than silent scope expansion. WP-2.9C introduces no new product capability, Feature ID or permission.

WP-2.9A remains blocked until C is accepted. After C acceptance, A returns to `IN_PROGRESS` for integration/reverification and a fresh Pass B. WP-2.9B remains inactive until A itself is accepted.

## Complexity / cohesion review

| Change type | Points |
|---|---:|
| authenticated trusted promotion boundary | 2 |
| changed Storage/privileged authorization boundary | 2 |
| Supabase Edge Function/provider runtime integration | 3 |
| forward-only migration/policy hardening family | 1 |
| security-sensitive exact-byte SHA-256 integrity boundary | 2 |
| **Total** | **10** |

Cohesion: **PASS**. Staging, Storage lock-down, trusted promotion, exact-byte verification, recovery and finalization evidence form one atomic trust boundary. Splitting them into independently shippable states would recreate either an integrity bypass or an unusable Document flow.

## Assigned responsibility

C owns only the remediation necessary to make the already-frozen FTR-089 Lot-2 Document foundation true against an untrusted browser client:

1. close `WP29A-AR-004` with exact Unicode-control parity;
2. close `WP29A-AR-005` with trusted actual-byte ingestion/verification;
3. preserve all already-accepted WP-2.9A behavior and WP-2.8 Media behavior;
4. add the minimum runtime/CI/deployment evidence required by the trusted boundary.

No product requirement is newly added. Current responsibility remains under `FTR-089`, `MED-002`, `MED-003`, `MED-010`, the interrupted-upload validity invariant, and packet-applicable `SEC-VAL-*`, `SEC-FILE-*`, `SEC-AUTHZ-*`, `SEC-ABUSE-*` and `SEC-NET-*` controls.

## Architecture history

### ADR 0008 — original trusted-ingest boundary

ADR 0008 introduced the server-trust requirement:

- current user/JWT must be authenticated;
- live project/document authorization must be resolved server-side;
- canonical path must derive from authoritative Document state;
- actual PDF bytes must be independently validated and SHA-256 verified;
- authenticated clients must not directly create canonical Document objects;
- existing canonical-object recovery must be fail-closed;
- service credentials must remain server-only;
- finalization must independently reauthorize.

Fresh review later proved that raw PDF request-body transport could not provide the required bounded ingress/resource contract in the Supabase Edge runtime.

### ADR 0009 — current accepted transport architecture

ADR 0009 supersedes only the raw PDF Edge request-body transport from ADR 0008. The current flow is:

```text
browser local validation/hash
→ reserve pending document metadata
→ authenticated INSERT into bounded private staging bucket
→ bodyless authenticated promotion request
→ live auth + authoritative reservation/staging inspection
→ bounded server reread + PDF signature + exact size/SHA proof
→ privileged no-overwrite copy to canonical project-private
→ service-only ingest attestation
→ independent DB finalize pending → ready
→ server staging cleanup
```

### Staging bucket contract

The staging bucket is exactly `document-ingest-staging` and must remain:

- `public=false`;
- exact `file_size_limit=25000000`;
- MIME allowlist only `application/pdf`;
- no anonymous policy;
- no ordinary authenticated SELECT/UPDATE/DELETE;
- exactly one narrow authenticated INSERT path for a live pending private Document reservation;
- exact path `<project_id>/documents/<document_id>/original`;
- `upsert:false`.

The browser never receives service credentials and never receives ordinary canonical Document INSERT authority.

### Bodyless promotion contract

The trusted promotion boundary must:

- require valid JWT/current user;
- accept only project/document target identifiers;
- never accept caller-provided storage path or user identity as authority;
- perform live `documents.write` authorization before trusted reservation use and immediately before the first privileged canonical mutation;
- derive staging/canonical paths from authoritative Document state;
- require pending, active, ordinary-private, non-remote, non-deleted state;
- inspect authoritative staging metadata before materialization;
- require stored MIME exactly `application/pdf`;
- require exact reserved size and size `1..25,000,000`;
- bounded-read the staged object;
- validate `%PDF-`;
- compute actual staged-byte SHA-256 and require exact reserved digest/size equality;
- copy only trusted bytes/provider object to canonical storage without overwrite;
- recover an existing canonical object only after equally strong authoritative metadata + bounded byte proof;
- attest only after trusted canonical proof;
- clean staging server-side after trusted success and safely after invalid staging where appropriate;
- preserve independent finalization authorization;
- emit explicit/minimal CORS;
- log no secrets, private bytes, private filename or unnecessary digest data.

### AR-004 TypeScript/PostgreSQL parity

The canonical scalar-control predicate must reject:

```text
U+0000..U+001F
U+007F..U+009F
```

This remediation is implemented and remains green in unit/provider evidence. Parent `WP29A-AR-004` remains formally open until C is accepted and A is reverified.

## Security requirements

At minimum the packet must evidence applicable forms of:

- `SEC-AUTHZ-001..009`, especially endpoint/Storage bypass resistance;
- `SEC-VAL-001`, `SEC-VAL-002`, `SEC-VAL-003`, `SEC-VAL-008`;
- `SEC-FILE-001`, `SEC-FILE-002`, `SEC-FILE-003`, `SEC-FILE-004`, `SEC-FILE-008`, `SEC-FILE-009`;
- `AUTHZ-001`, `AUTHZ-002`, `AUTHZ-005`, `AUTHZ-007`, `AUTHZ-008`, `AUTHZ-018`, `AUTHZ-020`;
- `SEC-ABUSE-001` for bounded expensive-upload/request resource consumption;
- `SEC-NET-008` for explicit/minimal CORS;
- secret handling/public-artifact safety for the trusted runtime.

The service/secret key exists only in the trusted runtime environment. It is never bundled in the Vite app, committed in Git, returned to the client or logged.

## Review history

### Parent WP-2.9A findings assigned to C

- `WP29A-AR-004` — **MAJOR / OPEN in parent** — C1 control-character parity. Remediation implemented in C; parent closure waits for C acceptance + A reverification.
- `WP29A-AR-005` — **MAJOR / OPEN in parent** — committed ready truth not bound to actual stored-byte integrity. Trusted-byte remediation implemented in C; parent closure waits for C acceptance + A reverification.

### Initial C review

The original Edge implementation used full request buffering. Fresh Pass B found `WP29C-AR-001` MAJOR and C returned to remediation.

### Fresh post-remediation Pass B

Reviewed transition head `e4efa0b74ffd5708d9888ff23e13174ec2032c68`, CI `34909259741` — **5/5 SUCCESS**, clean-checkout included.

It found:

- `WP29C-AR-001` — MAJOR — request ingress/read work remained sender-EOF dependent;
- `WP29C-AR-002` — MAJOR — canonical recovery fully buffered before size rejection;
- `WP29C-AR-003` — MAJOR — canonical recovery accepted missing/empty provider MIME;
- `WP29C-AR-004` — MINOR — wildcard CORS did not satisfy explicit/minimal policy.

Durable review failure: `54ccc8865ea67a4835a7627b14739c3eaac53f5a` / CI `34910156654` — **5/5 SUCCESS**, clean-checkout included.

## Current finding disposition

### `WP29C-AR-001` — MAJOR / OPEN / ARCHITECTURE BLOCKER

Current ADR-0009 promotion is logically bodyless. The handler rejects `transfer-encoding` and non-zero/invalid `content-length` before any application body read and does not consume untrusted request bytes.

Real runtime evidence nevertheless proves that both tested Supabase request paths wait for an intentionally open-ended framed sender to reach EOF before the handler can terminate it:

- direct runtime evidence: CI `34973827681`;
- public local Supabase gateway evidence: CI `34974264827`;
- quality-preserving exact implementation head `a8ee1db32bfa41b40d4fcd5dd841146f97676881` / CI `34975265838`;
- durable blocked-state documentation head `52572b24bba83a2aadb22c80f2764c92875219f1` / CI `34975858942` reproduces the same single Edge failure.

The exact failure remains:

```text
WP29C-AR-001: Public promotion endpoint waited for sender EOF on a framed body.
```

The current Supabase Edge documentation checked on 2026-09-15 publishes runtime limits including a 150-second request idle timeout, but no maximum inbound request-body size usable as the required EOF-independent ingress boundary. The timeout is finite but does not satisfy `SEC-FILE-004` / `SEC-ABUSE-001` because work can still depend on an attacker keeping the sender open until the provider timeout.

Resolution requires an explicitly accepted ingress termination architecture. ADR 0010 is `Proposed` and intentionally chooses no option yet.

### `WP29C-AR-002` — remediation implemented / runtime-green

Canonical recovery now uses authoritative metadata and bounded streaming rather than Blob-first full materialization. Source and live adversarial contracts pass. Formal closure waits for unblock + complete fresh Pass B.

### `WP29C-AR-003` — remediation implemented / runtime-green

Recovery now fails closed unless authoritative stored MIME is exactly `application/pdf`, while still proving signature, size and hash. Source and live adversarial contracts pass. Formal closure waits for unblock + complete fresh Pass B.

### `WP29C-AR-004` — remediation implemented / runtime-green

CORS is explicit/minimal and positive/negative runtime evidence passes. Formal closure waits for unblock + complete fresh Pass B.

## Exact implementation evidence

Quality-preserving implementation/refactor head before blocked-state documentation:

`a8ee1db32bfa41b40d4fcd5dd841146f97676881`

CI `34975265838`:

- Core quality and security: **PASS**;
- Browser and mutation harnesses: **PASS**;
- Privacy-safe preview artifact: **PASS**;
- DB/RLS: **PASS**, `80` files / `1382` tests;
- staging RLS/canonical bypass denial: **PASS**;
- malformed JWT denial: **PASS**;
- bodyless promotion, retry/recovery and ready-state denial: **PASS**;
- finalization reauthorization: **PASS**;
- poisoned canonical recovery: **PASS / fail-closed**;
- exact `25,000,000`-byte staging and promotion: **PASS**;
- `WP29C-AR-002` source/live remediation contracts: **PASS**;
- `WP29C-AR-003` source/live remediation contracts: **PASS**;
- `WP29C-AR-004` CORS remediation contract: **PASS**;
- `WP29C-AR-001`: **FAIL / expected blocker evidence**.

Blocked-state documentation head:

`52572b24bba83a2aadb22c80f2764c92875219f1`

CI `34975858942`:

- Core quality/security: **PASS**;
- Browser/mutation: **PASS**;
- Privacy-safe preview: **PASS**;
- DB/RLS: **PASS**, `80` files / `1382` tests;
- all ADR-0009 Edge checks pass except the same AR-001 EOF-dependent ingress test;
- full clean-checkout verify is skipped because the intentional security RED keeps the Edge job failed.

This is a known blocked-state RED, not a regression to be suppressed.

## Verification contract after architecture unblock

After an ingress termination architecture is accepted, C must return `BLOCKED → IN_PROGRESS` and prove all of the following before another review transition:

### Domain/application

- U+0080/U+0085/U+009F rejected in bounded text/private filename paths;
- scalar-limit, surrogate, trim, PDF and SHA boundaries remain green;
- application stages via the typed trusted-ingest path, not direct canonical Document upload;
- recovery/cleanup semantics remain exact-path and fail-closed.

### Staging / Storage

- exact `25,000,000` bytes staging succeeds;
- `25,000,001` rejected by Storage before promotion;
- wrong MIME rejected by Storage;
- writer can insert only exact pending private path;
- viewer/outsider/revoked/project substitution/non-pending denied;
- staging SELECT/UPDATE/DELETE denied;
- canonical client Document INSERT denied;
- accepted Media behavior unchanged.

### Promotion/runtime

- promotion request is bodyless;
- a framed/open-ended sender receives deterministic rejection without sender EOF at the accepted ingress termination layer;
- direct-origin bypass of that layer is impossible or equivalently bounded;
- missing/invalid JWT denied;
- outsider/project-B/revoked/downgraded denied;
- authoritative reservation/path derivation preserved;
- exact staged-byte signature/size/SHA proof preserved;
- bounded canonical recovery preserved;
- authoritative stored MIME proof preserved;
- poisoned staging/canonical fail closed;
- role revocation before promotion/finalization fails closed;
- project/document-bound cleanup preserved;
- explicit/minimal CORS preserved;
- no secrets/private bytes/private filename in logs/artifacts;
- exact 25 MB successful end-to-end path remains feasible.

### CI / review

- exact-head CI after implementation;
- complete real-runtime integration/adversarial harness;
- then a **fresh independent Pass B over the complete packet**, not only patched lines;
- any BLOCKING/MAJOR finding returns to remediation;
- only clean Pass B may advance to Pass C;
- only Pass C may mark WP-2.9C `ACCEPTED`.

## Explicit non-goals

- no UI/presentation work;
- no document versioning or contract-readiness workflow;
- no generic upload gateway for Media/import/backup;
- no new permission key;
- no signed-URL product flow;
- no offline pending-file queue;
- no automatic deduplication;
- no change to the 25 MB PDF product contract without separate approved scope decision;
- no real/private wedding data.

## Activation / gate history

- WP-2.9A durable AR-004/005 failure: `a58417f79e59e2bd2d2fcb4d202f568c15cfa947` / `34854785427` — **5/5 SUCCESS**.
- ADR 0008 + C split/READY: `d1e561c787798eb99f49024cc0c1db49880bcd82` / `34862521697` — **5/5 SUCCESS**.
- Initial Pass-A: `d90a643d929c35ef84444c19b7ec02ad9cd9e5a8` / `34896641824` — **5/5 SUCCESS**.
- Initial REVIEW_PENDING: `95e5a1c2c1bccc292787b745c3ca112a3f22a39b` / `34898586925` — **5/5 SUCCESS**.
- First AR-001 remediation: `264a504e4bc8208d9ff762ef71e90bea6d18216e` / `34905438530` — **5/5 SUCCESS**.
- Fresh-review transition: `e4efa0b74ffd5708d9888ff23e13174ec2032c68` / `34909259741` — **5/5 SUCCESS**.
- Durable Pass-B failure: `54ccc8865ea67a4835a7627b14739c3eaac53f5a` / `34910156654` — **5/5 SUCCESS**.
- ADR-0009 bounded-staging implementation began at `3ed4bafe7fc1bcb2dc5d2ba506d472b288ac06cb`.
- Bodyless runtime fix: `ee85d747510a36b559f6fcecbf433dfe4beeabde`.
- Public-gateway adversarial test: `f45c322c6da7765f09a6a9607c898003af85ce00`.
- Quality/harness exact implementation head: `a8ee1db32bfa41b40d4fcd5dd841146f97676881` / `34975265838`.
- Proposed ADR 0010: `d6beb3c8fa9d68b8ee88e3472db0f3744dd1a7e9`.
- Durable blocker record: `173baa83fd6592aefd45da4f933d72f17f09aceb`.
- Implementation status blocked cursor: `52572b24bba83a2aadb22c80f2764c92875219f1` / `34975858942`.

## State / sequencing

Current state: **BLOCKED**.

Current/next pass: **ARCHITECTURE-DECISION**.

Only permitted next action:

1. review proposed ADR 0010 and choose/accept an ingress termination architecture that can act before arbitrary request-body drain;
2. prove the accepted design closes direct-origin/bypass risk and preserves the zero-cost/operational constraints that remain applicable;
3. only after the architecture is accepted, transition C `BLOCKED → IN_PROGRESS`;
4. implement the accepted boundary without weakening AR-001 evidence;
5. require exact-head CI and real-runtime proof;
6. run a complete fresh Pass B;
7. only after clean Pass B may Pass C begin;
8. only after C is `ACCEPTED` may WP-2.9A resume;
9. WP-2.9B remains `PLANNED / AFTER A` until A is accepted.

Forbidden while blocked:

- weakening/deleting the open-ended sender test;
- treating the 150-second provider timeout as AR-001 closure;
- adding a Cloudflare Worker/Pages Function, proxy, queue/event trigger or other backend silently;
- resuming WP-2.9A;
- activating WP-2.9B;
- advancing C to Pass B or Pass C.

## Deviations

No security-contract deviation is authorized. ADR 0010 is `Proposed`, not accepted.
