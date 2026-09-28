# WP-2.9C / AR-009 — targeted distinct-PDF harness review

Date: 2026-09-28  
Implementation head: `8f04bba3bcb92e9045800e954aca31d816a84943`  
CI: `36398524127` — **5/5 SUCCESS**, including `Full verify from clean checkout`.

This is a fresh targeted adversarial review of AR-009, not the complete
WP-2.9C Pass B. I re-read ADR 0013's ten-distinct-exact-size-PDF and
two-surface CPU acceptance gates and the latest failed packet Pass B before
checking the implementation, rather than adopting the implementation's
conclusion.

## Verdict

**PASS for the AR-009 harness remediation scope; no BLOCKING or MAJOR
finding.** The prior repeated-byte provider artifact remains limited to its
actual sample and is not accepted as ten-distinct-PDF evidence.

The generator produces ten separate 25,000,000-byte `%PDF-` buffers with
distinct SHA-256 values. Its per-flow variant changes only a bounded PDF
comment marker, preserving the byte count and computed xref offsets. The
promotion flow derives the reservation hash from the same buffer later sent
to Storage; the test captures both boundaries and matches their hashes and
sizes to the sanitized invocation receipt. The verdict rejects duplicate or
missing hashes, wrong size, unsuccessful HTTP responses, unfinalized flows,
incomplete marker preflight and failed two-surface provider evaluation. The
evidence record retains IDs, hashes, sizes and provider summaries without PDF
bytes or credentials.

The first implementation CI `36397976054` failed application TypeScript
checks. Its correction at `8f04bba` passes both application and Node
typechecks, targeted tests **11/11**, architecture, lint, format, secret
guard and the full CI above. The production ingress and private Durable
Object runtime are unchanged. No new credential, Workers Paid entitlement,
smaller file, aggregate CPU substitute or new acceptance criterion is used.

## Bounded authorization and next gate

This targeted PASS authorizes **one** new isolated
`[AR006-INGRESS-EVIDENCE]` ten-flow campaign only after the commit that
seals this review and current status passes all five ordinary exact-head CI
jobs, including clean checkout. Use a no-content, same-tree trigger. The job
must run its reviewed marker/route readiness preflight before any document
mutation and attribute each ingress and Durable Object invocation to its
exact deployed script version. It must retain sanitized evidence of ten
byte-distinct PDFs, ten successful finalizations and ten provider CPU
readings on each surface within the Workers Free limits.

If that campaign fails or evidence is incomplete, do not repeat it
automatically. Record the result and return to review. WP-2.9C remains
`IN_PROGRESS`; WP-2.9A remains `BLOCKED`. Only a later complete clean Pass B
and Pass C can accept WP-2.9C and unblock A.
