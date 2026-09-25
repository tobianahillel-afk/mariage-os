# WP-2.9C / WP29C-AR-006 — CPU evidence architecture review

Status: **BLOCKED — ADR 0011 PRIVATE-WORKER PATH FAILED THE DEPLOYED WORKERS FREE CPU GATE**

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

This replaces neither the exact-size contract nor the requirement for fresh review. At this historical decision it moved WP-2.9C to `IN_PROGRESS` for Pass A only. The permitted action then was to finish and verify the Worker, the isolated bindings and the governed evidence workflow. A missing secret, missing binding, missing provider event, non-numeric CPU, CPU above budget or CPU-limit outcome remained a fail-closed AR-006 result. The later 2026-09-24 result below supersedes that work permission.

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

The bounded diagnostic ran at `e5c9c93ae23a1350511c986629f78f58db308e61`
/ CI `35912545590`. All five ordinary jobs succeeded, including clean-checkout
verification. Isolated job `107358251456` failed closed. Its sanitized artifact
`10774515322` (ZIP SHA-256
`8ce43d8acba16bb4c5d7ee97c49d40b4057b5c3e54059d4a9022da579dedfa60`)
records HTTP `401` / code `1000` at **both** account and user verification
endpoints, no transport error and `pass: false`. This rules out merely choosing
the wrong verification endpoint for the currently stored value. It does not
identify whether the value was revoked, expired, copied incorrectly or belongs
to another credential type. No telemetry query, deployment or PDF promotion
ran. The Cloudflare connector cannot list or create account tokens with its
current authorization (`9109` on token and permission-group reads). Credential
recovery therefore required a newly created, narrowly scoped account token from
the authenticated Cloudflare account. A marker-gated CI preflight is prepared
to verify the replacement token and its read-only telemetry-query capability
without recording event contents; it does not close AR-006. The separate web
automation session did not inherit the signed-in in-app browser session, so
token creation was completed in the connected in-app browser instead.

On 2026-09-24 the replacement account token
`mariage-os-ar006-observability-20260923` was created with exactly one policy:
`Workers Observability Write` on account
`e33a5fde02b4ecbc0a36f4ad47ad0597`, all IPs allowed, expiring
2027-09-25. Its value was copied only into memory, stored outside the repository
as a Windows DPAPI file restricted to the current Windows user, and installed as
GitHub Environment secret `AR006_CLOUDFLARE_OBSERVABILITY_TOKEN` in
`ar006-isolated`. The GitHub UI update appeared to close successfully but left
the old 2026-09-17 timestamp after reload; the official environment-secrets API
then returned HTTP 204 and metadata `updated_at=2026-09-24T08:17:32Z`, which a
fresh GitHub UI load also confirmed. No token value entered the repository or
CI logs. Preparation commit `4ea938b37321c77c24d359e6e13c69e5ea71693f`
passed normal CI `35915263712`. The new credential has not yet passed the
isolated capability preflight; AR-006 remains open.

The bounded capability preflight ran at
`2187a137663a02a01e3868cfd3690f8d6f45f05e` / CI `35974594865`.
Ordinary verification and clean-checkout succeeded; isolated job
`107554277941` succeeded. Sanitized artifact `10796864297` (ZIP SHA-256
`394d5c3497b0adb81a8ba3a888a1f3461c77df85a4abd85a718cf9ca11b8ade4`)
records account-token verification HTTP `200`, `tokenActive: true`, a narrow
Workers Observability telemetry query HTTP `200` / `apiSuccess: true`, no
provider error codes and `pass: true`. It contains no provider CPU value and
performed no deployment or document promotion. The Cloudflare account list
subsequently showed this replacement token active and recently used. After
this proof, the two older, unused `Workers Observability Telemetry Write`
tokens (`mariage-os-ar006-observability` and
`mariage-os-ar006-observability-requery-2027`) were deleted from the account;
the replacement remained active. This closes the credential authorization
subproblem, not AR-006.

### 2026-09-24 decision — prepare one fresh exact-size Workers Free campaign

