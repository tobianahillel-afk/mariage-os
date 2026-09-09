# WP-2.7 — Contextual venue access-route observations

## Identity

- Work Packet ID: `WP-2.7`
- Lot: `2`
- Name: Contextual venue access-route observations
- State: `ACCEPTED`
- Current pass: `COMPLETE`
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
- server-captured reference-origin label/location snapshots so route applicability tracks physical location context without depending on general origin revision;
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
- applicable `SEC-AUTH-012`, `SEC-AUTH-013`, `SEC-AUTHZ-001..005`, `SEC-AUTHZ-007..009`, `SEC-VAL-001..006`, `SEC-VAL-008`, `SEC-VAL-010`, `SEC-INJ-001`, `SEC-INJ-002`, `SEC-LOG-002`, `SEC-LOG-004`, `SEC-ABUSE-004`, `SEC-VER-001`, `SEC-VER-002`, `SEC-VER-005`, `SEC-VER-006`;
- `PHYSICAL-SCHEMA-V1.md`, `PHYSICAL-SCHEMA-V1-ADDENDUM.md`, `DEPENDENCY-GRAPH.md`, `DEFAULT-CRITERIA.md`, `RLS-MATRIX-V1.md`, `RLS-PERMISSION-MAPPING.md`, `CANONICAL-JSON-V1-ADDENDUM.md`.

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
- WP-2.8 remains prohibited until this WP-2.7 acceptance commit and subsequent acceptance-governance reconciliation are themselves exact-head green.

## Activation revalidation / specification repair

### Existing frozen semantics

The frozen physical schema already defines `venue_access_routes` as project/Venue-owned observations with route type, mode, optional reference origin, labels, duration, distance, transfers, `observed_at`, source, notes and audit fields. `VEN-016` and `ACC-030` require origin/mode-specific history to coexist. The dependency graph additionally requires that changing an origin address/coordinate can invalidate observations tied to the prior location context rather than silently rewriting them.

### Stop-condition found

The original physical table shape stored only `reference_origin_id`. That is insufficient to prove whether a historical route observation still matches the referenced origin's current physical location context.

A first activation draft considered binding observations to the general `project_reference_origins.revision`, but independent revalidation rejected that design before READY: the accepted `save_project_reference_origin` command increments the general revision for changes such as `is_default`, and switching defaults is precisely the action that `ACC-030` requires **not** to invalidate an otherwise unchanged route. General origin revision is therefore not a valid proxy for route-location context.

### Frozen repair — server-captured location snapshot

The effective WP-2.7 contract adds these server-owned fields to each route observation when `reference_origin_id` is present:

- `reference_origin_address_snapshot text nullable`;
- `reference_origin_latitude_snapshot numeric(9,6) nullable`;
- `reference_origin_longitude_snapshot numeric(9,6) nullable`.

The existing `origin_label` column is the server-captured historical origin-label snapshot when a reference origin is present.

Rules:

1. When `reference_origin_id` is null, all three reference-origin location snapshot fields are null.
2. When `reference_origin_id` is present, the append command resolves that origin in the same project and server-captures its current canonical `label`, `address_text`, `latitude` and `longitude`; callers cannot supply or override those snapshots.
3. When a reference origin is present, callers do not provide a competing origin label. When no reference origin is present, a caller may provide an optional canonical `origin_label` for custom/station/airport context.
4. The historical route row is immutable. Later origin edits never rewrite its captured label/location context.
5. A referenced origin cannot be physically deleted while route history cites it. Existing origin delete behavior may therefore fail through the new restrictive FK once history depends on the origin; this protects historical context rather than cascading deletion.
6. A current default-origin summary considers only a row whose `reference_origin_id` equals the current default origin, whose captured address/latitude/longitude are each `IS NOT DISTINCT FROM` that origin's current canonical location fields, whose `route_type` is `reference_to_venue`, and whose `mode` equals the requested mode.
7. Among eligible rows, the first row in canonical history order (`observed_at DESC`, `created_at DESC`, `id ASC`) is the summary observation.
8. No default origin or no eligible current-location-context observation yields an explicit missing/review-needed read-model outcome. The read model never falls back silently to another origin, mode or stale location snapshot.
9. Switching only `is_default` changes summary selection immediately while retaining every route observation unchanged, satisfying `ACC-030`.
10. Changing `sort_order` or only the origin label does not invalidate route applicability because it does not change the physical origin; the historical observation still retains its captured label.
11. Changing `address_text`, `latitude` or `longitude` makes prior observations stale for current-summary purposes until a matching observation is appended.
12. Restoring the exact canonical physical location context can make an older observation eligible again; applicability follows actual context equality rather than an unrelated monotonic row revision.

