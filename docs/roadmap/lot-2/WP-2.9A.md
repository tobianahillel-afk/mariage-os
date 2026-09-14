# WP-2.9A — Venue-linked private document foundation

## Identity

- Work Packet ID: `WP-2.9A`
- Lot: `2`
- Name: Venue-linked private document foundation
- State: `REVIEW_FAILED`
- Current pass: `B-ADVERSARIAL-REVIEW FAILED — WP29A-AR-004 + WP29A-AR-005; REMEDIATION NEXT`
- Primary bounded context: Documents — private PDF metadata, Venue links, Storage lifecycle and recoverable metadata
- Branch/PR: `lot-2/venues-core` / Lot-2 integration PR not opened yet
- FIR: `#17 / FTR-089`
- Size: **10 points**; explicit cohesion review **PASS**

## Activation / governance evidence

The former monolithic WP-2.9 scored **12 points** and was split before code under `AI-LOT-ORCHESTRATION.md` into:

1. **WP-2.9A** — private Documents + `document_links` + Storage lifecycle;
2. **WP-2.9B** — project Tags + Venue `entity_tags` basics.

No product responsibility was dropped. Default sequencing remains `WP-2.9A → WP-2.9B → WP-2.10`.

Evidence:

- split/specification freeze: `40f17aba802e7faed9eade6096e2f3629fc80654` / CI `34788217062` — **5/5 SUCCESS**, clean-checkout included;
- READY governance: `0b30b045ef05c318d25c92abb379364f95705c4e` / CI `34788670807` — **5/5 SUCCESS**, clean-checkout included;
- A-IMPLEMENT governance: `f5a77c72cf5f28bccd823c7cdc78b01531b3b265` / CI `34789115986` — **5/5 SUCCESS**, clean-checkout included;
- RED-first: `9322915252925d3f75f5a224a82f9d391ccfec9d` / CI `34789545716` — expected RED limited to the three frozen document-boundary assertions;
- Pass-A implementation/evidence: `e533b5c53d1be074216ccaa92f74281b425de770` / CI `34826553890` — **5/5 SUCCESS**, Core **152 files / 1465 tests / 100% statements, branches, functions and lines**;
- AR-001 remediation/evidence: `0072792d2eb67cce1bf98c4c312d9576feacc156` / CI `34836621394` — **5/5 SUCCESS**;
- prior fresh Pass-B entry: `78904546f3d8f4c15276a1bbe0825455f1262ee4` / CI `34837421096` — **5/5 SUCCESS**;
- durable AR-002 review failure: `9654c90ed7da27033d1f08d6effc6f47cac3dff9` / CI `34839274681` — **5/5 SUCCESS**;
- AR-002 remediation transition: `b2e94c47f6d523adbf731fdd15cf796cca4c5ca9` / CI `34840180167` — **5/5 SUCCESS**;
- AR-002 focused RED: `2f06b7963e7d09e3c00264d3351745213a75f964` / CI `34840851767` — expected RED, one focused failure;
- AR-002 remediation/evidence: `c78c22ff10c02cd6ab798a21e16b5c7acbc3effb` / CI `34841804605` — **5/5 SUCCESS**, Core **158 files / 1546 tests / 100% coverage**;
- prior fresh Pass-B entry: `c6c3afa56a66be97a590d4ce2b63932e6af5a46e` / CI `34842684753` — **5/5 SUCCESS**;
- durable AR-003 review failure: `39ea780ac9ac724a9450a5ac8a5d0179986591ed` / CI `34844606086` — **5/5 SUCCESS**;
- AR-003 remediation transition: `9b266ca9ba3c6e737525db03a5856c39d4f44ed7` / CI `34845524190` — **5/5 SUCCESS**;
- AR-003 focused RED: `79afff6c87f7033af008de3fb3b86c3ff833b15c` / CI `34846914610` — expected RED, Core 1546 passing / 4 failing Unicode-parity tests;
- AR-003 remediation/evidence: `fec1195dcbcfa15d97fe55b17a0fb5aad25b3813` / CI `34848872192` — **5/5 SUCCESS**, Core **159 files / 1550 tests / 100% coverage**;
- fresh Pass-B governance entry: `6a4e8087e3b6f3b1d3501c0ef2f0378defc119e4` / CI `34850247706` — **5/5 SUCCESS**, clean-checkout included;
- current fresh Pass B independently verifies AR-003 as closed, but fails overall on `WP29A-AR-004` and `WP29A-AR-005`, both **MAJOR / OPEN**.

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

