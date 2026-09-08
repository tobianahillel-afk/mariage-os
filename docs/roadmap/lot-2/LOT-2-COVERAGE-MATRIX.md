# Lot 2 — Coverage Matrix and Work Packet Plan

Status: **IN_PROGRESS — WP-2.1..WP-2.6B ACCEPTED; WP-2.6C ACCEPTANCE_PENDING / C-ACCEPTANCE; WP-2.6D PLANNED**

Purpose: durable responsibility-to-packet map for Lot 2 under `docs/engineering/AI-LOT-ORCHESTRATION.md`.

## Lot 2 goal

Deliver the Venues core as a safe decision-and-action workspace: quick capture, lifecycle/history, spaces/capacity, independent partner ratings, facts/evidence/conflicts, deterministic criteria/blockers/readiness, commercial/access context, photos/documents basics, local/offline integration, gallery/table/detail/compare/deep links and mobile visit workflow.

Lot 2 must reuse the accepted Lot 1 project/auth/RLS/local-data/Storage foundations and must not pre-implement later Tasks, Map, full Sync/PWA hardening, Import, Budget or Vendor lots.

## Integration prerequisite

The previously accepted Lot 0 + Lot 1 implementation was promoted to `main` through PR #7 before Lot 2 started.

- `main` promotion merge: `f6da05626f024431230ae46ca1ec8a4becc72a1f`;
- PR #7 CI run `34030211097`: **5/5 SUCCESS**, including clean-checkout `npm run verify`;
- Lot 2 branch: `lot-2/venues-core`, created from that exact `main` commit.

## Required Feature/current-lot responsibilities

