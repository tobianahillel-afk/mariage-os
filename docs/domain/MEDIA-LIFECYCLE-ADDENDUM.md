# Media Lifecycle and Remote Reference Addendum

Status: **Normative V1 implementation addendum for Lot-2 Media activation**

Purpose: close the media-state ambiguities that must not be invented in code when WP-2.8 starts. This addendum refines `PHYSICAL-SCHEMA-V1.md`, `DOCUMENTS-MEDIA.md`, `DOCUMENTS.md`, `FILE-SECURITY.md`, `EXTERNAL-CONTENT-SECURITY.md`, `PRIVACY.md` and the restored `STORAGE-RLS.md` without expanding V1 product scope.

## 1. Physical code ownership

`MediaService` is the logical V1 service boundary already frozen by `REPOSITORY-SERVICE-CONTRACTS.md`.

The frozen physical code hierarchy has `domain/documents/` and `application/documents/`, not a parallel top-level `media` bounded context. Media domain/application behavior therefore lives under the existing Documents/Media context (`domain/documents/`, `application/documents/`), while concrete Supabase metadata adapters live under `infrastructure/supabase/` and binary Storage adapters under `infrastructure/supabase/storage/`.

Do not create parallel `domain/media/`, `application/media/` or alternate storage hierarchies without an ADR changing `CODEBASE-STRUCTURE.md`.

## 2. WP-2.8 decomposition boundary

The original planned WP-2.8 combines independently reviewable security/persistence slices and is too large to enter implementation as one packet:

1. **WP-2.8A — Venue remote-image metadata and links**: `media`/`media_links` persistence for privacy-safe remote references linked to Venues, with no private binary upload and no deletion lifecycle.
2. **WP-2.8B — Private archive/original/derivative lifecycle**: private Storage bytes, file validation, immutable originals, hashes/derivatives and interrupted/orphan recovery.
3. **WP-2.8C — Recoverable Venue remote-media metadata lifecycle**: soft-delete/restore for the remote-reference metadata created by A, without deleting/fetching private or remote bytes.

The split changes implementation orchestration only. It does not remove or add product requirements. Venue gallery presentation remains WP-2.11; local/offline binary capture remains WP-2.12/Lot 10. The default execution order is A → B → C → WP-2.9, with only one packet active at a time. C depends on A's accepted metadata foundation; B and C remain separate because private binary recovery and metadata trash lifecycle have different failure modes.

## 3. V1 media type for Lot 2

For the Venue-photo responsibilities owned by WP-2.8A/B/C, the only accepted `media.media_type` value is:

- `image`.

No video/audio/general attachment behavior is introduced by Lot 2. Documents remain separate `documents` records.

## 4. Venue-oriented media categories

The exact Lot-2 image-category allowlist is:

- `exterior`;
- `interior_empty`;
- `interior_decorated`;
- `view`;
- `ceremony`;
- `kitchen`;
- `toilets`;
- `parking`;
- `accommodation`;
- `floorplan`;
- `own_visit`;
- `other`.

`category` remains nullable where the image is intentionally unclassified. Unknown arbitrary category text is not silently persisted.

## 5. WP-2.8A remote-reference row contract

WP-2.8A creates only committed remote-image references. For such a `media` row:

- `media_type = 'image'`;
- `remote_url` is required, canonical and **1..2048 Unicode scalar values**;
- `storage_path` is null;
- `derivative_of_id` is null;
- `is_original = true` as the logical source asset for that reference;
- `upload_status = 'ready'`;
- `original_filename`, `mime_type`, `size_bytes`, `sha256`, `width_px` and `height_px` are null because WP-2.8A does not fetch/verify remote bytes;
- `source_page_url` is optional; when present it is canonical and at most **2048 Unicode scalar values**;
- `caption` is optional; canonicalization trims surrounding whitespace, empty becomes null, and a non-null value is at most **5000 Unicode scalar values**;
- over-limit strings are rejected; no silent truncation is permitted;
- project/audit identity is server-controlled according to the ordinary project-scoped authorization model.

The URL ceiling intentionally reuses the accepted `fact-url` 2048-code-point boundary; the caption ceiling reuses the accepted 5000-code-point bounded free-text convention already used by Venue notes/summaries.

WP-2.8A does **not** add `source_id` to `media`, and its command does not accept a caller-owned `source_id`. Remote-reference provenance in A is the bounded `source_page_url` plus optional caption. A future packet that wants an explicit `sources` relationship must own and review that schema/API change rather than inferring it here.

For WP-2.8A, `ready` means that the metadata reference is valid for application use; it does **not** claim that remote bytes were copied, verified, cached or archived.

No other `upload_status` value is frozen by WP-2.8A. Private-upload transition states belong to the WP-2.8B stop-condition below and must be frozen before WP-2.8B can become READY.

## 6. Remote URL security/privacy contract

A WP-2.8A `remote_url` must pass the existing external-content rules:

- absolute HTTPS URL only;
- maximum 2048 Unicode scalar values;
- no `javascript:`, `data:`, `file:` or other active/local schemes;
- no URL credentials;
- reject obvious localhost/localhost-style hosts;
- reject loopback, link-local and private-network IP literals;
- never construct or append project ID, guest data, auth/session/invitation tokens, private notes or other private payload to the remote URL;
- remote content remains untrusted and nonessential.

A `source_page_url`, when present, is a public provenance/navigation URL, is bounded to 2048 Unicode scalar values, must be an absolute `http` or `https` URL under the existing navigation/source-URL validation rules, and must not contain credentials or private project payload. It is not fetched by WP-2.8A. Application code must not derive a remote image request by adding private query parameters to either URL.

