# WP-2.9A — Venue-linked private document foundation

## Identity

- Work Packet ID: `WP-2.9A`
- Lot: `2`
- Name: Venue-linked private document foundation
- State: `PLANNED`
- Current pass: `PLAN / ACTIVATION SPECIFICATION FREEZE`
- Primary bounded context: Documents — private PDF metadata, Venue links, Storage lifecycle and recoverable metadata
- Branch/PR: `lot-2/venues-core` / Lot-2 integration PR not opened yet

## Why the original WP-2.9 is split

Activation revalidation of the former monolithic `WP-2.9 — venue document/tag/link basics` found that it combines two independently reviewable persistence/security boundaries: private Documents and generic Tags. A conservative orchestration score for the unsplit packet is already **12 points** before counting any extra implementation detail:

| Complexity source | Points |
|---|---:|
| meaningfully changed Documents/Tags bounded responsibility | 3 |
| four new persistent tables (`documents`, `document_links`, `tags`, `entity_tags`) | 4 |
| forward-only migration family | 1 |
| protected private-file lifecycle capability | 2 |
| new RLS/privileged authorization boundary | 2 |
| **Conservative total** | **12** |

`AI-LOT-ORCHESTRATION.md` requires packets above 10 points to split unless splitting would make safety materially worse. There is no such atomicity reason here: tags do not participate in document binary commit/recovery. The original WP-2.9 is therefore decomposed before READY into:

1. **WP-2.9A** — private Documents + `document_links` + Storage lifecycle;
2. **WP-2.9B** — project Tags + Venue `entity_tags` basics.

No product responsibility is dropped. Default sequencing is `WP-2.9A → WP-2.9B → WP-2.10`.

## Assigned current-Lot responsibility

### Feature / requirements

WP-2.9A owns the Lot-2 Venue-document foundation of:

- `FTR-089` — private document upload/download/link/provenance;
- `MED-001` — Documents remain semantically distinct from Media;
- `MED-002` — uploaded/imported file content is never executed as application code;
- `MED-003` — type/size/MIME/signature validation follows file-security policy;
- `MED-008` — source/provenance can be retained; this requirement is formally mapped to FTR-089 and was missing from the old Lot-2 WP-2.9 row;
- `MED-010` — private file access does not rely on obscurity;
- `PRD-008` only for the current-Lot ability to link a document to a Venue;
- packet-applicable authorization/file/security controls.

`MED-009` remains formally owned by FTR-092, already accepted for the Lot-2 private-media slice. WP-2.9A nevertheless inherits the same mandatory upload-safety invariant from `DOCUMENTS.md`/`FILE-SECURITY.md`: an interrupted/incomplete document upload must never appear as committed/valid. This is a packet-specific verification obligation, not a reassignment of MED-009 ownership.

### Exact user job

An authorized couple member can retain a private PDF relevant to a Venue, preserve its provenance and private filename as metadata, link it to one or more same-project Venues without duplicating the binary, download it only through live authorization, temporarily remove the ready document from ordinary results and restore the same logical record later.

## Persisted model

### `documents`

A new forward-only migration materializes the frozen V1 `documents` table with at minimum:

- `id uuid` primary key and unique `(project_id,id)` candidate key;
- `project_id uuid` same-project root;
- `document_type text`;
- `title text`;
- `storage_path text null`;
- `remote_url text null`;
- `original_filename text null`;
- `mime_type text null`;
- `size_bytes bigint null`;
- `sha256 text null`;
- `classification text`;
- `upload_status text`;
- `source_id uuid null`, same-project when present;
- standard creator/updater/revision audit fields;
- `deleted_at timestamptz null` for recoverable metadata deletion.

WP-2.9A creates only the A-style private-document shape:

- `remote_url is null`;
- `storage_path` is the server-derived canonical private path;
- `classification = 'private'`;
- `upload_status in ('pending','ready')`;
- `source_id`, when supplied, references a same-project retained Source.

Sensitive-document classification/contract-review semantics are not silently folded into ordinary `documents.read`; they remain downstream under the frozen sensitive-document/contract-review permissions and later document lots.

### `document_links`

WP-2.9A materializes generic link persistence but exposes only the Lot-2 Venue target:

- stable UUID identity;
- `project_id`;
- `document_id` same-project composite FK;
- `target_type = 'venue'` in the Lot-2 public boundary;
- `target_id` validated as an existing same-project Venue;
- `relationship_type` remains null in this packet; no undocumented relationship vocabulary is invented;
- creator metadata.

A ready document may have several same-project Venue links. A single binary is never duplicated merely because a second Venue link is added.

## File and Storage contract

