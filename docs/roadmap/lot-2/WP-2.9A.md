# WP-2.9A — Venue-linked private document foundation

## Identity

- Work Packet ID: `WP-2.9A`
- Lot: `2`
- Name: Venue-linked private document foundation
- State: `REVIEW_FAILED`
- Current pass: `B-ADVERSARIAL-REVIEW — FAILED / remediation next`
- Primary bounded context: Documents — private PDF metadata, Venue links, Storage lifecycle and recoverable metadata
- Branch/PR: `lot-2/venues-core` / Lot-2 integration PR not opened yet
- FIR: `#17 / FTR-089`
- Size: **10 points**; explicit cohesion review **PASS**

## Activation / governance evidence

The former monolithic WP-2.9 combined two independently reviewable persistence/security boundaries and was conservatively scored at **12 points**. It was split before code under `AI-LOT-ORCHESTRATION.md` into:

1. **WP-2.9A** — private Documents + `document_links` + Storage lifecycle;
2. **WP-2.9B** — project Tags + Venue `entity_tags` basics.

No product responsibility was dropped. Default sequencing remains `WP-2.9A → WP-2.9B → WP-2.10`.

Evidence:

- split/specification freeze: `40f17aba802e7faed9eade6096e2f3629fc80654` / CI `34788217062` — **5/5 SUCCESS**, clean-checkout included;
- READY governance: `0b30b045ef05c318d25c92abb379364f95705c4e` / CI `34788670807` — **5/5 SUCCESS**, clean-checkout included;
- A-IMPLEMENT governance: `f5a77c72cf5f28bccd823c7cdc78b01531b3b265` / CI `34789115986` — **5/5 SUCCESS**, clean-checkout included;
- RED-first: `9322915252925d3f75f5a224a82f9d391ccfec9d` / CI `34789545716` — expected RED limited to the three frozen document-boundary assertions;
- Pass-A implementation/evidence HEAD: `e533b5c53d1be074216ccaa92f74281b425de770` / CI `34826553890` — **5/5 SUCCESS**, clean-checkout included; Core reports **152 test files / 1465 tests / 100% statements, branches, functions and lines**.

WP-2.9B remains `PLANNED / AFTER A` and cannot activate while A is active.

## Assigned current-Lot responsibility

WP-2.9A owns the Lot-2 Venue-document foundation of:

- `FTR-089` — private document upload/download/link/provenance;
- `MED-001` — Documents remain semantically distinct from Media;
- `MED-002` — uploaded/imported file content is never executed as application code;
- `MED-003` — type/size/MIME/signature validation follows file-security policy;
- `MED-008` — source/provenance can be retained;
- `MED-010` — private file access does not rely on obscurity;
- `PRD-008` only for the current-Lot ability to link a document to a Venue;
- packet-applicable authorization/file/security controls.

`MED-009` remains formally owned by FTR-092. WP-2.9A nevertheless inherits the mandatory upload-safety invariant that an interrupted/incomplete document upload must never appear committed/valid. This is a verification obligation, not a reassignment of MED-009 ownership.

### Exact user job

An authorized couple member can retain a private PDF relevant to a Venue, preserve provenance and private filename metadata, link the one logical document to one or more same-project Venues without duplicating bytes, download it only through live authorization, soft-delete it from ordinary results, and restore the same logical record later.

## Persisted model

### `documents`

A forward-only migration materializes the frozen V1 `documents` table with at minimum:

- `id uuid` primary key plus unique `(project_id,id)` candidate key;
- `project_id uuid`;
- `document_type text`, `title text`;
- `storage_path text null`, `remote_url text null`;
- `original_filename text null`, `mime_type text null`, `size_bytes bigint null`, `sha256 text null`;
- `classification text`, `upload_status text`;
- `source_id uuid null`, same-project when present;
- standard creator/updater/revision audit fields;
- `deleted_at timestamptz null` for recoverable metadata deletion.

A creates only ordinary private-document rows:

- `remote_url is null`;
- `storage_path` is server-derived;
- `classification = 'private'`;
- `upload_status in ('pending','ready')`;
- optional `source_id` references a same-project retained Source.

Sensitive-document classification/contract-review semantics remain downstream and are not folded into ordinary `documents.read`.

### `document_links`

WP-2.9A materializes generic link persistence but exposes only the Lot-2 Venue target:

- stable UUID identity;
- `project_id`;
- `document_id` same-project composite FK;
- public boundary `target_type = 'venue'`;
- `target_id` must identify an existing same-project Venue;
- `relationship_type` remains null in this packet;
- creator metadata.

A ready document may have several same-project Venue links. Adding a link never duplicates the binary.

## File and Storage contract

### Enabled binary

PDF only:

- extension `.pdf`, case-insensitive;
- declared MIME exactly `application/pdf`;
- magic begins with `%PDF-`;
- size `1..25,000,000` bytes;
- original filename `1..512` Unicode scalar values with unsafe controls/path separators rejected or normalized by the shared filename policy;
- SHA-256 exactly 64 lowercase hex characters over exact uploaded bytes.

JPEG/JPG/PNG/WebP private imagery remains Media. HEIC/HEIF and office formats remain disabled. HTML/JavaScript/SVG active content, executables and macro execution are forbidden. PDF bytes are treated as untrusted binary; no active inline preview is introduced by A. Download uses safe attachment/content-disposition semantics.

### Bucket/path

- accepted private bucket: `project-private`;
- canonical object path: exactly `<project_id>/documents/<document_id>/original`;
- filename/title/Venue name never appears in Storage identity;
- path knowledge grants no authority;
- ready bytes are immutable; overwrite/upsert/rename is denied.

## Lifecycle and recovery

```text
absent → pending → ready
           └────→ absent   (clean abandon only after exact Storage absence)
```

- `pending` is reservation/recovery state, never committed truth;
- ordinary document reads/downloads never expose pending as ready;
- writers may inspect exact pending state/object for recovery;
- finalize verifies the exact reserved Storage object before `pending → ready`;
- pending cleanup deletes the exact pending object first, verifies delete/not-found, then removes/abandons metadata/link state;
- if Storage absence cannot be confirmed, recovery evidence remains;
- no scheduler or raw-bucket reconciliation is assumed.

### Ready soft-delete / restore

- active ready: `deleted_at is null`;
- recoverably deleted: `deleted_at is not null`;
- soft-delete does not delete/overwrite ready binary or retained Venue links;
- restore clears `deleted_at` on the same document UUID;
- active lists exclude deleted rows both at query and provider-parser boundaries;
- hard delete / purge / trash UX are downstream.

Same-state delete/restore retry is no-op success. An actual transition is optimistic-revision protected and increments server revision/audit once.

## Protected command family

Direct client INSERT/UPDATE/DELETE on `documents` and `document_links` is not the mutation security model.

Public action allowlist:

- `reserve_upload`;
- `finalize_upload`;
- `abandon_upload`;
- `link_venue`;
- `unlink_venue`;
- `soft_delete`;
- `restore`.

The implementation may use one public RPC action union or a small cohesive family, but must preserve one reviewable authorization/replay boundary and no generic mutation escape hatch.

The boundary must:

1. require authenticated identity;
2. validate/lock target project and live `documents.write` for mutations;
3. derive canonical Storage path server-side;
4. validate same-project document/source/Venue/link relationships;
5. protect project/audit/revision/path/hash identity from caller substitution;
6. serialize conflicting same-document operations;
7. return typed receipts parsed fail-closed by provider adapters;
8. map absent/foreign identity generically without UUID/path oracle behavior;
9. make stable-identity/action retries idempotent.

### Download/read authorization

- ordinary metadata/list read: live `documents.read`;
- ready active binary SELECT/signed access: live `documents.read` plus exact DB path binding;
- pending recovery: live `documents.write`;
- soft-deleted ready binary recovery: live `documents.write` until later trash UX;
- anon/outsider/project-B/revoked users denied;
- A creates only ordinary `classification='private'` rows.

Signed URLs, if used, are short-lived provider artifacts and never persisted as identity.

## Provenance and duplicate safety

- optional `source_id` is same-project provenance and survives delete/restore;
- private filename never enters Storage path/log/public artifact;
- exact SHA-256 may support same-project duplicate warning/detection;
- equal hash never grants access and never auto-merges/replaces document/link identity;
- cross-project hash equality is never disclosed.

Automatic deduplication is not required.

## Authorization / security evidence required

At minimum A must directly evidence packet-applicable forms of:

- `AUTHZ-001`, `002`, `005`, `006`, `007`, `008`, `012`, `018`, `019`, `020`;
- `SEC-AUTH-012`, `SEC-AUTH-013`;
- applicable `SEC-AUTHZ-001..009`;
- `SEC-VAL-001..004`, `SEC-VAL-008`;
- `SEC-INJ-001`, `SEC-INJ-002`;
- `SEC-FILE-001`, `002`, `003`, `004`, `008`, `009`;
- `SEC-VER-001`, `002`, `005`, `006`.

Direct allow/deny DB and Storage evidence covers owner/editor/viewer as applicable, anon, outsider, project-B and revoked/downgraded identities. Cross-project links/path access and direct protected-column mutation must fail.

## Explicitly out of scope

- FTR-090 / MED-011 document version lineage;
- FTR-091 / MED-012 contract-readiness/review checklist;
- sensitive-document workflows;
- OCR/full-text indexing;
- active inline PDF preview;
- non-Venue `document_links` target types;
- Inbox/file-capture UX;
- generic Tags/entity tagging — WP-2.9B;
- trash UI/permanent purge/background scheduler;
- offline pending-file queue — later packets/Lot 10;
- import/export/backup binary packaging;
- real/private wedding data import — Lot 12.