### Append replay semantics

- The client supplies a stable route observation UUID.
- Same route UUID + same caller-owned semantic payload in the same project is idempotent and returns the already accepted row.
- Server-captured origin label/location snapshots are not caller-owned replay fields; a retry after a later origin edit returns the originally accepted observation rather than turning into a false conflict.
- Same route UUID + different caller-owned semantic payload in the same project is a typed conflict (`23505` boundary, mapped by application code).
- A route UUID already owned by another project returns a generic authorization/non-disclosure failure (`42501`), not replay existence/content.

### Deterministic read precision

As with accepted availability and interaction history, PostgreSQL can retain microseconds while TypeScript canonicalizes instants to milliseconds. The Supabase adapter must request the complete database order and preserve provider order after validation; application code must not re-sort parsed millisecond timestamps.

### Canonical JSON historical portability repair

The route snapshot repair also changes what a lossless canonical route representation must preserve. `CANONICAL-JSON-V1-ADDENDUM.md` now freezes explicit historical reference-origin snapshot properties for route export/import:

- `referenceOriginLabelSnapshot`;
- `referenceOriginAddressSnapshot`;
- `referenceOriginLatitudeSnapshot`;
- `referenceOriginLongitudeSnapshot`.

For a reference-origin-backed route, canonical export preserves the originally accepted snapshot instead of reconstructing it from the origin's current state. The ordinary runtime append API remains server-authoritative and does not accept caller overrides for these fields. Lot 4 import/restore will use its own reviewed boundary to validate and preserve historical snapshots without mutating the referenced origin.

Legacy canonical route objects without snapshots may be accepted only as compatibility input with an explicit preview limitation: they cannot reconstruct unknown historical physical context after an origin changed. A committed compatibility object is treated as a new observation using the then-current server-captured origin context rather than fabricating lost history.

This closes the round-trip contradiction before persistence exists: after the addendum, canonical export can preserve contextual route history even when a reference origin is later edited.

Activation stop-condition: **CLOSED / VERIFIED**. Physical-origin snapshot freeze `4baa335b5f964ee13e806cd9a5170f28ff179835` / `34336841778` and canonical portability repair `05f9695d5e437a69dfd0cf5b839ad00bdc7afc38` / `34343241298` are both **5/5 SUCCESS**, including clean-checkout `npm run verify`.

## Input boundaries

- `route_type`: exact allowlist above.
- `mode`: exact allowlist above.
- caller-owned `origin_label` (only when `reference_origin_id` is null) and `destination_label`: optional canonical trimmed text, maximum 160 Unicode code points; empty becomes `null`.
- `duration_minutes`, `distance_meters`, `transfers_count`: optional PostgreSQL int32-safe non-negative integers.
- `observed_at`: strict absolute instant using the accepted fact-instant grammar/parity.
- `notes`: optional text, maximum 5,000 Unicode code points; empty becomes `null`.
- `reference_origin_id`, `source_id`: optional UUIDs; relationships must resolve inside the target project.
- reference-origin address/coordinate snapshots and reference-origin-backed `origin_label` are server-owned outputs, not caller inputs.
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

The route observation, current-origin context capture, immutable history, append/replay identity, deterministic current-summary selection and `access.*` authorization form one coherent historical-context vertical slice. Splitting persistence from context invalidation would make `ACC-030` and the dependency-graph invariant impossible to review end to end.

The context snapshot adds no second public command and no second bounded workflow; it is server-owned data captured atomically by the single append command, so the packet remains within the 9-point cohesion-reviewed size.

## Expected vertical slice

