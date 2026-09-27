# WP-2.9C ADR 0013 — Empty-log marker remediation review

Status: **PASS FOR ONE BOUNDED EXACT-SIZE CAMPAIGN AFTER REVIEW-SEAL CI**

Review date: 2026-09-25

Reviewed implementation head: `5ef42c3`

Exact-head CI: `36173041841` — **5/5 SUCCESS**, including full verification
from a clean checkout; provider-specific jobs skipped.

## Independent review basis

This targeted review re-read ADR 0013's exact-version and two-surface CPU
contracts, the failed sanitized receipt `10880811417`, the bounded marker
runner, surface discovery, readiness classifier, focused tests and the final
ten-flow verdict. It treats the implementation test result as evidence to
challenge, not as the review conclusion. It is **not** the complete fresh
WP-2.9C Pass B.

The previous authorization was consumed by `baa119e` / CI `36171181043`.
The provider job deployed both exact scripts but stopped at the safe marker,
with zero exact-size flows. Its first complete query found zero events. A later
read-only query of that same window found one request-correlated marker and
provider invocation on each exact deployed version. No 25 MB CPU claim follows
from those marker measurements.

## Findings

### ADR13-EL-001 — CLOSED / VERIFIED — empty pages are not a wrong-script observation

Surface discovery creates two `missing_marker` and two synthetic
`unexpected_*_script` failures when no persisted marker exists. The previous
classifier treated the latter as proof of wrong identity and stopped after
one query. The correction recognizes only the precise zero-marker,
zero-attribution, four-failure shape as `await_logs`. The regression test uses
the real discovery function on an empty event set. It was RED before the
correction and is GREEN afterward.

### ADR13-EL-002 — CLOSED / VERIFIED — adverse observations still fail closed

The classifier still blocks an observed partial/wrong-script shape, extra
failure, invalid provider invocation, CPU overrun, wrong Durable Object
version, status/model/outcome/truncation defect or incomplete final proof.
It does not produce `retry_marker` for empty pages. The marker loop remains
limited to eight queries separated by the existing ten-second delay; a final
empty result fails before `createExactPdf(25_000_000)`. A fresh marker round
is still restricted to a complete, sole ingress version mismatch, at most
three rounds with a 20-second separation.

### ADR13-EL-003 — CLOSED / VERIFIED — exact-size evidence boundary unchanged

`markerPreflightPassed` still requires complete two-surface queries and
`discovery.pass`. The exact-size runner, final two-surface evaluator, Free CPU
budgets, exact deployed versions, ten distinct finalized synthetic flows and
Durable Object identity checks are unchanged. The correction modifies no
ingress/DO runtime, Supabase authority, credential, binding, Pages route or
document lifecycle code.

### ADR13-EL-004 — CLOSED / VERIFIED — provenance and privacy

The failed receipt retains only sanitized provider/query metadata and no
raw event or secret. The follow-up Cloudflare query was read-only and
reported only marker/invocation fields needed to classify the failure. The
repository record identifies the exact commit, run, provider job, artifact
and ZIP digest. Local focused tests, typechecks, lint, format, metrics and
secret controls passed; exact-head CI passed all five ordinary jobs. No
provider job ran on the correction push.

## Conclusion and authorization

**PASS for the targeted remediation.** No BLOCKING/MAJOR finding remains in
this narrow classifier scope. ADR 0013's earlier structured-log preflight is
green, and the latest deployed marker's exact-version event pairs were
confirmed by read-only requery. No deployment/security topology changed.

Only after the commit containing **this review and status seal** passes all
five ordinary CI jobs, including `Full verify from clean checkout`, authorize
**exactly one** no-content same-tree `[AR006-INGRESS-EVIDENCE]` trigger. It
must redeploy the exact isolated scripts and pass a newly emitted safe marker
on those exact versions before constructing any 25 MB PDF. A red result
consumes this authorization and returns to review; do not automatically
repeat it.

This review does not close AR-006 or accept WP-2.9C. A green provider result
must be inspected and bound to exact-head CI, then the packet needs a complete
fresh Pass B and Pass C. Workers Paid, wall-time substitution, aggregate CPU,
relaxed version/CPU checks and a reduced file limit remain prohibited.
