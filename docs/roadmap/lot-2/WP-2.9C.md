# WP-2.9C — Trusted private-document ingestion hardening

## Identity

- Work Packet ID: `WP-2.9C`
- Lot: `2`
- State: `ACCEPTED`
- Current pass: `COMPLETE` — separate Pass C reconciliation gap ∅, acceptance-record `21accd7f9ab1b845275507b7941a782c5e816a56` / CI `36494697647` 5/5 including clean checkout
- Primary bounded context: Documents — trusted binary promotion for the existing WP-2.9A private PDF lifecycle
- Branch: `lot-2/venues-core`
- FIR: `#17 / FTR-089`
- Parent review findings: `WP29A-AR-004 + WP29A-AR-005`
- Architecture chain: ADR 0008 trust/integrity → ADR 0009 bounded staging/bodyless promotion → ADR 0010 same-origin boundary → ADR 0011 rejected stateless CPU path → ADR 0012 private Durable Object lifecycle → ADR 0013 Workers Static Assets ingress
- Historical architecture blocker: `docs/roadmap/lot-2/WP-2.9C-BLOCKER.md` — resolved by ADR 0010
- Runtime-evidence history and current result: `docs/roadmap/lot-2/WP-2.9C-AR-006-CPU-EVIDENCE.md`; `WP-2.9C-ADR-0013-PROVIDER-RESULT-2026-09-27.md`
- Fresh Pass-B reviews: `docs/roadmap/lot-2/WP-2.9C-PASS-B-REVIEW.md`; `WP-2.9C-FRESH-PASS-B-2026-09-27.md`
- Latest fresh Pass B: `WP-2.9C-FRESH-PASS-B-2026-09-28.md` — AR-009 MAJOR; ten provider CPU readings per surface remain valid for repeated PDF bytes, but ADR 0013's ten distinct PDF requirement is unmet.
- Current full fresh Pass B: `WP-2.9C-FRESH-PASS-B-DISTINCT-PDF-2026-09-28.md` — PASS; AR-001..009 CLOSED / VERIFIED for C after ten-distinct-PDF provider proof.
- Latest provider attempt: `WP-2.9C-ADR-0013-PAIRED-VERSION-READINESS-2026-09-28.md` — paired old-version marker responses, zero document mutation, AR-006 still open.
- Newer provider attempt: `WP-2.9C-ADR-0013-PARTIAL-MARKER-RESULT-2026-09-28.md` — one valid DO marker with missing ingress marker, zero document mutation, AR-006 still open.
- Size: **10 points**; cohesion review **PASS**

## Historical remediation verdict (superseded by current state above)

Pass A completed successfully. The required fresh Pass B then found three unresolved MAJOR findings. Remediation implemented the AR-005 trusted cleanup/race controls and AR-007 deployment/secret/release controls, and the complete exact implementation head `68a4f6bdb7b55acc80c4c6fbb8c0afc0295bfde5` passed CI `35025384594` **5/5 SUCCESS**, including `Full verify from clean checkout`.

AR-006 has direct adverse provider evidence for the historical ADR 0011 private-Worker path. The 2026-09-24 isolated campaign on `26da10e5aabd7d2a9b6105caef49dd87d6ee58b9` passed deployment and deny smoke but returned eight successful exact-size promotions and two HTTP `503` failures. A bounded read-only Cloudflare query found ten corresponding private-Worker invocation events: eight successful invocations used 237–273 ms CPU and two ended `exceededCpu`. The normal Workers Free budget is 10 ms/request. The sanitized CI artifact did not capture UUID-correlated measurements because the expected marker was absent; that telemetry-parser issue cannot cure the observed CPU overrun. See `WP-2.9C-AR-006-PROVIDER-ATTEMPT-2026-09-24.md`. That design was **BLOCKED** pending architecture review; accepted ADR 0012/0013 now govern the IN_PROGRESS replacement path. AR-006 remains open.

The later ADR 0013 isolated Workers Free campaign `da19c6c` / CI
`36343818988` produced ten successful exact-size synthetic promotions and
provider-native CPU observations on both exact deployed script versions:
ingress **0–3 ms** against 10 ms, Durable Object **142–329 ms** against
30,000 ms. The sanitized artifact `10940276677` and provenance are recorded in
`WP-2.9C-ADR-0013-PROVIDER-RESULT-2026-09-27.md`. This supersedes the
historical runtime-evidence blocker for the approved ADR 0013 topology.
Those CPU readings establish feasibility for the repeated-byte sample. The
later fresh Pass B found AR-009: ADR 0013's ten distinct synthetic PDF
condition is unmet, so AR-006 cannot yet close.

WP-2.9C is not accepted. The commit binding this result into the repository
passed exact-head CI `36344835905` **5/5**, including clean checkout. The
subsequent full fresh Pass B found MAJOR `WP29C-AR-008`: release contracts still
describe the superseded Pages ingress rather than ADR 0013 Workers Static
Assets. The packet transitioned through `REVIEW_PENDING` and `REVIEW_FAILED`
back to `IN_PROGRESS` for RED-first release-contract remediation. See
`WP-2.9C-FRESH-PASS-B-2026-09-27.md`. A new clean full Pass B and separate
Pass C are required after remediation verification.

Pass-A implementation evidence:

- head `297ecdf3337e8522d6f200a90f96b481a9e6bdb1`;
- CI `34996240637` — **5/5 SUCCESS**, clean-checkout included.

Review-pending governance evidence:

- head `e0854afb62cf5fcf834792fbad425d013b02af56`;
- CI `34997963836` — **5/5 SUCCESS**, clean-checkout included.

Fresh Pass-B failure record:

- `docs/roadmap/lot-2/WP-2.9C-PASS-B-REVIEW.md`;
- finding record `deaa2432327b9512068a75635dde6f4c522467ad`;
- packet REVIEW_FAILED record `d7fd7ae94792600d5d50afb51a7e6c96487e93a9`;
- matrix REVIEW_FAILED record `f0ad5fab0d46a526a726028c7805b78bdb43b1d9`.

Remediation exact-head verification evidence:

- head `68a4f6bdb7b55acc80c4c6fbb8c0afc0295bfde5`;
- CI `35025384594` — **5/5 SUCCESS**, clean-checkout included;
- Core quality/security, Local Supabase DB/RLS/Pages Function, browser/mutation, privacy-safe preview and clean-checkout full verify all passed on the same implementation head.

## Historical remediation findings (superseded by the current full Pass B)

### WP29C-AR-005 — MAJOR — interrupted staging/abandon cleanup and promotion race

The fresh Pass B found that product recovery could remove pending DB metadata while leaving `document-ingest-staging` bytes behind, and that abandon could race promotion between the initial reservation read and canonical mutation.

Remediation now implemented on the branch includes:

- trusted project/document-bound idempotent cleanup/abandon in the existing narrow Pages security boundary;
- no ordinary browser staging DELETE;
- exact staging/canonical absence proof before metadata abandon completes;
- DB backstop preventing pending metadata abandon while staging/canonical bytes remain;
- retry/response-loss safety;
- no deletion of ready documents, another project/document or Media;
- authoritative reservation-state recheck immediately before privileged canonical mutation;
- compensating cleanup for canonical bytes created by a failing promotion request;
- replay protection that does not destructively compensate a canonical object that pre-existed the current request;
- focused RED/runtime coverage for interrupted staging, clean abandon/retry and promotion-state revalidation.

Earlier post-remediation CI `35021446818` isolated one new uncovered invalid-abandon-receipt branch in Core while the Local Supabase DB/RLS/Pages Function and browser/mutation jobs were already green. The missing negative unit test was then added. Final implementation evidence `68a4f6bdb7b55acc80c4c6fbb8c0afc0295bfde5` / `35025384594` is now **5/5 SUCCESS**, including clean-checkout full verify.

AR-005 is therefore **IMPLEMENTATION-REMEDIATED / EXACT-HEAD-GREEN**. Formal finding closure still waits for the later complete fresh Pass B after AR-006 is unblocked.

### WP29C-AR-006 — MAJOR — historical CPU gap; ADR 0013 now implementation-evidenced

ADR 0010 froze exact 25 MB promotion on the intended Workers Free operating envelope as an acceptance gate. At the earlier Pass B, exact-25-MB evidence was local Wrangler/workerd functionality only; deployed Free CPU enforcement and provider CPU consumption were not represented by that local success or repository CI. The later ADR 0013 result above supplies the missing deployed evidence for the approved replacement topology.

Durable blocker/proof protocol:

- `docs/roadmap/lot-2/WP-2.9C-AR-006-CPU-EVIDENCE.md`.

Provider limits rechecked on 2026-09-15 keep Workers Free at a normal `10 ms` CPU budget per HTTP request and `128 MB` memory. Cloudflare exposes CPU separately from wall time through Pages Functions/Workers telemetry.

The earlier ADR 0010 evidence plan called for an isolated non-production Pages deployment on Workers Free, tied to an exact commit, with synthetic exact `25,000,000`-byte promotion and provider-produced CPU measurements. ADR 0013 superseded that Pages topology with Workers Static Assets ingress plus a private Durable Object host; its controlled evidence demonstrates both Free CPU envelopes without `exceededCpu`, Paid entitlement or a lowered file contract.

The 2026-09-16 isolated deployment of `4f40613060b4c9de41a32d99ed43fcf6e12c9791` completed ten exact-size promotions, but Cloudflare returned zero provider CPU rows. Deployment and functional evidence are recorded in `WP-2.9C-AR-006-PROVIDER-ATTEMPT-2026-09-16.md`; CPU feasibility remains unevidenced.

The earlier finding was **OPEN / IN_PROGRESS** under ADR 0011. The current ADR 0013 provider artifact makes AR-006 **IMPLEMENTATION-EVIDENCED**; formal closure still waits for the clean full Pass B after AR-008 remediation.

### ADR13-EV-001 — MAJOR / OPEN — ingress version mismatch diagnosed

The single reviewed ADR 0013 exact-size trigger
`f7951e99eb31bcc63d9cbd93f67db80548340ed6` passed all five ordinary
repository gates and deployed the exact private Durable Object host plus Static
Assets ingress. The mandatory safe marker preflight reached the lifecycle with
HTTP `409` and complete Observability pages, but one provider invocation was
rejected as `invalid_provider_invocation`.

The harness stopped before exact-size setup. Artifact `10874337441` records
zero completed invocations and no provider ten-flow result. The retained
aggregate code cannot distinguish CPU, provider outcome/model/event/status,
Durable Object identity, exact version or truncation failure.

AR-006 remains OPEN. No campaign repeat is authorized. Repository-only
remediation may add deterministic privacy-safe reason codes and a dedicated
exact-window read-only requery harness. One provider diagnostic may run only
after that remediation is exact-head green and reviewed; it must reuse the
failed UUID/window and perform no deployment, authentication, new marker or
application-data mutation.