The 2026-09-17 promotion logs are outside Workers Free retention. The valid
replacement credential can query current Observability data, but cannot
reconstruct ten attributable numeric CPU measurements from expired logs.
The existing Cloudflare Pages deployment token is displayed as **Expired**,
and the private Worker deployment token as **Expires soon**. Those are
independent from the proven Observability token. The historical Account
Analytics token is also expired and is not used by the current final harness.

Authorize a bounded recovery of the two deployment credentials needed by the
isolated evidence workflow: one account-scoped `Pages Write` token for the
isolated Pages project and one account-scoped `Workers Scripts Write` token for
the existing private Worker. Each must expire no later than one year, have no
unrelated permission, be stored only in the approved encrypted GitHub
Environment secret (`AR006_CLOUDFLARE_DEPLOY_TOKEN` or
`AR006_CLOUDFLARE_WORKER_DEPLOY_TOKEN`) and the user's encrypted local vault,
and be verified before the old token is deleted. Do not change the production
project, add a public Worker route, enable Workers Paid, or widen the
Observability token.

After credential rotation, run the existing isolated `[AR006-PREFLIGHT]` path
on an exact commit after normal CI; it must verify the Pages preview bindings
and synthetic user. If it passes, authorize **one** exact-commit
`[AR006-EVIDENCE]` campaign under the existing runbook: deploy only the private
Worker and isolated Pages preview, run deny smoke, perform ten distinct
synthetic `25,000,000`-byte promotions, and immediately collect attributable
provider CPU events. Any missing secret, failed preflight, provider query
error, missing event, nonnumeric CPU, or CPU over `10 ms` stops for a new
architecture review; do not silently repeat or weaken the acceptance gate.
A passing artifact is evidence for fresh independent Pass B and Pass C, not
automatic acceptance.

Execution checkpoint before the read-only preflight: on 2026-09-24 the
authenticated Cloudflare account showed the prior Pages token expired and the
prior private-Worker token expiring soon. Two account-owned replacements were
created through the Cloudflare dashboard, each with one permission on account
`e33a5fde02b4ecbc0a36f4ad47ad0597`, all IPs allowed and expiry
2027-09-25:

- `mariage-os-ar006-pages-deploy-20260924` — `Pages Write`, stored as the
  encrypted GitHub `ar006-isolated` secret `AR006_CLOUDFLARE_DEPLOY_TOKEN`;
  GitHub metadata updated `2026-09-24T08:36:53Z`.
- `mariage-os-ar006-worker-deploy-20260924` — `Workers Scripts Write`, stored
  as `AR006_CLOUDFLARE_WORKER_DEPLOY_TOKEN` in the same environment; GitHub
  metadata updated `2026-09-24T08:38:15Z`.

Both update timestamps were confirmed in the GitHub dashboard. Values were
also sealed to the current Windows user with DPAPI outside the repository;
neither value is in Git, this record or CI logs. The old deploy tokens remain
until the replacements have provider proof. No deployment or synthetic
promotion has run with these replacements at this checkpoint. The next action
is the marker-gated `[AR006-PREFLIGHT]` on an exact commit, followed by review
of its sanitized result and the normal exact-commit CI.

The read-only preflight at `6b4a1da36e3dd32bde36adfb7f6d75e204324902`
/ CI `35976858406`, job `107559568930`, succeeded and logged
`AR-006 isolated provider preflight passed.` It verified the encrypted Pages
credential against the isolated project configuration, the expected preview
secret and bindings, and the synthetic user's live `documents.write` permission;
it made no deployment or promotion. After that proof the expired superseded
`mariage-os-ar006-pages-deploy` token was deleted in the Cloudflare dashboard;
the new Pages token remained active. The prior Worker token remains until the
new one proves it can deploy. The exact-commit clean-checkout CI result must
also be green before the one permitted evidence campaign. The same CI run
finished with all five ordinary jobs successful, including full verification
from a clean checkout; the exact-size evidence job was correctly skipped on
the preflight marker. This satisfies the pre-campaign gate, so the next exact
commit may carry `[AR006-EVIDENCE]` once to execute the authorized campaign.

### 2026-09-24 result and stop decision