### Enabled document binary

WP-2.9A enables **PDF only** for the ordinary Documents boundary. This is deliberate semantic separation:

- PDF → `documents` in this packet;
- JPEG/JPG/PNG/WebP private imagery remains the accepted Media boundary;
- HEIC/HEIF and other document/office formats remain disabled until a separately reviewed packet explicitly enables them;
- HTML, JavaScript, SVG-as-active-content, executables and macro execution remain forbidden.

Frozen PDF validation:

- extension `.pdf` case-insensitive;
- declared MIME exactly `application/pdf`;
- binary signature/magic begins with `%PDF-`;
- byte size `1..25,000,000`;
- original filename `1..512` Unicode scalar values with unsafe control characters/path separators rejected or normalized according to the shared filename validator;
- SHA-256 exactly 64 lowercase hexadecimal characters over the exact uploaded bytes.

PDF bytes are treated as untrusted binary. WP-2.9A does not parse/execute embedded active content and does not add an inline active preview surface. Download uses safe attachment/content-disposition semantics.

### Bucket/path

- bucket remains the accepted private bucket `project-private`;
- canonical object path is exactly `<project_id>/documents/<document_id>/original`;
- raw filename/title/Venue name never appears in the Storage path;
- path knowledge never grants authority;
- ready original bytes are immutable; overwrite/upsert/rename is denied.

## Lifecycle and recovery

### Upload state

```text
absent → pending → ready
           └────→ absent   (clean abandon only after exact Storage absence)
```

- `pending` is reservation/recovery state, not committed document truth;
- ordinary document reads/downloads never present pending rows as ready;
- writers may inspect exact pending state/object for recovery;
- finalize verifies the exact reserved Storage object before `pending → ready`;
- pending cleanup deletes the exact pending object first, verifies delete/not-found, then removes/abandons metadata/link state;
- if Storage absence cannot be confirmed, pending recovery evidence remains;
- no scheduler or raw bucket reconciliation is assumed.

### Ready soft-delete / restore

Ready document metadata follows `DELETION-RETENTION.md`:

- `deleted_at is null` → active ready document;
- `deleted_at is not null` → recoverably deleted metadata;
- soft-delete does **not** delete/overwrite the ready binary or its retained Venue links;
- restore clears `deleted_at` on the same document UUID;
- ordinary active Venue-document list excludes deleted rows at both query and provider-parser boundaries;
- hard delete / 30-day purge / Empty-trash UX are downstream and not implemented by A.

A same-state delete/restore retry is a no-op success; an actual state change is optimistic-revision protected and increments server revision/audit once.

## Protected command family

One narrow Documents command family owns mutations; direct client INSERT/UPDATE/DELETE on `documents` and `document_links` is not the security model.

Public action allowlist for WP-2.9A:

- `reserve_upload`;
- `finalize_upload`;
- `abandon_upload`;
- `link_venue`;
- `unlink_venue`;
- `soft_delete`;
- `restore`.

The implementation may choose one public RPC with an action union or a small cohesive function family, but before Pass A begins the READY contract must preserve one reviewable authorization/replay boundary with these exact capabilities and no hidden generic table mutation escape hatch.

The command boundary must:

1. require authenticated identity;
2. validate/lock the target project and live `documents.write` for mutations;
3. derive canonical Storage path server-side;
4. validate same-project document/source/Venue/link relationships;
5. protect project/audit/revision/path/hash identity from caller substitution;
6. serialize conflicting same-document operations;
7. return typed receipts parsed fail-closed by the provider adapter;
8. map absent/foreign identity generically without turning UUID/path knowledge into an oracle;
9. make retries idempotent where the same stable identities/action are replayed.

### Download/read authorization

- ordinary metadata/list read requires live `documents.read`;
- ready active binary SELECT/signed access requires live `documents.read` and exact DB path binding;
- pending recovery access requires live `documents.write`;
- soft-deleted ready binary recovery access requires live `documents.write` until a downstream trash surface is explicitly implemented;
- anon/outsider/project-B/revoked users are denied;
- sensitive-document permission is not bypassed because A creates only ordinary `classification='private'` rows.

Signed URLs, if used, are short-lived provider artifacts and are never persisted as document identity.

## Provenance and duplicate safety

- `source_id`, when present, is a same-project provenance link and survives soft-delete/restore;
- no private filename is copied into paths/logs/public artifacts;
- exact SHA-256 may be used for same-project duplicate warning/detection;
- equal hash never authorizes access and never auto-merges/replaces logical document/link identity;
- cross-project hash equality is never disclosed.

A duplicate-warning receipt/query is acceptable only if project-scoped and detect-only; automatic deduplication is not required by this packet.

