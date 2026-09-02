# Navigation Architecture

## Goal

The navigation must make Mariage OS feel like a calm wedding workspace rather than enterprise software. Dense information exists, but primary navigation remains small and predictable.

## Desktop navigation

Recommended sidebar groups:

### Home
- Dashboard

### Prepare
- Venues
- Vendors
- Guests

### Pilot
- Tasks
- Decisions
- Budget
- Planning

### Resources
- Map
- Documents
- Ideas / Inbox

### System
- Settings

The exact labels may be refined during wireframing, but the information architecture should stay shallow.

## Mobile navigation

Bottom navigation should expose at most five primary destinations:

- Home
- Venues
- To do
- Budget
- More

`More` opens guests, vendors, decisions, planning, map, documents, inbox and settings.

## Global quick-add

A persistent `+` action should provide fast creation of:

- venue;
- vendor;
- guest/household;
- task;
- expense;
- idea/note;
- photo/document.

Quick-add must allow minimal creation. Users should not be forced to complete full records immediately.

## Global search

A global search action should be reachable consistently, preferably with `Ctrl/Cmd+K` on desktop.

Search results may include venues, vendors, guests, tasks, decisions and documents, subject to permissions and indexing policy.

## Deep links

Important entities should have stable internal URLs, for example:

- `/venues/<id>`
- `/vendors/<id>`
- `/guests/<id>`
- `/tasks/<id>` where a dedicated detail route is useful.

Reloading the page should preserve the current route. Sharing an internal URL with the other project owner should open the same entity after authentication.

## Venue navigation

The Venues section offers:

- Gallery
- Table
- Compare

Map is also reachable globally.

A venue detail view uses tabs/sections such as:

1. Summary
2. Photos
3. Spaces
4. Prices & dates
5. Included / extras
6. Catering
7. Access
8. Technical / weather
9. Quotes & contacts
10. Documents
11. Sources
12. History

On mobile these may render as progressive accordions/sections rather than a wide horizontal tab row.

## Dashboard hierarchy

The dashboard should not become a menu replacement. Its content order is:

1. wedding countdown/current phase;
2. next best action;
3. blockers;
4. joint decisions;
5. waiting on external parties;
6. upcoming deadlines;
7. budget summary;
8. progress by category;
9. meaningful changes since last visit.

## Back behavior

Browser back/forward must behave naturally. Modal/drawer behavior should not trap users in unexpected history loops.

## Saved views

Complex recurring filters may be saved per user later, but should not complicate the initial navigation model.

## Accessibility

Navigation must work with keyboard and screen-reader semantics. Mobile touch targets must be comfortably sized. Color is never the only indicator of selected/status state.
