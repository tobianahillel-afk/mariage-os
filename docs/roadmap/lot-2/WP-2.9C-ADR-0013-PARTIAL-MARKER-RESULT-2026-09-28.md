# WP-2.9C / ADR 0013 — partial marker result

State: **SINGLE REVIEWED CAMPAIGN FAILED CLOSED; BOUNDED RE-READ REMEDIATION
EXACT-HEAD CI GREEN / TARGETED REVIEW PASS; REVIEW SEAL PENDING; AR-006 / AR-009 OPEN**.

Review/status seal `f18f1f475a3f415d5aa115d2091a0ac85d93d5d9` passed
[CI `36424965352`](https://github.com/tobianahillel-afk/mariage-os/actions/runs/36424965352)
5/5, clean checkout included. Its no-content trigger
`fe03af21c0059d6d4344002f58ec4f5b170d65ff` has the identical Git tree
`89ca07547c6efc9c9eda63fe07de35fee2927c86` and ran
[CI `36425931984`](https://github.com/tobianahillel-afk/mariage-os/actions/runs/36425931984).
All five ordinary jobs succeeded. Isolated provider job `108943088476`
deployed the private DO host and ingress, captured their versions, passed the
binding/secret checks and deny-oriented Worker smoke, then failed at the
bodyless marker preflight. The sanitized artifact `10972140652` has ZIP SHA-256
`d17ba9006e98b1391e4d086697e8322b4a724fd569744a13c9888d7cac904a45`.

The artifact records `failureStage:"marker_preflight"`, `pass:false`,
`completedInvocationCount:0`, empty `pdfSha256s`/`invocations`, and no
provider CPU acceptance result. The route returned the required generic
HTTP 409 on its first attempt. Both script-filtered Observability queries
returned HTTP 200/success and complete event pages. At the third query of
marker round one, the DO marker/invocation was attributable, while the
ingress marker had not appeared in its five-event page. Discovery reported
`markerCount:1` and exactly `missing_marker` plus synthetic
`unexpected_ingress_script` (the script-name set is empty when the ingress
marker is missing). The classifier returned `blocked`; it did not use its
remaining bounded re-reads or start a second marker round. No 25 MB document
was constructed, reserved, uploaded, promoted or finalized.

The presence of a complete query page at one instant does **not** prove the
ingress structured marker will never be persisted. This evidence cannot
establish whether the cause is temporary ingestion delay, missing log emission
or another provider behavior. A read-only connector query attempted after
the run returned HTTP 400, so it supplies no further provider evidence.
Neither a later dashboard aggregate nor the earlier repeated-byte campaign
can replace this missing ten-distinct-PDF proof.

Next permitted action: RED-first test the exact one-valid-DO-marker / missing
ingress-marker discovery shape. Permit only re-reading the **same** marker
within the existing eight-query/time bound; do not issue a new marker or
mutate a document. A wrong-script marker, uncorrelated invocation, CPU/outcome
failure, duplicate marker or exhausted re-read must still block. Then run
exact-head CI/clean checkout, targeted adversarial review and a separate
review/status seal before **one** new campaign can be authorized. A red
campaign returns to review without automatic repeat. WP-2.9C remains
`IN_PROGRESS / REMEDIATION`, WP-2.9A `BLOCKED`, Pass C forbidden.

## RED-first bounded remediation

A focused test reproduced the artifact's logical discovery shape with one
marker, one valid attributed invocation and exactly `missing_marker` plus
`unexpected_ingress_script`. It failed RED: `blocked` instead of
`await_logs`. The classifier now allows only that exact partial shape to
re-read the **same** marker. A matching shape with zero attributed
invocations, an extra `duplicate_marker`, or two markers remains blocked.
The previously reviewed empty-page re-read and ingress/paired version-only
new-marker rules remain separate. No provider event is accepted as final
without two complete, exact-version attributed markers.

The harness retains at most eight read-only Observability queries for a
marker. Exhaustion returns non-ready and stops before `runAr006Promotions`.
This correction makes no new HTTP route request on its own, changes no
production Worker/DO runtime, credentials, permissions, PDF size or CPU
threshold, and does not authorize another provider campaign. ADR 0013 now
explicitly records the bounded partial-persistence exception rather than
silently conflicting with its incomplete-telemetry stop rule. Focused
readiness/route tests pass **10/10** locally after the RED reproduction;
TypeScript, lint, format and secret guard passed locally. Correction
`039e8fdddf7003adaa3ed0f433288f13903faf4c` / CI `36428473034` passed
**5/5**, including clean checkout. Fresh targeted review is PASS in
`WP-2.9C-ADR-0013-PARTIAL-MARKER-REVIEW-2026-09-28.md`; its separate
review/status seal and CI remain pending before one new provider campaign.
