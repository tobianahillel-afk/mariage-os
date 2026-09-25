# WP-2.9C ADR 0012 — Adversarial implementation review

Status: **ROUTE-READINESS REMEDIATION REVIEW GREEN; EXISTING-DEPLOYMENT READ-ONLY RECHECK HARNESS NEXT**

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


## Provider preflight attempt 1 — 2026-09-24

Status: **FAILED CONTAINED — NO EXACT-SIZE EVIDENCE / NO DOCUMENT MUTATION**

Trigger: `b0c8782517f726a0b71f33ca52e940f31c3e138c`  
CI run: `36044939346`  
Provider preflight job: `107788836160`

The trigger reused the exact reviewed tree and passed Core, browser/mutation,
local Supabase + Pages/Workers runtime, preview build and full verification from
a clean checkout before provider work began. The exact-size job remained
disabled/skipped.

The bounded provider job then:

- deployed the non-public ADR 0012 Durable Object host successfully;
- created/reconciled the SQLite `PrivateDocumentLifecycle` export;
- failed while applying the Pages Preview configuration PATCH;
- stopped before the sanitized binding receipt, provider binding verification,
  Pages candidate deployment, deny smoke or non-mutating route probe;
- did not reserve, upload, promote, finalize or otherwise mutate a document.

The first configurator discarded Cloudflare's structured error metadata, so the
exact provider validation reason was not retained. This review does **not**
claim an unobserved provider root cause.

What is established is that the rejected request replayed the full Preview
configuration returned by Cloudflare and then overlaid ADR 0012 changes. That
shape was unnecessary and could replay provider-managed/redacted fields.
Cloudflare's current Pages Project PATCH contract accepts partial Preview
updates; its typed schema exposes nullable entries for environment variables,
services and Durable Object namespace bindings, and documents null deletion for
environment variables. The remediation therefore removes configuration replay
entirely rather than guessing at a provider-managed field.

## Bounded Pages PATCH remediation review — 2026-09-24

Status: **PASS — ONE PREFLIGHT RETRY MAY BE AUTHORIZED AFTER THIS REVIEW/STATUS STATE IS EXACT-HEAD GREEN**

Reviewed remediation range:
`c67756341d81c133d49027b541e836a8e07e728a` through
`2f3a9eb657bfb8b151d9b70d64371961b519cd53`.

Exact-head CI: `36047159395` — **5/5 SUCCESS**, including
`Full verify from clean checkout`. Provider workflows were skipped on the
ordinary remediation commits.

The remediated configurator now sends only the intended Preview delta:

- `PRIVATE_DOCUMENT_ADMIN_KEY: null`;
- exact `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` plaintext values;
- `PRIVATE_DOCUMENT_PROMOTION_WORKER: null`;
- exact `PRIVATE_DOCUMENT_LIFECYCLE.namespace_id`.

It no longer GETs or replays the existing Preview object. The PATCH result is
still checked fail-closed for admin-secret absence, legacy Service Binding
absence, exact Supabase variables and exact Durable Object namespace.

Provider failure diagnostics are bounded and sanitized: only HTTP status,
provider error codes and a restricted field/source pointer may be emitted.
Provider error messages and arbitrary source values are not retained.

New unit/contract tests prove the minimal patch shape, reject unrelated Preview
fields and prove the diagnostic sanitizer does not retain provider messages.
Type declarations remain explicit. No security control, file-size limit,
credential scope or plan requirement changed.

Fresh review conclusion: no BLOCKING/MAJOR finding remains in this **retry
scope**. Exactly one new `[AR006-DO-PREFLIGHT]` may be triggered only after
the documentation/status state containing this review passes ordinary
exact-head CI and clean-checkout verification.

The retry remains a preflight only. The 10 × 25 MB evidence campaign stays
hard-disabled. A green retry authorizes only implementation and adversarial
review of the two-surface CPU evaluator required by ADR 0012.


## Provider preflight retry — 2026-09-24

Status: **FAILED CONTAINED AT IMMEDIATE DENY-SMOKE — PROVIDER CONFIGURATION/DEPLOYMENT PROVED; NO DOCUMENT MUTATION**

Trigger: `eca478937fad40632dc378f0408c1c8ec4bd5c8c`  
CI run: `36049934080`  
Provider job: `107805560963`

The trigger reused the exact reviewed tree. Core quality/security, local
Supabase/Pages runtime, browser/mutation, privacy-safe preview and full clean
checkout all passed before provider work.

