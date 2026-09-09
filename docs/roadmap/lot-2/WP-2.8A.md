# WP-2.8A — Venue remote-image metadata and links

## Identity

- Work Packet ID: `WP-2.8A`
- Lot: `2`
- Name: Venue remote-image metadata and links
- State: `PLANNED`
- Current pass: `PLAN`
- Primary bounded context: Documents/Media metadata for Venue remote image references
- Branch/PR: `lot-2/venues-core` / PR not opened yet

## Split decision

The original WP-2.8 packet is split before product code because combining remote-reference metadata/link persistence with private Storage upload/original/derivative/orphan lifecycle would exceed the normative packet sizing threshold and mix independently reviewable failure/security boundaries.

Product scope is unchanged:

- WP-2.8A owns remote-image metadata + Venue linking + remote URL privacy/security foundation;
- WP-2.8B owns private archived image bytes, file validation, originals/derivatives/hash and interrupted/orphan recovery;
- WP-2.11 owns gallery/detail presentation and remote-image rendering behavior;
- WP-2.12/Lot 10 owns local/offline binary capture/queue behavior.

## Scope

### Primary features / current-lot responsibility

- Lot-2 foundation slice of `FTR-024` — Venue photos as remote references linked to a Venue;
- `VEN-013` — distinguish remote image reference from later archived/private media;
- `MED-007` — remote images may remain URL references to protect quota;
- `MED-008` — retain media provenance/source URL;
- `MED-010` — media metadata/storage authorization is project-private and not based on obscurity;
- `MED-013` — remote media URLs/requests must not carry private project data;
- foundation responsibility toward `ACC-057` and `ACC-058` without claiming later DOM rendering or private-upload acceptance.

### Exact WP-2.8A responsibility

- `media` metadata persistence for Venue remote image references;
- `media_links` persistence for same-project Venue gallery association;
- exact Lot-2 media type/category boundaries from `MEDIA-LIFECYCLE-ADDENDUM.md`;
- remote row contract: HTTPS `remote_url`, no `storage_path`, no fetched binary metadata, `is_original=true`, `upload_status='ready'`;
- bounded optional `source_page_url` and caption/provenance metadata;
- privacy-safe remote URL validation following `EXTERNAL-CONTENT-SECURITY.md`;
- atomic remote-media + Venue-link create/replay command;
- stable caller-generated media/link UUID replay, same-project typed conflict and foreign-project non-disclosure;
- same-project media↔Venue relationship integrity;
- project-scoped `media.read` / `media.write` authorization and direct RLS allow/deny tests;
- fail-closed Supabase provider parsing/receipts.

### Applicable normative controls

- `FTR-024` Lot-2 foundation, `VEN-013`, `MED-007`, `MED-008`, `MED-010`, `MED-013`;
- invariants `63`, `66`, `67`, `72`, `100` where applicable to this remote-reference slice;
- `PHYSICAL-SCHEMA-V1.md` media/media_links shape;
- `MEDIA-LIFECYCLE-ADDENDUM.md`;
- `DOCUMENTS-MEDIA.md`, `DOCUMENTS.md`;
- `RLS-MATRIX-V1.md`, `RLS-PERMISSION-MAPPING.md`, `ROLE-PERMISSION-MATRIX.md`;
- `STORAGE-RLS.md`, `EXTERNAL-CONTENT-SECURITY.md`, `PRIVACY.md`, `FILE-SECURITY.md` where applicable;
- applicable authorization/validation/provider-verification controls already used by prior Lot-2 packets.

### Explicitly out of scope

- private binary upload/archive — WP-2.8B;
- actual file MIME/signature/hash verification — WP-2.8B;
- thumbnail/preview generation — WP-2.8B;
- interrupted/private orphan Storage recovery — WP-2.8B;
- Venue gallery UI/order/main-photo selection/DOM `<img>` rendering — WP-2.11;
- local/offline media queue or own-visit capture — WP-2.12/Lot 10;
- Documents/version/supersession — WP-2.9 and later document work;
- generic non-Venue polymorphic media targets;
- server-side image proxy, remote image fetching or image transformation provider;
- Lot-4 importer/apply behavior.

## Dependency / sequencing

- WP-2.1 Venue identity/project isolation: **ACCEPTED**.
- Lot-1 WP-1.9 private Storage authorization foundation: **ACCEPTED**.
- WP-2.7: **ACCEPTED / COMPLETE**; final status-governance head `db1dae663129c3281618c932fa7f5a8184a5a2ad`, CI `34377221997` — **5/5 SUCCESS**.
- Missing `docs/security/STORAGE-RLS.md` governance prerequisite: **CLOSED / VERIFIED** by `54fb49d11e16f3945eb2cb820e1f832768711e7e` / `34378129764` — **5/5 SUCCESS**.
- WP-2.8B remains PLANNED and cannot run concurrently with WP-2.8A.