The authorized diagnostic has since classified this finding: CI
`36167031612` / artifact `10879110764` found **only** an ingress script-version
mismatch. The request used the prior version `11eb9e2f...` at `3 ms` CPU while
the newly deployed exact version was `8c48646c...`; the Durable Object was
fully attributed. `WP-2.9C-ADR-0013-DIAGNOSTIC-RESULT-2026-09-25.md` records
the full sanitized result. The finding remains **MAJOR / OPEN** until a bounded
exact-version readiness correction and fresh provider proof pass review.

### WP29C-AR-007 — MAJOR — deployment/secret operations not reconciled

The fresh Pass B found that ADR 0010 required Pages Function deployment, secret bindings, fail-closed `/api/private-document-promote`, static behavior preservation and legacy-route absence while the normative release documents still described a static-only deployment and lacked concrete `PRIVATE_DOCUMENT_ADMIN_KEY` lifecycle metadata.

Remediation now implemented includes:

- ADR 0010 reconciled to the actual `PRIVATE_DOCUMENT_ADMIN_KEY` server binding and deployed-Free CPU evidence contract;
- `SECRET-MANAGEMENT.md` metadata-only inventory, scope, storage, rotation, emergency revocation and old-credential rejection verification;
- the initial `CI-CD.md` requiring static assets and Pages Functions from the same exact candidate, environment bindings and fail-closed route checks;
- the initial `RELEASE-PROCESS.md` defining the private-document Pages release gate, legacy Supabase route absence and deny-oriented production smoke;
- `scripts/run-private-document-production-smoke.mjs` plus `npm run smoke:private-document-production`, which checks the deployed route without privileged credentials or real wedding data;
- focused AR-007 documentation assertions to prevent silent contract drift.

That initial implementation head `68a4f6bdb7b55acc80c4c6fbb8c0afc0295bfde5` / `35025384594` was **5/5 SUCCESS**, including clean-checkout full verify. ADR 0013 subsequently changed the ingress, and fresh Pass B reopened AR-007 as AR-008 because those Pages release contracts were stale. The current Workers Static Assets contract correction is recorded in `WP-2.9C-AR-008-REMEDIATION-2026-09-27.md`; formal closure waits for exact-head CI and a new clean full Pass B.

## Historical findings

The latest Pass B did not reopen the implementation remediations below, but formal closure waits for a later complete clean fresh Pass B after AR-005/006/007 remediation:

- `WP29C-AR-001` — raw-body EOF dependence: runtime-green under ADR 0010;
- `WP29C-AR-002` — bounded canonical recovery: source/live-green;
- `WP29C-AR-003` — authoritative stored MIME: source/live-green;
- `WP29C-AR-004` — wildcard CORS: runtime-green.

Historical AR-001..004 review failure: `54ccc8865ea67a4835a7627b14739c3eaac53f5a` / CI `34910156654`.

## Why this packet exists

WP-2.9A fresh review found:

- `WP29A-AR-004`: TypeScript document text/filename validation missed Unicode C1 controls rejected by PostgreSQL;
- `WP29A-AR-005`: direct authenticated Storage ingress could not prove actual stored bytes matched reserved SHA-256/size/MIME.

WP-2.9A was already a 10-point packet, so remediation is isolated here. WP-2.9C adds no product Feature ID or permission key. WP-2.9A remains blocked until C is accepted; WP-2.9B remains inactive until A is accepted.

## Assigned responsibility

WP-2.9C owns only the remediation/control boundary needed to make FTR-089 correct against an untrusted browser:

1. TypeScript/PostgreSQL C1-control parity;
2. trusted actual-byte PDF integrity proof;
3. bounded private staging and fail-closed promotion/recovery/cleanup;
4. live authorization around trusted transitions;
5. exact runtime/CI evidence for the trusted provider boundary;
6. operational/deployment proof for that boundary;
7. preservation of accepted WP-2.9A and WP-2.8 Media behavior.

## Frozen architecture

Browser/application:

```text
local PDF validation/hash
→ reserve pending metadata
→ authenticated upload to bounded private Supabase staging
→ bodyless same-origin Workers Static Assets trusted action
→ live authorization + authoritative document/staging state
→ promotion or trusted cleanup
→ promotion: canonical proof/copy + attestation + staging cleanup
→ independently authorized finalize pending → ready
```

Staging remains exactly `document-ingest-staging`:

- private;
- exact `25,000,000` byte limit;
- only `application/pdf`;
- no anonymous policy;
- no ordinary authenticated SELECT/UPDATE/DELETE;
- one narrow authenticated INSERT for exact live pending Document path;
- `upsert:false`.

The current security boundary is the same-origin Workers Static Assets ingress of ADR 0013, externally bound to the private Durable Object lifecycle host of ADR 0012. Promotion stays bodyless and no general Cloudflare backend is authorized. Trusted abandon/cleanup shares this same route and per-document executor; a second public privileged implementation is not authorized.

The old Supabase `private-document-ingest` Edge Function remains removed from deployable source/config/application flow.

## Promotion integrity invariant

Promotion must:

