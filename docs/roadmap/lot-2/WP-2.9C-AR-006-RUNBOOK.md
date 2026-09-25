# WP-2.9C / WP29C-AR-006 — deployed Workers Free evidence runbook

Status: **EXECUTION SUPPORT — DOES NOT CLOSE AR-006 BY ITSELF**

Related blocker: `WP-2.9C-AR-006-CPU-EVIDENCE.md`

Related architecture review: `WP-2.9C-AR-006-ARCHITECTURE-REVIEW.md`

Related packet: `WP-2.9C`

Related FIR: `#17 / FTR-089`

Read-only readiness job: `.github/workflows/ci.yml` → `ar006-provider-preflight`

Current exact-size evidence job: `.github/workflows/ci.yml` → `ar006-provider-evidence`

Workers Observability capability job: `.github/workflows/ar006-observability-preflight.yml`

Provider preflight: `npm run preflight:ar006`

Current exact-size evidence harness: `scripts/run-private-document-ar006-do-evidence.mjs`

Workers Observability capability harness: `scripts/run-private-document-ar006-observability-preflight.mjs`

Current two-surface correlation: `scripts/private-document-ar006-surface-discovery.mjs` + `scripts/private-document-ar006-two-surface-metrics.mjs`

CPU regression control: `npm run test:ar006:metrics`

## ADR 0013 current execution protocol

ADR 0013 is the current AR-006 path. Historical Pages, GraphQL, Pages-tail, ADR 0011 Service-Binding and ADR 0012 Pages-ingress protocols later in this file are retained only for reproducibility.

Current topology: browser -> `mariage-os-ar006-ingress` Workers Static Assets ingress (Worker-first `/api/*`, no admin secret, persisted Workers Logs) -> external `PRIVATE_DOCUMENT_LIFECYCLE` binding -> private `mariage-os-private-document-promotion` SQLite Durable Object host -> isolated Supabase.

Strict sequence: ordinary exact-head CI + clean checkout -> fresh ADR 0013 implementation review -> one reviewed `[AR006-INGRESS-PREFLIGHT]` -> inspect/review sanitized preflight receipt -> only a separately reviewed green preflight may authorize one `[AR006-INGRESS-EVIDENCE]` ten-flow exact-size campaign -> exact-head verification -> fresh Pass B -> Pass C.

The preflight may deploy the two isolated Worker scripts but performs no application-document mutation: no reservation, exact PDF generation/upload, promotion or finalization. It emits one UUID-only safe random-unreserved probe and requires attributable persisted structured markers from both exact deployed script versions.

Final campaign ingress acceptance: `executionModel=stateless`, provider-native `cpuTimeMs <= 10`, HTTP 200, `outcome=ok`, exact version, no truncation. Lifecycle acceptance: `executionModel=durableObject`, unique non-null `durableObjectId`, provider-native `cpuTimeMs <= 30,000`, HTTP 200, `outcome=ok`, exact private-host version, no truncation. Missing/duplicate/malformed markers, request-ID ambiguity, incomplete pages or provider errors fail closed.

No raw provider event, credential, PDF bytes or real wedding data may be retained. Workers Paid, wall time, dashboard aggregates and a lower PDF limit are prohibited substitutes.


### ADR 0013 preflight result — 2026-09-25

Single authorized trigger `a83d76ec5b824096cfe1435e20613b813a6892c7` / CI `36154744823` / provider job `108139347246` is **GREEN**. Sanitized artifact `10873203218` (digest `sha256:81b74ac40f270be773fc8f2f83cfd970f6783decb63e684bbe6513c1cf2167ed`) records exact ingress/DO structured attribution with no application-document mutation.

Exact provider identities: DO host version `794000b1-9b1b-43ad-a12c-01bbd47875eb`; ingress deployment `c4346f61-ad43-4a58-8b90-91e2a25bc5f7`; ingress version `11eb9e2f-9056-48ad-93ee-2ed0095d699a`. Safe route readiness was HTTP 409 on attempt 1. Observability passed on attempt 3 with two markers/two attributed invocations and no failures.

The next trigger is **not automatic**. One `[AR006-INGRESS-EVIDENCE]` campaign is permitted only after the repository commit sealing this preflight review is ordinary exact-head green.


## ADR 0013 failed-marker diagnostic protocol

The first authorized ADR 0013 final trigger
`f7951e99eb31bcc63d9cbd93f67db80548340ed6` failed closed at the mandatory
marker preflight before exact-size setup. Do not rerun
`[AR006-INGRESS-EVIDENCE]`.

