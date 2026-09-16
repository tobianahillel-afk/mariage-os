# WP-2.9C / WP29C-AR-006 — deployed Workers Free evidence runbook

Status: **EXECUTION SUPPORT — DOES NOT CLOSE AR-006 BY ITSELF**

Related blocker: `WP-2.9C-AR-006-CPU-EVIDENCE.md`

Related packet: `WP-2.9C`

Related FIR: `#17 / FTR-089`

Workflow: `.github/workflows/ar006-workers-free-evidence.yml`

Evidence harness: `scripts/run-private-document-ar006-evidence.mjs`

## Purpose

This runbook turns the AR-006 provider-evidence protocol into one reproducible, manual, fail-closed execution path. It does not weaken the frozen `25,000,000`-byte contract, does not authorize Workers Paid, and does not make a production deployment.

The workflow remains manual (`workflow_dispatch`) and targets the protected GitHub Environment `ar006-isolated`. It must not be enabled on `push` or `pull_request` because arbitrary branch code must never receive deployment, analytics or synthetic-user credentials.

A successful workflow run is still only evidence input. AR-006 remains open until its sanitized provider evidence is reviewed, durably attached to the FIR/repository record, the evidence-bound exact HEAD passes the complete verification gate again, and the later fresh Pass B accepts the whole packet.

## Provider basis

Current Cloudflare contracts used by this runbook:

- Pages Direct Upload with Wrangler: <https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/>;
- Pages API / deployment metadata: <https://developers.cloudflare.com/pages/configuration/api/>;
- Pages Functions metrics: <https://developers.cloudflare.com/pages/functions/metrics/>;
- Workers metrics GraphQL query shape: <https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-workers-metrics/>;
- Workers Free CPU budget: <https://developers.cloudflare.com/workers/platform/limits/>;
- Analytics token permission: `Account Analytics Read`;
- Pages deployment token permission: `Cloudflare Pages Edit` / `Pages Write` for the isolated Pages project/account.

The Workers Free CPU limit was rechecked on 2026-09-16 and remains `10 ms` per HTTP request. Provider contracts must be rechecked before a later evidence run if Cloudflare behavior, Wrangler, limits or metrics semantics have changed.

## Isolated environment prerequisites

Provision a non-production Cloudflare Pages project and a non-production Supabase project dedicated to this evidence exercise. Do not use real wedding content, production credentials or a couple's real project.

The isolated Supabase project must contain the current migrations and one synthetic member with live `documents.write` on one synthetic project. The workflow does not use a Supabase service credential directly. It signs in as that ordinary synthetic user, reserves each pending document through `manage_private_document`, uploads to the existing authenticated staging policy, invokes the deployed trusted Pages route, then finalizes successful promotions through the ordinary RPC.

The isolated Pages **preview** environment must already expose:

- `SUPABASE_URL` as the intended non-production Supabase URL;
- `SUPABASE_PUBLISHABLE_KEY` as the intended non-secret browser key;
- `PRIVATE_DOCUMENT_ADMIN_KEY` as an encrypted Cloudflare Pages secret for that same non-production Supabase project.

`PRIVATE_DOCUMENT_ADMIN_KEY` must not be copied into GitHub Actions secrets for this run. The workflow verifies only that the Pages preview binding exists as `secret_text`; it never reads or prints the value.

The Cloudflare account/project used for the run must be on Workers Free with no Paid CPU entitlement used for the controlled execution. The manual dispatch requires the explicit value `YES-WORKERS-FREE-ISOLATED`; that operator attestation is recorded in the sanitized evidence but does not replace provider CPU telemetry.

## GitHub Environment contract

Create the GitHub Environment named exactly `ar006-isolated`. Apply environment protection/reviewer controls if available so the workflow cannot receive credentials without deliberate approval.

Configure these **environment variables**:

| Name | Classification | Purpose |
|---|---|---|
| `AR006_PAGES_PROJECT` | non-secret metadata | isolated Cloudflare Pages project name |
| `CLOUDFLARE_ACCOUNT_ID` | non-secret metadata | Cloudflare account identifier used by Pages/GraphQL APIs |
| `AR006_SUPABASE_URL` | public-client configuration | isolated Supabase URL |
| `AR006_SUPABASE_PUBLISHABLE_KEY` | public-client configuration | isolated Supabase publishable/anon-equivalent key |
| `AR006_TEST_USER_EMAIL` | synthetic test metadata | ordinary isolated Supabase user used for the proof |
| `AR006_PROJECT_ID` | synthetic test metadata | existing synthetic project where the test user has `documents.write` |

Configure these **environment secrets**:

| Secret | Minimum scope | Storage | Rotation / revocation |
|---|---|---|---|
| `AR006_CLOUDFLARE_DEPLOY_TOKEN` | Cloudflare Pages Edit/Pages Write for the isolated account/project only | GitHub Environment `ar006-isolated` | short-lived where possible; revoke in Cloudflare immediately after the evidence exercise or on suspected exposure; replace before rerun |
| `AR006_CLOUDFLARE_ANALYTICS_TOKEN` | Account Analytics Read for the isolated Cloudflare account only | GitHub Environment `ar006-isolated` | short-lived where possible; revoke after evidence capture; no write permission |
| `AR006_TEST_USER_PASSWORD` | only the synthetic non-production Supabase user | GitHub Environment `ar006-isolated` | rotate/delete the synthetic user after the evidence exercise; never reuse a real-user password |

This table is the metadata-only inventory for the AR-006 evidence-specific credentials and supplements `docs/security/SECRET-MANAGEMENT.md`. No value, hash, fingerprint or bearer token belongs in Git, Actions artifacts, FIR comments or screenshots.

