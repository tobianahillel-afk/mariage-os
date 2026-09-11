# WP-2.8B — Private Venue image archive lifecycle

## Identity

- Work Packet ID: `WP-2.8B`
- Lot: `2`
- Name: Private Venue image archive lifecycle
- State: `ACCEPTANCE_PENDING`
- Current pass: `C-ACCEPTANCE`
- Primary bounded context: Documents/Media private image archive, immutable originals, derivatives and recovery
- Branch/PR: `lot-2/venues-core` / PR not opened yet

## Scope

### Primary features / current-lot responsibility

- remaining private-archive slice of `FTR-024` after WP-2.8A;
- Lot-2 foundation slice of `FTR-092` — original/derivative/orphan lifecycle;
- `VEN-013` — archived/private visit media distinguished from remote refs;
- `MED-004` — archived original photo bytes preserved;
- `MED-005` — thumbnail/preview are distinct derivatives;
- `MED-006` — exact duplicate binary detectable by hash;
- `MED-009` — interrupted/orphan uploads recoverable/cleanable and not presented committed;
- `MED-010` — private file access cannot rely on obscurity;
- `ACC-055`, `ACC-056`, `ACC-058` where owned by the private-media foundation.

### Exact WP-2.8B responsibility

- private Venue image archive workflow over the already accepted `project-private/<project>/media/<media_uuid>/<variant>` Storage namespace;
- supported-image file intent/size/MIME/magic-byte validation boundary from `FILE-SECURITY.md`;
- immutable archived original semantics;
- explicit derivative records/parent relationship for thumbnail/preview foundation;
- SHA-256 exact-byte duplicate detection scoped to the project without cross-project information leakage;
- interrupted/storage-success-metadata-failure recovery/cleanup semantics;
- committed/ready visibility rule: incomplete private media cannot masquerade as ready media;
- metadata↔Storage authorization coordination using existing `media.read` / `media.write` Storage RLS;
- safe typed provider/storage failures and direct allow/deny tests;
- preserve the accepted WP-2.8A remote-reference create/list contract when remote and private Venue media coexist.

### Explicitly out of scope

- remote-reference metadata foundation already accepted by WP-2.8A;
- recoverable soft-delete/restore of A's remote-reference metadata — WP-2.8C;
- global trash UI / 30-day purge scheduler;
- Venue gallery/detail UI, ordering/main-photo UX — WP-2.11;
- local/offline image queue and own-visit capture semantics — WP-2.12/Lot 10;
- document uploads/versioning — WP-2.9 and later document work;
- server image proxy or arbitrary server-side image transformation service;
- generic background scheduler assumed to clean orphans;
- paid storage/automatic overage behavior;
- backup/import/export binary packaging;
- automatic cross-record merge or cross-project deduplication;
- HEIC/HEIF activation until a later packet proves safe decode/preview-conversion support.

## Dependencies / sequencing