The retained artifact exposes only aggregate
`invalid_provider_invocation`. Repository remediation may introduce a
diagnostic-only trigger after exact-head verification and review. That trigger
must requery only the already-produced exact timeframe and must not deploy,
authenticate to Supabase, emit a new marker or mutate application data.

A diagnostic receipt may retain only exact failed Git SHA/evidence UUID/script
versions/timeframe, query HTTP/API/completeness metadata, marker/attribution
counts, and privacy-safe provider-validation reason codes plus the non-secret
provider fields necessary to interpret those reasons. Raw events, source
payloads, credentials and bearer data remain forbidden.

## ADR 0012 historical final-evidence protocol — superseded by ADR 0013 ingress

This section is the current AR-006 execution protocol. Older `[AR006-EVIDENCE]`, GraphQL, Pages-tail and ADR 0011 Service-Binding sections later in this file are historical/reproducibility records only.

Current topology:

```text
browser
→ same-origin/bodyless Pages Function
→ PRIVATE_DOCUMENT_LIFECYCLE Durable Object
→ isolated Supabase Auth/RLS/Storage/PostgreSQL
```

The final evidence marker is `[AR006-DO-EVIDENCE]`. It is allowed only on `lot-2/venues-core` after the exact candidate has passed ordinary CI, full verification from a clean checkout, ADR 0012 provider topology preflight and fresh adversarial review of the two-surface evaluator.

The evidence job must, in order:

1. verify the isolated Workers Free attestation and required narrow credentials;
2. snapshot the current private Worker deployment;
3. deploy the exact candidate Worker and capture the new deployment ID plus its single 100%-traffic version ID;
4. verify that version exports `PrivateDocumentLifecycle` and retains reviewed Worker-only Supabase bindings/secrets;
5. build and deploy the exact Pages preview candidate for the same Git SHA;
6. resolve exactly one successful commit-bound Pages preview and verify direct `PRIVATE_DOCUMENT_LIFECYCLE` binding with no obsolete ADR 0011 promotion Service Binding;
7. pass fail-closed deny smoke and a non-mutating random-unreserved-document route probe;
8. only then perform ten distinct exact-`25,000,000`-byte synthetic reserve → stage → promote → finalize flows;
9. discover both controlled execution surfaces from UUID-only markers;
10. query Workers Observability with a maximum page of 2,000 events and retain provider event count;
11. reject incomplete/truncated event pages, provider errors, ambiguous scripts, missing/duplicate markers or invocations;
12. enforce Pages `executionModel=stateless`, provider-native `cpuTimeMs <= 10`, event type `fetch`, outcome `ok` and no CPU-limit outcome;
13. enforce lifecycle `executionModel=durableObject`, provider-native `cpuTimeMs <= 30,000`, event type `fetch`, outcome `ok`, non-null Durable Object ID and no CPU-limit outcome;
14. require ten distinct Durable Object IDs for ten distinct controlled documents;
15. require every Durable Object event `$workers.scriptVersion.id` to equal the exact Worker version captured immediately after deployment;
16. upload only sanitized metadata/evidence; never raw provider events, PDF bytes, bearer/session tokens, passwords or server secrets.

The ADR 0012 CPU source is provider-native `$workers.cpuTimeMs` in milliseconds. Historical GraphQL microsecond quantiles and `/1000` normalization do not apply.

After accepted evidence capture, reset or destroy dedicated synthetic test data under the non-production procedure. Do not introduce a production credential or application bypass merely for cleanup.

Provider contracts rechecked for this protocol:

- Workers Free stateless limit: <https://developers.cloudflare.com/workers/platform/limits/>;
- Workers/Pages Free inclusion: <https://developers.cloudflare.com/workers/platform/pricing/>;
- Durable Object Free availability and request CPU: <https://developers.cloudflare.com/durable-objects/platform/limits/>;
- Durable Object Free usage: <https://developers.cloudflare.com/durable-objects/platform/pricing/>;
- Observability event fields: <https://developers.cloudflare.com/api/resources/workers/subresources/observability/>;
- telemetry query API: <https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/methods/query/>.

## Purpose

This runbook turns the AR-006 provider-evidence protocol into reproducible, fail-closed execution paths that can run **before Lot-2 integration to `main`**.

It does not weaken the frozen `25,000,000`-byte contract, does not authorize Workers Paid, does not use production wedding data, and does not auto-transition WP-2.9C.

