# WP-2.2 — Spaces, capacity and member ratings/preferences

## Identity

- Work Packet ID: `WP-2.2`
- Lot: `2`
- Name: Spaces, capacity and member ratings/preferences
- State: `ACCEPTED`
- Current pass: `COMPLETE`
- Primary bounded context: `venues` + generic member-opinion persistence used for Venue targets
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Dependency: `WP-2.1 ACCEPTED`
- Reviewed implementation head: `241daa01e069a6cbaec4d0ebc09ddf5ca982a385`
- Exact implementation CI: run `34046985956` — **5/5 SUCCESS**, including clean-checkout `npm run verify`

## Scope

### Primary Feature IDs

- `FTR-018` — Venue spaces/dimensions/capacity/configuration.
- `FTR-023` — Individual partner favorites/ratings/preferences.
- `FTR-012` — only the Lot-2 continuation needed for member-scoped Venue preference/read-model foundations. Cross-device table/gallery layout preferences remain owned by WP-2.11 and reuse the already accepted `user_project_preferences` foundation rather than introducing a second UI-preference store.

### Current-lot responsibilities accepted here

- persist multiple physical spaces per Venue with independent geometry, physical type/context, indoor/outdoor state, seated/cocktail capacities, sort order and notes;
- distinguish space-level commercial capacity from whole-Venue marketing capacity and from later couple-specific compatibility/suitability results;
- enforce same-project Venue→space integrity with composite relational constraints;
- preserve revision/audit metadata and stale-write protection for collaboratively editable spaces;
- persist generic member-scoped entity favorites/personal notes and rating dimensions without converting opinions into shared facts;
- for WP-2.2 commands, expose only Venue targets even though the frozen tables are generic/extensible for later domains;
- restrict rating dimensions to the five frozen initial keys so typos cannot silently create new semantic dimensions;
- make member-authored preference/rating writes derive the author from `auth.uid()` rather than trusting client-supplied identity;
- allow partner rating visibility where the Venue product requires both-partner summaries while preventing cross-member writes;
- keep personal note/favorite row private to its owning member by default; later UI may expose a safe favorite summary without exposing private personal notes;
- reject space measurements that cannot be represented exactly by `numeric(10,2)` and align TypeScript/provider validation with PostgreSQL `integer` bounds;
- add direct authorization evidence for anon/outsider/project-B/revoked/viewer/member-impersonation/cross-project-target cases;
- provide domain/application/infrastructure ports/parsers for later UI/local-first packets without UI or IndexedDB implementation here.

### Responsibility boundary clarification

`VEN-005` lists wedding-specific fit such as external caterer, shared room, two dance zones, chuppah, weather/mehitsa and related suitability. WP-2.2 does **not** invent those as ad-hoc columns on `venue_spaces`.

- WP-2.2 owns physical space geometry/capacity/context inputs that are factual properties of a space.
- WP-2.3/WP-2.4 own typed sourced facts/evidence.
- WP-2.5 owns deterministic criterion evaluation and compatibility.
- WP-2.11 owns presentation of physical spaces plus wedding-specific fit.

This preserves the frozen Facts/Criteria architecture and avoids duplicating sourced truth in the space row.

### Requirements / Acceptance / Security IDs

