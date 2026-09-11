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

Coverage/work-packet truth is `lot-2/LOT-2-COVERAGE-MATRIX.md`. `lot-2/LOT-2-COVERAGE-MATRIX-ADDENDUM.md` remains the durable historical record for the pre-READY WP-2.8C responsibility repair; its A/B/C responsibility map was folded into the main matrix by `432e0cf893e0adc079ba3c25eb325efb9d01e3ec` / `34420275595` — **5/5 SUCCESS**.

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
| WP-2.8B | Venue private archived media lifecycle | **ACCEPTANCE_PENDING / CURRENT** |
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
- WP-2.8A **ACCEPTED / COMPLETE**; final fresh authorization/review `556ebab4ca642dd3d86d1d1a5c5761d18446eb7c` / `34416889470` **5/5 SUCCESS**; Pass-C entry `756143192d38aa042cfee6c99d26734b9b587c82` / `34418038428` **5/5 SUCCESS**; packet acceptance `925cf86f3e38bf08807ed408f6d100fbbbd5c9c2` / `34418721439` **5/5 SUCCESS**; Lot-2 coverage reconciliation `432e0cf893e0adc079ba3c25eb325efb9d01e3ec` / `34420275595` **5/5 SUCCESS**; remote-reference responsibility gap **∅**, open BLOCKING/MAJOR findings **∅**.

Whole cross-lot features remain scoped correctly: `FTR-024` / `FTR-092` remain incomplete because recoverable metadata deletion, presentation, offline and later lifecycle responsibilities remain downstream; `FTR-025` remains **IN_PROGRESS** for later Budget/scenario integration; `FTR-026` remains **IN_PROGRESS** for Venue presentation and Lot-3 follow-up/Task workflow; downstream map/routing-provider capability remains Lot 9.

## WP-2.8 — decomposed media foundation

The original WP-2.8 responsibility is decomposed into three independently reviewable persistence/security slices. Product scope is unchanged and only one packet may be active at a time.

### WP-2.8A — Venue remote-image metadata and links

- State: **ACCEPTED**.
- Current pass: **COMPLETE**.
- Packet record: `lot-2/WP-2.8A.md`.
- Packet acceptance: `925cf86f3e38bf08807ed408f6d100fbbbd5c9c2` / `34418721439` — **5/5 SUCCESS**, clean-checkout included.
- Coverage reconciliation: `432e0cf893e0adc079ba3c25eb325efb9d01e3ec` / `34420275595` — **5/5 SUCCESS**, clean-checkout included.
- Boundary retained: no private binary upload, derivatives, soft-delete/restore, remote rendering/fetch/proxy, local/offline capture, document versioning or import behavior is claimed by A. Full `ACC-057` waits for WP-2.11 rendering evidence; whole `FTR-024` / `FTR-092` is not accepted by A alone.

### WP-2.8B — Venue private archived media lifecycle

- State: **ACCEPTANCE_PENDING**.
- Current pass: **C-ACCEPTANCE**.
- Packet record: `lot-2/WP-2.8B.md`.
- Dependency WP-2.8A: **ACCEPTED / COMPLETE**.
- Activation freeze: `dd2b03c736210f5145ece58ef8b4f55918c43b00` / `34421686462` — **CLOSED / VERIFIED, 5/5 SUCCESS**, clean-checkout included.
- READY governance: `3e6fe6683cccb21ffa0ef96b87911280ab07737f` / `34423597208` — **CLOSED / VERIFIED, 5/5 SUCCESS**, clean-checkout included.
- Pass-A checkpoint: `150c10c07452748e3092e316a3cb9a26f272ff3e` / `34555183344` — **5/5 SUCCESS**, clean-checkout included.
- First fresh Pass-B review: `a23e6925f4d95e5d49cdea5b4e62b899cdd7a605` / `34555832894` — **5/5 SUCCESS**.
- Pass-C diagnostic exposed MED-006 receipt incompleteness on `4eddca8aa94a2ed95d37bac47b8f3efeb3b4faf4` / `34556856411` — **EXPECTED RED** for the missing duplicate-original receipt contract.
- MED-006 remediation exact head `f815844d9f4a2c62575ee91530af94febf78dab0` / `34605466532` — **5/5 SUCCESS**, including DB/RLS, browser+mutation, core quality/security, privacy-safe preview and clean-checkout `npm run verify`.
- Fresh affected Pass-B reconstruction after remediation: **PASS**; open BLOCKING/MAJOR findings **∅**; no MINOR finding carried into acceptance.
- Review confirmed project-scoped detect-only duplicate reporting, no auto-merge, durable replay snapshot, project-row serialization before live `media.write`, fixed `search_path`, internal-core non-exposure, fail-closed TypeScript parsing and accepted-A compatibility.
- Current gate: exact-head CI for this `ACCEPTANCE_PENDING / C-ACCEPTANCE` governance transition. Pass C may start only after that HEAD is **5/5 SUCCESS**.