| Required item | Owning Feature/control | Packet(s) | Dependencies | Final evidence |
|---|---|---|---|---|
| stable venue UUID/project identity, human code/name/location core and natural code ordering | FTR-013, VEN-001, VEN-002 | WP-2.1, WP-2.11 | Lot 1 project isolation | WP-2.1 ACCEPTED foundation + later UI/E2E |
| minimal venue quick-add without giant form; duplicate warning inputs retained for later detector/read model | FTR-013, VEN-012, ACC-021 | WP-2.1, WP-2.10, WP-2.11 | venue identity + local store | WP-2.1 create command/repository accepted + later local durability/E2E |
| venue lifecycle, rejection reason/history and reversible restore | FTR-014, VEN-006, PRD-007, ACC-032 | WP-2.1, WP-2.11 | authorized venue persistence | WP-2.1 ACCEPTED state-transition/activity evidence + later UI/E2E |
| multiple physical spaces, dimensions and commercial capacities; sourced wedding-specific suitability remains Facts/Criteria responsibility | FTR-018, VEN-003, VEN-004, physical-input portion of VEN-005 | WP-2.2, WP-2.11 | WP-2.1 | WP-2.2 ACCEPTED same-project/numeric/domain evidence + later detail UI |
| independent member favorites/ratings and Lot-2 personal Venue preference foundations | FTR-023, FTR-012 (Lot 2), VEN-015, VEN-017, PRD-004, ACC-029 | WP-2.2, WP-2.11 | Lot 1 membership/preferences | WP-2.2 ACCEPTED author-only/partner-isolation evidence + later UI |
| typed fact definitions, retained fact state/value and explicit unknown/known/not-applicable/conflict semantics | FTR-019, FAC-001, FAC-003, FAC-011, FAC-012, ACC-024 | WP-2.3 | WP-2.1 | **WP-2.3 ACCEPTED**; runtime/domain validation + DB constraints/RLS + provider parity |
| multi-source append-oriented observations, sources/provenance, conflict retention and stronger-evidence protection inputs | FTR-020, FAC-002, FAC-004..009, ACC-015, ACC-025..027 | WP-2.4 | WP-2.3 | **WP-2.4 ACCEPTED**; append/history/RLS/conflict/freshness/canonicality evidence, B-001..B-008 closed |
| deterministic criterion evaluation, blockers, weighted score explanation and dynamic recomputation | FTR-021, FAC-011, FAC-013, VEN-010, VEN-011, ACC-022, ACC-023, ACC-028 | WP-2.5 | WP-2.3, WP-2.4 | **WP-2.5 ACCEPTED**; deterministic unit/property coverage, explanation reconstruction, provider/DB boundary evidence and final fresh Pass B |
| missing/stale/conflicting information guidance without silently creating tasks | FTR-022 (Lot 2 responsibility), VEN-007, FAC-006, FAC-008, FAC-010 | WP-2.5, WP-2.11 | criteria/facts | **WP-2.5 ACCEPTED read-model/guidance responsibility** + later WP-2.11 presentation/UI |
| venue offer/date-pricing commercial history without full Budget engine | FTR-025 (Lot 2 responsibility), VEN-008 | WP-2.6A | WP-2.1, wedding dates | **WP-2.6A ACCEPTED**; lifecycle/migration/RLS/money/date/source/history/provider evidence; gap ∅ |
| venue availability observation history and latest/relevant read model | FTR-025 (Lot 2 responsibility), VEN-009 | WP-2.6B | WP-2.1, wedding dates, WP-2.6A accepted by default sequence | append/replay, migration/RLS, strict instant/date/source/history/read-model tests |
| venue contacts/interactions/quote-follow-up data basics without Task workflow | FTR-026 (Lot 2 responsibility) | WP-2.6C, WP-2.6D, WP-2.11 | WP-2.1, WP-2.6A/B accepted; C before D | contact revision + interaction append/replay + same-project/parent tests + later detail UI |
| contextual access-route observations by origin/mode; default-origin switch never overwrites route history | Lot-2 acceptance, VEN-016, ACC-030, access responsibility | WP-2.7, WP-2.11 | WP-2.1, Lot-1 reference origins | access.read/write RLS + contextual-history tests |
| remote image references, archived/private venue photo metadata and source privacy | FTR-024, FTR-092 (Lot 2 media responsibility), VEN-013, MED-004..010, MED-013 | WP-2.8, WP-2.11, WP-2.12 | Lot 1 private Storage | metadata/RLS/Storage tests + external-image security tests |
| venue-linked ordinary document basics and generic venue tag/link basics | FTR-089 (Lot 2 responsibility), FTR-093 (Lot 2 responsibility), MED-001..003, MED-010 | WP-2.9, WP-2.11 | Lot 1 Storage/permissions | same-project link tests + safe metadata UI |
| venue repository/read-model ports and Supabase adapters use accepted architecture boundaries | Lot acceptance, AUTHZ-006/020, architecture controls | WP-2.1..WP-2.10 as owning adapters are introduced | Lot 1 ports/composition | static architecture + adapter tests |
| local cache/pending venue edits reuse account+project+device LocalProjectStore; no parallel IndexedDB design | FTR-028 (Lot 2 responsibility), SYN-001..003, SYN-007..011, PWA-003/004/006 | WP-2.10, WP-2.12 | Lot 1 WP-1.7/1.8 | local persistence/reload/isolation/offline tests |
| gallery is default venue browse surface with robust empty/loading/offline states | FTR-015 | WP-2.11 | WP-2.10 read models, WP-2.8 media | browser/accessibility/performance evidence |
| analytical table with controlled columns and personal saved preferences | FTR-016, FTR-012 (Lot 2 responsibility), VEN-015 | WP-2.11 | WP-2.2, WP-2.10 | sort/filter/prefs/browser tests |
| summary-first venue detail with spaces/facts/missing/commercial/access/media/docs/history | FTR-017 | WP-2.11 | WP-2.1..WP-2.10 | detail E2E + visual/accessibility review |
| compare 2–5 venues, blockers before score, differences-only and ratings separate from facts | FTR-027, VEN-010, VEN-011 | WP-2.11 | WP-2.5 + read models | compare E2E + blocked criterion visibility |
| protected venue deep links preserve project authorization and generic outsider denial | FTR-014/FTR-017/FTR-027 routing responsibility, VEN-014 | WP-2.11 | Lot 1 protected shell | route/unit/E2E outsider tests |
| mobile visit mode: cached detail/checklist/notes/measurement/photo/rating/finish summary with queued local edits | FTR-028, PWA-004, venue feature contract | WP-2.12 | WP-2.2, WP-2.5, WP-2.8, WP-2.10 | mobile Playwright/offline reload tests |
| remote-image/file/content validation and no private data in public fixtures/artifacts | MED-002/003/009/010/013, security/quality controls | WP-2.8, WP-2.9, WP-2.12 | Lot 1 security foundation | adversarial tests + secret/privacy scans |
| every new table/resource has explicit permissions, grants, RLS and direct anon/outsider/project-B/revoked allow/deny evidence | AUTHZ-001..008, AUTHZ-009, AUTHZ-012/017/018/020 | WP-2.1..WP-2.9 according to resource | Lot 1 authorization catalog | per-packet pgTAP direct security matrix |
| synthetic complex venue exit fixture: conflicting evidence, multiple spaces, route observations, offers, two partner ratings, reject/restore/compare | Lot 2 acceptance | WP-2.12 + separate Lot Integration Pass | all packets | integrated DB/browser scenario |
| Lot reconciliation + separate Integration Pass | AI-LOT-ORCHESTRATION | after WP-2.1..WP-2.12 | all packets | required - accepted/evidenced = ∅ + full verify + integration PASS |