The original readiness and evidence jobs are part of the normal branch CI because GitHub `workflow_dispatch` only receives events when the workflow file exists on the repository default branch. WP-2.9C must obtain this evidence before it can be accepted and integrated, so a Lot-2-only standalone dispatch workflow would not be executable at the required phase.

The non-destructive readiness job is guarded by all of these conditions:

- event is `push`;
- ref is exactly `refs/heads/lot-2/venues-core`;
- pushed commit message contains the explicit marker `[AR006-PREFLIGHT]`;
- normal `core` succeeds first;
- GitHub Environment is exactly `ar006-isolated`;
- environment variable `AR006_WORKERS_FREE_ATTESTATION` is exactly `YES-WORKERS-FREE-ISOLATED`;
- all required isolated-provider metadata and credentials are present.

The historical exact-size provider-evidence job is guarded separately by all of these conditions:

- event is `push`;
- ref is exactly `refs/heads/lot-2/venues-core`;
- pushed commit message contains the explicit marker `[AR006-EVIDENCE]`;
- normal `full-verify` succeeds first;
- GitHub Environment is exactly `ar006-isolated`;
- environment variable `AR006_WORKERS_FREE_ATTESTATION` is exactly `YES-WORKERS-FREE-ISOLATED`;
- all required isolated-provider metadata and credentials are present.

The Workers Observability capability workflow is a third, separately guarded path. It runs only on `lot-2/venues-core` when the pushed commit message contains `[AR006-OBS-PREFLIGHT]`, uses the same `ar006-isolated` environment, and receives only its dedicated Observability token in addition to non-secret exact-deployment metadata. It may not deploy, authenticate to Supabase, upload a PDF or mutate application data.

On ordinary pushes and pull requests all AR-006 provider-specific jobs are skipped and receive no provider credentials.

A successful provider job is still only evidence input. AR-006 remains open until sanitized provider evidence is reviewed, durably attached to the FIR/repository record, the exact evidence-bound HEAD remains fully verified, and the later fresh Pass B accepts the whole packet.

## Provider basis

Current Cloudflare contracts used by this runbook:

- Pages Direct Upload with Wrangler: <https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/>;
- Pages API / deployment metadata: <https://developers.cloudflare.com/pages/configuration/api/>;
- Pages Functions metrics: <https://developers.cloudflare.com/pages/functions/metrics/>;
- Pages Functions debugging/logging: <https://developers.cloudflare.com/pages/functions/debugging-and-logging/>;
- Workers metrics GraphQL query shape: <https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-workers-metrics/>;
- Workers Observability Query Builder: <https://developers.cloudflare.com/workers/observability/query-builder/>;
- Workers Observability telemetry query API: <https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/methods/query/>;
- Workers Free limits: <https://developers.cloudflare.com/workers/platform/limits/>;
- Cloudflare GraphQL reference: `workersInvocationsAdaptive` CPU aggregation uses microseconds (`cpuTimeUs`), and CPU quantiles belong to that same CPU-time family;
- historical analytics credential: Account Analytics Read;
- deployment credential: the narrowest Pages write/edit permission that supports the isolated project;
- Observability capability credential: dedicated `Workers Observability Write` only, as currently documented by the telemetry query endpoint.

The normal Workers Free CPU limit was rechecked on 2026-09-16 as `10 ms` per HTTP request. Provider contracts must be rechecked before a later evidence run if Cloudflare limits or metric semantics change.

The historical GraphQL `cpuTimeP50` / `cpuTimeP99` values consumed by the original exact-size harness are treated as **microseconds**. The harness records the raw values as `cpuTimeP50Us` / `cpuTimeP99Us`, divides by exactly `1000`, and records the normalized values as `cpuTimeP50Ms` / `cpuTimeP99Ms` before comparing them with the `10 ms` Free budget. `npm run test:ar006:metrics` locks this unit conversion and the 10 ms boundary into repository CI.

Workers Observability provider capability is proven and is the selected ADR 0012 CPU evidence channel. The final harness must still prove the exact deployed Pages and Durable Object surfaces empirically and fails closed on unavailable, ambiguous or incomplete provider telemetry.

## Isolated environment prerequisites

Provision a non-production Cloudflare Pages project and a non-production Supabase project dedicated to this evidence exercise.

Do not use:

- production Cloudflare credentials;
- production Supabase credentials;
- real wedding content;
- real couple/member accounts;
- a paid Workers CPU entitlement to make the gate pass.

