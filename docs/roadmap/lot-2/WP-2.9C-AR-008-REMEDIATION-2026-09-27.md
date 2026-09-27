# WP-2.9C / WP29C-AR-008 — ADR 0013 production-contract remediation

State: **IMPLEMENTED LOCALLY / EXACT-HEAD CI AND REVIEW PENDING**

Source finding: `WP-2.9C-FRESH-PASS-B-2026-09-27.md` (MAJOR).

The evidence-bound ADR 0013 candidate `bd5ca22` passed CI `36344835905`
5/5, but the fresh full Pass B found that production release contracts still
directed the private-document route to the superseded Pages Function. The
approved deployed CPU proof is for Workers Static Assets ingress and the
private lifecycle Durable Object, so following the old production instructions
would publish a different topology.

RED-first: new `private-document-adr0013-production-operations.red.test.ts`
failed in both release-routing and secret/Free CPU contract cases against the
old normative documents. A second RED case required the actual production
smoke to reject an unknown `/api/*` path and verify static content, rather
than only checking the known route.

Remediation:

- `CI-CD.md`, `RELEASE-PROCESS.md` and
  `VERSIONING-UPDATE-DELIVERY.md` require the exact approved private Durable
  Object host first, then Workers Static Assets ingress with Worker-first
  `/api/*`, same-candidate static assets, exact binding/deployment identities,
  deny/static smoke, fail-closed rollback and legacy-route absence;
- `SECRET-MANAGEMENT.md` retains `PRIVATE_DOCUMENT_ADMIN_KEY` only on the private
  DO host, never the public ingress or assets, with provider-first rotation;
- `FREE-TIER.md` identifies both Workers Free CPU surfaces and references the
  ten-flow provider result without substituting wall time or Paid entitlement;
- `RELEASE-PLAN.md` captures both deployment identities, binding/routing proof
  and CPU evidence identifier;
- production smoke now rejects unknown `/api/*` as JSON 404 and requires the
  static app root to return HTML 200; its synthetic test URL is Workers-based.

The two ADR 0013 contract tests and existing AR-007 operations tests are GREEN
locally; the three targeted test files pass 9/9. No production deployment,
provider token change, Supabase mutation or repeat CPU campaign is part of
this remediation. Next: local format/lint/typecheck, exact-head CI/clean
checkout, fresh adversarial review, then complete fresh Pass B and Pass C only
if review is clean.

Provider contracts checked on 2026-09-27:

- <https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/> — `run_worker_first` can select `/api/*` ahead of SPA fallback;
- <https://developers.cloudflare.com/workers/platform/limits/> — Workers Free stateless HTTP CPU 10 ms and CPU distinct from network wait;
- <https://developers.cloudflare.com/durable-objects/platform/limits/> — Durable Object CPU per request 30 seconds.