- verify current Supabase user;
- require live `documents.write`;
- derive exact project/document paths server-side;
- require pending, active, private, non-remote, non-deleted authoritative reservation;
- inspect authoritative staging metadata before materialization;
- require stored MIME exactly `application/pdf` and exact reserved size within 1..25,000,000;
- bounded-read staged bytes and validate `%PDF-` + actual SHA-256;
- revalidate authoritative reservation state immediately before privileged canonical mutation;
- avoid overwrite and fully validate canonical recovery;
- compensate safely if a post-copy failure would otherwise leave an orphan;
- attest only after trusted canonical proof;
- clean staging server-side;
- preserve independent finalization authorization.

## C1 parity

The shared scalar-control rule rejects:

```text
U+0000..U+001F
U+007F..U+009F
```

That remediation remains green. Parent `WP29A-AR-004` remains formally open until C acceptance and A reverification.

## Security controls

Retain applicable evidence for:

- `SEC-AUTHZ-001..009`;
- `SEC-VAL-001/002/003/008`;
- `SEC-FILE-001/002/003/004/008/009`;
- `AUTHZ-001/002/005/007/008/018/020`;
- `SEC-ABUSE-001`;
- `SEC-NET-008`;
- secret/public-artifact safety.

## Existing implementation evidence

Pass-A head `297ecdf3337e8522d6f200a90f96b481a9e6bdb1` proved core quality/security, browser/mutation, DB/RLS/Pages runtime, preview and clean-checkout green; staging/RLS/canonical bypass controls green; same-origin bodyless promotion; old-route absence; open-ended framed-body rejection; exact-byte integrity/recovery; authorization/revocation; CORS; and exact 25 MB in the **local** runtime.

Post-Pass-B AR-005 runtime evidence on CI `35021446818` additionally proved the local DB/RLS/Pages Function and browser/mutation jobs after the trusted abandon/race remediation. Later commits added the missing invalid-receipt unit coverage and AR-007 operational contracts/smoke.

Final remediation implementation head `68a4f6bdb7b55acc80c4c6fbb8c0afc0295bfde5` / CI `35025384594` is **5/5 SUCCESS**, including full verify from clean checkout. This validates the current repository implementation before the external AR-006 provider gate.

Fresh Pass B specifically invalidates treating any local 25 MB success as sufficient Workers Free CPU evidence.

## Explicit non-goals

- no UI/presentation work;
- no document versioning or contract-readiness workflow;
- no general Cloudflare backend;
- no D1/R2/KV application datastore;
- no new permission key;
- no signed-upload product flow;
- no offline pending-file queue;
- no automatic deduplication;
- no silent change to 25 MB PDF contract;
- no real/private wedding data.

## State / sequencing

Current state: **ACCEPTED / COMPLETE** after ten-distinct-PDF provider proof, complete fresh Pass B, separate Pass C gap ∅ and exact-head acceptance-record CI `36494697647` 5/5. Historical states and gates below are retained as dated evidence; the current next action is WP-2.9A integration/reverification in the status board and `WP-2.9C-ACCEPTANCE.md`.

ADR 0013 implementation is exact-head green at `b06a823e1d6e3b1a4693c683afe11e1771449365` / CI `36150541994` (**5/5 SUCCESS**, clean-checkout included; provider jobs skipped). Fresh adversarial implementation review is recorded in `WP-2.9C-ADR-0013-IMPLEMENTATION-REVIEW.md` and finds no BLOCKING/MAJOR defect in the Static Assets ingress, external Durable Object binding, native structured evidence logging, exact-script/version Observability collection or fail-closed two-surface evaluator.

That review authorizes **one** isolated `[AR006-INGRESS-PREFLIGHT]` only after the review/status seal commit itself is exact-head green. The preflight is application-document non-mutating: no 25 MB PDF, reservation, upload, promotion or finalization. A green result still does not close AR-006 and must be separately reviewed before any `[AR006-INGRESS-EVIDENCE]` campaign. A red result returns to review without automatic repeat.

The single reviewed ADR 0013 no-document-mutation provider preflight is now green: trigger `a83d76ec5b824096cfe1435e20613b813a6892c7` / CI `36154744823` / provider job `108139347246`. It deployed the exact private DO host and Static Assets ingress, verified the ingress has no admin secret and the exact external DO binding, passed deny smoke, reached the lifecycle executor with a safe random-unreserved `409`, and proved persisted structured marker attribution for both exact deployed script versions. Artifact `10873203218` has digest `sha256:81b74ac40f270be773fc8f2f83cfd970f6783decb63e684bbe6513c1cf2167ed`, `markerCount:2`, `attributedInvocationCount:2`, `failures:[]`, `documentMutation:false`, `exactSizeMutation:false`, `pass:true`.

Fresh provider-result review is `WP-2.9C-ADR-0013-PREFLIGHT-REVIEW.md` and is PASS for authorizing **one** `[AR006-INGRESS-EVIDENCE]` campaign only after the result-seal commit itself is exact-head green. This preflight does not close AR-006.

ADR 0013 now supersedes only the Pages-specific ingress/evidence portion of ADR 0012. Cloudflare documents Pages Function logs as non-persistent, while Workers Observability queries persisted Workers Logs. The final browser boundary therefore moves to a dedicated Workers Static Assets ingress Worker with Worker-first `/api/*` routing, no Supabase admin credential and an external binding to the unchanged private lifecycle Durable Object. The historical Pages exact-size campaign authorization is withdrawn; no 25 MB provider mutation is permitted until the new ingress implementation, review and structured-log preflight are green.

