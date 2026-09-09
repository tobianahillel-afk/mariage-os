# WP-2.8A — Venue remote-image metadata and links

## Identity

- Work Packet ID: `WP-2.8A`
- Lot: `2`
- Name: Venue remote-image metadata and links
- State: `READY`
- Current pass: `A-READY`
- Primary bounded context: Documents/Media metadata for Venue remote image references
- Branch/PR: `lot-2/venues-core` / PR not opened yet

## Split decision

The original WP-2.8 packet is split before product code because combining remote-reference metadata/link persistence, private Storage upload/original/derivative/orphan lifecycle and recoverable metadata deletion would exceed the normative packet sizing threshold and mix independently reviewable failure/security boundaries.

Product scope is unchanged:

- WP-2.8A owns remote-image metadata + Venue linking + remote URL privacy/security foundation;
- WP-2.8B owns private archived image bytes, file validation, originals/derivatives/hash and interrupted/orphan recovery;
- WP-2.8C owns recoverable soft-delete/restore of A's remote-media metadata without touching binary content;
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
- foundation responsibility toward `ACC-057` and `ACC-058` without claiming later DOM rendering, deletion lifecycle or private-upload acceptance.

### Exact WP-2.8A responsibility

- `media` metadata persistence for Venue remote image references;
- `media_links` persistence for same-project Venue gallery association, with the physical source FK frozen as `media_links.media_id`;
- exact Lot-2 media type/category boundaries from `MEDIA-LIFECYCLE-ADDENDUM.md`;
- remote row contract: HTTPS `remote_url`, no `storage_path`, no fetched binary metadata, `is_original=true`, `upload_status='ready'`;
- exact user-controlled metadata bounds: `remote_url` 1..2048 Unicode scalar values, optional `source_page_url` max 2048, optional canonical caption max 5000;
- no `media.source_id` and no caller-owned `source_id` parameter in this packet;
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
- `LOT-2-COVERAGE-MATRIX-ADDENDUM.md` for the corrected WP-2.8 responsibility decomposition;
- `DOCUMENTS-MEDIA.md`, `DOCUMENTS.md`;
- `RLS-MATRIX-V1.md`, `RLS-PERMISSION-MAPPING.md`, `ROLE-PERMISSION-MATRIX.md`;
- `STORAGE-RLS.md`, `EXTERNAL-CONTENT-SECURITY.md`, `PRIVACY.md`, `FILE-SECURITY.md` where applicable;
- applicable authorization/validation/provider-verification controls already used by prior Lot-2 packets.

### Explicitly out of scope

- private binary upload/archive — WP-2.8B;
- actual file MIME/signature/hash verification — WP-2.8B;
- thumbnail/preview generation — WP-2.8B;
- interrupted/private orphan Storage recovery — WP-2.8B;
- remote-reference metadata soft-delete/restore — WP-2.8C;
- global 30-day trash purge/Empty-trash lifecycle;
- Venue gallery UI/order/main-photo selection/DOM `<img>` rendering — WP-2.11;
- local/offline media queue or own-visit capture — WP-2.12/Lot 10;
- Documents/version/supersession — WP-2.9 and later document work;
- generic non-Venue polymorphic media targets;
- server-side image proxy, remote image fetching or image transformation provider;
- explicit `sources` relationship/source-id schema for media;
- Lot-4 importer/apply behavior.

## Dependency / sequencing

- WP-2.1 Venue identity/project isolation: **ACCEPTED**.
- Lot-1 WP-1.9 private Storage authorization foundation: **ACCEPTED**.
- WP-2.7: **ACCEPTED / COMPLETE**; final status-governance head `db1dae663129c3281618c932fa7f5a8184a5a2ad`, CI `34377221997` — **5/5 SUCCESS**.
- Missing `docs/security/STORAGE-RLS.md` governance prerequisite: **CLOSED / VERIFIED** by `54fb49d11e16f3945eb2cb820e1f832768711e7e` / `34378129764` — **5/5 SUCCESS**.
- Previous split/lifecycle specification gate: `cb4c95120c976d2238a57a02aa874867ff9bcca3` / `34379734883` — **5/5 SUCCESS**.
- Status-board exact-head gate before this repair: `5d0fa2e57a340450fa9431cc3057709cdc2b655a` / `34383169499` — **5/5 SUCCESS**, including 40/40 rerun E2E, mutation and clean-checkout verify.
- Pre-READY contract/coverage repair: **CLOSED / VERIFIED** by `8908eecd3eb25e89cf0b70937722f0ccf9257bb4` / `34390723409` — **5/5 SUCCESS**.
- WP-2.8B and WP-2.8C remain PLANNED and cannot run concurrently with WP-2.8A.
- This `PLANNED → READY` governance transition must itself become exact-head **5/5 SUCCESS** before A may transition separately to `IN_PROGRESS`.

