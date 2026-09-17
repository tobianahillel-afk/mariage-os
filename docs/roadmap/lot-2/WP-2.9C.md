# WP-2.9C — Trusted private-document ingestion hardening

## Identity

- Work Packet ID: `WP-2.9C`
- Lot: `2`
- State: `BLOCKED`
- Current pass: `BLOCKED — WP29C-AR-006 DEPLOYED WORKERS FREE CPU EVIDENCE`
- Primary bounded context: Documents — trusted binary promotion for the existing WP-2.9A private PDF lifecycle
- Branch: `lot-2/venues-core`
- FIR: `#17 / FTR-089`
- Parent review findings: `WP29A-AR-004 + WP29A-AR-005`
- Architecture chain: ADR 0008 trust/integrity → ADR 0009 bounded staging/bodyless promotion → ADR 0010 Cloudflare Pages Function promotion boundary
- Historical architecture blocker: `docs/roadmap/lot-2/WP-2.9C-BLOCKER.md` — resolved by ADR 0010
- Current runtime-evidence blocker: `docs/roadmap/lot-2/WP-2.9C-AR-006-CPU-EVIDENCE.md`
- Fresh Pass-B review: `docs/roadmap/lot-2/WP-2.9C-PASS-B-REVIEW.md`
- Size: **10 points**; cohesion review **PASS**

## Current verdict

Pass A completed successfully. The required fresh Pass B then found three unresolved MAJOR findings. Remediation implemented the AR-005 trusted cleanup/race controls and AR-007 deployment/secret/release controls, and the complete exact implementation head `68a4f6bdb7b55acc80c4c6fbb8c0afc0295bfde5` passed CI `35025384594` **5/5 SUCCESS**, including `Full verify from clean checkout`.

AR-006 still requires provider Cloudflare Workers Free CPU telemetry for the exact `25,000,000`-byte trusted promotion. The 2026-09-16 isolated deployment passed ten functional promotions, but its provider CPU dataset returned no rows. The later correctly configured Workers Observability capability preflight `bd3fdb4baab6ef59983e40f77b5b2f44ba6dc8b7` / workflow `35213157767` / job `105175271234` also found no attributable numeric provider CPU for the existing exact Pages script. Its deny-only smoke passed; it performed no application mutation. Sanitized artifact `10494251279` (ZIP SHA-256 `02438aadb3e377f6c8e6ed66b3b00c0c0d3e473008c3bb710acbfb805f2dde7c`) failed closed. The canonical packet state remains **BLOCKED** pending an explicit architecture decision.

WP-2.9C is not accepted and must not enter `REVIEW_PENDING` until AR-006 is evidenced and the resulting evidence-bound exact HEAD passes the complete verification gate again.

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

Remediation exact-head verification evidence:

- head `68a4f6bdb7b55acc80c4c6fbb8c0afc0295bfde5`;
- CI `35025384594` — **5/5 SUCCESS**, clean-checkout included;
- Core quality/security, Local Supabase DB/RLS/Pages Function, browser/mutation, privacy-safe preview and clean-checkout full verify all passed on the same implementation head.

## Current remediation findings

### WP29C-AR-005 — MAJOR — interrupted staging/abandon cleanup and promotion race

The fresh Pass B found that product recovery could remove pending DB metadata while leaving `document-ingest-staging` bytes behind, and that abandon could race promotion between the initial reservation read and canonical mutation.

Remediation now implemented on the branch includes:

- trusted project/document-bound idempotent cleanup/abandon in the existing narrow Pages security boundary;
- no ordinary browser staging DELETE;
- exact staging/canonical absence proof before metadata abandon completes;
- DB backstop preventing pending metadata abandon while staging/canonical bytes remain;
- retry/response-loss safety;
- no deletion of ready documents, another project/document or Media;
- authoritative reservation-state recheck immediately before privileged canonical mutation;
- compensating cleanup for canonical bytes created by a failing promotion request;
- replay protection that does not destructively compensate a canonical object that pre-existed the current request;
- focused RED/runtime coverage for interrupted staging, clean abandon/retry and promotion-state revalidation.

Earlier post-remediation CI `35021446818` isolated one new uncovered invalid-abandon-receipt branch in Core while the Local Supabase DB/RLS/Pages Function and browser/mutation jobs were already green. The missing negative unit test was then added. Final implementation evidence `68a4f6bdb7b55acc80c4c6fbb8c0afc0295bfde5` / `35025384594` is now **5/5 SUCCESS**, including clean-checkout full verify.

AR-005 is therefore **IMPLEMENTATION-REMEDIATED / EXACT-HEAD-GREEN**. Formal finding closure still waits for the later complete fresh Pass B after AR-006 is unblocked.

### WP29C-AR-006 — MAJOR — Workers Free exact-25-MB CPU feasibility is not evidenced

ADR 0010 freezes exact 25 MB promotion on the intended Workers/Pages Free operating envelope as an acceptance gate. Current exact-25-MB evidence is local Wrangler/workerd functionality only; deployed Free CPU enforcement and provider CPU consumption are not represented by that local success or by repository CI.

