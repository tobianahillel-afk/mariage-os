# WP-2.9C ADR 0013 — deployed Workers Free exact-size CPU result

Status: **CPU FEASIBILITY OBSERVED / AR-009 DISTINCT-PDF ACCEPTANCE DEFECT FOUND IN LATER PASS B**

The 2026-09-28 fresh full Pass B found that the ten flows reused one PDF
byte sequence despite ADR 0013's requirement for ten distinct synthetic PDFs.
The provider CPU measurements below are genuine for the repeated-byte sample,
but this artifact does **not** satisfy that complete acceptance condition.
See `WP-2.9C-FRESH-PASS-B-2026-09-28.md`; the historical conclusion at the end
of this record is superseded for formal AR-006 closure.

The empty-log review/status seal `890f5bc942974d874a2b2cbd604f683412bf488b`
passed ordinary CI `36343323166` **5/5**, including full verification from a
clean checkout. Its one authorized same-tree trigger
`da19c6cbe339f060955cf2b852e4cfeb1c576023` ran CI `36343818988`.
All five ordinary jobs passed, and provider job `108690065987` completed
**SUCCESS** on the isolated non-production Workers Free environment.

Sanitized artifact `10940276677` has ZIP SHA-256
`d94f668d2b04329720555a9b144b89be61b5c5347c137b0430dc24680e9c2aa3`.
The artifact's exact `gitCommit` is the trigger above, `pass: true`,
`exactBytes: 25000000`, `invocationCount: 10`,
`paidCpuEntitlementAttestedAbsent: true` and
`workersPlanAttestation: "Workers Free / isolated non-production"`.
The generated synthetic PDF SHA-256 was
`c0f2175bac5d6ac464a1e25948854f9bc627eceb51d7049143db41424fa823fb`.
The harness staged that same generated PDF byte sequence at ten distinct
document Storage paths; the ten document IDs, evidence UUIDs and Durable Object
identities are distinct, while PDF content hashes are the same.
No real wedding document or credential is included.

| Evidence | Observed |
| --- | --- |
| Safe marker | attempt 3, round 1; HTTP 409; two markers, no failures; both query pages complete |
| Exact-size flows | 10 distinct synthetic document/evidence IDs; all HTTP 200, `success: true`, `finalized: true` |
| Ingress identity | `mariage-os-ar006-ingress` deployment `b8350014-a933-40e7-af69-8a51f210ef82`, version `b0d82906-cf10-4a45-9c12-85acda18a52d` |
| Ingress provider CPU | 10 exact-version request-correlated `stateless`/`fetch`/`ok`/HTTP 200 measurements, **0–3 ms**, each within the **10 ms** Workers Free budget; zero failures |
| Durable Object identity | private host deployment `74584ea0-1aff-492d-aa54-bf4e701072a5`, version `15419161-360c-435a-9b14-34c0a2691525` |
| Durable Object provider CPU | 10 exact-version request-correlated `durableObject`/`fetch`/`ok`/HTTP 200 measurements, **142–329 ms**, each within the **30,000 ms** budget; 10 distinct non-null Durable Object IDs; zero failures |
| Final collection | attempt 3; ingress and Durable Object queries each HTTP 200/API success, complete pages with 20 events each; two-surface evaluator `pass: true` |

The provider rows are per-invocation `$workers.cpuTimeMs` in milliseconds, not
wall time or dashboard aggregates. The result satisfies the deployed Free CPU
feasibility evidence required by ADR 0010/0012/0013 for this controlled
exact-`25,000,000`-byte synthetic campaign. It does not prove a production
uptime/SLA or authorize a paid entitlement.

`WP29C-AR-006` may be **implementation-evidenced**, but formal finding closure
and WP-2.9C acceptance still require an evidence-bound exact-head CI/clean
checkout, a complete fresh Pass B over AR-001..007 and a separate Pass C.
WP-2.9A remains blocked until C is ACCEPTED; WP-2.9B remains after A. No
second provider campaign is needed or authorized by this green result.
