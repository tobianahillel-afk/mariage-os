# Work Packet Record — WP-1.5

## Identity

- Work Packet ID: `WP-1.5`
- Lot: `1`
- Name: Project configuration, dates, origins, preferences and RSVP-intent data hooks
- State: `ACCEPTED`
- Current pass: `C-ACCEPTANCE-COMPLETE`
- Primary bounded context: project setup/configuration persistence
- Branch/PR: `lot-1/identity-project-foundation`

## Scope

Primary Feature IDs:

- FTR-006 — project settings locale/timezone/currency.
- FTR-007 — candidate wedding dates and atomic selected date.
- FTR-008 — reference origins, Lot-1 persistence foundation.
- FTR-012 — personal cross-device UI preferences, Lot-1 persistence foundation.
- FTR-119 — Invitations & RSVP onboarding/settings intent hooks only.

Explicitly out of scope and not implemented here: guest/household/contact-point domain, guest invitation capability links/RSVP submissions, outbound communication-provider configuration/credentials/templates/campaigns/webhooks/sends, public `/rsvp/:token` shell, local cache/sync, venue route/map observations, downstream selected-date recalculation and all Lot-2+ wedding-domain implementation.

## Normative references reconciled

- `PHYSICAL-SCHEMA-V1.md` and authorization addendum.
- `DATES-TIME.md`.
- `STATE-MACHINES.md`.
- `ROLE-PERMISSION-MATRIX.md`.
- `AUTHORIZATION-REQUIREMENTS.md`.
- `features/AUTH-ONBOARDING.md`.
- Guest communications requirements/addendum/blueprints.

## Accepted implementation

Migrations:

- `20260904101000_create_project_configuration.sql`
- `20260904101500_harden_project_configuration_validation.sql`
- `20260904104000_harden_project_configuration_transitions.sql`
- `20260904104500_enforce_rsvp_intent_consistency.sql`
- `20260904105000_preserve_wedding_date_history.sql`

Resources:

- `wedding_date_options`
- `project_reference_origins`
- `user_project_preferences`
- `project_rsvp_intent_settings`

Protected commands:

- `update_project_settings`
- `create_wedding_date_option`
- `update_wedding_date_option`
- `select_wedding_date_option`
- `save_project_reference_origin`
- `delete_project_reference_origin`
- `upsert_user_project_preferences`
- `upsert_project_rsvp_intent_settings`

Accepted security/data invariants:

1. `projects` is the single truth for project settings; selected wedding date is derived from date options.
2. Project audit/system fields remain server-controlled; `project.settings.update` remains owner-only.
3. Wedding dates are civil `date` values with zero-or-one selected option and serialized atomic selection.
4. Selected/rejected/archived date history cannot have its civil date silently rewritten; rejected/archived remain explicitly reversible through candidate.
5. Cross-project IDs/references fail closed.
6. Reference origins require a valid coordinate pair when coordinates are present and have at most one project default.
7. Origins use `access.read` / `access.write`, preserving owner/editor/viewer semantics.
8. Personal preferences are author-only for `auth.uid()` with active same-project membership and server-controlled revision.
9. RSVP intent remains private, provider-neutral, secret-free onboarding/settings configuration only.
10. Revocation is evaluated live server-side.
11. Every configuration RPC locks its project before live permission evaluation.
12. Browser roles have only the explicitly accepted table/column/RPC grant surface; all SECURITY DEFINER commands use `search_path=pg_catalog`.

## Pass A — IMPLEMENT

Initial exact-head gate:

- HEAD `d7f019878c0827e4357e59278a342d5033bca2cb`
- run `33863817975`
- five jobs SUCCESS
- DB 12 files / 232 tests / PASS

## Pass B — adversarial review history

### First review — REVIEW_FAILED

`WP15-AR-001` — **MAJOR**: rejected/archived date rows could rewrite historical `event_date`.

Repair added `20260904105000_preserve_wedding_date_history.sql` and six direct lifecycle assertions.

Repair evidence:

- HEAD `63506b9aa240ec47a04a1eb32450b209329ccaaa`
- run `33864486707`
- five jobs SUCCESS
- DB 13 files / 238 tests / PASS

`WP15-AR-001`: **CLOSED**.

### Second review — REVIEW_FAILED

`WP15-AR-002` — **MAJOR / evidence completeness**: direct grant evidence did not exhaustively enumerate every PostgreSQL client table privilege and possible column-grant bypass for the four new tables.

