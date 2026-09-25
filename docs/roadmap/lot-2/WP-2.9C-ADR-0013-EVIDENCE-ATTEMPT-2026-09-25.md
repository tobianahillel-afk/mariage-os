# WP-2.9C / AR-006 — ADR 0013 exact-size evidence attempt

Status: **FAILED-CONTAINED AT MARKER PREFLIGHT — ZERO EXACT-SIZE FLOWS EXECUTED — NOT CPU ACCEPTANCE EVIDENCE**

Date: 2026-09-25

## Exact trigger and repository gates

- reviewed preflight-result seal: `e5e5399e5f44c8ae972390e89db1a6b8ed10502f`;
- exact same-tree trigger: `f7951e99eb31bcc63d9cbd93f67db80548340ed6`;
- shared tree: `8e8c1d805351246e551b5e7e98dce3a906780abf`;
- workflow: `36157672647`;
- Core quality/security: **SUCCESS**;
- Local Supabase DB/RLS/runtime: **SUCCESS**;
- Browser/mutation: **SUCCESS**;
- Privacy-safe preview: **SUCCESS**;
- Full verify from clean checkout: **SUCCESS**;
- provider evidence job: `108149068138` — **FAILURE**.

No automatic retry is authorized.

## Exact provider deployment reached

The job successfully:

- redeployed the private Durable Object host;
- captured host deployment `f9632a92-8318-4494-b84b-4b8266e3690f`;
- captured host version `683829d6-abb8-4340-8bf1-2a5c78d527a1`;
- deployed the ADR 0013 Workers Static Assets ingress;
- captured ingress deployment `3d630376-22f6-4b5f-ae98-85d5c9a4622e`;
- captured ingress version `8c48646c-c9a3-410b-98c4-b42a98e75244`;
- verified the external `PRIVATE_DOCUMENT_LIFECYCLE` Durable Object binding;
- verified `PRIVATE_DOCUMENT_ADMIN_KEY` absent from the public ingress;
- passed the deny-oriented production smoke.

## Contained failure

The final harness authenticated the synthetic user and ran its mandatory safe
marker/route preflight **before constructing the exact-size PDF or reserving any
evidence document**.

Route readiness reached the lifecycle with the expected generic HTTP `409` on
attempt 1.

After eight bounded Observability attempts, the final complete query window was:

- from `2026-09-25T16:06:26.252Z`;
- to `2026-09-25T16:07:53.815Z`;
- ingress query: HTTP 200 / API success / complete page / 6 events;
- Durable Object query: HTTP 200 / API success / complete page / 2 events;
- expected persisted markers found: 2;
- failing synthetic evidence UUID:
  `a5848756-d76c-4848-9312-eab1b883a063`;
- discovery failure: `invalid_provider_invocation`;
- marker-preflight pass: `false`.

The harness then failed closed with
`ADR 0013 structured marker preflight failed.`

It did **not** enter `exact_size_setup` or `exact_size_flows`.

Sanitized artifact:

- artifact ID: `10874337441`;
- artifact digest:
  `sha256:b286b9361df2ca8780f054c60a957ac0edfbcfded71e1d67e6525f9087e324b7`;
- schema:
  `mariage-os.wp29c.ar006.adr0013-two-surface-failure.v1`;
- `completedInvocationCount: 0`;
- `invocations: []`;
- `provider: null`;
- `failureStage: "marker_preflight"`;
- `pass: false`.

Therefore this result contains **no exact-25-MB promotion result and no CPU
acceptance/rejection measurement for the ten-flow contract**.

## Review finding

The current sanitized failure vocabulary is insufficient to classify
`invalid_provider_invocation`. That aggregate failure can represent a CPU
budget failure, provider outcome/model/event/status mismatch, missing Durable
Object identity, exact-version mismatch or truncated provider telemetry.

Treating this aggregate code as either an architecture failure or a harmless
telemetry issue would be guesswork.

**ADR13-EV-001 — MAJOR / OPEN — marker-preflight provider-invocation failure is
not diagnosable from retained sanitized evidence.**

## Authorized continuation

Only repository work is authorized first:

1. replace the aggregate invocation-validity boolean with deterministic,
   privacy-safe reason codes for each rejected provider field;
2. retain the surface name and those reason codes in sanitized diagnostics;
3. add focused tests for every reason;
4. add one dedicated read-only existing-event requery path bound to this exact
   failed UUID, timeframe, script names and script versions;
5. run ordinary exact-head CI + clean-checkout verification;
6. review the implementation before any provider call.

After those steps are exact-head green, **one** diagnostic requery of the
already-produced Observability events may be authorized. It must perform no
deploy, Supabase authentication, new marker, document mutation or exact-size PDF
work. The diagnostic result returns to review and does not authorize an
automatic exact-size campaign.

No Workers Paid entitlement, wall-time substitute, dashboard aggregate, file
limit reduction or silent relaxation of version/model/status/CPU checks is
authorized.
