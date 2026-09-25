# WP-2.9C ADR 0013 — Exact-version readiness remediation review

Status: **PASS FOR ONE BOUNDED EXACT-SIZE CAMPAIGN AFTER REVIEW-SEAL CI**

Review date: 2026-09-25
Reviewed implementation head: `6c5560ed6d1ef89e617adc77dace28790adf30f7`
Exact-head CI: `36169216121` — **5/5 SUCCESS**, including full verification
from a clean checkout; provider-specific jobs skipped.

## Scope and evidence

This is a targeted adversarial review of `ADR13-EV-001` after the failed-window
diagnostic `561aa6e` / artifact `10879110764` classified the prior campaign's
only rejected provider field as ingress `script_version_mismatch`. It is **not**
the complete fresh WP-2.9C Pass B. The prior marker used ingress version
`11eb9e2f...` at `3 ms` CPU while the exact deployed version was
`8c48646c...`; the Durable Object was correctly attributed.

The reviewed commit changes only the evidence harness/readiness classifier,
sanitized receipt and governing documentation. The ingress/DO runtime code,
Supabase authorization, trusted-byte checks, 25 MB file contract and ten-flow
provider evaluator are unchanged.

## Findings

### ADR13-VR-001 — CLOSED / VERIFIED — retry cannot mask CPU or provider errors

`markerReadiness` permits `retry_marker` only after complete ingress and DO
queries, two valid markers, exactly one attributed invocation and exactly one
failure: ingress `script_version_mismatch`. A CPU overrun combined with version
skew, wrong DO version, outcome/model/event/status mismatch, truncation,
duplicate marker or wrong surface returns `blocked`. Missing persisted logs may
be re-read only within the existing eight-query bound; they cannot cause a new
marker round. Focused tests cover the positive and adverse branches.

### ADR13-VR-002 — CLOSED / VERIFIED — new marker remains safe and bounded

Each marker round uses a fresh evidence UUID and fresh random unreserved
document UUID with the existing bodyless authenticated route probe. It
requires generic HTTP 409 and does not reserve, stage, promote or finalize a
document. There are at most three marker rounds, with a 20-second gap between
version-skew rounds; the collector's timestamp lookback is ten seconds. Any
failure at the last round stops before `createExactPdf(MAX_BYTES)`.

### ADR13-VR-003 — CLOSED / VERIFIED — exact final version and CPU proof preserved

`markerPreflightPassed` now requires readiness `ready` and complete queries.
Only then can the harness construct the exact 25,000,000-byte PDF and execute
ten flows. The final `evaluateAr006TwoSurfaceEvents` and `campaignPassed`
checks still require exact script/version identity, numeric provider CPU within
the Free budgets, ten successful finalized flows, distinct Durable Object IDs
and no CPU-limit outcome. An old-version final invocation still fails.

### ADR13-VR-004 — CLOSED / VERIFIED — retained result remains sanitized

The receipt adds the final marker round/readiness and, for earlier skew-only
rounds, only the round number and observed ingress version ID. It retains no
raw provider events, bearer, password, secret, private document bytes or
application data. The repository secret guard passed locally and in exact-head
CI.

### ADR13-VR-005 — CLOSED / VERIFIED — no hidden provider execution

The reviewed head passed Core quality/security, local Supabase DB/RLS/runtime,
browser/mutation, privacy-safe preview and clean-checkout full verification.
The exact-size provider job was skipped on the ordinary push. The diagnostic
result was read-only and remains separate from CPU acceptance evidence.

## Conclusion and authorization

**PASS for the targeted correction.** No BLOCKING/MAJOR finding remains within
this readiness scope. The historical ADR 0013 structured ingress/DO preflight
was green and the deployment/security boundary did not change. A second
provider preflight that redeploys both Workers would create another fresh
version-propagation race without testing a new runtime boundary.

After the commit containing **this review and status seal** itself passes all
five ordinary CI jobs, including `Full verify from clean checkout`, authorize
**exactly one** no-content same-tree `[AR006-INGRESS-EVIDENCE]` trigger using the
reviewed bounded harness. Its safe marker gate must succeed on the exact
deployed versions before any 25 MB mutation. A red result exhausts this
authorization and returns to review; no automatic retry.

This review does not close AR-006 or accept WP-2.9C. A green ten-flow provider
result must be inspected, reconciled to an evidence-bound exact-head CI, then
followed by a complete fresh Pass B and Pass C. Workers Paid, wall-time
substitution, dashboard aggregates, relaxed version/CPU checks and a smaller
file contract remain prohibited.