The provider job then proved, in order:

- private SQLite Durable Object host deploy/reconcile: SUCCESS;
- minimal Pages Preview `PRIVATE_DOCUMENT_LIFECYCLE` PATCH: SUCCESS;
- sanitized binding receipt retained: SUCCESS;
- provider binding, Worker-held admin-secret metadata and synthetic
  `documents.write` authority: SUCCESS;
- exact candidate Pages preview deployment: SUCCESS;
- exact deployment URL resolution: SUCCESS.

The first deny-smoke request then expected the unsupported-method route to
return generic JSON HTTP 405 but received HTTP 404. The job failed immediately,
so the random-unreserved-document lifecycle route probe did not run. The
exact-size evidence job remained hard-disabled/skipped. No reservation, upload,
promotion, finalization or other document mutation occurred.

A subsequent diagnostic HTTPS fetch against the same exact preview observed
`GET /api/private-document-promote` returning HTTP 405. That supports a Pages
Functions propagation race as the narrow remediation hypothesis, but it is not
durable acceptance evidence and does not turn the failed job green.

## Bounded readiness remediation — pending review

The permitted repository remediation is intentionally narrow:

- retry **only** HTTP 404 on the first unsupported-method readiness assertion;
- bound attempts and delay;
- eventually require the original exact HTTP 405, JSON content type and generic
  `private_document_unavailable` body;
- fail immediately for any unexpected non-404 status;
- fail closed if 404 persists through the bound;
- keep all subsequent 401/413/403 deny assertions single-shot and exact.

A separate marker-gated `[AR006-DO-PREFLIGHT-READONLY]` CI continuation is
pinned to the existing `eca478...` deployment. It contains no Worker deploy,
Pages PATCH or exact-size/document mutation step. It re-verifies provider
configuration and synthetic authority, resolves exactly one successful preview
deployment for the pinned SHA, runs the bounded deny smoke and then the
non-mutating random-unreserved-document route probe.

This section records the remediation design only. It does **not** authorize the
continuation yet. Ordinary exact-head CI + clean-checkout verification and a
fresh adversarial review of this remediation are required first. The
`[AR006-DO-EVIDENCE]` path remains disabled.


## Bounded readiness remediation review — 2026-09-24

Status: **PASS — ONE NON-MUTATING `[AR006-DO-PREFLIGHT-READONLY]` CONTINUATION MAY BE AUTHORIZED AFTER THIS REVIEW/STATUS COMMIT IS EXACT-HEAD GREEN**

Reviewed remediation head: `71a3d098e3656e71fb880796d0520e5836877364`  
Exact-head CI: `36052418849` — **5/5 SUCCESS**, including `Full verify from clean checkout`.  
Provider/deploy workflows on that ordinary remediation head: **SKIPPED**.

The fresh review covered the bounded readiness implementation and the
hard-pinned existing-deployment continuation. No BLOCKING/MAJOR finding remains
in this narrow scope.

Verified properties:

- only HTTP `404` is retryable for readiness;
- readiness is bounded to eight attempts with a 1.5-second delay;
- success still requires exact HTTP `405`, JSON content type, no wildcard CORS
  and the generic `private_document_unavailable` payload;
- an unexpected non-404 response fails immediately;
- persistent 404 fails closed on the final attempt;
- the subsequent 401/413/403 deny checks remain single-shot and exact;
- the continuation is pinned to candidate
  `eca478937fad40632dc378f0408c1c8ec4bd5c8c`;
- it resolves exactly one successful Pages Preview deployment for that candidate;
- it performs no Worker deploy and no Pages PATCH;
- it does not reserve, upload, promote or finalize a document;
- its route probe uses a fresh random unreserved document UUID and requires the
  generic HTTP 409 produced only after the authenticated request reaches the
  lifecycle Durable Object;
- the exact-size provider-evidence job remains hard-disabled with
  `if: ${{ false }}`.

The previously successful provider configuration from the failed-contained
retry is therefore preserved rather than replayed. The continuation may only
GET provider metadata, re-check synthetic authority, run the bounded deny smoke
and execute the non-mutating route probe.

Review conclusion: exactly one
`[AR006-DO-PREFLIGHT-READONLY]` continuation is authorized **only after the
documentation/status commit containing this conclusion passes ordinary exact-
head CI and clean-checkout verification**.

