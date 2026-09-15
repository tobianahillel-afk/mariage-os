# WP-2.9C — Fresh Pass B adversarial review

Date: 2026-09-15

Review target:

- packet: `WP-2.9C — Trusted private-document ingestion hardening`;
- Pass-A implementation head: `297ecdf3337e8522d6f200a90f96b481a9e6bdb1`;
- Pass-A CI: `34996240637` — 5/5 SUCCESS, clean-checkout included;
- review-pending governance head: `e0854afb62cf5fcf834792fbad425d013b02af56`;
- review-pending CI: `34997963836` — 5/5 SUCCESS, clean-checkout included.

Review method:

- fresh/cold reread of ADR 0009, ADR 0010, FILE-SECURITY, WP-2.9A lifecycle and WP-2.9C contracts;
- independent source review of the Pages promotion function, staging migration, application ingest/abandon flow, attestation/finalization boundary and runtime harness;
- adversarial re-evaluation of interrupted upload, concurrent lifecycle transitions, canonical replay, request framing, authorization, resource limits, deployment/secret handling and exact-25-MB feasibility;
- prior Pass-A conclusions were treated only as evidence to challenge, not as review conclusions.

## Verdict

**REVIEW_FAILED**.

Pass B found unresolved MAJOR findings. WP-2.9C must return to remediation; it may not advance to `ACCEPTANCE_PENDING` or Pass C.

## WP29C-AR-005 — MAJOR — interrupted staging/abandon cleanup is incomplete and races promotion

### Observation

ADR 0009 makes staging cleanup a trusted-server responsibility and the file-security lifecycle requires orphan/incomplete upload cleanup. WP-2.9A also freezes clean abandon as Storage absence before metadata removal.

The implemented application flow does not include staging cleanup in `PrivateDocumentService.abandon()`:

- `PrivateDocumentStoragePort` models only canonical bucket `project-private`;
- `abandon()` inspects/deletes/verifies only the canonical path;
- `manage_private_document(... abandon_upload ...)` checks canonical `project-private` presence but does not inspect or delete `document-ingest-staging`;
- ordinary authenticated clients intentionally have no staging DELETE policy;
- the Pages Function removes staging only after successful promotion/attestation;
- the integration harness removes staging in fixture `finally` with service authority, which is test cleanup rather than a product recovery path.

Therefore this sequence is possible:

```text
reserve pending metadata
→ staging upload succeeds
→ promotion is never reached / transport fails / user chooses abandon
→ canonical object is absent
→ application abandon removes pending DB metadata
→ staging object remains indefinitely
```

A later reuse of the same deterministic project/document staging path can also become wedged: Storage returns conflict, the client correctly treats conflict only as a reason to revalidate, and promotion then sees stale bytes that may not match the new reservation. Because the browser cannot delete staging, the user has no clean recovery path.

### Concurrency variant

There is also a TOCTOU window between the promotion function's reservation read/staging verification and its first privileged canonical copy. The function rechecks `documents.write` immediately before copy, but it does not re-read/re-lock the reservation state at that point.

A concurrent `abandon_upload` can remove the pending document after the initial reservation read. Promotion may then copy verified staging bytes to the canonical path, after which service-only attestation fails because the reservation row no longer exists. This can leave canonical and staging orphan objects even though no `ready` truth is created.

### Impact

- violates orphan/incomplete upload cleanup contract;
- leaves private binary data retained after a clean user abandon;
- can wedge deterministic staging identity across retry/new reservation;
- can create Storage/DB divergence under concurrent abandon/promotion;
- current CI does not exercise this lifecycle race because fixture cleanup removes both buckets with admin authority.

### Required remediation

Add a narrowly authorized trusted cleanup/abandon path that:

- is project/document bound and derives deterministic paths server-side;
- requires live `documents.write` and safe pending/absent-state rules;
- cleans staging and any allowed pending canonical orphan before metadata abandon;
- verifies exact absence before DB abandon is considered complete;
- is idempotent across response loss/retry;
- cannot delete ready documents, other project/document objects or Media;
- closes the reservation-state TOCTOU before canonical mutation (for example by an authoritative state re-check immediately before copy and fail-closed cleanup/recovery semantics);
- receives focused RED integration evidence for interrupted staging, abandon, retry/unwedge and concurrent abandon/promotion.