- WP-2.8A is **ACCEPTED / COMPLETE**: packet acceptance `925cf86f3e38bf08807ed408f6d100fbbbd5c9c2` / `34418721439` — **5/5 SUCCESS**; coverage reconciliation `432e0cf893e0adc079ba3c25eb325efb9d01e3ec` / `34420275595` — **5/5 SUCCESS**; final status-governance closure `7788d2673571eef9f5bea9dc0ac35a0c60ee1ff6` / `34420864673` — **5/5 SUCCESS**.
- WP-2.8B private lifecycle specification freeze is **CLOSED / VERIFIED** on `dd2b03c736210f5145ece58ef8b4f55918c43b00` / `34421686462` — **5/5 SUCCESS**, clean-checkout included.
- WP-2.8B `PLANNED → READY` governance is **CLOSED / VERIFIED** on `3e6fe6683cccb21ffa0ef96b87911280ab07737f` / `34423597208` — **5/5 SUCCESS**, clean-checkout included.
- Pass-A implementation checkpoint `150c10c07452748e3092e316a3cb9a26f272ff3e` / `34555183344` and first fresh Pass-B review `a23e6925f4d95e5d49cdea5b4e62b899cdd7a605` / `34555832894` were **5/5 SUCCESS**.
- Pass C exposed MED-006 receipt incompleteness on RED head `4eddca8aa94a2ed95d37bac47b8f3efeb3b4faf4` / `34556856411`; production was correctly reopened for remediation.
- MED-006 remediation exact head `f815844d9f4a2c62575ee91530af94febf78dab0` / `34605466532` is **5/5 SUCCESS**, including clean-checkout `npm run verify`.
- Fresh affected Pass-B reconstruction after remediation is **PASS** with open BLOCKING/MAJOR findings **∅**; this record therefore transitions to `ACCEPTANCE_PENDING / C-ACCEPTANCE`.
- Lot-1 WP-1.9 private Storage authorization foundation remains authoritative and must be reused, not replaced.
- Restored `docs/security/STORAGE-RLS.md` is a required normative input.
- `MEDIA-LIFECYCLE-ADDENDUM.md`, `FILE-SECURITY.md`, `STORAGE.md`, `ERROR-HANDLING.md` and the Lot-2 coverage records remain governing inputs.
- WP-2.8C remains PLANNED while B is not yet ACCEPTED; only one packet may be active.

## Applicable authorization / security controls

At minimum: `AUTHZ-001`, `AUTHZ-002`, `AUTHZ-005`, `AUTHZ-006`, `AUTHZ-007`, `AUTHZ-008`, `AUTHZ-012`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020`; `SEC-AUTH-012`, `SEC-AUTH-013`, `SEC-AUTHZ-001..009`, `SEC-VAL-001..004`, `SEC-VAL-008`, `SEC-INJ-001`, `SEC-INJ-002`, `SEC-FILE-001`, `SEC-FILE-002`, `SEC-FILE-003`, `SEC-FILE-004`, `SEC-FILE-008`, `SEC-FILE-009`, `SEC-ABUSE-004`, `SEC-VER-001`, `SEC-VER-002`, `SEC-VER-005`, `SEC-VER-006`.

No server-side arbitrary URL fetch is introduced; `SEC-SRV-001` remains true.

## Mandatory pre-READY stop-condition — frozen implementation contract

This section is the durable WP-2.8B activation freeze. It refines the earlier high-level media/storage contracts only where exact implementation values or transitions were previously unspecified. The lifecycle freeze is **CLOSED / VERIFIED** on `dd2b03c736210f5145ece58ef8b4f55918c43b00` / `34421686462` — **5/5 SUCCESS**. The READY gate is also **CLOSED / VERIFIED** on `3e6fe6683cccb21ffa0ef96b87911280ab07737f` / `34423597208` — **5/5 SUCCESS**. The historical implementation gate was satisfied before product work began; current execution is now in Pass C after green remediation and a fresh affected Pass-B review.

### 1. Private lifecycle states and visibility

WP-2.8B adds exactly one private pre-commit status to the existing `media.upload_status` model:

- `pending` — a project-authorized reservation/recovery record exists, but the media is **not committed application media**;
- `ready` — the required private Storage object exists at the reserved opaque path and the protected finalization command has accepted the reservation.

There is no `failed`, `uploaded`, `orphaned`, `processing` or scheduler-owned status in B. Recovery state is derived from `pending` plus exact Storage-object presence.

Legal B lifecycle:

```text
absent
  ↓ reserve
pending
  ├─→ ready       (finalize after exact object presence/receipt verification)
  └─→ absent      (abandon only after the Storage object is confirmed absent)

ready
  └─→ terminal for WP-2.8B