A green continuation does not close AR-006 and does not authorize a 25 MB
campaign. It authorizes only implementation and adversarial review of the ADR
0012 two-surface CPU evaluator. Workers Paid and file-limit reduction remain
forbidden.


## Existing-deployment preflight completion — 2026-09-24

Status: **PASS — ADR 0012 PROVIDER BOUNDARY READY FOR CPU-EVALUATOR WORK**

Review/status parent: `646dcee71389fc72c87ce505fe5508e5b3912d1e` / CI
`36053609332` — **5/5 SUCCESS**, including clean checkout.

Same-tree read-only trigger:
`ce2738a22d421fafd446695d9595a378a0413865`.

CI run: `36054731788`.  
Provider job: `107821508056` — **SUCCESS**.  
Sanitized receipt artifact: `10832062202`.  
Artifact ZIP SHA-256:
`4fdc8a890bb0a23f59fa0055dd208dcee7e018c08a8437b118475bacb5af6f7e`.

The job:

- re-verified the exact ADR 0012 Pages Durable Object binding;
- re-verified the Worker-held privileged-secret metadata without reading its
  value;
- re-authenticated the synthetic user and required live
  `documents.write`;
- resolved exactly one successful Pages Preview deployment for pinned candidate
  `eca478937fad40632dc378f0408c1c8ec4bd5c8c`;
- passed the bounded deny-oriented Pages readiness smoke;
- used a fresh random unreserved document UUID and received the required generic
  HTTP 409 from the lifecycle path, proving Pages reached the Durable Object;
- performed no Worker deploy, Pages PATCH, reservation, upload, promotion or
  finalization.

The legacy deploy/requery/diagnostic jobs were skipped and the exact-size
provider-evidence job remained hard-disabled/skipped.

This closes the ADR 0012 **provider-preflight** gate only. It does not close
AR-006 and does not authorize exact-size evidence yet.

Next authorized work is repository-only: implement, test and adversarially
review a two-surface Workers Observability evaluator that separately proves the
stateless Pages ingress CPU envelope and the Durable Object execution CPU
envelope. Only a clean evaluator review may authorize a later
`[AR006-DO-EVIDENCE]` campaign.


## Two-surface CPU evaluator review — 2026-09-24

Status: **PASS — EVALUATOR CONTRACT CLEAN; EXACT-SIZE PROVIDER HARNESS IMPLEMENTATION + FRESH REVIEW NEXT**

Reviewed evaluator head: `cefe862d2a8616308d2d4f0d434f105e602998c5`  
Exact-head CI: `36060858133` — **5/5 SUCCESS**, including `Full verify from clean checkout`.  
Provider/deployment workflows on the reviewed head: **SKIPPED**.

The immediately preceding evaluator candidate had all ordinary application,
security, browser/mutation and local Supabase/Pages jobs green, but its first
clean-checkout rerun encountered a runner-local Supabase port collision on
`54322`. The reviewed head adds an explicit fail-closed local-stack stop before
the full-verification `db:start`; the complete clean-checkout run then passed.
No application/provider security control was weakened to repair that CI
infrastructure failure.

### Provider contract rechecked

Current Cloudflare documentation was rechecked during this review:

- Pages Functions execute on the Workers runtime and retain the normal
  stateless Workers CPU envelope;
- SQLite-backed Durable Objects are available on Workers Free;
- the documented default Durable Object CPU limit is 30 seconds per request;
- Pages Functions support direct Durable Object namespace bindings;
- Workers Observability exposes the invocation fields used by the evaluator,
  including CPU time, outcome, execution model, Durable Object identity and
  request identity.

Provider references remain:

- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/pages/functions/
- https://developers.cloudflare.com/pages/functions/bindings/
- https://developers.cloudflare.com/durable-objects/platform/limits/
- https://developers.cloudflare.com/workers/observability/

### Reviewed evaluator invariants

The evaluator in
`scripts/private-document-ar006-two-surface-metrics.mjs` now fails closed
unless all of the following hold:

- exactly ten expected evidence UUIDs are supplied and they are unique;
- every expected UUID has exactly one sanitized marker and exactly one
  attributable provider invocation on the Pages surface;
- every expected UUID has exactly one sanitized marker and exactly one
  attributable provider invocation on the Durable Object surface;
- the marker and invocation are joined through the provider request identity,
  not merely by time-window proximity;
- Pages is provider-classified as `executionModel=stateless`;
- the lifecycle executor is provider-classified as
  `executionModel=durableObject`;
