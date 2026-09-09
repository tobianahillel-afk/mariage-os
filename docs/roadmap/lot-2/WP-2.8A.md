# WP-2.8A — Venue remote-image metadata and links

## Identity

- Work Packet ID: `WP-2.8A`
- Lot: `2`
- Name: Venue remote-image metadata and links
- State: `ACCEPTED`
- Current pass: `COMPLETE`
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

### Requirements / Acceptance / Security IDs

- Product/requirements: `FTR-024` Lot-2 foundation, `VEN-013`, `MED-007`, `MED-008`, `MED-010`, `MED-013`;
- acceptance responsibility: foundation toward `ACC-057` and `ACC-058` only; no claim for later DOM rendering, private upload or deletion lifecycle;
- authorization: `AUTHZ-001`, `AUTHZ-002`, `AUTHZ-004`, `AUTHZ-005`, `AUTHZ-006`, `AUTHZ-007`, `AUTHZ-008`, `AUTHZ-012`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020`;
- security: `SEC-AUTH-012`, `SEC-AUTH-013`, `SEC-AUTHZ-001..009`, `SEC-VAL-001`, `SEC-VAL-002`, `SEC-VAL-003`, `SEC-VAL-004`, `SEC-VAL-007`, `SEC-VAL-008`, `SEC-INJ-001`, `SEC-INJ-002`, `SEC-SRV-001`, `SEC-VER-001`, `SEC-VER-002`, `SEC-VER-005`, `SEC-VER-006`;
- invariants `63`, `66`, `67`, `72`, `100` where applicable to this remote-reference slice.

### Applicable normative controls

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
- `PLANNED → READY` governance transition: **CLOSED / VERIFIED** by `c49d182c50ee882751bb73b63f3720f40356e5a7` / `34401165950` — **5/5 SUCCESS**.
- `READY → IN_PROGRESS / A-IMPLEMENT` governance transition: **CLOSED / VERIFIED** by `2462a70cbf20444eed579370f25b58facd7adce9` / `34401969811` — **5/5 SUCCESS**.
- Pass-A implementation/hardening head `3c9d53af80ee11f7c276ed9f0bb14118988a95b3` / `34414303456` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.
- `IN_PROGRESS/A → REVIEW_PENDING/B` transition `ac5e2c6aaf6c98ddaec8a85261d254c6395dcb46` / `34415090306` — **5/5 SUCCESS**.
- Pass-B finding `WP2.8A-B-001` red-first head `fc973ab5538d86573164705164a16ab0bd78db99` / `34415717118` — **EXPECTED FAILURE**.
- Pass-B remediation head `db892fe02a324859f5bf3f3ac79a0687e95f3736` / `34416328055` — **5/5 SUCCESS**.
- Final fresh Pass-B authorization/review evidence `556ebab4ca642dd3d86d1d1a5c5761d18446eb7c` / `34416889470` — **5/5 SUCCESS**, including clean-checkout verify.
- Pass-C entry transition `756143192d38aa042cfee6c99d26734b9b587c82` / `34418038428` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.
- WP-2.8B and WP-2.8C remain PLANNED and cannot run concurrently with WP-2.8A.

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

## Feature-record / traceability boundary

`LOT-2-COVERAGE-MATRIX.md` explicitly treats each `WP-2.x.md` as the packet **Acceptance record**. For WP-2.8A, this packet record plus the WP-2.8 coverage addendum and repository test/code evidence are therefore the durable responsibility-level record used for Pass C. Whole `FTR-024` is deliberately broader than this packet (WP-2.8B, WP-2.11 and WP-2.12 remain downstream), so this packet must not promote the whole Feature Ledger row or claim a complete feature-level FIR. The feature-level record/status remains incomplete until all assigned feature responsibilities are implemented and reconciled.

## Pass A — IMPLEMENT

**COMPLETE / VERIFIED.** Readiness head `c49d182c50ee882751bb73b63f3720f40356e5a7` / `34401165950` and the separate `READY → IN_PROGRESS` transition `2462a70cbf20444eed579370f25b58facd7adce9` / `34401969811` were both **5/5 SUCCESS**. The first product change was the RED-first boundary `56b931e66324cf34d8e898c8e50fed079e4d48ab` / `34402670623`, which failed as intended because `media`, `media_links` and the atomic create/replay RPC did not yet exist.

Pass A implemented the complete remote-reference metadata slice: strict Documents/Media domain normalization and replay equality, `MediaService`, fail-closed Supabase parser/adapter, project-scoped `media` + `media_links` persistence, same-project composite relationships, `media.read` RLS, live `media.write` protected RPC authorization, atomic media+Venue-link create/replay, typed same-project conflict and foreign-project non-disclosure, plus domain/application/provider and pgTAP coverage. Static/lint complexity and measured branch-coverage gaps were closed without relaxing gates; head `12490e0e47c8a51d48eb3dac54973c950fa696b3` / `34412950692` was **5/5 SUCCESS** with 100% measured unit coverage.

A pre-transition adversarial diagnostic was then run before the formal Pass-B state transition. `2dffe30470598e5a788340633fc2bb7ad3e1fb86` / `34413621642` proved link-ID foreign-project non-disclosure/atomic rollback and semantic-link conflict, but exposed one material boundary defect: direct RPC calls accepted non-canonical remote/source URLs that the TypeScript boundary would normalize. Forward-only migration `20260909230000_harden_venue_remote_media_url_canonicality.sql` fixed the PostgreSQL canonicality boundary on `3c9d53af80ee11f7c276ed9f0bb14118988a95b3` / `34414303456`, now **5/5 SUCCESS** including clean-checkout `npm run verify`. The diagnostic is retained transparently as Pass-A hardening and is not treated as a substitute for the required fresh formal Pass B.

Pass-A decision: **COMPLETE / VERIFIED — transition to `REVIEW_PENDING / B-ADVERSARIAL-REVIEW`.**

## Pass B — ADVERSARIAL REVIEW

- `REVIEW_PENDING / B-ADVERSARIAL-REVIEW` transition `ac5e2c6aaf6c98ddaec8a85261d254c6395dcb46` / `34415090306`: **5/5 SUCCESS**, including clean-checkout verify.
- Fresh review reconstructed the remote-media slice from the packet, media lifecycle addendum, authorization/security contracts and implemented SQL/provider boundaries rather than relying on Pass-A conclusions.
- Canonical remote/source URL parity retained its direct-RPC regression coverage after the Pass-A hardening.
- `WP2.8A-B-001` **MAJOR** — replay identity was incomplete at the SQL boundary: after an existing `media_id` matched media metadata, the RPC could still accept a different `link_id` and/or Venue target and create a second gallery relationship. RED-first `fc973ab5538d86573164705164a16ab0bd78db99` / `34415717118` failed as intended because the drift returned success and left a second link.
- `WP2.8A-B-001` is **RESOLVED / VERIFIED** by forward-only migration `20260909232500_harden_venue_remote_media_replay_identity.sql` on `db892fe02a324859f5bf3f3ac79a0687e95f3736` / `34416328055`: **5/5 SUCCESS**. Existing-media replay now requires the original same-project link identity, Venue target, target type and relationship; same-project drift is `23505`, foreign-project link identity remains generic `42501`, and no second link is created.
- Fresh authorization evidence `556ebab4ca642dd3d86d1d1a5c5761d18446eb7c` / `34416889470` directly proves project-lock-before-live-permission evaluation, authenticated-only public RPC execution, internal helper non-exposure, `search_path=pg_catalog`, editor write success, immediate same-session downgrade denial, restored editor success and immediate same-session revocation denial. Exact CI: **5/5 SUCCESS**, including clean-checkout verify.
- Existing RLS/cross-project tests continue to cover direct table isolation, foreign-project UUID non-disclosure and same-project relational integrity; provider/domain/application tests retain fail-closed malformed/substituted/wrong-project/wrong-link behavior and exact URL/caption boundaries.
- Architecture/scope review found no parallel `domain/media` or `application/media` boundary, no binary Storage lifecycle, no remote fetch/proxy/rendering, no deletion/restore and no offline/import scope drift.
- Open BLOCKING/MAJOR findings: **∅**.
- Pass-B decision: **PASS — transition to `ACCEPTANCE_PENDING / C-ACCEPTANCE`.**

## Pass C — ACCEPTANCE / RECONCILIATION

Pass-C entry transition `756143192d38aa042cfee6c99d26734b9b587c82`, exact CI `34418038428`: **5/5 SUCCESS**, including clean-checkout `npm run verify`. The same run re-executed the existing domain/application/provider/DB acceptance evidence on the exact Pass-C entry head; because WP-2.8A owns only a foundation slice toward `ACC-057`/`ACC-058`, no duplicate packet-only acceptance test or fabricated whole-feature ACC was added.

Mechanical reconciliation:

| Responsibility / control | Expected | Implemented evidence | Verified evidence | Result |
|---|---|---|---|---|
| Frozen Venue remote-image domain | `media_type='image'`, exact nullable category allowlist, canonical remote/source metadata and bounded caption. | `src/domain/documents/venue-remote-media.ts` owns category/type constants, normalization, scalar counting and replay equality. | `venue-remote-media.test.ts` plus coverage tests prove exact categories, normalization, unsafe URL rejection, malformed-surrogate rejection and boundary behavior. | PASS |
| Remote-reference-only media state | No private Storage path, filename/MIME/hash/size/dimensions/derivative; original+ready metadata only; no `source_id`. | `media` checks and protected RPC write only the frozen null/ready state; command/application payload has no `source_id`; parser rejects any substituted non-remote state. | `venue_remote_media_test.sql` inspects the persisted synthetic row; parser tests reject `storage_path`/wrong upload state. | PASS |
| Remote/source URL privacy and canonicality | Remote image HTTPS only; no credentials/local/private forms; source provenance uses public HTTP/HTTPS navigation contract; no command-generated private decoration. | Domain URL normalizer + `media_public_url_is_valid`; forward-only canonicality migration `20260909230000_harden_venue_remote_media_url_canonicality.sql`; adapter sends canonical URLs verbatim and has no private-data URL decoration path. | Domain tests reject active/local/private forms; base pgTAP verifies URL security/bounds; Pass-A adversarial regression rejects non-canonical direct-RPC remote/source URLs. | PASS |
| Exact user-controlled bounds | Remote URL 2048, source-page URL 2048, caption 5000; over-limit rejected, no truncation. | Domain scalar-length validation + SQL command/table checks. | Domain tests exercise scalar boundaries; `venue_remote_media_test.sql` accepts exact 2048/2048/5000 and rejects 2049/2049/5001 at PostgreSQL boundary. | PASS |
| Atomic media + Venue gallery relationship | One semantic command creates the remote media and same-project `venue/gallery` link; no partial media on link failure. | `media`/`media_links` composite project FKs + `create_venue_remote_media` transaction semantics. | Base pgTAP verifies persisted remote row/link and proves link failure rolls back the newly inserted media row. | PASS |
| Stable create/replay identity | Same media/link IDs + same semantic payload replay; same-project drift conflicts; existing media cannot acquire a different Venue/link under replay. | Domain replay equality + RPC exact existing-media/existing-link comparison; forward-only `20260909232500_harden_venue_remote_media_replay_identity.sql`. | Base pgTAP verifies identical replay and `23505` payload conflict; `venue_remote_media_replay_adversarial_review_test.sql` proves `WP2.8A-B-001` regression and one-link invariant. | PASS |
| Foreign-project non-disclosure / relational isolation | Known media/link/Venue identities from another project cannot be read, written or linked and do not reveal existence. | Composite same-project FKs, project-scoped RLS, writer check and generic `42501` foreign-identity paths. | Base/adversarial pgTAP prove foreign Venue/media/link collision rejection, rollback and project-B inability to read project-A known UUIDs. | PASS |
| `media.read` / `media.write` authorization | Owner/editor write as mapped, viewer read-only, anon/outsider/revoked denied; writes evaluate live authority. | Authenticated SELECT + RLS `has_project_permission(...,'media.read')`; SECURITY DEFINER writer locks project before `media.write` permission evaluation; public mutation only through RPC. | Base pgTAP covers owner/editor/viewer/outsider/revoked/project-B; `venue_remote_media_authorization_adversarial_review_test.sql` proves same-session downgrade/revocation behavior. | PASS |
| Privileged RPC/helper hardening | Internal helper not client-executable; anon cannot invoke public command; trusted fixed search path. | Explicit REVOKE/GRANT and `security definer set search_path=pg_catalog`. | Authorization adversarial pgTAP directly asserts privileges, project-lock ordering and exact `proconfig`. | PASS |
| Application/service error contract | Validate identities/domain before persistence; same-project replay conflict is typed; all other provider failures remain generic. | `MediaService` + `MediaPersistenceError` (`conflict`, `provider_response_invalid`, `persistence_failed`). | `media-service.test.ts` proves canonicalized create, invalid-input short circuit, `23505` mapping and generic failure/list behavior. | PASS |
| Fail-closed Supabase provider boundary | RPC/list success must match expected project/media/link/Venue and exact remote-only semantics; duplicates/malformed/substituted rows fail closed. | `parse-venue-remote-media-receipt.ts` + `SupabaseMediaAdapter`, expected caller-payload equality and duplicate detection. | Parser/adapter tests reject wrong project/media/type/storage/URL/payload, malformed responses and duplicate media/link identities. | PASS |
| Active Venue remote-media list | Read only same-project `target_type='venue'`, requested Venue, `relationship_type='gallery'` rows in deterministic provider order. | `SupabaseMediaAdapter.listVenueRemoteMedia` filters project/type/target/relation and orders `created_at DESC`, `id ASC`; `MediaService` exposes the validated query. | Adapter/service tests assert exact filters/order, identity validation, duplicate rejection and generic provider failure. | PASS |
| Composition-root responsibility | No UI/route consumer exists in A; do not instantiate an unused browser runtime service or create a parallel composition root. | Current `src/main.ts`/`src/app/bootstrap/start-application.ts` compose shell/auth/project-access only. Accepted WP-2.7 follows the same backend-foundation pattern with `UI/route: none` and an application service not yet wired into browser bootstrap. | Pass-C architecture read confirms no active Venue consumer exists; runtime composition of MediaService is therefore N/A in A and must be performed by the downstream UI consumer packet (WP-2.11), not hidden here. | PASS |
| Scope fence / deferred lifecycle | No private upload/archive, binary validation/hash, derivative, orphan Storage recovery, remote delete/restore, rendering/proxy/fetch, offline queue, document-version or importer implementation. | Production diff is limited to Documents/Media remote metadata service/domain/provider plus `media`/`media_links` migrations and tests. | Pass-B reconstruction and Pass-C changed-file/responsibility audit found no downstream lifecycle implementation or parallel `domain/media` architecture. | PASS |
| Traceability / feature boundary | Accept A's responsibility only; keep broader `FTR-024` and downstream acceptance responsibilities incomplete. | WP-2.8A Acceptance record + WP-2.8 coverage addendum; Feature Ledger stays `SPECIFIED`. | Pass-C reread of playbook, Feature Ledger and Lot-2 matrix confirms Work Packet record is the durable responsibility-level acceptance record and whole-feature promotion would be false. | PASS |

Traceability reconciliation:

- `VEN-013`, `MED-007`, `MED-008`, `MED-010` and `MED-013` → **accepted/evidenced for the WP-2.8A remote-reference slice**.
- `FTR-024` → **WP-2.8A foundation responsibility accepted**, but the Feature Ledger remains `SPECIFIED`: private archive/derivative lifecycle (WP-2.8B), rendering/gallery behavior (WP-2.11) and local/offline capture (WP-2.12) remain downstream.
- `ACC-057` / `ACC-058` → **foundation only**. A proves privacy-safe metadata/reference persistence and absence of private Storage claims; full remote DOM no-referrer/fallback behavior and private archive-path acceptance remain assigned to downstream packets.
- `ACC-055` / `ACC-056` → **not claimed**; private binary validation/archive responsibility remains WP-2.8B.
- Remote-reference metadata soft-delete/restore → **not claimed**; remains WP-2.8C.
- Local/offline/import/rendering/proxy/fetch/document-version responsibilities → **not claimed** and remain in their mapped packets/lots.
- Required WP-2.8A responsibilities minus accepted/evidenced WP-2.8A responsibilities: **∅**.
- Open BLOCKING/MAJOR findings: **∅**.

Pass-C decision: **PASS — WP-2.8A ACCEPTED**.

## Execution gates

1. Pre-READY contract/coverage repair `8908eecd3eb25e89cf0b70937722f0ccf9257bb4` / `34390723409`: **5/5 SUCCESS**.
2. READY transition `c49d182c50ee882751bb73b63f3720f40356e5a7` / `34401165950`: **5/5 SUCCESS**.
3. `READY → IN_PROGRESS / A-IMPLEMENT` transition `2462a70cbf20444eed579370f25b58facd7adce9` / `34401969811`: **5/5 SUCCESS**.
4. RED-first Pass-A boundary `56b931e66324cf34d8e898c8e50fed079e4d48ab` / `34402670623`: **EXPECTED FAILURE** before media persistence/RPC existed.
5. Final Pass-A hardening head `3c9d53af80ee11f7c276ed9f0bb14118988a95b3` / `34414303456`: **5/5 SUCCESS**.
6. REVIEW_PENDING / Pass-B entry `ac5e2c6aaf6c98ddaec8a85261d254c6395dcb46` / `34415090306`: **5/5 SUCCESS**.
7. Pass-B finding `WP2.8A-B-001` red-first `fc973ab5538d86573164705164a16ab0bd78db99` / `34415717118`: **EXPECTED FAILURE**.
8. Pass-B remediation `db892fe02a324859f5bf3f3ac79a0687e95f3736` / `34416328055`: **5/5 SUCCESS**.
9. Final fresh Pass-B authorization/review head `556ebab4ca642dd3d86d1d1a5c5761d18446eb7c` / `34416889470`: **5/5 SUCCESS**.
10. ACCEPTANCE_PENDING / Pass-C entry `756143192d38aa042cfee6c99d26734b9b587c82` / `34418038428`: **5/5 SUCCESS**; existing acceptance evidence rerun on exact head.
11. Pass C responsibility gap is **∅**; packet decision is **ACCEPTED**.
12. WP-2.8B remains prohibited until this packet-acceptance commit and final Lot-2 acceptance-governance reconciliation are exact-head green.

## Handoff

- Current state: `ACCEPTED`
- Current/next pass: `COMPLETE`
- Previous packet: WP-2.7 — **ACCEPTED / COMPLETE**, final acceptance-governance closure `db1dae663129c3281618c932fa7f5a8184a5a2ad` / `34377221997` — **5/5 SUCCESS**.
- Final Pass-A implementation/hardening: `3c9d53af80ee11f7c276ed9f0bb14118988a95b3` / `34414303456` — **5/5 SUCCESS**.
- Pass-B entry: `ac5e2c6aaf6c98ddaec8a85261d254c6395dcb46` / `34415090306` — **5/5 SUCCESS**.
- Pass-B finding: `WP2.8A-B-001` on `fc973ab5538d86573164705164a16ab0bd78db99` / `34415717118` — expected FAILURE.
- Pass-B remediation: `db892fe02a324859f5bf3f3ac79a0687e95f3736` / `34416328055` — **5/5 SUCCESS**.
- Final fresh Pass-B reviewed head: `556ebab4ca642dd3d86d1d1a5c5761d18446eb7c` / `34416889470` — **5/5 SUCCESS**.
- Pass-C entry: `756143192d38aa042cfee6c99d26734b9b587c82` / `34418038428` — **5/5 SUCCESS**.
- Open BLOCKING/MAJOR findings after Pass B and Pass C: `∅`.
- Required WP-2.8A responsibilities minus accepted/evidenced responsibilities: `∅`.
- Whole `FTR-024` remains incomplete by design; no downstream private-upload/rendering/delete/offline responsibility is promoted by this packet.
- Next permitted action: verify this packet-acceptance HEAD 5/5; then reconcile the Lot-2 coverage matrix and implementation-status cursor. WP-2.8B remains prohibited until final acceptance-governance closure is green.