The ADR-0011 stateless private-Worker design remains rejected by deployed evidence: eight successful exact-size invocations consumed 237–273 ms CPU and two additional invocations ended `exceededCpu`. ADR 0012 is now accepted and moves the trusted promotion/abandon executor to one private SQLite-backed Durable Object per `(project_id, document_id)`, bound directly from the same-origin/bodyless Pages ingress. AR-006 remains OPEN until the replacement architecture is implemented, reviewed and proven on Workers Free.

ADR 0012 does not weaken the frozen promotion invariant. Pages remains the only browser-reachable route; the Durable Object repeats authentication/live authorization and owns privileged lifecycle execution. POST promotion and DELETE abandon for one document must share an explicit per-instance serialization gate because external Supabase/Storage I/O may otherwise interleave. Different documents must remain independently executable.

The direct Pages → Durable Object implementation and provider/operations remediation
are exact-head green at `7492dd06677f6d5c5ae7627a1c0129bf841c6175` / CI `36038873857` (**5/5
SUCCESS**, clean-checkout included). The fresh remediation review in
`WP-2.9C-ADR-0012-IMPLEMENTATION-REVIEW.md` closes ADR12-IR-001..004 for
preflight scope. This authorizes only the isolated ADR 0012 provider preflight
after the review/status documentation commit itself is green; exact-size
evidence remains hard-disabled pending a reviewed two-surface CPU evaluator.

The first authorized ADR 0012 preflight at
`b0c8782517f726a0b71f33ca52e940f31c3e138c` / CI `36044939346` failed
contained at the Pages Preview configuration PATCH after the private Durable
Object host deployed and reconciled successfully. The job stopped before Pages
candidate deployment, deny smoke or the non-mutating route probe; no document
reservation/upload/promotion/finalization and no exact-size evidence occurred.
Because the original configurator suppressed structured provider errors, the
exact Cloudflare validation reason is not claimed as proven.

The bounded remediation removes full Preview configuration replay and sends
only the intended env/service/Durable Object delta. It also emits only sanitized
HTTP status/provider code/field-pointer diagnostics. Remediation head
`2f3a9eb657bfb8b151d9b70d64371961b519cd53` / CI `36047159395` is **5/5
SUCCESS**, clean-checkout included, with provider jobs skipped. The fresh
retry-scope review passes; one retry is authorized only after the
review/status reconciliation state containing that conclusion is itself
exact-head green.

The single authorized retry ran at
`eca478937fad40632dc378f0408c1c8ec4bd5c8c` / CI `36049934080`.
All repository gates and clean-checkout verification were green. Provider job
`107805560963` successfully deployed/reconciled the private Durable Object,
applied the minimal Pages Preview binding patch, retained the sanitized binding
receipt, re-verified provider bindings/Worker secret metadata/synthetic
authority and deployed the exact Pages preview. The immediate deny smoke then
received HTTP `404` for unsupported-method GET where the route contract
requires `405`, so the job stopped fail-closed before the non-mutating route
probe. Exact-size evidence remained skipped and no document was mutated.

A later diagnostic fetch of that same exact preview observed the route returning
`405`, which is consistent with a short Pages Functions propagation interval;
that observation is diagnostic only and is not accepted as durable evidence.
The remediation may therefore retry only transient `404` for a short bounded
readiness window. It may not accept `404`, retry arbitrary statuses or weaken
the JSON/generic-unavailable assertions. After exact-head CI and fresh review,
one non-mutating continuation may re-use the existing `eca478...` deployment;
no third deploy/PATCH is authorized merely to repeat the smoke.

The local AR-006 provider-event evaluator was corrected at
`18cf24cebb545b67fd2fe6791a7a3ece13e60f94` / CI `35364734978` (**5/5**
normal jobs successful, including clean-checkout verification). It now reads
provider HTTP status from `$metadata.statusCode` and rejects non-numeric,
non-finite or negative `$workers.cpuTimeMs`. No Cloudflare query or promotion ran
in that CI. This does not resolve the HTTP `401` evidence-channel block.

The bounded live retest at `8dd0da2b948e4bdad3edaba274ef658fc850b4ef` /
CI `35366867329` passed all five normal jobs, including clean-checkout
verification, but the account-token precheck failed HTTP `401` / provider code
`1000`. Requery job `105673740056` produced sanitized artifact `10557066610`
(ZIP SHA-256
`414ba6803b1a75d65ae2ed9930c0fbb4a49b784c06538966847c19962b9ae990`):
no telemetry query, no CPU measurement, `pass: false`. Thus the parser fix is
locally verified but not live-provider verified; AR-006 stays open.

The follow-up owner-type diagnostic at
`e5c9c93ae23a1350511c986629f78f58db308e61` / CI `35912545590` completed
normal verification **5/5 SUCCESS**, but the isolated token job
`107358251456` returned HTTP `401` / provider code `1000` at both Cloudflare
verification endpoints. Artifact `10774515322` (ZIP SHA-256
`8ce43d8acba16bb4c5d7ee97c49d40b4057b5c3e54059d4a9022da579dedfa60`)
contains no telemetry query or CPU measurement. A replacement credential and
fresh provider evidence remain required under the architecture decision.

On 2026-09-24 a one-year account token with only `Workers Observability Write`
was created and installed as the `ar006-isolated` GitHub Environment secret;
GitHub metadata updated at `2026-09-24T08:17:32Z`. The value is also stored in
a Windows DPAPI file outside the repository. The preparation commit
`4ea938b37321c77c24d359e6e13c69e5ea71693f` passed normal CI
`35915263712`. At that checkpoint, the permitted step was the isolated
credential/capability preflight, not acceptance or a new exact-size promotion.