- every retained `cpuTimeMs` is a finite non-negative number;
- Pages CPU is at or below the frozen 10 ms stateless Free budget;
- Durable Object CPU is at or below the documented 30,000 ms default budget;
- every retained invocation has `outcome=ok` and the expected fetch event
  shape;
- every Durable Object invocation carries a Durable Object ID;
- ten flows resolve to ten distinct Durable Object IDs, protecting the
  per-document isolation invariant;
- duplicate, missing, unexpected, non-numeric, over-budget, wrong-model or
  CPU-limit events make the evaluation fail.

The evidence marker is centralized in
`functions/api/private-document-evidence.ts`. Pages emits
`surface=pages-ingress` only after the bodyless lifecycle forwarding returns;
the private lifecycle executor emits `surface=durable-object` after trusted
promotion. The architecture guard now validates this shared helper rather than
requiring a duplicated raw header literal in the Worker.

The evaluator test suite covers the complete happy path and negative controls
for missing Durable Object telemetry, wrong execution model, missing/reused DO
identity, Pages/DO budget overruns, `exceededCpu`, non-numeric CPU,
unexpected markers, incomplete flow count and duplicate expected IDs.

### Review conclusion

No BLOCKING/MAJOR finding remains in the **two-surface evaluator itself**.

This conclusion authorizes the next repository-only step:

1. implement an ADR-0012 exact-size provider harness that performs the ten
   synthetic `25,000,000`-byte flows;
2. collect Pages and Durable Object Observability separately and feed only
   sanitized events into the reviewed evaluator;
3. bind the result to the exact candidate commit, Worker/namespace, Pages
   deployment and isolated Workers Free attestation;
4. add negative/contract tests and run ordinary exact-head CI + clean checkout;
5. perform a fresh adversarial review of that harness and its CI trigger.

The current `[AR006-DO-EVIDENCE]` job remains hard-disabled. **This evaluator
review does not itself authorize the exact-size provider campaign.** Only a
clean provider-harness review may enable one bounded campaign. AR-006 therefore
remains OPEN / BLOCKING.


## Exact-size provider harness review — 2026-09-25

Status: **PASS — HARNESS CONTRACT CLEAN; REPOSITORY-ONLY MARKER-GATE ENABLEMENT MAY PROCEED AFTER THIS REVIEW/STATUS COMMIT IS GREEN**

Reviewed implementation head: `5b0cc21bc8bb051edea5ec51841709b307ba5365`  
Exact-head CI: `36073556382` — **SUCCESS**, including `Core quality and security`, local Supabase/Pages promotion, browser/mutation harnesses, privacy-safe preview artifact and `Full verify from clean checkout`.  
Exact-size provider job on the reviewed head: **SKIPPED / hard-disabled**.

### Findings discovered and remediated during fresh review

1. **Partial failure receipt regression — CLOSED.** The first harness split could
   lose already-completed flow records if a later exact-size flow threw before
   the helper returned. Commit
   `14c7449ae4289986e679e83b8b1a5c91b8e2904f` changed the flow helper to
   append each completed invocation directly to the shared campaign state.
   The retained failure receipt therefore preserves earlier completed flows.
   The verdict also uses the frozen expected count of ten; a 9/10 campaign is
   explicitly rejected.
2. **Exact Worker candidate identity ambiguity — CLOSED.** The reviewed job now
   assigns the exact Worker version a deterministic `ar006-<SHA12>` tag and a
   message containing the full Git SHA, then reads Cloudflare Worker settings
   back and requires both annotations before retaining the deployment receipt.
   The receipt binds those annotations to the captured 100%-traffic Worker
   version ID. The evaluator independently requires every Durable Object
   invocation to report that exact `scriptVersion.id`, so a concurrent or
   stale Worker version fails closed.
3. **Runbook carried ADR-0011 success/failure wording into ADR 0012 — CLOSED IN
   THIS REVIEW/STATUS COMMIT.** Current final evidence now distinguishes the
   stateless Pages budget (`<=10 ms`) from the Durable Object budget
   (`<=30,000 ms`) and records that `PRIVATE_DOCUMENT_ADMIN_KEY` belongs only
   on the private Worker/Durable Object host, never Pages.

### Harness invariants rechecked

The final harness remains fail-closed unless all of these hold:

- the evidence job runs only after exact-head `full-verify`;
- the isolated environment attests Workers Free and uses only synthetic
  project/user/document data;
