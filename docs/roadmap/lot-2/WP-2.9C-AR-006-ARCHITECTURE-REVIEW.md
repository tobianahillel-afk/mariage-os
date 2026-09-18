# WP-2.9C / WP29C-AR-006 — CPU evidence architecture review

Status: **IN_PROGRESS — ADR 0011 ACCEPTED; PRIVATE-WORKER IMPLEMENTATION AND PROVIDER VERIFICATION REQUIRED**

Date reopened: 2026-09-16

Related packet: `WP-2.9C`

Related FIR: `#17 / FTR-089`

Normative acceptance contract: `WP-2.9C-AR-006-CPU-EVIDENCE.md`

Execution runbook: `WP-2.9C-AR-006-RUNBOOK.md`

## Why this review reopened

The isolated Workers Free evidence candidate `4f40613060b4c9de41a32d99ed43fcf6e12c9791` successfully deployed the exact Pages Function and completed ten distinct synthetic `25,000,000`-byte promotions with HTTP `200`, `success: true` and final `ready` document state. The immediate provider artifact nevertheless contained `providerCpuMeasurements: []`.

A later read-only requery at `9b139d23a7de47f8d3927a54c54d79298ca96a6b` used the same exact script and controlled time window after the aggregation-delay hypothesis had ample time to resolve. Cloudflare still returned no `workersInvocationsAdaptive` CPU rows. Empty telemetry is not zero CPU and cannot close AR-006.

The functional architecture is therefore not shown to be defective. The current **evidence channel** is the blocker: the original GraphQL dataset is not producing attributable CPU data for this isolated Pages preview execution.

## Frozen constraints

This review may change the provider-observation mechanism only. It must not weaken any frozen product/security contract:

- Pages Functions / Workers Free remains the intended runtime for the current architecture unless a later explicit ADR changes it;
- exact PDF contract remains `25,000,000` bytes;
- no Workers Paid entitlement;
- provider CPU, not wall time or application timing, must prove the runtime envelope;
- normal Workers Free budget remains `10 ms` CPU per request;
- at least ten controlled successful exact-size promotions remain required for final evidence;
- no real wedding data, bearer tokens, secret values, raw provider logs or PDF bytes may enter durable artifacts;
- authorization, RLS, staging, integrity, finalize and cleanup controls remain unchanged.

## Provider evidence channels considered

### A. `workersInvocationsAdaptive` GraphQL — observed unavailable

This was the original approved harness. The isolated Pages preview returned no rows during the exact evidence run and again during a delayed read-only requery. It must not remain the sole acceptance channel for this packet.

### B. Pages deployment live tail — capability experiment executed; not an approved CPU channel

A bounded deny-only experiment was executed against the already-recorded isolated Pages deployment without redeploying, authenticating to Supabase, uploading a PDF or mutating application data.

- Repository support tree: `d04edd0ed0d3daa3b9bfe20d954003bb13545200`; green implementation parent `82e05a8dab9f61377f045b74005fd6582da0afe3` / CI `35152382433` completed the normal repository gates including clean-checkout full verification.
- No-content provider trigger: `7645a9e769c641640f52fdba535deb6140401fc6` with the exact same tree.
- Pages-tail workflow: `35153132971`, job `104986087784`.
- The exact deployment tail opened successfully and the production deny smoke passed without privileged credentials.
- Sanitized artifact `10469354745`, ZIP SHA-256 `6b1c9db4b0b54d83881614867c1f68bd3e45b71fa767fec55c09203a72ac1f8c`, recorded `parsedJsonEventCount: 0`, `providerCpuTimeMs: []`, `pass: false`.

This result does **not** establish that all Pages tail events lack CPU fields because no JSON event was retained by the bounded probe. Independently, Cloudflare's documented Pages deployment-tail JSON contract describes invocation outcome/script/log/request metadata but does not document a CPU-time field. Therefore the packet must not depend on the standard Pages tail as its CPU evidence channel, and the ten exact-size mutations must not be rerun merely to retry this path.

### C. Workers Observability persisted invocation logs / REST API — current bounded candidate

Cloudflare's Workers Observability telemetry API is provider-native and its current event model explicitly exposes `$workers.cpuTimeMs`, `$workers.wallTimeMs`, request ID, script name and outcome. The same API model describes `$metadata.cloudService` values including `pages`.

There is an important provider-documentation tension that must remain explicit during this experiment: Cloudflare's Pages Functions logging documentation says the standard Pages Function log stream is not stored, while the Workers Observability Query Builder documentation says its queries search logs stored in Workers Logs. The Observability API schema nevertheless names `pages` as a possible `cloudService`. Therefore neither Pages support nor Pages non-support may be inferred from documentation alone; the existing exact deployment must be tested through the provider API before any architecture conclusion.

