# Work Packet Record — WP-1.9

## Identity

- Work Packet ID: `WP-1.9`
- Lot: `1`
- Name: Storage/Realtime isolation foundation and Lot-1 security-matrix closure
- State: `REVIEW_FAILED`
- Current pass: `B-REVIEW-FAILED`
- Primary bounded context: Supabase project-scoped cloud side-channel isolation
- Branch/PR: `lot-1/identity-project-foundation`

## Scope

### Primary controls / Feature responsibilities

- `AUTHZ-013` — Storage and Realtime enforce project/permission isolation independently from UI/path knowledge.
- `AUTHZ-018` — public-readiness matrix covers multiple projects, owner/editor/viewer, outsider and revoked identities.
- Lot 1 Storage isolation responsibility from the coverage matrix.
- Lot 1 Realtime isolation/non-exposure responsibility from the coverage matrix.
- Lot 1 member-vs-guest-capability trust-boundary closure.

### Current-lot responsibilities covered

- enable the local Supabase Storage service required to verify the V1 private-object authorization foundation;
- establish one small private foundation bucket, `project-private`;
- enforce a synthetic media object path shape `<project_id>/media/<object_uuid>/<variant>` without introducing the Media business model;
- derive target project from the validated object namespace, never from hidden UI state or path knowledge alone;
- authorize Storage reads with live `media.read` and writes/deletes with live `media.write` through the existing centralized permission helper;
- deny malformed paths, anonymous/guest-capability clients, outsiders, other-project members, revoked members and roles missing the required permission;
- prove role behavior for owner/editor/viewer and a multi-project identity against projects A/B/C;
- prove exact cross-project path knowledge does not grant object access;
- keep the bucket private; do not create permanent public object URLs or browser/provider secrets;
- keep Realtime disabled in Lot 1 and prove no application project tables are published/exposed through the Supabase Realtime publication;
- confirm no client Realtime subscription surface is introduced by this packet;
- close the Lot-1 cross-boundary security matrix without implementing domain media/documents, guest RSVP APIs or provider communications.

### Governing contracts

- `docs/architecture/STORAGE.md`;
- `docs/security/AUTHORIZATION-RLS.md`;
- `docs/security/AUTHORIZATION-REQUIREMENTS.md`;
- `docs/security/RLS-MATRIX-V1.md`;
- `docs/security/RLS-PERMISSION-MAPPING.md`;
- `docs/quality/SECURITY-TESTING.md`;
- `docs/security/GUEST-COMMUNICATIONS-AUTHORIZATION.md`;
- `docs/architecture/TRUST-BOUNDARIES-GUEST-COMMUNICATIONS-ADDENDUM.md`;
- inherited `SECURITY-REQUIREMENTS.md`, `SECURITY-ARCHITECTURE.md`, `FRONTEND-SECURITY.md`, `SECRET-MANAGEMENT.md` and Lot-1 acceptance/orchestration contracts.

### Requirement / security IDs

