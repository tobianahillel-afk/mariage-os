# WP-2.9C ADR 0013 — empty-log marker result

Status: **CAMPAIGN FAILED-CONTAINED / REPOSITORY CLASSIFIER REMEDIATION / AR-006 OPEN**

The reviewed version-readiness seal `d3fc84be4dccee7812076a53c414aa1ab3826bd0`
passed CI `36170334350` **5/5**, including clean checkout. Its one authorized
same-tree trigger `baa119ea77be3769ca9c66b9a62904bfe7b3a2b7` ran CI
`36171181043`: all five ordinary jobs passed. Provider job `108193266069`
deployed the exact private Durable Object host and Workers Static Assets
ingress, passed the deny smoke, then failed at the mandatory structured safe
marker. The ten exact-size flows were **not** started.

Sanitized artifact `10880811417` (ZIP SHA-256
`63e839d0e3cfd4f9563bb5dfbcdb10df396e0a174db9e183b3abb5d475eceba3`)
records `completedInvocationCount: 0`, `invocations: []`, `provider: null`,
`failureStage: "marker_preflight"` and `pass: false`. Its first complete
Observability query returned HTTP 200 with **zero events on both surfaces**.
The discovery emitted two `missing_marker` and the derived
`unexpected_ingress_script` / `unexpected_durable_object_script` failures,
so the readiness classifier returned `blocked` after one query instead of
using the existing bounded delayed-log polling. The marker route itself
returned the expected safe HTTP 409.

A read-only Cloudflare Observability requery of the **same historical window**
later returned HTTP 200 with six ingress events and two Durable Object events.
Each surface contained exactly one marker for the failed attempt's evidence ID
and one matching provider invocation. The ingress invocation used the required
version `7da58962-4389-449f-88fa-e44f8e238c46`, HTTP 409, `ok`,
`stateless`, `1 ms` CPU. The Durable Object invocation used the required
version `a2c81dc6-b169-4fea-82be-7bd5ae9bfebf`, HTTP 409, `ok`,
`durableObject`, `17 ms` CPU. This verifies that the originally empty window
later contained the expected exact-version marker evidence. It does **not**
measure an exact-size promotion, and the exact time at which events became
queryable is not known.

The contained result exhausted its single campaign authorization. The narrow
repository correction is to classify precisely the zero-marker, zero-attribution,
two-missing-marker plus two derived script-identity-failure shape as
`await_logs`. The existing eight-query/10-second-delay bound remains; any
additional failure, observed wrong-script marker, invalid invocation, CPU,
status or version defect still blocks. RED-first regression evidence must show
the observed shape failing before the correction and passing afterward.

Next: exact-head local/CI verification of this narrow correction, fresh
adversarial review of the delayed-log classifier and evidence boundary, and
only then a separately authorized provider campaign. No automatic retry,
Workers Paid, wall-time substitution, aggregate CPU, or lower file limit is
permitted. AR-006 and WP-2.9C remain open.