### WP-2.8C — Recoverable Venue remote-media metadata lifecycle

- State: **PLANNED**.
- Current pass: **PLAN**.
- Packet record: `lot-2/WP-2.8C.md`.
- Semantic dependency: WP-2.8B must be **ACCEPTED** before C activation is revalidated.
- Provisional size: **8 points**, mandatory activation revalidation before READY.
- Owns `media.deleted_at` soft-delete/restore for A-created remote Venue references, active-read filtering, retained `media_links`, idempotent lifecycle replay, live `media.write` authorization and non-disclosure.
- Does **not** own the global 30-day Empty-trash/physical-purge scheduler or trash UI.

## WP-2.8B activation constraints already established

- Physical code ownership remains `domain/documents/` and `application/documents/`; binary Storage adapters belong under `infrastructure/supabase/storage/` and metadata adapters under `infrastructure/supabase/`.
- Reuse the accepted private bucket `project-private`; do not add a public bucket or permanent public URL.
- Storage object names use opaque IDs under `<project_uuid>/media/<media_uuid>/<variant>` and must not contain raw filenames or private labels.
- Storage authorization is live `media.read` / `media.write` RLS; object-path knowledge is never authority.
- Supported B image intent is JPEG/JPG, PNG and WebP; HEIC/HEIF remains disabled in this packet. Active HTML/JS/SVG content is not accepted as application media.
- Exact B photo limit is **20,000,000 bytes/object**. Width/height are bounded to 16,384 pixels each and total decoded pixels to 50,000,000.
- Extension, declared MIME, magic/signature and size are independent validation inputs; no single client metadata field is trusted.
- `ACC-055`: interrupted upload cannot appear committed/Ready and must have retry/orphan-cleanup behavior without manual raw-Storage reconciliation.
- `ACC-056`: derivative regeneration/change cannot mutate original bytes/hash; original and derivative remain distinct and identifiable.
- `ACC-058`: private object path must not expose original filename; raw filename remains authorized metadata only.
- `MED-006`: SHA-256 exact-byte dedup is project-scoped and detect-only; finalization receipt reports deterministic same-project ready-original matches, hash equality never authorizes access, replay preserves the stored snapshot, auto-merge is forbidden, and foreign-project equality is non-disclosing.
- Validation/authorization failures are permanent for that attempt; retryable network/backend/recovery failures use explicit operation identity/idempotence. Raw provider errors do not escape the application boundary.
- No background scheduler may be assumed for B recovery. Offline binary queueing remains WP-2.12/Lot 10 rather than being pulled into B.
- A compatibility is mandatory: mixed remote + private Venue media must leave A's remote create/list semantics intact.

## Current Pass-C entry conditions

All entry conditions except the governance-head CI are already evidenced:

- Pass A implementation evidence green;
- remediation exact-head `f815844...` CI `34605466532` **5/5 SUCCESS**;
- fresh affected Pass-B review **PASS**;
- open BLOCKING/MAJOR findings **∅**;
- architecture/size/security/clean-checkout gates green on the remediation head;
- FIR #15 and FIR #16 aligned to the current packet/pass.

The next permitted action is therefore:

1. require exact-head CI **5/5 SUCCESS** for this `ACCEPTANCE_PENDING / C-ACCEPTANCE` governance transition;
2. mechanically reconcile WP-2.8B `EXPECTED ↔ IMPLEMENTED ↔ VERIFIED` for `FTR-024` current-lot private-archive slice, `FTR-092` Lot-2 slice, `VEN-013`, `MED-004`, `MED-005`, `MED-006`, `MED-009`, `MED-010`, `ACC-055`, `ACC-056`, `ACC-058` and applicable AUTHZ/SEC controls;
3. prove required-minus-evidenced **∅** and no unresolved BLOCKING/MAJOR finding;
4. reconcile packet/status/coverage records;
5. require final acceptance HEAD exact-head **5/5 SUCCESS** before marking WP-2.8B **ACCEPTED**;
6. keep WP-2.8C **PLANNED** until B acceptance is complete.

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
- WP-2.8B private lifecycle / Storage↔DB atomicity / orphan recovery semantics: **CLOSED / VERIFIED** on `dd2b03c...` / `34421686462`.
- WP-2.8B MED-006 finalization-receipt gap: **CLOSED / VERIFIED** by remediation `f815844...` / `34605466532`; fresh affected review **PASS**.
- WP-2.8C optimistic revision/receipt activation detail: **OPEN for WP-2.8C only**; revalidate after B acceptance before C READY without changing its frozen soft-delete/restore semantics.
- Venue lifecycle documentation conflict from WP-2.1: **CLOSED** by `docs/domain/STATE-MACHINES-VENUE-LIFECYCLE-ADDENDUM.md`.

## Feature lifecycle notes

- V1 Feature inventory: 120 Feature IDs across both ledgers.
- Lot-2 primary IDs: `FTR-013..FTR-028`; partial cross-lot responsibilities also include `FTR-012`, `FTR-089`, `FTR-092`, `FTR-093` and cross-cutting access/offline/security obligations.
- Feature-level whole-capability status is not conflated with packet/current-lot responsibility; `LOT-2-COVERAGE-MATRIX.md` is the current durable responsibility-level reconciliation source and its addendum preserves the WP-2.8C repair history.
- WP-2.8A is accepted for its remote-reference foundation responsibility. WP-2.8B is `ACCEPTANCE_PENDING` for its private archive responsibility after green MED-006 remediation and a fresh affected Pass-B PASS. WP-2.8C remains unaccepted; whole `FTR-024` / `FTR-092` remains incomplete downstream.

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
Current packet: WP-2.8B — ACCEPTANCE_PENDING / C-ACCEPTANCE
Next packet: WP-2.8C — PLANNED
WP-2.8B Pass-A checkpoint: 150c10c07452748e3092e316a3cb9a26f272ff3e / 34555183344 — 5/5 SUCCESS
WP-2.8B first Pass-B review: a23e6925f4d95e5d49cdea5b4e62b899cdd7a605 / 34555832894 — 5/5 SUCCESS
WP-2.8B Pass-C MED-006 diagnostic: 4eddca8aa94a2ed95d37bac47b8f3efeb3b4faf4 / 34556856411 — EXPECTED RED
WP-2.8B MED-006 remediation: f815844d9f4a2c62575ee91530af94febf78dab0 / 34605466532 — 5/5 SUCCESS
WP-2.8B fresh affected Pass-B review after remediation: PASS; open BLOCKING/MAJOR = ∅
Current gate: exact-head CI for ACCEPTANCE_PENDING / C-ACCEPTANCE governance transition
Next permitted action after that gate is 5/5 SUCCESS: mechanical Pass C only; WP-2.8C remains PLANNED
Lots 3–12: NOT_STARTED
```
