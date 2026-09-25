# WP-2.9C / AR-006 — 2026-09-25 ADR 0012 exact-size attempt 1

Status: **FAILED-CONTAINED BEFORE EXACT-SIZE MUTATION — NOT CPU ACCEPTANCE EVIDENCE**

## Trigger and repository gates

- Gate-enablement head: `f913940d7d1c777a75448eebe2231844bf8be875`.
- Gate-enablement CI: `36075138372` — five ordinary jobs SUCCESS including clean checkout; provider job SKIPPED.
- Same-tree trigger: `6bdf445e7f56e38caa0d807232bcfde573103117`.
- Shared tree: `4b1fcd517233dd6fe634aef66b821bb7b9e8e8d3`.
- Trigger CI: `36075800700` — five ordinary jobs SUCCESS before provider work.
- Provider job: `107888370576`.

## Provider work completed

The bounded job successfully completed the isolated-environment guard, exact
private Durable Object host deploy/version capture, sanitized Worker receipt,
direct binding/Worker-secret metadata/synthetic-authority re-verification,
exact Pages preview deployment/resolution, sanitized Pages receipt and
deny-oriented Pages Function smoke.

Retained sanitized receipts:

- Worker artifact `10840143400`, SHA-256
  `6984fd951dd08a4e6e2dfa872761aba47aef9cbda4979998a4d9b051ac861136`;
- Pages artifact `10839433516`, SHA-256
  `7df62a730ed7b6a548f3298b5cdd07efeaa4b27777652d623db5a29f5b196f53`.

## Failure and containment

The authenticated random-unreserved-document route probe then failed with the
sanitized message:

`ADR 0012 route preflight did not reach the lifecycle DO.`

The ten exact-`25,000,000`-byte flow step was **SKIPPED**. No evidence PDF was
reserved, staged, promoted or finalized and no CPU verdict can be inferred.

The final evidence artifact step also found no canonical evidence JSON because
the standalone route probe failed before the main evidence harness started.
That is a receipt-integrity defect in the harness and must be fixed before any
new exact-size campaign.

## Permitted continuation

No automatic campaign rerun is authorized. Repository-only remediation may add
bounded 404/503 lifecycle readiness while still requiring final HTTP 409 +
generic JSON unavailable semantics, fail immediately on authorization-shaped or
other unexpected statuses, reuse the same helper for marker preflight, and
write a canonical sanitized pass-false pre-mutation receipt.

After exact-head CI + clean checkout and fresh targeted review, one read-only
recheck of the already-created exact `6bdf...` deployment may test readiness
without deploy, PATCH, reservation, upload, promotion or finalization.
