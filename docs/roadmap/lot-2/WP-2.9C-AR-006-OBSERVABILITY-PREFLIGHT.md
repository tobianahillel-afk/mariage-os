# WP-2.9C / WP29C-AR-006 — Workers Observability capability preflight

Status: **EXECUTION SUPPORT — CAPABILITY ONLY; DOES NOT CLOSE AR-006**

Related blocker: `WP-2.9C-AR-006-CPU-EVIDENCE.md`

Architecture review: `WP-2.9C-AR-006-ARCHITECTURE-REVIEW.md`

Workflow: `.github/workflows/ar006-observability-preflight.yml`

Harness: `scripts/run-private-document-ar006-observability-preflight.mjs`

## Purpose

The original `workersInvocationsAdaptive` GraphQL evidence channel returned no attributable CPU rows during the exact-size provider run or its delayed requery. A later deny-only Pages deployment-tail probe also failed closed and the documented standard Pages-tail event contract does not define CPU time.

Cloudflare Workers Observability telemetry is the next bounded provider-native candidate because its current event model defines `$workers.cpuTimeMs`, request ID, script name and outcome, and its metadata model includes `pages` as a cloud-service origin.

This preflight answers only one question: **can the existing exact isolated Pages preview invocation be observed with provider `cpuTimeMs` through Workers Observability without changing runtime architecture?**

## Frozen target

- Pages project: `mariage-os-ar006-isolated`.
- Existing deployment: `064d50b9-3c3d-414e-a6c3-afdcc1051be9`.
- Existing deployment URL: `https://064d50b9.mariage-os-ar006-isolated.pages.dev`.
- Exact preview script: `pages-worker--19505720-preview`.
- Runtime/plan remains Workers Free / Pages Functions.
- No new exact-size PDF run is authorized by this preflight.

## Provider permission boundary

Cloudflare currently documents `Workers Observability Write` as an accepted API-token permission for the telemetry query/key endpoints. The preflight therefore uses a dedicated short-lived GitHub Environment secret:

`AR006_CLOUDFLARE_OBSERVABILITY_TOKEN`

This secret must be independent from:

- `AR006_CLOUDFLARE_DEPLOY_TOKEN`;
- `AR006_CLOUDFLARE_ANALYTICS_TOKEN`;
- Supabase credentials;
- `PRIVATE_DOCUMENT_ADMIN_KEY`.

The token value must never be printed, committed, added to an artifact or copied into documentation.

## Trigger and isolation

A push to `lot-2/venues-core` whose head commit contains `[AR006-OBS-PREFLIGHT]` is the only authorized trigger. Ordinary pushes skip the provider job and do not receive the Observability token.

The workflow uses GitHub Environment `ar006-isolated`, repository permission `contents: read`, and no deployment permission.

## Execution contract

The capability probe:

1. checks repository secret scanning;
2. calls the existing production deny smoke against the exact deployment;
3. does **not** supply a bearer token to the application and does not authenticate to Supabase;
4. does **not** reserve a document, upload bytes, promote/finalize data or deploy code;
5. queries a short Workers Observability window with an exact `$workers.scriptName = pages-worker--19505720-preview` filter;
6. polls only a bounded number of times for provider ingestion delay;
7. strips raw `source`/application log content and retains only provider metadata required for the capability decision;
8. fails closed if provider authorization fails, no exact-script event is found or no numeric `cpuTimeMs` is present.

## Sanitized artifact

`ar006-workers-observability-preflight.json` may retain:

- exact non-secret Pages project/deployment/script identifiers;
- Workers Free attestation label;
- HTTP status and Cloudflare success boolean;
- error codes only, never provider error messages containing request context;
- query timeframe and attempt count;
- event ID, cloud-service origin, request ID, exact script name, event type, outcome, `cpuTimeMs`, `wallTimeMs`, status code and whether CPU is within 10 ms;
- final `pass` boolean.

It must not retain authorization headers, tokens, raw source/log payloads, private PDF content or real wedding data.

## Pass / fail semantics

A capability preflight passes only when at least one event attributable to the exact script contains numeric provider `cpuTimeMs` and the provider API request itself succeeds.

A green capability preflight is **not AR-006 acceptance evidence**. It only permits designing a new exact-25-MB evidence run that captures provider CPU for at least ten controlled successful promotions under the unchanged 10 ms Workers Free budget.

If this preflight cannot expose provider CPU for the existing Pages deployment without a material Pages/Workers configuration or runtime migration, keep WP-2.9C blocked and return to explicit architecture review. Do not silently migrate runtimes, enable Paid, use wall time as CPU, or reduce the 25 MB contract.

## Provider references

- <https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/>
- <https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/methods/query/>
- <https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/methods/keys/>