Direct browser rendering remains a later presentation responsibility. When rendered, `referrerpolicy="no-referrer"` (or equivalent), lazy loading where appropriate and broken/slow fallback rules from `PRIVACY.md` / `EXTERNAL-CONTENT-SECURITY.md` remain mandatory. WP-2.8A must not claim that direct remote loading hides the user's IP address.

No third-party/server-side image proxy is introduced by WP-2.8A/B/C.

## 7. Venue media-link contract for WP-2.8A

`media_links` remains the logical relationship owner; Storage path structure never implies Venue ownership.

For the physical schema, the base-schema phrase `source object id` is frozen for `media_links` as:

- `media_id uuid not null`;
- composite same-project FK `(project_id, media_id) -> media(project_id, id)`.

WP-2.8A exposes only the Venue relationship needed by `FTR-024`:

- `target_type = 'venue'`;
- `relationship_type = 'gallery'`;
- `target_id` must identify an existing Venue in the same `project_id` as the media row;
- media and Venue cannot cross projects;
- duplicate identical Venue/media/gallery links are rejected or replayed idempotently by the protected command rather than creating duplicate semantic links.

Other polymorphic targets/relationship types remain unavailable until their owning packet explicitly reviews and adds them. `venues.main_media_id` and gallery ordering/presentation are not mutated by WP-2.8A; those presentation choices remain WP-2.11.

## 8. WP-2.8A command/replay boundary

Remote media creation and its Venue link are one semantic operation. Partial creation of a media row without the requested Venue relationship is not an accepted success.

The protected command uses caller-generated UUIDs for the media record and link so ambiguous network acknowledgement can be retried safely:

- same project + same IDs + same caller-owned semantic payload returns the already accepted result;
- same project + reused ID with different semantic payload is a typed conflict;
- an ID already owned by another project fails generically/non-disclosingly;
- client cannot supply/override project/audit identity or storage-path/private-upload fields through the remote-reference command.

Caller-owned semantic payload for replay includes the Venue target, frozen relationship, category, `remote_url`, canonical `source_page_url` and canonical caption. Server-controlled audit values are not replay-equality inputs.

The command requires live `media.write`. Reads require live `media.read`. Direct table boundaries remain RLS-protected and same-project constraints remain authoritative.

## 9. WP-2.8B private-lifecycle stop-condition

Before WP-2.8B can transition from PLANNED to READY, repository documentation must freeze the exact private-upload lifecycle needed to satisfy `MED-004`, `MED-005`, `MED-006`, `MED-009`, `MED-010`, `ACC-055` and `ACC-056`, including:

- accepted private `upload_status` values and legal transitions;
- which step owns recovery when Storage succeeds but metadata/link commit fails;
- when a binary becomes visible as committed/ready;
- immutable-original enforcement and derivative relationship/version rules;
- exact hash/dedup semantics and project scope;
- MIME/extension/signature/size verification boundary for supported image formats;
- cleanup/retry behavior for interrupted/orphan objects without assuming an unavailable background scheduler;
- authorization behavior for any new protected metadata/Storage command.

Until that stop-condition is closed and exact-head CI is green, WP-2.8B product code must not invent those states.

## 10. WP-2.8C recoverable remote-metadata lifecycle

`DELETION-RETENTION.md` requires media/document metadata to be recoverable through soft deletion before purge. That responsibility is explicitly assigned to WP-2.8C rather than silently expanding the already 10-point WP-2.8A.

For the remote-reference rows created by A:

- `media.deleted_at timestamptz null` is the soft-delete marker under the standard audit conventions;
- ordinary active-media list/read models exclude `deleted_at is not null` rows;
- soft-delete sets `deleted_at` without changing the remote URL, provenance, caption, category, immutable project identity or Venue relationship;
- the existing `media_links` row remains retained while the media row is soft-deleted so a restore is reversible and does not manufacture a new logical link;
- restore clears `deleted_at` and returns the same media/link identity when same-project integrity still holds;
- deleting an already deleted row and restoring an already active row are idempotent successful lifecycle replays rather than duplicate mutations;
- the protected lifecycle transition requires live `media.write`; foreign-project IDs fail generically/non-disclosingly; ordinary RLS/project isolation remains authoritative;
- remote-reference soft-delete does not fetch, delete, archive or transform remote content and cannot affect a separate private archived media row;
- WP-2.8C does not implement the global 30-day purge/Empty-trash scheduler. Physical purge remains a later explicit trash/retention operation and must preserve the remote-reference/private-archive independence rule.

WP-2.8C may expose delete/restore as two application operations over one protected lifecycle transition command. Any optimistic revision/receipt detail must follow the accepted collaborative mutation conventions and be frozen in the packet before its READY transition.

## 11. Explicit downstream boundaries

This addendum does not implement or accept:

- Venue gallery UI, ordering, main-photo presentation or remote-image DOM rendering — WP-2.11;
- IndexedDB/offline binary queue/visit capture — WP-2.12 and Lot 10 hardening;
- Documents business model/versioning — WP-2.9 and later document packets;
- generic Vendor/Guest/etc. media links — their owning packets;
- server image proxy/CDN transformation service;
- global trash UI, 30-day physical purge scheduler or project purge workflow;
- Lot-4 canonical import commit or `.mariage` binary backup/restore.

Feature-level status must remain honest: accepting a Lot-2 media foundation does not by itself accept whole downstream `FTR-092` or presentation responsibilities.
