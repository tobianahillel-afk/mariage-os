# WP-2.9C — Pass C acceptance reconciliation

Status: **PASS — packet responsibility gap ∅; final acceptance-governance CI
pending**.

This is the separate `EXPECTED ↔ IMPLEMENTED ↔ VERIFIED` reconciliation for
`WP-2.9C — Trusted private-document ingestion hardening`. Entry state was
`ACCEPTANCE_PENDING`, current pass `C-ACCEPTANCE`, after the complete fresh
[Pass B](WP-2.9C-FRESH-PASS-B-DISTINCT-PDF-2026-09-28.md) passed with no
unresolved BLOCKING, MAJOR or MINOR finding. It does not accept parent
WP-2.9A or the whole FTR-089 feature.

## Gate evidence

- Pass-A remediation and Free-tier normative reconciliation:
  `d3dad1623f0a878b43637200db31e7cf909f9869` / CI `36463139444` —
  **5/5 SUCCESS**, clean checkout included.
- REVIEW_PENDING entry: `44fc3e14bdc55dc6ab0b3613a82a9eea7daa6293` /
  CI `36464200682` — **5/5 SUCCESS**, clean checkout included.
- Full fresh Pass-B record and `ACCEPTANCE_PENDING` entry:
  `66b9396fc06b540a0a51a1fa948933c170728d65` / CI `36465390803` —
  **5/5 SUCCESS**, clean checkout included.
- Isolated Workers Free provider campaign: same-tree trigger
  `2303df0c9e8d6f72561ec0ce42514663801229d8` / CI `36459949861`,
  isolated job `109058754517`, artifact `10987866873`, digest
  `6ec13fbc69d7ab098d46ecc8219f383a4996c2dc193ffa753ac012c81d5e9c92`.
  The independently checked sanitized receipt passes ten distinct exact-size
  PDFs, ten ready finalizations and both exact-version CPU surfaces on Free.
- FIR [#17](https://github.com/tobianahillel-afk/mariage-os/issues/17) now
  records current C state, exact evidence, security/behavior/scope and the
  parent A dependency. Historical Pages/ADR 0010 wording is enclosed as an
  expressly superseded snapshot.

## Expected, implemented and verified

| Assigned responsibility | EXPECTED | IMPLEMENTED | VERIFIED | Result |
| --- | --- | --- | --- | --- |
| C1 TypeScript/PostgreSQL parity | Reject C1 controls and unsafe filename/text scalars consistently before reservation | Document-domain scalar validators and PostgreSQL `documents` constraints/RPC validation | C1 RED-first parity tests, domain tests and pgTAP in clean CI | PASS |
| Trusted actual-byte PDF integrity | Browser claims never authorize ready bytes; stored size/MIME/signature/hash and exact reservation control attestation | Bounded staging download, authoritative Storage metadata, `%PDF-` and SHA-256 checks, pre-copy reservation recheck, canonical revalidation and service-only attestation | Malformed/poisoned/cross-project/replay runtime and SQL tests, exact 25 MB local flow | PASS |
| Bounded staging and recovery | Pending uploads remain private, bounded and recoverable; abandon cannot leave trusted orphans or race promotion | Private PDF-only 25,000,000-byte staging INSERT, no ordinary staging DELETE/READ; same-route trusted abandon, DO serial gate, DB delete backstop, exact absence proof, copy compensation | Staging/RLS/DB tests; interrupted, retry, abandon/race and canonical recovery tests in CI | PASS |
| Live authorization | Every privileged transition requires current user, project permission and matching pending document; no stale bearer or admin-key shortcut | Same-origin/bodyless ingress checks; current Supabase user, live `documents.write`, RLS-visible reservation and repeated checks before mutation; independent finalize RPC | Anonymous/viewer/outsider/project-B/revoked/downgraded/foreign-origin/invalid-frame denial tests | PASS |
| Provider runtime and CI | Ten distinct exact-size synthetic PDFs finalize on Workers Free with attributable per-invocation CPU under both surface budgets | Workers Static Assets ingress + private SQLite-backed per-document DO, native structured logs, exact-version two-surface collector and fail-closed evaluator | Digest-matched provider artifact: 10/10 finalized, 10 unique hashes and DO IDs; ingress 0–2/10 ms, DO 274–360/30,000 ms; CI 5/5 | PASS |
| Operational/deployment boundary | Exact candidate deploys host before ingress, with correct binding, private-only secret, unknown-API fail-closed behavior and safe smoke | ADR 0013, CI-CD/release/Free-tier/secret contracts, Worker-first config and production smoke; superseded Pages route barred from production | AR-008 RED-first contract tests, static/security gates, provider binding/deny/static preflight and reviewed release contract | PASS |
| Preserve A and Media | C adds only trusted ingestion hardening; pending-to-ready, Media and later document responsibilities retain ownership | No Media mutation or new permission; finalization stays separate; no versions/readiness/UI/offline expansion | Parent A and accepted WP-2.8 regression suites in exact-head CI; source-delta review | PASS |

## Security, scope and FIR reconciliation

- FTR-089's Lot-2 product owner remains WP-2.9A. C contributes to MED-003,
  MED-009 safety, MED-010 privacy, ACC-055 incomplete-upload and ACC-058 opaque
  path controls; A must still prove its complete Venue document foundation and
  parent AR-004/005 after C acceptance. Feature Ledger `FTR-089 BLOCKED` is
  therefore accurate until A's own Pass C.
- Ordinary browser roles cannot mutate canonical bytes or read/delete staging;
  the privileged key is isolated on the non-public DO host. Production route
  smoke and rollback rules fail closed. Provider artifact has no PDF bytes,
  credential or private wedding data.
- ADR 0011 stateless CPU failure remains historical adverse evidence and is
  not reclassified as a pass. The compliant ADR 0013 campaign is isolated,
  non-production and uses no Paid entitlement or lower file-size contract.
- Current full Pass B closes WP29C-AR-001..009 for this packet. Open C
  BLOCKING = **∅**; MAJOR = **∅**; MINOR carried into acceptance = **∅**.
- Static/architecture, typecheck, security, unit, browser/mutation, local
  Supabase DB/RLS/promotion, privacy-safe build and full clean-checkout gates
  are green on the entry head. No unexplained C responsibility, unreviewed
  provider change, TODO, new secret or product scope remains.

```text
required WP-2.9C responsibilities
- implemented WP-2.9C responsibilities
- verified WP-2.9C responsibilities
= ∅
```

Pass C therefore finds WP-2.9C eligible for `ACCEPTED / COMPLETE`, subject to
the final acceptance-governance HEAD itself passing five ordinary exact-head
CI jobs including the clean checkout. Only then may WP-2.9A leave `BLOCKED`
for integration/reverification and its own fresh Pass B/Pass C. WP-2.9B
remains planned after accepted A; Lot 2 and FTR-089 are not accepted here.
