# WP-2.9C / AR-009 — distinct-PDF provider evidence remediation

State: **IMPLEMENTED LOCALLY / EXACT-HEAD CI AND ADVERSARIAL REVIEW PENDING**

Source finding: `WP-2.9C-FRESH-PASS-B-2026-09-28.md` (MAJOR).

The prior ADR 0013 campaign `da19c6c` / artifact `10940276677` measured both
Workers Free CPU surfaces successfully, but its ten documents shared one PDF
content hash. It does not satisfy the accepted ADR's ten-distinct-PDF
condition. This remediation changes only the isolated synthetic evidence
generator, flow, sanitized record and fail-closed verdict. Production ingress,
private Durable Object, authorization, Supabase schema and secrets are
unchanged.

RED-first controls reproduced the defect locally:

- ten `createExactPdf(25_000_000, index)` calls yielded **one** SHA-256, not ten;
- the campaign verdict returned true for duplicate hashes;
- it also returned true when a recorded flow size was `24,999,999` bytes.

The implementation now varies a bounded PDF comment marker per flow while
keeping valid `%PDF-` framing, exact 25,000,000-byte length and xref offsets.
Each flow derives its own SHA-256, reserves/stages its own bytes, and records
its own hash and byte length. The sanitized artifact includes the per-flow
hashes, never PDF bytes. The verdict requires ten valid, distinct lowercase
SHA-256 values and exact per-flow sizes in addition to prior ten successful
finalizations and complete two-surface provider observations.

Local focused tests pass 11/11, including ten actual exact-size generated PDF
hashes; Node TypeScript check passes. Next: complete static/security/format
verification and exact-head CI from a clean checkout, then fresh adversarial
review of this harness. Only a green reviewed handoff can explicitly authorize
one replacement isolated ten-flow provider campaign. No campaign is
authorized by implementation alone.