The isolated Supabase project must contain the current migrations and one synthetic member with live `documents.write` on one synthetic project.

The current ADR 0012 exact-size harness signs in as that ordinary synthetic user, reserves each pending document through `manage_private_document`, uploads through the authenticated staging policy, invokes the deployed same-origin/bodyless Pages route, and independently finalizes each successful promotion through the ordinary RPC.

The isolated Pages **preview** environment may retain the public-client `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` metadata used by the wider project configuration, but it must **not** expose `PRIVATE_DOCUMENT_ADMIN_KEY`. Pages must expose the direct `PRIVATE_DOCUMENT_LIFECYCLE` Durable Object binding and must not expose the obsolete ADR 0011 promotion Service Binding.

The private Worker/Durable Object host owns the isolated `SUPABASE_URL`, publishable key and encrypted `PRIVATE_DOCUMENT_ADMIN_KEY`. The provider preflight verifies the privileged Worker secret by metadata only; its value is never read, printed or copied into GitHub Actions.

Before any exact-size mutation, `npm run preflight:ar006` re-verifies the Pages Durable Object binding, absence of the Pages admin secret/legacy Service Binding, Worker admin-secret metadata, synthetic-user authentication and live `documents.write`. The final evidence harness then performs an additional marker-only Observability preflight on both execution surfaces before reserving/uploading any 25 MB document.

## GitHub Environment contract

Create the GitHub Environment named exactly `ar006-isolated`. Apply reviewer/protection controls where available.

Configure these **environment variables**:

| Name | Classification | Purpose |
|---|---|---|
| `AR006_PAGES_PROJECT` | non-secret metadata | isolated Cloudflare Pages project name |
| `CLOUDFLARE_ACCOUNT_ID` | non-secret metadata | isolated Cloudflare account identifier |
| `AR006_SUPABASE_URL` | public-client configuration | isolated Supabase URL |
| `AR006_SUPABASE_PUBLISHABLE_KEY` | public-client configuration | isolated Supabase browser key |
| `AR006_TEST_USER_EMAIL` | synthetic test metadata | ordinary isolated Supabase test user |
| `AR006_PROJECT_ID` | synthetic test metadata | synthetic project with `documents.write` |
| `AR006_WORKERS_FREE_ATTESTATION` | operator metadata | must equal `YES-WORKERS-FREE-ISOLATED` |

Configure these **environment secrets**:

| Secret | Minimum scope | Rotation / revocation |
|---|---|---|
| `AR006_CLOUDFLARE_DEPLOY_TOKEN` | isolated Pages deployment write permission only | revoke after the evidence exercise or on suspected exposure |
| `AR006_CLOUDFLARE_WORKER_DEPLOY_TOKEN` | isolated Worker Scripts write for the private Durable Object host only | revoke after the evidence exercise or on suspected exposure |
| `AR006_CLOUDFLARE_OBSERVABILITY_TOKEN` | dedicated Workers Observability Write for the isolated Cloudflare account; no Pages deployment permission | short-lived; revoke after capability/evidence exercise or on suspected exposure |
| `AR006_TEST_USER_PASSWORD` | only the synthetic non-production Supabase user | rotate/delete the synthetic user after the evidence exercise |

This table is the metadata-only inventory required by the current ADR 0012 path and supplements `docs/security/SECRET-MANAGEMENT.md`. The historical Account Analytics token belongs only to superseded GraphQL workflows and is not an input to the current final-evidence job.

No token value, hash, fingerprint or password belongs in Git, Actions artifacts, FIR comments or screenshots.

## Readiness preflight trigger

Do **not** use `[AR006-EVIDENCE]` merely to discover whether the environment is configured.

After the isolated Cloudflare/Supabase resources and GitHub Environment are believed to be ready, create a no-content commit on `lot-2/venues-core` using the exact current tree and a message containing the literal marker:

```text
[AR006-PREFLIGHT]
```

The `ar006-provider-preflight` job starts only after normal `core` succeeds on that exact SHA. It checks out the exact commit, installs dependencies, runs secret scanning and executes `npm run preflight:ar006` with the isolated environment credentials.

A preflight run must remain non-destructive: it performs no Pages deployment, no document reservation, no Storage upload, no promotion/finalization and no application-data mutation.

A green preflight demonstrates environment readiness only. It is **not** Workers Free CPU evidence and does not close AR-006 or authorize a packet-state transition.

