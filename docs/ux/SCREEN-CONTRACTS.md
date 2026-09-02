# Route and Screen Contracts

Status: **Normative V1 navigation/screen reference**

This document maps logical routes to required purpose, primary actions and designed states. Exact URL syntax may be refined in implementation, but deep-link semantics and behavior remain.

## Global shell

Authenticated shell always provides:

- project identity;
- current screen title/breadcrumb context;
- global sync state;
- navigation;
- global quick-add action;
- profile/settings access;
- global search entry only if/when Search is promoted into the current V1 implementation milestone.

Mobile shell uses bottom navigation plus `More`; desktop uses side navigation.

---

## `/login`

Purpose: authenticate securely.

Primary actions:
- sign in;
- recover account where applicable.

States:
- idle;
- submitting;
- invalid credentials/link;
- MFA required;
- backend unavailable;
- already authenticated redirect.

No project data is visible here.

## `/onboarding`

Purpose: create/complete project and invite partner.

Primary actions:
- create project;
- set optional basics;
- invite partner;
- review MFA/setup;
- continue to Dashboard/Import Center.

States:
- new owner;
- pending invitation;
- invitation accepted;
- incomplete setup;
- offline unavailable for server-required creation/invitation.

## `/`

Redirects authenticated project member to `/dashboard` or last safe remembered route.

## `/dashboard`

Purpose: operational cockpit.

Primary actions:
- open next action;
- inspect blockers;
- open joint decisions;
- open waiting items;
- open upcoming payments/deadlines.

Data hierarchy follows `features/DASHBOARD.md`.

States:
- new project empty setup;
- normal;
- cached/offline/stale;
- partial data;
- sync error.

---

# Venues

## `/venues`

Default venue collection route.

Views/toggles:
- gallery;
- table;
- compare selection mode.

Primary actions:
- add venue;
- import venues;
- filter/sort;
- select compare candidates;
- open venue.

Filters include at least:
- lifecycle/status;
- region;
- favorites;
- blocking-criteria compatibility;
- quote/visit state where available.

Empty state: add/import first venue.

## `/venues/:venueId`

Venue summary/detail route.

Header contains:
- code/name;
- location;
- status;
- partner ratings/favorites;
- sync/conflict if relevant.

Summary contains:
- blocking criteria status;
- cost/quote context;
- missing critical data;
- strengths/reservations;
- next action.

Subsections/tabs:
- Summary;
- Photos;
- Spaces;
- Prices & dates;
- Included/extras;
- Catering;
- Access;
- Technical/weather;
- Quotes/contacts;
- Documents;
- Sources;
- History.

Primary actions:
- edit;
- status/reject/restore;
- create linked task;
- discuss/decision;
- add source/photo/document/offer;
- compare;
- visit mode.

## `/venues/:venueId/visit`

Mobile-first visit surface.

Primary actions:
- answer generated/universal question;
- add note;
- take/upload photo;
- add measurement;
- rate personally;
- finish visit summary.

Offline-pinned data must be usable here.

## `/venues/compare`

Inputs: explicit selected venue IDs in route/query/local session state.

Primary actions:
- remove/add candidate;
- differences only;
- change criterion ordering/filter;
- open source/fact detail;
- mark finalist/reject/create joint decision.

Blocking criterion failures shown before aggregate scores.

---

# Map

## `/map`

Primary actions:
- filter visible venues;
- select pin;
- open venue;
- open external route link.

Network/map-tile failure presents fallback list/text, not blank application failure.

---

# Vendors

## `/vendors`

Views:
- list/cards;
- type/status filters.

Primary actions:
- add vendor;
- import;
- filter;
- open vendor.

## `/vendors/:vendorId`

Summary:
- vendor type/status;
- contacts;
- quote/package state;
- important facts;
- venue compatibility;
- waiting/follow-up;
- linked budget/documents/tasks.

Primary actions:
- edit;
- request/update quote state;
- add interaction/contact/offer/document;
- create task;
- mark selected/rejected according to state machine.

---

# Guests

## `/guests`

Primary modes:
- guest/household table;
- group/priority filters;
- RSVP filters;
- summary statistics.

Primary actions:
- add household/guest;
- import spreadsheet;
- bulk update allowed fields;
- open household/guest;
- export.

Header summary includes:
- invited individual count;
- expected attendance;
- confirmed yes/no/pending;
- cumulative priority views.

PII is never included in public URLs/query strings unnecessarily.

## `/guests/:guestId`

Primary actions:
- edit guest;
- change RSVP;
- set probability/priority;
- link household/relationship;
- update useful logistics/dietary notes.

## `/households/:householdId`