## Activation specification freeze

`MEDIA-LIFECYCLE-ADDENDUM.md` freezes the portion needed by this packet so Pass A does not invent values from unconstrained `text` columns:

- `media_type='image'` for Lot-2 venue media;
- exact venue image-category allowlist;
- remote-reference row uses `remote_url`, null `storage_path`, `derivative_of_id=null`, `is_original=true`, `upload_status='ready'`;
- WP-2.8A does not fetch remote bytes, so binary-derived metadata is null;
- `remote_url` is HTTPS and bounded to 2048 Unicode scalar values; `source_page_url` is optional public provenance, bounded to 2048; caption is trimmed/empty→null and bounded to 5000; over-limit input is rejected without truncation;
- `media_links` source object column is physically `media_id uuid not null` with composite same-project FK to `media`;
- Venue link is `target_type='venue'`, `relationship_type='gallery'` and same-project validated;
- `source_id` is not part of A's media schema or command payload;
- private-upload lifecycle states remain explicitly deferred to the WP-2.8B stop-condition;
- recoverable remote-reference soft-delete/restore is explicitly assigned to WP-2.8C rather than added to A.

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

The packet deliberately excludes private Storage bytes/file validation/derivatives/orphan cleanup and remote metadata soft-delete/restore; including either additional lifecycle responsibility would exceed 10 or mix a separate failure boundary.

## Expected vertical slice

- UI/route: none.
- domain: image type/category normalization, bounded remote/source URL policy, bounded caption normalization, remote-reference value/invariant/replay equality.
- application: `MediaService` remote Venue-reference create/replay + active Venue remote-media list query under `application/documents/`.
- ports: remote-media create/list metadata port only; no binary Storage port and no lifecycle delete/restore port in A.
- infrastructure: fail-closed Supabase metadata adapter/parser.
- cloud persistence/RLS: `media`, `media_links`, same-project Venue link, direct `media.read`/`media.write` RLS, protected atomic create/replay RPC.
- local/offline: none.
- remote image fetching/rendering: none.

## Verification plan

### Domain/application/provider

- exact `image` media type and category allowlist;
- HTTPS-only remote URL validation with accepted 2048-code-point boundary;
- optional source-page URL accepted only under its public navigation/source URL contract and 2048-code-point boundary;
- caption trim/empty→null/max-5000 behavior and over-limit rejection without truncation;
- javascript/data/file/credentials/localhost/private-IP-literal rejection for remote image URL;
- no command-generated private query/referrer payload;
- remote row cannot claim `storage_path`, binary hash/MIME/size/dimensions or derivative state;
- A does not accept or persist `source_id`;
- stable create/replay equality includes canonical caller-owned Venue/category/URL/source-page/caption payload;
- provider rejects missing/substituted/wrong-project/wrong-link/malformed rows and duplicates.

### Database / RLS / adversarial

- table shapes/constraints and same-project relationships, including physical `media_links.media_id` composite FK;
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

- Persist a synthetic Venue remote marketing image with source-page provenance and same-project gallery link; verify it remains a remote reference with no private Storage path/binary claims.
- Verify exact 2048/2048/5000 user-input limits at domain and PostgreSQL command boundaries.
- Verify an exact known cross-project UUID/path relationship cannot be used to read/write/link another project's media.
- Verify the URL policy rejects active/local-network forms and never appends private project data.
- Do **not** claim remote-reference deletion/restore acceptance; that belongs to WP-2.8C.
- Do **not** claim full `ACC-057` until WP-2.11 proves actual rendering uses no-referrer/fallback behavior.
- Do **not** claim `ACC-055`/`ACC-056`; those belong to WP-2.8B.

## Pass A — IMPLEMENT

Not started. WP-2.8A is READY, but product implementation remains prohibited until this READY governance commit is exact-head green and a separate `READY → IN_PROGRESS` governance transition is itself exact-head green. The first product-code change must then be red-first evidence for the absent media/media-link command boundary.

## Pass B — ADVERSARIAL REVIEW

Not started.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started.
