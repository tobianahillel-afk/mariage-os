# WP-2.7 — Contextual venue access-route observations

## Identity

- Work Packet ID: `WP-2.7`
- Lot: `2`
- Name: Contextual venue access-route observations
- State: `PLANNED`
- Current pass: `PLAN`
- Primary bounded context: Venue access-route observation history and default-origin summary selection
- Branch/PR: `lot-2/venues-core` / PR not opened yet

## Scope

### Primary requirements / current-lot responsibility

- `VEN-016` — access routes are stored per reference origin and transport mode without overwriting historical observations;
- `ACC-030` — switching the project default origin changes the derived summary while preserving observations for all origins;
- Lot-2 access responsibility mapped by the frozen matrices to the FTR-008 foundation and downstream FTR-080/FTR-081 Map/access capabilities. This packet does **not** claim whole-feature acceptance for downstream Lot 9 capabilities.

### Current-lot responsibilities covered

- append-oriented `venue_access_routes` history owned by a Venue;
- exact frozen route types: `reference_to_venue | reference_to_tgv_station | tgv_station_to_venue | airport_to_venue | custom`;
- exact frozen transport modes: `car | train | public_transport | taxi_vtc | shuttle | coach | walk | mixed | other`;
- optional same-project `project_reference_origins` context and optional same-project source;
- bounded optional origin/destination labels, non-negative duration/distance/transfer metrics, strict observation instant and bounded notes;
- immutable historical observation semantics;
- stable caller-generated UUID for ambiguous append retries, same-ID/same-caller-payload replay and typed same-project conflict;
- foreign-project UUID collision non-disclosure;
- deterministic history order `observed_at DESC`, then `created_at DESC`, then canonical UUID `id ASC`, preserving PostgreSQL microsecond order through provider parsing;
- deterministic current default-origin summary selection without rewriting history;
- project-scoped `access.read` / `access.write` authorization, same-project relationship integrity and fail-closed provider parsing.

### Requirements / Acceptance / Security IDs