Before this mechanism can be approved for final evidence, Mariage OS must prove all of the following without changing the runtime architecture:

1. the isolated Pages preview invocation is visible through the Workers Observability telemetry API;
2. the event can be restricted and attributed to `pages-worker--19505720-preview` on deployment `064d50b9-3c3d-414e-a6c3-afdcc1051be9`;
3. the provider returns numeric `cpuTimeMs` rather than application timing;
4. the capability works on the existing Workers Free / Pages deployment without enabling Paid;
5. the required API permission can be isolated to a dedicated short-lived token and is never reused as the Pages deployment token or Analytics token.

Cloudflare currently documents `Workers Observability Write` as the API-token permission accepted by the telemetry query endpoint. Because this is a broader capability than the existing Analytics Read token, the probe must use a dedicated secret named `AR006_CLOUDFLARE_OBSERVABILITY_TOKEN`. Its value must never be printed, committed or included in artifacts.

The repository implementation of this bounded capability probe is verified at `ed65b6beec8c66c50eca7eca019d972a0b75a748` / CI `35159378110` — **5/5 SUCCESS**, including clean-checkout full verification.

The first exact-tree no-content trigger `ea948913a1b56fc959557ee005763b0950b30a07` / workflow `35161863114` / job `105014208798` passed the deny-only smoke but stopped before any Workers Observability API request because `AR006_CLOUDFLARE_OBSERVABILITY_TOKEN` was not configured. Sanitized artifact `10473471272` (ZIP SHA-256 `f3bcaa6b9f6b2e83c21b7a21622e4b9ae48a985c84f1b46065c5983a2e56e43d`) records `tokenPresent: false`, `httpStatus: null`, zero provider events and `pass: false`. This is an external secret-configuration result only; it does not answer the capability question.

The capability probe is deny-only and read-only with respect to application data: run the existing production deny smoke against the exact deployment, query a short Observability window filtered to the exact script, retain only sanitized provider metadata required to determine CPU availability, and fail closed on missing authorization, missing events or missing CPU.

A green capability result does **not** close AR-006. It only authorizes redesigning the final exact-25-MB evidence harness around provider Observability events.

### Configured Workers Observability result — unavailable

The dedicated secret was then configured in the isolated GitHub Environment and the same bounded preflight was repeated without changing repository content or the existing Pages deployment.

- Exact trigger: commit `bd3fdb4baab6ef59983e40f77b5b2f44ba6dc8b7`, workflow `35213157767`, job `105175271234`.
- The job completed the deny-only production smoke and progressed through the configured Workers Observability query. It did not deploy, authenticate to Supabase, upload a PDF or mutate application data.
- Sanitized artifact `10494251279`, ZIP SHA-256 `02438aadb3e377f6c8e6ed66b3b00c0c0d3e473008c3bb710acbfb805f2dde7c`, recorded the fail-closed result. The job reported that Workers Observability did not expose attributable provider CPU telemetry for the exact Pages script.
- The dedicated Cloudflare token was revoked and the GitHub Environment secret was deleted after the exercise; neither remains usable.
- This result is not a CPU value, a CPU-budget pass/fail, or authorization to repeat the ten exact-size promotions. It is provider-evidence absence after the dedicated-secret precondition was met.

Workers Observability is therefore no longer an untested candidate under the unchanged isolated Pages configuration.

### D. Tail Workers — rejected for this packet

Cloudflare Tail Workers are a separate producer/consumer feature whose use would change the entitlement assumptions. They are not an acceptable shortcut for this AR-006 gate.

### E. application timing, wall time, custom Analytics Engine metrics — rejected

These mechanisms do not provide Cloudflare's authoritative CPU consumption for the invocation. They cannot substitute for provider CPU evidence.

## Historical stop condition

**Stop for an explicit architecture decision.** The configured Workers Observability preflight has completed without attributable numeric provider CPU, after GraphQL and standard Pages tail were already insufficient. No additional same-configuration preflight or exact-size mutation run is authorized.

The preflight must:

- use the existing isolated Pages deployment and exact preview script;
- perform no deployment and no successful/private-document mutation;
- use only deny-oriented route smoke plus a provider telemetry query;
- receive a dedicated `Workers Observability` token only on the explicit `[AR006-OBS-PREFLIGHT]` trigger;
- upload only a sanitized capability artifact;
- pass only when an event attributable to the exact Pages script includes provider `cpuTimeMs`.