A red preflight means the isolated provider/GitHub Environment is not acceptance-ready. Correct the external configuration or permissions, then rerun the read-only preflight. Do not proceed to `[AR006-EVIDENCE]` merely to obtain a more detailed failure.

## Workers Observability capability preflight

This capability path exists only because the original GraphQL CPU channel remained empty during both the exact-size evidence run and the delayed requery, and the standard Pages deployment tail is not an approved CPU source.

Repository support is verified at `ed65b6beec8c66c50eca7eca019d972a0b75a748` / CI `35159378110` — **5/5 SUCCESS**, including clean-checkout full verification.

Before triggering it, configure a separate short-lived GitHub Environment secret named exactly:

```text
AR006_CLOUDFLARE_OBSERVABILITY_TOKEN
```

The provider token must have only the minimum current Cloudflare permission required by the telemetry query endpoint (`Workers Observability Write`) for the isolated account. Do not reuse or widen `AR006_CLOUDFLARE_DEPLOY_TOKEN` or `AR006_CLOUDFLARE_ANALYTICS_TOKEN`.

Create a no-content commit on `lot-2/venues-core` using the exact repository-green tree and a message containing:

```text
[AR006-OBS-PREFLIGHT]
```

The dedicated workflow then:

1. checks out the exact trigger commit with persisted Git credentials disabled;
2. installs dependencies and runs the repository secret scan;
3. runs the existing deny-only production smoke against deployment `064d50b9-3c3d-414e-a6c3-afdcc1051be9` / script `pages-worker--19505720-preview`;
4. queries a short Workers Observability window filtered to that exact script;
5. sanitizes results to provider attribution/CPU metadata only;
6. requires at least one event attributable to the exact Pages script with numeric provider `cpuTimeMs`;
7. uploads only the sanitized capability artifact, including on a fail-closed capability result.

This workflow may not deploy, authenticate to Supabase, reserve a document, upload a PDF, promote/finalize a document or mutate application data.

The first trigger `ea948913a1b56fc959557ee005763b0950b30a07` / workflow `35161863114` / job `105014208798` passed the deny-only smoke but stopped **before any Observability API request** because `AR006_CLOUDFLARE_OBSERVABILITY_TOKEN` resolved empty. Artifact `10473471272` (ZIP SHA-256 `f3bcaa6b9f6b2e83c21b7a21622e4b9ae48a985c84f1b46065c5983a2e56e43d`) records `tokenPresent: false`, `httpStatus: null` and `pass: false`. This is configuration evidence only and does not answer the provider capability question.

A green Observability capability preflight still does **not** close AR-006 and does **not** authorize an immediate exact-size rerun. It only authorizes redesigning and independently reviewing the final exact-25-MB evidence harness around attributable provider `cpuTimeMs` events.

If the API returns no attributable Pages event or no numeric CPU after a correctly scoped token is configured, keep WP-2.9C blocked and return to the architecture review. If making telemetry visible would require a material Pages/Workers runtime or configuration migration, make that decision explicitly before changing the deployment architecture.

## Historical provider-evidence trigger

The existing `[AR006-EVIDENCE]` path is the historical GraphQL-based exact-size harness. **Do not trigger it again merely because the Observability capability preflight becomes green.** The final evidence harness must first be deliberately redesigned and reviewed to use the approved provider channel.

The historical evidence candidate is a commit on `lot-2/venues-core` whose message contains the literal marker:

```text
[AR006-EVIDENCE]
```

The safest trigger after a repository-green candidate is selected is a no-content commit using the exact current tree, so the only new commit semantic is the evidence request itself. Its SHA becomes the evidence-bound candidate SHA.

The normal CI starts on that push. `ar006-provider-evidence` does **not** start until `full-verify` succeeds on that exact SHA.

If any normal repository gate fails, provider deployment never begins.

If the evidence marker is absent, the provider-evidence job is skipped.

## Historical provider-evidence execution

The currently implemented `[AR006-EVIDENCE]` job is retained as historical/reproducibility support for the already-recorded GraphQL attempt. Until the architecture review approves a revised final evidence design, it must not be treated as the next execution path.

Its existing implementation:

