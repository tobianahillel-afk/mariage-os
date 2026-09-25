# WP-2.9C ADR 0013 — Failed-window diagnostic implementation review

Status: **PASS — ONE EXACT FAILED-WINDOW READ-ONLY REQUERY AUTHORIZED AFTER REVIEW-SEAL CI**

Review date: 2026-09-25  
Reviewed implementation head: `743b885f96f734118f4c1a656183dab620eb75ac`  
Exact-head CI: `36164117948` — **5/5 SUCCESS**, including `Full verify from clean checkout`  
Provider-specific jobs on reviewed head: **SKIPPED**

## Scope

Fresh adversarial review of the repository-only remediation for
`ADR13-EV-001`, opened after the contained ADR 0013 exact-size attempt
`f7951e99eb31bcc63d9cbd93f67db80548340ed6` failed its mandatory marker
preflight before any exact-size document mutation.

The reviewed change adds deterministic provider-invocation rejection reasons and
one dedicated read-only requery of the already-produced failed Observability
window. It does not alter the trusted document lifecycle, deployment topology,
25 MB contract, authorization model or provider CPU budgets.

## Findings

### ADR13-DIAG-IR-001 — CLOSED / VERIFIED — diagnostic is pinned to the exact failed evidence

The diagnostic hard-codes only the historical failed source identity required
for this investigation:

- failed source SHA:
  `f7951e99eb31bcc63d9cbd93f67db80548340ed6`;
- evidence UUID:
  `a5848756-d76c-4848-9312-eab1b883a063`;
- retained window:
  `2026-09-25T16:06:26.252Z` to
  `2026-09-25T16:07:53.815Z`;
- ingress script/version:
  `mariage-os-ar006-ingress` /
  `8c48646c-c9a3-410b-98c4-b42a98e75244`;
- Durable Object host script/version:
  `mariage-os-private-document-promotion` /
  `683829d6-abb8-4340-8bf1-2a5c78d527a1`.

It cannot silently widen the query to a new campaign or unrelated deployment.

### ADR13-DIAG-IR-002 — CLOSED / VERIFIED — provider access is read-only and least-privilege

The marker-gated CI job receives only account metadata, the Workers Free
attestation and `AR006_CLOUDFLARE_OBSERVABILITY_TOKEN`.

It receives no Worker deployment token, Pages credential, synthetic-user
password, Supabase URL/key or application admin credential. It contains no
Wrangler deployment, provider configuration/PATCH, Supabase authentication,
route probe, PDF construction, reservation, upload, promotion or finalization.

### ADR13-DIAG-IR-003 — CLOSED / VERIFIED — retained output is privacy-safe and diagnostic-only

The artifact retains sanitized query status/count metadata plus deterministic
failure codes and bounded invocation diagnostics:

- CPU value and contract budget;
- outcome;
- execution model;
- event type;
- HTTP status;
- only a boolean indicating whether a Durable Object ID exists;
- script version;
- truncation flag.

It does not retain raw provider events, raw Durable Object IDs, request IDs,
authorization headers, tokens, passwords, PDF bytes or wedding data.

The receipt explicitly records
`deploymentMutation:false`, `supabaseAuthentication:false`,
`newMarker:false`, `documentMutation:false`,
`exactSizeMutation:false` and `providerAcceptance:false`.

### ADR13-DIAG-IR-004 — CLOSED / VERIFIED — reason vocabulary remains fail-closed

The aggregate `invalid_provider_invocation` now carries deterministic reason
codes for missing/negative/over-budget CPU, provider outcome, execution model,
event type, missing/mismatched status, missing Durable Object identity,
missing/mismatched script version and truncated telemetry.

The refactor used to satisfy repository complexity limits preserves those checks;
it does not remove or relax any validation branch.

### ADR13-DIAG-IR-005 — CLOSED / VERIFIED — incomplete telemetry cannot become a result

The diagnostic requires both exact-script Observability queries to be API
successful and complete and requires the two historical structured markers to
be present. It writes the sanitized receipt before failing if that completeness
condition is not met.

A successful diagnostic execution means only that the historical failure became
classifiable. It is **not** AR-006 provider acceptance and cannot authorize an
automatic exact-size retry.

## Conclusion and authorization

**PASS.** No BLOCKING/MAJOR finding remains in the diagnostic implementation.

Exactly one no-content same-tree trigger containing
`[AR006-INGRESS-DIAGNOSTIC]` is authorized **only after the commit containing
this review/status reconciliation passes ordinary exact-head CI and
`Full verify from clean checkout`**.

That run may query only the already-produced failed window. After it completes,
its sanitized artifact must return to review. No automatic
`[AR006-INGRESS-EVIDENCE]` retry is authorized regardless of the diagnostic
outcome.

Workers Paid, wall-time substitution, dashboard aggregates, file-limit
reduction and any silent relaxation of version/model/status/CPU checks remain
prohibited.