`MED-009` remains formally owned by FTR-092. WP-2.9A nevertheless inherits the mandatory upload-safety invariant that an interrupted/incomplete document upload must never appear committed/valid.

### Exact user job

An authorized couple member can retain a private PDF relevant to a Venue, preserve provenance and private filename metadata, link the one logical document to one or more same-project Venues without duplicating bytes, download it only through live authorization, soft-delete it from ordinary results, and restore the same logical record later.

## Persisted model

### `documents`

A forward-only migration materializes the frozen V1 `documents` table with stable project/document identity, `document_type`, `title`, private Storage metadata, original filename, MIME, byte size, SHA-256, private classification, pending/ready status, optional same-project Source provenance, audit/revision fields and recoverable `deleted_at`.

A creates only ordinary private-document rows: `remote_url is null`, canonical server-derived `storage_path`, `classification = 'private'`, `upload_status in ('pending','ready')`, and optional same-project `source_id`.

### `document_links`

WP-2.9A materializes generic link persistence but exposes only same-project Venue targets in Lot 2. A ready document may have several Venue links without duplicating the binary. `relationship_type` remains null in this packet.

## File and Storage contract

PDF only:

- extension `.pdf`, case-insensitive;
- declared MIME exactly `application/pdf`;
- magic begins with `%PDF-`;
- size `1..25,000,000` bytes;
- original filename `1..512` Unicode scalar values with unsafe controls/path separators rejected;
- SHA-256 exactly 64 lowercase hex characters over the exact uploaded bytes.

PDF bytes are untrusted binary. No active inline preview is introduced by A. Download uses safe attachment/content-disposition semantics.

Bucket/path:

- private bucket `project-private`;
- path exactly `<project_id>/documents/<document_id>/original`;
- raw private filename/title/Venue name never appears in Storage identity;
- path knowledge grants no authority;
- ready bytes are immutable; overwrite/upsert/rename is denied.

## Lifecycle and recovery

```text
absent → pending → ready
           └────→ absent   (clean abandon only after exact Storage absence)
```

- `pending` is recovery state, never committed truth;
- ordinary reads/downloads never expose pending as ready;
- writers may inspect exact pending state/object for recovery;
- `pending → ready` must verify the exact reserved Storage object and required binary/metadata integrity before committed truth;
- cleanup deletes the exact pending object first, verifies delete/not-found, then abandons metadata/link state;
- no scheduler or raw-bucket reconciliation is assumed.

Ready soft-delete/restore keeps the same document/link/object identity. Active lists exclude deleted rows. Same-state delete/restore retry is no-op success; real transitions are optimistic-revision protected and increment audit/revision once.

## Protected command family

Public authenticated mutation allowlist:

- `reserve_upload`;
- `finalize_upload`;
- `abandon_upload`;
- `link_venue`;
- `unlink_venue`;
- `soft_delete`;
- `restore`.

The protected boundary must require authenticated identity, live `documents.write`, same-project relationships, canonical server-derived path, protected identity/audit/hash semantics, serialized conflicting operations, fail-closed typed receipts, non-disclosing foreign identity behavior and idempotent stable-operation retries.

### Download/read authorization

- active ready metadata/binary: live `documents.read` plus exact DB-path binding;
- pending or soft-deleted recovery: live `documents.write`;
- anon/outsider/project-B/revoked identities denied.

## Provenance and duplicate safety

Optional `source_id` is same-project provenance and survives delete/restore. SHA-256 may support same-project duplicate detection; hash equality never grants access and never auto-merges/replaces logical identity. Cross-project hash equality is never disclosed.

## Authorization / security evidence required

At minimum A directly owns packet-applicable forms of `AUTHZ-001/002/005/006/007/008/012/018/019/020`, `SEC-AUTH-012/013`, applicable `SEC-AUTHZ-001..009`, `SEC-VAL-001..004/008`, `SEC-INJ-001/002`, `SEC-FILE-001/002/003/004/008/009`, and `SEC-VER-001/002/005/006`.