If the existing Pages deployment cannot produce attributable CPU through Workers Observability without a material runtime/configuration migration, stop and make an explicit architecture decision. Do not silently migrate Pages to Workers, enable Paid, use wall time, or lower the 25 MB contract.

## Governed decision and current permitted action

The required decision is recorded in `docs/adr/0011-private-document-worker-cpu-evidence.md`, accepted on 2026-09-17 after the three bounded Pages evidence channels above failed closed. The final design is now:

```text
browser -> same-origin bodyless Pages route -> private Worker Service Binding -> Supabase
```

The Worker must have no public route, `workers_dev: false`, persisted invocation logs and full head sampling. It repeats the security-critical promotion checks; Pages remains the public origin/method/body gate and retains DELETE abandon. The final harness sends a UUID-only marker, joins it to exactly one persisted `cf-worker-event` by provider request ID, and accepts only ten HTTP-200, numeric `cpuTimeMs <= 10` measurements from the private Worker.

This replaces neither the exact-size contract nor the requirement for fresh review. It moves WP-2.9C to `IN_PROGRESS` for Pass A only. The current permitted action is to finish and verify the Worker, the isolated bindings and the governed evidence workflow. A missing secret, missing binding, missing provider event, non-numeric CPU, CPU above budget or CPU-limit outcome remains a fail-closed AR-006 result.

### ADR 0011 Worker attempt — rate-limited final query

The first fully configured private-Worker evidence execution ran at
`bdb3d95cc788d4b43205fe9c0e109966f72c7798` / workflow `35286381507`. The
private Worker and Pages Service Binding preflight passed; the exact candidate
was deployed; and all ten controlled `25,000,000`-byte promotions returned
HTTP `200`. Its final Workers Observability collection nevertheless failed
closed: the sixth query received HTTP `429` with provider error `10429`, after
the earlier five queries returned no UUID-correlated markers.

This is a provider rate-limit result, not a valid CPU sample and not a basis to
infer permanent telemetry absence. Cloudflare's REST rate-limit contract
provides `Retry-After`; the corrected client honors it. The narrowly authorized
next action is the non-mutating source requery recorded in
`WP-2.9C-AR-006-WORKER-REQUERY.md`. It queries only the retained ten opaque
UUIDs and same Worker through the dedicated Observability token after
`full-verify`; it cannot deploy, reconfigure a binding or repeat promotion.

Its initial execution at `2ef0e13b755ffc609972ac83c1d2260ca73ff8de` / workflow
`35337938664` passed the five normal repository jobs, but the read-only job
received HTTP `401` / provider code `10000` on all three provider calls before
event retrieval (artifact `10544340701`, ZIP SHA-256
`d048098fa251b409ca8545fcda4d9e72c50cd76ebb3810d1b290e88be0bb0424`). This is
an authentication/configuration failure and cannot be interpreted as missing
telemetry. One replacement token with only Workers Observability scope was
stored as the encrypted isolated Environment secret.

That one recovery query ran at `a937d6e1484640afba52848e895f5480ab4ea8a8` /
workflow `35339776360` after normal CI **5/5 SUCCESS**, including clean-checkout
verification. It again returned HTTP `401` / provider code `10000` on all three
calls; artifact `10545420236` (ZIP SHA-256
`dbac3d188a41dfc94420618406456d6a17f65ddbec485507a4fe98100e09eb86`) contains
zero measurements. The active account token is constrained to Workers
Observability and Cloudflare's published compatibility matrix lists Workers
Observability as supported for account API tokens. The recorded result still
cannot distinguish secret propagation, token validity or provider-specific
authentication behaviour.

The bounded protocol is exhausted. The provider evidence remains unavailable;
keep AR-006 open and return to this architecture review without enabling Paid,
using wall time or lowering the file contract. Any further external diagnostic,
token operation or query requires an explicit architecture decision.

## Provider references

- <https://developers.cloudflare.com/pages/functions/debugging-and-logging/>
- <https://developers.cloudflare.com/workers/wrangler/commands/pages/#pages-deployment-tail>
- <https://developers.cloudflare.com/workers/observability/query-builder/>
- <https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/>
- <https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/methods/query/>
- <https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/methods/keys/>
- <https://developers.cloudflare.com/logs/logpush/logpush-job/datasets/account/workers_trace_events/>

## Governance

WP-2.9C is **IN_PROGRESS** only for ADR 0011 implementation. No `REVIEW_PENDING`, fresh Pass B, Pass C, WP-2.9A resumption, Workers Paid activation or 25 MB reduction is authorized until valid AR-006 evidence exists on the exact candidate.
