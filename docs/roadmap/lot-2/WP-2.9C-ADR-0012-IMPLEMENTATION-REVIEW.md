# WP-2.9C ADR 0012 — Adversarial implementation review

Status: **REMEDIATION REVIEW PASSED — ISOLATED ADR 0012 PREFLIGHT AUTHORIZED; EXACT-SIZE EVIDENCE STILL GATED**

Review date: 2026-09-24  
Reviewed implementation head: `99ff618781f46073964b14d49b7969c9c132bc92`  
Scope: ADR 0012 direct Pages → per-document Durable Object lifecycle executor.

## Verified green evidence

Repository CI run `36031083040` is green on the reviewed head, including:

- Core quality and security;
- local Supabase DB/RLS + Pages/Workers runtime promotion suite;
- browser and mutation harnesses;
- privacy-safe preview artifact;
- full verification from a clean checkout.

The local Miniflare/workerd path exercises a Pages Durable Object binding to
`PrivateDocumentLifecycle`; same-document lifecycle requests use an explicit
per-instance serial gate; promotion and abandon continue to execute their
existing Supabase authentication, live authorization, reservation, cleanup,
compensation and finalization checks.

No provider mutation was authorized or executed by the reviewed implementation
commits.

## Findings

### ADR12-IR-001 — MAJOR / BLOCKING — Pages Preview configurator still installs ADR 0011 trust material

`scripts/configure-ar006-pages-preview.mjs` still:

- requires `PRIVATE_DOCUMENT_ADMIN_KEY` in the Pages runtime;
- installs `PRIVATE_DOCUMENT_PROMOTION_WORKER` as a Service Binding;
- does not configure `PRIVATE_DOCUMENT_LIFECYCLE` as a Durable Object namespace;
- does not remove the superseded admin secret/service binding.

This violates ADR 0012's privilege placement and would make a provider preview
configuration differ from the locally verified architecture.

Required remediation:

- discover the exact `PrivateDocumentLifecycle` namespace created by the
  private Worker using the existing narrowly scoped Worker deployment
  credential;
- bind that namespace to Pages as `PRIVATE_DOCUMENT_LIFECYCLE`;
- delete the Pages `PRIVATE_DOCUMENT_ADMIN_KEY`;
- remove the old `PRIVATE_DOCUMENT_PROMOTION_WORKER` binding;
- preserve unrelated preview bindings/configuration;
- retain only a sanitized binding receipt.

### ADR12-IR-002 — MAJOR / BLOCKING — provider preflight still validates ADR 0011

`scripts/run-private-document-ar006-preflight.mjs` still requires the Pages
admin secret and Service Binding. A green result from that script would
therefore prove the wrong architecture.

Required remediation:

- use the existing Worker deployment credential to list Durable Object
  namespaces;
- require exactly one SQLite namespace for class
  `PrivateDocumentLifecycle` on the exact private Worker;
- require Pages preview `PRIVATE_DOCUMENT_LIFECYCLE.namespace_id` to equal
  that namespace;
- require the Pages admin secret to be absent;
- require the old Service Binding to be absent;
- keep the synthetic Supabase user/live `documents.write` check.

Cloudflare documents the namespace-list endpoint as accepting Workers Scripts
Read or Write, so the already-proven Workers Scripts Write credential is
sufficient; no new token is authorized.

### ADR12-IR-003 — MAJOR / BLOCKING — legacy evidence marker can still execute a semantically stale CPU evaluator

The current `[AR006-EVIDENCE]` CI path still validates the old Service
Binding/Pages secret and evaluates the private Worker under the stateless
`10 ms` CPU budget. ADR 0012 instead requires separate provider evidence for:

- the stateless Pages ingress, which remains subject to the normal Workers Free
  stateless CPU envelope; and
- the Durable Object execution, which must be provider-classified as
  `executionModel=durableObject`, have numeric `cpuTimeMs`, no CPU-limit
  outcome, and remain below the provider Durable Object Free CPU ceiling.

Until that evaluator is replaced, the legacy exact-size evidence marker must
fail closed / be unreachable as an acceptance path.

### ADR12-IR-004 — MAJOR / BLOCKING — operational documentation still assigns the privileged credential to Pages

`docs/engineering/CI-CD.md`,
`docs/security/SECRET-MANAGEMENT.md` and the AR-007 operations test still
describe the privileged Supabase credential as a Pages secret and/or ADR-0011
Service Binding contract.

Required remediation:

- document Pages as ingress/router only;
- inventory `PRIVATE_DOCUMENT_ADMIN_KEY` only on the private Worker/Durable
  Object host runtime;
- document the Pages Durable Object namespace binding and deployment order;
- update the operations guard test so future regressions fail CI.

## Initial review conclusion (historical)

The application/runtime design is sufficiently promising to continue, but the
provider and operations layer is not yet equivalent to ADR 0012.

No Cloudflare bootstrap, Pages mutation, provider preflight or exact-size
campaign is authorized from this review state.

Required sequence:

1. create RED evidence for findings ADR12-IR-001..004 without leaving the Lot-2
   branch intentionally red;
2. remediate provider configuration/preflight/docs and disable the stale
   evidence entrypoint;
3. run exact-head ordinary CI + clean-checkout verification;
4. perform a fresh review of the remediation;
5. only if that review is clean, authorize the bounded isolated Durable Object
   bootstrap/config/preflight sequence;