Direct DB and Storage evidence covers owner/editor/viewer as applicable, anon, outsider, project-B and revoked/downgraded identities. Cross-project links/path access and protected-column mutation must fail.

## Explicitly out of scope

- FTR-090 / MED-011 document version lineage;
- FTR-091 / MED-012 contract-readiness/review checklist;
- sensitive-document workflows;
- OCR/full-text indexing and active inline PDF preview;
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
- application: typed reserve/finalize/recovery/link/list/download-auth/delete/restore services/ports;
- infrastructure: Supabase metadata/RPC adapter, fail-closed receipts and private Storage adapter/reuse;
- cloud: forward-only migration, RLS/grants/Storage policies and protected command family;
- local/offline: none.

## Verification plan

Evidence must cover PDF extension/MIME/signature/size/name/hash boundaries; reserve/upload/finalize; interruption/recovery; pending invisibility; immutable ready bytes; multi-Venue links; same-project Source/Venue integrity; provenance; soft-delete/restore; stale/idempotent transitions; malformed/substituted provider data; owner/editor/viewer/anon/outsider/project-B/revoked authorization; protected table mutations; private filename privacy; and accepted WP-2.8 regressions.

## Pass A closure

Historical Pass A is complete on `e533b5c53d1be074216ccaa92f74281b425de770` / CI `34826553890` — **5/5 SUCCESS**. Subsequent remediation evidence supersedes affected review surfaces while retaining this history.

## Pass B — adversarial review findings

### WP29A-AR-001 — MAJOR / CLOSED / VERIFIED — missing Document read/list/download application boundary

The original implementation lacked the typed application/provider foundation for ready-document list/read/download. Remediation `0072792d2eb67cce1bf98c4c312d9576feacc156` / CI `34836621394` added active-ready filtering, exact DB-path-bound Storage access, safe attachment metadata and fail-closed provider parsing. Fresh reviews have re-challenged this surface. **Verdict: CLOSED / VERIFIED.**

### WP29A-AR-002 — MAJOR / CLOSED / VERIFIED — filename Unicode-scalar parity

The original read parser counted UTF-16 code units although the frozen filename bound is Unicode scalars. Remediation `c78c22ff10c02cd6ab798a21e16b5c7acbc3effb` / CI `34841804605` made read/upload filename validation scalar-aware with focused boundaries. **Verdict: CLOSED / VERIFIED.**

### WP29A-AR-003 — MAJOR / CLOSED / VERIFIED — Unicode-length parity in lifecycle receipts and bounded metadata

The prior lifecycle receipt parser and bounded `document_type`/`title` service/provider validation used UTF-16 code-unit lengths while PostgreSQL uses character/scalar semantics.

Focused RED `79afff6c87f7033af008de3fb3b86c3ff833b15c` / CI `34846914610` demonstrated exactly four regressions. Remediation `fec1195dcbcfa15d97fe55b17a0fb5aad25b3813` / CI `34848872192` introduced one scalar-aware bounded-text predicate shared by service/lifecycle/read parsers and reused the scalar-aware filename predicate.

Fresh Pass B on `6a4e8087e3b6f3b1d3501c0ef2f0378defc119e4` / CI `34850247706` independently re-read the implementation and server trim/length semantics and confirms the original AR-003 defects are no longer present. **Verdict: CLOSED / VERIFIED.**

### WP29A-AR-004 — MAJOR / OPEN — C1 control-character parity is incomplete

**Finding.** The shared TypeScript scalar validator rejects U+0000..U+001F and U+007F, but accepts the remaining C1 controls U+0080..U+009F. The authoritative PostgreSQL boundary rejects `~ '[[:cntrl:]]'`. PostgreSQL 17 defines `CC_CNTRL` with hard-wired ranges U+0000..U+001F and U+007F..U+009F, independent of locale. Existing document tests cover U+0000/U+001F/U+007F and malformed surrogates, but not C1 controls.

**Impact.** `document_type`, `title` and `original_filename` values containing C1 controls can pass the TypeScript service/domain/provider predicates while being rejected by the protected RPC/table. This reintroduces deterministic client/server validation drift and means provider parsers accept text that cannot satisfy the authoritative schema. The filename contract also explicitly requires unsafe controls to be rejected.

**Classification.** `MAJOR / OPEN`. No project-authority bypass or active-content execution was found, so this is not BLOCKING; Pass C is nevertheless forbidden.