Required current-lot responsibilities minus assigned packet responsibilities: **∅**.

Accepted/evidenced packet responsibilities so far: **WP-2.1, WP-2.2, WP-2.3, WP-2.4, WP-2.5, WP-2.6A and WP-2.6B**. Required WP-2.6A responsibilities minus accepted/evidenced WP-2.6A responsibilities: **∅**. Required WP-2.6B responsibilities minus accepted/evidenced WP-2.6B responsibilities: **∅**. The original WP-2.6 responsibility remains fully assigned after orchestration decomposition: offers/components → WP-2.6A, availability → WP-2.6B, contacts → WP-2.6C, interactions → WP-2.6D; A+B are accepted, C has completed Pass A and fresh Pass B and is ACCEPTANCE_PENDING / C-ACCEPTANCE, and D remains planned. The FTR-022 presentation/UI responsibility remains explicitly assigned to WP-2.11 and is not claimed by WP-2.5. Lot-level accepted/evidenced reconciliation remains intentionally incomplete until all packets and the separate Integration Pass finish.

## Work Packet plan

### WP-2.1 — Venue identity, authorized persistence and lifecycle-history foundation

State: **ACCEPTED**  
Current pass: **COMPLETE**

Primary Features: FTR-013, FTR-014 responsibilities for canonical venue identity/persistence/lifecycle.  
Acceptance record: `WP-2.1.md`.  
Reviewed implementation head: `3418659d94d35f61183f0a20c367c74e38e86802`.  
Exact implementation CI run `34039296392`: **5/5 SUCCESS**; 350 unit tests, 17 DB files / 359 pgTAP tests, 40/40 E2E, clean-checkout `npm run verify` PASS.  
Governance exact-head CI run `34040803267` on `3304840ac94dbae2e0ebb79bdc0b57cdedb4943c`: **5/5 SUCCESS**.  
Required WP-2.1 responsibilities minus accepted/evidenced WP-2.1 responsibilities: **∅**.

### WP-2.2 — Spaces, capacity and member ratings/preferences

State: **ACCEPTED**  
Current pass: **COMPLETE**

Primary Features: FTR-018, FTR-023, Lot-2 continuation of FTR-012.  
Dependencies: WP-2.1 **ACCEPTED**.  
Acceptance record: `WP-2.2.md`.  
Reviewed implementation head: `241daa01e069a6cbaec4d0ebc09ddf5ca982a385`.  
Exact implementation CI run `34046985956`: **5/5 SUCCESS**; 473 unit tests / 47 files with 100% statements/branches/functions/lines, 20 DB files / 442 pgTAP tests, 40/40 E2E, clean-checkout `npm run verify` PASS.  
Governance exact-head CI run `34048565452` on `480b0bcc168d7789bf2bee07a75c8f04200f5cb7`: **5/5 SUCCESS**.  
Fresh Pass B: **PASS** after MAJOR `WP2.2-B-001` was resolved across domain/provider/RPC/PostgreSQL numeric boundaries.  
Required WP-2.2 responsibilities minus accepted/evidenced WP-2.2 responsibilities: **∅**.  
Boundary retained: sourced wedding-specific fit remains WP-2.3..2.5; table/gallery UI preferences remain WP-2.11 and reuse `user_project_preferences`.

