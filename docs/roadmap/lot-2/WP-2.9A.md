# WP-2.9A — Venue-linked private document foundation

## Identity

- Work Packet ID: `WP-2.9A`
- Lot: `2`
- Name: Venue-linked private document foundation
- State: `BLOCKED`
- Current pass: `BLOCKED — AR-005 requires accepted WP-2.9C trusted-ingestion remediation before A can resume`
- Primary bounded context: Documents — private PDF metadata, Venue links, Storage lifecycle and recoverable metadata
- Branch/PR: `lot-2/venues-core` / Lot-2 integration PR not opened yet
- FIR: `#17 / FTR-089`
- Historical size: **10 points**; explicit cohesion review **PASS**
- Blocker resolution condition: `WP-2.9C ACCEPTED`, then A returns to `IN_PROGRESS` for integration/reverification and fresh Pass B

## Activation / governance evidence

The former monolithic WP-2.9 scored **12 points** and was split before code into:

1. **WP-2.9A** — private Documents + `document_links` + Storage lifecycle;
2. **WP-2.9B** — project Tags + Venue `entity_tags` basics.

Fresh Pass B later proved that the originally planned browser→Storage Document ingestion boundary could not satisfy the frozen exact-byte integrity contract against an untrusted client without an additional privileged server boundary. Under the >10-point split rule and architecture stop conditions, remediation is now isolated in **WP-2.9C — Trusted private-document ingestion hardening** under ADR 0008.

Current sequencing is therefore:

```text
WP-2.9A [BLOCKED]
  → WP-2.9C [READY → IMPLEMENT/REVIEW/ACCEPT]
    → WP-2.9A [IN_PROGRESS reintegration → fresh Pass B → Pass C]
      → WP-2.9B
```

No product responsibility is dropped or deferred by this remediation split.

Historical evidence:

- split/specification freeze: `40f17aba802e7faed9eade6096e2f3629fc80654` / CI `34788217062` — **5/5 SUCCESS**, clean-checkout included;
- READY governance: `0b30b045ef05c318d25c92abb379364f95705c4e` / CI `34788670807` — **5/5 SUCCESS**, clean-checkout included;
- A-IMPLEMENT governance: `f5a77c72cf5f28bccd823c7cdc78b01531b3b265` / CI `34789115986` — **5/5 SUCCESS**, clean-checkout included;
- RED-first: `9322915252925d3f75f5a224a82f9d391ccfec9d` / CI `34789545716` — expected RED limited to three frozen document-boundary assertions;
- Pass-A implementation/evidence: `e533b5c53d1be074216ccaa92f74281b425de770` / CI `34826553890` — **5/5 SUCCESS**, Core **152 files / 1465 tests / 100% statements, branches, functions and lines**;
- AR-001 remediation/evidence: `0072792d2eb67cce1bf98c4c312d9576feacc156` / CI `34836621394` — **5/5 SUCCESS**;
- fresh Pass-B governance: `78904546f3d8f4c15276a1bbe0825455f1262ee4` / CI `34837421096` — **5/5 SUCCESS**;
- durable AR-002 review failure: `9654c90ed7da27033d1f08d6effc6f47cac3dff9` / CI `34839274681` — **5/5 SUCCESS**;
- AR-002 remediation transition: `b2e94c47f6d523adbf731fdd15cf796cca4c5ca9` / CI `34840180167` — **5/5 SUCCESS**;
- AR-002 focused RED: `2f06b7963e7d09e3c00264d3351745213a75f964` / CI `34840851767` — expected RED, one focused failure;
- AR-002 remediation/evidence: `c78c22ff10c02cd6ab798a21e16b5c7acbc3effb` / CI `34841804605` — **5/5 SUCCESS**, Core **158 files / 1546 tests / 100% coverage**;
- fresh Pass-B governance: `c6c3afa56a66be97a590d4ce2b63932e6af5a46e` / CI `34842684753` — **5/5 SUCCESS**;
- durable AR-003 review failure: `39ea780ac9ac724a9450a5ac8a5d0179986591ed` / CI `34844606086` — **5/5 SUCCESS**;
- AR-003 remediation transition: `9b266ca9ba3c6e737525db03a5856c39d4f44ed7` / CI `34845524190` — **5/5 SUCCESS**;
- AR-003 focused RED: `79afff6c87f7033af008de3fb3b86c3ff833b15c` / CI `34846914610` — expected RED, Core 1546 passing / 4 failing Unicode-parity tests;
- AR-003 remediation/evidence: `fec1195dcbcfa15d97fe55b17a0fb5aad25b3813` / CI `34848872192` — **5/5 SUCCESS**, Core **159 files / 1550 tests / 100% coverage**;
- fresh Pass-B governance entry: `6a4e8087e3b6f3b1d3501c0ef2f0378defc119e4` / CI `34850247706` — **5/5 SUCCESS**, clean-checkout included;
- durable AR-004/005 fresh-review failure record: `a58417f79e59e2bd2d2fcb4d202f568c15cfa947` / CI `34854785427` — **5/5 SUCCESS**, clean-checkout included.

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

