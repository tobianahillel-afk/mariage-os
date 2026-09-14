# WP-2.9A — Venue-linked private document foundation

## Identity

- Work Packet ID: `WP-2.9A`
- Lot: `2`
- Name: Venue-linked private document foundation
- State: `REVIEW_PENDING`
- Current pass: `B-ADVERSARIAL-REVIEW`
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
- Pass-A implementation/evidence HEAD: `e533b5c53d1be074216ccaa92f74281b425de770` / CI `34826553890` — **5/5 SUCCESS**, clean-checkout included; Core reports **152 test files / 1465 tests / 100% statements, branches, functions and lines**;
- first Pass B found `WP29A-AR-001` — **MAJOR**; packet was durably recorded `REVIEW_FAILED` before remediation began;
- `WP29A-AR-001` remediation/evidence HEAD: `0072792d2eb67cce1bf98c4c312d9576feacc156` / CI `34836621394` — **5/5 SUCCESS**, clean-checkout included; Core reports **1539 tests / 100% statements, branches, functions and lines**;
- prior fresh Pass-B entry/governance HEAD: `78904546f3d8f4c15276a1bbe0825455f1262ee4` / CI `34837421096` — **5/5 SUCCESS**, clean-checkout included;
- prior fresh Pass B verified `WP29A-AR-001` as **CLOSED / VERIFIED**, but found `WP29A-AR-002` — **MAJOR**;
- durable AR-002 review-failure record HEAD: `9654c90ed7da27033d1f08d6effc6f47cac3dff9` / CI `34839274681` — **5/5 SUCCESS**, clean-checkout included;
- AR-002 remediation-transition governance HEAD: `b2e94c47f6d523adbf731fdd15cf796cca4c5ca9` / CI `34840180167` — **5/5 SUCCESS**, clean-checkout included;
- AR-002 focused RED HEAD: `2f06b7963e7d09e3c00264d3351745213a75f964` / CI `34840851767` — expected RED isolated to the contract-valid 512-Unicode-scalar read-parser regression; Core 1539 passing / 1 failing test and DB/RLS + Browser/mutation remained green;
- AR-002 remediation/evidence HEAD: `c78c22ff10c02cd6ab798a21e16b5c7acbc3effb` / CI `34841804605` — **5/5 SUCCESS**, clean-checkout included; Core reports **158 test files / 1546 tests / 100% statements, branches, functions and lines**;
- prior fresh Pass-B entry/governance HEAD: `c6c3afa56a66be97a590d4ce2b63932e6af5a46e` / CI `34842684753` — **5/5 SUCCESS**, clean-checkout included;
- prior fresh Pass B verifies the AR-002 read-parser remediation as **CLOSED / VERIFIED**, but finds `WP29A-AR-003` — **MAJOR / OPEN**;
- durable AR-003 review-failure record HEAD: `39ea780ac9ac724a9450a5ac8a5d0179986591ed` / CI `34844606086` — **5/5 SUCCESS**, clean-checkout included;
- AR-003 remediation-transition governance HEAD: `9b266ca9ba3c6e737525db03a5856c39d4f44ed7` / CI `34845524190` — **5/5 SUCCESS**, clean-checkout included;
- AR-003 focused RED HEAD: `79afff6c87f7033af008de3fb3b86c3ff833b15c` / CI `34846914610` — expected RED isolated to four Unicode-parity regressions; Core 1546 passing / 4 failing tests while static, DB/RLS and Browser/mutation remained green;
- AR-003 remediation/evidence HEAD: `fec1195dcbcfa15d97fe55b17a0fb5aad25b3813` / CI `34848872192` — **5/5 SUCCESS**, clean-checkout included; Core reports **159 test files / 1550 tests / 100% statements, branches, functions and lines**;
- packet is now **REVIEW_PENDING / B-ADVERSARIAL-REVIEW**. `WP29A-AR-003` remains **MAJOR / OPEN** until a fresh review independently verifies the remediation.

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

### WP29A-AR-001 — MAJOR / CLOSED / VERIFIED — missing Document read/list/download application boundary

**Original finding.** The frozen packet required the exact user job to download a ready private PDF only through live authorization, and its expected application slice explicitly included typed `list/download-auth` behavior. The Pass-A implementation contained mutation lifecycle/upload/recovery/link/delete/restore code and DB/Storage read policies, but no Document read/list query port/service and no authorized Document download adapter/service.

**Remediation.** The narrow typed ready-document list/read/download application/provider boundary was added and fully re-verified on `0072792d2eb67cce1bf98c4c312d9576feacc156` / CI `34836621394` — **5/5 SUCCESS**, clean-checkout included. It provides active-ready filtering, fail-closed provider parsing, exact DB-path-bound Storage access and safe attachment metadata without UI or a new permission.

**Fresh-review verdict.** `CLOSED / VERIFIED`. Fresh Pass B re-challenged the new service, parser, adapter, DB/RLS/Storage authority and focused tests. The original missing-boundary defect is no longer present.

### WP29A-AR-002 — MAJOR / CLOSED / VERIFIED — Unicode-scalar filename contract was broken by read parser

**Original finding.** The frozen file contract defines `original_filename` as `1..512` **Unicode scalar values**. The upload validator intentionally implements scalar-aware counting and the DB `char_length` constraint accepts the same persisted values. The read parser validated `original_filename` with JavaScript `value.length`, which counts UTF-16 code units, so a conforming astral-heavy filename could become unreadable after persistence.

**Remediation.** Upload and provider-read boundaries now share the scalar-aware safe private-document filename predicate; focused tests cover 512 accepted, 513 rejected, surrogate/control/path-separator rejection. Remediation `c78c22ff10c02cd6ab798a21e16b5c7acbc3effb` / CI `34841804605` is **5/5 SUCCESS**, clean-checkout included.