### WP-2.3 — Fact definitions, typed retained facts and value validation

State: **ACCEPTED**  
Current pass: **COMPLETE**

Primary Feature: FTR-019.  
Dependencies: WP-2.1 and WP-2.2 **ACCEPTED**.  
Acceptance record: `WP-2.3.md`.  
Final reviewed implementation head: `2e3194f7109eb30eee4e73ace7ecbdd329fd321c`.  
Exact implementation CI run `34068703691`: **5/5 SUCCESS**; 62 unit-test files / 707 tests with 100% statements/branches/functions/lines, 26 DB files / 575 pgTAP tests, 40/40 E2E, mutation PASS, clean-checkout `npm run verify` PASS.  
Fresh Pass B: **PASS** after all `WP2.3-B-001..B-008` findings were resolved.  
Pass C reconciliation: **PASS**.  
Required WP-2.3 responsibilities minus accepted/evidenced WP-2.3 responsibilities: **∅**.  
Boundary retained: observations/sources/conflict-resolution provenance remain WP-2.4; compatibility execution/readiness remains WP-2.5; no full default-criteria seeding is activated here.

### WP-2.4 — Observations, sources, evidence/confidence/freshness and conflicts

State: **ACCEPTED**  
Current pass: **COMPLETE**

Primary Feature: FTR-020.  
Dependencies: WP-2.3 **ACCEPTED**.  
Acceptance record: `WP-2.4.md`.  
Pre-implementation stop-condition: **CLOSED** by `c414549d20338bf5180d5afc3681beda56fb11de`; `evidence_level`, independent `confidence`, freshness and fact state are distinct normative axes.  
Specification-gate CI run `34069692843`: **5/5 SUCCESS**.  
Historical Pass-A head/run: `9f3ca2fb57adf124e50bf8c4888280854c5d846f` / `34106264873` — **5/5 SUCCESS**.  
Resolved/verified findings: `WP2.4-B-001..B-008`.  
Latest remediation head/run: `4b161f4120cf554395badcc5b05cac79eb018e70` / `34137075923` — **5/5 SUCCESS**.  
Final fresh Pass-B reviewed head/run: `93262f9459e720d97a6dfa3a83f84f02f3a02c7c` / `34137822804` — **5/5 SUCCESS**. Core: 80 test files / 814 tests, 100% statements/branches/functions/lines for measured files; DB/RLS: 35 files / 778 pgTAP tests PASS; Browser: 40/40 Playwright tests PASS across Chromium/Firefox/WebKit/mobile Chromium; mutation harness: 82.50%; privacy-safe preview and clean-checkout `npm run verify` PASS.  
Fresh Pass B: **PASS**, no unresolved BLOCKING/MAJOR finding.  
Pass C reconciliation: **PASS**.  
Required WP-2.4 responsibilities minus accepted/evidenced WP-2.4 responsibilities: **∅**.  
Boundary retained: deterministic compatibility/blockers/score/readiness and missing-information guidance remain WP-2.5; no UI/offline/import/Vendor/real-data completion is claimed.

### WP-2.5 — Deterministic criteria, blockers, score/readiness and missing information

State: **ACCEPTED**  
Current pass: **COMPLETE**

Primary Features: FTR-021, FTR-022 Lot-2 read-model/guidance responsibility.  
Dependencies: WP-2.3, WP-2.4 **ACCEPTED**.  
Acceptance record: `WP-2.5.md`.  
Specification gates: deterministic `evidenceReadiness` and exact `custom_manual_assessment.accepted` closed by `5fd9be01f4da192d9d47b2d48944134fd15e471a` / CI `34143567491`; dynamic guest-count blocker `WP2.5-S-001` closed by `01136a7694141fd21c6067dcc4a1eb876e89080a` / CI `34146113235`; all gate runs **5/5 SUCCESS**.  
Verified Pass-A implementation head/run: `aef7bea53e9db32790ab19c3fffdd0a8f63dc89d` / `34158303997` — **5/5 SUCCESS**.  
Resolved/verified fresh-review findings: `WP2.5-B-001..B-004`; red-first proofs and exact remediation runs are retained in `WP-2.5.md`.  
Final fresh Pass-B reviewed head/run: `65410a3dc032208644911f29e79b70bd49e89277` / `34165826166` — **5/5 SUCCESS**, review **PASS**, no unresolved BLOCKING/MAJOR finding.  
Pass-C entry head/run: `931bac6a7145bc31a4bce24d4ea5cff354753ed4` / `34166488903` — **5/5 SUCCESS**, including Core, DB/RLS, Browser/mutation, privacy-safe preview and clean-checkout `npm run verify`.  
Pass C reconciliation: **PASS**.  
Required WP-2.5 responsibilities minus accepted/evidenced WP-2.5 responsibilities: **∅**.  
Boundary retained: FTR-022 rendering/presentation remains WP-2.11; automatic Task creation remains Lot 3; local/offline Venue integration remains WP-2.10/2.12; real default criteria/research data remain Lot 12.

