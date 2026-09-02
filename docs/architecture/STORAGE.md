# Storage Architecture

Status: **Normative V1 storage contract**

## Storage roles

- PostgreSQL stores structured project truth/metadata.
- Supabase Storage stores private binary objects explicitly archived by the couple.
- IndexedDB stores local working/cache/offline state and unsynced local binaries.
- External public marketing media may remain URL references.
- GitHub stores code/docs/migrations/tests/synthetic fixtures only.

## Bucket/path model

Use a small number of private buckets. Every private object is project-namespaced and authorization is verified by Storage policies, not path obscurity.

Prefer opaque application-generated object keys rather than raw user filenames, for example:

`<project_id>/media/<media_uuid>/original`

`<project_id>/media/<media_uuid>/thumbnail-v1`

`<project_id>/documents/<document_uuid>/original`

The original filename is metadata only. Do not expose guest/vendor/private names unnecessarily in Storage paths, signed URLs or logs.

Entity relationships are DB link records; physical object path does not define ownership of one venue/vendor only. One binary/document can link to multiple project entities without duplication.

## Metadata

Binary metadata includes as applicable:

- media/document UUID;
- project ID;
- category/type/classification;
- original filename (private metadata);
- declared and verified MIME/type details;
- byte size;
- cryptographic hash;
- source/provenance;
- upload status;
- timestamps/audit;
- original/derivative relationship;
- supersession/version relationship for documents where applicable;
- multiple entity links.

## Upload lifecycle

1. validate file intent, size, extension/MIME/signature according to file-security policy;
2. preflight quota/safety budget;
3. allocate UUID/operation ID/opaque path;
4. persist local pending-file recovery metadata;
5. upload binary;
6. verify object/size/hash where applicable;
7. commit DB metadata/link state transactionally enough for invariant;
8. generate/store derivative where supported;
9. mark committed/ready only after required object+metadata state exists.

A binary uploaded without committed metadata becomes recoverable orphan state. Metadata whose binary is incomplete is not exposed as valid media/document.

## Originals and derivatives

- archived original bytes are immutable;
- thumbnail/preview is a separate object/record;
- derivative regeneration never rewrites original;
- derivatives identify source original and generation version/type;
- purging original follows explicit derivative cleanup rules.

## Document versions

A revised quote/contract is a distinct document/version record linked through supersession semantics. If exact bytes are identical, binary dedup may reuse safe physical storage while keeping separate logical version metadata/relationships when business history requires distinct records.

Do not overwrite an old contract object merely because a newer version arrived.

## External media references

A remote reference can retain:

- remote image URL;
- source page URL;
- observed/retrieval date;
- caption/category/attribution note;
- optional archived-copy media ID.

Network/privacy rules:

- never append private project data, guest names, tokens or notes to remote-media URLs;
- browser rendering uses `referrerpolicy="no-referrer"` or equivalent privacy-preserving request policy where supported;
- external media is nonessential and failure must not block venue data;
- do not execute remote SVG/HTML/script content as trusted active application content;
- if CORS/hotlink/privacy/reliability makes a remote image unsuitable, show a safe placeholder/source link or let owners deliberately archive a private copy;
- broken remote URL changes source/media health, not historical venue/fact existence.

## Deduplication

Cryptographic hash identifies exact-byte duplicate content. Visual similarity does not auto-merge.

Dedup scope is project-private unless a future privacy-reviewed architecture explicitly changes it; do not create cross-project content-presence side channels.

## Quota priority

When free-tier pressure rises:

1. auth/structured DB editing and sync remain priority;
2. pending unsynced local originals are protected on device;
3. small critical documents outrank decorative media;
4. large nonessential uploads are warned/deferred/blocked;
5. remote-reference/cleanup/export options are offered;
6. app never auto-enables paid storage.

## Retention/garbage collection

Conservative cleanup covers:

- abandoned uploads;
- uncommitted binary or metadata orphans;
- orphan derivatives;
- expired-trash objects after eligibility window;
- objects unreachable after explicit entity/project purge.

Cleanup uses project-safe authorization and operation history. Soft-delete expiration means eligible for purge, not guaranteed cron-time deletion.

## Download/access

Private files use authenticated/authorized access. Permanent public object URLs are forbidden for sensitive content.

Signed URLs, when used, are short-lived and created only after authorization. Do not persist signed URLs as durable document identity.

Downloads use safe filename/content-disposition behavior and do not render active untrusted content inline merely for convenience.

## Offline files

New files captured offline remain local pending binaries with durable recovery references until upload/explicit discard. Local cleanup must never treat them as disposable cache.

## Tests

- cross-project DB/Storage/path access denied;
- path project mismatch denied;
- opaque object path does not contain raw private filename;
- invalid MIME/signature/oversize rejected;
- interrupted upload and metadata-failure recovery;
- orphan cleanup is project-safe;
- duplicate hash handling does not lose logical links/version history;
- original immutability/derivative regeneration;
- remote image uses privacy-safe request behavior and failure fallback;
- quota pressure blocks nonessential media before structured edits;
- soft-delete/purge removes correct binaries/derivatives without cross-project effect;
- signed/private access expires and does not become durable public URL.
