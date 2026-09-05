# Work Packet Record — WP-1.9

## Identity

- Work Packet ID: `WP-1.9`
- Lot: `1`
- Name: Storage/Realtime isolation foundation and Lot-1 security-matrix closure
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
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

### Pass A exit criteria

- [ ] private Storage foundation is migration-controlled and project-namespaced
- [ ] policies use live centralized permissions rather than client role/path trust
- [ ] anonymous/guest-like/outsider/other-project/revoked access denied directly
- [ ] owner/editor/viewer/multi-project permission behavior proved across A/B/C
- [ ] malformed/cross-project object namespaces fail closed
- [ ] Realtime service remains disabled and no application project table is published/exposed
- [ ] no Storage/Realtime secret/provider SDK leaks into UI/domain/public artifacts
- [ ] no domain media/document/guest/provider scope introduced
- [ ] direct DB/Storage security evidence green
- [ ] exact-head full CI including clean-checkout `npm run verify` green before Pass B

## Pass B — ADVERSARIAL REVIEW

Not started. Mandatory after exact-head Pass A evidence.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Forbidden until fresh Pass B has no unresolved BLOCKING/MAJOR finding.

## Handoff

- Current state: `IN_PROGRESS`.
- Current/next pass: `A-IMPLEMENT`.
- Active scope: Storage foundation + Realtime non-exposure only.
- After WP-1.9 acceptance: Lot-1 reconciliation + separate Integration Pass + Lot acceptance.
- Lot 2+ remains forbidden.