### WP-2.6A — Venue offers and offer components

State: **ACCEPTED**  
Current pass: **COMPLETE**

Primary Feature: FTR-025 Venue offer/date-pricing responsibility.  
Dependencies: WP-2.1 and WP-2.5 **ACCEPTED**, Lot-1 wedding dates.  
Acceptance record: `WP-2.6A.md`.  
Specification gates: commercial workflow freeze through `cf46c731bd45b77feaa514b22036096301280755` / CI `34170253114`; boundary addendum `6dce81a49ccdbb7bc9da54b2491a0c8746e12e50` / CI `34171320200`; both **5/5 SUCCESS**.  
Verified Pass-A implementation head/run: `e027bbbba93d73546ed19fffac7c26471f45ecb5` / `34223226316` — **5/5 SUCCESS**.  
Resolved/verified fresh-review findings: `WP2.6A-B-001..B-006`; final fresh Pass-B reviewed head/run `c7339227126e0df6969809644b5d0eb2512d350c` / `34233201350` — **5/5 SUCCESS**, review **PASS**.  
Pass-C entry head/run: `d348abdb42a2ca8319fb6711c08551cfb3bcfbae` / `34235598936` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.  
Final acceptance-governance head/run: `186933ed0af8c45ddaa1b5c883bfd3f70086c6fe` / `34238484533` — **5/5 SUCCESS**.  
Pass C reconciliation: **PASS**.  
Required WP-2.6A responsibilities minus accepted/evidenced WP-2.6A responsibilities: **∅**.  
Boundary retained: availability → WP-2.6B; contacts → WP-2.6C; interactions → WP-2.6D; Budget/Vendor/Documents/offline/UI remain downstream/out of scope.

### WP-2.6B — Venue availability observations

State: **ACCEPTED**
Current pass: **COMPLETE**

Primary Feature: FTR-025 Venue availability responsibility.
Dependency: WP-2.6A **ACCEPTED**, final acceptance governance `186933ed0af8c45ddaa1b5c883bfd3f70086c6fe` / `34238484533` — **5/5 SUCCESS**.
Packet record: `WP-2.6B.md`.
Specification gates: commercial workflow `cf46c731...` / `34170253114`, append replay `6dce81a4...` / `34171320200`, deterministic latest/effective availability `9f5c8af30c58c146d89b1464cad96cb8e43dbc7b` / `34239745903`; all **5/5 SUCCESS**.
Verified Pass-A implementation head/run: `1c1dd4db875e5253fc9affdcf498991c4c6a5f64` / `34253821826` — **5/5 SUCCESS**.
Resolved/verified fresh-review findings: `WP2.6B-B-001..B-005`; final fresh Pass-B reviewed head/run `e92af194f774895b3b397d3be60350d09d42d8ff` / `34263468532` — **5/5 SUCCESS**, review **PASS**.
Corrected Pass-C entry head/run: `6e091cc5088fece027f13c6764092453da18f418` / `34274455248` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.
Pass C reconciliation: **PASS**.
Required WP-2.6B responsibilities minus accepted/evidenced WP-2.6B responsibilities: **∅**.
Boundary retained: contacts → WP-2.6C; interactions → WP-2.6D; Budget/scenario integration → Lot 5; Documents/offline/UI remain downstream/out of scope; whole `FTR-025` stays **IN_PROGRESS**.
Boundary retained: contacts proceed through WP-2.6C Pass C; interactions remain WP-2.6D. WP-2.6D and WP-2.7 remain blocked concurrently.