## Activation specification freeze

`MEDIA-LIFECYCLE-ADDENDUM.md` freezes the portion needed by this packet so Pass A does not invent values from unconstrained `text` columns:

- `media_type='image'` for Lot-2 venue media;
- exact venue image-category allowlist;
- remote-reference row uses `remote_url`, null `storage_path`, `derivative_of_id=null`, `is_original=true`, `upload_status='ready'`;
- WP-2.8A does not fetch remote bytes, so binary-derived metadata is null;
- Venue link is `target_type='venue'`, `relationship_type='gallery'` and same-project validated;
- private-upload lifecycle states remain explicitly deferred to the WP-2.8B stop-condition.

## Sizing review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| new/meaningfully changed bounded domain | 1 | 3 | 3 |
| new persistent entity/table | 2 | 1 | 2 |
| new migration family | 1 | 1 | 1 |
| new RPC/public endpoint/capability command | 1 | 2 | 2 |
| new/changed RLS or privileged authorization boundary | 1 | 2 | 2 |
| major UI route/workflow | 0 | 1 | 0 |
| public/unauthenticated capability surface | 0 | 2 | 0 |
| external provider integration | 0 | 3 | 0 |
| offline/sync semantics | 0 | 2 | 0 |
| security-sensitive token/crypto boundary | 0 | 2 | 0 |
| financial/calculation critical engine | 0 | 3 | 0 |
| backup/import/version migration semantics | 0 | 2 | 0 |
| **Total** |  |  | **10** |

### 10-point cohesion rationale

The remote `media` row and Venue `media_links` row form one semantic create operation: exposing an unlinked partial media row as a successful Venue-photo capture would violate the intended Venue relationship and complicate replay. One atomic protected command plus the two same-project tables is therefore a coherent vertical slice rather than two file-level packets.

The packet deliberately excludes private Storage bytes/file validation/derivatives/orphan cleanup; including those responsibilities would exceed 10 and mix a separate binary failure lifecycle.

## Expected vertical slice

- UI/route: none.
- domain: image type/category normalization, remote URL policy, remote-reference value/invariant/replay equality.
- application: `MediaService` remote Venue-reference create/replay + Venue remote-media list query under `application/documents/`.
- ports: remote-media create/list metadata port only; no binary Storage port in A.
- infrastructure: fail-closed Supabase metadata adapter/parser.
- cloud persistence/RLS: `media`, `media_links`, same-project Venue link, direct `media.read`/`media.write` RLS, protected atomic create/replay RPC.
- local/offline: none.
- remote image fetching/rendering: none.

## Verification plan

### Domain/application/provider

- exact `image` media type and category allowlist;
- HTTPS-only remote URL validation;
- javascript/data/file/credentials/localhost/private-IP-literal rejection;
- no command-generated private query/referrer payload;
- remote row cannot claim `storage_path`, binary hash/MIME/size/dimensions or derivative state;
- bounded source/caption metadata;
- stable create/replay equality;
- provider rejects missing/substituted/wrong-project/wrong-link/malformed rows and duplicates.

### Database / RLS / adversarial

- table shapes/constraints and same-project relationships;
- only the frozen A remote-reference state can be created through A command;
- media + Venue gallery link created atomically;
- same IDs/same payload replay returns one semantic result;
- same-project reused ID/different payload typed conflict;
- foreign-project UUID collision non-disclosing;
- owner/editor write according to `media.write`; viewer read only according to role matrix;
- anon/outsider/project-B/revoked denied;
- direct cross-project media/link injection denied;
- client cannot mutate project/audit/storage/private-upload fields through the remote-reference command;
- protected function grants/search_path/live authorization directly asserted.

### Acceptance responsibility

- Persist a synthetic Venue remote marketing image with source provenance and same-project gallery link; verify it remains a remote reference with no private Storage path/binary claims.
- Verify an exact known cross-project UUID/path relationship cannot be used to read/write/link another project's media.
- Verify the URL policy rejects active/local-network forms and never appends private project data.
- Do **not** claim full `ACC-057` until WP-2.11 proves actual rendering uses no-referrer/fallback behavior.
- Do **not** claim `ACC-055`/`ACC-056`; those belong to WP-2.8B.

## Pass A — IMPLEMENT

Not started. Entry requires a separate exact-head green `PLANNED → READY` transition, followed by a separate exact-head green `READY → IN_PROGRESS` transition. First product-code change must be red-first evidence for the absent media/media-link command boundary.

## Pass B — ADVERSARIAL REVIEW

Not started.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started.