## Dispatch contract

Run `AR-006 Workers Free evidence` manually from the exact candidate ref and provide:

- `expected_sha`: the full 40-character commit SHA intended for evidence;
- `workers_free_attestation`: exactly `YES-WORKERS-FREE-ISOLATED`.

The workflow fails before deployment if `github.sha` differs from `expected_sha`, the Free attestation is absent, required metadata is missing, or the deploy token is unavailable.

The workflow then:

1. checks out the exact SHA with persisted Git credentials disabled;
2. installs dependencies and runs secret scanning + application build;
3. deploys `dist/` **and the repository Pages Functions** through pinned Wrangler `4.131.2` to an isolated preview branch tied to the exact Git SHA;
4. queries Cloudflare Pages metadata and requires a successful preview deployment for the same SHA with `uses_functions=true`;
5. verifies the preview configuration names/type for the trusted private-document boundary without printing secret values;
6. resolves the exact deployment ID, URL, branch and Cloudflare `preview_script_name`;
7. runs the existing deny-oriented `smoke:private-document-production` against that deployment;
8. signs in as the ordinary synthetic Supabase user;
9. constructs one synthetic PDF of exactly `25,000,000` bytes and one SHA-256 value;
10. performs 10 separate reserve → staging upload → same-origin bodyless trusted promotion → finalize attempts using unique document IDs;
11. spaces promotions so Cloudflare `workersInvocationsAdaptive` can expose one controlled request per second bucket;
12. polls Account Analytics for `requests`, `errors`, invocation `status`, `cpuTimeP50` and `cpuTimeP99` for the deployment's preview script and isolated evidence window;
13. requires exactly 10 attributable request buckets, one request each, zero errors, `success` status, and both retained CPU quantiles `<= 10 ms` for every bucket;
14. writes only sanitized metadata to `ar006-workers-free-evidence.json`;
15. uploads that JSON as a 30-day GitHub Actions artifact even when the provider gate itself fails after the evidence file has been produced.

The workflow does not promote the branch, modify production, change the 25 MB contract, or auto-transition WP-2.9C.

## Synthetic PDF

The harness creates a structurally minimal PDF beginning with `%PDF-1.4`, containing a small Catalog/Pages/Page object graph and xref/trailer, with deterministic comment padding adjusted until the byte length is exactly `25,000,000`. The bytes are generated only in runner memory and uploaded only to the isolated Supabase project. PDF contents are never written to the evidence artifact.

## CPU attribution rule

The evidence harness uses Cloudflare's account-level `workersInvocationsAdaptive` dataset with dimensions `datetime`, `scriptName` and `status`, plus `cpuTimeP50`/`cpuTimeP99`.

The acceptance logic is intentionally stricter than a broad aggregate dashboard screenshot:

- the Pages API supplies the isolated project's `preview_script_name`;
- the evidence window begins immediately around the controlled promotions, after the deny smoke;
- promotions are spaced apart;
- the analytics window must contain exactly 10 requests for that script;
- the dataset must return exactly 10 rows, each with exactly one request;
- therefore the retained p50/p99 values in each row are attributable to one controlled invocation bucket;
- any extra traffic contaminates attribution and fails the run rather than being ignored;
- any non-success status, request error, missing CPU value, CPU value above `10 ms`, or failed HTTP promotion makes the evidence result fail.

Cloudflare metric sampling/aggregation behavior remains a provider dependency. If the provider no longer exposes sufficiently attributable data on Workers Free, the workflow must fail and AR-006 remains blocked; do not substitute wall time.

## Sanitized artifact schema

`ar006-workers-free-evidence.json` may contain only:

- schema/version marker;
- generation timestamp;
- exact Git SHA;
- Pages project name;
- deployment ID/URL/branch/script name;
- explicit isolated Workers Free operator attestation;
- exact byte size and synthetic SHA-256;
- synthetic project/document UUIDs;
- request timestamps and HTTP status/success booleans;
- analytics window;
- provider request/error/status fields;
- CPU p50/p99 values;
- CPU budget and final pass boolean.

It must not contain:

- Cloudflare API tokens;
- Supabase bearer/session tokens;
- `PRIVATE_DOCUMENT_ADMIN_KEY`;
- synthetic-user password;
- real/private PDF contents;
- real wedding IDs, names, documents or project data.

## Success handling

A green workflow does **not** automatically close AR-006. Before changing packet state:

1. download and inspect the artifact for the exact workflow run;
2. verify the workflow run SHA equals the intended candidate and the Pages deployment metadata matches it;
3. verify the account/project was actually Workers Free and no Paid CPU entitlement was used;
4. verify all 10 controlled promotions succeeded and every retained CPU measurement is within the normal `10 ms` budget;
5. verify the deny smoke passed and Pages Functions were present;
6. record the sanitized evidence durably in the FIR/repository without credentials;
7. rerun complete exact-head CI + clean-checkout verification;
8. only then consider `REVIEW_PENDING` and perform a new complete independent Pass B over AR-001..007.

After retaining the accepted evidence, reset or destroy the dedicated non-production Supabase test data/environment according to its test-data procedure so repeated evidence runs do not accumulate synthetic 25 MB canonical objects. Do not use an application bypass or production credential merely for cleanup.

## Failure handling

A red workflow is evidence, not a reason to weaken the contract.

If exact-size promotions fail with resource exhaustion, provider metrics exceed `10 ms`, attribution is contaminated, metrics are unavailable, or the run can only succeed with Paid CPU, keep WP-2.9C `BLOCKED` and reopen architecture review. Do not silently enable Workers Paid and do not reduce the `25,000,000`-byte PDF contract.
