# Mariage OS — Implementation Status Board

Status: **Living repository source of truth for development progress**

This board is intentionally current and context-free. Exhaustive historical packet evidence remains in the packet records and Lot coverage matrices. The exact previous 43,572-byte board snapshot is preserved losslessly at `docs/roadmap/history/IMPLEMENTATION-STATUS-2026-09-09-pre-WP-2.8A.md`.

## Current phase

- V1 documentation/design: **COMPLETE / FROZEN**.
- Guest RSVP + Email/SMS/WhatsApp scope: **MERGED / FROZEN**.
- AI Lot Orchestration governance: **MERGED / FROZEN**.
- Final Design Review: **PASS**.
- Implementation gate: **OPEN**.
- Lot 0: **ACCEPTED** — completed 2026-09-03.
- Lot 1: **ACCEPTED** — completed 2026-09-06.
- Lot 2: **IN_PROGRESS — Venues core**.
- Lots 3–12: **NOT_STARTED**.

`main` integration truth after accepted Lot 0 + Lot 1 promotion is `f6da05626f024431230ae46ca1ec8a4becc72a1f` (PR #7). Promotion CI `34030211097`: **5/5 SUCCESS**, including clean-checkout `npm run verify`.

## Lot 0 / Lot 1 closure

- Lot 0: WP-0.1..0.6 **ACCEPTED**, responsibility gap **∅**, Integration Pass **PASS**, accepted branch head `3dccc801a38929c6dfda7ecb06626d9c5143ec76`.
- Lot 1: WP-1.1..1.9 **ACCEPTED**, responsibility gap **∅**, Integration Pass **PASS**; final pre-promotion head `c27021fe739b52811e5c219439a0c5c7e8db8049`, Integration run `34026968380` **5/5 SUCCESS**.

## Lot 2 — Venues core

Coverage/work-packet truth is `lot-2/LOT-2-COVERAGE-MATRIX.md`. `lot-2/LOT-2-COVERAGE-MATRIX-ADDENDUM.md` remains as the durable historical record explaining the pre-READY WP-2.8C responsibility repair; its A/B/C responsibility map has now been folded back into the main matrix by `432e0cf893e0adc079ba3c25eb325efb9d01e3ec` / `34420275595` — **5/5 SUCCESS**.

Required current-lot responsibilities minus assigned packet responsibilities: **∅**.

| Packet | Responsibility | State |
|---|---|---|
| WP-2.1 | venue identity, authorized persistence, lifecycle history | **ACCEPTED** |
| WP-2.2 | spaces, capacity, member ratings/preferences | **ACCEPTED** |
| WP-2.3 | fact definitions, typed retained facts, value validation | **ACCEPTED** |
| WP-2.4 | observations, sources, evidence/confidence/freshness, conflicts | **ACCEPTED** |
| WP-2.5 | deterministic criteria, blockers, score/readiness, missing information | **ACCEPTED** |
| WP-2.6A | Venue offers and offer components | **ACCEPTED** |
| WP-2.6B | Venue availability observations | **ACCEPTED** |
| WP-2.6C | Venue contacts | **ACCEPTED** |
| WP-2.6D | Venue interaction history | **ACCEPTED** |
| WP-2.7 | contextual venue access-route observations | **ACCEPTED** |
| WP-2.8A | Venue remote-image metadata and Venue links | **ACCEPTED** |
| WP-2.8B | Venue private archived media lifecycle | **PLANNED / NEXT** |
| WP-2.8C | recoverable Venue remote-media metadata lifecycle | PLANNED |
| WP-2.9 | venue document/tag/link basics | PLANNED |
| WP-2.10 | repositories, local cache, pending/offline mutations | PLANNED |
| WP-2.11 | gallery/table/detail/compare/deep-link workspace | PLANNED |
| WP-2.12 | mobile/offline venue-visit workflow and packet E2E completion | PLANNED |

### Accepted packet evidence summary

- WP-2.1 **ACCEPTED**; governance CI `34040803267` **5/5 SUCCESS**.
- WP-2.2 **ACCEPTED**; governance CI `34048565452` **5/5 SUCCESS**; `WP2.2-B-001` resolved.
- WP-2.3 **ACCEPTED**; final reviewed head `2e3194f7109eb30eee4e73ace7ecbdd329fd321c`, CI `34068703691` **5/5 SUCCESS**; `WP2.3-B-001..008` resolved.
- WP-2.4 **ACCEPTED**; final fresh reviewed head `93262f9459e720d97a6dfa3a83f84f02f3a02c7c`, CI `34137822804` **5/5 SUCCESS**; responsibility gap **∅**.
- WP-2.5 **ACCEPTED**; final fresh reviewed head `65410a3dc032208644911f29e79b70bd49e89277` / `34165826166`, Pass-C `931bac6a7145bc31a4bce24d4ea5cff354753ed4` / `34166488903`, acceptance governance `902ac6f56b84fed56da0113efc610617943e9449` / `34167062632`: successful; responsibility gap **∅**.
- WP-2.6A **ACCEPTED**; final acceptance-governance `186933ed0af8c45ddaa1b5c883bfd3f70086c6fe` / `34238484533` **5/5 SUCCESS**; responsibility gap **∅**.
- WP-2.6B **ACCEPTED**; final acceptance-governance `8911f1523d96b95cf1329c4b144bfec2356a4a47` / `34275967235` **5/5 SUCCESS**; responsibility gap **∅**.
- WP-2.6C **ACCEPTED**; final acceptance-governance `f6c93b7991d832363da92a9081540b9bad95441b` / `34287865010` attempt 2 **5/5 SUCCESS**; responsibility gap **∅**.
- WP-2.6D **ACCEPTED**; final acceptance-governance `767017112445a38863abd114e8c62feb27af6421` / `34322712448` **5/5 SUCCESS**; responsibility gap **∅**.
- WP-2.7 **ACCEPTED / COMPLETE**; final status-governance `db1dae663129c3281618c932fa7f5a8184a5a2ad` / `34377221997` **5/5 SUCCESS**; persisted `ACC-030` evidence and route responsibility gap **∅**.
- WP-2.8A **ACCEPTED / COMPLETE**; Pass-B entry `ac5e2c6aaf6c98ddaec8a85261d254c6395dcb46` / `34415090306` **5/5 SUCCESS**; `WP2.8A-B-001` exposed red-first on `fc973ab5538d86573164705164a16ab0bd78db99` / `34415717118` and resolved/verified on `db892fe02a324859f5bf3f3ac79a0687e95f3736` / `34416328055` **5/5 SUCCESS**; final fresh authorization/review `556ebab4ca642dd3d86d1d1a5c5761d18446eb7c` / `34416889470` **5/5 SUCCESS**; Pass-C entry `756143192d38aa042cfee6c99d26734b9b587c82` / `34418038428` **5/5 SUCCESS**; packet acceptance `925cf86f3e38bf08807ed408f6d100fbbbd5c9c2` / `34418721439` **5/5 SUCCESS**; Lot-2 coverage reconciliation `432e0cf893e0adc079ba3c25eb325efb9d01e3ec` / `34420275595` **5/5 SUCCESS**; remote-reference responsibility gap **∅**, open BLOCKING/MAJOR findings **∅**.

Whole cross-lot features remain scoped correctly: `FTR-024` / `FTR-092` remain incomplete because private archive, recoverable metadata deletion, presentation and offline responsibilities remain downstream; `FTR-025` remains **IN_PROGRESS** for later Budget/scenario integration; `FTR-026` remains **IN_PROGRESS** for Venue presentation and Lot-3 follow-up/Task workflow; downstream map/routing-provider capability remains Lot 9.

## WP-2.8 — decomposed media foundation

The original WP-2.8 responsibility is decomposed into three independently reviewable persistence/security slices. Product scope is unchanged and only one packet may be active at a time.

### WP-2.8A — Venue remote-image metadata and links

- State: **ACCEPTED**.
- Current pass: **COMPLETE**.
- Packet record: `lot-2/WP-2.8A.md`.
- Estimated size: **10 points**.
- Owns remote image metadata, same-project Venue gallery links, exact 2048/2048/5000 user-input bounds, HTTPS/privacy-safe remote URL policy, atomic media+link create/replay, `media.read`/`media.write` authorization, UUID replay/conflict/non-disclosure and fail-closed provider boundaries.
- `media_links` source FK is `media_id`; A does not add/accept `source_id`.
- Pass A: complete/verified through canonical-URL hardening `3c9d53af80ee11f7c276ed9f0bb14118988a95b3` / `34414303456` — **5/5 SUCCESS**.
- Pass B: `WP2.8A-B-001` replay-link identity defect resolved/verified; final fresh review `556ebab4ca642dd3d86d1d1a5c5761d18446eb7c` / `34416889470` — **5/5 SUCCESS**; open BLOCKING/MAJOR findings **∅**.
- Pass C: entry `756143192d38aa042cfee6c99d26734b9b587c82` / `34418038428` **5/5 SUCCESS**; mechanical EXPECTED → IMPLEMENTED → VERIFIED reconciliation **PASS**; required-minus-accepted/evidenced **∅**.
- Packet acceptance: `925cf86f3e38bf08807ed408f6d100fbbbd5c9c2` / `34418721439` — **5/5 SUCCESS**, clean-checkout included.
- Coverage reconciliation: `432e0cf893e0adc079ba3c25eb325efb9d01e3ec` / `34420275595` — **5/5 SUCCESS**, clean-checkout included.
- Boundary retained: no private binary upload, derivatives, soft-delete/restore, remote rendering/fetch/proxy, local/offline capture, document versioning or import behavior is claimed by A. Full `ACC-057` waits for WP-2.11 rendering evidence; `ACC-055` / `ACC-056` remain B responsibilities; whole `FTR-024` / `FTR-092` is not accepted by A alone.

### WP-2.8B — Venue private archived media lifecycle

- State: **PLANNED / NEXT**.
- Current pass: **PLAN / ACTIVATION REVALIDATION**.
- Packet record: `lot-2/WP-2.8B.md`.
- Dependency WP-2.8A: **ACCEPTED / COMPLETE**, packet acceptance and coverage reconciliation both exact-head green.
- Provisional size: **8 points**, to be recalculated after the lifecycle freeze; split before product code if concrete scope exceeds 10.
- Owns private archived image bytes, immutable originals, explicit derivatives, project-scoped SHA-256 exact-byte dedup inputs, supported-image validation and interrupted/orphan recovery semantics.
- Reuses the accepted Lot-1 `project-private` bucket, opaque `<project_uuid>/media/<media_uuid>/<variant>` namespace and live `media.read` / `media.write` Storage RLS. It must not create a parallel bucket, permission model or Documents/Media bounded context.
- Current A migration deliberately constrains `media` to remote references (`remote_url` required, `storage_path` null, binary metadata null, `upload_status='ready'`), so B necessarily needs a forward-only schema/command hardening migration after its exact lifecycle is frozen.
- **OPEN stop-condition:** before `READY`, a docs-only exact-head-green freeze must define private `upload_status` values, legal transitions/visibility, upload→verify→metadata/link commit ordering and retry identity, Storage-success/DB-failure recovery, explicit cleanup without assuming a scheduler, immutable-original/derivative rules, project-scoped dedup/non-disclosure, exact supported-image/20 MB/MIME/signature ownership, protected command idempotence/authorization and fail-closed Storage/metadata receipts.
- No B product code may start before that stop-condition closes, its exact-head CI is green, then separate `PLANNED → READY` and `READY → IN_PROGRESS / A-IMPLEMENT` gates are green.

### WP-2.8C — Recoverable Venue remote-media metadata lifecycle

- State: **PLANNED**.
- Current pass: **PLAN**.
- Packet record: `lot-2/WP-2.8C.md`.
- Semantic dependency: WP-2.8A accepted metadata foundation; default execution remains A → B → C for linear media work.
- Provisional size: **8 points**, mandatory activation revalidation before READY.
- Owns `media.deleted_at` soft-delete/restore for A-created remote Venue references, active-read filtering, retained `media_links`, idempotent lifecycle replay, live `media.write` authorization and non-disclosure.
- Does **not** own the global 30-day Empty-trash/physical-purge scheduler or trash UI.

### WP-2.8 execution evidence

- WP-2.7 final status-governance: `db1dae663129c3281618c932fa7f5a8184a5a2ad` / `34377221997` — **5/5 SUCCESS**.
- Storage-RLS documentation repair: `54fb49d11e16f3945eb2cb820e1f832768711e7e` / `34378129764` — **5/5 SUCCESS**.
- Initial A/B split + media lifecycle specification: `cb4c95120c976d2238a57a02aa874867ff9bcca3` / `34379734883` — **5/5 SUCCESS**.
- Initial Lot-2 matrix reconciliation: `7b810bf1a812443184ca772c56f481083e5b2866` / `34381700196` — **5/5 SUCCESS**.
- Pre-READY contract/coverage repair, including C responsibility assignment: `8908eecd3eb25e89cf0b70937722f0ccf9257bb4` / `34390723409` — **5/5 SUCCESS**.
- A `PLANNED → READY`: `c49d182c50ee882751bb73b63f3720f40356e5a7` / `34401165950` — **5/5 SUCCESS**.
- A `READY → IN_PROGRESS / A-IMPLEMENT`: `2462a70cbf20444eed579370f25b58facd7adce9` / `34401969811` — **5/5 SUCCESS**.
- A RED-first missing media/media_links/RPC: `56b931e66324cf34d8e898c8e50fed079e4d48ab` / `34402670623` — **EXPECTED FAILURE**.
- First complete A green: `12490e0e47c8a51d48eb3dac54973c950fa696b3` / `34412950692` — **5/5 SUCCESS**.
- Pre-transition adversarial URL diagnostic: `2dffe30470598e5a788340633fc2bb7ad3e1fb86` / `34413621642` — expected DB failure on direct-RPC URL canonicality only.
- Forward-only URL canonicality hardening: `3c9d53af80ee11f7c276ed9f0bb14118988a95b3` / `34414303456` — **5/5 SUCCESS**.
- A Pass-B entry: `ac5e2c6aaf6c98ddaec8a85261d254c6395dcb46` / `34415090306` — **5/5 SUCCESS**.
- `WP2.8A-B-001` RED-first: `fc973ab5538d86573164705164a16ab0bd78db99` / `34415717118` — **EXPECTED FAILURE**.
- B-001 remediation: `db892fe02a324859f5bf3f3ac79a0687e95f3736` / `34416328055` — **5/5 SUCCESS**.
- Final fresh A Pass-B authorization/review: `556ebab4ca642dd3d86d1d1a5c5761d18446eb7c` / `34416889470` — **5/5 SUCCESS**.
- A Pass-C entry: `756143192d38aa042cfee6c99d26734b9b587c82` / `34418038428` — **5/5 SUCCESS**.
- A packet acceptance: `925cf86f3e38bf08807ed408f6d100fbbbd5c9c2` / `34418721439` — **5/5 SUCCESS**.
- A/B/C coverage reconciliation: `432e0cf893e0adc079ba3c25eb325efb9d01e3ec` / `34420275595` — **5/5 SUCCESS**.
- Historical transparency: transient diagnostic/format commits were corrected forward-only; history was not rewritten.

## Durable cursor

```text
Current Lot: 2 — Venues core
Lot State: IN_PROGRESS
Branch: lot-2/venues-core
Current Packet: WP-2.8B — Venue private archived media lifecycle
Packet State: PLANNED / NEXT
Current Pass: PLAN / ACTIVATION REVALIDATION
Last completed packet: WP-2.8A — ACCEPTED / COMPLETE
Accepted packets: WP-2.1, WP-2.2, WP-2.3, WP-2.4, WP-2.5, WP-2.6A, WP-2.6B, WP-2.6C, WP-2.6D, WP-2.7, WP-2.8A
Planned packet after current: WP-2.8C — PLANNED
WP-2.8A packet acceptance: 925cf86f3e38bf08807ed408f6d100fbbbd5c9c2 / 34418721439 — 5/5 SUCCESS
WP-2.8A coverage reconciliation: 432e0cf893e0adc079ba3c25eb325efb9d01e3ec / 34420275595 — 5/5 SUCCESS
WP-2.8B stop-condition: OPEN — docs-only exact lifecycle freeze required before READY
Current gate: exact-head CI for this IMPLEMENTATION-STATUS acceptance-governance closure.
Next permitted work after this gate is 5/5 SUCCESS: WP-2.8B docs-only lifecycle/state/recovery freeze. No B product code yet.
```

## Next execution sequence

1. Verify this `IMPLEMENTATION-STATUS` acceptance-governance closure on exact HEAD: **5/5 SUCCESS required**.
2. Revalidate WP-2.8B against accepted A schema, WP-1.9 Storage RLS, `STORAGE.md`, `FILE-SECURITY.md`, `ERROR-HANDLING.md`, acceptance scenarios and security IDs; persist a docs-only exact lifecycle/state/recovery freeze.
3. Verify that freeze commit on exact HEAD: **5/5 SUCCESS required**.
4. Recalculate B packet size/cohesion. If >10, split before product code; otherwise transition B `PLANNED → READY` in a separate governance commit.
5. Verify READY transition on exact HEAD: **5/5 SUCCESS required**.
6. Transition B `READY → IN_PROGRESS / A-IMPLEMENT` in a separate governance commit.
7. Verify IN_PROGRESS transition on exact HEAD: **5/5 SUCCESS required**.
8. First B product change is RED-first and must fail only for the intentionally missing private-media lifecycle/storage behavior.
9. Implement Pass A, then fresh Pass B adversarial review, then Pass C mechanical reconciliation under the ordinary three-pass protocol.
10. WP-2.8C remains PLANNED and cannot run concurrently with B.

## WP-2.8B activation constraints already established

- Physical code ownership remains `domain/documents/` and `application/documents/`; binary Storage adapters belong under `infrastructure/supabase/storage/` and metadata adapters under `infrastructure/supabase/`.
- Reuse the accepted private bucket `project-private`; do not add a public bucket or permanent public URL.
- Storage object names use opaque IDs under `<project_uuid>/media/<media_uuid>/<variant>` and must not contain raw filenames or private labels.
- Storage authorization is live `media.read` / `media.write` RLS; object-path knowledge is never authority.
- Supported V1 image intent is JPEG/JPG, PNG and WebP; HEIC/HEIF may only be enabled if safely supported for storage/preview conversion. Active HTML/JS/SVG content is not accepted as application media.
- Initial photo limit is 20 MB/object unless a deliberate ADR/performance change replaces it.
- Extension, declared MIME, magic/signature and size are independent validation inputs; no single client metadata field is trusted.
- `ACC-055`: interrupted upload cannot appear committed/Ready and must have retry/orphan-cleanup behavior without manual raw-Storage reconciliation.
- `ACC-056`: derivative regeneration/change cannot mutate original bytes/hash; original and derivative remain distinct and identifiable.
- `ACC-058`: private object path must not expose original filename; raw filename remains authorized metadata only.
- SHA-256 exact-byte dedup is project-scoped; hash equality never authorizes access or creates a cross-project content-presence oracle.
- Validation/authorization failures are permanent for that attempt; retryable network/backend/recovery failures use explicit operation identity/idempotence. Raw provider errors do not escape the application boundary.
- No background scheduler may be assumed for B recovery. Offline binary queueing remains WP-2.12/Lot 10 rather than being pulled into B.

## Known localized specification repairs / stop-conditions

- WP-2.4 evidence/confidence: **CLOSED / VERIFIED**.
- WP-2.5 evidenceReadiness/manual-assessment/dynamic guest-count semantics: **CLOSED / VERIFIED**.
- WP-2.6 commercial workflow, phone/WhatsApp, availability and interaction-ordering boundaries: **CLOSED / VERIFIED**; A/B/C/D accepted.
- WP-2.7 origin-location snapshots, canonical portability and `ACC-030`: **CLOSED / VERIFIED**; packet accepted.
- `docs/security/STORAGE-RLS.md` missing reference: **CLOSED / VERIFIED** on `54fb49d...` / `34378129764`.
- WP-2.8 media type/category/remote-reference lifecycle ambiguity: **CLOSED / VERIFIED** on `cb4c951...` / `34379734883`.
- WP-2.8A exact text/URL bounds, physical media-link source FK and no-`source_id` contract: **CLOSED / VERIFIED** on `8908eecd...` / `34390723409`.
- WP-2.8 recoverable remote-media metadata responsibility gap: **CLOSED / VERIFIED IN ASSIGNMENT** by WP-2.8C on `8908eecd...` / `34390723409`; folded into the main coverage matrix on `432e0cf...` / `34420275595`.
- WP-2.8A direct-RPC URL canonicality parity: **CLOSED / VERIFIED** by `3c9d53af...` / `34414303456`.
- WP-2.8A replay media/link identity parity: **CLOSED / VERIFIED** by `db892fe...` / `34416328055`, final fresh review `556ebab4...` / `34416889470`.
- WP-2.8B private lifecycle / Storage↔DB atomicity / orphan recovery semantics: **OPEN for WP-2.8B only**; must close before B READY.
- WP-2.8C optimistic revision/receipt activation detail: **OPEN for WP-2.8C only**; revalidate after A/B acceptance before C READY without changing its frozen soft-delete/restore semantics.
- Venue lifecycle documentation conflict from WP-2.1: **CLOSED** by `docs/domain/STATE-MACHINES-VENUE-LIFECYCLE-ADDENDUM.md`.

## Feature lifecycle notes

- V1 Feature inventory: 120 Feature IDs across both ledgers.
- Lot-2 primary IDs: `FTR-013..FTR-028`; partial cross-lot responsibilities also include `FTR-012`, `FTR-089`, `FTR-092`, `FTR-093` and cross-cutting access/offline/security obligations.
- Feature-level whole-capability status is not conflated with packet/current-lot responsibility; `LOT-2-COVERAGE-MATRIX.md` is the current durable responsibility-level reconciliation source and its addendum preserves the WP-2.8C repair history.
- WP-2.8A is accepted only for its remote-reference foundation responsibility. WP-2.8B/C remain unaccepted; whole `FTR-024` / `FTR-092` remains incomplete downstream.

## Forward maintenance

- Dependency audit continues to report two Moderate transitive development-tool advisories; accepted-known Critical/High count remains zero under the normative gate.
- External container registry rate limiting may be retried but cannot skip DB/RLS verification.
- Provider signup-window behavior and invitation abuse/rate-limit evidence remain downstream onboarding/cutover requirements.
- Browser device-identity recovery after selective localStorage/IndexedDB divergence remains later local/session hardening.
- Root `README.md` still contains historical pre-Lot-0 wording; reconcile during deliberate governance cleanup without overriding this board.
- The WP-2.8 coverage addendum has been folded into the main matrix as of `432e0cf...`; keep the addendum as durable repair history rather than treating it as a competing current-state cursor.

## Lot status

| Lot | State |
|---:|---|
| 0 | **ACCEPTED** |
| 1 | **ACCEPTED** |
| 2 | **IN_PROGRESS** |
| 3–12 | NOT_STARTED |

## Handoff

```text
main integration truth: f6da05626f024431230ae46ca1ec8a4becc72a1f
Lot 0: ACCEPTED
Lot 1: ACCEPTED
Lot 2: IN_PROGRESS
Lot 2 branch: lot-2/venues-core
Accepted Lot-2 packets: WP-2.1, WP-2.2, WP-2.3, WP-2.4, WP-2.5, WP-2.6A, WP-2.6B, WP-2.6C, WP-2.6D, WP-2.7, WP-2.8A
Last completed packet: WP-2.8A — ACCEPTED / COMPLETE
Current packet: WP-2.8B — PLANNED / NEXT; PLAN / ACTIVATION REVALIDATION
Next packet: WP-2.8C — PLANNED
WP-2.8A packet acceptance: 925cf86f3e38bf08807ed408f6d100fbbbd5c9c2 / 34418721439 — 5/5 SUCCESS
WP-2.8A coverage reconciliation: 432e0cf893e0adc079ba3c25eb325efb9d01e3ec / 34420275595 — 5/5 SUCCESS
WP-2.8B stop-condition: OPEN — exact private lifecycle/storage-recovery freeze required before READY
Current gate: exact-head CI for this status-board acceptance-governance closure
Next permitted change after that gate: docs-only WP-2.8B lifecycle/state/recovery freeze
No WP-2.8B product code, READY transition or WP-2.8C activation before its governing gates are exact-head green
Lots 3–12: NOT_STARTED
```
