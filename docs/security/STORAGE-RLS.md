# Mariage OS — Storage RLS and Private Object Authorization

Status: **Normative V1 Storage authorization contract**

Purpose: define the durable authorization boundary for project-private Supabase Storage objects. This document restores the contract already implemented and accepted in WP-1.9; it does not introduce a new Storage architecture or pre-implement later Media/Documents product behavior.

Read together with:

- `AUTHORIZATION-MODEL.md`;
- `AUTHORIZATION-REQUIREMENTS.md`;
- `ROLE-PERMISSION-MATRIX.md`;
- `RLS-MATRIX-V1.md`;
- `RLS-PERMISSION-MAPPING.md`;
- `FILE-SECURITY.md`;
- `EXTERNAL-CONTENT-SECURITY.md`;
- `../architecture/STORAGE.md`.

## 1. Authority model

Private object access is authorized from live project authority, never from UI state, object-path secrecy or possession of a UUID/path.

For project-member Storage access, the decision remains:

`authenticated identity + current active project membership + explicit permission + valid project namespace + applicable resource/domain invariants`.

Storage policies must reuse the centralized project-permission model. They must not duplicate role checks such as `role = 'owner'` or trust a client-supplied project identifier independently from the validated object namespace.

Exact knowledge of a bucket name, project UUID, object UUID or full object path does not grant access.

## 2. Accepted private bucket foundation

The accepted V1 foundation bucket is:

- bucket id/name: `project-private`;
- `public = false`;
- no permanent public object URLs for private project content;
- no anonymous listing/read/write policy.

The bucket is migration-controlled by `supabase/migrations/20260905223000_create_project_private_storage_foundation.sql`.

WP-1.9 acceptance evidence for this foundation is recorded in `docs/roadmap/lot-1/WP-1.9.md`.

## 3. Accepted media namespace

The currently implemented and accepted Storage policy slice recognizes only the strict synthetic/project-media namespace:

```text
<project_uuid>/media/<object_uuid>/<variant>
```

The policy validates the whole object name before extracting the leading project UUID. The accepted grammar requires:

- canonical UUID-shaped project identifier;
- literal `media` segment;
- canonical UUID-shaped object identifier;
- final variant/file-key segment beginning with an alphanumeric character and containing only alphanumeric characters, `.`, `_` or `-`, with bounded length.

Examples of intended opaque keys include:

```text
<project_id>/media/<media_uuid>/original
<project_id>/media/<media_uuid>/thumbnail-v1
```

Raw private filenames, guest/vendor names, notes or other private labels do not belong in the Storage path. Original filename and descriptive metadata belong in PostgreSQL metadata.

Malformed namespaces fail closed. A path that cannot satisfy the complete accepted grammar must not yield a project authorization decision.

Later document/backup/file classes may add reviewed path prefixes and permissions, but they must not silently reuse the media policy or weaken this grammar.

## 4. Permission mapping

For the accepted `project-private/.../media/...` slice:

| Operation | Required permission |
|---|---|
| SELECT/read | `media.read` |
| INSERT/upload metadata object row | `media.write` |
| UPDATE/rename/move within authorized namespace | `media.write` |
| DELETE | `media.write` |

Built-in role mapping remains the centrally defined matrix:

- owner: `media.read` + `media.write`;
- editor: `media.read` + `media.write`;
- viewer: `media.read` only;
- inactive/revoked membership: no project media authority;
- outsider/non-member: no project media authority;
- anonymous/guest-capability identity: no project-private media authority.

Feature code must ask for permissions, not infer Storage authority from role names.

## 5. RLS policy semantics

`storage.objects` remains protected by RLS. The accepted media policy surface consists of four authenticated policies:

- `project_private_media_select`;
- `project_private_media_insert`;
- `project_private_media_update`;
- `project_private_media_delete`.

Each policy requires `bucket_id = 'project-private'`, validates/extracts the project namespace and delegates live authorization to `public.has_project_permission(...)` with the required stable permission key.

UPDATE must enforce both:

- `USING` on the existing row; and
- `WITH CHECK` on the resulting row.

This is mandatory so an identity authorized for project A cannot rename/move an object into project B or another unauthorized namespace.

DELETE requires live `media.write`; stale path knowledge after membership revocation is not authority.

## 6. Multi-project and non-disclosure behavior

A user who belongs to multiple projects may see/mutate only the project namespaces for which the current membership/permission evaluation succeeds.

Project A membership never grants project B/C Storage access. Knowing an exact project B/C object path does not change the result.

