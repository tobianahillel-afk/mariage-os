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

Coverage/work-packet plan: `lot-2/LOT-2-COVERAGE-MATRIX.md`, with `lot-2/LOT-2-COVERAGE-MATRIX-ADDENDUM.md` controlling any WP-2.8 conflict until the matrix is next regenerated.

Required current-lot responsibilities minus assigned packet responsibilities: **∅** after the pre-READY WP-2.8C assignment repair.

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
| WP-2.8A | Venue remote-image metadata and Venue links | **REVIEW_PENDING / CURRENT** |
| WP-2.8B | Venue private archived media lifecycle | PLANNED |
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
- WP-2.5 **ACCEPTED**; final fresh reviewed head `65410a3dc032208644911f29e79b70bd49e89277` / `34165826166`, Pass-C `931bac6a7145bc31a4bce24d4ea5cff354753ed4` / `34166488903`, acceptance governance `902ac6f56b84fed56da0113efc610617943e9449` / `34167062632`: all successful; responsibility gap **∅**.
- WP-2.6A **ACCEPTED**; final acceptance-governance `186933ed0af8c45ddaa1b5c883bfd3f70086c6fe` / `34238484533` **5/5 SUCCESS**; responsibility gap **∅**.
- WP-2.6B **ACCEPTED**; final acceptance-governance `8911f1523d96b95cf1329c4b144bfec2356a4a47` / `34275967235` **5/5 SUCCESS**; responsibility gap **∅**.
- WP-2.6C **ACCEPTED**; final acceptance-governance `f6c93b7991d832363da92a9081540b9bad95441b` / `34287865010` attempt 2 **5/5 SUCCESS**; responsibility gap **∅**.
- WP-2.6D **ACCEPTED**; final acceptance-governance `767017112445a38863abd114e8c62feb27af6421` / `34322712448` **5/5 SUCCESS**; responsibility gap **∅**.
- WP-2.7 **ACCEPTED / COMPLETE**; final status-governance `db1dae663129c3281618c932fa7f5a8184a5a2ad` / `34377221997` **5/5 SUCCESS**; persisted `ACC-030` evidence and route responsibility gap **∅**.

Whole cross-lot features remain scoped correctly: `FTR-025` remains **IN_PROGRESS** for later Budget/scenario integration; `FTR-026` remains **IN_PROGRESS** for Venue presentation and Lot-3 follow-up/Task workflow; downstream map/routing-provider capability remains Lot 9.

## WP-2.8 — pre-implementation split and governance

The original WP-2.8 packet was decomposed **before product code** because remote-reference metadata/link security, private binary Storage lifecycle and recoverable metadata deletion have distinct persistence, authorization and failure boundaries. Product scope is unchanged.

### WP-2.8A — Venue remote-image metadata and links

- State: **REVIEW_PENDING**.
- Current pass: **B-ADVERSARIAL-REVIEW**.
- Packet record: `lot-2/WP-2.8A.md`.
- Estimated size: **10 points**.
- Owns remote image metadata, same-project Venue gallery links, exact 2048/2048/5000 user-input bounds, HTTPS/privacy-safe remote URL policy, atomic media+link create/replay, `media.read`/`media.write` RLS, UUID replay/conflict/non-disclosure and fail-closed provider boundaries.
- `media_links` source FK is frozen as `media_id`; A does not add/accept `source_id`.
- Does **not** own binary upload, thumbnails/derivatives, recoverable deletion/restore, gallery rendering, remote fetching/proxying, local/offline capture or import apply behavior.
- Pass A is **COMPLETE / VERIFIED** on `3c9d53af80ee11f7c276ed9f0bb14118988a95b3` / `34414303456` — **5/5 SUCCESS**, clean-checkout included. Fresh formal Pass B begins only after this governance transition is itself exact-head green.

### WP-2.8B — Venue private archived media lifecycle

- State: **PLANNED**.
- Current pass: **PLAN**.
- Packet record: `lot-2/WP-2.8B.md`.
- Provisional size: **8 points**, mandatory activation revalidation after WP-2.8A acceptance.
- Owns private archived bytes, original/derivative distinction, hash/dedup inputs and interrupted/orphan recovery.
- **OPEN stop-condition for WP-2.8B only:** before `READY`, freeze exact Storage↔DB commit/rollback/orphan-cleanup semantics. This does not block WP-2.8A.

