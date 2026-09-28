# WP-2.9C — fresh full Pass B after distinct-PDF provider proof

Date: 2026-09-28

Review target: `44fc3e14bdc55dc6ab0b3613a82a9eea7daa6293` / CI
`36464200682` (five ordinary jobs, including full verification from a clean
checkout). Provider target: same-tree trigger
`2303df0c9e8d6f72561ec0ce42514663801229d8` / CI `36459949861`,
isolated job `109058754517`, artifact `10987866873`, ZIP SHA-256
`6ec13fbc69d7ab098d46ecc8219f383a4996c2dc193ffa753ac012c81d5e9c92`.

## Review method and verdict

**PASS — no unresolved BLOCKING or MAJOR finding.** I reconstructed the seven
assigned responsibilities from WP-2.9C, ADR 0009/0010/0012/0013, the
file-security, secret, Free-tier, CI and release contracts. I compared them
with current source, migrations, negative/runtime tests, the exact-head CI and
the independently read, digest-matched sanitized provider receipt. The
previous full Pass B and targeted reviews were treated as findings to
challenge, not as a substitute for this pass.

The older `da19c6c` provider campaign remains a repeated-byte feasibility
sample. Only the later `2303df0` campaign is considered for the ADR 0013
ten-distinct-PDF criterion. This review does not claim a production rollout;
the production release gate remains separate.

## Seven packet responsibilities

1. **C1 parity.** The document-domain scalar validator rejects U+0000..001F
   and U+007F..009F, isolated surrogates and overlong text. The PostgreSQL
   document constraints reject controls and enforce filename/text bounds.
   Domain and database parity tests pass in the clean CI.
2. **Actual-byte integrity.** The trusted executor derives the exact
   project/document path; checks pending/private reservation, authoritative
   Storage MIME/size, bounded downloaded size, `%PDF-` signature and the
   SHA-256 of downloaded bytes; rechecks the reservation before canonical
   copy; verifies canonical bytes before service attestation. The browser's
   declared hash alone cannot create ready truth. Negative poisoned/cross-
   project/replay cases remain green.
3. **Bounded staging, recovery and cleanup.** The staging bucket is private,
   PDF-only and capped at 25,000,000 bytes; ordinary clients get a narrow
   pending-path INSERT but no staging read/update/delete. The same ingress
   routes trusted POST and DELETE to one per-document Durable Object serial
   gate. Abandon proves staging and allowed pending canonical absence before
   metadata removal, with a database backstop. Repeated copy is validated,
   and post-copy failures compensate only bytes created by that request.
   Interrupted/retry/race coverage and SQL tests pass.
4. **Live authorization.** The ingress rejects foreign origin, unsupported
   method, framed body, malformed target and missing bearer before forwarding.
   The private host verifies the current Supabase user and live
   `documents.write`, reads the exact RLS-visible reservation, and repeats
   permission/state checks before privileged mutation. Finalization is a
   separately authorized RPC; neither an admin secret nor a stale browser
   claim grants document access.
5. **Runtime and CI evidence.** The digest-matched receipt has ten distinct
   PDF SHA-256 values, each exactly 25,000,000 bytes, ten HTTP-200 successful
   promotions and ten independently verified ready finalizations. It reports
   10/10 exact-version stateless ingress measurements at 0–2 ms against
   10 ms and 10/10 exact-version Durable Object measurements at 274–360 ms
   against 30,000 ms, ten distinct DO IDs, complete provider pages and no
   Paid entitlement. The evaluator rejects missing/duplicate markers,
   ambiguous request identity, wrong version/model/status/outcome, missing
   CPU, truncation, excess CPU or incomplete counts. CI `36464200682` is
   5/5 green, clean checkout included.
6. **Operations and deployment.** ADR 0013 and the corrected CI, release,
   secret and Free-tier contracts now require Worker-first `/api/*` Static
   Assets ingress plus a private, non-public DO host; the encrypted admin key
   exists only on the host. Unknown API paths fail closed, and production
   deployment requires exact-candidate host-before-ingress binding, deny and
   static smoke and absence of the legacy Supabase and superseded Pages route.
   The earlier repeated-byte artifact is expressly marked historical.
7. **Preservation.** The trusted route is confined to Document lifecycle;
   it adds no Media mutation or new permission key. Pending-to-ready remains
   independent of promotion, and the existing WP-2.8 Media and parent
   WP-2.9A authorization/visibility tests remain green. No wedding data or
   PDF bytes are retained in the provider artifact.

## Historical finding disposition

| Finding | Pass-B disposition |
| --- | --- |
| WP29C-AR-001 | CLOSED / VERIFIED — bodyless ingress and open-ended frame rejection. |
| WP29C-AR-002 | CLOSED / VERIFIED — bounded, exact-byte canonical recovery. |
| WP29C-AR-003 | CLOSED / VERIFIED — authoritative stored MIME/size. |
| WP29C-AR-004 | CLOSED / VERIFIED — same-origin boundary, no wildcard CORS. |
| WP29C-AR-005 | CLOSED / VERIFIED — trusted clean abandon, race recheck, compensation and DB backstop. |
| WP29C-AR-006 | CLOSED / VERIFIED — ten distinct exact-size PDFs and exact-version, per-invocation provider CPU on both Workers Free surfaces. |
| WP29C-AR-007/008 | CLOSED / VERIFIED — current ADR 0013 production route, secret and release contracts plus regression controls. |
| WP29C-AR-009 | CLOSED / VERIFIED — distinct generated/staged hashes and fail-closed verdict in the new provider campaign. |

There is no new MINOR, MAJOR or BLOCKING finding. The validated provider
campaign's one-shot authorization is consumed; no rerun is needed or
authorized by this review.

Per the packet protocol, the next state is `ACCEPTANCE_PENDING`. Pass C must
separately reconcile expected/implemented/verified responsibility, FIR state,
CI, documentation and the parent A dependency before C can be `ACCEPTED`.
WP-2.9A remains `BLOCKED` until that acceptance.