Repair strengthened `project_configuration_grants_test.sql` to prove:

- all four tables × `anon`/`authenticated` × table privileges `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER`;
- all columns × both client roles × column privileges `SELECT`, `INSERT`, `UPDATE`, `REFERENCES`;
- only authenticated read access is granted;
- all eight RPCs remain authenticated-only;
- all eight SECURITY DEFINER RPCs retain trusted `pg_catalog` search path.

No production grant/RLS permission was broadened.

Repair exact-head evidence:

- HEAD `15e477a9ca75efbc98594000c190180e24226229`
- CI run `33866160626`
- Core quality/security: SUCCESS
- Local Supabase DB/RLS: SUCCESS
- Browser/mutation: SUCCESS
- Privacy-safe preview: SUCCESS
- Full verify from clean checkout: SUCCESS
- DB: **13 files / 239 tests / PASS**

`WP15-AR-002`: **CLOSED**.

### Third fresh Pass B — PASS

The complete packet was re-reviewed after the second repair, not merely the patched test. No open BLOCKING/MAJOR finding remains.

Re-reviewed attack matrix included:

- owner/editor/viewer, anon, outsider, revoked and multi-project behavior;
- cross-project UUID/reference denial;
- project-lock-before-live-permission ordering;
- date selection uniqueness, transition/history and concurrency structure;
- one-default-origin uniqueness and role semantics;
- preference authorship/revision and no owner impersonation;
- RSVP intent scope, validation, semantic consistency and secret absence;
- table/column/RPC grants and hardened SECURITY DEFINER search paths;
- audit/system-column protection;
- diff-based scope review showing no guest/provider/public-route/cache-sync/Lot-2+ implementation.

## Pass C — ACCEPTANCE / RECONCILIATION

**PASS / COMPLETE.**

| Responsibility | Normative contract | Accepted implementation | Objective evidence |
|---|---|---|---|
| FTR-006 project settings | project single truth; locale/IANA timezone/currency/guest target; protected system fields | `projects` + `update_project_settings` validation/audit revision | owner success; editor/viewer/outsider/revoked denial; timezone/currency/guest-count negatives; grant/RPC tests |
| FTR-007 wedding dates | civil dates; zero/one selected; atomic selection; preserved history | `wedding_date_options`, partial UNIQUE indexes, protected create/update/select, transition/history hardening | base configuration, transition, history and concurrency-contract tests |
| FTR-008 origins | structured project origins; optional address/coordinate pair; at most one default | `project_reference_origins`, coordinate checks, protected save/delete, `access.*` permission mapping | owner/editor/default replacement, viewer read/no-write, outsider/revoked/cross-project/invalid-coordinate tests |
| FTR-012 preferences | member-personal, project-scoped, cross-device foundation, author-only | `(project_id,user_id)` row, self RLS/upsert, server revision | own read/write; other-owner isolation; multi-project partition; outsider/revoked denial; revision increment |
| FTR-119 Lot-1 intent hooks | skippable provider-neutral RSVP/onboarding intent; no external send/provider secret | `project_rsvp_intent_settings` + protected owner upsert + structural consistency CHECK | owner write/viewer read/editor deny; outsider/revoked denial; selector/consistency negatives; no secret/token/provider-key schema fields |
| AUTHZ cross-cutting | active membership, permissions, RLS+grants, fail-closed cross-project/revocation | project-scoped RLS and protected serialized RPCs | projects A/B/C role matrix; exhaustive table+column grants; RPC execute/search-path tests; lock-order contract tests |
| Scope boundary | no guest/provider/public shell/cache-sync/Lot-2+ implementation | DB persistence slice only | compare from accepted WP-1.4 head `bf0046...` to accepted code head shows only WP-1.5 migrations/tests plus governance docs |

Contract → implementation → objective evidence is present for every WP-1.5 responsibility. Required packet responsibilities minus accepted/evidenced responsibilities: **∅**.

## Acceptance

**WP-1.5 is ACCEPTED.**

Acceptance evidence is run `33866160626` on exact implementation HEAD `15e477a9ca75efbc98594000c190180e24226229`, with all five CI jobs successful and the fresh database suite at 239/239 PASS.

Closed findings: `WP15-AR-001`, `WP15-AR-002`.

WP-1.6 may now open. WP-1.7+ and Lot 2+ remain forbidden until their normal sequencing gates permit them.
