# WP-2.9C / ADR 0013 — paired-version marker readiness review

Date: 2026-09-28  
Implementation/result head: `f9bd24e9939db95b74f96399bddb23a41bbcc7d2`
— [CI `36423040486`](https://github.com/tobianahillel-afk/mariage-os/actions/runs/36423040486)
**5/5 SUCCESS**, clean checkout included.  
Normative amendment head: `8b8925cb2ccb045aeef098f8876cea3148ce7d1c`
— [CI `36423946026`](https://github.com/tobianahillel-afk/mariage-os/actions/runs/36423946026)
**5/5 SUCCESS**, clean checkout included. Both ordinary pushes skipped provider
jobs.

This is a **targeted adversarial review**, not the complete WP-2.9C Pass B.
I re-read the current WP-2.9C responsibilities, ADR 0013 exact-version and
ten-distinct-PDF gates, the failed full Pass B and the prior narrow readiness
review before comparing the code, tests and failed provider receipt. No
separate reviewer was used. The earlier review's claim that every wrong
Durable Object version blocks is explicitly superseded **only** for the
paired version-only diagnostic shape in the dated ADR amendment.

## Findings and disposition

### ADR13-VR-006 — CLOSED / VERIFIED — normative drift

The first correction commit passed code CI but contradicted the then-accepted
ADR 0013 sentence forbidding every Durable Object version mismatch. It was
not eligible to trigger a campaign. The dated amendment at `8b8925c` now
specifies exactly two retryable shapes: ingress-only version lag with an
attributed exact-version DO, or paired ingress+DO version lag with zero
attributed exact-version invocations. An isolated wrong DO version still
blocks. The amendment does not change either final exact-version condition
or the ten-distinct-PDF, Workers Free CPU acceptance gate.

### ADR13-VR-007 — CLOSED / VERIFIED — retry cannot hide adverse telemetry

`markerReadiness` requires complete success/page-complete queries before a
version-only retry. The paired classifier requires two markers, zero
attributed invocations and exactly two `invalid_provider_invocation`
failures, one per named surface, each with only `script_version_mismatch`.
The discovery evaluator independently checks script name, provider request
correlation, execution model, numeric CPU and Free budget, outcome, event,
HTTP status, DO identity and truncation. Any extra/duplicate/wrong-surface
marker or any second failure reason blocks. Missing persisted logs can only
be re-read within the existing eight-query bound; they cannot authorize a
new marker. Focused adverse tests cover duplicate marker and DO CPU failure.

### ADR13-VR-008 — CLOSED / VERIFIED — no mutation before final proof

Each retry generates a new evidence UUID and random unreserved document UUID.
The request is bodyless, authenticated and requires the generic JSON HTTP
409, with at most three marker rounds and 20 seconds between version-skew
rounds. At the last round, even another version-only result returns to the
caller and fails `markerPreflightPassed`; no fourth probe is possible. That
gate requires readiness `ready`, complete queries and discovery `pass:true`
on both exact deployed versions before `runAr006Promotions` constructs or
stages a 25 MB PDF. The failed artifact itself records zero mutations.

### ADR13-VR-009 — CLOSED / VERIFIED — evidence and security boundary

The sanitized receipt adds only prior round numbers and observed ingress/DO
version IDs. It stores no token, password, private PDF bytes or raw provider
log body. The production ingress/DO code, permissions, Supabase schema and
secret configuration are unchanged. Both exact-head CI runs passed the
secret guard and clean-checkout full verify. The previous valid CPU readings
remain limited to the repeated-byte sample; the failed distinct-PDF attempt
provides no acceptance CPU measurements.

## Verdict and bounded authorization

**PASS for this targeted readiness scope; no BLOCKING/MAJOR finding remains
within it.** WP-2.9C stays `IN_PROGRESS / REMEDIATION`, AR-006 and AR-009
remain open, WP-2.9A stays `BLOCKED`, and Pass C is forbidden.

Only after the commit containing **this review and current status seal**
passes all five ordinary exact-head CI jobs, including `Full verify from
clean checkout`, authorize **one** no-content same-tree
`[AR006-INGRESS-EVIDENCE]` trigger. The reviewed marker gate must attribute
both exact deployed versions before any exact-size mutation. The isolated
campaign must show ten byte-distinct synthetic 25,000,000-byte PDFs, ten
successful finalizations with ten distinct DO identities, ten exact-version
ingress and ten exact-version DO provider CPU readings within Workers Free,
and no Paid entitlement. A red or
incomplete result exhausts this authorization and returns to review without
an automatic repeat. A green result still requires an evidence-bound exact
head, complete fresh Pass B across all seven packet responsibilities and a
separate Pass C before C can be accepted or A resumed.