WP-2.9C is not a new product owner. It is the remediation packet that supplies the trusted binary-ingress boundary needed for the existing A responsibility to become correct.

### Exact user job

An authorized couple member can retain a private PDF relevant to a Venue, preserve provenance and private filename metadata, link one logical document to one or more same-project Venues without duplicating bytes, download it only through live authorization, soft-delete it from ordinary results and restore the same logical record later.

## Persisted model

### `documents`

The current forward-only migration materializes stable project/document identity, `document_type`, `title`, private Storage metadata, original filename, MIME, byte size, SHA-256, private classification, pending/ready status, optional same-project Source provenance, audit/revision fields and recoverable `deleted_at`.

Ordinary private documents use `remote_url is null`, canonical server-derived `storage_path`, `classification = 'private'`, `upload_status in ('pending','ready')`, and optional same-project `source_id`.

### `document_links`

Generic link persistence is materialized but Lot 2 exposes only same-project Venue targets. A ready document may have several Venue links without duplicating the binary. `relationship_type` remains null in this packet.

## File and Storage contract

PDF only:

- extension `.pdf`, case-insensitive;
- declared MIME exactly `application/pdf`;
- magic begins with `%PDF-`;
- size `1..25,000,000` bytes;
- original filename `1..512` Unicode scalar values with unsafe controls/path separators rejected;
- SHA-256 exactly 64 lowercase hex characters over the exact uploaded bytes.

PDF bytes are untrusted binary. No active inline preview is introduced. Download uses safe attachment/content-disposition semantics.

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
- `pending → ready` must be preceded by trusted validation that the actual Storage bytes satisfy the reserved binary metadata;
- cleanup deletes the exact pending object first, verifies delete/not-found, then abandons metadata/link state;
- no scheduler or raw-bucket reconciliation is assumed.

Ready soft-delete/restore keeps the same document/link/object identity. Active lists exclude deleted rows. Same-state delete/restore retry is no-op success; real transitions are optimistic-revision protected and increment audit/revision once.

## Protected command family

Public authenticated mutation allowlist remains:

- `reserve_upload`;
- `finalize_upload`;
- `abandon_upload`;
- `link_venue`;
- `unlink_venue`;
- `soft_delete`;
- `restore`.

The database boundary requires authenticated identity, live `documents.write`, same-project relationships, canonical server-derived path, protected identity/audit/hash semantics, serialized conflicting operations, fail-closed typed receipts, non-disclosing foreign identity behavior and idempotent stable-operation retries.

WP-2.9C changes binary ingress authority, not this product command set: ordinary authenticated clients will no longer create Document Storage objects directly; a narrow authenticated server boundary will validate/hash/upload exact bytes before finalization can succeed.

### Download/read authorization

- active ready metadata/binary: live `documents.read` plus exact DB-path binding;
- pending or soft-deleted recovery: live `documents.write`;
- anon/outsider/project-B/revoked identities denied.

## Provenance and duplicate safety

Optional `source_id` is same-project provenance and survives delete/restore. SHA-256 may support same-project duplicate detection; hash equality never grants access and never auto-merges/replaces logical identity. Cross-project hash equality is never disclosed.

## Authorization / security evidence required

A and its remediation must directly evidence applicable forms of `AUTHZ-001/002/005/006/007/008/012/018/019/020`, `SEC-AUTH-012/013`, applicable `SEC-AUTHZ-001..009`, `SEC-VAL-001..004/008`, `SEC-INJ-001/002`, `SEC-FILE-001/002/003/004/008/009`, and `SEC-VER-001/002/005/006`.

Direct DB/Storage/server evidence covers owner/editor/viewer as applicable, anon, outsider, project-B and revoked/downgraded identities. Cross-project links/path access and protected-column mutation must fail.

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
- domain: PDF/text/filename validation and document/link/lifecycle invariants;
- application: typed reserve/finalize/recovery/link/list/download-auth/delete/restore services/ports;
- infrastructure: Supabase metadata/RPC/read adapters plus Storage/recovery adapters;
- cloud: forward-only document/link migration, RLS/grants/Storage policies and protected command family;
- trusted binary ingress: now delegated to WP-2.9C / ADR 0008;
- local/offline: none.

## Verification plan

Final A evidence must cover PDF extension/MIME/signature/size/name/hash boundaries; trusted exact-byte ingress; reserve/upload/finalize; interruption/recovery; pending invisibility; immutable ready bytes; multi-Venue links; same-project Source/Venue integrity; provenance; soft-delete/restore; stale/idempotent transitions; malformed/substituted provider data; owner/editor/viewer/anon/outsider/project-B/revoked authorization; protected mutations; private filename privacy; and accepted WP-2.8 regressions.

## Pass A closure

