# Route and Screen Contracts

Status: **Normative V1 navigation/screen reference — freeze candidate**

Exact router syntax may refine implementation details, but deep-link semantics, privacy and required screens/actions remain.

## Authenticated global shell

Always provides:

- project identity;
- screen title/breadcrumb context;
- global sync state;
- navigation;
- global Search entry;
- global quick-add / Inbox capture `+`;
- profile/settings access.

Desktop uses side navigation; mobile uses bottom navigation + `More`. Private content is never rendered before auth + membership resolution.

---

# Authentication / onboarding

## `/login`

Actions: email/password sign-in, recovery. States: idle/submitting/invalid/unverified/MFA/backend unavailable/already authenticated.

## `/onboarding`

Controlled, not public SaaS creation.

States/actions:

- first-owner bootstrap only when deployment bootstrap is open and no project exists;
- project basics/date candidates/reference origins/criteria;
- generate one-time partner invite link;
- partner invitation acceptance;
- MFA/recovery setup;
- close bootstrap/setup checklist.

No arbitrary “create another wedding project” in normal production.

## `/invite/:token`

Token-bearing route displays no project data until authenticated identity/token validation. Handles wrong account, expired/revoked/already-used state generically.

## `/`

Authenticated active member → last safe route or `/dashboard`; otherwise auth/onboarding state.

---

# Dashboard

## `/dashboard`

Shows in priority order: countdown/phase, next action, blockers, joint decisions, external waiting, deadlines/payments, budget, progress, meaningful partner changes.

Empty project shows security/setup/import/add-first-data guidance.

States include cached/offline/stale/partial/sync error.

---

# Global Search / Inbox

## `/search` or global command overlay

Searches project-scoped venues/vendors/guests/tasks/decisions/document metadata/Inbox according to `features/GLOBAL-SEARCH.md`.

Offline explicitly reports cached-only scope.

## `/inbox`

Shows unprocessed/converted/archived captures.

Actions:

- add text/URL/hint;
- convert with duplicate preview;
- archive/discard/restore;
- open converted target.

Conversion retry is idempotent.

---

# Venues

## `/venues`

Modes: Gallery / Table / Compare selection.

Actions: add, import, filter/sort, save personal view preferences, compare/open.

Filters at least status/region/favorite/blocking compatibility/quote/visit.

## `/venues/:venueId`

Header: identity/location/status, both partner rating/favorite summary, sync/conflict state.

Summary: blocking result, explainable score/completeness, scenario/cost context, missing critical data, strengths/reservations, quote/availability, next action.

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

Actions: edit/status/reject/restore, rate/favorite personally, task/decision, add source/photo/document/offer, compare, visit mode.

## `/venues/:venueId/visit`

Mobile-first offline-capable visit: questions, note, photo, measurement, personal rating, summary.

## `/venues/compare`

2–5 practical candidates; blocking criteria first; difference-only mode; objective facts/cost/access, evidence readiness, personal ratings separately; open source/detail; finalist/reject/joint decision actions.

---

# Map

## `/map`

Filter/select pins, open venue/external route. Map failure shows fallback list/location data. Stored venue data never depends on map provider availability.

---

# Vendors

## `/vendors`

List/cards, type/status filters, add/import/open.

## `/vendors/:vendorId`

Contacts/interactions, quote/offers/tax/package, facts/evidence, ratings/preferences where enabled, venue compatibility, waiting/follow-up, linked budget/documents/tasks.

---

# Guests / households / seating

## `/guests`

Guest/household table, category/priority/RSVP filters, expected/confirmed/cumulative stats. Add/import/bulk allowed updates/export.

PII never appears unnecessarily in URLs.

## `/guests/:guestId`

Edit identity/category/priority/probability/RSVP/household relationship/logistics/dietary info and open seating assignment.

## `/households/:householdId`

Invitation/address context and members; safe add/reassign/remove.

## `/seating`

Non-visual V1 seating workspace.

Views:

- by section/table;
- unassigned;
- warnings/readiness;
- alphabetical guest→table.

Actions:

- create section/table;
- set capacity;
- assign/move/unassign guest;
- import/export;
- validate/finalize print data.

Finalization is blocked on duplicate assignment/overcapacity/required attending unassigned state.