**Fresh-review verdict.** `CLOSED / VERIFIED` for the original read-parser defect. Fresh Pass B independently re-read the read parser and confirms it now delegates to the canonical scalar-aware filename predicate.

### WP29A-AR-003 — MAJOR / OPEN — Unicode-length parity in lifecycle receipts and bounded document metadata

**Original finding A — normal reserve flow broke on the frozen-valid filename boundary.** `parsePrivateDocumentReceipt()` validated `original_filename` using JavaScript `value.length <= 512`. `SupabasePrivateDocumentLifecycleAdapter.reserveUpload()` calls the public `manage_private_document(...)` RPC and then immediately parses its returned `document` through this receipt parser. The domain upload validator and PostgreSQL reservation accept `508 × 😀 + ".pdf"` as exactly 512 Unicode scalar values, while the old receipt parser treated it as more than 512 UTF-16 code units and threw `provider_response_invalid`.

**Original impact A.** A normal application upload could validate the PDF and successfully create the authorized pending DB reservation, then fail before Storage upload solely while parsing the valid reserve receipt. The user received a failure while a pending recovery row had been created.

**Original finding B — server/parser length-unit drift for bounded metadata.** The public authenticated `manage_private_document(...)` command boundary validates `document_type` and `title` with PostgreSQL `char_length` (1..120 and 1..500). The old `PrivateDocumentService`, `parsePrivateDocumentReceipt()` and `parseActivePrivateDocumentRow()` used JavaScript UTF-16 `value.length` for those same bounds, so server-valid Unicode text containing astral characters could be accepted/persisted by the authoritative protected RPC yet rejected by the typed provider foundation.

**Classification.** `MAJOR / OPEN` pending fresh verification. Pass C remains blocked until the fresh review closes this finding or records a new failure.

**Focused RED.** `79afff6c87f7033af008de3fb3b86c3ff833b15c` / CI `34846914610` cleanly demonstrated exactly four failures: 512-scalar reserve filename, scalar-limit reserve `document_type`/`title`, scalar-limit active read metadata, and service persistence of PostgreSQL-valid bounded metadata. Core had 1546 passing / 4 failing tests; static, DB/RLS and Browser/mutation remained green.

**Remediation.** The domain now exposes one scalar-aware bounded-text predicate that rejects malformed surrogate/control/trim/over-limit input. The service, lifecycle receipt parser and read parser reuse that predicate for `document_type`/`title`; the lifecycle receipt parser also reuses the canonical scalar-aware filename predicate and retains a separate `.pdf` extension check. No SQL/RLS/Storage policy, permission, file type or UI scope changed.

**Remediation evidence.** `fec1195dcbcfa15d97fe55b17a0fb5aad25b3813` / CI `34848872192` is **5/5 SUCCESS**, clean-checkout included. Core reports **159 test files / 1550 tests / 100% statements, branches, functions and lines**, including all four focused AR-003 regressions green.

**Fresh-review requirement.** The remediation evidence does not close AR-003 by itself. A new adversarial Pass B must independently re-challenge Unicode parity and the full packet surface before the finding can become `CLOSED / VERIFIED`.

### Reviewed non-findings

The prior fresh Pass B also re-challenged:

- exact project/document/path binding before Storage access;
- pending/deleted exclusion for ordinary reads;
- live `documents.read` RLS/Storage authority and writer-only recovery visibility;
- fail-closed malformed/substituted provider responses;
- safe attachment rather than inline rendering;
- per-download SHA behavior;
- the AR-002 read-parser remediation itself.

No additional BLOCKING/MAJOR issue was found in those areas. A per-download SHA recomputation is not required by the frozen V1 contract: SHA is retained for exact-byte identity/dedup/integrity where applicable, while download authorization and immutable exact-path Storage binding remain the governing read controls.

## Fresh Pass B outcome

The prior fresh Pass-B entry/governance HEAD `c6c3afa56a66be97a590d4ce2b63932e6af5a46e` / CI `34842684753` was **5/5 SUCCESS**, clean-checkout included. That review closed `WP29A-AR-002` for the original read-parser defect but failed overall on `WP29A-AR-003`.

The AR-003 failure state was durably recorded on `39ea780ac9ac724a9450a5ac8a5d0179986591ed` / CI `34844606086` — **5/5 SUCCESS**, clean-checkout included. Remediation transition `9b266ca9ba3c6e737525db03a5856c39d4f44ed7` / CI `34845524190` and remediation evidence `fec1195dcbcfa15d97fe55b17a0fb5aad25b3813` / CI `34848872192` are both **5/5 SUCCESS**.

WP-2.9A is therefore **REVIEW_PENDING / B-ADVERSARIAL-REVIEW**. `WP29A-AR-003` remains MAJOR / OPEN until the fresh review verdict.

## Current gate

WP-2.9A is **REVIEW_PENDING / B-ADVERSARIAL-REVIEW**.

The only permitted next action is exact-head CI for this governance transition. Once green, perform a fresh adversarial Pass B over the full WP-2.9A surface, explicitly including AR-001/002 regression, AR-003 Unicode-scalar parity, exact project/document/path binding, RLS/Storage authorization, lifecycle visibility, fail-closed provider parsing and list/read/download behavior. Pass C remains forbidden while any BLOCKING/MAJOR finding is unresolved. WP-2.9B remains inactive until WP-2.9A is accepted.

Any implementation need that expands public capability, changes the frozen requirements, introduces a new permission key, or pushes the approved cohesive surface beyond 10 points requires a stop/rescore before code proceeds.