- `VEN-016`, `ACC-030`;
- applicable `AUTHZ-001..008`, `AUTHZ-012`, `AUTHZ-017`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020`;
- applicable `SEC-AUTH-012`, `SEC-AUTH-013`, `SEC-AUTHZ-001..005`, `SEC-AUTHZ-007..009`, `SEC-VAL-001..006`, `SEC-VAL-008`, `SEC-VAL-010`, `SEC-INJ-001`, `SEC-INJ-002`, `SEC-LOG-002`, `SEC-LOG-004`, `SEC-ABUSE-004`, `SEC-VER-001`, `SEC-VER-005`, `SEC-VER-006`;
- `PHYSICAL-SCHEMA-V1.md`, `PHYSICAL-SCHEMA-V1-ADDENDUM.md`, `DEPENDENCY-GRAPH.md`, `DEFAULT-CRITERIA.md`, `RLS-MATRIX-V1.md`, `RLS-PERMISSION-MAPPING.md`.

### Explicitly out of scope for this packet

- map rendering, pins, tiles, geocoding or routing-provider calls (Lot 9);
- automatic recomputation from an external routing provider;
- Venue gallery/table/detail/compare presentation (WP-2.11);
- local/offline queue/cache behavior (WP-2.10 / WP-2.12);
- automatic Tasks/reminders (Lot 3);
- Vendor/guest transport workflow;
- importing the couple's real research data (Lot 12);
- generic fact mutation for default-origin convenience summaries; this packet exposes a deterministic route read model and does not create a second editable truth.

## Dependency / sequencing

- WP-2.1 is **ACCEPTED** and provides canonical Venue identity/project isolation.
- Lot-1 WP-1.5 is **ACCEPTED** and provides `project_reference_origins`, one-default semantics, `access.read` / `access.write`, protected origin save/delete commands and live authorization.
- Decomposed WP-2.6A/B/C/D is fully **ACCEPTED** at packet level with responsibility gap `∅`.
- WP-2.6D final acceptance-governance closure head `767017112445a38863abd114e8c62feb27af6421`, exact CI `34322712448`: **5/5 SUCCESS**. This closes the sequencing gate for WP-2.7 activation.
- WP-2.8 remains prohibited concurrently under the one-active-packet default.

## Activation revalidation / specification repair

### Existing frozen semantics

The frozen physical schema already defines `venue_access_routes` as project/Venue-owned observations with route type, mode, optional reference origin, labels, duration, distance, transfers, `observed_at`, source, notes and audit fields. `VEN-016` and `ACC-030` require origin/mode-specific history to coexist. The dependency graph additionally requires that changing an origin address/coordinate can invalidate observations tied to the prior location context rather than silently rewriting them.

### Stop-condition found

The original physical table shape stored only `reference_origin_id`. That is insufficient to prove whether a historical route observation was calculated/observed against the **current** location revision of that origin. Without a revision binding, editing an origin address/coordinate could make an old route appear current, contradicting the dependency graph.

### Frozen repair

The effective WP-2.7 contract therefore adds `reference_origin_revision bigint nullable` to each route observation:

1. `reference_origin_id IS NULL` iff `reference_origin_revision IS NULL`.
2. When `reference_origin_id` is present, the append command resolves that origin in the same project and server-captures its current positive `revision`.
3. When a reference origin is present, `origin_label` is a server-captured snapshot of that origin's current canonical label; callers do not provide a competing origin label. When no reference origin is present, a caller may provide an optional canonical `origin_label` for custom/station/airport context.
4. The historical route row is immutable. A later origin edit increments the origin revision and does not rewrite the route observation or its captured label/revision.
5. A referenced origin cannot be physically deleted while route history still cites it. Existing origin delete behavior may therefore fail through the new FK once history depends on the origin; this protects historical context rather than cascading deletion.
6. A current default-origin summary considers only a row whose `reference_origin_id` equals the current default origin, whose captured `reference_origin_revision` equals that origin's current `revision`, whose `route_type` is `reference_to_venue`, and whose `mode` equals the requested mode.
7. Among eligible rows, the first row in canonical history order (`observed_at DESC`, `created_at DESC`, `id ASC`) is the summary observation.
8. No default origin or no eligible current-revision observation yields an explicit missing/review-needed read-model outcome. The read model never falls back silently to another origin, mode or stale revision.
9. Switching only which origin is default therefore changes summary selection immediately while retaining every route observation unchanged, satisfying `ACC-030`.
10. Editing the address/coordinates/label of an origin makes previously captured rows historical/stale for current-summary purposes until a new observation is appended under a new UUID.

### Append replay semantics

- The client supplies a stable route observation UUID.
- Same route UUID + same caller-owned semantic payload in the same project is idempotent and returns the already accepted row.
- Server-captured `reference_origin_revision` and server-captured label are not caller-owned replay fields; a retry after an origin edit returns the originally accepted observation rather than turning into a false conflict.
- Same route UUID + different caller-owned semantic payload in the same project is a typed conflict (`23505` boundary, mapped by application code).
- A route UUID already owned by another project returns a generic authorization/non-disclosure failure (`42501`), not replay existence/content.

### Deterministic read precision

As with accepted availability and interaction history, PostgreSQL can retain microseconds while TypeScript canonicalizes instants to milliseconds. The Supabase adapter must request the complete database order and preserve provider order after validation; application code must not re-sort parsed millisecond timestamps.

Activation stop-condition: **CLOSED BY THIS FREEZE**, subject to exact-head CI verification before READY transition.

## Input boundaries

- `route_type`: exact allowlist above.
- `mode`: exact allowlist above.
- `origin_label`, `destination_label`: optional canonical trimmed text, maximum 160 Unicode code points; empty becomes `null`.
- `duration_minutes`, `distance_meters`, `transfers_count`: optional PostgreSQL int32-safe non-negative integers.
- `observed_at`: strict absolute instant using the accepted fact-instant grammar/parity.
- `notes`: optional text, maximum 5,000 Unicode code points; empty becomes `null`.
- `reference_origin_id`, `source_id`: optional UUIDs; relationships must resolve inside the target project.
- Sparse observations are permitted: the frozen schema does not require at least one of duration/distance/transfers to be populated.

## Sizing review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| new/meaningfully changed bounded domain | 1 | 3 | 3 |
| new persistent entity/table | 1 | 1 | 1 |
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
| **Total** |  |  | **9** |

### 9-point cohesion rationale

The route observation, current-origin revision capture, immutable history, append/replay identity, deterministic current-summary selection and `access.*` authorization form one coherent historical-context vertical slice. Splitting persistence from origin-revision invalidation would make `ACC-030` and the dependency-graph invariant impossible to review end to end.

## Expected vertical slice

- UI/route: none.
- domain: route type/mode/value validation, immutable replay equality and current-summary eligibility/selection.
- application: append/replay service, ordered Venue route-history query and current default-origin summary query.
- ports: route append/history plus minimal default-origin read required by the derived summary.
- infrastructure: fail-closed Supabase route adapter/parser and accepted reference-origin read boundary.
- cloud persistence/RLS: `venue_access_routes`, same-project Venue/origin/source integrity, immutable history, `access.read` RLS, authenticated append RPC using `access.write` after project-lock serialization.
- local/offline: none in this packet.
- external routing provider: none.

## Verification plan

### Domain/application/provider

- exact enum allowlists;
- strict instant/text/int bounds;
- optional UUID validation;
- replay equality excludes server-captured revision/label fields;
- deterministic current-summary selection and explicit missing/stale outcome;
- adapter requests complete canonical order and preserves provider order across microsecond collapse;
- malformed/missing/substituted provider rows fail closed;
- duplicate provider IDs fail closed.

### Database / RLS / adversarial

- table/schema/check constraints and immutable update/delete denial;
- same-project Venue/origin/source constraints;
- server captures current origin revision/label atomically within append command;
- origin edit leaves old observation untouched and makes it ineligible for current-revision summary;
- origin physical delete cannot erase cited route history;
- multiple origins/modes and old observations coexist;
- same-ID/same-payload replay returns one row;
- same-project differing payload is `23505` conflict;
- foreign-project UUID collision is generic `42501` non-disclosure;
- owner/editor permitted according to `access.write`, viewer/read-only denied append but permitted read according to role mapping;
- anon/outsider/project-B/revoked denied;
- role downgrade/revocation affects subsequent writes in the same authenticated session;
- helper/append grants and `SECURITY DEFINER search_path=pg_catalog` are directly asserted.

### Acceptance

`ACC-030`: persist at least two driving observations for two distinct reference origins; switch default origin through the already accepted origin command; verify summary moves to the new origin while both historical route rows remain unchanged. Then edit the selected origin location context and verify the old row remains history but current summary becomes missing/review-needed until a new route observation is appended.

## Execution gates

1. This PLANNED/PLAN specification freeze and the schema addendum repair must be committed and exact-head CI must be **5/5 SUCCESS**.
2. Only then may WP-2.7 transition to `READY`.
3. READY/governance head itself must be **5/5 SUCCESS** before transition to `IN_PROGRESS / A-IMPLEMENT`.
4. IN_PROGRESS transition head itself must be **5/5 SUCCESS** before production code.
5. Pass A begins red-first at the route persistence/append boundary.
6. Pass B independently reconstructs the complete slice; any BLOCKING/MAJOR finding returns to remediation.
7. Pass C reconciles every responsibility/control before acceptance.
8. WP-2.8 remains prohibited until WP-2.7 is ACCEPTED and its acceptance-governance head is green.

## Handoff

- Current state: `PLANNED`
- Current pass: `PLAN`
- Previous packet: WP-2.6D — **ACCEPTED / COMPLETE**, final acceptance-governance closure `767017112445a38863abd114e8c62feb27af6421` / `34322712448` — **5/5 SUCCESS**.
- Current stop-condition: origin-revision binding closed normatively in this packet and `PHYSICAL-SCHEMA-V1-ADDENDUM.md`; exact-head freeze CI still required.
- Next permitted action after freeze CI success: transition WP-2.7 to `READY`; do not write product code before READY and IN_PROGRESS gates are separately green.
