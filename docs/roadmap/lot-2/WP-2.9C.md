# WP-2.9C — Trusted private-document ingestion hardening

## Identity

- Work Packet ID: `WP-2.9C`
- Lot: `2`
- State: `IN_PROGRESS`
- Current pass: `REMEDIATION — AR-005 / AR-006 / AR-007`
- Primary bounded context: Documents — trusted binary promotion for the existing WP-2.9A private PDF lifecycle
- Branch: `lot-2/venues-core`
- FIR: `#17 / FTR-089`
- Parent review findings: `WP29A-AR-004 + WP29A-AR-005`
- Architecture chain: ADR 0008 trust/integrity → ADR 0009 bounded staging/bodyless promotion → ADR 0010 Cloudflare Pages Function promotion boundary
- Historical architecture blocker: `docs/roadmap/lot-2/WP-2.9C-BLOCKER.md` — resolved by ADR 0010
- Fresh Pass-B review: `docs/roadmap/lot-2/WP-2.9C-PASS-B-REVIEW.md`
- Size: **10 points**; cohesion review **PASS**

## Current verdict

Pass A completed successfully. The required fresh Pass B then found three unresolved MAJOR findings, producing a durable `REVIEW_FAILED` state. Remediation has now started, so the canonical state is **IN_PROGRESS / REMEDIATION**. WP-2.9C is not accepted.

Pass-A implementation evidence:

- head `297ecdf3337e8522d6f200a90f96b481a9e6bdb1`;
- CI `34996240637` — **5/5 SUCCESS**, clean-checkout included.

Review-pending governance evidence:

- head `e0854afb62cf5fcf834792fbad425d013b02af56`;
- CI `34997963836` — **5/5 SUCCESS**, clean-checkout included.

Fresh Pass-B failure record:

- `docs/roadmap/lot-2/WP-2.9C-PASS-B-REVIEW.md`;
- finding record `deaa2432327b9512068a75635dde6f4c522467ad`;
- packet REVIEW_FAILED record `d7fd7ae94792600d5d50afb51a7e6c96487e93a9`;
- matrix REVIEW_FAILED record `f0ad5fab0d46a526a726028c7805b78bdb43b1d9`.

## Current remediation findings

### WP29C-AR-005 — MAJOR — interrupted staging/abandon cleanup and promotion race

Current product recovery can remove pending DB metadata while leaving `document-ingest-staging` bytes behind because application/DB abandon reasons only about canonical `project-private`, the browser intentionally lacks staging DELETE, and trusted staging cleanup currently occurs only after successful promotion/attestation.

A concurrent abandon can also remove the pending reservation after promotion's initial read but before canonical copy. Promotion rechecks permission but not reservation state at that exact mutation boundary, so canonical/staging orphan divergence can remain when attestation subsequently fails.

Remediation requirements:

- trusted project/document-bound idempotent cleanup/abandon in the existing narrow Pages security boundary;
- no ordinary browser staging DELETE;
- exact staging/canonical absence proof before metadata abandon completes;
- retry/response-loss safety;
- no deletion of ready documents, another project/document or Media;
- authoritative reservation-state recheck immediately before privileged canonical mutation;
- compensating cleanup for post-copy failure paths that would otherwise orphan canonical data;
- focused RED/runtime coverage for interrupted staging, clean abandon/retry/unwedge and abandon↔promotion races.

### WP29C-AR-006 — MAJOR — Workers Free exact-25-MB CPU feasibility is not evidenced

ADR 0010 freezes exact 25 MB promotion on the intended Workers/Pages Free operating envelope as an acceptance gate. Current exact-25-MB CI evidence is local Miniflare/workerd only; deployed Free CPU enforcement is not represented by that local success.

Remediation requirements:

- produce durable CPU-specific evidence representative of Workers runtime behavior for the exact 25 MB trusted proof;
- distinguish CPU from wall/network time;
- do not silently enable paid compute or lower the PDF contract;
- if the Free envelope cannot be safely established, transition WP-2.9C to `BLOCKED` and revisit architecture.

### WP29C-AR-007 — MAJOR — deployment/secret operations not reconciled

ADR 0010 requires release/deployment documentation for Pages Function deployment, secret bindings, fail-closed `/api/private-document-promote`, static behavior preservation and legacy Supabase promotion-route absence. Existing normative release docs still describe a static production application and do not record the required concrete metadata-only inventory/rotation contract for `PRIVATE_DOCUMENT_ADMIN_KEY`.

Remediation requirements:

- update normative deployment/release/secret contracts;
- record secret owner/storage/scope/rotation/revocation/verification metadata without any secret value;
- add fail-closed production smoke expectations;
- ensure Pages Function deployment and legacy-route absence are explicit.

## Historical findings

The latest Pass B did not reopen the implementation remediations below, but formal closure waits for a later complete clean fresh Pass B after AR-005/006/007 remediation:

- `WP29C-AR-001` — raw-body EOF dependence: runtime-green under ADR 0010;
- `WP29C-AR-002` — bounded canonical recovery: source/live-green;
- `WP29C-AR-003` — authoritative stored MIME: source/live-green;
- `WP29C-AR-004` — wildcard CORS: runtime-green.