1. checks out the exact evidence-trigger SHA with persisted Git credentials disabled;
2. requires the isolated Workers Free attestation and all non-secret environment metadata;
3. installs dependencies and runs secret scanning;
4. runs `npm run preflight:ar006` with the isolated deployment/analytics credentials and synthetic-user password, requiring read-only Pages configuration, Analytics access and live Supabase `documents.write` readiness before any deployment or data mutation;
5. builds the exact candidate;
6. deploys `dist/` **and the repository Pages Functions** through pinned Wrangler `4.131.2` to an isolated preview branch derived from the exact Git SHA;
7. queries the Pages API and requires `uses_functions=true`;
8. verifies that the preview configuration exposes the expected non-production Supabase values and an encrypted `PRIVATE_DOCUMENT_ADMIN_KEY` binding without printing the secret;
9. resolves the exact deployment ID, URL, branch and `preview_script_name` for the same commit SHA;
10. runs `smoke:private-document-production` against that deployment;
11. signs in as the ordinary synthetic Supabase user;
12. constructs one deterministic synthetic PDF of exactly `25,000,000` bytes;
13. performs 10 separate reserve → staging upload → bodyless trusted promotion → finalize attempts using unique document IDs;
14. spaces promotions so provider analytics can attribute controlled requests to distinct time buckets;
15. polls Cloudflare `workersInvocationsAdaptive` for request/error/status and raw CPU p50/p99 values for the isolated preview script and evidence window;
16. normalizes raw CPU microseconds to milliseconds by dividing by `1000` and retains **both** representations in the sanitized artifact;
17. requires exactly 10 attributable request buckets, one request each, zero errors, `success` status and both normalized CPU quantiles `<= 10 ms` for every bucket;
18. writes only sanitized metadata to `ar006-workers-free-evidence.json` using schema `mariage-os.wp29c.ar006.v2`;
19. uploads that JSON as a 30-day Actions artifact, including on a provider-gate failure when a sanitized evidence file exists.

The job does not merge the branch, change production, enable Workers Paid, change the 25 MB contract or auto-transition WP-2.9C.

## Synthetic PDF

The historical harness creates a structurally minimal deterministic PDF beginning with `%PDF-1.4` and pads it to exactly `25,000,000` bytes.

The bytes exist only in runner memory and in the isolated test Storage objects. PDF contents are never written to the evidence artifact.

## Historical GraphQL CPU attribution rule

The original harness uses Cloudflare's account-level `workersInvocationsAdaptive` dataset with dimensions `datetime`, `scriptName` and `status`, plus `cpuTimeP50` and `cpuTimeP99`.

The provider CPU quantiles are interpreted as microseconds. Each historical evidence row therefore contains:

- `cpuTimeP50Us` / `cpuTimeP99Us`: raw Cloudflare quantile values;
- `cpuTimeP50Ms` / `cpuTimeP99Ms`: raw values divided by exactly `1000`;
- the `10 ms` acceptance comparison is performed **only** against the normalized millisecond fields.

Historical acceptance logic was intentionally stricter than a broad dashboard screenshot:

- Pages API supplies the isolated project's preview script name;
- the evidence window surrounds only the controlled promotions after the deny smoke;
- promotions are spaced apart;
- analytics must contain exactly 10 requests for that script inside the evidence window;
- exactly 10 rows must remain, each carrying one request;
- each row must report zero errors and `success` status;
- normalized CPU p50 and p99 must both be present and `<= 10 ms` for every retained row;
- extra traffic contaminates attribution and fails the run rather than being discarded.

The 2026-09-16 execution proved that this GraphQL channel did not return the required rows for the isolated Pages preview, including after a delayed requery. Do not infer units from field magnitude and do not replace CPU telemetry with wall time.

## Sanitized artifact requirements

Any final AR-006 exact-size artifact may contain only:

- schema/version marker;
- generation timestamp;
- exact Git SHA;
- Pages project name;
- deployment ID/URL/branch/script name;
- isolated Workers Free operator attestation;
- exact byte size and synthetic SHA-256;
- synthetic project/document UUIDs;
- controlled request timestamps and HTTP status/success booleans;
- provider attribution and CPU-specific fields required by the approved evidence channel;
- CPU budget in milliseconds and final pass boolean.

It must not contain credentials, bearer/session tokens, `PRIVATE_DOCUMENT_ADMIN_KEY`, passwords, PDF bytes, raw provider logs/source payloads or real wedding identifiers/content.

## Success handling

A green capability or final provider job does **not** automatically close AR-006.

For an Observability capability success:

1. inspect the sanitized capability artifact and exact workflow SHA;
2. verify attribution to the existing exact Pages deployment/script and numeric provider `cpuTimeMs`;
3. verify no Paid entitlement or material runtime migration was introduced;
4. redesign the final exact-size evidence harness around the proven provider channel;
5. review and repository-verify that revised harness before another exact-size mutation run.