**Required remediation.** Extend the one canonical Unicode-scalar control rule to reject U+0000..U+001F and U+007F..U+009F, reuse it for bounded text and filenames, and add focused RED regressions (including a representative C1 value such as U+0085) across service/domain/receipt/read boundaries. Preserve scalar counting, surrogate rejection, trim rules and all SQL/RLS/permission/UI scope.

### WP29A-AR-005 — MAJOR / OPEN — ready commit is not bound to the actual uploaded object integrity

**Finding.** The protected `finalize_upload` path currently proves only that a `storage.objects` row exists at the reserved path. The Document Storage INSERT policy proves project/document/path/pending/write authority but does not compare actual object size/MIME/hash with the reservation. The `project-private` bucket has no document-specific file-size or MIME allowlist. Consequently a writer using direct authenticated RPC + Storage can reserve metadata for one PDF, upload different bytes at the exact path and finalize the row as `ready`.

**Concrete integrity case.** A writer can reserve PDF A with size `N` and SHA-256 `H`, then upload PDF B at the same path with the same size and valid `%PDF-` signature but different bytes/hash. `finalize_upload` marks the metadata ready because the object exists. The normal download path revalidates PDF magic and byte size but does not recompute SHA-256, so PDF B remains downloadable while PostgreSQL durably claims hash `H` for PDF A.

**Impact.** A committed `ready` document can contain binary bytes that do not match the reserved exact-byte identity/hash and potentially provider MIME/size metadata. This violates the frozen exact-SHA-256 contract, `SEC-VAL-001/002`, the file-security boundary, and the Storage lifecycle requirement to verify object/size/hash where applicable before committed truth. Frontend validation cannot be authoritative because direct RPC/Storage access is part of the untrusted client boundary.

**Classification.** `MAJOR / OPEN`. Authorization/project isolation remains intact and no active inline execution path was found, so this is not BLOCKING. Pass C is blocked.

**Required remediation.** Establish trusted `pending → ready` evidence binding the actual stored object to the reserved binary metadata before a document becomes ready. At minimum, actual stored-object size/MIME and exact SHA-256/byte identity must not be replaceable by caller assertion. Do not treat client-supplied custom Storage metadata as proof of its own values. Add focused RED evidence that a mismatched object cannot finalize while a legitimate exact object can.

If satisfying AR-005 requires a new privileged server/provider capability, a new public endpoint, or other architecture that meaningfully increases the already-10-point packet, **stop and rescore/split before production implementation** rather than silently expanding WP-2.9A.

### Reviewed non-findings

Fresh Pass B also re-challenged exact project/document/path binding, same-project Source/Venue relations, pending/deleted visibility, live `documents.read`/`documents.write` RLS and Storage authority, replay/stale-revision behavior, fail-closed malformed/substituted provider responses, list/read/download, safe attachment behavior, soft-delete/restore, immutable ready Storage policy and AR-001/002/003 regressions. No other BLOCKING/MAJOR defect was found in those areas.

A per-download SHA recomputation by itself is not required as the governing authorization mechanism; AR-005 instead concerns whether the binary is proven to match reserved committed metadata **before becoming ready**.

## Fresh Pass B outcome

Fresh-review governance HEAD `6a4e8087e3b6f3b1d3501c0ef2f0378defc119e4` / CI `34850247706` is **5/5 SUCCESS**, clean-checkout included. Fresh Pass B closes `WP29A-AR-003` but **fails overall** on `WP29A-AR-004` and `WP29A-AR-005`, both MAJOR / OPEN.

WP-2.9A therefore transitions to **REVIEW_FAILED**. Pass C and WP-2.9B remain forbidden.

## Current gate

WP-2.9A is **REVIEW_FAILED**.

The only permitted next action is exact-head CI for this durable fresh-review failure record. No RED or remediation code is permitted until that record is green. Once green, perform a separate remediation-planning/`IN_PROGRESS` transition. AR-004 is localized. AR-005 must first be checked against packet complexity: if trusted object-integrity proof requires a new privileged/provider architecture or meaningfully pushes the cohesive packet beyond its approved 10 points, stop/rescore/split before production code.

Pass C remains forbidden while either AR-004 or AR-005 is unresolved. WP-2.9B and later packets remain untouched.