The single authorized campaign ran at
`26da10e5aabd7d2a9b6105caef49dd87d6ee58b9` / CI `35977875774`.
Ordinary CI was 5/5 green, including clean checkout. Isolated job
`107565190064` passed preflight, private-Worker and Pages preview deployments,
binding checks and deny smoke, then failed at provider evidence collection.
Artifact `10799077529` (ZIP SHA-256
`b11e62221fa82f1697133e51f19eeeb546ff562a5615327da14882924025003e`)
records eight successful exact `25,000,000`-byte promotions, two HTTP `503`
failures and no accepted UUID-correlated CPU measurements.

A bounded read-only Cloudflare Observability query of that exact private
Worker and controlled window returned ten provider invocation events: eight
`ok` with `cpuTimeMs` from 237 to 273, and two `exceededCpu` with CPU values
10 and 27 ms. Cloudflare's published Workers Free CPU budget is 10 ms per
request. The provider's documented occasional flexibility is consistent with
HTTP `200` coexisting with much higher CPU, but cannot satisfy the normal-budget acceptance
condition. The missing UUID marker and a provider-field mismatch in the
evaluator are separate defects; correcting them cannot make this CPU profile
pass. Full sanitized record:
`WP-2.9C-AR-006-PROVIDER-ATTEMPT-2026-09-24.md`.

Decision: the ADR 0011 private-Worker implementation is **not accepted** as
the V1 exact-25-MB Workers Free promotion solution. WP-2.9C returns to
`BLOCKED`, AR-006 stays open, and the single-campaign authorization is
exhausted. No repeat, Workers Paid activation or 25 MB reduction follows
automatically. A different trusted execution architecture would change the
security/deployment boundary and requires a new explicit ADR and review of
authorization, actual-byte integrity, cleanup, failure recovery and the
unchanged file contract before implementation. No such alternative is yet
specified or proven. WP-2.9A, Pass B, Pass C and later packets remain gated.

### Read-only candidate review after the failed campaign

Cloudflare documents `crypto.DigestStream("SHA-256")`, which could avoid the
current full-buffer copy and hash a Storage response as it arrives. The
provider's measured 237–273 ms is for the complete current invocation, not a
profile of the hash alone. No measured result shows that streaming would bring
the complete trusted promotion under 10 ms, so this is only a candidate, not
an approved fix or permission to repeat the evidence campaign.

Cloudflare also documents processing expensive work in smaller chunks across
multiple requests. That approach would need durable, server-owned SHA-256
state and offset, bounded reads of immutable staged bytes, concurrency and
retry rules, live authorization at every step, and atomic final attestation.
The current one-request reservation and promotion contract does not specify
those semantics. Service bindings alone are not a proven escape from the CPU
gate: Cloudflare documents a maximum of 32 Worker invocations per originating
request and sums bound-Worker CPU for pricing. A different execution design
requires a new ADR, security review and provider evidence before acceptance.

The replacement Worker deployment token did prove deployment in the isolated
campaign. The superseded `mariage-os-ar006-worker-deploy` token still exists:
the Cloudflare connector rejected its deletion with `9109 Unauthorized`, and
the browser tool was unavailable. No further token mutation was attempted.
This cleanup is separate from the AR-006 CPU failure and must not be reported
as completed.

The subsequent read-only feasibility assessment is recorded in
`WP-2.9C-AR-006-FEASIBILITY-2026-09-24.md`. It identifies a possible bounded
multi-request hashing design but does not select or authorize it. The token
cleanup is deferred while the CPU architecture remains the priority.

### 2026-09-24 decision — ADR 0012 Durable Object lifecycle executor

The architecture review is now resolved by
`docs/adr/0012-private-document-lifecycle-durable-object.md`. Current
Cloudflare documentation establishes a materially different Free execution
primitive from the ADR-0011 stateless Worker: SQLite-backed Durable Objects are
available on Workers Free, Pages Functions can bind directly to a Durable
Object namespace, and the provider documents a 30-second default CPU budget per
Durable Object request. Durable Object access follows the implementing Worker;
there is no separate Durable Object API-token permission.

Selected replacement path:

```text
browser
→ same-origin/bodyless Pages Function
→ PRIVATE_DOCUMENT_LIFECYCLE Durable Object
→ Supabase Auth/RLS/Storage/PostgreSQL
```

The object identity is deterministically server-derived from validated
`(project_id, document_id)`. Promotion and abandon for one document share the
same object. This does **not** permit relying on implicit single-threaded
execution: Cloudflare documents that Durable Object requests may interleave
while awaiting external I/O. ADR 0012 therefore requires an explicit
per-instance serialization gate plus all existing authoritative reservation,
permission, compensation and finalization checks.

The ADR-0011 campaign remains adverse evidence and must not be rewritten as a
pass. The old service-binding path is superseded only after the new local/runtime
tests are green. AR-006 remains open. The next permitted action is RED-first
repository implementation; no new exact-size provider campaign is authorized
until exact-head CI, adversarial implementation review and an isolated Durable
Object binding preflight are green.



## Exact-preview route recheck result review — 2026-09-25

Status: **PASS — ONE BOUNDED SECOND ADR 0012 EXACT-SIZE CAMPAIGN MAY BE AUTHORIZED AFTER THIS RESULT/REVIEW SEAL IS EXACT-HEAD GREEN**

Reviewed execution:

- same-tree trigger: `1a4deb3ffb8980e32b887a2244f8d9fb947699e3`;
- CI: `36133903894` — SUCCESS;
- read-only provider job: `108069830452` — SUCCESS;
- pinned existing preview candidate: `6bdf445e7f56e38caa0d807232bcfde573103117`;
- sanitized artifact: `10863225626`;
- artifact ZIP SHA-256: `8168ceac820923b4bf63a96e7a2240b0d49c02abf8ca51f048b8cc992c22e00a`.

The ordinary repository gates, including clean-checkout full verification, passed before the provider job. All unrelated provider jobs and the exact-size evidence job were skipped. The read-only job re-ran provider metadata and synthetic-authority preflight, resolved exactly one successful Pages Functions preview for the pinned candidate, retained a sanitized no-mutation receipt, passed deny smoke and reached the lifecycle Durable Object with a fresh random unreserved document in one bounded attempt, status sequence `[409]`.

Artifact review confirms schema `mariage-os.wp29c.ar006.do-route-recheck.v1`, the exact pinned candidate, preview/Functions identity and `documentMutation:false`. No token, password, service credential, PDF bytes/hash or real wedding data is retained.

### Adversarial conclusion

No BLOCKING/MAJOR finding remains in the route-readiness continuation. The failure that contained the first ADR-0012 evidence campaign happened before any exact-size mutation because the newly deployed candidate route was not yet ready. The current evidence harness now uses the reviewed bounded readiness helper: only transient 404/503 are retried for a bounded interval, while the final state must be exact generic 409 before the ten-flow step can start. The successful exact-preview recheck demonstrates the deployed topology itself is stable and reachable; it is not CPU acceptance evidence.

Therefore authorize exactly one second `[AR006-DO-EVIDENCE]` campaign, conditional on this result/review seal first passing ordinary exact-head CI + clean checkout. The campaign must use the current reviewed harness unchanged, deploy the exact same-tree candidate, stop before mutation on any failed route/marker preflight, and retain only sanitized two-surface evidence. A red result exhausts this authorization and returns to review; no automatic repeat, Workers Paid fallback, wall-time substitute or reduction of the exact `25,000,000`-byte contract is authorized.

## 2026-09-25 Observability architecture correction — ADR 0013

Status: **DECISION ACCEPTED — WORKERS STATIC ASSETS INGRESS RED-FIRST; OLD PAGES EXACT-SIZE AUTHORIZATION WITHDRAWN**

The marker-only recheck at `11a3cdc6d0d501b616906c6a1e5ccf583b892411` / CI `36142087537` is the final diagnostic for the Pages evidence assumption. All ordinary repository jobs and clean checkout succeeded. Provider job `108096474591` failed only at the marker recheck; artifact `10868151368` records accepted Observability queries with no persisted Pages marker. The exact-size evidence job was skipped.