Shows household invitation context and members. Supports household-level address/note and adding/removing members consistent with invariants.

---

# Tasks

## `/tasks`

Default views/filters:
- Mine;
- Partner;
- Together;
- Waiting;
- Blocked;
- Completed.

Primary actions:
- add task;
- complete/update;
- assign/take;
- follow-up;
- open linked entity.

## `/tasks/:taskId`

Detail shows:
- owner/status/priority;
- due/follow-up;
- dependencies;
- linked entities;
- history.

---

# Decisions

## `/decisions`

Views:
- needs my input;
- needs both;
- discuss together;
- finalized/history.

Primary actions:
- create decision;
- vote/approve;
- open option/linked entity;
- finalize when conditions met.

## `/decisions/:decisionId`

Shows:
- question;
- options;
- evidence/linked data;
- each partner's state;
- deadline;
- final rationale/history.

Finalized/locked decisions clearly distinguish current outcome from alternatives.

---

# Budget

## `/budget`

Summary:
- planned/probable;
- contracted;
- paid;
- remaining contractual;
- upcoming cash flow;
- reserve if configured.

Views:
- categories/items;
- payments;
- scenarios;
- cash flow.

Primary actions:
- add budget item;
- add payment;
- link quote/vendor/venue;
- adjust scenario inputs;
- export.

## `/budget/items/:itemId`

Shows source amounts by state, calculation method, links, payment schedule/history and documents.

No editable derived total masquerades as authoritative input.

---

# Planning

## `/planning`

Displays:
- phase;
- milestones;
- chronological deadlines;
- weighted progress;
- linked tasks/payments.

Primary actions:
- open milestone/task/payment;
- add custom milestone if supported;
- export calendar event where implemented.

---

# Documents

## `/documents`

Filters:
- type;
- linked entity;
- vendor/venue;
- sensitivity/classification;
- recent.

Primary actions:
- upload document;
- link/unlink;
- open/download safely;
- move to trash;
- inspect provenance.

No unsafe inline execution.

---

# Import/export

## `/import`

Wizard stages:
1. choose/capture input;
2. detect;
3. map;
4. validate;
5. duplicates/conflicts;
6. preview;
7. commit;
8. report/rollback link.

Global invariant: prior to commit, explicitly state that project data is unchanged.

## `/imports/:importId`

Shows:
- source file/hash/schema;
- actor/time;
- mapping/profile;
- created/updated/unchanged/conflict/error counts;
- exact change report;
- rollback eligibility/status.

## `/export`

Modes:
- module CSV/XLSX/JSON;
- missing/stale research data;
- `.mariage` structured backup;
- complete archive with binaries;
- sanitized/share profile only when feature is in scope.

---

# Settings

## `/settings`

Index for sections below.

## `/settings/project`
Project/date/timezone/locale/currency/guest target/budget settings.

## `/settings/members`
Owners/invites/security setup.

## `/settings/criteria`
Criterion definitions/priorities/weights/freshness.

## `/settings/locations`
Reference addresses/origins.

## `/settings/offline-storage`
Pins/cache/pending/conflicts/quota status.

## `/settings/backup`
Exports, validation, restore entry.

## `/settings/security`
MFA/session/logout/account actions.

## `/settings/diagnostics`
Versions/sync/integrity/sanitized diagnostics.

## `/settings/danger`
Archive/purge/device data actions with strong safeguards.

---

# Global dialogs/sheets

Reusable routed or modal flows include:

- quick add;
- source detail;
- fact conflict resolution;
- sync conflict resolution;
- add photo/document;
- delete/reject/undo;
- select linked entity;
- choose import mapping;
- import duplicate resolution;
- reauthentication.

Dialogs must support keyboard/focus/accessibility semantics and mobile bottom-sheet adaptation where appropriate.

---

# Route protection and data safety

- unauthenticated access to project route redirects/asks for auth without rendering private content;
- unauthorized project/entity ID does not reveal data existence details;
- switching user/project clears visible context before showing next project;
- pending form data is saved/reconciled before route transitions according to forms contract;
- external links use safe navigation and preserve internal draft state;
- browser Back/Forward returns to logical prior screen/filter state where feasible.

---

# Universal screen-state matrix

Every primary route explicitly implements/tests applicable states:

1. loading with no local data;
2. cached data + background refresh;
3. normal synchronized;
4. empty;
5. partial/incomplete;
6. offline;
7. pending sync;
8. conflict;
9. retryable backend error;
10. permanent validation error;
11. permission denied/not found without data leak;
12. unsupported capability fallback;
13. mobile narrow viewport;
14. desktop keyboard/focus behavior.

A screen is not considered implemented if only its normal happy-path state exists.
