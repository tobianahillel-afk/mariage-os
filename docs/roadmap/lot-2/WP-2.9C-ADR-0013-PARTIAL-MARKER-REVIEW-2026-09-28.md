# WP-2.9C / ADR 0013 — partial-marker readiness review

Date: 2026-09-28

Implementation/result head: `039e8fdddf7003adaa3ed0f433288f13903faf4c` —
[CI `36428473034`](https://github.com/tobianahillel-afk/mariage-os/actions/runs/36428473034)
**5/5 SUCCESS**, including full verification from clean checkout. Provider jobs
were skipped on this ordinary push.

This is a **targeted adversarial review**, not the complete WP-2.9C Pass B.
I re-read the current WP-2.9C responsibilities, ADR 0013's exact-version,
bounded re-read and ten-distinct-PDF gates, the failed full Pass B, the prior
empty-log/paired-version reviews, the failed provider receipt recorded in
`WP-2.9C-ADR-0013-PARTIAL-MARKER-RESULT-2026-09-28.md`, the discovery and
runner code, the RED-first test and the final campaign verdict. No separate
reviewer was used.

## Findings and disposition

### ADR13-PM-001 — CLOSED / VERIFIED — precise partial persistence

The failed receipt has one attributed Durable Object marker/invocation and no
ingress marker. In the discovery implementation, the absent ingress marker
produces `missing_marker` and the empty ingress script-name set produces the
synthetic `unexpected_ingress_script`; this does not prove an observed wrong
script. The new classifier requires exactly those two distinct codes, one
marker and one valid attributed invocation. A malformed, duplicate, wrong
surface or observed wrong-script marker produces another failure or a different
count and cannot match. The focused test was RED (`blocked`) before the change
and GREEN (`await_logs`) afterward; zero attribution, an extra duplicate
failure and two markers are blocked.

### ADR13-PM-002 — CLOSED / VERIFIED — bounded read-only behavior

`await_logs` stays inside the existing `markerProbe` loop of at most eight
script-filtered Observability queries for the **same** evidence UUID. It makes
no second route request and no new marker. At exhaustion the last non-ready
result fails `markerPreflightPassed` before `runAr006Promotions` constructs or
stages a 25 MB PDF. A new marker remains limited to the separately reviewed
complete version-only diagnostics and three rounds. Incomplete provider query
pages cannot become `ready`.

### ADR13-PM-003 — CLOSED / VERIFIED — final proof cannot be bypassed

The final gate still needs complete ingress and Durable Object queries,
`discovery.pass === true`, two markers and two attributed invocations on the
exact deployed versions. Discovery checks request correlation, script,
version, outcome, model, event, status, CPU budgets, DO identity and
truncation. The ten-distinct-PDF verdict and Workers Free CPU thresholds were
not changed. The production ingress, DO runtime, binding, Supabase authority
and secrets were not changed. The ADR 0013 dated clause explicitly permits
this exact partial re-read and keeps adverse or exhausted telemetry blocking.

### ADR13-PM-004 — CLOSED / VERIFIED — provenance and privacy

The failed campaign's sanitized artifact `10972140652` has recorded ZIP
SHA-256 `d17ba9006e98b1391e4d086697e8322b4a724fd569744a13c9888d7cac904a45`;
it records zero completed PDF invocations. The correction adds no credential,
PDF bytes or raw provider logs to the receipt. Exact-head CI passed the secret
guard, focused tests and clean-checkout full verification. No provider CPU
acceptance claim follows from the failed marker attempt.

## Verdict and bounded authorization

**PASS for this targeted readiness scope; no BLOCKING/MAJOR finding remains
within it.** WP-2.9C stays `IN_PROGRESS / REMEDIATION`, AR-006 and AR-009
remain open, WP-2.9A stays `BLOCKED`, and Pass C is forbidden.

Only after the commit containing **this review and current status seal**
passes all five ordinary exact-head CI jobs, including clean checkout,
authorize **one** no-content same-tree `[AR006-INGRESS-EVIDENCE]` trigger. The
marker preflight must attribute both exact deployed versions before any
exact-size mutation. The isolated campaign must prove ten byte-distinct
synthetic 25,000,000-byte PDFs, ten finalized flows with distinct DO identities,
ten exact-version ingress and ten exact-version DO provider CPU readings
within Workers Free, and no Paid entitlement. A red or incomplete result
exhausts this authorization and returns to review without automatic repeat.
A green result still requires an evidence-bound exact head, complete fresh
Pass B across all seven packet responsibilities and separate Pass C before C
can be accepted or A resumed.