### WP-2.8C — Recoverable Venue remote-media metadata lifecycle

- State: **PLANNED**.
- Current pass: **PLAN**.
- Packet record: `lot-2/WP-2.8C.md`.
- Provisional size: **8 points**, mandatory activation revalidation after A acceptance and before C READY.
- Owns `media.deleted_at` soft-delete/restore for A-created remote Venue references, active-read filtering, retained `media_links`, idempotent lifecycle replay, live `media.write` authorization and non-disclosure.
- Does **not** own the global 30-day Empty-trash/physical-purge scheduler or trash UI.

### WP-2.8 preactivation and Pass-A gates

- WP-2.7 final status-governance: `db1dae663129c3281618c932fa7f5a8184a5a2ad` / `34377221997` — **5/5 SUCCESS**.
- Missing Storage-RLS documentation repair: `54fb49d11e16f3945eb2cb820e1f832768711e7e` / `34378129764` — **5/5 SUCCESS**, clean-checkout included.
- Initial WP-2.8A/B split + media lifecycle specification: `cb4c95120c976d2238a57a02aa874867ff9bcca3` / `34379734883` — **5/5 SUCCESS**, clean-checkout included.
- Lot-2 matrix reconciliation: `7b810bf1a812443184ca772c56f481083e5b2866` / `34381700196` — **5/5 SUCCESS**, clean-checkout included.
- Status-board reconciliation before the present repair: `5d0fa2e57a340450fa9431cc3057709cdc2b655a` / `34383169499` — **5/5 SUCCESS** after an external Google mirror incident and one WebKit page-setup flake; the successful rerun executed 40/40 E2E, mutation and the full clean-checkout verify.
- Pre-READY contract/coverage repair: `8908eecd3eb25e89cf0b70937722f0ccf9257bb4` / `34390723409` — **5/5 SUCCESS**.
- WP-2.8A `PLANNED → READY`: `c49d182c50ee882751bb73b63f3720f40356e5a7` / `34401165950` — **5/5 SUCCESS**.
- WP-2.8A `READY → IN_PROGRESS / A-IMPLEMENT`: `2462a70cbf20444eed579370f25b58facd7adce9` / `34401969811` — **5/5 SUCCESS**.
- RED-first missing media/media_links/RPC proof: `56b931e66324cf34d8e898c8e50fed079e4d48ab` / `34402670623` — **EXPECTED FAILURE** before persistence existed.
- First complete Pass-A green head before adversarial URL hardening: `12490e0e47c8a51d48eb3dac54973c950fa696b3` / `34412950692` — **5/5 SUCCESS**.
- Pre-transition adversarial diagnostic: `2dffe30470598e5a788340633fc2bb7ad3e1fb86` / `34413621642` — DB **EXPECTED FAILURE** only on direct-RPC URL canonicality; cross-project link-ID and semantic duplicate-link assertions passed.
- Forward-only canonical URL hardening: `3c9d53af80ee11f7c276ed9f0bb14118988a95b3` / `34414303456` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.
- Historical transparency: transient accidental commit `f30346a189a5fffc55d22005e6fbf2fb1040e031` and temporary diagnostic-format commits were corrected forward-only; history was not rewritten.
- Product implementation now exists: `media`, `media_links`, protected atomic `create_venue_remote_media`, Documents/Media domain/application boundaries, fail-closed Supabase adapter/parser and direct DB/RLS/adversarial coverage. Private Storage bytes and recoverable deletion remain out of scope.

## Durable cursor

