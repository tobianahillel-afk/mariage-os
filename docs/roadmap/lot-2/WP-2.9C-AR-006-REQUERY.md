# WP-2.9C / WP29C-AR-006 — delayed provider telemetry requery

Status: **READ-ONLY EXECUTION SUPPORT — DOES NOT CLOSE AR-006 BY ITSELF**

Related blocker: `WP-2.9C-AR-006-CPU-EVIDENCE.md`

Normative runbook: `WP-2.9C-AR-006-RUNBOOK.md`

Workflow: `.github/workflows/ar006-requery.yml`

Harness: `scripts/run-private-document-ar006-requery.mjs`

## Purpose

The 2026-09-16 exact-size provider execution completed ten successful `25,000,000`-byte promotions on the exact isolated Cloudflare Pages deployment, but the immediate Cloudflare `workersInvocationsAdaptive` query returned no CPU rows. The durable attempt record requires a delayed re-query after the provider aggregation window before reopening AR-006 architecture review.

This support path re-queries only the already-recorded analytics window. It does **not** deploy, authenticate to Supabase, reserve documents, upload bytes, call the promotion Function, finalize documents, enable Workers Paid, or change the 25 MB contract.

## Security boundary

The workflow receives only:

- non-secret isolated Cloudflare account/project metadata;
- the existing Workers Free operator attestation;
- the scoped `AR006_CLOUDFLARE_ANALYTICS_TOKEN` secret with Account Analytics Read.

It does not receive the Cloudflare deployment-write token, the synthetic Supabase password, or `PRIVATE_DOCUMENT_ADMIN_KEY`.

## Pinned source attempt

The current workflow is deliberately pinned to the existing sanitized evidence attempt:

- evidence candidate: `4f40613060b4c9de41a32d99ed43fcf6e12c9791`;
- deployment: `064d50b9-3c3d-414e-a6c3-afdcc1051be9`;
- preview script: `pages-worker--19505720-preview`;
- analytics window: `2026-09-16T19:13:57.417Z` through `2026-09-16T19:16:29.334Z`;
- expected controlled requests: `10`;
- source Actions artifact: `10464581885`;
- source artifact ZIP SHA-256: `56c809b27dadf42a3ef26a003855eb628dbf0ef437774bb76d82c02b33ada3c5`.

A future provider attempt must deliberately update these non-secret pins rather than silently reusing this historical window.

## Trigger and result

A push to `lot-2/venues-core` whose head commit message contains `[AR006-REQUERY]` runs the read-only workflow. Ordinary pushes skip its only provider job and receive no environment secret.

The harness polls the exact historical script/window at most three times, converts provider CPU microseconds through the existing `private-document-ar006-metrics.mjs` helper, and writes sanitized artifact `ar006-workers-free-requery.json`.

The requery passes only if the provider returns exactly ten attributable successful one-request measurements with zero errors and both normalized p50/p99 CPU values `<= 10 ms` for every retained row. Missing, contaminated, incomplete, non-success or over-budget telemetry fails closed.

A green requery is evidence input only. It must still be reconciled with the original exact deployment/evidence candidate and normal repository verification before WP-2.9C may move to `REVIEW_PENDING` and a complete fresh Pass B.

If the delayed requery remains empty or unattributable, keep WP-2.9C blocked and reopen AR-006 architecture review under the normative runbook. Do not infer zero CPU from empty telemetry, use wall time as a substitute, enable Paid, or lower the file-size contract.