The credential-capability run at `2187a137663a02a01e3868cfd3690f8d6f45f05e`
/ CI `35974594865` passed all ordinary jobs and isolated job `107554277941`.
Artifact `10796864297` (ZIP SHA-256
`394d5c3497b0adb81a8ba3a888a1f3461c77df85a4abd85a718cf9ca11b8ade4`)
confirms account-token verification `200/active` and Observability query
`200/success`, with no CPU measurement or promotion. The two superseded,
wrong-scope Observability tokens were deleted after that proof. The
2026-09-24 architecture decision authorizes recovery of expired/expiring
isolated deployment credentials and one fresh exact-size evidence campaign
only after a green `[AR006-PREFLIGHT]`; WP-2.9C remained `IN_PROGRESS` at that
historical checkpoint.

The isolated Pages and private-Worker deployment tokens were replaced on
2026-09-24 with one-year account tokens scoped respectively to `Pages Write`
and `Workers Scripts Write`. Their encrypted GitHub Environment secrets were
updated and visually confirmed at `08:36:53Z` and `08:38:15Z`; values are
stored only in GitHub and user-bound DPAPI files outside the repository. The
preflight was the next required proof before a single permitted evidence
campaign, contingent on preflight and normal CI passing.

That preflight passed at `6b4a1da36e3dd32bde36adfb7f6d75e204324902`
/ CI `35976858406`, job `107559568930`. It logged no document content or
secret. The expired old Pages token was removed after the new credential's
proof; the old Worker token remains pending new-token deployment proof. The
same exact-commit run passed all five ordinary CI jobs, including clean
checkout. This was the final prerequisite before the bounded campaign
described below.

That campaign ran once on `26da10e5aabd7d2a9b6105caef49dd87d6ee58b9`
/ CI `35977875774`: all five ordinary jobs passed, as did the isolated
preflight, private-Worker deployment, Pages preview deployment, binding checks
and deny smoke. Evidence job `107565190064` then failed. Sanitized artifact
`10799077529` (ZIP SHA-256
`b11e62221fa82f1697133e51f19eeeb546ff562a5615327da14882924025003e`)
records eight HTTP-200 exact-size successes, two HTTP-503 failures, no accepted
UUID-correlated CPU measurement and `pass: false`. Read-only provider event
diagnosis found ten invocation rows, eight at 237–273 ms CPU and two
`exceededCpu` (10 and 27 ms). No repeat is authorized by that decision.

Current gate:

1. retain AR-005 and AR-007 remediations without weakening their security contracts;
2. keep the exact-head-green ADR 0012 direct Pages → per-document Durable Object implementation and explicit same-document lifecycle serialization intact;
3. retain continuation `ce2738a22d421fafd446695d9595a378a0413865` / CI `36054731788` / job `107821508056` as the provider-green non-mutating topology proof;
4. retain the reviewed two-surface evaluator and exact-size harness review at `5b0cc21bc8bb051edea5ec51841709b307ba5365` / CI `36073556382`;
5. retain marker-gate enablement `f913940d7d1c777a75448eebe2231844bf8be875` / CI `36075138372` as 5/5 green with provider job skipped;
6. record same-tree trigger `6bdf445e7f56e38caa0d807232bcfde573103117` / CI `36075800700` as failed-contained at the authenticated non-mutating route probe after exact Worker/DO + Pages deployment and deny smoke; the ten exact-size flows were skipped and no 25 MB document mutation occurred;
7. route-readiness remediation now retries only bounded HTTP 404/503 and still requires final exact HTTP 409 + generic-unavailable JSON; 401/403/other unexpected statuses fail immediately;
8. a standalone route-probe failure writes the canonical sanitized pass-false receipt before the main evidence harness starts;
9. remediation head `f6a272bd04640c52a3ff0c98330605f158474148` / CI `36124432936` is **5/5 SUCCESS**, clean checkout included; fresh targeted review is **PASS** with no BLOCKING/MAJOR finding;
10. dedicated marker-gated read-only recheck harness is exact-head green at `f11020e81c0991c8e6401d9d2f4a1ed05f2f95f4` / CI `36130022819`; all five ordinary jobs passed including clean checkout and the marker-gated recheck stayed skipped;
11. focused adversarial contract review is PASS: the job is pinned to exact `6bdf445e7f56e38caa0d807232bcfde573103117`, is metadata/auth/smoke/random-unreserved-probe only, retains a sanitized no-mutation receipt, and contains no Worker deploy, Pages PATCH, Observability or exact-size flow;
12. read-only recheck trigger `1a4deb3ffb8980e32b887a2244f8d9fb947699e3` / CI `36133903894` is GREEN: all five repository jobs passed, exact-size evidence stayed skipped, provider job `108069830452` passed, and the pinned preview reached the lifecycle Durable Object on the first bounded probe with status `[409]`; artifact `10863225626` / ZIP SHA-256 `8168ceac820923b4bf63a96e7a2240b0d49c02abf8ca51f048b8cc992c22e00a` records `documentMutation:false`;
13. post-recheck adversarial review is PASS for one bounded second exact-size campaign; first run ordinary exact-head CI + clean checkout over the commit containing this result/review seal, then and only then permit one no-content same-tree `[AR006-DO-EVIDENCE]` trigger;
14. the second exact-size campaign is single-use and not automatically repeatable; keep AR-006 open — do not enable Paid or lower the file contract silently;
15. after valid AR-006 evidence, run exact-head full CI + clean-checkout verification again over the evidence-bound candidate;
16. transition back to `REVIEW_PENDING` only after all remediation evidence is green;
17. run another complete fresh independent Pass B over all WP-2.9C responsibilities and AR-001..007;
18. any BLOCKING/MAJOR finding → `REVIEW_FAILED`;
19. only a clean Pass B may enter `ACCEPTANCE_PENDING`;
20. only Pass C may mark WP-2.9C `ACCEPTED`;
21. only after C acceptance may WP-2.9A resume;
22. WP-2.9B remains `PLANNED / AFTER A`.