For ADR 0012 final exact-size evidence, before changing packet state:

1. download and inspect every sanitized artifact for the exact Actions run;
2. verify the run SHA equals the intended evidence candidate and Pages deployment metadata resolves to that same SHA;
3. verify the Worker deployment receipt contains the SHA-derived tag/full-SHA message, one 100%-traffic version ID and the `PrivateDocumentLifecycle` named handler;
4. verify the Cloudflare account/project used Workers Free with no Paid CPU entitlement;
5. verify all ten controlled promotions were HTTP 200 and independently finalized/verified `ready`;
6. verify exactly one attributable provider invocation per evidence UUID on each surface, complete/non-truncated telemetry pages and provider request-identity joins;
7. verify every Pages invocation is `executionModel=stateless`, `outcome=ok`, has finite non-negative `cpuTimeMs <= 10`, and no CPU-limit outcome;
8. verify every lifecycle invocation is `executionModel=durableObject`, `outcome=ok`, has finite non-negative `cpuTimeMs <= 30,000`, the exact captured Worker `scriptVersion.id`, a non-null unique Durable Object ID and no CPU-limit outcome;
9. verify ten controlled documents produced ten distinct Durable Object IDs and that the 25,000,000-byte product contract remained unchanged;
10. verify deny smoke and the pre-mutation marker/route preflights passed;
11. record sanitized evidence durably in FIR/repository records without credentials or raw provider events;
12. keep complete exact-head CI/clean-checkout evidence for that candidate;
13. only then consider transitioning C to `REVIEW_PENDING` and start a new independent Pass B over AR-001..007.

After accepted evidence capture, reset or destroy dedicated synthetic test data according to the non-production test-data procedure. Do not use an application bypass or production credential merely for cleanup.

## Failure handling

A red readiness preflight means provider/GitHub Environment configuration is incomplete or unauthorized; it is not CPU feasibility evidence. Correct the isolated configuration and repeat the relevant read-only preflight before any evidence trigger.

A red Workers Observability capability preflight before an actual API call, such as an absent dedicated token, is external configuration evidence only. Correct the scoped secret and rerun `[AR006-OBS-PREFLIGHT]`.

A correctly authorized Observability response with no attributable Pages event or no numeric provider CPU keeps WP-2.9C blocked and returns the packet to explicit architecture review; it does not authorize a fallback to wall time, Pages tail, Paid CPU or a smaller file.

A red final provider-evidence job is evidence, not permission to weaken the contract.

If any exact-size promotion/finalization fails, Pages CPU exceeds `10 ms`, Durable Object CPU exceeds `30,000 ms`, either surface has a CPU-limit/non-`ok` outcome, execution model/version/DO identity is wrong, attribution is ambiguous, telemetry is missing/duplicate/truncated, metric units cannot be established, or success requires Paid CPU, keep AR-006 OPEN/BLOCKING and return to explicit architecture review.

Do not silently enable Workers Paid and do not reduce the `25,000,000`-byte PDF contract.

## ADR 0011 Worker evidence protocol (historical — superseded by ADR 0012)

The earlier GraphQL, Pages-tail and unchanged-Pages Observability experiments are
historical failure evidence. They must not be retried as the final acceptance
channel. ADR 0011 was the approved execution path for that historical attempt and was superseded after deployed provider CPU evidence failed its stateless Workers Free budget.

### Isolated provider topology

```text
browser -> Pages /api/private-document-promote -> PRIVATE_DOCUMENT_PROMOTION_WORKER -> Supabase
```

The Pages route performs the same-origin, method, target, bearer and bodyless
frame checks before forwarding. The Worker is deployed first with
`workers_dev: false`, no public route, persisted invocation logs and
`head_sampling_rate: 1`. It repeats all trusted-promotion authorization and
integrity checks. Pages keeps the DELETE abandon route; DELETE is outside this
CPU exercise.

The Worker and Pages preview each receive the same isolated
`PRIVATE_DOCUMENT_ADMIN_KEY` as separate encrypted provider secrets. They also
receive the isolated `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` bindings.
The worker secret never enters GitHub Actions, repository files or evidence.
Pages declares `PRIVATE_DOCUMENT_PROMOTION_WORKER` as a Service Binding to
`mariage-os-private-document-promotion`.

