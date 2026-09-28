# WP-2.9A — accepted-C reintegration and Pass-A reverification

Status: **IN_PROGRESS / A-IMPLEMENT — integration evidence candidate; correction/record exact-head CI pending**.

WP-2.9C is `ACCEPTED / COMPLETE` after its separate Pass C and acceptance-record
`21accd7f9ab1b845275507b7941a782c5e816a56` / CI `36494697647`
**5/5 SUCCESS**, including clean checkout. This resolves A's recorded blocker,
but does not close its AR-004/005 or accept FTR-089. Transition `c8f3dfd441e7ad583613c8b94bd9197b19b829fb`
records A as `IN_PROGRESS`; its exact-head CI `36495622949` passed
**5/5 SUCCESS**, including clean checkout. This documentation correction and
integration record require their own exact-head CI before A can enter review.

## Reintegrated boundaries

| A responsibility | Current implementation and independent guard | Verification to retain |
| --- | --- | --- |
| PDF/metadata validation | `venue-private-document.ts` rejects C0/C1 controls, unsafe filename/path characters, wrong extension/MIME/signature and out-of-bound bytes. The original Document migration enforces the corresponding PostgreSQL scalar/shape rules. | C1 RED-first TypeScript/pgTAP parity, domain and read-parser tests. |
| Private upload and ready truth | `PrivateDocumentService` reserves pending metadata, uses only `TrustedPrivateDocumentIngestPort`, then separately finalizes. The Supabase adapter stages exact bytes in `document-ingest-staging` and calls bodyless `/api/private-document-promote` with the current session token. The accepted C ingress/DO validates actual bytes and reservation before service-only attestation. `documents` cannot become ready without matching attestation and canonical object presence. | Service/adapter tests; direct Storage INSERT and attestation-denial pgTAP; local promotion and isolated ten-distinct-PDF exact-size provider proof. |
| Live authority and isolation | The protected RPC checks current `documents.write`; RLS-bound reads and Storage SELECT require `documents.read` for active-ready or `documents.write` for recovery. The trusted ingress rechecks current user, project, reservation and permissions before mutation. A path or hash alone grants no access. | Owner/editor/viewer/anon/outsider/project-B/revoked and direct API/Storage allow+deny suites. |
| Recovery and immutable identity | Pending remains invisible as ready; trusted abandon cleans staging and canonical bytes, proves absence and preserves retry safety. Ready bytes have no ordinary UPDATE/upsert/rename policy. Soft-delete/restore keeps the same record/object/link identity and uses optimistic revision checks. | SQL acceptance/security/cleanup/restore suites, service retry/replay tests, local promotion race/compensation tests. |
| Venue links and provenance | `document_links` is Venue-only for this Lot and binds both ends to one project; optional Source must share the project. The read adapter filters active-ready records and exact DB-bound opaque paths without duplicating binary bytes. | SQL same-project/foreign-link tests and read/list/download adapter tests. |
| Accepted Media preservation | The accepted Media policy branch remains intact. A current-contract mismatch was found in `STORAGE-RLS.md`: it still described the WP-1.9 UPDATE policy that WP-2.8B removed. The documentation now states the implemented three-policy surface and immutable-object rule. | `venue_private_documents_security_test.sql` asserts no UPDATE policy and direct Document INSERT denial; accepted WP-2.8 regression gates remain in full CI. |

No A production code or database migration changed during this reintegration.
The earlier WP29A-AR-001/002/003 closures remain historical evidence. AR-004
and AR-005 stay **MAJOR / OPEN IN A** until a new complete adversarial Pass B
reconstructs A's full product/security responsibility after this integration
seal. A may enter `REVIEW_PENDING` only after the correction/record HEAD passes
all five ordinary CI jobs, including clean checkout. WP-2.9B remains planned
after accepted A; this record makes no production deployment claim.