```

`ready → pending`, ready-row abandonment, ready binary replacement and ready original deletion are forbidden in B. Later recoverable metadata deletion is not pulled forward from WP-2.8C.

Ordinary committed-media reads must exclude private `pending` rows. Pending recovery metadata is available only through the writer/recovery boundary; a `media.read`-only viewer must not receive an uncommitted private object as gallery/media truth.

### 2. Storage mode discrimination and A compatibility

No new top-level Media bounded context is created. Logical storage mode is derived from mutually exclusive persisted fields rather than requiring a new parallel entity:

- WP-2.8A remote reference: `remote_url` non-null, `storage_path` null;
- WP-2.8B private upload: `remote_url` null, `storage_path` non-null.

The forward-only B migration must replace A's remote-only CHECK with a discriminated CHECK that preserves every accepted A remote invariant and permits only the frozen B private states.

The existing A `listVenueRemoteMedia` provider query currently starts from Venue `media_links`. B must harden that read boundary so a Venue containing both remote and private media still returns **only ready remote-reference rows** to the A parser. A private/pending row must be filtered out before the remote parser rather than turning a valid mixed gallery into `provider_response_invalid`. A regression test with one remote + one private Venue media row is mandatory.

### 3. File formats and exact resource bounds

WP-2.8B enables these private input formats only:

| Extension | Canonical MIME | Required signature check |
|---|---|---|
| `.jpg`, `.jpeg` | `image/jpeg` | bytes begin `FF D8 FF` |
| `.png` | `image/png` | exact PNG 8-byte signature `89 50 4E 47 0D 0A 1A 0A` |
| `.webp` | `image/webp` | `RIFF` at bytes 0..3 and `WEBP` at bytes 8..11 |

Extension matching is case-insensitive for validation; stored original filename is private display metadata and is not rewritten merely to normalize extension case.

The earlier “20 MB/object” design target is operationalized by B as **20,000,000 bytes maximum** (decimal MB), with accepted byte size `1..20,000,000`. This is a B implementation freeze, not a claim that a previous document already defined the byte conversion.

Before reservation, the application boundary must validate the exact bytes and derive canonical MIME, byte size, dimensions and SHA-256. Ready image dimensions are bounded to:

- width `1..16384` pixels;
- height `1..16384` pixels;
- width × height at most **50,000,000 pixels**.

These dimension limits are B resource-hardening values introduced here under `SEC-FILE-004`; they do not change Venue product semantics.

`original_filename` is private metadata only, never a path component. B bounds it to `1..512` Unicode scalar values and rejects NUL/C0 control characters. Extension validation uses a derived filename view; display metadata is not destructively normalized.

Canonical SHA-256 is exactly 64 lowercase hexadecimal characters over the exact bytes that are uploaded for that media row.

HEIC/HEIF remains disabled in B because the frozen file-security contract permits it only when safely supported for storage/preview conversion, which is not yet established by the repository.

### 4. Private original row

A reserved/ready private original has:

- `media_type='image'`;
- `remote_url=null`;
- `source_page_url=null`;
- `storage_path='<project_id>/media/<media_id>/original'` exactly;
- `original_filename`, canonical `mime_type`, positive `size_bytes`, canonical `sha256`, `width_px`, `height_px` present before upload reservation is committed;
- `derivative_of_id=null`;
- `is_original=true`;
- `upload_status='pending'` or `ready` only;
- category/caption use the already accepted A category and caption normalization/bounds;
- server-controlled project/audit identity.

The caller-generated `media_id` and `link_id` are stable retry identities. Reservation atomically creates the pending original metadata and its same-project Venue `gallery` link. The link remains associated with the same media identity through finalization; abandon removes the pending DB reservation/link only after Storage absence is proved.

### 5. Derivative row/version contract

B supports exactly two derivative kinds:

- `thumbnail`;
- `preview`.

The B migration adds explicit derivative-generation identity sufficient to satisfy the frozen Storage architecture: `derivative_kind` nullable text and `derivative_version` nullable positive integer.

Rules:

- an original has both fields null;
- a derivative has `derivative_of_id` pointing to a same-project **ready original**, `is_original=false`, a non-null allowed derivative kind and version `1..32767`;
- a derivative is a separate `media` row with its own caller-generated UUID and private Storage object;
- derivative Storage path is exactly `<project_id>/media/<derivative_media_id>/<derivative_kind>-v<derivative_version>`;
- `(project_id, derivative_of_id, derivative_kind, derivative_version)` is unique;
- a derivative cannot parent itself and cannot point to another derivative;
- derivative category, caption, `source_page_url` and original filename are null; display/business metadata is inherited/read from the original relationship rather than duplicated;
- derivative bytes must independently pass the enabled image-format, size, signature, dimension and SHA-256 checks;
- a ready derivative is immutable. Regeneration creates a new derivative version/row/object rather than overwriting the prior ready derivative or original.

This append-version rule provides direct `ACC-056` evidence: changing/regenerating a derivative cannot mutate the original object's path, exact bytes or SHA-256.

### 6. Upload / finalize ordering and retry identity

The exact online B sequence is:

1. validate the selected/generated bytes locally at the application boundary;
2. calculate canonical metadata and SHA-256;
3. call the protected media lifecycle command with action `reserve` and caller-generated stable IDs;
4. receive/validate the exact pending metadata receipt and canonical opaque `storage_path`;
5. upload the bytes to `project-private` at **exactly** that path through the Supabase Storage adapter with overwrite/upsert disabled;
6. inspect the provider result fail-closed: returned/observed object path must equal the reserved path; object size/MIME metadata, where exposed by Storage, must agree with the reservation;
7. call the protected lifecycle command with action `finalize`;
8. the database finalizer verifies the exact `storage.objects` bucket/name reservation exists before changing `pending → ready` and updates server audit/revision fields;
9. only the returned ready receipt becomes committed Media truth.

A failed validation never creates a reservation. A Storage/network failure leaves `pending`; it is not rendered as committed media. An ambiguous acknowledgement retries with the same IDs/path; no new logical media/link is allocated.

### 7. Storage-success / DB-finalize-failure recovery

A `pending` DB reservation is the recovery journal for B.

On recovery:

- `pending` + reserved object present at the exact path → retry `finalize` with the same media identity;
- `pending` + object absent → upload may be retried while the caller still has the bytes, otherwise the reservation may be abandoned cleanly;
- object path/metadata substitution or malformed provider response → fail closed; do not mark ready;
- if the object must be discarded, call Storage delete first, verify exact-path deletion/not-found idempotently, then call protected `abandon`;
- `abandon` may remove a pending metadata/link reservation only when the exact reserved Storage object is absent;
- if Storage cleanup cannot be confirmed, keep the pending reservation so recovery evidence is not lost.

No cron/background scheduler is assumed. No user is required to edit raw `storage.objects` rows or manually reconcile bucket internals to recover `ACC-055`.

### 8. Protected lifecycle command / idempotence

WP-2.8B exposes **one public protected capability command family** for private-media metadata lifecycle. It may use private/revoked internal helper functions to keep functions small, but authenticated clients receive EXECUTE only on the narrow public wrapper.

The public action allowlist is exactly:

- `reserve_original`;
- `finalize_original`;
- `abandon_original`;
- `reserve_derivative`;
- `finalize_derivative`;
- `abandon_derivative`.

The command:

- is `SECURITY DEFINER` with fixed safe `search_path` / qualified objects;
- verifies authenticated identity, locks/validates the target project before live `media.write`, and validates every same-project Venue/media/parent/link relationship;
- never accepts caller-owned project/audit fields or arbitrary Storage paths;
- constructs/compares the canonical Storage path server-side from project/media/kind/version identity;
- uses caller-generated media/link UUIDs as replay identities;
- same project + same action identity + same canonical caller semantic payload is idempotent;
- same-project reused identity with different semantic payload is typed conflict (`23505`-style mapping is acceptable);
- foreign-project known UUID collision or relationship remains generic/non-disclosing (`42501`-style mapping is acceptable);
- finalizing an already-ready identical reservation is a successful replay;
- abandoning an already-absent same-project reservation is a successful replay after project authorization, but a known foreign-project identity must not become an existence oracle;
- cannot abandon or replace a ready original/derivative.

Direct client INSERT/UPDATE/DELETE on `media` / `media_links` remains revoked.

### 9. Storage RLS hardening for reservations and immutability

The accepted `project-private` bucket and `media.read` / `media.write` permission keys are reused. B does not create a second bucket or role model.

The B Storage policy hardening must make path knowledge insufficient **and** bind binary mutation to DB reservation state:

- INSERT: `media.write` + canonical namespace + exact same-project `media` row whose `storage_path` equals the object name and whose status is `pending`; arbitrary valid-looking UUID paths without a reservation are denied;
- UPDATE/rename/upsert replacement: denied for B media objects; objects use stable immutable paths and client upload uses overwrite disabled;
- DELETE: allowed only with live `media.write` for an exact same-project **pending** reservation/path used by cleanup; direct deletion of ready originals/derivatives is denied in B;
- SELECT/delivery: ready object requires live `media.read`; pending-object inspection/recovery requires live `media.write`; viewer/read-only identities cannot retrieve uncommitted pending binaries;
- malformed path, other project, outsider, revoked, anonymous and guest-like identities remain denied.

Database metadata RLS/read models must likewise avoid exposing `pending` rows as ordinary committed gallery content while preserving writer recovery access.

### 10. Exact-byte duplicate detection and non-disclosure

`MED-006` requires detectability, not automatic merge. B therefore freezes **detect-only** project-scoped deduplication:

- SHA-256 is stored on ready originals and derivatives as exact-byte identity metadata;
- after/while finalizing a private **original**, the authorized same-project workflow may report an existing ready original in the same project with the same SHA-256;
- hash lookup never searches/returns foreign-project media to the caller and does not reveal whether another project contains the same bytes;
- hash equality grants no read/write authority;
- B does **not** automatically merge logical media, reuse another media UUID/link or delete the newly uploaded object merely because a duplicate is detected;
- multiple same-project logical media records with the same hash therefore remain permitted unless a later product decision explicitly owns dedup reuse semantics.

This keeps `MED-006` satisfied without inventing destructive or cross-record merge behavior.

### 11. Storage/provider receipts and application error boundary

The binary adapter lives under `src/infrastructure/supabase/storage/` and implements typed application ports; Supabase client/provider objects never leak into domain/application code.

Required receipt behavior:

- reserve/finalize DB receipts are parsed fail-closed against expected project/media/link/parent/path/state/payload;
- upload receipt must correspond to the exact reserved bucket/path; substituted/missing/malformed path is a provider-response failure;
- inspect/list recovery response must identify at most the exact expected object; ambiguous/duplicate/substituted results fail closed;
- delete treats exact-path not-found as idempotent absence but cannot report success for a different path;
- raw Supabase errors are mapped into the existing Media error boundary, extended only with stable categories actually required by B (validation, conflict, authorization/non-disclosing persistence, retryable storage/backend, provider-response/data-integrity);
- permanent validation/authorization failures are not retried indefinitely; retryable network/backend/recovery failures preserve the same media identity/path.

One `MediaService` remains the logical application boundary. Do not create parallel `domain/media`, `application/media` or a second private-media service architecture.

## Stop-condition status

All ten original pre-READY questions are now **SPECIFIED** by the contract above:

1. exact private upload statuses — `pending`, `ready`;
2. legal transitions/visibility — frozen;
3. upload/verify/metadata-link ordering and retry identity — frozen;
4. Storage-success/DB-failure recovery — frozen;
5. cleanup/retry without scheduler — frozen;
6. immutable original + derivative parent/kind/version rules — frozen;
7. project-scoped SHA-256 detect-only behavior/non-disclosure — frozen;
8. exact formats, 20,000,000-byte ceiling and validation ownership — frozen;
9. protected command family/idempotence/authorization — frozen;
10. Storage/DB receipt fail-closed semantics — frozen.

The historical activation gates `dd2b03c...` / `34421686462` and `3e6fe668...` / `34423597208` are **CLOSED / VERIFIED — 5/5 SUCCESS**. The current gate is exact-head CI for the `ACCEPTANCE_PENDING / C-ACCEPTANCE` governance transition; Pass C may reconcile evidence only after that governance HEAD is green.

## Sizing review after activation freeze

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| meaningfully changed Documents/Media private lifecycle | 1 | 3 | 3 |
| new persistent entity/table | 0 | 1 | 0 |
| forward-only media/Storage lifecycle hardening migration family | 1 | 1 | 1 |
| new public protected lifecycle capability command family | 1 | 2 | 2 |
| changed DB + Storage RLS/authorization boundary | 1 | 2 | 2 |
| major UI route/workflow | 0 | 1 | 0 |
| public/unauthenticated capability surface | 0 | 2 | 0 |
| new external provider integration | 0 | 3 | 0 |
| offline/sync semantics | 0 | 2 | 0 |
| security-sensitive token/crypto boundary | 0 | 2 | 0 |
| financial/calculation critical engine | 0 | 3 | 0 |
| backup/import/version migration semantics | 0 | 2 | 0 |
| **Total** |  |  | **8** |

Cohesion review: **PASS**. The single public capability is one state machine over one DB reservation + one project-private object identity; reserve/finalize/abandon are not independently useful product features. Internal SQL/helper and Storage-adapter functions must still be split by responsibility/complexity thresholds rather than implemented as one oversized function. The A mixed-gallery read hardening is a required compatibility change caused by this same schema expansion, not a separate feature.

If implementation discovers an additional public capability, entity or independent recovery subsystem that pushes this packet above 10 points, split before production code rather than weakening the contract.

## Expected vertical slice

- UI/route: none.
- domain: private media kind/state/file metadata/path/replay invariants under `domain/documents/`.
- application: extend existing `MediaService`; typed reserve/finalize/abandon + pending-recovery operations through explicit ports.
- infrastructure: private Supabase Storage adapter under `infrastructure/supabase/storage/`; metadata/RPC adapter stays under `infrastructure/supabase/`; both fail closed.
- cloud persistence: forward-only broadening of A's `media` constraints, derivative kind/version constraints/indexes, pending/ready visibility, protected lifecycle command, hardened DB/Storage RLS.
- accepted-A compatibility: remote create/list remains valid and a mixed remote/private Venue does not poison `listVenueRemoteMedia`.
- local/offline: none; B does not persist selected File/Blob across app restart.

## Verification plan

### Domain/application/provider

- exact JPEG/PNG/WebP extension + MIME + magic-byte agreement; active/unsupported/renamed content rejected;
- byte boundaries `1`, `20,000,000`, `20,000,001`;
- width/height and 50,000,000-pixel resource boundaries;
- filename bound/control-character rejection while preserving display metadata;
- lowercase 64-hex SHA-256 and exact-byte hashing;
- original versus derivative row/path/kind/version invariants;
- invalid derivative parent, derivative-of-derivative, self-parent, duplicate kind/version rejected;
- stable reserve/finalize/abandon replay and typed conflict;
- provider upload/inspect/delete receipts reject missing/substituted/wrong-project/wrong-path/malformed results;
- retryable Storage failure preserves pending identity; permanent validation failure creates no reservation;
- A remote list remains deterministic/fail-closed and excludes private/pending media before remote parsing.

### Database / RLS / Storage / adversarial

- forward migration preserves every accepted A remote row/command invariant;
- private original pending reservation + Venue link is atomic;
- pending is not ordinary committed media; viewer cannot retrieve pending binary;
- Storage INSERT without exact pending DB reservation denied even with a syntactically valid same-project path;
- owner/editor pending upload allowed; viewer/anon/outsider/project-B/revoked denied;
- Storage UPDATE/overwrite/rename denied for B objects;
- pending cleanup DELETE allowed to writer; ready original/derivative direct DELETE denied;
- finalize fails unless exact bucket/path object exists; exact replay succeeds;
- Storage-success/finalize-failure recovery can finalize later without manual raw-Storage mutation;
- abandon refuses while object remains; succeeds after exact delete/not-found; replay safe;
- original immutable fields/path/hash cannot change after ready;
- derivative v2 can be created while v1 and original remain unchanged (`ACC-056`);
- same-project equal SHA is detectable; foreign-project equal SHA is not disclosed;
- exact cross-project media/link/parent/path injection and known UUID collision remain denied/non-disclosing;
- live role downgrade/revocation affects subsequent DB command and Storage authorization in the same authenticated session;
- public wrapper grant/search_path/internal-helper non-exposure asserted directly;
- mixed remote + private gallery persists and A remote-list query still returns only the remote row;
- clean-checkout integration exercises real local Supabase Storage/RLS, not fake ports only.

### Acceptance responsibility

- `ACC-055`: interrupt after pending reservation and after successful Storage upload; neither state is Ready until finalization; both have a tested retry/clean-abandon route without manual raw Storage reconciliation.
- `ACC-056`: persist one ready original and derivative v1, then create derivative v2; verify original Storage path, exact hash/metadata identity and bytes remain unchanged.
- `ACC-058`: inspect resulting private Storage object names and prove raw original filename/private labels do not appear in paths; filename remains authorized private metadata.
- `MED-006`: same-project exact duplicate original hash is detectable without automatic merge and without any foreign-project content-presence disclosure.

## Pass A — IMPLEMENT

Pass A is complete. The private-media vertical reached exact-head green on `150c10c07452748e3092e316a3cb9a26f272ff3e` / CI `34555183344` — **5/5 SUCCESS**, clean-checkout included. The first fresh Pass-B review was also green on `a23e6925f4d95e5d49cdea5b4e62b899cdd7a605` / `34555832894`. Pass C then correctly exposed MED-006 receipt incompleteness on RED head `4eddca8aa94a2ed95d37bac47b8f3efeb3b4faf4` / `34556856411`, reopening the packet. The remediation is exact-head green on `f815844d9f4a2c62575ee91530af94febf78dab0` / `34605466532` — **5/5 SUCCESS**.

## Pass B — ADVERSARIAL REVIEW

Fresh affected review after MED-006 remediation: **PASS**. Open `BLOCKING` / `MAJOR` findings: **∅**.

The review reconstructed the frozen packet contracts and checked the remediation for project isolation, `SECURITY DEFINER`/fixed-search-path safety, internal-helper non-exposure, deterministic detect-only semantics, no auto-merge behavior, durable replay snapshot, fail-closed TypeScript parsing, existing A compatibility, architecture/size gates and independent DB/RLS evidence. The lifecycle writer gate locks the target project row before live `media.write`, serializing same-project finalizations so concurrent equal-SHA finalizations cannot independently miss committed predecessors. Direct pgTAP evidence proves empty/same-project/multiple/replay/cross-project receipt behavior and wrapper privilege hardening. Exact remediation CI `34605466532` is **5/5 SUCCESS**, including clean-checkout full verify.

Disposition: no unresolved minor finding is carried into acceptance. The stale durable-state documents discovered during review are corrected by this governance transition and are not a production defect.

## Pass C — ACCEPTANCE / RECONCILIATION

Current state: **ACCEPTANCE_PENDING / C-ACCEPTANCE**. Pass C must begin only after the exact HEAD containing this transition is **5/5 SUCCESS**. Then mechanically reconcile every WP-2.8B Feature/Requirement/Acceptance/Security responsibility as `EXPECTED ↔ IMPLEMENTED ↔ VERIFIED`, including `ACC-055`, `ACC-056`, `ACC-058` and the remediated `MED-006` receipt contract. WP-2.8B may be marked `ACCEPTED` only when required-minus-evidenced is **∅**, no BLOCKING/MAJOR finding remains, durable status/coverage is reconciled, and the final acceptance HEAD is exact-head green.