```text
Current Lot: 2 — Venues core
Lot State: IN_PROGRESS
Branch: lot-2/venues-core
Current Packet: WP-2.8A — Venue remote-image metadata and links
Packet State: REVIEW_PENDING
Current Pass: B-ADVERSARIAL-REVIEW
Last completed packet: WP-2.7 — ACCEPTED / COMPLETE
Accepted packets: WP-2.1, WP-2.2, WP-2.3, WP-2.4, WP-2.5, WP-2.6A, WP-2.6B, WP-2.6C, WP-2.6D, WP-2.7
Planned packets after current: WP-2.8B — PLANNED; WP-2.8C — PLANNED
WP-2.8A READY governance: c49d182c50ee882751bb73b63f3720f40356e5a7 / 34401165950 — 5/5 SUCCESS
WP-2.8A A-IMPLEMENT transition: 2462a70cbf20444eed579370f25b58facd7adce9 / 34401969811 — 5/5 SUCCESS
WP-2.8A RED-first: 56b931e66324cf34d8e898c8e50fed079e4d48ab / 34402670623 — EXPECTED FAILURE
WP-2.8A Pass-A final/hardening: 3c9d53af80ee11f7c276ed9f0bb14118988a95b3 / 34414303456 — 5/5 SUCCESS
Current gate: exact-head CI for this REVIEW_PENDING / B-ADVERSARIAL-REVIEW governance transition.
Next permitted product/evidence work after that gate: fresh formal Pass B only; no Pass C or WP-2.8B activation yet.
```

## Next execution sequence

1. Exact-head CI for this `REVIEW_PENDING / B-ADVERSARIAL-REVIEW` governance transition must be **5/5 SUCCESS**.
2. Perform a fresh Pass B reconstruction from packet/addendum/security contracts rather than relying on Pass-A conclusions.
3. Extend/confirm adversarial URL canonicality, live authorization, RLS, cross-project non-disclosure, replay/conflict/atomicity and fail-closed provider evidence; classify every finding.
4. Remediate every BLOCKING/MAJOR finding and rerun invalidated evidence; open BLOCKING/MAJOR must be **∅** before leaving Pass B.
5. Only then transition to `ACCEPTANCE_PENDING / C-ACCEPTANCE`, with its own exact-head 5/5 gate.
6. Pass C mechanically reconciles EXPECTED → IMPLEMENTED → VERIFIED; required-minus-evidenced must be **∅** before packet acceptance.
7. Only after WP-2.8A acceptance may WP-2.8B activation be revalidated. WP-2.8C remains PLANNED until the linear media sequence reaches it.

## WP-2.8A implementation boundaries to preserve

- Domain/application ownership stays under existing `domain/documents/` and `application/documents/`; do not create a parallel top-level media architecture.
- Infrastructure implements typed application/domain ports; provider shapes/errors do not leak outward.
- Remote media in A is metadata-only and never fetched/proxied by this packet.
- A remote row uses the frozen lifecycle semantics in `MEDIA-LIFECYCLE-ADDENDUM.md`: `media_type='image'`, HTTPS `remote_url`, null `storage_path`, null binary-derived metadata, `derivative_of_id=null`, `is_original=true`, `upload_status='ready'`.
- User-controlled A bounds are exact: `remote_url` max 2048 Unicode scalar values, `source_page_url` max 2048, canonical caption max 5000; no silent truncation.
- Venue link uses physical `media_links.media_id`, `target_type='venue'`, `relationship_type='gallery'`, same-project validation.
- A does not add a media `source_id` or accept one through the command.
- RLS is authoritative; owner/editor write according to `media.write`, viewer read according to `media.read`, anon/outsider/project-B/revoked denied.
- Stable caller-generated IDs use idempotent replay for identical semantic payload, typed same-project conflict for changed payload and generic/non-disclosing foreign-project collision handling.
- No binary Storage lifecycle work from WP-2.8B or recoverable deletion/restore work from WP-2.8C may be pulled into A.
- No real wedding/private data in Git, tests, previews or CI artifacts.

## Known localized specification repairs / stop-conditions