Historical Pass A completed on `e533b5c53d1be074216ccaa92f74281b425de770` / CI `34826553890` — **5/5 SUCCESS**. Subsequent review failures invalidate affected verification and require fresh review after remediation; the historical evidence is retained rather than rewritten.

## Pass B — adversarial review findings

### WP29A-AR-001 — MAJOR / CLOSED / VERIFIED — missing Document read/list/download application boundary

The original implementation lacked the typed application/provider foundation for ready-document list/read/download. Remediation `0072792d2eb67cce1bf98c4c312d9576feacc156` / CI `34836621394` added active-ready filtering, exact DB-path-bound Storage access, safe attachment metadata and fail-closed provider parsing. Fresh reviews re-challenged this surface. **Verdict: CLOSED / VERIFIED.**

### WP29A-AR-002 — MAJOR / CLOSED / VERIFIED — filename Unicode-scalar parity

The original read parser counted UTF-16 code units although the frozen filename bound is Unicode scalars. Remediation `c78c22ff10c02cd6ab798a21e16b5c7acbc3effb` / CI `34841804605` made read/upload filename validation scalar-aware with focused boundaries. **Verdict: CLOSED / VERIFIED.**

### WP29A-AR-003 — MAJOR / CLOSED / VERIFIED — Unicode-length parity in lifecycle receipts and bounded metadata

Focused RED `79afff6c87f7033af008de3fb3b86c3ff833b15c` / CI `34846914610` demonstrated four Unicode-parity regressions. Remediation `fec1195dcbcfa15d97fe55b17a0fb5aad25b3813` / CI `34848872192` introduced one scalar-aware bounded-text predicate shared by service/lifecycle/read parsers and reused the scalar-aware filename predicate.

Fresh Pass B on `6a4e8087e3b6f3b1d3501c0ef2f0378defc119e4` / CI `34850247706` independently verified the original defects are gone. **Verdict: CLOSED / VERIFIED.**

### WP29A-AR-004 — MAJOR / OPEN — C1 control-character parity is incomplete

The shared TypeScript scalar validator rejects U+0000..U+001F and U+007F but accepts C1 controls U+0080..U+009F. PostgreSQL 17 hard-wires `[[:cntrl:]]` to U+0000..U+001F plus U+007F..U+009F. `document_type`, `title` and `original_filename` can therefore pass TypeScript service/provider validation while failing the authoritative server/schema boundary.

Required remediation is assigned to WP-2.9C: extend the single canonical scalar-control rule to U+007F..U+009F and add focused RED coverage without changing trim/scalar/surrogate semantics.

**Classification: MAJOR / OPEN.** It is resolved only after WP-2.9C remediation evidence and A's later fresh review verify the defect closed.

### WP29A-AR-005 — MAJOR / OPEN — ready commit is not bound to actual uploaded-object integrity

The existing `finalize_upload` checks exact object presence but the authenticated Document Storage INSERT path does not prove actual object size/MIME/SHA-256 matches the reservation. A modified authenticated client can reserve PDF A, upload different PDF B at the same canonical path and finalize ready metadata for A. Same-size valid-PDF substitution can survive ordinary download because the current download boundary validates type/signature/size but intentionally does not recompute SHA on every read.

The frozen contract requires SHA-256 over exact uploaded bytes and critical file validation at a trusted boundary. PostgreSQL cannot recompute SHA-256 from private Storage bytes, and caller-supplied Storage metadata cannot attest itself. This requires the new trusted server boundary frozen in ADR 0008 and implemented by WP-2.9C.

**Classification: MAJOR / OPEN / ARCHITECTURE BLOCKER.** It is resolved only after WP-2.9C is ACCEPTED and A's integrated fresh review confirms no direct authenticated binary-integrity bypass remains.

## Reviewed non-findings

Fresh Pass B also re-challenged exact project/document/path binding, same-project Source/Venue relations, replay/stale revision behavior, pending/deleted visibility, live `documents.read`/`documents.write` RLS and Storage authority, fail-closed malformed/substituted provider data, list/read/download, safe attachment behavior, soft-delete/restore and ready-object immutability. No additional BLOCKING/MAJOR issue was found in those areas.

## Blocker / remediation split

The fresh-review failure record `a58417f79e59e2bd2d2fcb4d202f568c15cfa947` / CI `34854785427` is **5/5 SUCCESS**, clean-checkout included.

AR-005 triggers the repository stop conditions because a new privileged/provider boundary is required and A was already 10 points. ADR 0008 therefore freezes a split remediation packet rather than expanding A silently.

Blocker resolution condition:

```text
WP-2.9C ACCEPTED
→ transition WP-2.9A BLOCKED → IN_PROGRESS
→ integrate/reverify affected A surfaces
→ REVIEW_PENDING
→ fresh full Pass B over A
→ Pass C only if no BLOCKING/MAJOR remains
```

## Current gate

WP-2.9A is **BLOCKED**. The current executable packet is WP-2.9C.

No product code in A is changed while this blocker is active. WP-2.9B and later packets remain forbidden until A ultimately reaches ACCEPTED.