- `VEN-003`, `VEN-004`, physical-input portion of `VEN-005`;
- `VEN-015`, `VEN-017`, `PRD-004`;
- `ACC-007`, `ACC-029` as applicable to Venue member opinions;
- `AUTHZ-001`, `AUTHZ-002`, `AUTHZ-004`, `AUTHZ-005`, `AUTHZ-006`, `AUTHZ-007`, `AUTHZ-008`, `AUTHZ-009`, `AUTHZ-012`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020`;
- Domain invariants 17, 28 and 29;
- physical-schema same-project FK, revision and rating constraints.

### Explicitly out of scope

- sourced facts/evidence, unknown/conflict state and compatibility evaluation;
- overall Venue marketing capacity if no authoritative source exists; do not derive it silently from one room;
- offers/availability/access routes;
- media/documents/tags;
- gallery/table/detail/compare UI;
- view-layout/filter/column preferences stored in `user_project_preferences` beyond reusing that existing foundation later;
- local/offline queue integration;
- ratings for non-Venue target types through a user-facing command;
- automatic aggregate/shared rating used as objective fact;
- real wedding/private data fixtures.

## Dependency / sequencing

- Required prior packet: WP-2.1 `ACCEPTED` with canonical Venue identity and project/RLS foundation.
- Downstream consumers: WP-2.10 local persistence; WP-2.11 detail/gallery/compare; WP-2.12 visit-mode ratings.
- Facts/criteria packets consume physical capacity inputs only through explicit domain/read-model boundaries; they must not rewrite personal ratings.

## Sizing review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| changed Venue bounded domain | 1 | 3 | 3 |
| new persistent table families | 3 (`venue_spaces`, `member_entity_preferences`, `member_ratings`) | 1 | 3 |
| migration family | 1 | 1 | 1 |
| author-scoped / stale-write command family | 1 | 1 | 1 |
| RLS + same-project + impersonation boundary | 1 | 2 | 2 |
| **Total** |  |  | **10** |

Cohesion rationale: the packet deliberately joins physical Venue-space persistence with the first personal Venue-opinion tables because both are direct dependencies of the later Venue detail/compare workspace and both require the same project-scoped Venue target boundary. The personal-opinion security rules remain isolated in their own tables/commands rather than being mixed into shared Venue facts.

## Pass A — IMPLEMENT

### Implementation evidence

Domain/application:

- `src/domain/venues/venue-space.ts` + tests — physical-space validation, exact `numeric(10,2)` representation, PostgreSQL `int32` capacity/sort bounds and normalization;
- `src/domain/venues/venue-member-opinion.ts` + tests — five controlled rating dimensions, 0..10/two-decimal ratings, private-note and expected-revision validation;
- `src/application/venues/venue-space-service.ts` + tests — project-scoped space create/update boundary with stale-write semantics;
- `src/application/venues/venue-member-opinion-service.ts` + tests — self-authored favorite/note/rating application boundary without client author identity.

Infrastructure:

- `src/infrastructure/supabase/supabase-venue-space-adapter.ts` + tests — narrow space RPC adapter and project/Venue-bound response handling;
- `src/infrastructure/supabase/parse-venue-space-row.ts` + tests — strict provider validation reusing the same physical representation rules as the domain;
- `src/infrastructure/supabase/supabase-venue-member-opinion-adapter.ts` + tests — Venue-only member-opinion commands and reads;
- `src/infrastructure/supabase/parse-venue-member-opinion-row.ts` + tests — UUID/project/user/target/dimension/range/revision response validation.

Migrations/schema:

- `supabase/migrations/20260906145000_create_venue_spaces_member_opinions.sql` — `venue_spaces`, `member_entity_preferences`, `member_ratings`, same-project target validation, RLS/grants and narrow RPCs;
- `supabase/migrations/20260906161500_harden_venue_rating_precision.sql` — direct-RPC two-decimal rating validation;
- `supabase/migrations/20260906170000_harden_venue_space_numeric_validation.sql` — direct-RPC exact `numeric(10,2)` validation preventing silent rounding/overflow.

DB/security evidence includes the direct WP-2.2 RLS/command matrix plus `supabase/tests/venue_space_numeric_validation_test.sql` for exact precision/overflow behavior.

### Pass A exit

- [x] intended vertical slice exists
- [x] applicable tests written
- [x] exact reviewed-head CI green
- [x] no known untracked stub/TODO in packet scope
- [x] implementation reviewed on a fixed exact head
- [x] packet proceeded to fresh Pass B

## Pass B — ADVERSARIAL REVIEW

### Finding and remediation

| Severity | Finding | Resolution | Final state |
|---|---|---|---|
| MAJOR `WP2.2-B-001` | Space measurements/capacities were not consistently constrained to the exact PostgreSQL representation at every boundary. In particular, values with more than two decimals could reach `numeric(10,2)` and be rounded silently, and TypeScript/provider integer validation was broader than PostgreSQL `integer`. | Added canonical domain validators for `numeric(10,2)` measurements and PostgreSQL int32 capacities/sort order; reused them in provider parsing; hardened create/update RPCs against over-precision/overflow; added direct pgTAP proving rejected writes leave canonical value and revision unchanged. | **RESOLVED** |

### Final adversarial re-review

Fresh re-review was performed against `241daa01e069a6cbaec4d0ebc09ddf5ca982a385` after B-001 remediation and exact-head verification.

Checks performed:

- [x] cross-project `venue_id` injection searched
- [x] direct `project_id`, audit and revision mutation searched
- [x] viewer/outsider/revoked/project-B write/read boundaries searched
- [x] member A writing member B preference/rating searched
- [x] another member's private personal note leakage searched
- [x] arbitrary rating-dimension proliferation searched
- [x] stale space/opinion overwrite searched
- [x] malformed/negative/overflow/over-precision geometry and capacity searched
- [x] provider-response representation mismatch searched
- [x] personal rating → shared factual compatibility leakage searched
- [x] architecture/provider-layer drift searched
- [x] premature UI/local-sync completion searched
- [x] real/private wedding data leakage searched

Fresh Pass B decision: **PASS** — no unresolved BLOCKING or MAJOR finding.

Non-blocking observation retained for later hardening: two simultaneous first creates of the same member preference/rating can race to the uniqueness constraint, so the losing write may surface as a uniqueness failure rather than the normalized stale/conflict error used after a row exists. This is non-destructive: no overwrite, impersonation or data loss occurs. It is not a WP-2.2 acceptance blocker.

## Pass C — ACCEPTANCE / RECONCILIATION

### Entry gate

- [x] packet entered Pass C from fresh Pass B PASS
- [x] no unresolved BLOCKING/MAJOR finding exists
- [x] exact reviewed implementation head has full CI evidence

| Responsibility | Expected | Implemented evidence | Verified evidence | Result |
|---|---|---|---|---|
| spaces/capacity | independent physical spaces, geometry/capacity and same-project integrity | `venue_spaces`, domain normalizer, service/port and Supabase adapter | unit/provider tests + direct pgTAP including precision/overflow and project isolation | **PASS** |
| collaborative safety | revisioned edits with stale-write protection and no silent numeric transformation | expected-revision service/RPC + audit/revision trigger + exact numeric hardening | stale-write tests + rejected over-precision update leaves value/revision unchanged | **PASS** |
| member favorite/note | self-authored Venue preference row with private personal note | `member_entity_preferences` + self-authored command/adapter | self-only RLS, impersonation/project isolation and service/parser tests | **PASS** |
| member ratings | five controlled dimensions, partner-readable where required, author-only write | `member_ratings` + rating domain/service/adapter + precision hardening | partner-independence, author-only mutation, dimension/range/precision tests | **PASS** |
| authorization/architecture | explicit grants/RLS/direct deny and layered ports/adapters | table grants/RLS, Venue-target trigger, `SECURITY DEFINER` commands, strict parsers | pgTAP security matrix + typecheck/static/dependency-cruiser/Knip + adapter tests | **PASS** |

### Exact reviewed-head evidence

GitHub Actions run `34046985956` on `241daa01e069a6cbaec4d0ebc09ddf5ca982a385`:

- **Core quality and security: SUCCESS**
  - **47 test files / 473 tests PASS**;
  - measured in-scope coverage **100% statements / branches / functions / lines**;
  - typecheck, Prettier, ESLint, dependency-cruiser, Knip, marker and negative controls PASS;
- **Local Supabase DB and RLS: SUCCESS**
  - **20 files / 442 pgTAP tests PASS**;
  - includes direct Venue-space/member-opinion authorization and numeric precision/overflow evidence;
- **Browser and mutation harnesses: SUCCESS**
  - **40/40 Playwright E2E PASS** across Chromium, Firefox, WebKit and mobile Chromium;
  - mutation harness PASS under the repository's configured scope;
- **Privacy-safe preview artifact: SUCCESS**;
- **Full verify from clean checkout: SUCCESS** with `npm run verify`.

Known dependency-audit output remains the previously reviewed two Moderate transitive `qs` development-tool advisories. No Critical/High accepted-known vulnerability is introduced by WP-2.2.

### Acceptance checks

- [x] all packet responsibilities reconciled
- [x] FIR-equivalent durable record complete
- [x] automated/security evidence green
- [x] no BLOCKING/MAJOR finding open
- [x] architecture/complexity/static gates green
- [x] no false claim of UI/offline/criteria completion
- [x] downstream prerequisites clearly recorded

Required WP-2.2 responsibilities minus accepted/evidenced WP-2.2 responsibilities: **∅**.

Final packet decision: **`ACCEPTED`**.

## Handoff

- Current state: `ACCEPTED`
- Current/next pass: `COMPLETE`
- Reviewed implementation head: `241daa01e069a6cbaec4d0ebc09ddf5ca982a385`
- Exact implementation verification: run `34046985956` — **5/5 SUCCESS**, clean-checkout verify PASS
- Open WP-2.2 BLOCKING/MAJOR findings: **none**
- Accepted responsibility gap: **∅**
- Non-blocking observation: first-create uniqueness race may not normalize to the same conflict code as an existing-row stale write; no destructive behavior observed
- Next permitted packet: **WP-2.3 — Fact definitions, typed retained facts and value validation**
- WP-2.3 must keep personal opinions separate from shared facts and must not implement observations/sources/criteria early.
