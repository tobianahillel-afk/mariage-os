# WP-2.2 — Spaces, capacity and member ratings/preferences

## Identity

- Work Packet ID: `WP-2.2`
- Lot: `2`
- Name: Spaces, capacity and member ratings/preferences
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
- Primary bounded context: `venues` + generic member-opinion persistence used for Venue targets
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Dependency: `WP-2.1 ACCEPTED`

## Scope

### Primary Feature IDs

- `FTR-018` — Venue spaces/dimensions/capacity/configuration.
- `FTR-023` — Individual partner favorites/ratings/preferences.
- `FTR-012` — only the Lot-2 continuation needed for member-scoped Venue preference/read-model foundations. Cross-device table/gallery layout preferences remain owned by WP-2.11 and reuse the already accepted `user_project_preferences` foundation rather than introducing a second UI-preference store.

### Current-lot responsibilities covered

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

## Expected vertical slice

- domain: space input/range validation; controlled rating dimension/range validation; revision validation reuse;
- application: project-scoped space repository/commands and self-authored Venue preference/rating ports;
- infrastructure: Supabase adapters with strict response parsing and no trusted client author ID;
- cloud persistence: `venue_spaces`, `member_entity_preferences`, `member_ratings` with same-project target validation/RLS/grants;
- security: direct allow/deny tests including partner impersonation, cross-project Venue target, viewer, outsider and revoked membership;
- local/offline: no new IndexedDB schema or queue in this packet;
- UI: no Venue screen accepted in this packet;
- import/export: no import semantics; generic target schema remains forward-compatible.

## Pass A — IMPLEMENT

Implementation evidence: **in progress**.

Planned evidence before Pass A exit:

- migration(s) implementing the three frozen table contracts and narrow mutation boundaries;
- direct pgTAP matrix for spaces and member opinions;
- domain/application/infrastructure tests including malformed provider responses and member-identity spoof attempts;
- mandatory static/type/coverage gates;
- exact-head CI including clean-checkout `npm run verify`.

### Pass A exit gate

- [ ] intended vertical slice exists
- [ ] applicable tests written
- [ ] exact-head CI green
- [ ] no known untracked stub/TODO
- [ ] packet moved to `REVIEW_PENDING`
- [ ] next pass recorded as `B-ADVERSARIAL-REVIEW`

## Pass B — ADVERSARIAL REVIEW

Not started. Must be fresh after Pass-A implementation and exact-head verification.

Review will specifically attempt:

- cross-project `venue_id` injection;
- direct `project_id`, audit or revision mutation;
- viewer write / outsider / revoked / project-B access;
- member A writing B's favorite/note/rating;
- leaking another member's private personal note;
- arbitrary rating-dimension proliferation;
- stale space/opinion overwrite;
- malformed/negative/overflow geometry and capacity;
- accidental conversion of personal ratings into shared factual compatibility;
- architecture drift or premature UI/local-sync behavior.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Entry requires fresh Pass B `PASS` with no unresolved BLOCKING/MAJOR finding.

| Responsibility | Expected | Implemented evidence | Verified evidence | Result |
|---|---|---|---|---|
| spaces/capacity | independent physical spaces, geometry/capacity, same-project integrity | pending | pending | pending |
| collaborative safety | revisioned edits with stale-write protection | pending | pending | pending |
| member favorite/note | self-authored Venue preference row, private note | pending | pending | pending |
| member ratings | controlled dimensions, partner-readable where required, author-only write | pending | pending | pending |
| authorization/architecture | explicit grants/RLS/direct deny + layered ports/adapters | pending | pending | pending |

Final packet decision: `IN_PROGRESS`.

## Handoff

- Current state: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
- Accepted prerequisites: `WP-2.1`
- Open BLOCKING/MAJOR findings: none yet; Pass B not started
- Next permitted action: implement WP-2.2 only; do not start WP-2.3 concurrently