### WP-2.6C — Venue contacts

State: **ACCEPTANCE_PENDING**
Current pass: **C-ACCEPTANCE**

Primary Feature: FTR-026 Lot-2 contact responsibility.
Dependencies: WP-2.1, WP-2.6A and WP-2.6B **ACCEPTED**.
Acceptance record: `WP-2.6C.md`.
Estimated size after activation revalidation: **9 points** — one contact table, one migration family, one atomic save command family and one RLS/authorization boundary.
Split rationale: the former combined 10-point packet assumed direct ordinary RLS contact mutation; accepted revisioned mutation precedent requires a real command boundary, which would push contacts + interaction append/replay above 10. The hard split occurred before production code.
Scope: caller-owned Venue contact identity, canonical phone/text validation, create/update with expected revision, immutable parent identity, RLS and fail-closed provider parsing. Interaction history is now WP-2.6D.
Verified Pass-A implementation head/run: `aee0572cebddc0eae26e898fe68a008009263d11` / `34282995400` — **5/5 SUCCESS**; 111 unit files / 1037 tests at 100% measured statements/branches/functions/lines; DB/RLS, Browser+mutation, preview and clean-checkout verify PASS. Cross-project UUID non-disclosure red-first `56c79ee3064384b5425699742a3b8c2a21fd4aa7` / `34282681713` failed exactly `23505` vs required `42501` and is resolved on the final Pass-A head.
Final fresh Pass-B reviewed head/run: `4f43d59f113f2aa0a857ed147965fd65a8b02413` / `34285562087` — **5/5 SUCCESS**; direct grants/RLS, shared authorization locks, same-session downgrade/revocation, revision/parent immutability, UUID non-disclosure, full PostgreSQL phone parity and fail-closed provider boundaries reviewed; dedicated adversarial pgTAP passed without product-semantic remediation; open BLOCKING/MAJOR findings **∅**; review **PASS**.
Next permitted action: verify this Pass-C transition governance head, then perform mechanical WP-2.6C Pass C reconciliation; WP-2.6D remains blocked.

### WP-2.6D — Venue interaction history

State: **PLANNED**
Current pass: **PLAN**

Primary Feature: FTR-026 Lot-2 interaction responsibility.
Dependencies: WP-2.6C **ACCEPTED** plus prior WP-2.6A/B acceptance.
Acceptance record: `WP-2.6D.md`.
Estimated size: **9 points** — one append-only interaction table, one migration family, one atomic append/replay command and one RLS/authorization boundary.
Scope: immutable interaction history, strict occurred/follow-up instants, same-Venue optional contact, same-project source, stable UUID replay, project isolation and fail-closed provider parsing. Automatic Task/reminder workflow remains Lot 3.
Activation review retained: revalidate deterministic history ordering/provider timestamp precision and the accepted contact interface before READY.

#### Fragmentation review — PASS

The Lot now contains one additional execution unit because the normative `>10` hard split rule was triggered by real command-boundary revalidation. This is not file-level fragmentation: WP-2.6C is the mutable contact/revision slice and WP-2.6D is the immutable interaction/replay slice, each independently reviewable at 9 points with distinct persistence and failure modes. Product Feature scope is unchanged, `FTR-026` remains cross-lot/unfinished, and required Lot-2 responsibilities minus assigned packet responsibilities remains **∅**.

### WP-2.7 — Contextual venue access-route observations

State: **PLANNED**

Primary control: Lot-2 acceptance + VEN-016 access-route basics.  
Dependencies: WP-2.1, Lot-1 reference origins, and completion of the decomposed WP-2.6 sequence under current orchestration.

### WP-2.8 — Venue media/photo foundation and private/remote media safety

State: **PLANNED**

Primary Features: FTR-024, Lot-2 portion of FTR-092.  
Dependencies: WP-2.1, Lot-1 Storage.  
Pre-implementation governance repair: restore the missing `docs/security/STORAGE-RLS.md` contract from already frozen/tested Storage authorization semantics.

### WP-2.9 — Venue document and tag/link basics