- UI/route: none.
- domain: route type/mode/value validation, immutable replay equality and current-summary context eligibility/selection.
- application: append/replay service, ordered Venue route-history query and current default-origin summary query.
- ports: route append/history plus minimal default-origin read required by the derived summary.
- infrastructure: fail-closed Supabase route adapter/parser and accepted reference-origin read boundary.
- cloud persistence/RLS: `venue_access_routes`, same-project Venue/origin/source integrity, immutable history, server-owned origin location snapshots, `access.read` RLS, authenticated append RPC using `access.write` after project-lock serialization.
- local/offline: none in this packet.
- external routing provider: none.

## Verification plan

### Domain/application/provider

- exact enum allowlists;
- strict instant/text/int bounds;
- optional UUID validation;
- reference-origin-backed origin label/location snapshots cannot be caller-controlled;
- replay equality excludes server-captured origin label/location snapshot fields;
- deterministic current-summary context comparison/selection and explicit missing/stale outcome;
- adapter requests complete canonical order and preserves provider order across microsecond collapse;
- malformed/missing/substituted provider rows fail closed;
- duplicate provider IDs fail closed.

### Database / RLS / adversarial

- table/schema/check constraints and immutable update/delete denial;
- same-project Venue/origin/source constraints;
- server captures current canonical origin label/address/coordinates atomically within append command;
- changing only default/sort/label state leaves route applicability intact and every route row unchanged;
- origin address/coordinate edit leaves old observation untouched but makes it ineligible for current-summary context;
- origin physical delete cannot erase cited route history;
- multiple origins/modes and old observations coexist;
- same-ID/same-payload replay returns one row, including retry after origin context later changed;
- same-project differing caller payload is `23505` conflict;
- foreign-project UUID collision is generic `42501` non-disclosure;
- owner/editor permitted according to `access.write`, viewer/read-only denied append but permitted read according to role mapping;
- anon/outsider/project-B/revoked denied;
- role downgrade/revocation affects subsequent writes in the same authenticated session;
- helper/append grants and `SECURITY DEFINER search_path=pg_catalog` are directly asserted;
- adversarial SQL/auth/session tests exercise the exposed command and direct table boundary in CI.

### Acceptance

`ACC-030`: persist at least two `reference_to_venue` / `car` observations for two distinct reference origins; switch default origin through the already accepted origin command; verify summary moves to the new origin while both historical route rows remain unchanged and the newly default origin's existing matching route remains eligible. Then edit that origin's address/coordinates and verify the old row remains history but current summary becomes missing/review-needed until a new route observation is appended.

## Pass A — IMPLEMENT

**COMPLETE / VERIFIED.** The red-first route boundary `a9b8909d2225e54da9e9dc1fddd57ec9aa3463b5` / `34347040335` failed as expected before `venue_access_routes` and the atomic append/replay command existed. Final Pass-A implementation head `004aec0ee30e5f228c55ecd6fe7fae8d5ba98794` / `34364195509` is **5/5 SUCCESS**. The vertical slice now contains strict route domain validation and replay equality, deterministic current-default-origin summary selection, Venue-owned `AccessService`, fail-closed Supabase parser/adapter preserving canonical provider order, immutable project-scoped persistence/RLS and the atomic append command, plus domain/application/provider and DB/RLS tests. Forward-only migrations `20260909120500_create_venue_access_routes.sql` and `20260909122000_harden_venue_access_route_text_bounds.sql` implement the persistence and text-boundary hardening. Exact-head verification passed 121 unit-test files / 1093 tests at 100% measured statements/branches/functions/lines, 54 DB files / 1060 pgTAP tests, 40/40 Playwright tests, mutation, privacy-safe preview and Full verify from clean checkout. Scope remained access-route-only; WP-2.8 was not started.

Pass-A decision: **COMPLETE / VERIFIED — transition to REVIEW_PENDING / B-ADVERSARIAL-REVIEW**.

## Pass B — ADVERSARIAL REVIEW

