# WP-2.9C / WP29C-AR-006 — deployed Workers Free evidence runbook

Status: **EXECUTION SUPPORT — DOES NOT CLOSE AR-006 BY ITSELF**

Related blocker: `WP-2.9C-AR-006-CPU-EVIDENCE.md`

Related packet: `WP-2.9C`

Related FIR: `#17 / FTR-089`

Execution job: `.github/workflows/ci.yml` → `ar006-provider-evidence`

Provider preflight: `npm run preflight:ar006`

Evidence harness: `scripts/run-private-document-ar006-evidence.mjs`

CPU normalization helper: `scripts/private-document-ar006-metrics.mjs`

CPU regression control: `npm run test:ar006:metrics`

## Purpose

This runbook turns the AR-006 provider-evidence protocol into one reproducible, fail-closed execution path that can run **before Lot-2 integration to `main`**.

It does not weaken the frozen `25,000,000`-byte contract, does not authorize Workers Paid, does not use production wedding data, and does not auto-transition WP-2.9C.

The evidence job is part of the normal branch CI because GitHub `workflow_dispatch` only receives events when the workflow file exists on the repository default branch. WP-2.9C must obtain this evidence before it can be accepted and integrated, so a Lot-2-only standalone dispatch workflow would not be executable at the required phase.

The job is therefore guarded by all of these conditions:

- event is `push`;
- ref is exactly `refs/heads/lot-2/venues-core`;
- pushed commit message contains the explicit marker `[AR006-EVIDENCE]`;
- normal `full-verify` succeeds first;
- GitHub Environment is exactly `ar006-isolated`;
- environment variable `AR006_WORKERS_FREE_ATTESTATION` is exactly `YES-WORKERS-FREE-ISOLATED`;
- all required isolated-provider metadata and credentials are present.

On ordinary pushes and pull requests the provider-evidence job is skipped and receives no environment credentials.

A successful provider-evidence job is still only evidence input. AR-006 remains open until its sanitized provider evidence is reviewed, durably attached to the FIR/repository record, the exact evidence-bound HEAD remains fully verified, and the later fresh Pass B accepts the whole packet.

## Provider basis

Current Cloudflare contracts used by this runbook:

- Pages Direct Upload with Wrangler: <https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/>;
- Pages API / deployment metadata: <https://developers.cloudflare.com/pages/configuration/api/>;
- Pages Functions metrics: <https://developers.cloudflare.com/pages/functions/metrics/>;
- Workers metrics GraphQL query shape: <https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-workers-metrics/>;
- Workers Free limits: <https://developers.cloudflare.com/workers/platform/limits/>;
- Cloudflare GraphQL reference: `workersInvocationsAdaptive` CPU aggregation uses microseconds (`cpuTimeUs`), and CPU quantiles belong to that same CPU-time family;
- analytics credential: Account Analytics Read;
- deployment credential: the narrowest Pages write/edit permission that supports the isolated project.

The normal Workers Free CPU limit was rechecked on 2026-09-16 as `10 ms` per HTTP request. Provider contracts must be rechecked before a later evidence run if Cloudflare limits or metric semantics change.

The GraphQL `cpuTimeP50` / `cpuTimeP99` values consumed by this runbook are treated as **microseconds**. The harness records the raw values as `cpuTimeP50Us` / `cpuTimeP99Us`, divides by exactly `1000`, and records the normalized values as `cpuTimeP50Ms` / `cpuTimeP99Ms` before comparing them with the `10 ms` Free budget. `npm run test:ar006:metrics` locks this unit conversion and the 10 ms boundary into repository CI.

## Isolated environment prerequisites

Provision a non-production Cloudflare Pages project and a non-production Supabase project dedicated to this evidence exercise.

Do not use:

- production Cloudflare credentials;
- production Supabase credentials;
- real wedding content;
- real couple/member accounts;
- a paid Workers CPU entitlement to make the gate pass.

The isolated Supabase project must contain the current migrations and one synthetic member with live `documents.write` on one synthetic project.

The harness signs in as that ordinary synthetic user, reserves each pending document through `manage_private_document`, uploads through the authenticated staging policy, invokes the deployed trusted Pages route, and finalizes successful promotions through the ordinary RPC.

The isolated Pages **preview** environment must already expose:

- `SUPABASE_URL` for the isolated Supabase project;
- `SUPABASE_PUBLISHABLE_KEY` for that project;
- `PRIVATE_DOCUMENT_ADMIN_KEY` as an encrypted Pages secret for that same isolated Supabase project.

`PRIVATE_DOCUMENT_ADMIN_KEY` must not be copied into GitHub Actions secrets. The evidence job verifies only that the Pages preview binding exists as `secret_text`; it never reads or prints its value.

Before any candidate build or deployment, `npm run preflight:ar006` performs only read-only readiness checks: it verifies access to the isolated Pages project and expected preview bindings, verifies the Analytics token can query the intended Cloudflare account, signs in as the synthetic Supabase user, and requires live `documents.write` through `has_project_permission`. The preflight does not deploy, reserve a document, upload bytes, call the trusted promotion route, or mutate application data.

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
| `AR006_CLOUDFLARE_ANALYTICS_TOKEN` | Account Analytics Read for the isolated Cloudflare account | revoke after evidence capture; no write permission |
| `AR006_TEST_USER_PASSWORD` | only the synthetic non-production Supabase user | rotate/delete the synthetic user after the evidence exercise |