Official Cloudflare documentation resolves the ambiguity: Pages Functions logs are live-only and are not stored, while Workers Observability Query Builder / REST searches logs stored by Workers Logs. Therefore the current requirement for a persisted, per-invocation Pages CPU proof is structurally mismatched to Pages Functions.

ADR 0013 keeps the ADR 0012 Durable Object unchanged and replaces only the ingress:

```text
browser
→ Workers Static Assets public ingress
  → Worker-first /api/*
  → no admin/service credential
  → persisted Workers Logs
→ PRIVATE_DOCUMENT_LIFECYCLE
→ private SQLite Durable Object host
→ Supabase
```

The new ingress will emit native structured logs and the collector will query the two exact script names independently. The hard-coded global `$metadata.message includes ...` marker discovery path is retired for the new campaign. A read-only keys/values diagnostic may be used during preflight, but acceptance remains based on exact-script events plus provider invocation identity/CPU.

No exact-size mutation is authorized until ADR 0013 implementation is exact-head green, adversarially reviewed and one isolated structured-log ingress/DO preflight is green.

## 2026-09-25 ADR 0013 implementation review

Status: **PASS — ONE ISOLATED NO-DOCUMENT-MUTATION INGRESS/DO OBSERVABILITY PREFLIGHT MAY FOLLOW AFTER THIS REVIEW SEAL IS EXACT-HEAD GREEN**

Reviewed head: `b06a823e1d6e3b1a4693c683afe11e1771449365`  
Ordinary CI: `36150541994` — **5/5 SUCCESS**, including `Full verify from clean checkout`; all provider jobs skipped.

The fresh review covered the dedicated `mariage-os-ar006-ingress` Workers Static Assets Worker, Worker-first `/api/*` routing, the external `PRIVATE_DOCUMENT_LIFECYCLE` binding, private SQLite Durable Object host, native structured evidence logs, exact-script Observability queries, marker-to-provider request attribution, exact script-version checks and the fail-closed two-surface CPU evaluator.

No BLOCKING/MAJOR finding was identified. The ingress has no `PRIVATE_DOCUMENT_ADMIN_KEY`; unknown API paths fail closed; the host stays `workers_dev:false`; promotion/abandon retain the existing per-document serial gate and authoritative Supabase checks. The evaluator rejects missing/duplicate/malformed markers, request-ID mismatch, incomplete provider pages, wrong script/version/model/status, missing/nonnumeric/over-budget CPU, missing DO identity and truncation.

Cloudflare contracts used by ADR 0013 were rechecked during review: selective Worker-first Static Assets routing, persisted structured Workers Logs, provider request/script/version/execution-model/DO/CPU telemetry, the normal Workers Free stateless `10 ms` CPU budget and the Durable Object `30,000 ms` request CPU ceiling.

### Authorization boundary

This review does **not** authorize a 25 MB campaign. After this review/status commit itself is ordinary exact-head green, exactly one `[AR006-INGRESS-PREFLIGHT]` may deploy the isolated DO host and isolated Static Assets ingress and issue only deny/safe random-unreserved probes. It must retain `documentMutation:false` and `exactSizeMutation:false`.

A red preflight exhausts this authorization and returns to review/remediation. A green preflight is only evidence input and requires a separate durable result/review seal before one `[AR006-INGRESS-EVIDENCE]` ten-flow exact-size campaign can be authorized.

## 2026-09-25 ADR 0013 structured ingress preflight result

Status: **GREEN / REVIEW PASS — ONE EXACT-SIZE CAMPAIGN MAY FOLLOW AFTER RESULT-SEAL CI**

Trigger: `a83d76ec5b824096cfe1435e20613b813a6892c7`  
CI: `36154744823` — repository jobs and clean checkout SUCCESS  
Provider job: `108139347246` — **SUCCESS**  
Artifact: `10873203218`, digest `sha256:81b74ac40f270be773fc8f2f83cfd970f6783decb63e684bbe6513c1cf2167ed`

The provider job deployed private DO version `794000b1-9b1b-43ad-a12c-01bbd47875eb` and ingress version `11eb9e2f-9056-48ad-93ee-2ed0095d699a` (deployment `c4346f61-ad43-4a58-8b90-91e2a25bc5f7`). It verified `PrivateDocumentLifecycle` SQLite export, Worker-held admin-secret metadata, exact ingress DO binding, absence of the admin secret from ingress, Static Assets, workers.dev isolated endpoint and deny smoke.