- `IAM-003`, `IAM-005`;
- `AUTHZ-001`, `AUTHZ-002`, `AUTHZ-004`, `AUTHZ-005`, `AUTHZ-006`, `AUTHZ-007`, `AUTHZ-012`, `AUTHZ-013`, `AUTHZ-015`, `AUTHZ-017`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020`;
- `SEC-AUTHZ-001`, `SEC-AUTHZ-002`, `SEC-AUTHZ-003`, `SEC-AUTHZ-004`, `SEC-AUTHZ-007`;
- `SEC-FILE-008`, `SEC-SEC-001`, `SEC-LOC-001`, `SEC-LOC-002`, `SEC-LOC-004`;
- `SEC-VER-001`, `SEC-VER-002`, `SEC-VER-005`, `SEC-VER-006`.

### Explicit implementation choices resolved by frozen contracts

- foundation bucket ID/name: `project-private`, `public = false`;
- Lot-1 test classification: `media`, using the existing `media.read` / `media.write` permissions; no new permission key;
- path contract for this foundation slice: `<project_uuid>/media/<object_uuid>/<variant>` with UUID validation before authorization;
- object path is metadata/context only; live membership + permission remains authority;
- Storage service becomes enabled in local Supabase so policies are verifiable;
- Realtime remains `enabled = false` in `supabase/config.toml` and no application table is intentionally added to `supabase_realtime` publication;
- the existing project A/B/C synthetic identity model is reused rather than duplicated semantically;
- guest/RSVP capability has no project-member permission path and receives no private Storage policy.

### Explicitly out of scope

- `documents`, `media`, links, versions, metadata or file-lifecycle domain tables — later domain Lots;
- real binary upload/download UI or repository/service adapters;
- signed-URL product flow, derivative generation, hashing, MIME/signature validation, orphan cleanup and quota UI — later media/document implementation;
- any real wedding/customer file;
- enabling Realtime subscriptions merely to manufacture a test surface;
- domain-specific Realtime channels/refresh/sync engine;
- guest token persistence/resolution/RSVP submission — Lot 6;
- Email/SMS/WhatsApp provider SDKs, sends, credentials or webhooks;
- Storage/Realtime service-role credentials in browser/tests/public artifacts;
- any Lot 2+ product functionality.

## Dependency / sequencing

- Required prior packets WP-1.1 through WP-1.8 are **ACCEPTED**.
- This is the final planned implementation packet in Lot 1.
- Lot reconciliation, a separate Lot Integration Pass and Lot acceptance remain required after WP-1.9 acceptance.
- Lot 2+ remains forbidden until Lot 1 closes.

## Sizing review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| Storage policy / authorization boundary | 1 | 2 | 2 |
| private Storage foundation resource | 1 | 1 | 1 |
| Realtime isolation/non-exposure security boundary | 1 | 2 | 2 |
| final multi-project/adversarial security matrix | 1 | 2 | 2 |
| **Total** |  |  | **7** |

## Expected vertical slice

- configuration: local Storage enabled; Realtime remains disabled;
- migration: private `project-private` bucket plus narrowly scoped project-media path policies reusing `has_project_permission` and stable `media.read/write` permissions;
- Storage tests: direct policy allow/deny across anon/owner/editor/viewer/multi-project/outsider/revoked and projects A/B/C, including malformed/cross-project path attempts;
- Realtime tests: explicit non-exposure proof for application project tables/publication while service remains disabled;
- trust-boundary evidence: anon/guest-like clients cannot turn an RSVP capability/path into project membership or private Storage access;
- no UI/domain/client Realtime implementation.

## Expected files

- `supabase/config.toml`;
- one new migration under `supabase/migrations/` for the Storage foundation;
- direct pgTAP evidence under `supabase/tests/` for Storage isolation and Realtime non-exposure;
- this packet/status/coverage evidence only as required by the three-pass protocol.

## Pass A — IMPLEMENT

Implementation started from readiness HEAD `89c771b6b2014bde2741618cee6edc5cf54f2267`.

Implementation/evidence HEAD: `a0e719462b2ea41908e6438a72cac75f11edcf36`.

Exact-head evidence: GitHub Actions run `33996464530` completed **5/5 SUCCESS**, including Core quality/security, browser E2E + mutation, local Supabase DB/RLS, privacy-safe preview and clean-checkout `npm run verify`.

Direct DB/Storage evidence on that HEAD: **14 pgTAP files / 277 tests / PASS**; `storage_realtime_isolation_test.sql` contributes **38/38 PASS** covering the private bucket, operation policies, role matrix, A/B/C isolation, malformed/cross-project paths, revoked/outsider/anon/guest-like denial and empty public Realtime publication.

Historical test-harness correction retained for traceability: initial run `33996218749` reached 35/38 because a direct SQL DELETE was rejected by current Supabase Storage metadata protection. The repaired Pass-A evidence replaced that unsupported operation with a structural DELETE-policy assertion; fresh Pass B below found that this still did not satisfy the repository's direct allow/deny requirement for delete behavior.

Diff from readiness HEAD is limited to the packet/status records, `supabase/config.toml`, one Storage migration and one pgTAP file. No `src/`, UI, provider or client Realtime surface was introduced.

### Pass A exit criteria before review

- [x] private Storage foundation is migration-controlled and project-namespaced
- [x] policies use live centralized permissions rather than client role/path trust
- [x] anonymous/guest-like/outsider/other-project/revoked access denied directly for read/insert and applicable update paths
- [x] owner/editor/viewer/multi-project permission behavior proved across A/B/C
- [x] malformed/cross-project object namespaces fail closed
- [x] Realtime service remains disabled and no application project table is published/exposed
- [x] no Storage/Realtime secret/provider SDK leaks into UI/domain/public artifacts
- [x] no domain media/document/guest/provider scope introduced
- [x] direct DB/Storage evidence green on the covered assertions
- [x] exact-head full CI including clean-checkout `npm run verify` green before Pass B

## Pass B — ADVERSARIAL REVIEW

Fresh review reconstructed the packet from the governing Storage/RLS/security-testing contracts and reviewed the exact implementation diff rather than trusting Pass A conclusions.

Reviewed clean:

- bucket remains private and the policy surface is limited to the expected four operations;
- project namespace is accepted only when the full synthetic media path matches the UUID/path contract; malformed paths yield fail-closed authorization rather than a permissive cast path;
- every policy delegates authority to the existing live `has_project_permission` helper rather than client role claims or path knowledge;
- UPDATE has both `USING` and `WITH CHECK`, preventing an authorized project-A object from being moved into project B;
- owner/editor/viewer, multi-project, outsider, revoked, anonymous and guest-like claims are covered for the direct behaviors exercised;
- exact project C/B path knowledge does not bypass membership;
- Realtime stays disabled, no public application table is in `supabase_realtime`, and the diff adds no `src/`/client subscription surface;
- no service-role/provider secret, domain media/document model, guest/provider implementation or Lot-2+ scope was introduced;
- the 375-line pgTAP matrix is below the repository hard default and is a linear security matrix rather than a production god-module; deliberate review found no logic-complexity defect requiring packet split.

### `WP19-AR-001` — MAJOR — DELETE authorization is inspected but not behaviorally proved

The repository's authorization/security contracts require direct allow/deny evidence for Storage operations, including unauthorized delete. After the initial unsupported direct-SQL delete was removed, Pass A only asserted that `pg_policies` contains a DELETE policy mentioning `authenticated`, `project-private` and `media.write`, plus a separate viewer permission check. That proves policy shape but not that the DELETE policy itself allows the intended writer and denies viewer/outsider/revoked/anon/cross-project cases.

Supabase's current Storage implementation rejects ordinary direct SQL deletion to prevent orphaned backing objects. Its Storage API performs deletion with the transaction/session flag `storage.allow_delete_query=true`, while RLS remains responsible for authorization. The bounded repair is therefore to exercise DELETE in the pgTAP transaction with that exact local flag set, under the existing synthetic roles, so the test isolates the real RLS decision without introducing service-role credentials, custom JWTs, browser code or permanent object deletion.

Required repair:

- restore a transactional delete helper used only after `storage.allow_delete_query=true` is set locally;
- prove authorized owner/editor delete succeeds for an own-project valid path;
- prove viewer, outsider, revoked, anon/guest-like and cross-project delete attempts do not delete the target object;
- keep all changes inside the existing pgTAP security matrix unless a smaller helper is required;
- rerun exact-head verification and a fresh Pass B.

Fresh Pass B result: **REVIEW_FAILED** due to `WP19-AR-001` MAJOR. No other BLOCKING/MAJOR finding was identified in the Storage policy implementation, Realtime non-exposure or scope boundaries reviewed on this pass.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Forbidden until `WP19-AR-001` is repaired, exact-head evidence is green and a fresh Pass B has no unresolved BLOCKING/MAJOR finding.

## Handoff

- Current state: `REVIEW_FAILED`.
- Current/next pass: `B-REVIEW-FAILED`; remediation is next.
- Open finding: `WP19-AR-001` MAJOR — DELETE RLS policy lacks direct behavioral allow/deny evidence.
- Last green pre-finding evidence: run `33996464530` on `a0e719462b2ea41908e6438a72cac75f11edcf36`, 5/5 SUCCESS; now historical for acceptance.
- Next permitted action: bounded pgTAP DELETE evidence repair -> fresh exact-head verification -> fresh Pass B.
- Pass C, Lot reconciliation/integration/acceptance and Lot 2+ remain forbidden until sequencing gates are met.