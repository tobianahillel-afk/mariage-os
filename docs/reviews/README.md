# Mariage OS — Review Reports

This directory contains versioned evidence from architecture/product/UX/integration reviews. A review result that exists only in chat or a transient PR comment is not durable project governance.

## Required reports

Before implementation:
- `FINAL-DESIGN-REVIEW.md` in `docs/` — final pre-code product/architecture/UX/security review.

During implementation:
- `CHECKPOINT-A-REPORT.md` after Lots 0–3;
- `CHECKPOINT-B-REPORT.md` after Lots 4–7;
- `CHECKPOINT-C-REPORT.md` after Lots 8–10;
- `CHECKPOINT-D-REPORT.md` after Lots 11–12 / cutover.

Additional focused reviews may be created when valuable, for example:
- `UX-VENUES-REVIEW.md`;
- `SECURITY-RLS-REVIEW.md`;
- `IMPORT-ENGINE-REVIEW.md`;
- `REAL-DEVICE-REVIEW.md`.

## Finding ID

Use stable IDs:

`<review>-NNN`

Examples:
- `FDR-001`
- `CHK-A-004`
- `UX-VEN-003`

## Severity

- `BLOCKING` — unsafe/fundamentally incompatible; gate closed.
- `MAJOR` — material product/UX/architecture/security deficiency; must resolve before PASS.
- `MINOR` — real issue, may be accepted only with explicit owner/follow-up when the governing gate allows it.
- `NOTE` — observation/no mandatory remediation.

## Finding format

```text
ID: CHK-A-004
Severity: MAJOR
Area: UX / Architecture / Security / Data / Offline / Testing / Docs
Status: OPEN / RESOLVED / ACCEPTED_MINOR
Affected Feature IDs: FTR-...
Affected requirements: ...
Problem:
Why it matters:
Required correction:
Resolution evidence:
Verified by:
```

## Review report minimum structure

1. scope and commit SHA;
2. documents/build reviewed;
3. overall result;
4. dimension-by-dimension results;
5. open/resolved findings;
6. feature-ledger reconciliation;
7. lot/checkpoint status;
8. screenshots/test/security evidence as applicable;
9. explicit next permitted action.

## Gate rule

A report may state `PASS` only when no unresolved `BLOCKING` or `MAJOR` finding remains in its governed scope.

Never rewrite history by deleting resolved findings. Keep findings and their resolution evidence so future regressions can be compared against earlier decisions.