The safe marker probe returned generic `409` on its first route-readiness attempt. Observability attempts 1–2 returned complete empty pages; attempt 3 returned complete pages with ingress event count 6 and DO event count 2. The strict discovery retained exactly two expected markers and two attributed provider invocations, with no failures. The receipt records `documentMutation:false`, `exactSizeMutation:false`, `pass:true`.

Fresh review found no BLOCKING/MAJOR defect in this result. The initial empty Observability pages are treated as persistence delay, not as success; the preflight passed only after both exact scripts were attributable under the exact captured versions.

This result proves the revised evidence channel is operational and attributable. It does not prove exact-25-MB CPU compliance.

Exactly one `[AR006-INGRESS-EVIDENCE]` campaign is authorized only after the commit recording this result/review becomes ordinary exact-head green. A red campaign exhausts that authorization and returns to review; no automatic repeat, Paid fallback, timing substitute or file-limit reduction is permitted.

## 2026-09-25 ADR 0013 exact-size trigger — contained marker-preflight failure

Status: **RETURN TO REVIEW — ZERO EXACT-SIZE FLOWS / ADR13-EV-001 OPEN**

Same-tree trigger `f7951e99eb31bcc63d9cbd93f67db80548340ed6`
ran CI `36157672647`. All five ordinary repository jobs passed. Provider job
`108149068138` successfully redeployed the private Durable Object host and
Static Assets ingress, verified the exact binding/secret boundary and passed
deny smoke.

The final harness stopped at its mandatory safe marker preflight before
exact-size setup. Sanitized artifact `10874337441`
(`sha256:b286b9361df2ca8780f054c60a957ac0edfbcfded71e1d67e6525f9087e324b7`)
records exact failed UUID
`a5848756-d76c-4848-9312-eab1b883a063`, window
`2026-09-25T16:06:26.252Z` → `2026-09-25T16:07:53.815Z`, complete
ingress/DO pages, two expected markers, expected HTTP `409`, one
`invalid_provider_invocation`, zero exact-size invocations and no provider
ten-flow observation.

This is neither CPU acceptance nor CPU rejection of the 25 MB contract.

### Review decision

The next problem is diagnosability, not permission to retry. The aggregate
rejection collapses multiple fail-closed provider checks, while raw provider
events are intentionally not retained.

`ADR13-EV-001` is opened as **MAJOR / OPEN**.

Authorized sequence: repository-only field-specific sanitized diagnostics and
tests → exact-window read-only requery harness → exact-head CI/clean checkout →
adversarial review → at most one separately triggered diagnostic requery of the
already-produced events. The diagnostic may not deploy, authenticate to
Supabase, emit a new marker, create a PDF or mutate application data. Its result
returns to review and does not authorize a second exact-size campaign.

## Provider references

- <https://developers.cloudflare.com/pages/functions/debugging-and-logging/>
- <https://developers.cloudflare.com/workers/wrangler/commands/pages/#pages-deployment-tail>
- <https://developers.cloudflare.com/workers/observability/query-builder/>
- <https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/>
- <https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/methods/query/>
- <https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/methods/keys/>
- <https://developers.cloudflare.com/logs/logpush/logpush-job/datasets/account/workers_trace_events/>
- <https://developers.cloudflare.com/workers/runtime-apis/web-crypto/>
- <https://developers.cloudflare.com/workers/platform/limits/>
- <https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/>

## Governance

WP-2.9C is **IN_PROGRESS — ADR 0013 IMPLEMENTATION REVIEW PASS / ONE INGRESS PREFLIGHT NEXT**. AR-006 remains OPEN. No `REVIEW_PENDING`, fresh Pass B, Pass C, WP-2.9A resumption, exact-size provider campaign, Workers Paid activation or 25 MB reduction is authorized. One isolated `[AR006-INGRESS-PREFLIGHT]` is permitted only after this review/status seal is exact-head green; exact-size evidence requires a separately reviewed green preflight.
