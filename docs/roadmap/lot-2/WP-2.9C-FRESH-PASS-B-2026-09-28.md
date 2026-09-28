# WP-2.9C — fresh full Pass B after AR-008 remediation

Date: 2026-09-28

Target: `a94a7b9` / CI `36395904397` (**5/5 SUCCESS**, clean checkout
included) and provider artifact `10940276677`.
The review reconstructs the seven assigned responsibilities from WP-2.9C,
ADR 0009/0010/0012/0013 and the file-security/release contracts. Prior Pass A
and targeted reviews are challenged rather than adopted as conclusions.

## Verdict

**REVIEW_FAILED — new MAJOR `WP29C-AR-009`.** The Workers Free CPU readings
remain genuine evidence for the ten measured invocations, but the campaign
does not meet the full ADR 0013 input-diversity condition. C cannot enter
`ACCEPTANCE_PENDING`; A remains `BLOCKED` and B remains after A.

## WP29C-AR-009 — MAJOR — ten document identities reused one PDF byte sequence

ADR 0013 explicitly requires ten distinct synthetic exact-25,000,000-byte
PDFs. The evidence harness constructs `createExactPdf(MAX_BYTES)` once before
the loop, stores one `context.bytes`/`context.sha256`, and stages that same
buffer for ten distinct document IDs and Durable Object IDs. The sanitized
artifact has one generated PDF SHA-256
`c0f2175bac5d6ac464a1e25948854f9bc627eceb51d7049143db41424fa823fb`.
The evidence-bound repository result now states this limitation openly.

Distinct Storage paths, evidence UUIDs and DO identities satisfy the identity
part of the contract, but do not establish ten byte-distinct PDFs. Treating
them as equivalent would silently weaken the accepted ADR after observing
the result. The existing ten ingress readings (0–3 ms) and ten DO readings
(142–329 ms) still prove CPU feasibility for the repeated-byte sample; they
cannot close the full AR-006 evidence gate.

Required remediation: generate a different valid exact-size synthetic PDF for
each flow without changing production ingress/DO semantics; reserve and stage
each flow's own SHA-256; retain ten sanitized per-flow hashes; make the
campaign evaluator fail closed on missing/duplicate hashes. Prove this RED
first, run exact-head ordinary CI and clean checkout, then conduct a fresh
adversarial harness review. A single replacement isolated ten-flow campaign
may be authorized only by that reviewed, green handoff. The prior campaign
is not retrospectively relabeled as passing this condition.

## Other responsibilities checked

1. C1 TypeScript/PostgreSQL text parity remains covered by C1 RED and SQL tests.
2. Authoritative staged MIME/size, `%PDF-` and reserved actual-byte SHA-256
   checks remain in the private-document integrity core.
3. Private bounded staging, trusted cleanup, DB orphan backstop and
   promotion/abandon serialization remain in source and regression coverage.
4. Live current-user/project/document authorization and exact reservation
   checks remain at ingress and private executor boundaries.
5. Exact deployed provider CPU evidence is present for both Workers Free
   surfaces, but the ten-distinct-PDF campaign requirement fails as above.
6. AR-008 production route/secret/release contracts are reconciled to ADR
   0013; actual production release remains a later gate.
7. Pending-to-ready finalization remains independent; no FTR-089 product UI
   or WP-2.8 Media behavior changes in this remediation.

Historical AR-001..005 and AR-007/008 are not reopened by this finding.
AR-006 stays open pending compliant provider proof and a later clean full
Pass B. No second campaign may run from this failed review alone.

State sequence: `IN_PROGRESS -> REVIEW_PENDING -> REVIEW_FAILED -> IN_PROGRESS`
as RED-first AR-009 remediation begins. The failing tests are the exact-size
generator uniqueness control (one hash instead of ten) and the verdict's
duplicate-hash rejection control (accepted duplicates). Affected verification
must be rerun.
