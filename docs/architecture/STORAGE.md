# Storage Architecture

Status: **Normative storage contract**

## Storage roles

- PostgreSQL stores structured project truth and metadata.
- Supabase Storage stores private binary objects explicitly archived by the couple.
- IndexedDB stores local working/cache/offline state.
- External media URLs may remain references without cloud duplication.
- GitHub stores only code, docs, migrations, tests and synthetic fixtures.

## Bucket model

Prefer a small number of private buckets rather than one bucket per entity. Object paths are namespaced by project ID and category, for example:

`<project_id>/venues/<venue_id>/...`

`<project_id>/vendors/<vendor_id>/...`

`<project_id>/documents/...`

Object path is never an authorization substitute. Storage RLS/policies validate membership.

## Metadata

Binary objects have structured DB metadata including:

- media/document UUID;
- project ID;
- linked entity IDs;
- category;
- original filename;
- MIME/type information;
- byte size;
- cryptographic hash when computed;
- source/provenance;
- upload state;
- created/updated timestamps;
- original/preview/thumbnail relationship.

## Upload lifecycle

1. validate intended file locally;
2. check quota/projected usage;
3. create upload operation ID;
4. upload binary;
5. verify completion/object identity;
6. commit metadata transaction/state;
7. generate/store derivative where supported;
8. mark ready.

Incomplete metadata never presents an upload as valid.

If binary upload succeeds but metadata commit fails, object is marked/recoverable for orphan cleanup. If metadata exists but upload is incomplete, it is not exposed as complete media.

## Originals and derivatives

For a user-owned archived photo:

- original bytes remain immutable;
- preview/thumbnail are separate derivatives;
- derivative regeneration must never rewrite the original;
- deletion policy handles all derivatives associated with a purged original.

## External media

Remote media can store:

- image URL;
- source-page URL;
- retrieval/verification date;
- caption/category;
- attribution note if available;
- optional private archived-copy object ID.

Remote failure marks the reference broken but does not delete the venue/fact/history.

## Deduplication

Cryptographic hashes identify exact-byte duplicates. Deduplication by hash is safe only for identical binary content; visually similar images are not auto-merged.

## Quota priority

When approaching free-tier storage limits:

1. essential structured DB writes continue;
2. small critical documents take priority over decorative imagery;
3. large uploads are warned/deferred/blocked before the project risks paid usage or service failure;
4. remote-reference mode is suggested where appropriate.

## Retention/garbage collection

Cleanup covers:

- abandoned upload objects;
- orphan derivatives;
- expired-trash objects after retention window;
- media made unreachable after entity purge.

Cleanup must be conservative and auditable.

## Download/access

Sensitive files are accessed through authenticated/private mechanisms. Do not rely on permanently public object URLs.

Signed URLs, if used, should be time-limited and generated only for authorized users.

## Tests

Required tests include:

- cross-project storage access denied;
- allowed member access;
- invalid path/project mismatch denied;
- duplicate hash handling;
- interrupted upload;
- metadata failure after binary upload;
- orphan cleanup;
- quota-pressure behavior;
- original immutability;
- purge removes derivatives according to retention policy.