- REVIEW_PENDING transition/traceability head `5f98e877275a9f4149f5e522e426b7f4347a9e9e` / `34366885380`: **5/5 SUCCESS**.
- Fresh review reconstructed the route slice independently from the normative schema, access contracts, authorization matrix, accepted Lot-1 reference-origin behavior and prior append/replay precedents.
- `WP2.7-B-001` **MAJOR** — TypeScript canonicalized a whitespace-only `originLabel` to `null` for a referenced origin while the SQL wrapper still rejected the raw non-null input. Red-first `1fa53b8f9864ec4ab2f3999073bb0a99f95773a5` / `34369198622`: expected FAILURE (`22023` instead of success) with prior DB tests remaining green.
- `WP2.7-B-001` is **RESOLVED / VERIFIED** by forward-only migration `20260909123000_harden_venue_access_route_origin_label_parity.sql` on `cc85c0167e40eb2250d9143b6f4ded28d94118d6` / `34369744964`: **5/5 SUCCESS**, including clean-checkout `npm run verify`.
- Fresh authorization evidence on `c1cb06bf6fdd4b33bc966f985f668938a7edf158` proves editor append success, immediate same-session downgrade denial, restored editor success, immediate same-session revocation denial, internal helper non-exposure and `SECURITY DEFINER search_path=pg_catalog`; exact CI `34370566573`: **5/5 SUCCESS**, including clean-checkout `npm run verify`.
- Replay after later origin edits still returns the originally accepted historical route/snapshots; same-project payload mismatch remains typed conflict; foreign-project route-ID collision remains generic/non-disclosing.
- Immutable history, referenced-origin delete protection, current-location applicability, explicit stale/missing summary, provider microsecond ordering, malformed/duplicate provider fail-closed behavior and `access.read` / `access.write` mapping remain verified.
- Open BLOCKING/MAJOR findings: **∅**.
- Pass B decision: **PASS — transition to ACCEPTANCE_PENDING / C-ACCEPTANCE**.

## Pass C — ACCEPTANCE / RECONCILIATION

Pass-C entry transition `30807e355f85b5146ceba449a0115542e393b69d`, exact CI `34372335839`: **5/5 SUCCESS**, including clean-checkout `npm run verify`.

Mechanical reconciliation:

| Responsibility / control | Expected | Implemented evidence | Verified evidence | Result |
|---|---|---|---|---|
| `VEN-016` contextual route history | Multiple origin/mode observations coexist under one Venue without overwrite. | `venue_access_routes` + atomic append RPC + `AccessService` append/history port. | `venue_access_routes_test.sql` proves append-oriented coexistence/replay/history; `venue_access_routes_acceptance_test.sql` persists distinct Paris/Home driving routes. | PASS |
| Frozen route/mode/input boundaries | Exact enum allowlists, strict instant, optional UUIDs, 160-code-point labels, int32-safe non-negative metrics and bounded notes. | Domain normalizer + SQL constraints/wrapper + forward text-boundary hardening. | Domain tests, `venue_access_routes_text_bounds_test.sql`, base pgTAP and B-001 regression. | PASS |
| Server-owned historical origin snapshots | Referenced append captures canonical label/address/lat/lon; client cannot override snapshots or reinterpret old history. | Append RPC resolves same-project origin and stores server snapshots; parser exposes validated snapshot fields. | Base pgTAP proves capture, client override denial, immutable old snapshots and fresh capture after edit. | PASS |
| Current physical-context applicability | Summary matches current default origin only when address/lat/lon snapshots still match; no general revision binding. | Domain `venueAccessRouteMatchesCurrentOrigin` / summary selector + default-origin read port. | Domain/application tests cover moved/stale/fresh context; acceptance pgTAP proves persisted moved context becomes ineligible then fresh route restores selection. | PASS |
| Immutable history / origin preservation | Route rows cannot update/delete; cited reference origin cannot be physically deleted. | Immutable triggers, narrow grants, restrictive same-project origin FK and hardened origin delete command. | Base pgTAP denies direct route mutation, blocks cited-origin deletion and preserves history while allowing unreferenced origin deletion. | PASS |
| Stable UUID replay / conflict / non-disclosure | Same ID + same caller payload is idempotent; differing same-project payload is typed conflict; foreign-project collision is generic. | Atomic append/replay equality excludes server snapshots; service maps `23505`; cross-project identity fails `42501`. | Domain/service/adapter tests + base pgTAP + Pass-B review. | PASS |
| Deterministic history order | DB/provider order is `observed_at DESC`, `created_at DESC`, `id ASC`; JS must not destroy PostgreSQL microsecond ordering. | Supabase adapter requests all three order clauses and preserves provider order. | Adapter/application tests cover duplicate rejection and microsecond→millisecond collapse while retaining provider order; base pgTAP verifies DB chronology. | PASS |
| `ACC-030` default-origin switch | Persist Paris/Home car observations; switch default through accepted origin command; summary moves without history rewrite. | Existing Lot-1 `save_project_reference_origin` + WP-2.7 persisted route history + deterministic summary predicate. | `venue-access-service.test.ts` covers read-model behavior; dedicated `venue_access_routes_acceptance_test.sql` on `3501a6056361dfa792743bf928464520f2538499` / `34373382884` proves the exact persisted switch, two-row preservation, stale-on-move and fresh-route recovery; **5/5 SUCCESS**. | PASS |
| Explicit missing/stale outcome | No default or no eligible current-context observation returns missing/review-needed; no fallback to stale/other origin/mode. | `selectVenueAccessRouteSummary` + `AccessService.currentDefaultOriginSummary`. | Domain/application tests cover no-default and stale; acceptance pgTAP proves persisted physical-context mismatch yields no eligible row. | PASS |
| `access.read` / `access.write` authorization | Owner/editor write, viewer read-only; anon/outsider/revoked/cross-project denied; authorization is live. | RLS + authenticated SELECT grant + protected SECURITY DEFINER writer locking project before `has_project_permission`. | Base pgTAP plus `venue_access_routes_authorization_adversarial_review_test.sql` prove role allow/deny, isolation, same-session downgrade/revocation and lock ordering. | PASS |
| Privileged boundary hardening | Internal helper/core unavailable to client roles; public append minimal; trusted `search_path`. | Explicit REVOKE/GRANT + `search_path=pg_catalog` on privileged functions. | Authorization adversarial pgTAP directly asserts execute privileges and `proconfig`. | PASS |
| Same-project relationships | Venue, reference origin and optional source cannot cross project. | Composite same-project FKs plus RPC relationship validation. | Base pgTAP rejects cross-project venue/origin/source, including foreign route UUID non-disclosure. | PASS |
| Fail-closed provider boundary | Malformed/missing/substituted identities/payloads, duplicate rows or invalid snapshots cannot become application truth. | `parseVenueAccessRouteRow`, expected caller-payload verification and adapter duplicate detection. | Parser/adapter unit tests and fresh Pass-B reconstruction. | PASS |
| Applicable AUTHZ/security controls | Identity, membership, permissions, relationships, validation, safe query/RPC boundary and verification controls apply end to end. | GRANT/RLS/RPC/FKs + strict domain/DB validation + generic provider/service error mapping. | Direct pgTAP allow/deny, security/static checks, unit/integration/DB/E2E/mutation/clean-checkout verification. | PASS |
| Scope fence | No map provider/rendering, Venue UI, local/offline queue, Task workflow or Lot-4 import implementation is pulled forward. | Production diff remains the Venue access-route persistence/read-model slice only. | Pass-B reconstruction + Pass-C responsibility audit. | PASS |

Traceability reconciliation:

- `VEN-016` → **accepted/evidenced** by WP-2.7.
- `ACC-030` → **accepted/evidenced** by application read-model tests plus the dedicated persisted acceptance scenario `3501a6056361dfa792743bf928464520f2538499` / `34373382884` — **5/5 SUCCESS**.
- The Lot-2 data/access foundation mapped to `FTR-008` and downstream `FTR-080` / `FTR-081` is accepted for this packet only. Map rendering/routing-provider/UI capability remains downstream (not globally accepted) in Lot 9 / WP-2.11 as mapped.
- Local/offline Venue persistence remains WP-2.10 / WP-2.12; canonical import/restore implementation remains Lot 4; none is falsely claimed by WP-2.7.
- Required WP-2.7 responsibilities minus accepted/evidenced WP-2.7 responsibilities: **∅**.
- Open BLOCKING/MAJOR findings: **∅**.

Pass-C decision: **PASS — WP-2.7 ACCEPTED**.

## Execution gates

