# WP-2.8B — Private Venue image archive lifecycle

## Identity

- Work Packet ID: `WP-2.8B`
- Lot: `2`
- Name: Private Venue image archive lifecycle
- State: `ACCEPTED`
- Current pass: `COMPLETE`
- Primary bounded context: Documents/Media private image archive, immutable originals, derivatives and recovery
- Branch/PR: `lot-2/venues-core` / Lot-2 integration PR not opened yet
- Pass-C evidence: `WP-2.8B-ACCEPTANCE.md`

## Accepted responsibility

WP-2.8B accepts only the Lot-2 private-media foundation assigned to this packet:

- remaining private-archive slice of `FTR-024` after accepted WP-2.8A;
- Lot-2 foundation slice of `FTR-092` — original/derivative/orphan lifecycle;
- `VEN-013` — archived/private visit media distinguished from remote refs;
- `MED-004` — archived original photo bytes preserved;
- `MED-005` — thumbnail/preview are distinct derivatives;
- `MED-006` — exact duplicate binary detectable by hash;
- `MED-009` — interrupted/orphan uploads recoverable/cleanable and not presented committed;
- `MED-010` — private file access cannot rely on obscurity;
- `ACC-055`, `ACC-056`, `ACC-058` where owned by the private-media foundation;
- the packet-applicable `AUTHZ-*` / `SEC-*` controls listed below.

Required WP-2.8B responsibilities minus accepted/evidenced WP-2.8B responsibilities: **∅**.

Whole `FTR-024` and `FTR-092` remain incomplete because later WP-2.8C/WP-2.11/WP-2.12 and Lots 10/11 own downstream responsibilities.

## Accepted implementation contract

### Private lifecycle and visibility

Private media uses exactly two WP-2.8B lifecycle states:

- `pending` — authorized reservation/recovery state; not ordinary committed media;
- `ready` — exact private Storage object exists and protected finalization succeeded.

Legal lifecycle:

```text
absent → pending → ready
           └────→ absent   (clean abandon only after exact Storage absence)
```

`ready → pending`, ready-row abandonment, ready overwrite/replacement and direct ready binary deletion are forbidden in B. `pending` rows/objects are hidden from read-only ordinary committed-media views; writers retain recovery access.

### Storage mode and path

- WP-2.8A remote reference: `remote_url` non-null, `storage_path` null.
- WP-2.8B private media: `remote_url` null, `storage_path` non-null.
- Bucket remains `project-private`.
- Original path: `<project_id>/media/<media_id>/original`.
- Derivative path: `<project_id>/media/<derivative_media_id>/<kind>-v<version>`.
- Raw private filenames/labels never become path components.
- Knowledge of a syntactically valid object path is never authority.

### File validation

Enabled private image types are JPEG/JPG, PNG and WebP only. Extension, MIME and signature must agree. HEIC/HEIF remains disabled in this packet.

Frozen limits:

- byte size `1..20,000,000`;
- width `1..16,384`;
- height `1..16,384`;
- total decoded pixels at most `50,000,000`;
- original filename `1..512` Unicode scalar values with unsafe control characters rejected;
- SHA-256 exactly 64 lowercase hexadecimal characters over exact uploaded bytes.

Generated thumbnail/preview bytes pass the same supported-type, byte and decoded-dimension validation boundary.

### Original / derivative invariants

A private original is an image with `remote_url=null`, canonical `storage_path`, `derivative_of_id=null`, `is_original=true` and `upload_status in ('pending','ready')`.

Derivatives:

- kinds: `thumbnail`, `preview`;
- have their own UUID, Storage object, SHA-256 and size/dimensions;
- point only to a same-project **ready original**;
- use positive version `1..32767`;
- `(project_id, derivative_of_id, derivative_kind, derivative_version)` is unique;
- cannot self-parent or parent another derivative;
- ready derivatives are immutable;
- regeneration appends a new version/row/object rather than mutating the original or earlier derivative.

### Reserve / upload / finalize / recovery

Online original workflow:

1. validate exact bytes and metadata locally;
2. calculate SHA-256;
3. reserve stable caller-generated media/link identity through the protected lifecycle RPC;
4. validate pending receipt/canonical path;
5. upload with overwrite/upsert disabled to the exact `project-private` path;
6. fail closed on substituted/missing/malformed provider receipt;
7. finalize through the protected lifecycle RPC;
8. DB finalizer verifies exact Storage object before `pending → ready`;
9. only the ready receipt becomes committed media truth.

Recovery:

- pending + exact object present → retry finalize using the same identity;
- pending + object absent → retry upload while bytes are available, or abandon;
- cleanup deletes exact pending object first, verifies delete/not-found, then abandons metadata/link;
- if cleanup cannot be confirmed, pending reservation remains as recovery evidence;
- no scheduler/manual raw `storage.objects` reconciliation is assumed.

### Protected lifecycle command / authorization

Public action allowlist:

- `reserve_original`;
- `finalize_original`;
- `abandon_original`;
- `reserve_derivative`;
- `finalize_derivative`;
- `abandon_derivative`.

The public command is `SECURITY DEFINER` with a fixed trusted `search_path`, validates authenticated identity, locks/validates the project before live `media.write`, validates same-project Venue/media/link/parent relations, derives Storage paths server-side and maps replay/conflict/non-disclosure deterministically. Direct client INSERT/UPDATE/DELETE on `media` / `media_links` remains revoked. Internal helper/core execution is not granted to client roles.

Storage policies bind binary access to both live permissions and the exact DB reservation/state:

- INSERT requires live `media.write`, canonical namespace and exact pending reservation/path;
- UPDATE/rename/upsert replacement is denied;
- DELETE is available only for exact pending cleanup under live `media.write`;
- SELECT on ready media requires live `media.read`;
- pending-object recovery inspection requires live `media.write`;
- anon/outsider/project-B/revoked identities remain denied/non-disclosing.

### MED-006 exact-byte duplicate receipt

Duplicate detection is project-scoped and detect-only.

For `finalize_original`, `duplicateOriginalMediaIds` contains only **other** `ready` private originals in the same project with the same SHA-256, sorted deterministically. It excludes the current media, remote references, derivatives and pending media. Equal hashes in another project are not disclosed.

Detection never merges logical media, reuses another media/link UUID, deletes an object or grants authority. The first finalization stores the duplicate-ID snapshot in the durable operation receipt; exact replay returns that stored snapshot even if later duplicates appear. Same-project lifecycle operations serialize through the project-row writer lock before duplicate derivation.

## Explicitly out of scope / downstream

- remote-reference metadata foundation — already accepted WP-2.8A;
- recoverable soft-delete/restore of A remote references — WP-2.8C;
- global trash UI / 30-day purge scheduler;
- Venue gallery/detail/order/main-photo UX — WP-2.11;
- local/offline image queue and visit capture — WP-2.12/Lot 10;
- document upload/versioning — WP-2.9 and later document lots;
- arbitrary server image proxy/transformation service;
- automatic cross-record merge or cross-project deduplication;
- backup/import/export binary packaging;
- real private venue data migration — Lot 12.

## Applicable authorization / security controls

Reconciled in `WP-2.8B-ACCEPTANCE.md`:

- `AUTHZ-001`, `AUTHZ-002`, `AUTHZ-005`, `AUTHZ-006`, `AUTHZ-007`, `AUTHZ-008`, `AUTHZ-012`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020`;
- `SEC-AUTH-012`, `SEC-AUTH-013`, `SEC-AUTHZ-001..009`;
- `SEC-VAL-001..004`, `SEC-VAL-008`;
- `SEC-INJ-001`, `SEC-INJ-002`;
- `SEC-FILE-001`, `SEC-FILE-002`, `SEC-FILE-003`, `SEC-FILE-004`, `SEC-FILE-008`, `SEC-FILE-009`;
- `SEC-ABUSE-004`;
- `SEC-VER-001`, `SEC-VER-002`, `SEC-VER-005`, `SEC-VER-006`;
- `SEC-SRV-001` remains satisfied because no arbitrary server-side URL fetch was introduced.

## Sizing / architecture

Final packet size remains **8 points** and cohesion **PASS**. No extra public capability/entity/recovery subsystem expanded the packet beyond the orchestration split threshold.

Architecture remains:

- domain: `src/domain/documents/`;
- application: existing `MediaService` and typed ports under `src/application/documents/`;
- metadata/RPC adapter: `src/infrastructure/supabase/`;
- binary Storage adapter: `src/infrastructure/supabase/storage/`;
- cloud persistence: forward-only Supabase migrations and project-private Storage/RLS.

No parallel Media bounded context or second service architecture was introduced.

## Verification evidence

### Domain / application / provider

- `src/domain/documents/venue-private-image.test.ts` — JPEG/PNG/WebP signatures, renamed/unsupported rejection, exact size and decoded-dimension/pixel bounds, safe filename rules.
- `src/domain/documents/venue-private-generated-image.test.ts` — generated derivative MIME/signature/size/dimension validation.
- `src/application/documents/media-service.private-original.test.ts` and recovery tests — reserve/upload/finalize/recovery behavior.
- `src/infrastructure/supabase/supabase-private-media-lifecycle-adapter.test.ts` — receipt parsing/replay/provider failures and MED-006 finalization contract.
- `src/infrastructure/supabase/parse-private-media-original-finalization.ts` — fail-closed duplicate receipt parsing.

### Database / RLS / Storage / acceptance

- `supabase/tests/venue_private_media_lifecycle_test.sql` — lifecycle/replay/metadata invariants.
- `supabase/tests/venue_private_media_storage_rls_red_test.sql` — exact reservation binding, pending/ready visibility, overwrite/rename/delete restrictions and cleanup.
- `supabase/tests/venue_private_media_adversarial_review_test.sql` — cross-project identities, derivative parent rules, live role downgrade/revocation and non-disclosure.
- `supabase/tests/venue_private_media_acceptance_test.sql` — `ACC-055`, `ACC-056`, `ACC-058` persisted acceptance evidence.
- `supabase/tests/venue_private_media_dedup_receipt_red_test.sql` — MED-006 zero/single/multiple/sorted/self-exclusion/replay-snapshot/cross-project receipt behavior.
- `supabase/tests/venue_private_media_dedup_wrapper_security_test.sql` — public wrapper/core privilege and search-path hardening.

## Pass history

### Pass A — IMPLEMENT

**PASS.** Exact implementation checkpoint `150c10c07452748e3092e316a3cb9a26f272ff3e` / CI `34555183344` — **5/5 SUCCESS**, clean-checkout included.

### Pass B — ADVERSARIAL REVIEW

First fresh review `a23e6925f4d95e5d49cdea5b4e62b899cdd7a605` / CI `34555832894` — **5/5 SUCCESS**.

Pass C then exposed a genuine MED-006 receipt gap on RED head `4eddca8aa94a2ed95d37bac47b8f3efeb3b4faf4` / CI `34556856411`; the packet correctly returned to remediation.

Remediation `f815844d9f4a2c62575ee91530af94febf78dab0` / CI `34605466532` — **5/5 SUCCESS**, including clean checkout.

Fresh affected Pass B after remediation: **PASS**. Open BLOCKING/MAJOR findings **∅**; no MINOR finding carried into acceptance.

### Pass C — ACCEPTANCE / RECONCILIATION

**PASS.** Entry governance `70c251fee7a54bf1f5de9e3fca4dee6ce067d778` / CI `34614442341` — **5/5 SUCCESS**, including full `npm run verify` from clean checkout.

Mechanical reconciliation is persisted in `WP-2.8B-ACCEPTANCE.md`:

```text
required WP-2.8B responsibilities
- implemented responsibilities
- verified responsibilities
= ∅

open BLOCKING = ∅
open MAJOR = ∅
open MINOR carried into acceptance = ∅
```

Packet state is therefore **ACCEPTED / COMPLETE**, subject only to this final acceptance-governance commit itself completing exact-head CI successfully. Until that final CI is green, downstream WP-2.8C remains **PLANNED** and must not be activated.
