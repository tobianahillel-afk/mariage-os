# Work Packet Record — WP-1.5

## Identity

- Work Packet ID: `WP-1.5`
- Lot: `1`
- Name: Project configuration, dates, origins, preferences and RSVP-intent data hooks
- State: `IN_PROGRESS`
- Current pass: `A-REPAIR`
- Primary bounded context: project setup/configuration persistence
- Branch/PR: `lot-1/identity-project-foundation`

## Scope

### Primary Feature IDs

- FTR-006 — project settings locale/timezone/currency.
- FTR-007 — candidate wedding dates and atomic selected date.
- FTR-008 — reference origins, Lot-1 persistence foundation.
- FTR-012 — personal cross-device UI preferences, Lot-1 persistence foundation.
- FTR-119 — Invitations & RSVP onboarding/settings intent hooks only.

### Current-lot responsibilities covered

- protected editable project basics with server-controlled audit/revision fields;
- canonical locale, IANA timezone, three-letter currency and target guest count on `projects`;
- structured project-scoped `wedding_date_options` with candidate/selected/rejected/archived lifecycle and zero-or-one selected invariant;
- atomic selected-date command serialized on the project row;
- structured `project_reference_origins` with optional address/coordinate pair, ordering and zero-or-one default;
- author-only `user_project_preferences` with live membership checks and server revision;
- provider-neutral `project_rsvp_intent_settings` for onboarding intent only;
- explicit grants/RLS plus cross-project/role/revocation/author negative evidence.

### Normative references

- FTR-006, FTR-007, FTR-008, FTR-012, FTR-119 applicable Lot-1 responsibilities.
- AUTHZ-001/002/004/005/006/007/008/009/012/018/019/020 as applicable.
- `PHYSICAL-SCHEMA-V1.md`, `PHYSICAL-SCHEMA-AUTHORIZATION-ADDENDUM.md`.
- `DATES-TIME.md`, `STATE-MACHINES.md`, `ROLE-PERMISSION-MATRIX.md`, `AUTH-ONBOARDING.md`.
- Guest communications requirements/addendum/blueprints.

### Explicit FTR-119 refinement

The Lot-1 RSVP row is only an onboarding/settings intent snapshot. It may contain RSVP method, optional deadline, question toggles, planned channels, contact-data readiness and deferred/configure-now intent. It may not contain guest/household data, public capability tokens, provider credentials, templates, sends or webhook state.

### Explicitly out of scope

- guest/household/contact-point domain;
- guest invitation capabilities and RSVP submissions;
- outbound provider configuration/credentials/templates/campaigns/webhooks/sends;
- public `/rsvp/:token` shell — WP-1.6;
- venue route/map observations — Lot 9;
- local cache/sync primitives — WP-1.7;
- venue/budget/milestone dependency recalculation after selected-date changes — later owning lots;
- Lot 2+ wedding-domain implementation or real wedding/customer data.

## Dependencies

WP-1.1 through WP-1.4 are **ACCEPTED**. WP-1.6 remains forbidden until this packet is accepted.

## Security and data invariants

1. `projects` remains the single truth for project settings; selected wedding date is derived from `wedding_date_options`.
2. Generic browser mutation cannot alter project/system audit fields.
3. `project.settings.update` remains owner-only.
4. Wedding dates are civil `date` values and exactly zero or one may be selected.
5. Selection is a serialized protected transition.
6. Rejected/archived rows preserve historical civil date until explicitly reactivated to candidate.
7. Cross-project IDs fail closed.
8. Reference origins preserve coordinate-pair validity and at most one default.
9. Origin reads/writes preserve `access.read` / `access.write` role semantics.
10. Personal preferences are readable/writable only by `auth.uid()` with active same-project membership.
11. Preference revision is server-controlled.
12. RSVP intent is private project configuration and never anonymous guest state.
13. RSVP intent is provider-neutral and secret-free.
14. Revoked membership takes effect through live server-side authorization.
15. Every table/RPC has explicit client grant/RLS evidence.
16. Every privileged configuration RPC locks the project before evaluating live permission.

## Implementation

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

Pass-A hardening before first review:

- IANA timezone and null/currency validation tightened;
- coordinates must be both absent or both present and range-valid;
- selected date cannot have civil date/status rewritten through generic editing;
- only a candidate can enter `selected`;
- automatic-channel setup intent is consistent with planned automatic channels, at RPC and table-constraint levels;
- required RSVP selector values use controlled validation;
- anonymous/authenticated grants and project-lock-before-live-permission are directly tested.

## First Pass A — IMPLEMENT

**COMPLETE.**

Evidence before first adversarial review:

- HEAD: `d7f019878c0827e4357e59278a342d5033bca2cb`.
- CI run: `33863817975`.
- all five jobs SUCCESS including clean-checkout `npm run verify`.
- DB: **12 files / 232 tests / PASS**.

## First Pass B — ADVERSARIAL REVIEW

**REVIEW_FAILED.**

Review matrix challenged exact role grants, anon/outsider/revoked/cross-project access, authorization order, date lifecycle/concurrency/history, origin default concurrency, preference authorship, RSVP scope/secret absence/semantic consistency, audit protection and Lot scope.

Finding:

- `WP15-AR-001` — **MAJOR**: a row already `rejected` or `archived` could change its civil `event_date` through generic update, contrary to the frozen lifecycle requirement that rejected/archive states preserve date history.

## Repair A — current cycle

**IMPLEMENTED / AWAITING EXACT-HEAD VERIFICATION.**

Repair:

- `20260904105000_preserve_wedding_date_history.sql` prevents civil-date mutation while current status is `selected`, `rejected` or `archived`;
- rejected/archived rows remain reversible by returning to `candidate` with the same historical date;
- once explicitly reactivated to candidate, a later edit may change the civil date normally;
- `project_configuration_history_test.sql` adds six direct assertions covering rejected and archived preservation plus reversible reactivation.

A fresh exact-head CI must pass before `WP15-AR-001` can be closed. After that, a fresh independent Pass B is mandatory; the prior review cannot be reused.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Requires a clean fresh Pass B after repair, then responsibility-by-responsibility contract → implementation → exact-head runtime reconciliation.

## Handoff

- Current state: `IN_PROGRESS`.
- Current pass: `A-REPAIR`.
- Accepted dependencies: WP-1.1..WP-1.4.
- `WP15-AR-001`: repair implemented, closure pending exact-head verification and fresh Pass B.
- Next permitted action: verify repair, conduct fresh Pass B, then Pass C only if clean.
- WP-1.6+: forbidden until WP-1.5 acceptance.