1. Physical-origin snapshot freeze `4baa335b5f964ee13e806cd9a5170f28ff179835` / `34336841778` and canonical historical-snapshot portability repair `05f9695d5e437a69dfd0cf5b839ad00bdc7afc38` / `34343241298` are **5/5 SUCCESS**.
2. READY-transition head `bb93ad517130c2c0d6ce8f4ac7dec812e3e0d135` / `34344326696` is **5/5 SUCCESS**.
3. Pass A implementation head `004aec0ee30e5f228c55ecd6fe7fae8d5ba98794` / `34364195509` is **5/5 SUCCESS**; Pass A is complete and verified.
4. REVIEW_PENDING transition head `5f98e877275a9f4149f5e522e426b7f4347a9e9e` / `34366885380` is **5/5 SUCCESS**.
5. Pass-B finding `WP2.7-B-001` is resolved/verified on `cc85c0167e40eb2250d9143b6f4ded28d94118d6` / `34369744964`; final fresh reviewed head `c1cb06bf6fdd4b33bc966f985f668938a7edf158` / `34370566573` is **5/5 SUCCESS**; open BLOCKING/MAJOR findings **∅**.
6. ACCEPTANCE_PENDING / Pass-C entry `30807e355f85b5146ceba449a0115542e393b69d` / `34372335839` is **5/5 SUCCESS**.
7. Dedicated persisted ACC-030 acceptance evidence `3501a6056361dfa792743bf928464520f2538499` / `34373382884` is **5/5 SUCCESS**.
8. Pass C responsibility gap is **∅**; packet decision is **ACCEPTED**.
9. WP-2.8 remains prohibited until this acceptance commit and final Lot-2 acceptance-governance reconciliation are exact-head green.

## Handoff

- Current state: `ACCEPTED`
- Current/next pass: `COMPLETE`
- Previous packet: WP-2.6D — **ACCEPTED / COMPLETE**, final acceptance-governance closure `767017112445a38863abd114e8c62feb27af6421` / `34322712448` — **5/5 SUCCESS**.
- Specification gates: physical-origin snapshot freeze `4baa335b5f964ee13e806cd9a5170f28ff179835` / `34336841778`; canonical portability repair `05f9695d5e437a69dfd0cf5b839ad00bdc7afc38` / `34343241298`; both **5/5 SUCCESS**.
- READY transition: `bb93ad517130c2c0d6ce8f4ac7dec812e3e0d135` / `34344326696` — **5/5 SUCCESS**.
- Red-first Pass-A boundary: `a9b8909d2225e54da9e9dc1fddd57ec9aa3463b5` / `34347040335` — expected FAILURE before persistence/append existed.
- Final Pass-A implementation: `004aec0ee30e5f228c55ecd6fe7fae8d5ba98794` / `34364195509` — **5/5 SUCCESS**.
- REVIEW_PENDING transition: `5f98e877275a9f4149f5e522e426b7f4347a9e9e` / `34366885380` — **5/5 SUCCESS**.
- Pass-B red-first finding: `WP2.7-B-001` on `1fa53b8f9864ec4ab2f3999073bb0a99f95773a5` / `34369198622` — expected FAILURE.
- Pass-B remediation: `cc85c0167e40eb2250d9143b6f4ded28d94118d6` / `34369744964` — **5/5 SUCCESS**.
- Final fresh Pass-B reviewed head: `c1cb06bf6fdd4b33bc966f985f668938a7edf158` / `34370566573` — **5/5 SUCCESS**.
- Pass-C entry: `30807e355f85b5146ceba449a0115542e393b69d` / `34372335839` — **5/5 SUCCESS**.
- Persisted ACC-030 acceptance evidence: `3501a6056361dfa792743bf928464520f2538499` / `34373382884` — **5/5 SUCCESS**.
- Open BLOCKING/MAJOR findings after Pass B and Pass C: `∅`.
- Required WP-2.7 responsibilities minus accepted/evidenced responsibilities: `∅`.
- Next permitted action: verify this packet-acceptance HEAD 5/5; then reconcile the Lot-2 coverage matrix and implementation-status cursor. WP-2.8 remains prohibited until final acceptance-governance closure is green.
