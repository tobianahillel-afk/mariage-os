# WP-2.9C / WP29C-AR-008 — ADR 0013 production-contract remediation

State: **IMPLEMENTED / FINAL REVIEW PENDING**

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
- the packet's frozen current architecture and current finding summary now
  distinguish the ADR 0013 ingress from historical Pages/ADR 0011 attempts;
- production smoke now rejects unknown `/api/*` as JSON 404 and requires the
  static app root to return HTML 200; its synthetic test URL is Workers-based.

The two ADR 0013 contract tests and existing AR-007 operations tests are GREEN
locally; the three targeted test files pass 9/9. No production deployment,
provider token change, Supabase mutation or repeat CPU campaign is part of
this remediation. The production-contract correction passed exact-head CI
`36346460133` at `a819947` **5/5 SUCCESS**, including clean checkout.

The subsequent targeted review found a source/deployment ambiguity: the
historical Pages `onRequest` module remains in the repository because the
Worker ingress reuses its fail-closed handler and the local Pages integration
suite still exercises it. That source file is **not** the approved production
entry point. CI and release contracts now explicitly require the production
route to be owned by the Workers Static Assets ingress and verify that no
Pages deployment serves it on the production origin. The ADR 0013 architecture
test now checks the actual ingress Worker config and route, rather than
presenting the historical Pages module as the current deployment. These are
contract/test clarifications only; the deployed ingress/DO runtime and prior
provider CPU evidence are unchanged. Their new exact-head CI is pending.

Next: exact-head CI/clean checkout over these clarifications, fresh targeted
adversarial review, then complete fresh Pass B and Pass C only if review is
clean.

Provider contracts checked on 2026-09-27:

- <https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/> — `run_worker_first` can select `/api/*` ahead of SPA fallback;
- <https://developers.cloudflare.com/workers/platform/limits/> — Workers Free stateless HTTP CPU 10 ms and CPU distinct from network wait;
- <https://developers.cloudflare.com/durable-objects/platform/limits/> — Durable Object CPU per request 30 seconds.
