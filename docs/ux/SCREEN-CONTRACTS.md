# Route and Screen Contracts

Status: **FROZEN V1 navigation/screen reference — implementation gate still CLOSED pending final review**

Exact router syntax may refine implementation details, but deep-link semantics, privacy, required screens/actions and screen states remain binding.

## Authenticated/global shell

After valid project context is established, shell provides:

- project identity;
- screen title/breadcrumb;
- global sync/session state;
- navigation;
- global Search;
- global quick-add/Inbox capture;
- profile/settings.

Desktop uses side navigation; mobile bottom navigation + More.

Private project content must not render for a fresh signed-out/unknown identity before authorized local/project context is established. **Session expiry during an already-established offline/local session is different from explicit logout**: locally cached context may remain visible according to Offline/Auth policy, clearly marked locked/offline and unable to sync until reauthentication. Explicit logout follows pending-work-safe purge and must not leave project content visible to the next signed-out/new user.

---

# Authentication / onboarding

## `/login`

Actions: supported sign-in/recovery flow. States: idle/submitting/invalid/unverified/MFA/backend unavailable/already authenticated.

No fresh unauthenticated user sees project existence/data.

## `/onboarding`

Controlled, not public SaaS creation.

States/actions:

- first-owner bootstrap only when deployment bootstrap is open/no project initialized;
- project basics/date candidates/reference origins/criteria;
- one-time partner invitation generation;
- invitation acceptance status;
- MFA/recovery setup;
- security/setup checklist.

No arbitrary “create another wedding project” in normal production.

## `/invite/:token`

No project data before authenticated identity/token validation. Handles wrong account, expired/revoked/already-used state generically. Raw token must not be logged. After successful acceptance, router should remove bearer token from normal browser-visible URL/history state where technically feasible without breaking flow.

## `/`

Authorized active member → last safe route or Dashboard; otherwise Login/Onboarding/Invite state.

---

# Dashboard

## `/dashboard`

Priority: countdown/phase, next action, blockers, joint decisions, external waiting, deadlines/payments, budget/scenario, weighted progress, meaningful partner changes, actionable sync/backup/security state.

New project shows setup/import/add-first-data guidance instead of fake warnings.

---

# Search / Inbox

## `/search` or global search overlay

Searches authorized bounded project domains per `features/GLOBAL-SEARCH.md`. Offline clearly reports cached-only scope. Query/private result data is not serialized into public/external URL unnecessarily.

## `/inbox`

Views: unprocessed, converted, archived/discarded/recoverable according to retention policy.

Actions: capture text/URL/file hint, convert with duplicate/context review, archive/discard/restore, open converted target. Conversion retry is idempotent.

---

# Venues

## `/venues`

Gallery/Table/Compare selection. Add/import/filter/sort/personal view preferences/compare/open. Filters include status/region/favorite/blocking compatibility/quote/visit where data exists.

## `/venues/:venueId`

Header: identity/location/status, partner rating/favorite summary, sync/conflict.

Summary: blocking result, weighted score/completeness/evidence readiness, scenario/cost, missing critical data, quote/availability, strengths/reservations, next action.

Sections:

- Summary
- Photos
- Spaces
- Prices & dates
- Included/extras
- Catering
- Access
- Technical/weather
- Quotes/contacts
- Documents
- Sources/evidence
- History

Actions: edit/status/reject/restore, personal rating/favorite, task/decision, add source/photo/document/offer, compare, visit.

## `/venues/:venueId/visit`

Mobile-first offline-capable visit for questions, facts/measurements, notes, local media, personal rating and summary.

## `/venues/compare`

2–5 practical candidates. Blocking status before weighted score; objective facts/cost/access/evidence readiness separated from personal ratings. Differences-only and source/detail drill-down.

---

# Map

## `/map`

Filter/select pins; open venue/external route. Provider failure shows list/location fallback. Core record access never depends on map availability.

---

# Vendors

## `/vendors`

List/cards, type/status filters, add/import/open.

## `/vendors/:vendorId`

Contacts/interactions, quotes/offers/tax/packages, facts/evidence, personal opinions where enabled, venue compatibility, follow-up, budget/documents/tasks.

---

# Guests / households / seating

## `/guests`

Guest/household table, category/priority/RSVP filters, expected/confirmed/cumulative stats. Add/import/bulk safe update/export.

Guest PII is not placed in public URLs unnecessarily.

## `/guests/:guestId`

Edit identity/category/priority/probability/RSVP/household relationship/useful logistics and open seating assignment.

## `/households/:householdId`

Invitation/address context and members; safe add/reassign/remove.

## `/seating`

Structured non-visual V1 workspace:

- by section/table;
- unassigned;
- warnings/readiness;
- alphabetical guest→table.

Actions: create section/table, capacity, assign/move/unassign, import/export where supported, validate/finalize print data.

Readiness cannot PASS with duplicate active assignment, over-capacity or configured required attending guest unassigned. No pointer/drag-only interaction is required.

---

# Tasks

## `/tasks`

Mine / Partner / Together / Waiting / Blocked / Completed. Add/update/assign/take/follow-up/open related entity.

## `/tasks/:taskId`

Owner/status/priority/due/follow-up/dependencies/links/history.

---

# Decisions

## `/decisions`

Needs my input / needs both / discuss together / finalized-history.

## `/decisions/:decisionId`

Question/options/evidence/partner approvals/deadline/final rationale/history. Finalize/lock/reopen respects online/current-state rules.

---

# Budget

## `/budget`

Summary: active-scenario expected total, contracted, confirmed/pending paid context, refundable exposure, due/overdue, upcoming cash flow.