## Authorization/security controls

At minimum A must directly evidence the packet-applicable forms of:

- `AUTHZ-001`, `AUTHZ-002`, `AUTHZ-005`, `AUTHZ-006`, `AUTHZ-007`, `AUTHZ-008`, `AUTHZ-012`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020`;
- `SEC-AUTH-012`, `SEC-AUTH-013`;
- applicable `SEC-AUTHZ-001..009`;
- `SEC-VAL-001..004`, `SEC-VAL-008`;
- `SEC-INJ-001`, `SEC-INJ-002`;
- `SEC-FILE-001`, `SEC-FILE-002`, `SEC-FILE-003`, `SEC-FILE-004`, `SEC-FILE-008`, `SEC-FILE-009`;
- `SEC-VER-001`, `SEC-VER-002`, `SEC-VER-005`, `SEC-VER-006`.

Direct allow/deny DB and Storage evidence covers owner/editor/viewer as applicable, anon, outsider, project-B and revoked/downgraded identities. Cross-project document links/path access and direct protected-column mutation must fail.

## Explicitly out of scope

- document supersession/version lineage (`FTR-090`, `MED-011`) — later document lots;
- quote/contract readiness/review checklist (`FTR-091`, `MED-012`) — later lots;
- sensitive-document classification workflows;
- OCR/full-text indexing;
- inline active PDF preview;
- vendor/budget/decision/task/interaction target types — later owning lots extend generic `document_links`;
- unclassified Inbox/file-capture UX;
- generic Tags/entity tagging — WP-2.9B;
- trash UI, permanent purge and background scheduler;
- offline pending-file queue — WP-2.10/WP-2.12/Lot 10;
- import/export/backup binary packaging;
- real wedding/private candidate data import — Lot 12.

## Sizing / cohesion review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| Documents private-binary bounded responsibility | 1 | 3 | 3 |
| new persistent tables (`documents`, `document_links`) | 2 | 1 | 2 |
| forward-only document migration family | 1 | 1 | 1 |
| protected document lifecycle capability family | 1 | 2 | 2 |
| new DB/Storage authorization boundary | 1 | 2 | 2 |
| **Total** |  |  | **10** |

A 10-point packet requires explicit cohesion review. **Cohesion: PASS.** Splitting binary reservation/finalization from `documents`/`document_links` would create a partially implemented private-file truth boundary and duplicate the recovery/RLS review. The two tables and Storage lifecycle are one atomic review surface. Tags are independent and are therefore split into WP-2.9B.

## Expected vertical slice

- UI/routes: none; presentation remains WP-2.11.
- domain: private PDF validation, document/link/lifecycle invariants under existing Documents context.
- application: typed Document service/port methods for reserve/finalize/recovery/link/list/download authorization/soft-delete/restore.
- infrastructure: Supabase document metadata/RPC adapter, fail-closed receipts, private Storage adapter/reuse.
- cloud: forward-only `documents`/`document_links` migration, RLS/grants/Storage policies and protected command family.
- local/offline: none.

## Verification plan

- valid PDF boundary and extension/MIME/signature/size/name/hash rejection cases;
- reserve → exact upload → finalize → active list/read/download;
- interrupted before upload and after Storage-before-finalize recovery;
- exact pending cleanup and no committed visibility before finalize;
- ready overwrite/upsert/rename/direct binary deletion denied;
- one ready binary linked to multiple same-project Venues without duplicate object;
- cross-project Venue/source/link injection denied;
- provenance/source retained;
- soft-delete hides active list/download for ordinary reader, keeps row/link/object; restore returns identical document/link/path;
- stale real transition rejected; same-state retry idempotent;
- provider receipt substitution/malformed rows fail closed;
- owner/editor/viewer direct allow/deny according to `documents.read/write`; anon/outsider/project-B/revoked/downgraded denied;
- direct table protected-column/project/audit mutation denied;
- private filename absent from Storage path and privacy-safe artifact/log checks;
- accepted WP-2.8 media behavior remains green.

## Activation gate

This file is the **specification freeze**, not READY authorization.

After the split/freeze commit itself passes exact-head **5/5 SUCCESS** including clean-checkout:

1. create/update the FTR-089 FIR with this frozen slice;
2. perform a separate `PLANNED → READY / A-READY` governance commit for WP-2.9A;
3. require that READY head to pass exact-head 5/5;
4. only then may a separate `READY → IN_PROGRESS / A-IMPLEMENT` transition occur;
5. implementation begins RED-first after the IN_PROGRESS gate is green.

No WP-2.9A product code is authorized while this packet remains `PLANNED`.