Denied access must remain fail-closed and should not create a separate existence oracle for another project's private object. Application/provider adapters must not turn low-level Storage/RLS errors into detailed cross-project existence disclosures.

## 7. Anonymous and guest-capability separation

Guest RSVP/capability authorization is a separate trust model and does not create project membership or `media.read`/`media.write`.

An anonymous request remains denied even if it carries project-like identifiers, RSVP-like claims or exact private object paths.

If a future guest-facing asset flow is required, it needs its own narrow reviewed capability boundary. It must not broaden the `project-private` member policy.

## 8. Signed/private delivery

Private object delivery remains authenticated/authorized. A signed URL, when a product flow later uses one, is only a short-lived delivery capability produced after authorization; it is not durable object identity and must not be persisted as the canonical media/document reference.

Permanent public URLs for project-private content are forbidden.

Signed URLs and logs must avoid unnecessary private filenames, tokens or project payload beyond the opaque object path needed for delivery.

## 9. Metadata and binary relationship

PostgreSQL owns structured media/document truth; Storage owns private binary bytes.

A Storage path alone does not establish which venue/vendor/entity owns the media. Logical relationships are same-project database metadata/link records. One project binary may be linked to multiple entities without duplicating bytes.

For Media implementation, the application must preserve the architecture contract that opaque media UUID/path identity and PostgreSQL `media` metadata stay project-consistent. Storage RLS is necessary authorization defense, but it does not replace database same-project integrity or metadata validation.

## 10. File/content validation remains separate

Storage authorization does not prove file safety.

Before a private binary is treated as valid application media/document, apply the relevant `FILE-SECURITY.md` controls, including as applicable:

- allowed format intent;
- extension/MIME/signature checks;
- object size limits;
- safe preview behavior;
- no active HTML/JavaScript/SVG execution;
- hash/duplicate handling;
- source/provenance metadata;
- interrupted-upload/orphan recovery.

For remote image references, apply `EXTERNAL-CONTENT-SECURITY.md`; a remote URL is not a trusted Storage object and must not gain project authorization semantics merely because it is linked from private metadata.

## 11. Lifecycle and immutability boundaries

The Storage architecture freezes these expectations for later Media/Documents implementation:

- archived originals are immutable application assets;
- derivatives/previews are separate objects/records;
- derivative regeneration never rewrites the original;
- incomplete binary/metadata pairs are not exposed as committed media;
- orphan cleanup is explicit and project-safe;
- cleanup/purge cannot cross project namespaces;
- exact-byte hash equality never grants cross-project access.

These lifecycle rules require product metadata/commands in their owning packets; this Storage-RLS document does not claim those later responsibilities are already implemented.

## 12. Direct verification requirements

Any change to the private Storage authorization surface must retain direct allow/deny evidence, not only policy-text inspection.

The accepted WP-1.9 matrix `supabase/tests/storage_realtime_isolation_test.sql` proves the current foundation across synthetic projects A/B/C and identities including owner, editor, viewer, multi-project member, outsider, revoked member, anonymous and guest-like capability cases.

Required behavioral coverage includes:

- bucket remains private;
- `storage.objects` RLS is active;
- owner/editor own-project read/write/delete allowed;
- viewer own-project read allowed and writes/update/delete denied;
- other-project exact path read/write/update/delete denied;
- outsider denied;
- revoked member denied immediately from current permission state;
- anonymous and guest-like requests denied;
- malformed UUID/path namespaces denied;
- UPDATE cannot move an object across project namespaces;
- DELETE authorization is executed behaviorally, not inferred from policy definition.

New Storage prefixes/classes must add their own direct allow/deny matrix and declare ownership, permissions, relationship constraints and sensitive-field behavior before merge.

## 13. Accepted foundation versus future packet scope

Already accepted by WP-1.9:

- private `project-private` bucket;
- strict project media namespace foundation;
- live `media.read`/`media.write` Storage RLS;
- owner/editor/viewer/multi-project/outsider/revoked/anon/guest-like isolation evidence;
- malformed/cross-project fail-closed behavior;
- no permanent public object access.

Not accepted merely by this restored document:

- Media business metadata tables/commands;
- venue media links/gallery UI;
- actual binary upload/download adapters;
- MIME/signature/hash verification implementation;
- derivative generation;
- orphan cleanup workflow;
- signed-URL product flow;
- document/backup Storage prefixes;
- offline pending binary queue;
- server-side image proxy.

Those responsibilities remain with their mapped packets/lots and must reuse, not bypass, this Storage authorization boundary.