This table is the metadata-only inventory for AR-006-specific credentials and supplements `docs/security/SECRET-MANAGEMENT.md`.

No token value, hash, fingerprint or password belongs in Git, Actions artifacts, FIR comments or screenshots.

## Trigger contract

Do not trigger the provider job until the isolated Cloudflare/Supabase environment and GitHub Environment are ready.

The evidence candidate is a commit on `lot-2/venues-core` whose message contains the literal marker:

```text
[AR006-EVIDENCE]
```

The safest trigger after a repository-green candidate is selected is a no-content commit using the exact current tree, so the only new commit semantic is the evidence request itself. Its SHA becomes the evidence-bound candidate SHA.

The normal CI starts on that push. `ar006-provider-evidence` does **not** start until `full-verify` succeeds on that exact SHA.

If any normal repository gate fails, provider deployment never begins.

If the marker is absent, the provider job is skipped.

## Provider-evidence execution

After `full-verify` succeeds, the provider job:

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

The harness creates a structurally minimal deterministic PDF beginning with `%PDF-1.4` and pads it to exactly `25,000,000` bytes.

The bytes exist only in runner memory and in the isolated test Storage objects. PDF contents are never written to the evidence artifact.

## CPU attribution rule

The harness uses Cloudflare's account-level `workersInvocationsAdaptive` dataset with dimensions `datetime`, `scriptName` and `status`, plus `cpuTimeP50` and `cpuTimeP99`.

The provider CPU quantiles are interpreted as microseconds. Each evidence row therefore contains:

- `cpuTimeP50Us` / `cpuTimeP99Us`: raw Cloudflare quantile values;
- `cpuTimeP50Ms` / `cpuTimeP99Ms`: raw values divided by exactly `1000`;
- the `10 ms` acceptance comparison is performed **only** against the normalized millisecond fields.

Acceptance is intentionally stricter than a broad dashboard screenshot:

- Pages API supplies the isolated project's preview script name;
- the evidence window surrounds only the controlled promotions after the deny smoke;
- promotions are spaced apart;
- analytics must contain exactly 10 requests for that script inside the evidence window;
- exactly 10 rows must remain, each carrying one request;
- each row must report zero errors and `success` status;
- normalized CPU p50 and p99 must both be present and `<= 10 ms` for every retained row;
- extra traffic contaminates attribution and fails the run rather than being discarded.

If Cloudflare changes the units/semantics of these fields or no longer exposes sufficiently attributable Free-plan metrics, AR-006 remains blocked until the harness and evidence contract are deliberately revalidated. Do not infer units from field magnitude and do not replace CPU telemetry with wall time.

## Sanitized artifact schema

`ar006-workers-free-evidence.json` schema `mariage-os.wp29c.ar006.v2` may contain only:

- schema/version marker;
- generation timestamp;
- exact Git SHA;
- Pages project name;
- deployment ID/URL/branch/script name;
- isolated Workers Free operator attestation;
- exact byte size and synthetic SHA-256;
- synthetic project/document UUIDs;
- controlled request timestamps and HTTP status/success booleans;
- analytics window;
- provider request/error/status fields;
- raw CPU p50/p99 values in microseconds;
- normalized CPU p50/p99 values in milliseconds;
- CPU budget in milliseconds and final pass boolean.

It must not contain credentials, bearer/session tokens, `PRIVATE_DOCUMENT_ADMIN_KEY`, passwords, PDF bytes or real wedding identifiers/content.

## Success handling

A green provider job does **not** automatically close AR-006.

Before changing packet state:

1. download and inspect the artifact for the exact Actions run;
2. verify the run SHA equals the intended evidence candidate;
3. verify Pages deployment metadata resolves to that same SHA;
4. verify the Cloudflare account/project really used Workers Free with no Paid CPU entitlement;
5. verify all 10 controlled promotions succeeded and every retained **normalized** CPU measurement is within `10 ms`;
6. verify raw microsecond and normalized millisecond values are both present and arithmetically consistent;
7. verify the deny smoke passed and Pages Functions were present;
8. record sanitized evidence durably in FIR/repository records without credentials;
9. keep complete exact-head CI/clean-checkout evidence for that candidate;
10. only then consider transitioning C to `REVIEW_PENDING` and start a new independent Pass B over AR-001..007.

After accepted evidence capture, reset or destroy dedicated synthetic test data according to the non-production test-data procedure. Do not use an application bypass or production credential merely for cleanup.

## Failure handling

A red provider job is evidence, not permission to weaken the contract.

If exact-size promotions fail, normalized CPU exceeds `10 ms`, attribution is contaminated, metrics are unavailable, metric units cannot be established, or success requires Paid CPU, keep WP-2.9C `BLOCKED` and reopen architecture review.

Do not silently enable Workers Paid and do not reduce the `25,000,000`-byte PDF contract.