---

# Tasks

## `/tasks`

Views Mine / Partner / Together / Waiting / Blocked / Completed. Add, update, assign/take, follow-up, open related entity.

## `/tasks/:taskId`

Owner/status/priority/due/follow-up/dependencies/links/history.

---

# Decisions

## `/decisions`

Needs my input / both / discuss together / finalized-history.

## `/decisions/:decisionId`

Question/options/evidence/partner approvals/deadline/final rationale/history. Locked result visually distinct from alternatives.

---

# Budget

## `/budget`

Summary:

- active-scenario expected total;
- contracted;
- paid;
- refundable exposure;
- due/overdue;
- upcoming cash flow.

Views: items/categories, scenarios, payments, cash flow.

Actions: add item/payment, create/switch scenario through protected flow, link offer/entity, export.

## `/budget/scenarios/:scenarioId`

Shows date/venue/guest assumptions, included items/overrides and exact derived total explanation. Activate action is explicit/atomic.

## `/budget/items/:itemId`

Amounts by state, calculation method, linked scenario/offer/entity, payments/documents/history. Derived totals not editable as source truth.

---

# Planning / event timeline

## `/planning`

Phase, milestones/dependencies, chronological preparation deadlines, weighted progress and links.

## `/timeline`

Actual wedding-event schedule defined by `features/EVENT-TIMELINE.md`.

Views/actions:

- chronological live timeline;
- draft/confirmed/cancelled;
- add/edit timed item;
- link venue/space/vendor/contact;
- dependency/conflict warnings;
- vendor-filtered view;
- print/export/freeze snapshot.

After-midnight day offsets display/sort correctly.

---

# Documents/media

## `/documents`

Filters by type/entity/vendor/venue/classification/recent. Upload/link/open/download/trash/provenance. Unsafe active content never executed.

Media galleries are primarily entity-local; global media browsing may be exposed under Documents/Resources without creating a separate source of truth.

---

# Import / export

## `/import`

Wizard:

1. choose/paste/drop;
2. detect;
3. map/profile;
4. normalize/validate;
5. duplicates/conflicts;
6. preview;
7. commit/revalidate stale preview;
8. report/rollback link.

Before commit explicitly says project unchanged.

## `/imports/:importId`

Source/hash/schema/actor/mapping, create/update/same/conflict/error counts, exact changes, rollback state.

## `/export`

Module CSV/XLSX/JSON, research-missing-data export, plain/encrypted `.mariage`, complete archive, print/share profiles where explicitly supported.

## `/restore`

Inspect/verify backup, password decrypt locally where encrypted, compatibility report, controlled recovery/replace flow with strong auth/checkpoint where destructive.

---

# Settings / diagnostics

## `/settings`
Index.

## `/settings/project`
Project display, candidate/selected dates, timezone/locale/currency, guest/budget preferences.

## `/settings/members`
Owners/invite status; controlled changes.

## `/settings/criteria`
Criterion definitions, priorities/weights/evaluation/freshness.

## `/settings/locations`
Reference origins.

## `/settings/offline-storage`
Local cache/pins/pending/conflicts/cloud quota info.

## `/settings/backup`
Backup age, export/verify/restore.

## `/settings/security`
MFA/session/logout/recovery state.

## `/settings/diagnostics`
Versions, sync, integrity, sanitized diagnostics.

## `/settings/danger`
Archive, trash/purge and permanent project destruction with proportional safeguards.

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
- date/scenario protected transition confirmation
- reauthentication
- backup password/export/restore verification

Keyboard/focus semantics and mobile sheet adaptation mandatory.

---

# Route protection / data safety

- unauthenticated route never renders cached project data;
- unauthorized ID returns generic not-found/permission behavior without existence leak;
- project/user context clears before other account data can render;
- route transition follows autosave/draft rules;
- external navigation preserves pending local work;
- Back/Forward restores logical view/filter state where feasible;
- invite token is not written to logs/history and should be removed from browser-visible URL/history state after successful acceptance where router/security design permits.

---

# Universal screen-state matrix

Each primary route implements/tests applicable:

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
13. narrow mobile/keyboard state;
14. desktop keyboard/focus;
15. session-expired/re-auth state where editing can persist.

A screen with only the happy path is incomplete.