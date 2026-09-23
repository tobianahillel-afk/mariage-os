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

### 2026-09-18 decision — local evidence-parser correction only

The Cloudflare Workers Observability query response schema places the invocation
HTTP status at `$metadata.statusCode` and CPU time at `$workers.cpuTimeMs`. The
current local evaluator reads `$workers.statusCode`, so a schema-conforming
successful invocation is rejected. It also coerces `null` CPU to numeric zero,
which could falsely accept absent provider CPU evidence. These are verifier
defects; neither changes the runtime architecture or the AR-006 acceptance bar.

Authorize a bounded local correction to read the documented status field and
accept CPU only when the provider value is a finite JSON number. First retain
failing regression tests for a schema-conforming 200/5-ms event and for null
CPU, then repair the evaluator and run ordinary repository verification. Record
the exact implementation and CI result in the packet handoff. No external API
diagnostic, telemetry requery, token operation, deployment or promotion is
authorized by this decision. The HTTP `401` cause and actual Worker Free CPU
measurements remain unresolved, so AR-006 stays open.

The local correction is verified at implementation head
`18cf24cebb545b67fd2fe6791a7a3ece13e60f94` / CI `35364734978`: all five
normal repository jobs succeeded, including `Full verify from clean checkout`.
The schema-conforming 200/5-ms regression passes; null, string and negative CPU
values fail closed. Provider-specific jobs were skipped. This is no evidence of
token validity, available Worker logs or actual Workers Free CPU consumption.

### 2026-09-18 decision — one bounded provider check after parser repair

The user requested a deployed check of the corrected verifier. The source
Worker/Pages runtime files under `functions/` and `workers/` have not changed
since the ten successful promotions at `bdb3d95cc788d4b43205fe9c0e109966f72c7798`;
only test/support code and documentation have changed. Cloudflare documents
Workers Free log retention as three days, so the source window beginning
`2026-09-17T23:28:18.499Z` may still be available during this check.

Authorize exactly one read-only GitHub Environment job after same-head
`full-verify`. First call Cloudflare's account-token `verify` endpoint with the
existing encrypted `AR006_CLOUDFLARE_OBSERVABILITY_TOKEN`, retaining only HTTP
status, provider error codes and active/inactive status. If verification does
not return an active token, stop without a telemetry query. If active, query
only the existing private Worker and ten retained source UUIDs, using the
corrected event evaluator and the existing bounded retry/rate-limit rules.
Retain only sanitized evidence; never print the token, provider raw logs or
document content. This authorizes no token change, deployment, new PDF
promotion or Paid entitlement. Failure or missing measurements returns AR-006
to architecture review; a passing result still requires evidence review and
the packet's fresh Pass B and Pass C before acceptance.

The authorized check ran at `8dd0da2b948e4bdad3edaba274ef658fc850b4ef` /
CI `35366867329`, after all five normal jobs succeeded, including clean-checkout
`full-verify`. The isolated requery job `105673740056` failed closed. Its
sanitized artifact `10557066610` (ZIP SHA-256
`414ba6803b1a75d65ae2ed9930c0fbb4a49b784c06538966847c19962b9ae990`)
records account-token verification HTTP `401` / provider code `1000`,
`tokenActive: false`, no telemetry query, zero CPU measurements and
`pass: false`. This establishes that the existing GitHub Environment secret
did not authenticate at the documented account-token verification endpoint
in this run; it does not establish whether the stored value, token/account
association or provider behavior caused the rejection. The corrected event
parser was not exercised against live events. The one-check authorization is
exhausted. AR-006 stays open; any further token or telemetry action requires
a new explicit architecture decision.

### 2026-09-23 decision — bounded credential diagnosis and recovery

The user requested recovery from the account-token verification HTTP `401`.
Cloudflare documents distinct verification endpoints for user-owned and
account-owned tokens. The failed run used only the account endpoint; its
result does not establish that the secret is invalid. The 2026-09-17 source
Worker logs are now outside the documented three-day Workers Free retention,
so another requery of those ten UUIDs cannot supply current CPU proof.

Authorize a metadata-only inventory of the isolated Cloudflare account's
Observability token(s), including owner type, active state, scope, expiry and
last-use time, and the GitHub `ar006-isolated` secret's presence/update time.
Authorize one isolated CI credential diagnostic that verifies the existing
encrypted secret against **both** documented token-owner endpoints, stores
only statuses/error codes and an opaque token ID when Cloudflare returns one,
and performs no telemetry query, deployment or application mutation. The
diagnostic must run after ordinary exact-commit `full-verify`.

If this identifies a live, correctly scoped token, repair the verifier to
match its owner and prove the authorization with a narrow read-only
Observability capability request. If the secret is missing, expired, mismatched
or has the wrong permission, authorize one replacement token scoped only to
Workers Observability for the isolated account, expiring no later than one
year. Install it directly as the encrypted GitHub Environment secret without
printing or persisting its value, verify the installed credential from CI,
then revoke the superseded token only after the replacement is proven.
Retain only sanitized metadata/evidence. If account or GitHub permissions
prevent safe rotation, stop and record the exact external block.

This decision does not authorize another exact-size promotion or acceptance
claim. Once the credential is proven, review a fresh exact-commit Workers Free
evidence campaign separately because the previous invocation logs expired.
AR-006 remains open until ten new, attributable numeric CPU values satisfy
the unchanged acceptance contract and the packet completes fresh Pass B/C.

Initial metadata inventory: the Cloudflare connector returned `9109`
(`Unauthorized to access requested resource`) for both account-owned and
user-owned token lists, so it supplied no token owner, scope or expiry evidence.
GitHub's Environment-secret metadata confirms
`AR006_CLOUDFLARE_OBSERVABILITY_TOKEN` exists in `ar006-isolated`, last updated
`2026-09-17T22:39:40Z`; GitHub does not reveal its value. The isolated CI
diagnostic must determine whether that stored value verifies at either owner
endpoint. No Cloudflare or GitHub credential was changed by this inventory.

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
