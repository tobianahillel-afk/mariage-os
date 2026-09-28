# WP-2.9A — fresh full Pass B after accepted-C reintegration

Date: 2026-09-29

Review target: `30922eb6f348369022edb2a8d1d4cb948757fe29` / CI
`36497398006` (five ordinary jobs, including full verification from a clean
checkout). The prerequisite reintegration and Storage-RLS correction
`19d26c825bba19f5a826a6b820b6d4b027e44399` / CI `36496447413`
passed 5/5. WP-2.9C's own Pass B/C and provider proof remain separate accepted
evidence; they do not automatically close A's findings.

## Method and verdict

**PASS — no unresolved BLOCKING, MAJOR or MINOR finding in A's bounded
responsibility.** I independently reconstructed the required Venue-document
foundation from WP-2.9A, FTR-089's Lot-2 slice, MED-001/002/003/008/010,
PRD-008, DOCUMENTS, FILE-SECURITY, STORAGE-RLS, the accepted-C trust boundary,
and the three-pass protocol. I then challenged source, forward-only migrations,
negative tests and exact-head CI for both historical AR-004/005 and the complete
A behavior. Earlier Pass-A and C conclusions were leads to test, not the
review verdict.

## Full product and security challenge

| Assigned A responsibility | Adversarial check and evidence | Verdict |
| --- | --- | --- |
| Private PDF metadata and validation | The domain validates .pdf extension, exact MIME, `%PDF-` signature, 1..25,000,000 bytes, Unicode-scalar filename/text bounds, unsafe path/control characters and lowercase SHA-256. The `documents` migration independently constrains those values and canonical opaque path. C1 and Unicode parity tests exercise service, provider parser and PostgreSQL. | PASS |
| Reserve, actual-byte ingest and ready truth | `PrivateDocumentService` reserves pending state, sends the exact bytes through the trusted ingest port and finalizes separately. Browser staging permits only exact pending-path INSERT; it grants no direct canonical Document INSERT. The accepted private ingress checks live authority, reservation, stored MIME/size, bounded downloaded bytes, PDF signature and SHA-256; repeats checks before copy; verifies canonical bytes before service-only attestation. The database trigger denies pending→ready without matching attestation. The old same-size PDF-substitution route is therefore closed. | PASS |
| Live authority, private reads and download | RLS and protected commands use current `documents.read/write`, exact project/document binding and same-project Source/Venue FKs. Read adapter and service reject malformed, foreign, pending/deleted or non-canonical provider rows; download uses the DB-bound path and safe attachment disposition. Direct API/Storage and runtime tests cover owner/editor/viewer as applicable, anonymous, outsider, project B and revoked/downgraded users. Path/hash knowledge gives no authority. | PASS |
| Recovery, retries and immutability | Pending is not ready truth. Trusted abandon removes and proves absence in both staging and canonical buckets before metadata deletion; the DB trigger rejects deletion while either object exists. Per-document serialization, rechecks and copy compensation cover promotion/abandon races. Ready objects have no authenticated UPDATE/rename/upsert or DELETE path. Replay, conflict, soft-delete and restore retain logical identity and use the recorded optimistic revision rules. | PASS |
| Venue links and provenance | `document_links` permits only same-project Venue targets and lets several Venues reference one logical Document without duplicating bytes. Optional Source has a same-project composite FK; read queries filter active-ready documents and validate returned link/row identities. Cross-project and replay/stale cases have direct SQL and adapter tests. | PASS |
| Accepted Media preservation and product scope | The three current private-bucket policies retain accepted Media access while denying direct Document INSERT. The obsolete WP-1.9 UPDATE description was corrected before review and its exact-head CI passed. No A UI, version lineage, contract review, offline queue or provider campaign is claimed. Those belong to later packets/lots. | PASS |

## Historical finding disposition

| A finding | Fresh Pass-B result |
| --- | --- |
| WP29A-AR-001 | CLOSED / VERIFIED — typed list/read/download application and provider boundaries remain in place. |
| WP29A-AR-002 | CLOSED / VERIFIED — filename scalar-count parity remains tested. |
| WP29A-AR-003 | CLOSED / VERIFIED — shared bounded Unicode text and receipt/read parser parity remains tested. |
| WP29A-AR-004 | CLOSED / VERIFIED — canonical TypeScript validator rejects U+0080..U+009F as PostgreSQL does; focused service/parser/pgTAP parity evidence is green. |
| WP29A-AR-005 | CLOSED / VERIFIED — actual staged/canonical bytes and reservation digest are checked by trusted ingress; direct client canonical INSERT and forged attestation are denied, and ready transition requires attestation. |

The feature-wide exact-duplicate warning/selection flow in DOCUMENTS is not
presented as complete by this packet. A stores project-scoped SHA-256 metadata
and an index, but WP-2.9A has no user interface; the later document
presentation responsibility in WP-2.11 must expose the duplicate signal
without leaking cross-project equality or auto-merging logical records.
FTR-089 therefore remains `IN_PROGRESS` after this packet's later acceptance.

This review has no new MINOR, MAJOR or BLOCKING finding. The accepted isolated
provider campaign is sufficient for the C boundary and is not rerun here.
WP-2.9A may transition `REVIEW_PENDING -> ACCEPTANCE_PENDING` after this
review record/status commit passes exact-head CI. Pass C must separately
reconcile each assigned A responsibility, FIR #17, test evidence and the
WP-2.9B dependency before A can be accepted.