Durable blocker/proof protocol:

- `docs/roadmap/lot-2/WP-2.9C-AR-006-CPU-EVIDENCE.md`.

Provider limits rechecked on 2026-09-15 keep Workers Free at a normal `10 ms` CPU budget per HTTP request and `128 MB` memory. Cloudflare exposes CPU separately from wall time through Pages Functions/Workers telemetry.

Required unblock evidence is an isolated non-production Pages deployment on Workers Free, tied to an exact commit, with synthetic exact `25,000,000`-byte promotion and provider-produced CPU measurements. The retained controlled evidence must demonstrate normal operation inside the Free CPU budget without `exceededCpu`, Paid entitlement or a lowered file contract.

The 2026-09-16 isolated deployment of `4f40613060b4c9de41a32d99ed43fcf6e12c9791` completed ten exact-size promotions, but Cloudflare returned zero provider CPU rows. Deployment and functional evidence are recorded in `WP-2.9C-AR-006-PROVIDER-ATTEMPT-2026-09-16.md`; CPU feasibility remains unevidenced.

Therefore this finding is **OPEN / BLOCKING** and the packet state is **BLOCKED**.

### WP29C-AR-007 — MAJOR — deployment/secret operations not reconciled

The fresh Pass B found that ADR 0010 required Pages Function deployment, secret bindings, fail-closed `/api/private-document-promote`, static behavior preservation and legacy-route absence while the normative release documents still described a static-only deployment and lacked concrete `PRIVATE_DOCUMENT_ADMIN_KEY` lifecycle metadata.

Remediation now implemented includes:

- ADR 0010 reconciled to the actual `PRIVATE_DOCUMENT_ADMIN_KEY` server binding and deployed-Free CPU evidence contract;
- `SECRET-MANAGEMENT.md` metadata-only inventory, scope, storage, rotation, emergency revocation and old-credential rejection verification;
- `CI-CD.md` requiring static assets and Pages Functions from the same exact candidate, environment bindings and fail-closed route checks;
- `RELEASE-PROCESS.md` defining the private-document Pages release gate, legacy Supabase route absence and deny-oriented production smoke;
- `scripts/run-private-document-production-smoke.mjs` plus `npm run smoke:private-document-production`, which checks the deployed route without privileged credentials or real wedding data;
- focused AR-007 documentation assertions to prevent silent contract drift.

Final implementation evidence `68a4f6bdb7b55acc80c4c6fbb8c0afc0295bfde5` / `35025384594` is **5/5 SUCCESS**, including clean-checkout full verify. AR-007 is therefore **IMPLEMENTATION-REMEDIATED / EXACT-HEAD-GREEN**. Formal finding closure still waits for the later complete fresh Pass B after AR-006 is unblocked.

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

## Existing implementation evidence

Pass-A head `297ecdf3337e8522d6f200a90f96b481a9e6bdb1` proved core quality/security, browser/mutation, DB/RLS/Pages runtime, preview and clean-checkout green; staging/RLS/canonical bypass controls green; same-origin bodyless promotion; old-route absence; open-ended framed-body rejection; exact-byte integrity/recovery; authorization/revocation; CORS; and exact 25 MB in the **local** runtime.

Post-Pass-B AR-005 runtime evidence on CI `35021446818` additionally proved the local DB/RLS/Pages Function and browser/mutation jobs after the trusted abandon/race remediation. Later commits added the missing invalid-receipt unit coverage and AR-007 operational contracts/smoke.

Final remediation implementation head `68a4f6bdb7b55acc80c4c6fbb8c0afc0295bfde5` / CI `35025384594` is **5/5 SUCCESS**, including full verify from clean checkout. This validates the current repository implementation before the external AR-006 provider gate.

Fresh Pass B specifically invalidates treating any local 25 MB success as sufficient Workers Free CPU evidence.

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

Current state: **BLOCKED — WP29C-AR-006 DEPLOYED WORKERS FREE CPU EVIDENCE**.

Current gate:

1. retain AR-005 and AR-007 remediations without weakening their security contracts;
2. obtain the deployed Workers Free exact-25-MB CPU proof defined in `WP-2.9C-AR-006-CPU-EVIDENCE.md`;
3. if that proof fails the normal Free CPU envelope, remain `BLOCKED` and revisit architecture — do not enable Paid or lower the file contract silently;
4. after valid AR-006 evidence, run exact-head full CI + clean-checkout verification again over the evidence-bound candidate;
5. transition back to `REVIEW_PENDING` only after all remediation evidence is green;
6. run another complete fresh independent Pass B over all WP-2.9C responsibilities and AR-001..007;
7. any BLOCKING/MAJOR finding → `REVIEW_FAILED`;
8. only a clean Pass B may enter `ACCEPTANCE_PENDING`;
9. only Pass C may mark WP-2.9C `ACCEPTED`;
10. only after C acceptance may WP-2.9A resume;
11. WP-2.9B remains `PLANNED / AFTER A`.

## Deviations

No security-contract deviation is authorized.