Historical AR-001..004 review failure: `54ccc8865ea67a4835a7627b14739c3eaac53f5a` / CI `34910156654`.

## Why this packet exists

WP-2.9A fresh review found:

- `WP29A-AR-004`: TypeScript document text/filename validation missed Unicode C1 controls rejected by PostgreSQL;
- `WP29A-AR-005`: direct authenticated Storage ingress could not prove actual stored bytes matched reserved SHA-256/size/MIME.

WP-2.9A was already a 10-point packet, so remediation is isolated here. WP-2.9C adds no product Feature ID or permission key. WP-2.9A remains blocked until C is accepted; WP-2.9B remains inactive until A is accepted.

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

Browser/application:

```text
local PDF validation/hash
→ reserve pending metadata
→ authenticated upload to bounded private Supabase staging
→ bodyless same-origin Pages trusted action
→ live authorization + authoritative document/staging state
→ promotion or trusted cleanup
→ promotion: canonical proof/copy + attestation + staging cleanup
→ independently authorized finalize pending → ready
```

Staging remains exactly `document-ingest-staging`:

- private;
- exact `25,000,000` byte limit;
- only `application/pdf`;
- no anonymous policy;
- no ordinary authenticated SELECT/UPDATE/DELETE;
- one narrow authenticated INSERT for exact live pending Document path;
- `upsert:false`.

The existing security boundary remains same-origin Cloudflare Pages. Promotion stays bodyless and no general Cloudflare backend is authorized. Remediation may add a narrowly typed trusted abandon/cleanup action to the same route/boundary; it must not create a second public privileged implementation.

The old Supabase `private-document-ingest` Edge Function remains removed from deployable source/config/application flow.

## Promotion integrity invariant

Promotion must:

- verify current Supabase user;
- require live `documents.write`;
- derive exact project/document paths server-side;
- require pending, active, private, non-remote, non-deleted authoritative reservation;
- inspect authoritative staging metadata before materialization;
- require stored MIME exactly `application/pdf` and exact reserved size within 1..25,000,000;
- bounded-read staged bytes and validate `%PDF-` + actual SHA-256;
- revalidate authoritative reservation state immediately before privileged canonical mutation;
- avoid overwrite and fully validate canonical recovery;
- compensate safely if a post-copy failure would otherwise leave an orphan;
- attest only after trusted canonical proof;
- clean staging server-side;
- preserve independent finalization authorization.

## C1 parity

The shared scalar-control rule rejects:

```text
U+0000..U+001F
U+007F..U+009F
```

That remediation remains green. Parent `WP29A-AR-004` remains formally open until C acceptance and A reverification.

## Security controls

Retain applicable evidence for:

- `SEC-AUTHZ-001..009`;
- `SEC-VAL-001/002/003/008`;
- `SEC-FILE-001/002/003/004/008/009`;
- `AUTHZ-001/002/005/007/008/018/020`;
- `SEC-ABUSE-001`;
- `SEC-NET-008`;
- secret/public-artifact safety.

## Existing exact-head implementation evidence

Pass-A head `297ecdf3337e8522d6f200a90f96b481a9e6bdb1` proved core quality/security, browser/mutation, DB/RLS/Pages runtime, preview and clean-checkout green; staging/RLS/canonical bypass controls green; same-origin bodyless promotion; old-route absence; open-ended framed-body rejection; exact-byte integrity/recovery; authorization/revocation; CORS; and exact 25 MB in the **local** runtime.

Fresh Pass B specifically invalidates treating that local 25 MB success as sufficient Workers Free CPU evidence.

## Explicit non-goals

- no UI/presentation work;
- no document versioning or contract-readiness workflow;
- no general Cloudflare backend;
- no D1/R2/KV application datastore;
- no new permission key;
- no signed-upload product flow;
- no offline pending-file queue;
- no automatic deduplication;
- no silent change to 25 MB PDF contract;
- no real/private wedding data.

## State / sequencing

Current state: **IN_PROGRESS / REMEDIATION**.

Current gate:

1. add RED/evidence-first coverage for AR-005/006/007;
2. implement trusted cleanup/abandon, promotion state revalidation and compensation for AR-005;
3. produce valid Workers Free CPU evidence for AR-006 or transition to `BLOCKED` if the frozen envelope cannot be established;
4. reconcile deployment/release/secret contracts for AR-007;
5. obtain exact-head full CI + clean-checkout verification;
6. transition back to `REVIEW_PENDING` only after remediation is green;
7. run another complete fresh independent Pass B over all WP-2.9C responsibilities and AR-001..007;
8. any BLOCKING/MAJOR finding → `REVIEW_FAILED`;
9. only a clean Pass B may enter `ACCEPTANCE_PENDING`;
10. only Pass C may mark WP-2.9C `ACCEPTED`;
11. only after C acceptance may WP-2.9A resume;
12. WP-2.9B remains `PLANNED / AFTER A`.

## Deviations

No security-contract deviation is authorized.