State: **PLANNED**

Primary Features: Lot-2 portions of FTR-089 and FTR-093.  
Dependencies: WP-2.1, WP-2.8 where shared file/link primitives are reused.

### WP-2.10 — Venue repositories, local cache and pending/offline mutation integration

State: **PLANNED**

Primary Feature: FTR-028 local/offline foundation responsibility.  
Dependencies: WP-2.1 through WP-2.9 persistence contracts as needed.  
Must extend `LocalProjectStore`; a parallel IndexedDB architecture is forbidden.

### WP-2.11 — Gallery/table/detail/compare/deep-link workspace

State: **PLANNED**

Primary Features: FTR-015, FTR-016, FTR-017, FTR-027 plus Lot-2 UI portions of FTR-012 and FTR-022.  
Dependencies: WP-2.1..WP-2.10.  
Packet review must ensure one coherent Venues workspace rather than four disconnected CRUD pages.

### WP-2.12 — Mobile/offline venue-visit workflow and packet-level end-to-end completion

State: **PLANNED**

Primary Feature: FTR-028 visit workflow.  
Dependencies: WP-2.2, WP-2.5, WP-2.8, WP-2.10, WP-2.11.  
Provides the complete visit workflow and the final packet-owned synthetic venue journey; it does **not** replace the separate Lot Integration Pass.

## Sequencing

```text
WP-2.1 [ACCEPTED]
  ├─→ WP-2.2 [ACCEPTED]
  ├─→ WP-2.3 [ACCEPTED] → WP-2.4 [ACCEPTED] → WP-2.5 [ACCEPTED]
  │                                           ↓
  │                               WP-2.6A [ACCEPTED]
  │                                           ↓
  │                               WP-2.6B [ACCEPTED]
  │                                           ↓
  │                               WP-2.6C [ACCEPTANCE_PENDING]
  │                                           ↓
  ├────────────────────────────────────────→ WP-2.7 [PLANNED]
  └─→ WP-2.8 → WP-2.9

WP-2.1..2.9
  ↓
WP-2.10
  ↓
WP-2.11
  ↓
WP-2.12
  ↓
mechanical Lot reconciliation
  ↓
separate Lot 2 Integration Pass
  ↓
Lot 2 acceptance
```

Default execution remains one packet in active work/review at a time. The original WP-2.6 responsibility was decomposed before implementation because its five-table/multi-command/RLS scope exceeded the orchestration `>10` split threshold and no atomicity/safety reason justified a mega-packet. This decomposition changes implementation granularity only; product/Feature scope is unchanged and required current-lot responsibilities minus assigned packet responsibilities remains **∅**. WP-2.6A and WP-2.6B are ACCEPTED; WP-2.6C has completed verified Pass A and fresh Pass B and is ACCEPTANCE_PENDING / C-ACCEPTANCE. WP-2.6D and WP-2.7 must not start concurrently.

## Explicitly out of Lot 2

- automatic task creation/workflow from missing information (Lot 3 owns Tasks; Lot 2 only produces deterministic suggestions/read models);
- generic Inbox or Decisions;
- canonical import engine and external-ID application semantics beyond duplicate-warning inputs (Lot 4);
- full budget/scenario/payment calculation (Lot 5);
- guest/invitation/communications/seating domains (Lot 6);
- generic vendor domain and full contract-readiness workflow (Lot 7);
- Dashboard/global Search implementation (Lot 8);
- rendered map/pins/provider routing integration (Lot 9); Lot 2 stores textual/contextual access observations only;
- full conflict-resolution/retry engine, PWA update hardening and offline pinning engine (Lot 10); Lot 2 only integrates venue work with already established local queue/cache primitives;
- production backup/recovery/provider cutover (Lot 11);
- real venue data migration from the couple's research (Lot 12);
- real wedding/private data in public Git, tests, screenshots or CI artifacts.

## Lot closure gate

Lot 2 cannot be accepted until:

```text
required current-lot responsibilities - accepted/evidenced responsibilities = ∅
```

and a fresh separate Integration Pass proves the synthetic complex-venue exit scenario, cross-project isolation, offline/visit behavior, UI coherence and full `npm run verify` on the exact reviewed head.