- WP-2.4 evidence/confidence: **CLOSED / VERIFIED**.
- WP-2.5 evidenceReadiness/manual-assessment/dynamic guest-count semantics: **CLOSED / VERIFIED**.
- WP-2.6 commercial workflow, phone/WhatsApp, availability and interaction-ordering boundaries: **CLOSED / VERIFIED**; A/B/C/D accepted.
- WP-2.7 origin-location snapshots, canonical portability and `ACC-030`: **CLOSED / VERIFIED**; packet accepted.
- `docs/security/STORAGE-RLS.md` missing reference: **CLOSED / VERIFIED** on `54fb49d...` / `34378129764`.
- WP-2.8 media type/category/initial remote-reference lifecycle ambiguity: **CLOSED / VERIFIED** on `cb4c951...` / `34379734883`.
- WP-2.8A exact text/URL bounds, physical media-link source FK and no-`source_id` contract: **CLOSED / VERIFIED** on `8908eecd...` / `34390723409`.
- WP-2.8 recoverable remote-media metadata responsibility gap: **CLOSED / VERIFIED IN ASSIGNMENT** by planned WP-2.8C on `8908eecd...` / `34390723409`.
- WP-2.8A direct-RPC URL canonicality parity: **CLOSED / VERIFIED** by `3c9d53af...` / `34414303456`; fresh Pass B must retain/extend the regression proof.
- WP-2.8B Storage↔DB atomicity/orphan cleanup semantics: **OPEN for WP-2.8B only**; must close before B can become READY.
- WP-2.8C optimistic revision/receipt activation detail: **OPEN for WP-2.8C only**; revalidate after A/B acceptance before C READY without changing its frozen soft-delete/restore semantics.
- Venue lifecycle documentation conflict from WP-2.1: **CLOSED** by `docs/domain/STATE-MACHINES-VENUE-LIFECYCLE-ADDENDUM.md`.

## Feature lifecycle notes

- V1 Feature inventory: 120 Feature IDs across both ledgers.
- Lot-2 primary IDs: `FTR-013..FTR-028`; partial cross-lot responsibilities also include `FTR-012`, `FTR-089`, `FTR-092`, `FTR-093` and cross-cutting access/offline/security obligations.
- Feature-level whole-capability status is not conflated with packet/current-lot responsibility; `LOT-2-COVERAGE-MATRIX.md` plus its WP-2.8 addendum are the durable responsibility-level reconciliation source.
- WP-2.8A/B/C are implementation decomposition units only; none is accepted yet, and whole `FTR-024` / `FTR-092` is not falsely marked accepted.

## Forward maintenance

- Dependency audit continues to report two Moderate transitive development-tool advisories; accepted-known Critical/High count remains zero under the normative gate.
- External container registry rate limiting may be retried but cannot skip DB/RLS verification.
- Provider signup-window behavior and invitation abuse/rate-limit evidence remain downstream onboarding/cutover requirements.
- Browser device-identity recovery after selective localStorage/IndexedDB divergence remains later local/session hardening.
- Root `README.md` still contains historical pre-Lot-0 wording; reconcile during Lot-2 governance cleanup without overriding this board.
- Fold the WP-2.8 coverage addendum back into `LOT-2-COVERAGE-MATRIX.md` on the next deliberate matrix regeneration; until then the addendum explicitly controls WP-2.8 conflicts.

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
Accepted Lot-2 packets: WP-2.1, WP-2.2, WP-2.3, WP-2.4, WP-2.5, WP-2.6A, WP-2.6B, WP-2.6C, WP-2.6D, WP-2.7
Last completed packet: WP-2.7 — ACCEPTED / COMPLETE
Current packet: WP-2.8A — REVIEW_PENDING / B-ADVERSARIAL-REVIEW
Next packets: WP-2.8B — PLANNED; WP-2.8C — PLANNED
WP-2.8A READY governance: c49d182c... / 34401165950 — 5/5 SUCCESS
WP-2.8A A-IMPLEMENT transition: 2462a70c... / 34401969811 — 5/5 SUCCESS
WP-2.8A RED-first: 56b931e6... / 34402670623 — EXPECTED FAILURE
WP-2.8A Pass-A final/hardening: 3c9d53af... / 34414303456 — 5/5 SUCCESS
Current gate: exact-head CI for REVIEW_PENDING / B-ADVERSARIAL-REVIEW governance
Next permitted change after that gate: fresh formal Pass-B evidence/review only
No Pass-C transition or WP-2.8B activation until Pass B has no unresolved BLOCKING/MAJOR finding
Lots 3–12: NOT_STARTED
```