Views: items/categories, scenarios, payments, cash flow.

Actions: add item/payment, create/switch scenario through protected flow, link offer/entity, export.

## `/budget/scenarios/:scenarioId`

Date/venue/guest/package/component assumptions, overrides and exact derived explanation. Activate is explicit/atomic.

## `/budget/items/:itemId`

Amounts by state, formula, linked scenario/offer/entity, payments/documents/history. Derived totals are not editable source truth.

---

# Planning / event timeline

## `/planning`

Phase, milestones/dependencies, preparation deadlines, weighted progress and linked task/payment/decision context.

## `/timeline`

Wedding-event schedule per `features/EVENT-TIMELINE.md`:

- chronological live timeline;
- draft/confirmed/cancelled;
- add/edit timed item and day offset;
- venue/space/vendor/contact/responsibility links;
- dependency/conflict warnings;
- vendor-filtered view;
- print/export/frozen snapshot.

After-midnight offsets sort/validate correctly. Frozen export history remains independent from later live edits.

---

# Documents/media/contract review

## `/documents`

Filters by type/entity/vendor/venue/classification/review state/recent. Upload/link/open/download/trash/provenance. Active untrusted content never executed.

Shows current/superseded document versions and review status where relevant.

## `/documents/:documentId`

Document detail:

- title/original filename/type/classification/date;
- linked venue/vendor/offer/budget/decision/source entities;
- current/superseded/superseding version relationships;
- upload/storage/integrity metadata appropriate to user;
- provenance/source;
- review status;
- safe open/download;
- history/trash actions.

For quote/contract types, includes **Contract Readiness** subsection defined by `features/CONTRACT-READINESS.md`:

- factual checklist items;
- confirmed/not found/contradictory/needs-human-review states;
- linked facts/sources/tasks;
- open critical items;
- clear statement that readiness is planning review, not legal advice/certification.

New superseding version starts its own version-specific review state.

Media galleries are primarily entity-local; global browsing can live within Documents/Resources without separate authoritative truth.

---

# Import / export / restore

## `/import`

Wizard:

1. choose/paste/drop;
2. detect;
3. map/profile;
4. normalize/validate;
5. duplicates/conflicts;
6. preview;
7. online commit/revalidate stale preview;
8. report/rollback link.

Before commit explicitly states canonical project unchanged.

## `/imports/:importId`

Source/hash/schema/actor/mapping, counts/exact changes, rollback eligibility/state.

## `/export`

Module CSV/XLSX/JSON, missing/stale research, plain/encrypted `.mariage`, complete archive, allowed print/share profiles.

## `/restore`

Inspect/verify backup, decrypt locally if encrypted, compatibility/migration report, controlled target/restore workflow. Wrong password/tamper/future unsupported schema fails before canonical mutation.

When offline cache is incomplete, do not offer it as a verified full authoritative project backup.

---

# Settings / diagnostics

## `/settings`
Index.

## `/settings/project`
Display, candidate/selected dates, timezone/locale/currency, guest/budget preferences.

## `/settings/members`
Owners/invite/security setup. Controlled membership changes only.

## `/settings/criteria`
Definitions, priorities/weights/evaluation rules/freshness.

## `/settings/locations`
Reference origins/default origin.

## `/settings/offline-storage`
Cache/pins/pending/conflicts/local/cloud quota information.

## `/settings/backup`
Backup age/export/verify/restore.

## `/settings/security`
MFA/session/logout/recovery.

## `/settings/diagnostics`
App/cloud/local schema versions, sync/integrity and sanitized diagnostics.

## `/settings/danger`
Archive/trash/purge/permanent project destruction with proportional/strong-auth safeguards.

---

# Global dialogs/sheets

- Quick Add / Inbox capture
- Search
- Source/evidence detail
- Fact retained-value conflict
- Sync conflict
- Add photo/document
- reject/delete/undo
- link entity
- import mapping/duplicate/conflict resolution
- date/scenario protected-transition confirmation
- seating assignment warning/resolution
- timeline conflict/dependency warning
- contract readiness item/follow-up
- reauthentication
- backup password/export/restore verification

Keyboard/focus and mobile sheet behavior mandatory.

---

# Session/route protection semantics

### Fresh signed-out / explicit logout / unknown identity

- never render project private content;
- protected routes go to auth;
- explicit logout clears visible project context immediately and then applies safe local purge workflow.

### Existing local session whose cloud token expires/offline

- app may retain/display previously authorized cached content according to local privacy policy;
- clearly show session-expired/offline/locked synchronization state;
- do not fetch/sync protected cloud data until reauthenticated and membership revalidated;
- pending work remains recoverable.

### Revoked member

- future cloud access denied;
- reconnect cannot sync pending changes without restored authorization;
- device-local remnants do not grant cloud rights and are handled by local purge/recovery policy.

### Other route safety

- unauthorized project/entity ID returns generic permission/not-found behavior without existence leak;
- project/user context clears before other account data can render;
- route transitions obey autosave/draft rules;
- external navigation preserves pending local work;
- Back/Forward restores logical filter/view where feasible.

---

# Universal screen-state matrix

Each primary route implements applicable:

1. initial loading;
2. cached + refresh;
3. synchronized;
4. empty;
5. incomplete/partial;
6. offline;
7. pending sync;
8. conflict;
9. retryable backend error;
10. permanent validation error;
11. permission denied/not-found without leak;
12. unsupported capability fallback;
13. mobile narrow/touch state;
14. desktop keyboard/focus state;
15. session-expired/reauth state;
16. stale/needs-review state when domain data can be outdated.

A screen with only the happy path is incomplete.
