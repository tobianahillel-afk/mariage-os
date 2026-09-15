# WP-2.9C — Trusted private-document ingestion hardening

## Identity

- Work Packet ID: `WP-2.9C`
- Lot: `2`
- State: `REVIEW_FAILED`
- Current pass: `B-ADVERSARIAL-REVIEW — FAILED; remediation next`
- Primary bounded context: Documents — trusted binary promotion for the existing WP-2.9A private PDF lifecycle
- Branch: `lot-2/venues-core`
- FIR: `#17 / FTR-089`
- Parent review findings: `WP29A-AR-004 + WP29A-AR-005`
- Architecture chain: ADR 0008 trust/integrity → ADR 0009 bounded staging/bodyless promotion → ADR 0010 Cloudflare Pages Function promotion boundary
- Historical architecture blocker: `docs/roadmap/lot-2/WP-2.9C-BLOCKER.md` — resolved by ADR 0010
- Fresh Pass-B review: `docs/roadmap/lot-2/WP-2.9C-PASS-B-REVIEW.md`
- Size: **10 points**; cohesion review **PASS**

## Current verdict

Pass A completed successfully, but the required fresh Pass B found three unresolved MAJOR findings. WP-2.9C is therefore **REVIEW_FAILED** and is not accepted.

Pass-A implementation evidence:

- head `297ecdf3337e8522d6f200a90f96b481a9e6bdb1`;
- CI `34996240637` — **5/5 SUCCESS**, clean-checkout included.

Review-pending governance evidence:

- head `e0854afb62cf5fcf834792fbad425d013b02af56`;
- CI `34997963836` — **5/5 SUCCESS**, clean-checkout included.

Fresh Pass-B review record:

- `docs/roadmap/lot-2/WP-2.9C-PASS-B-REVIEW.md`;
- durable finding record commit `deaa2432327b9512068a75635dde6f4c522467ad`.

## Fresh Pass-B findings

### WP29C-AR-005 — MAJOR — interrupted staging/abandon cleanup and promotion race

The current product recovery path does not clean `document-ingest-staging` when staging succeeds but promotion does not complete. `PrivateDocumentService.abandon()` and `manage_private_document(... abandon_upload ...)` reason only about canonical `project-private`; the browser intentionally has no staging DELETE; trusted staging cleanup currently occurs only after successful promotion/attestation.

This permits private staged bytes to survive a clean metadata abandon and can wedge a later deterministic path retry. A concurrent abandon can also delete the pending reservation after promotion's initial reservation read but before canonical copy; promotion rechecks permission but not reservation state immediately before that mutation, so canonical/staging orphan divergence can remain when attestation subsequently fails.

Required remediation:

- trusted project/document-bound idempotent cleanup/abandon;
- exact staging/canonical absence proof before metadata abandon completes;
- retry/response-loss safety;
- no ability to delete ready documents, other project/document objects or Media;
- authoritative reservation-state recheck immediately before privileged canonical mutation;
- focused RED/runtime coverage for interrupted staging, abandon/retry/unwedge and concurrent abandon/promotion.

### WP29C-AR-006 — MAJOR — Workers Free exact-25-MB CPU feasibility is not evidenced

ADR 0010 freezes exact 25 MB promotion on the intended Workers/Pages **Free** operating envelope as an acceptance gate. Current CI proves exact 25 MB only in local Miniflare/workerd. Cloudflare documents that CPU limits are enforced on the deployed network, not local development, so the current green harness does not prove the Free 10 ms CPU entitlement is sufficient.

Required remediation:

- durable CPU-specific evidence representative of the Workers runtime and exact 25 MB path;
- no paid entitlement and no reduced file contract may be silently substituted;
- if the Free envelope cannot be safely established, transition WP-2.9C to `BLOCKED` and revisit architecture.

### WP29C-AR-007 — MAJOR — deployment/secret operations not reconciled

ADR 0010 requires release/deployment documentation for Pages Function deployment, Cloudflare secret bindings, fail-closed `/api/private-document-promote`, static behavior preservation and legacy Supabase promotion-route removal. Current normative release docs still describe a static production application and do not contain the required concrete secret inventory/rotation record for the new `PRIVATE_DOCUMENT_ADMIN_KEY` binding.

Required remediation:

- update normative deployment/release/secret contracts;
- record metadata-only secret owner/storage/scope/rotation/revocation/verification;
- add fail-closed production smoke expectations;
- ensure Pages Function deployment and legacy-route absence are explicit;
- keep all secret values out of Git, browser assets, preview artifacts and logs.

## Historical C findings

The fresh review did not find evidence reopening these implementation remediations, but formal closure still waits for a later clean fresh Pass B after AR-005/006/007 remediation:

- `WP29C-AR-001` — raw-body EOF dependence: remediation runtime-green under ADR 0010;
- `WP29C-AR-002` — bounded canonical recovery: remediation source/live-green;
- `WP29C-AR-003` — authoritative stored MIME: remediation source/live-green;
- `WP29C-AR-004` — wildcard CORS: remediation runtime-green.

Historical fresh-review failure for AR-001..004: `54ccc8865ea67a4835a7627b14739c3eaac53f5a` / CI `34910156654`.