## Expected vertical slice

- UI/routes: none; presentation is WP-2.11;
- domain: PDF validation and document/link/lifecycle invariants;
- application: typed Document service/port reserve/finalize/recovery/link/list/download-auth/delete/restore methods;
- infrastructure: Supabase document metadata/RPC adapter, fail-closed receipts and private Storage adapter/reuse;
- cloud: forward-only `documents`/`document_links` migration, RLS/grants/Storage policies and protected command family;
- local/offline: none.

## Verification plan

- PDF extension/MIME/signature/size/name/hash boundaries;
- reserve → exact upload → finalize → active list/read/download;
- interruption before upload and after Storage-before-finalize recovery;
- exact pending cleanup and no committed visibility before finalize;
- ready overwrite/upsert/rename/direct binary deletion denied;
- one binary linked to multiple same-project Venues without duplication;
- cross-project Venue/source/link injection denied;
- provenance retained;
- soft-delete hides ordinary list/download while preserving row/link/object; restore returns identical identity/path;
- stale real transition rejected; same-state retry idempotent;
- malformed/substituted provider receipts fail closed;
- owner/editor/viewer allow/deny plus anon/outsider/project-B/revoked/downgraded denial;
- direct protected table/project/audit mutation denied;
- private filename absent from Storage path/privacy-safe artifacts;
- accepted WP-2.8 behavior remains green.

## Pass A closure

Pass A is **complete** on implementation/evidence HEAD `e533b5c53d1be074216ccaa92f74281b425de770` with exact-head CI `34826553890` **5/5 SUCCESS**, including clean-checkout `npm run verify`.

The frozen RED-first contract remains byte-for-byte authoritative and was satisfied rather than weakened. Core quality/security reports 152 test files / 1465 tests passed and 100% statements/branches/functions/lines coverage. DB/RLS, Browser E2E + mutation, privacy-safe preview and clean-checkout verification are all green.

## Pass B — adversarial review findings

### WP29A-AR-001 — MAJOR — missing Document read/list/download application boundary

**Finding.** The frozen packet requires the exact user job to download a ready private PDF only through live authorization, and its expected application slice explicitly includes typed `list/download-auth` behavior. The Pass-A implementation contains mutation lifecycle/upload/recovery/link/delete/restore code and DB/Storage read policies, but no Document read/list query port/service and no authorized Document download adapter/service. A recursive inspection of the branch tree and the RED→Pass-A implementation diff confirms there is no hidden Document query/download module.

**Impact.** The database and Storage policies can authorize direct provider access, but the application foundation promised by WP-2.9A cannot itself list/read a ready Document or obtain its bytes through a typed application boundary. WP-2.11 owns presentation/workspace surfaces; it does not own this missing backend/application foundation. Therefore FTR-089's current-Lot download/read job and the verification-plan path `finalize → active list/read/download` are not yet implemented end-to-end.

**Classification.** `MAJOR`. Pass C is blocked.

**Required remediation.** Add the narrowest cohesive typed Document read/list/download-auth foundation consistent with existing architecture and live server/RLS authority; prove active-ready visibility, pending/deleted exclusion for ordinary reads, exact DB-path binding before binary access, project/non-member/revoked denial, provider-response fail-closed behavior and safe download metadata. No UI, inline preview, new permission key, non-Venue link type or WP-2.9B scope may be introduced.

### Reviewed non-finding — binary validation boundary parity

Pass B also challenged whether an authorized writer could bypass the TypeScript PDF validator by calling Storage/RPC directly. The current DB finalizer verifies the exact reserved object exists rather than re-hashing/re-sniffing bytes server-side. This is not classified as a new WP-2.9A defect because the already-accepted WP-2.8B private-media foundation deliberately uses the same V1 trust split: application byte validation plus exact pending reservation/Storage RLS/finalization. Reopening that shared architecture would require a broader architecture/security decision rather than inventing a packet-local rule during review.

## Current gate

WP-2.9A is **REVIEW_FAILED** because `WP29A-AR-001` is an unresolved MAJOR finding.

Next permitted action is remediation. When remediation actively begins, transition the packet back to `IN_PROGRESS` with an explicit remediation pass, add failing evidence for the missing read/list/download boundary before implementation where practical, then rerun all affected verification. After remediation is green, WP-2.9A must return to a fresh adversarial Pass B; the current Pass-A/review evidence cannot be used to skip that review.

WP-2.9B remains inactive until WP-2.9A is accepted.

Any implementation need that expands public capability, changes the frozen requirements, introduces a new permission key, or pushes the approved cohesive surface beyond 10 points requires a stop/rescore before code proceeds.