### ADR 0013 current diagnostic gate — 2026-09-25

The later ADR 0013 evidence attempt supersedes the historical ADR-0012
second-campaign gate above for current execution. Trigger
`f7951e99eb31bcc63d9cbd93f67db80548340ed6` was contained at its safe
marker preflight before any exact-size document mutation. Its aggregate
`invalid_provider_invocation` opened `ADR13-EV-001`.

Repository diagnostic remediation is now exact-head green at
`743b885f96f734118f4c1a656183dab620eb75ac` / CI `36164117948`:
all five ordinary jobs passed, including clean-checkout verification.

Fresh review
`WP-2.9C-ADR-0013-DIAGNOSTIC-REVIEW.md` is **PASS**. The diagnostic is
pinned to the exact failed UUID/window/script versions, uses only the
Observability credential, cannot deploy or authenticate to Supabase, cannot
emit a new marker or construct/mutate a document, and retains only sanitized
reason codes/metadata.

The commit containing that review/status seal must itself pass ordinary CI and
clean checkout. Only then is one no-content same-tree
`[AR006-INGRESS-DIAGNOSTIC]` trigger authorized. Its output returns to review
and does not automatically authorize another exact-size campaign.

That read-only trigger completed at `561aa6e` / CI `36167031612`. The sole
rejected field was the ingress script version, not CPU. Repository-only
remediation now issues a new random-unreserved marker only after a complete
observation has no failure except that version mismatch, at most three marker
rounds. Implementation `6c5560e` / CI `36169216121` passed 5/5 ordinary jobs,
including clean checkout. Targeted fresh review
`WP-2.9C-ADR-0013-VERSION-READINESS-REVIEW.md` is PASS. Only after its
review/status seal is itself exact-head green may one new, bounded
`[AR006-INGRESS-EVIDENCE]` campaign run. AR-006 and WP-2.9C remain open.

The review/status seal `d3fc84b` passed CI `36170334350` **5/5**, and its
single authorized same-tree campaign `baa119e` / CI `36171181043` passed all
five ordinary jobs. Provider job `108193266069` nevertheless stopped at its
safe marker before any exact-size flow because the first complete Observability
queries returned zero events. The sanitized artifact is `10880811417` / ZIP
SHA-256 `63e839d0e3cfd4f9563bb5dfbcdb10df396e0a174db9e183b3abb5d475eceba3`.
A later read-only query of the same window found both exact-version markers and
their request-correlated invocations. The failure is the harness's early
classification of empty pages as wrong script identity; it does not establish
the 25 MB CPU budget. `WP-2.9C-ADR-0013-EMPTY-LOG-RESULT-2026-09-25.md`
records the result and narrow RED-first correction. The campaign authorization
is exhausted. Next are exact-head CI, fresh targeted review, and a separate
reviewed authorization before any further provider campaign. AR-006 remains
OPEN; WP-2.9A remains BLOCKED.

The correction `5ef42c3` passed exact-head CI `36173041841` **5/5**, including
clean checkout. Fresh targeted review
`WP-2.9C-ADR-0013-EMPTY-LOG-REVIEW.md` is PASS for this narrow scope. Its
review/status seal must itself pass the same five ordinary jobs before one
new no-content same-tree `[AR006-INGRESS-EVIDENCE]` trigger is authorized.
No provider acceptance or WP-2.9C Pass B/C conclusion is inferred.

### ADR 0013 deployed provider result — 2026-09-27

The empty-log review/status seal `890f5bc` passed CI `36343323166` 5/5,
including clean checkout. Its single authorized same-tree trigger `da19c6c` /
CI `36343818988` passed all five ordinary jobs and provider job
`108690065987`. Artifact `10940276677` (ZIP SHA-256
`d94f668d2b04329720555a9b144b89be61b5c5347c137b0430dc24680e9c2aa3`)
records ten distinct exact-25,000,000-byte synthetic finalized promotions,
ten request-correlated ingress CPU measurements within 10 ms, and ten
request-correlated Durable Object CPU measurements within 30,000 ms on the
exact deployed versions. The evaluator returned `pass:true` with complete
provider pages and no failures; Workers Free was attested, with no Paid CPU
entitlement. No additional campaign is needed or authorized by this result.

Next: evidence-bound exact-head CI/clean checkout, `REVIEW_PENDING`, fresh
complete Pass B over AR-001..007, then Pass C only if no major finding remains.
WP-2.9A remains BLOCKED until C is ACCEPTED.

### WP29C-AR-008 release-contract remediation — 2026-09-27