6. a 25 MB campaign remains separately gated until the new two-surface CPU
   evaluator is implemented and reviewed.


## Remediation review — 2026-09-24

Status: **PASS — INITIAL ADR12-IR-001..004 CLOSED / VERIFIED FOR PREFLIGHT SCOPE**

Reviewed remediation head: `7492dd06677f6d5c5ae7627a1c0129bf841c6175`  
Exact-head CI: `36038873857` — **5/5 SUCCESS**, including `Full verify from clean checkout`.  
Provider mutation/evidence jobs on that ordinary commit: **SKIPPED**.

The fresh review covered the complete remediation diff from the initially reviewed
`99ff618781f46073964b14d49b7969c9c132bc92` through
`7492dd06677f6d5c5ae7627a1c0129bf841c6175`, including the provider configurator, namespace resolver,
preflight, CI gates, release/secret documentation and regression tests.

### ADR12-IR-001 — CLOSED / VERIFIED

The Pages Preview configurator now:

- resolves exactly one SQLite `PrivateDocumentLifecycle` namespace on the exact
  private Worker using the existing Workers Scripts credential;
- binds it as `PRIVATE_DOCUMENT_LIFECYCLE`;
- removes the superseded `PRIVATE_DOCUMENT_PROMOTION_WORKER` Service Binding;
- removes `PRIVATE_DOCUMENT_ADMIN_KEY` from Pages;
- preserves unrelated Preview bindings/configuration;
- emits only the sanitized `ar006-pages-preview-config.json` receipt;
- retains that receipt as a bounded GitHub Actions artifact, with a regression
  test that fails if retention disappears.

The historical standalone Pages configurator is hard-disabled and no longer
references the retired Pages admin secret.

### ADR12-IR-002 — CLOSED / VERIFIED

The provider preflight now proves the ADR 0012 architecture rather than ADR 0011:

- bounded Durable Object namespace inventory;
- exactly one class `PrivateDocumentLifecycle` on the exact private Worker;
- SQLite backend required;
- Pages `PRIVATE_DOCUMENT_LIFECYCLE.namespace_id` must exactly match;
- Pages admin secret and legacy Service Binding must both be absent;
- Worker-host `PRIVATE_DOCUMENT_ADMIN_KEY` is checked by metadata only, never
  read or logged;
- synthetic Supabase authentication and live `documents.write` remain required;
- the route preflight uses a fresh nonexistent document UUID and requires the
  expected generic `409`, proving the request reached the lifecycle executor
  without reserving/uploading/finalizing a document.

Cloudflare's current provider contract documents `Workers Scripts Read` or
`Workers Scripts Write` for namespace listing and returns the script/class/
`use_sqlite` metadata used by the resolver. No new credential is required.

### ADR12-IR-003 — CLOSED / VERIFIED FOR PREFLIGHT; EXACT-SIZE EVIDENCE REMAINS GATED

The semantically stale ADR 0011 evidence path is no longer executable:

- the old `[AR006-EVIDENCE]` acceptance trigger is absent;
- the exact-size job is hard-disabled with `if: ${{ false }}`;
- `[AR006-DO-EVIDENCE]` is reserved for a future reviewed two-surface CPU
  evaluator and is not currently an execution path;
- ordinary commits and the authorized preflight cannot run the 25 MB campaign.

A future evaluator must separately attribute provider CPU to the stateless Pages
ingress and to `executionModel=durableObject`, with numeric CPU and no
CPU-limit outcome. This review does **not** accept AR-006 evidence.

### ADR12-IR-004 — CLOSED / VERIFIED

Normative CI/CD, release and secret-management documentation now places
`PRIVATE_DOCUMENT_ADMIN_KEY` only on the private Worker/Durable Object host,
documents direct Pages → Durable Object binding/deployment order, requires the
legacy Service Binding to remain absent and keeps Pages as the same-origin
bodyless ingress/router only. The AR-007 operations test guards that contract.

### Additional fresh-review observations

- the direct Pages → Durable Object local/workerd integration remains green;
- promotion and abandon share an explicit per-document serial gate while
  retaining independent Supabase authentication/live authorization/reservation
  re-checks;
- different document lifecycle instances are not globally serialized;
- the Worker remains non-public (`workers_dev: false`);
- no real/private wedding data, secret value or privileged credential was added
  to Git or CI artifacts;
- no Paid entitlement and no reduction of the exact `25,000,000`-byte contract
  was introduced.

## Remediation review conclusion

No BLOCKING/MAJOR finding remains in the **ADR 0012 implementation/provider-
preflight path** reviewed here.

One bounded isolated `[AR006-DO-PREFLIGHT]` is authorized **only after the
documentation/status reconciliation commit containing this review itself passes
ordinary exact-head CI and clean-checkout verification**. That preflight may
deploy the private Durable Object host and configure the isolated Pages Preview,
then prove the route with synthetic/non-mutating input.

The exact-size 25 MB campaign remains separately forbidden. A green preflight
only authorizes implementation + adversarial review of the new two-surface CPU
evaluator. AR-006 remains **OPEN / BLOCKING** until valid provider evidence,
followed by exact-head verification, a complete fresh Pass B and Pass C.