- the exact private Worker is deployed from the evidence SHA with
  `workers_dev: false`, one 100%-traffic version, the reviewed
  `PrivateDocumentLifecycle` export and SHA-bound tag/message;
- Pages deploys exactly the same Git SHA and resolves to one successful preview
  deployment;
- Pages has the direct `PRIVATE_DOCUMENT_LIFECYCLE` binding, no legacy
  promotion Service Binding and no privileged admin secret;
- deny smoke plus random-unreserved route proof succeed before exact-size
  mutation;
- a marker-only Observability preflight proves both Pages and Durable Object
  surfaces before any 25 MB reservation/upload;
- ten distinct synthetic PDFs are exactly `25,000,000` bytes and every
  accepted flow is promoted HTTP 200 and independently verified finalized
  `ready`;
- marker discovery and provider invocation events are joined by provider
  `requestId`, not time proximity;
- incomplete/truncated telemetry pages, provider errors, ambiguous scripts,
  missing/duplicate/unexpected markers or invocations fail closed;
- Pages is `executionModel=stateless`, numeric CPU is finite/non-negative and
  `<=10 ms`, outcome is `ok`, event type is `fetch`;
- lifecycle execution is `executionModel=durableObject`, numeric CPU is
  finite/non-negative and `<=30,000 ms`, outcome is `ok`, event type is
  `fetch`, and its script version equals the captured exact Worker version;
- ten controlled documents resolve to ten distinct non-null Durable Object IDs;
- only sanitized receipts/events are retained; no raw provider logs, tokens,
  passwords, private PDF bytes, service credential or real wedding data enter
  artifacts.

Cloudflare contracts were rechecked during this review. Current Wrangler
supports Worker-version `--tag` and `--message`; Workers Observability exposes
`cpuTimeMs`, `executionModel`, `durableObjectId`, `requestId` and
`scriptVersion` metadata used by the evaluator. The provider query remains
bounded to 2,000 events and treats a provider-reported larger count as an
incomplete page/failure.

### Review conclusion

No BLOCKING/MAJOR finding remains in the exact-size provider harness or its
two-surface evaluator.

This review authorizes only the **repository-only gate transition**:

1. replace the hard `if: false` on `ar006-provider-evidence` with the strict
   push/branch/`[AR006-DO-EVIDENCE]` marker predicate;
2. update the contract test so ordinary pushes still skip the provider job;
3. run ordinary exact-head CI and clean-checkout verification with **no marker**;
4. only if that enablement head is fully green, record one bounded campaign
   authorization and create one no-content same-tree
   `[AR006-DO-EVIDENCE]` trigger.

This review does **not** itself execute or accept the provider campaign.
AR-006 remains OPEN / BLOCKING until the resulting sanitized provider evidence
is reviewed. Workers Paid, wall-time substitution and any reduction of the
`25,000,000`-byte contract remain forbidden.

## Evidence attempt 1 route-readiness remediation review — 2026-09-25

Status: **PASS — NO BLOCKING/MAJOR FINDING; READ-ONLY RECHECK HARNESS MAY BE ADDED**

Reviewed remediation range:
`f3d8504404c551d54fe550d9558d63baa853335b` through
`f6a272bd04640c52a3ff0c98330605f158474148`.

Exact-head CI: `36124432936` — **5/5 SUCCESS**, including
`Full verify from clean checkout`. Provider/deployment/evidence jobs on the
reviewed head were **SKIPPED**.

Fresh review verifies:

- only HTTP `404` and `503` are transient/retryable;
- the window is bounded to eight attempts with a 1.5-second delay;
- neither transient status is accepted as success;
- success still requires exact HTTP `409`, JSON content type, no wildcard
  CORS and the generic `private_document_unavailable` body;
- authorization-shaped `401` and every other unexpected status fail
  immediately;
- malformed `409` responses fail closed;
- the helper is shared by standalone route proof and marker-only preflight;
- the probe uses a fresh random unreserved document ID after synthetic
  authentication, so it does not reserve, upload, promote or finalize a
  document;
- exact-size flows remain strictly after the route proof;
- a pre-mutation route failure writes the canonical sanitized pass-false
  receipt with zero completed invocations and no PDF hash/bytes, bearer token,
  password, service credential or raw exception;
- the receipt remains retained through the always-run evidence artifact step;
- the helper satisfies repository complexity/lint rules, imports Node `URL`
  explicitly and preserves caught-error cause when enriching diagnostics.