## Why this packet exists

Fresh adversarial review of WP-2.9A found:

- `WP29A-AR-004`: TypeScript document text/filename validation missed Unicode C1 controls U+0080..U+009F rejected by PostgreSQL;
- `WP29A-AR-005`: direct authenticated Storage ingress could commit `ready` metadata without trusted proof that actual stored bytes matched reserved SHA-256/size/MIME.

WP-2.9A was already a 10-point packet, so remediation is isolated here. WP-2.9C adds no product Feature ID or permission key.

WP-2.9A remains blocked until C is accepted. WP-2.9B remains inactive until A is accepted.

## Assigned responsibility

WP-2.9C owns only the remediation/control boundary needed to make FTR-089 correct against an untrusted browser:

1. TypeScript/PostgreSQL C1-control parity;
2. trusted actual-byte PDF integrity proof;
3. bounded private staging and fail-closed promotion/recovery/cleanup;
4. live authorization around trusted transitions;
5. exact runtime/CI evidence for the trusted provider boundary;
6. operational/deployment proof for that boundary;
7. preservation of accepted WP-2.9A and WP-2.8 Media behavior.

## Frozen architecture

Browser/application flow:

```text
local PDF validation/hash
→ reserve pending metadata
→ authenticated upload to bounded private Supabase staging
→ bodyless same-origin Pages promotion
→ live authorization + authoritative staging proof
→ privileged canonical copy/recovery
→ service-only ingest attestation
→ trusted staging cleanup
→ independently authorized DB finalize pending → ready
```

Staging bucket remains exactly `document-ingest-staging`:

- private;
- `file_size_limit=25000000` exactly;
- only `application/pdf`;
- no anonymous policy;
- no ordinary authenticated SELECT/UPDATE/DELETE;
- one narrow authenticated INSERT for an exact live pending Document path;
- `upsert:false`.

Trusted promotion route remains:

```text
POST /api/private-document-promote
```

The old Supabase `private-document-ingest` Edge Function remains removed from deployable source/config/application flow.

Promotion must remain bodyless, validate current Supabase user authority, derive paths from authoritative state, re-check `documents.write` immediately before privileged canonical mutation, independently verify staged MIME/size/PDF signature/SHA-256, avoid overwrite, fail closed on poisoned recovery, attest only after canonical proof, and preserve independent finalization authorization.

## C1 parity

The shared scalar-control rule rejects:

```text
U+0000..U+001F
U+007F..U+009F
```

That remediation remains green. Parent `WP29A-AR-004` remains formally open until C acceptance and A reverification.

## Security controls

At minimum retain evidence for applicable forms of:

- `SEC-AUTHZ-001..009`;
- `SEC-VAL-001/002/003/008`;
- `SEC-FILE-001/002/003/004/008/009`;
- `AUTHZ-001/002/005/007/008/018/020`;
- `SEC-ABUSE-001`;
- `SEC-NET-008`;
- secret/public-artifact safety.

## Existing exact-head implementation evidence

The Pass-A head `297ecdf3337e8522d6f200a90f96b481a9e6bdb1` proved:

- core quality/security, browser/mutation, DB/RLS/Pages Function, preview and clean-checkout verification green;
- static gates and 100% unit coverage thresholds retained;
- staging bucket/RLS/canonical bypass controls green;
- same-origin bodyless promotion green;
- old Supabase promotion implementation absent;
- real Wrangler/workerd open-ended framed-body rejection without sender EOF green;
- staged/canonical exact-byte proof, stored MIME, recovery and poisoned-object failure green;
- authorization/revocation and finalization reauthorization green;
- exact 25,000,000-byte **local runtime path** green;
- CORS and public-artifact secret scans green.

Pass B specifically invalidates the claim that local 25 MB success alone proves the Workers Free CPU operating envelope.

## Explicit non-goals

- no UI/presentation work;
- no document versioning or contract-readiness workflow;
- no general Cloudflare backend;
- no D1/R2/KV application datastore;
- no new permission key;
- no signed-upload product flow;
- no offline pending-file queue;
- no automatic deduplication;
- no silent change to the 25 MB PDF contract;
- no real/private wedding data.

## State / sequencing

Current state: **REVIEW_FAILED**.

Current gate:

1. fresh Pass B failed on AR-005/006/007;
2. next permitted transition is `REVIEW_FAILED → IN_PROGRESS` when remediation starts;
3. implement focused RED/evidence first, then remediation, without weakening frozen contracts or quality thresholds;
4. obtain exact-head full CI + clean-checkout evidence;
5. transition back to `REVIEW_PENDING`;
6. run another complete fresh independent/adversarial Pass B over the whole packet and all seven findings;
7. BLOCKING/MAJOR → `REVIEW_FAILED` again;
8. only a clean Pass B may enter `ACCEPTANCE_PENDING`;
9. only Pass C may mark WP-2.9C `ACCEPTED`;
10. only after C acceptance may WP-2.9A resume integration/reverification/fresh Pass B;
11. WP-2.9B remains `PLANNED / AFTER A`.

## Deviations

No security-contract deviation is authorized.