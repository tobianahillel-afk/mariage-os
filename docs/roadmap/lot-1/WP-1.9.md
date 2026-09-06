# Work Packet Record — WP-1.9

## Identity

- Work Packet ID: `WP-1.9`
- Lot: `1`
- Name: Storage/Realtime isolation foundation and Lot-1 security-matrix closure
- State: `ACCEPTED`
- Current pass: `COMPLETE`
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

## Pass A — IMPLEMENT / REMEDIATION

Implementation started from readiness HEAD `89c771b6b2014bde2741618cee6edc5cf54f2267`.

Initial implementation/evidence HEAD before review: `a0e719462b2ea41908e6438a72cac75f11edcf36`.

Historical exact-head evidence: GitHub Actions run `33996464530` completed **5/5 SUCCESS**, including Core quality/security, browser E2E + mutation, local Supabase DB/RLS, privacy-safe preview and clean-checkout `npm run verify`. Fresh Pass B subsequently found `WP19-AR-001`, so that evidence became historical for acceptance.

`WP19-AR-001` remediation changed only the direct pgTAP security matrix. The test sets Supabase Storage's transaction-local `storage.allow_delete_query=true` flag before DELETE assertions; this bypasses Storage metadata-protection behavior only, while RLS remains active and is the authorization decision under test. No Storage policy, application code, credential or domain scope was changed.

Final implementation/review HEAD: `1c8331de918e82e1dc40beb96e6ac08343b861d7`.

Fresh exact-head evidence: GitHub Actions run `33999832455` completed **5/5 SUCCESS**, including Core quality/security, browser E2E + mutation, local Supabase DB/RLS, privacy-safe preview and clean-checkout `npm run verify`.

Fresh direct DB/Storage evidence: **14 pgTAP files / 284 tests / PASS**. `storage_realtime_isolation_test.sql` contributes **45/45 PASS** and behaviorally proves DELETE as well as SELECT/INSERT/UPDATE: own-project owner/editor DELETE allow; cross-project, viewer, outsider, revoked, anonymous and guest-like DELETE deny. The same matrix proves bucket privacy, malformed-path fail-closed behavior, A/B/C isolation and empty public Realtime publication.

The final readiness-to-review delta is limited to the packet/status records, `supabase/config.toml`, one Storage migration and one pgTAP matrix. No `src/`, UI, provider or client Realtime surface was introduced. The security matrix was compacted to 380 physical lines without removing assertions or changing test semantics.

### Pass A exit criteria

- [x] private Storage foundation is migration-controlled and project-namespaced
- [x] policies use live centralized permissions rather than client role/path trust
- [x] anonymous/guest-like/outsider/other-project/revoked access denied directly
- [x] owner/editor/viewer/multi-project permission behavior proved across A/B/C
- [x] malformed/cross-project object namespaces fail closed
- [x] Realtime service remains disabled and no application project table is published/exposed
- [x] no Storage/Realtime secret/provider SDK leaks into UI/domain/public artifacts
- [x] no domain media/document/guest/provider scope introduced
- [x] direct SELECT/INSERT/UPDATE/DELETE Storage security evidence green
- [x] exact-head full CI including clean-checkout `npm run verify` green before fresh Pass B

## Pass B — ADVERSARIAL REVIEW

The first fresh review found one MAJOR only:

### `WP19-AR-001` — MAJOR — DELETE authorization was inspected but not behaviorally proved

The initial repaired Pass-A matrix asserted DELETE policy shape but did not execute the DELETE RLS decision. Repository authorization/security contracts require direct allow/deny evidence for Storage operations, including unauthorized delete. The packet transitioned through `REVIEW_FAILED` and bounded remediation rather than accepting structural evidence as sufficient.

### Fresh post-remediation review

Fresh review was performed against implementation/review HEAD `1c8331de918e82e1dc40beb96e6ac08343b861d7` after run `33999832455` was fully green.

Reviewed clean:

- bucket private; policy surface limited to SELECT/INSERT/UPDATE/DELETE;
- full synthetic media path must match the UUID/path contract before project extraction/cast; malformed paths fail closed;
- every Storage policy delegates authority to live `has_project_permission`, which derives authority from `auth.uid()`, current active membership and the migration-controlled role-permission catalog rather than JWT role/path knowledge;
- UPDATE has both `USING` and `WITH CHECK`, preventing cross-project object movement;
- DELETE is behaviorally exercised with the transaction-local metadata-delete flag while RLS remains active: owner/editor own-project allow; cross-project, viewer, outsider, revoked, anon and guest-like deny;
- owner/editor/viewer, multi-project identity, outsider, revoked member, anonymous and guest-like capability cases remain covered across projects A/B/C;
- exact object/project path knowledge does not bypass membership or permission;
- Realtime remains disabled, no public application table is published in `supabase_realtime`, and targeted source review finds no client Realtime subscription surface;
- targeted source review finds no `project-private` client integration, so the packet does not prematurely create a Storage UI/repository surface;
- no service-role/provider credential, provider SDK, guest domain implementation, media/document business model or Lot-2+ scope was introduced;
- final changed-file set is exactly the bounded configuration/migration/security-test/evidence surface expected by WP-1.9;
- the 380-line SQL security matrix remains linear test evidence with small temporary helpers and no production responsibility coupling; no maintainability BLOCKING/MAJOR finding remains.

`WP19-AR-001`: **CLOSED**.

Fresh Pass B result: **PASS — no unresolved BLOCKING/MAJOR finding**.

## Pass C — ACCEPTANCE / RECONCILIATION

Pass C mechanically compared every packet responsibility as `EXPECTED vs IMPLEMENTED vs VERIFIED`.

| Expected responsibility | Implemented | Verified | Result |
|---|---|---|---|
| private migration-controlled Storage foundation | private `project-private` bucket | migration/reset + bucket assertion | PASS |
| project namespace is context, not authority | full-path validation + `has_project_permission` | malformed/cross-project matrix | PASS |
| live read authorization | `media.read` policy | owner/editor/viewer and deny matrix | PASS |
| live write/update authorization | `media.write`, UPDATE `USING` + `WITH CHECK` | own/cross-project/update matrix | PASS |
| live delete authorization | DELETE `media.write` policy | direct owner/editor allow plus cross-project/viewer/outsider/revoked/anon/guest-like deny | PASS |
| public-readiness role/project matrix | A/B/C + owner/editor/viewer/multi-project/outsider/revoked | 45-assertion Storage/Realtime matrix | PASS |
| guest capability cannot become member authority | no guest Storage policy; anon capability claims remain anon | direct guest-like read/write/delete deny | PASS |
| Realtime isolation/non-exposure | service disabled; no application publication/client surface | config + publication assertion + targeted source review | PASS |
| no secret/provider/domain scope leakage | no browser secret/provider/media-domain implementation | exact diff + secret/static/full verify | PASS |
| required verification green | full CI and direct DB/RLS | run `33999832455`, 5/5 SUCCESS; DB 14/284; matrix 45/45 | PASS |
| no unresolved adversarial defect | `WP19-AR-001` remediated | fresh Pass B PASS | PASS |

Required WP-1.9 responsibilities minus implemented/verified responsibilities: **∅**.

Post-review reconciliation commits through coverage update `74a38c78c0ea460814c8cf5911ef91954cf8365c` were inspected as documentation/governance-only changes; no production/config/test behavior changed after implementation/review HEAD `1c8331de918e82e1dc40beb96e6ac08343b861d7`, so technical evidence and fresh Pass B remain valid.

Final packet decision: **WP-1.9 ACCEPTED**.

## Handoff

- State: `ACCEPTED`.
- Current pass: `COMPLETE`.
- Implementation/review evidence: run `33999832455` on `1c8331de918e82e1dc40beb96e6ac08343b861d7`, **5/5 SUCCESS**; DB **14 files / 284 tests / PASS**; WP-1.9 matrix **45/45 PASS**.
- Adversarial finding history: `WP19-AR-001` MAJOR found, remediated, reverified and **CLOSED**; fresh Pass B PASS.
- Required packet responsibilities minus accepted/evidenced responsibilities: **∅**.
- All planned Lot 1 packets are now accepted.
- Next permitted action: **Lot 1 reconciliation only**, followed by the separate Lot Integration Pass and Lot acceptance if all gates remain green.
- Lot 2+ remains forbidden until Lot 1 is accepted and a future Lot 2 kickoff is explicitly authorized.