The 25,000,000-byte contract, Workers Free attestation, two-surface evaluator,
provider request-identity join, Pages <=10 ms gate, Durable Object <=30,000 ms
gate and exact Worker-version binding are unchanged.

### Review conclusion

No BLOCKING/MAJOR finding remains in this remediation scope.

This does **not** authorize a second exact-size campaign. The next permitted
action is repository-only: add a dedicated marker-gated read-only recheck job
pinned to the already-created exact
`6bdf445e7f56e38caa0d807232bcfde573103117` preview. It may only resolve/read
provider metadata, authenticate the synthetic user, run deny smoke and execute
the bounded random-unreserved lifecycle route probe. It must not deploy a
Worker, PATCH Pages, reserve/upload/promote/finalize a document or run an
exact-size flow.

That job must first pass ordinary exact-head CI + clean checkout with its marker
absent and receive a focused adversarial contract review. Only then may one
same-tree read-only recheck trigger run.

AR-006 remains OPEN / BLOCKING. Workers Paid, wall-time substitution and
file-limit reduction remain forbidden.



## Exact-preview read-only route-recheck harness review — 2026-09-25

Status: **PASS — ONE SAME-TREE READ-ONLY RECHECK MAY BE AUTHORIZED AFTER THIS REVIEW/STATUS SEAL IS EXACT-HEAD GREEN**

Reviewed implementation range:
`353b4f12c38c722fd006ed9b2e68fc4fd69843ad` through
`f11020e81c0991c8e6401d9d2f4a1ed05f2f95f4`.

Exact-head CI: `36130022819` — **5/5 SUCCESS**, including
`Full verify from clean checkout`.

The marker-gated job
`AR-006 ADR 0012 exact-preview read-only route recheck` was **SKIPPED** on
the reviewed ordinary head, as required. All separate provider/deployment
workflows were also skipped.

Two intermediate implementation heads failed only the repository Prettier
guard on the new contract test. No provider job ran on either failed head. An
isolated diagnostic branch printed the exact pinned Prettier 3.9.6 diff; the
final reviewed head applies only that formatting correction.

### Contract findings

No BLOCKING/MAJOR finding remains in the read-only recheck harness.

The review verifies that:

- execution requires a push to exactly `lot-2/venues-core`, successful
  `full-verify`, and the dedicated
  `[AR006-DO-ROUTE-RECHECK]` head-commit marker;
- the provider target is hard-pinned to existing preview candidate
  `6bdf445e7f56e38caa0d807232bcfde573103117`;
- the job performs no Worker deploy, no Wrangler command and no Pages PATCH;
- the Cloudflare credentials are used only for bounded provider metadata GETs
  already required by the reviewed read-only preflight;
- the provider lookup requires exactly one successful preview deployment for
  the pinned commit and requires `uses_functions=true`;
- synthetic Supabase authentication and live `documents.write` are
  re-checked, but no document is reserved;
- deny-oriented smoke runs against the exact resolved preview;
- the lifecycle probe uses a fresh random unreserved document UUID and must
  terminate with the reviewed generic HTTP 409 semantics after reaching the
  Durable Object;
- the job contains no Workers Observability collection, no exact-size evidence
  harness, no evidence-count control and no `25_000_000` mutation path;
- the only retained job-specific artifact is a sanitized deployment receipt
  explicitly carrying `documentMutation:false`; it contains no token,
  password, service credential, PDF bytes/hash or real wedding data;
- repository contract tests mechanically guard the marker, candidate SHA,
  permitted operations and forbidden deployment/evidence surfaces.

### Documentation finding

The living status body already required the read-only recheck, but the final
durable-handoff line still carried an older
`marker-gate enablement -> [AR006-DO-EVIDENCE]` next action. This review/status
seal corrects that stale wording so a future agent cannot skip the required
recheck. The WP-2.9C gate numbering is also normalized.

### Review conclusion

Exactly one no-content same-tree
`[AR006-DO-ROUTE-RECHECK]` trigger may run **only after the commit containing
this review/status seal passes ordinary exact-head CI + clean checkout**.

A green read-only recheck does not itself close AR-006 and does not
automatically authorize a second exact-size campaign. Its result must first be
captured and reviewed. Workers Paid, wall-time substitution and reduction of
the exact `25,000,000`-byte contract remain forbidden.