## WP29C-AR-006 — MAJOR — Workers Free exact-25-MB CPU feasibility is not actually evidenced

### Observation

ADR 0010 makes Workers/Pages Free feasibility an explicit acceptance gate:

- exact 25,000,000-byte promotion must be feasible within the intended Free operating envelope;
- SHA-256/authorization must not rely on paid CPU entitlement;
- the documented Free Worker CPU limit is 10 ms/request (with platform flexibility);
- if the Free runtime cannot safely support the exact 25 MB proof, the packet must return to `BLOCKED` and architecture must be revisited.

The current CI proves the 25 MB flow against local Miniflare/workerd and local Supabase. It does **not** enforce the Cloudflare Free CPU quota or capture a CPU profile/budget assertion. Cloudflare's own Wrangler documentation states runtime limits are enforced only when deployed to Cloudflare's network, not in local development.

The existing exact-25-MB green result therefore proves runtime/API/memory-path compatibility, but not the frozen Free-plan CPU gate. Treating local success as complete Free-plan evidence overstates what the harness demonstrates.

### Impact

- packet acceptance would rely on an unverified external runtime/resource assumption;
- a production Free deployment could terminate exact-25-MB promotion with Worker resource error despite green local CI;
- silent upgrade to Workers Paid or silent lowering of the PDF limit is explicitly forbidden by ADR 0010.

### Required remediation

Produce durable evidence that directly addresses Free CPU feasibility, without weakening the 25 MB contract. Acceptable evidence must distinguish CPU from wall/network time and must be representative of the Cloudflare Workers runtime. If evidence cannot safely establish the Free envelope, transition WP-2.9C to `BLOCKED` and revisit architecture rather than advancing to Pass C.

## WP29C-AR-007 — MAJOR — deployment/secret operations were not reconciled with the new Pages Function trust boundary

### Observation

ADR 0010 explicitly requires release/deployment documentation to ensure:

- Pages Functions deploy with the static application;
- required server bindings/secrets are configured outside Git;
- `/api/private-document-promote` is security-critical and fail-closed;
- static behavior remains unchanged;
- the removed Supabase Edge Function is not redeployed by legacy scripts.

The current normative deployment docs still describe the production deployment as a Cloudflare Pages **static application** and do not document the new Function binding/secret or its operational fail-closed smoke.

`SECRET-MANAGEMENT.md` additionally requires that every new privileged secret have inventory/rotation documentation before real production secrets exist. The new `PRIVATE_DOCUMENT_ADMIN_KEY` binding is used by the Pages Function but is not yet reconciled into a concrete deployment/rotation inventory entry.

### Impact

- a release can deploy the frontend while the trusted promotion boundary is missing or misconfigured;
- the security-critical route can fail operationally without a documented release gate/smoke;
- privileged service-role material lacks the repository-required concrete owner/storage/scope/rotation/revocation record for this new binding;
- ADR 0010's deployment consequences are not yet implementation-complete.

### Required remediation

Update the normative deployment/release/secret documentation and release checks to cover the Pages Function explicitly, including at minimum:

- deployment unit includes `functions/api/private-document-promote.ts`;
- required Cloudflare secret binding name and metadata-only inventory entry;
- scope/storage/rotation/revocation/verification procedure;
- fail-closed routing expectation and production smoke;
- guarantee old Supabase promotion function is not deployed;
- no secret value in repository, browser bundle, preview artifact or logs.

## Findings retained from prior review

The fresh review found no new evidence reopening the following historical findings at the implementation level:

- `WP29C-AR-001` — raw promotion-body EOF dependence: implementation remains remediated by ADR 0010 same-origin Pages boundary and real open-ended framed request test;
- `WP29C-AR-002` — canonical recovery boundedness: source/live evidence remains green;
- `WP29C-AR-003` — authoritative stored MIME: source/live evidence remains green;
- `WP29C-AR-004` — wildcard CORS: same-origin/foreign-origin evidence remains green.

Their formal packet closure still waits for a later clean fresh Pass B after AR-005/006/007 remediation.

## State consequence

Per `docs/engineering/AI-LOT-ORCHESTRATION.md`:

```text
REVIEW_PENDING
→ REVIEW_FAILED
→ IN_PROGRESS  # only when remediation starts
```

No Pass C, WP-2.9C acceptance, WP-2.9A resumption or WP-2.9B activation is permitted while these MAJOR findings remain unresolved.
