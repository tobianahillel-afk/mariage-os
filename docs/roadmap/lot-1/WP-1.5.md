# Work Packet Record — WP-1.5

## Identity

- Work Packet ID: `WP-1.5`
- Lot: `1`
- Name: Project configuration, dates, origins, preferences and RSVP-intent data hooks
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
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

- protected updates for editable project basics without exposing audit/revision/system fields to generic browser mutation;
- canonical project locale, IANA timezone string, ISO-style currency and target guest-count persistence;
- structured `wedding_date_options` with candidate/selected/rejected/archived lifecycle, project-scoped civil dates and zero-or-one selected invariant;
- atomic selected-date transition that demotes a previous selection in the same transaction;
- structured `project_reference_origins` with optional address/coordinates, sort order and zero-or-one default origin per project;
- member-personal `user_project_preferences` with author-only cloud visibility/write semantics and server-controlled revision;
- provider-neutral Invitations & RSVP intent/settings persistence for onboarding: intended RSVP method, optional deadline, desired question toggles, intended channels and contact-data readiness;
- explicit project/member RLS/grants and direct cross-project/role/author negative evidence for every new resource/RPC.

### Requirements / Acceptance / Security IDs

- FTR-006, FTR-007, FTR-008, FTR-012 and FTR-119 applicable Lot-1 responsibilities.
- `AUTHZ-001`, `AUTHZ-002`, `AUTHZ-004`, `AUTHZ-005`, `AUTHZ-006`, `AUTHZ-007`, `AUTHZ-008`, `AUTHZ-009`, `AUTHZ-012`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020` as applicable.
- `PHYSICAL-SCHEMA-V1.md`, `PHYSICAL-SCHEMA-AUTHORIZATION-ADDENDUM.md`, `DATES-TIME.md`, `ROLE-PERMISSION-MATRIX.md`, `AUTH-ONBOARDING.md`, `PRODUCT-SPECIFICATION-GUEST-COMMUNICATIONS-ADDENDUM.md`, `GUEST-COMMUNICATIONS-BLUEPRINTS.md`.

### Explicit physical refinement for FTR-119

The frozen guest-communications addendum defines later Lot-6 RSVP/question/channel entities but intentionally does not prescribe one physical table for the Lot-1 onboarding intent snapshot. WP-1.5 may introduce one narrowly scoped project-owned intent/settings row so the required onboarding choices persist without creating guest, household, campaign, provider-secret or public-capability data early.

The row must remain provider-neutral and may contain only planning intent/configuration such as:

- RSVP method: Mariage OS link / manual / later;
- optional RSVP deadline;
- expected guest-question booleans;
- planned communication-channel booleans including manual link/QR;
- contact-data readiness;
- server audit/revision fields.

No provider API key/access token/webhook secret/provider send state belongs in this packet.

### Explicitly out of scope

- guest/household/contact-point records;
- guest invitation capability links, RSVP submissions and public guest DTOs;
- reusable RSVP question-profile domain implementation;
- communication channel provider configuration, credentials, templates, campaigns, recipients, webhooks or sends;
- provider setup task/checklist implementation beyond persisting defer/manual intent (task engine is Lot 3);
- public `/rsvp/:token` shell — WP-1.6 boundary only;
- venue access route observations/map UI — Lot 9;
- local cache/sync primitives — WP-1.7;
- dependent venue/budget/milestone recalculation after selected-date change — later owning lots;
- Lot 2+ wedding-domain implementation or real wedding/customer data.

## Dependency / sequencing

- Required prior packets: WP-1.1 through WP-1.4 **ACCEPTED**.
- WP-1.2 supplies projects/membership/RLS helper.
- WP-1.3 supplies verified identity/session semantics.
- WP-1.4 supplies the accepted collaboration membership lifecycle used by authorization tests.
- WP-1.6 consumes the resulting project/onboarding configuration in protected/public shell UX.
- WP-1.7 later supplies local partition/cache behavior for personal preferences.

## Sizing review

Planning complexity: **9/10**.

Cohesion rationale: these records form the complete project-setup persistence slice used during onboarding and Settings. They share the same project authorization boundary, revision/audit semantics and cross-project integrity model; splitting them would leave onboarding choices partially durable and make later route/cache work invent temporary storage.

## Security / data invariants to preserve

1. `projects` remains the single truth for locale/timezone/currency/guest target; selected wedding date is never duplicated there.
2. Generic client mutation cannot change project audit actor/revision/project identity or status as a side effect of settings editing.
3. `project.settings.update` remains owner-only under the frozen permission matrix.
4. Wedding dates are project-owned civil `date` values; exactly zero or one non-archived option can be selected.
5. Selecting a date is one protected transaction and cannot leave two selected rows.
6. Date-option IDs and all project-owned references cannot be used across projects.
7. Reference origins are project-owned; coordinates are range-validated; exactly zero or one active/default origin exists per project.
8. Reference-origin reads/writes use `access.read` / `access.write` and therefore preserve owner/editor/viewer semantics.
9. Personal preferences are visible/writable only for `auth.uid()` with active membership in that same project; owner status does not permit impersonating another member's personal preferences.
10. Personal preference revision is server-controlled and increments atomically on accepted update.
11. RSVP intent/settings is private project configuration, never anonymous guest-readable state.
12. RSVP intent/settings remains provider-neutral and contains no reusable credential/token/secret.
13. Revoked membership takes effect immediately because every protected read/write evaluates live membership/permission server-side.
14. All new tables/RPCs declare explicit grants/RLS and direct allow/deny tests.

## Planned Pass-A evidence

Direct DB/RLS matrix will include at least:

- owner can update allowed project settings; editor/viewer/outsider/revoked member cannot;
- audit/revision fields remain server-controlled;
- malformed locale/currency/guest-count inputs fail safely where constrained;
- owner can add candidate dates and select one atomically;
- second selection demotes the previous option;
- duplicate active civil date and cross-project selection are denied;
- archived/rejected semantics cannot accidentally create a second selected truth;
- owner/editor can manage origins according to `access.write`, viewer can read but not write, outsider/revoked cannot read/write;
- second default origin atomically replaces or is otherwise prevented from coexisting with the prior default;
- invalid latitude/longitude and cross-project operations fail;
- each active member can read/write only their own preference row, including a multi-project user without partition bleed;
- another owner/editor cannot impersonate the preference author;
- preference revision increments server-side;
- RSVP intent row is member-readable only where authorized, owner-writable via project settings authority, and absent from anonymous/outsider access;
- RSVP method/channel/contact-readiness constraints reject unsupported values and no provider secret column exists;
- projects A/B/C, owner/editor/viewer, multi-project user, outsider and revoked-member fixtures remain exercised.

Pass A also requires exact-head success for Core, DB/RLS, Browser/mutation, privacy-safe preview and clean-checkout `npm run verify` before Pass B begins.

## Pass A — IMPLEMENT

**IN_PROGRESS.**

No WP-1.5 production migration is accepted yet.

## Pass B — ADVERSARIAL REVIEW

Not started. Must independently challenge authorization/grants, selected-date atomicity/concurrency, one-default-origin concurrency, preference authorship/revision, RSVP-intent scope leakage, cross-project references and audit/system-column protection after Pass A is green.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Requires clean Pass B plus responsibility-by-responsibility contract/implementation/runtime reconciliation.

## Handoff

- Current state: `IN_PROGRESS`
- Current/next pass: `A-IMPLEMENT`
- Accepted dependencies: WP-1.1, WP-1.2, WP-1.3, WP-1.4.
- Open BLOCKING/MAJOR findings: none at kickoff.
- Next permitted action: implement WP-1.5 only against this bounded contract.
