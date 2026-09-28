# WP-2.9C / ADR 0013 — distinct-PDF provider result

State: **PROVIDER CAMPAIGN PASS; EVIDENCE-BOUND EXACT-HEAD CI AND FULL FRESH
PASS B PENDING. WP-2.9C NOT YET ACCEPTED.**

The targeted partial-marker review/status seal ended at
`15d4e4eac6973de5d00798ca849568d6692e898d` and passed
[CI `36458756536`](https://github.com/tobianahillel-afk/mariage-os/actions/runs/36458756536)
**5/5**, including full verification from a clean checkout. The one authorized
no-content trigger `2303df0c9e8d6f72561ec0ce42514663801229d8` has the
same Git tree `00d7e1c668054de63719b7ae1e404700d91e9f72`.

[CI `36459949861`](https://github.com/tobianahillel-afk/mariage-os/actions/runs/36459949861)
passed all five ordinary jobs and the isolated provider job `109058754517`.
The sanitized evidence artifact is `10987866873`, named
`wp-2.9c-ar006-adr0013-evidence-2303df0c9e8d6f72561ec0ce42514663801229d8`.
Its ZIP SHA-256 is
`6ec13fbc69d7ab098d46ecc8219f383a4996c2dc193ffa753ac012c81d5e9c92`,
matching GitHub's artifact digest. The ZIP contains one sanitized JSON receipt,
not PDF bytes or credentials.

## Checked receipt

The receipt binds to trigger commit `2303df0c9e8d6f72561ec0ce42514663801229d8`,
reports `pass:true`, `exactBytes:25000000`, `invocationCount:10`, Workers
Free / isolated non-production and `paidCpuEntitlementAttestedAbsent:true`.
The safe bodyless marker passed on round one, Observability query attempt
three: required HTTP 409, two attributed markers, complete HTTP-200 query
pages, no discovery failures, `readiness:"ready"`.

Ten synthetic exact-25,000,000-byte PDF flows each returned HTTP 200,
`success:true` and `finalized:true`. There are **ten distinct PDF SHA-256
values**, and every flow's SHA-256 is present in the receipt's ten-hash set.
The final two-surface evaluation reports `pass:true`, exact evidence count
and ten unique Durable Object identities.

| Surface                | Exact deployed version                 | Valid correlated readings |  CPU range | Workers Free budget |
| ---------------------- | -------------------------------------- | ------------------------: | ---------: | ------------------: |
| Static Assets ingress  | `9df36047-3641-435d-843f-b21d8bf03343` |                     10/10 |     0–2 ms |              ≤10 ms |
| Private Durable Object | `1250ac8d-ac04-4d3a-a402-5b34092acafc` |                     10/10 | 274–360 ms |          ≤30,000 ms |

All twenty measurements have `valid:true` and match their respective exact
deployed versions. Both per-surface evaluations report `pass:true` and no
failure. This is provider-native CPU evidence for the **ten distinct PDF
inputs** that were missing in the earlier repeated-byte campaign. It does
not retroactively make that earlier campaign compliant.

## Boundary and next action

The one-campaign authorization is consumed. No further provider rerun is
needed or authorized by this result. Bind this receipt to an exact repository
head, require 5/5 CI including clean checkout, then enter `REVIEW_PENDING`
and perform a complete fresh adversarial Pass B against all seven WP-2.9C
responsibilities. Only a clean Pass B may close AR-006/AR-009 and permit the
separate Pass C. WP-2.9A remains `BLOCKED` until WP-2.9C is `ACCEPTED`.