The evidence-bound result commit `bd5ca22` / CI `36344835905` passed all five
ordinary jobs, clean checkout included. Fresh full Pass B
`WP-2.9C-FRESH-PASS-B-2026-09-27.md` found MAJOR AR-008: production contracts
still described the superseded Pages ingress despite ADR 0013 Workers Static
Assets being the proven route. A RED-first contract test reproduced the drift.
`WP-2.9C-AR-008-REMEDIATION-2026-09-27.md` records the locally green
CI/release/secret/Free-tier/plan and deny/static smoke correction. This remains
`IN_PROGRESS` until exact-head CI, review and a new clean full Pass B; the
successful provider CPU evidence is retained, but the later AR-009 review
requires a new compliant proof before acceptance.

### WP29C-AR-009 distinct-PDF provider evidence — 2026-09-28

Fresh full Pass B `WP-2.9C-FRESH-PASS-B-2026-09-28.md` found MAJOR AR-009.
The provider artifact contains ten distinct document/evidence/DO identities
and measured invocations, but the same PDF bytes were staged at all ten
paths. ADR 0013 explicitly requires ten distinct exact-size synthetic PDFs.
RED-first tests demonstrated one repeated SHA-256 and missing duplicate-hash
rejection in the campaign verdict. WP-2.9C remains `IN_PROGRESS /
REMEDIATION`; AR-006 cannot be formally closed or C accepted until a reviewed,
exact-head-green distinct-PDF harness produces a compliant isolated provider
result and a later complete Pass B/Pass C pass. No replacement campaign is
authorized by the failed review alone.

`WP-2.9C-AR-009-REMEDIATION-2026-09-28.md` records the locally green
RED-first generator, per-flow SHA-256/size evidence and fail-closed verdict.
The production ingress/DO runtime is unchanged. Exact-head CI and independent
review must pass before a replacement campaign can be authorized.

The corrected implementation head `8f04bba` / CI `36398524127` is **5/5
SUCCESS**, clean checkout included. The fresh targeted review
`WP-2.9C-AR-009-REVIEW-2026-09-28.md` is PASS for the harness scope. It
authorizes exactly one no-content same-tree `[AR006-INGRESS-EVIDENCE]`
replacement campaign **only after its own review/status seal passes exact-head
5/5 CI**. WP-2.9C remains `IN_PROGRESS`; the campaign result, full fresh
Pass B and Pass C are still required.

The review/status seal `0cffaf2` passed CI `36399469688` **5/5**. Its single
same-tree trigger `9822ba7` / CI `36400324210` reached the isolated provider
job but failed closed at the bodyless marker preflight: both ingress and
Durable Object markers came from prior versions. Artifact `10960925487`
records no 25 MB invocation or PDF hash. The one-campaign authorization is
exhausted. `WP-2.9C-ADR-0013-PAIRED-VERSION-READINESS-2026-09-28.md`
records the exact versions, artifact digest and RED-first bounded correction.
Its implementation alone cannot authorize a rerun. Exact-head CI, fresh
targeted review (including the dated ADR 0013 paired-version amendment) and a
separate review/status seal are next; C remains
`IN_PROGRESS`, A `BLOCKED`, and AR-006/AR-009 open.

The dated ADR amendment `8b8925c` / CI `36423946026` passed **5/5**,
including clean checkout, and the fresh targeted
`WP-2.9C-ADR-0013-PAIRED-VERSION-REVIEW-2026-09-28.md` review is PASS for
the narrow marker boundary. Its single replacement-campaign authorization
is conditional on this review/status seal's own five ordinary exact-head CI
jobs. The full C Pass B and Pass C remain downstream of compliant provider
evidence.

The review/status seal `f18f1f4` / CI `36424965352` passed **5/5**. Its
same-tree trigger `fe03af2` / CI `36425931984` passed five ordinary jobs but
the isolated provider job failed closed at a partially persisted marker:
one valid DO marker, missing ingress marker, no PDF mutation or acceptance
CPU sample. Artifact `10972140652` and digest are recorded in
`WP-2.9C-ADR-0013-PARTIAL-MARKER-RESULT-2026-09-28.md`. A RED-first narrow
classifier correction now waits for the same marker within the existing
eight-query bound; ADR 0013 documents this read-only exception. The prior
authorization is exhausted. Correction `039e8fdd` / CI `36428473034` passed
**5/5**, including clean checkout. The fresh targeted review
`WP-2.9C-ADR-0013-PARTIAL-MARKER-REVIEW-2026-09-28.md` is PASS for this
narrow scope. A separate review/status seal must pass exact-head 5/5 CI before
one no-content same-tree campaign. C remains `IN_PROGRESS`, A `BLOCKED`,
AR-006/AR-009 open.

The review/status seal `15d4e4e` / CI `36458756536` passed **5/5**,
including clean checkout. Its one same-tree trigger `2303df0` / CI
`36459949861` passed all ordinary checks and isolated provider job
`109058754517`. Sanitized artifact `10987866873` has ZIP SHA-256
`6ec13fbc69d7ab098d46ecc8219f383a4996c2dc193ffa753ac012c81d5e9c92`.
`WP-2.9C-ADR-0013-DISTINCT-PDF-PROVIDER-RESULT-2026-09-28.md` records
ten distinct exact-size PDF hashes, ten finalized flows, ten valid exact-version
ingress CPU readings at **0–2 ms** and ten DO readings at **274–360 ms**,
all within the respective Workers Free budgets. This provider result is a
candidate to close AR-006/AR-009, not Pass B or C acceptance. Next bind the
result to exact-head CI, then perform the complete fresh Pass B and separate
Pass C. A remains `BLOCKED` until C is accepted.

## Deviations

No security-contract deviation is authorized.