### Current GitHub Environment inventory

Non-secret variables:

| Name | Required value/purpose |
|---|---|
| `AR006_PRIVATE_DOCUMENT_WORKER` | exactly `mariage-os-private-document-promotion` |
| existing AR-006 Pages/Supabase/project/Free-attestation variables | unchanged isolated metadata |

Secrets:

| Name | Minimum scope |
|---|---|
| `AR006_CLOUDFLARE_DEPLOY_TOKEN` | isolated Pages project configuration/deploy write |
| `AR006_CLOUDFLARE_WORKER_DEPLOY_TOKEN` | isolated Worker Scripts write |
| `AR006_CLOUDFLARE_OBSERVABILITY_TOKEN` | Workers Observability telemetry query permission only |
| `AR006_TEST_USER_PASSWORD` | synthetic isolated user only |

All Cloudflare API tokens are short-lived and independently scoped. The
historical Analytics token is not used by the current preflight or final
harness. It is retained only for the historical requery workflow and must not
be widened or substituted for these tokens.

### Execution order

1. Commit and pass ordinary repository CI for the exact Worker implementation.
2. Trigger `[AR006-WORKER-BOOTSTRAP]`; it deploys only the private Worker with
   `--keep-vars` and performs no application mutation.
3. Set the three non-secret Supabase bindings and the encrypted
   `PRIVATE_DOCUMENT_ADMIN_KEY` on the Worker; create the Pages Service Binding.
   Verify the Page and Worker are both isolated before proceeding.
4. Trigger `[AR006-PREFLIGHT]`. It checks Pages binding presence and synthetic
   user authorization without deploying, reserving, uploading or promoting.
5. Trigger `[AR006-EVIDENCE]` only after the exact normal `full-verify` and
   preflight are green. The job redeploys the private Worker first with
   `--keep-vars`, deploys the exact Pages preview candidate, runs deny smoke,
   then performs ten sequential synthetic `25,000,000`-byte promotions.
6. The final harness assigns a version-4 UUID to each controlled promotion.
   The Worker logs only `{ event, evidenceId, status }`. The telemetry query
   obtains the associated `cf-worker-event` by provider request ID and retains
   only synthetic identifiers, HTTP status, outcome and numeric `cpuTimeMs`.
7. Accept the provider portion only if there are exactly ten successful
   promotions and exactly one HTTP-200 invocation log per UUID, every one has a
   numeric `cpuTimeMs <= 10`, and no `exceededCpu` outcome. The uploaded JSON
   contains no raw provider event, PDF bytes, token, password or server secret.

Any missing/duplicate marker, missing/duplicate invocation, non-numeric CPU,
provider query error, status mismatch, CPU over budget or CPU-limit outcome is
an AR-006 failure. Do not replace it with a dashboard aggregate, wall time,
Paid compute or a smaller file.

### Rate-limited private-Worker requery

The exact source attempt
`bdb3d95cc788d4b43205fe9c0e109966f72c7798` completed its ten application
promotions before the final Workers Observability query failed with HTTP `429`
and provider code `10429`. That original artifact remains failed closed. The
provider documentation requires REST clients to use `Retry-After` before
retrying a rate-limited request.

The source query is described in `WP-2.9C-AR-006-WORKER-REQUERY.md` and is
triggered by `[AR006-WORKER-REQUERY]` after ordinary `full-verify`. Its first
execution at `2ef0e13b755ffc609972ac83c1d2260ca73ff8de` completed normal CI but
received HTTP `401` / provider code `10000` for all three query attempts
(artifact `10544340701`, ZIP SHA-256
`d048098fa251b409ca8545fcda4d9e72c50cd76ebb3810d1b290e88be0bb0424`). This
credential/configuration failure contains no provider observation.

The one recovery execution used the corrected dedicated Observability secret
and the same retained source range and opaque UUID correlation set at
`a937d6e1484640afba52848e895f5480ab4ea8a8` / CI `35339776360`. Normal CI was
5/5 SUCCESS including clean-checkout verification, but the source query again
returned HTTP `401` / provider code `10000` three times. Artifact `10545420236`
(ZIP SHA-256 `dbac3d188a41dfc94420618406456d6a17f65ddbec485507a4fe98100e09eb86`)
records zero measurements and `pass: false`.

The bounded requery path is exhausted. This outcome keeps AR-006 open and
returns to architecture review; it does not authorize a new ten-promotion
campaign, another telemetry query, token rotation or scope change.
