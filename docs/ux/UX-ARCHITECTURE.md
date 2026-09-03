# Mariage OS — UX Architecture

Status: **Normative product-navigation and page-composition contract**

Purpose: make Mariage OS feel like a coherent, elegant wedding workspace rather than a database admin panel. This document controls **how information is divided into screens, how users move between them, how much information appears at once, and which interaction pattern should be used**.

If a feature can technically be placed on one page but doing so creates an overloaded, confusing or visually dense experience, that implementation is non-conformant.

---

# 1. Product mental model

The user should understand Mariage OS through four mental questions, not through database tables:

## Home / Pilot
**What needs my attention now?**

Dashboard, Tasks, Decisions, Planning, Budget.

## Prepare
**What/who are we choosing or organizing?**

Venues, Vendors, Guests, Seating.

## Wedding Day
**What happens on the day itself?**

Timeline and final operational outputs.

## Resources
**Where is supporting information?**

Map, Documents, Inbox, Search, Import/Export.

Settings/Diagnostics are system administration, not wedding-planning destinations.

The UI may group destinations slightly differently on mobile, but the conceptual separation remains.

---

# 2. Top-level information architecture

## Desktop

Persistent left navigation, grouped and visually quiet:

### Home
- Dashboard

### Organize
- Venues
- Vendors
- Guests
- Seating

### Pilot
- Tasks
- Decisions
- Budget
- Planning
- Timeline

### Resources
- Map
- Documents
- Inbox
- Import / Export

### System
- Settings

Global Search and global `+` are shell actions rather than sidebar destinations required for every task.

Do not expose every sub-feature as a permanent top-level navigation item. Details belong inside the relevant domain workspace.

## Mobile

Bottom navigation contains at most five persistent destinations:

- Home
- Venues
- Tasks
- Budget
- More

`More` is a structured menu grouped the same way as desktop, not an unordered list.

A contextually important module may be surfaced from Home without changing the permanent bottom-nav contract.

---

# 3. Screen taxonomy

Every route must belong to one of these screen types. Do not invent arbitrary layouts per feature.

## A. Overview / command screen

Purpose: orient and prioritize.

Examples:
- Dashboard
- Planning overview
- Budget overview

Characteristics:
- summary first;
- 3–7 high-value blocks, not dozens of widgets;
- one dominant recommended action where applicable;
- links into detailed workspaces;
- no giant editable table as main content.

## B. Collection / browse screen

Purpose: find, filter and select entities.

Examples:
- Venues
- Vendors
- Guests
- Documents
- Tasks

Characteristics:
- clear search/filter/sort;
- a default readable presentation;
- optional alternate analytical/table mode if needed;
- bulk actions hidden until selection;
- not every entity field shown simultaneously.

## C. Entity detail workspace

Purpose: understand and act on one entity.

Examples:
- Venue detail
- Vendor detail
- Guest detail
- Budget item detail
- Decision detail

Characteristics:
- summary/header first;
- important status + next action visible without scrolling deep;
- details divided into meaningful sections;
- context actions near related content;
- history/evidence is available but not dominating the first screen.

## D. Focused workflow

Purpose: complete a multi-step/high-risk task.

Examples:
- Import wizard
- Restore backup
- Partner invitation
- Select active wedding date
- Activate budget scenario
- Project deletion

Characteristics:
- dedicated route or full-screen flow;
- clear progress/steps;
- one decision at a time;
- preview before destructive commit;
- explicit completion/exit state.

Do not implement a high-risk workflow as a small generic modal with fifteen fields.

## E. Analysis / comparison workspace

Purpose: compare or reason across entities.

Examples:
- Venue Compare
- Budget scenarios
- Seating readiness

Characteristics:
- optimized for side-by-side/differences;
- limited number of compared items;
- explanation of blockers/score inputs;
- direct path back to entity detail.

## F. Operational workspace

Purpose: execute repeated structured work.

Examples:
- Seating
- Timeline
- Venue visit mode

Characteristics:
- task-focused;
- fast direct manipulation where appropriate;
- persistent context/status;
- undo or conflict safeguards;
- print/export where operationally useful.

## G. Settings/admin screen

Purpose: configure product behavior, not perform wedding work.

Examples:
- Criteria settings
- Reference origins
- Security/MFA
- Offline/storage diagnostics

Settings must not become the only place to perform normal wedding workflows.

---

# 4. One screen = one primary job

Every primary route defines:

1. user question;
2. primary action;
3. secondary actions;
4. information required to decide;
5. information deliberately hidden until deeper interaction.

Examples:

### `/venues`
Question: “Which venues should we look at or compare?”
Primary action: open/add/filter a candidate.
Not: edit every venue field from one giant spreadsheet.

### `/venues/:id`
Question: “Is this venue right for us, and what do we still need to know/do?”
Primary action: follow the current next action / update evaluation.
Not: show every historical source, photo and contact message above the fold.

### `/budget`
Question: “What is this wedding likely to cost, what is committed, and what must be paid next?”
Primary action: inspect/add/resolve financial item or scenario.
Not: show a raw accounting ledger as the only view.

### `/guests`
Question: “Who is invited/coming, what is our expected count, and where are gaps?”
Primary action: find/update/import guest or household.
Not: expose all personal/logistics fields in the default table.

---

# 5. Progressive disclosure levels

Use three information levels consistently.

## Level 1 — Decision summary
Visible immediately.

Examples:
- venue status;
- blocking compatibility;
- key price/context;
- missing critical facts;
- next action;
- personal ratings;
- important warning.

## Level 2 — Working detail
Accessible through sections/tabs/accordions.

Examples:
- spaces;
- offers;
- access;
- inclusions;
- guest logistics;
- payment schedule.

## Level 3 — Evidence/history/system detail
Available when needed but visually de-emphasized.

Examples:
- all source observations;
- raw import provenance;
- revision history;
- technical diagnostic IDs;
- old document versions.

Do not flatten Levels 1–3 into one endless screen.

---

# 6. Page vs tab vs drawer vs dialog decision rule

## Dedicated page/route
Use when:
- user needs sustained focus;
- content has multiple sections;
- URL/deep-link/share-with-partner matters;
- browser Back should return naturally;
- workflow may take >30 seconds;
- content must survive refresh;
- operation is high-risk/multi-step.

Examples: venue detail, import, restore, seating, timeline, budget scenario.

## Tab/section inside entity page
Use when:
- same entity context remains primary;
- content is a major subdomain of that entity;
- switching should not lose entity context.

Examples: Venue Photos, Spaces, Prices, Access, Documents.

Do not create twenty tiny tabs for fields that could be grouped semantically.

## Drawer / bottom sheet
Use when:
- task is contextual and short;
- user benefits from seeing background context;
- task is reversible or low/medium risk;
- mobile needs focused controls without route change.

Examples: quick filter, add source, assign guest to table, quick task edit.

## Modal/dialog
Use only for:
- short confirmation;
- small single-purpose entry;
- conflict decision;
- destructive warning;
- explicit atomic choice.

Do not use modals as miniature full applications.

## Inline edit
Use when:
- field is obvious;
- edit is low-risk;
- no additional context is required;
- autosave/sync state can be shown clearly.

---

# 7. Lists, cards and tables

## Cards
Default when visual/emotional comparison matters or item count is moderate.

Best for:
- Venue Gallery;
- dashboard summaries;
- shortlist/finalists;
- document/media previews.

Card shows only the 4–7 most decision-relevant facts.

## Tables
Use when users need scanning, sorting, bulk comparison or editing across many rows.

Best for:
- guest management;
- venue analytical table;
- tasks;
- payment schedule;
- document metadata.

Rules:
- default columns are intentionally limited;
- secondary columns configurable;
- horizontal scrolling is not the default mobile solution;
- row click opens detail/context;
- bulk actions appear only after selection;
- table is not the only way to understand a domain.

## Lists
Best for:
- mobile collections;
- waiting items;
- decisions;
- timeline;
- activity.

## Comparison matrix
Separate from ordinary table. Used for 2–5 candidates with `only differences` and blocking rows first.

---

# 8. Desktop layout system

Primary content uses a readable maximum width for narrative/detail screens. Full-width layouts are reserved for data tasks that benefit from width, such as compare/seating/table.

Typical entity detail composition:

```text
Breadcrumb / Back to list
Entity header + status + primary action
Decision summary strip/cards
Secondary nav / anchored sections
Main content (2/3)
Context sidebar (1/3) only when genuinely useful
```

Do not put three permanent sidebars around a narrow content column.

Sticky elements may include:
- entity header summary;
- section navigation;
- pending sync/conflict notice;
- save/action bar for a focused workflow.

Sticky UI must not consume excessive viewport height.

---

# 9. Mobile layout system

Mobile is designed as its own flow, not scaled-down desktop.

Rules:
- one content column;
- no persistent wide sidebar;
- bottom navigation + contextual header;
- sections become cards/disclosures;
- filters often use bottom sheet;
- table-heavy domains switch to list/card summaries with drill-down;
- primary action reachable by thumb but not covering content;
- sticky action bar only when action is genuinely central;
- critical sync/offline status remains visible but compact.

Venue visit mode is explicitly mobile-first and removes unrelated navigation clutter.

---

# 10. Tablet behavior

Tablet is not assumed to equal desktop.

Portrait generally follows mobile hierarchy with more breathing room.
Landscape may use desktop-like split views when beneficial.

Do not require hover, right-click or precision mouse interaction on tablet.

---

# 11. Navigation transitions / user journeys

Every important workflow must have an obvious next step and return path.

## Venue decision journey

```text
Dashboard / Inbox / Import
→ Venues collection
→ Venue detail
→ Compare finalists
→ Joint decision
→ Selected venue
→ Contract readiness / budget / tasks
```

At every stage users can return to the shortlist without losing filters/context where feasible.

## Guest journey

```text
Import / Quick add
→ Guests collection
→ Household/guest detail
→ RSVP / expected count
→ Seating readiness
→ Seating assignment
→ Final export
```

## Vendor journey

```text
Vendor collection
→ Vendor detail
→ Quote/package
→ Venue compatibility
→ Budget impact
→ Contract readiness
→ Payments / timeline
```

## Daily control journey

```text
Dashboard
→ next action / blocker / decision / payment
→ focused detail/workflow
→ complete/update
→ return to Dashboard with state changed
```

The app should feel like following a plan, not browsing database modules.

---

# 12. Dashboard is not a dumping ground

Dashboard may summarize only information that answers “what matters now?”.

Maximum conceptual sections:
1. phase/countdown;
2. next useful action;
3. blockers;
4. joint decisions;
5. waiting external;
6. upcoming tasks/payments;
7. financial summary;
8. weighted progress;
9. meaningful partner changes.

Sections with zero meaningful content collapse/omit gracefully.

Do not add module statistics merely because they are available.

---

# 13. Venue detail architecture

Venue detail is one of the most important product screens and must remain emotionally readable as well as technical.

Above the fold:
- strong hero/image context but not excessive image height;
- name/code/location/status;
- partner preference summary;
- blocking compatibility;
- key capacity/price/access/date context;
- missing critical information;
- next recommended action.

Sections are grouped:

### Evaluate
- Summary
- Photos
- Spaces
- Technical/weather

### Commercial
- Prices & dates
- Included/extras
- Catering
- Quotes/contacts
- Contract readiness

### Logistics
- Access
- Accommodation/parking/transport

### Evidence
- Documents
- Sources
- History

Desktop may use anchored secondary navigation. Mobile uses progressive sections; do not render 12 tiny horizontal tabs.

---

# 14. Guest UX architecture

Guest management is data-dense, therefore has two modes:

## Overview
- totals/expected/confirmed;
- priority summary;
- RSVP progress;
- seating readiness;
- useful filters/actions.

## Management
- efficient table on desktop;
- compact list on mobile;
- configurable columns;
- household grouping where useful.

Sensitive or rarely edited data (addresses, dietary/logistics notes) belongs in detail/drawer, not default columns.

---

# 15. Budget UX architecture

Budget begins with decision-oriented summary, not accounting details.

First view:
- active scenario;
- expected total;
- contracted;
- paid;
- remaining;
- refundable exposure;
- next payments/overdue;
- largest categories / key changes.

Then users may enter:
- item/category view;
- scenario comparison;
- payment/cash-flow view;
- individual item detail.

Do not mix scenario assumptions, historical quote truth and actual payments into one editable grid.

---

# 16. Seating UX architecture

V1 seating is deliberately non-graphical.

Primary screen supports:
- readiness summary;
- sections/tables;
- unassigned guests;
- warnings;
- quick assignment/move/unassign.

Desktop may use a split workspace:

```text
Unassigned / filtered guests | Sections & tables | Selected table details
```

Mobile uses sequential drill-down:
`Seating → Section → Table → Assign guest`.

Do not attempt a pseudo-floorplan with fragile drag/drop in V1.

---

# 17. Timeline UX architecture

Timeline is chronological, not a generic table.

Default:
- time rail/day-offset labels;
- confirmed vs draft distinction;
- location/vendor/responsibility at a glance;
- warnings attached to affected event;
- filters for vendor/section.

Editing one timeline item uses drawer/page depending complexity.

Final snapshot/export is a deliberate action separate from ordinary editing.

---

# 18. Search and Inbox

Search is a navigation accelerator, not a second data model.

Results grouped by entity type with reason/matching snippet, avoiding a flat undifferentiated result list.

Inbox is a low-friction capture queue. It should feel temporary and actionable:
- unprocessed first;
- one-tap/open convert actions;
- archive/discard separated;
- not another permanent notes database.

---

# 19. Visual quality bar

Even before exact palette is selected, every implemented screen must satisfy:

- clear visual hierarchy in <3 seconds;
- one obvious primary action or intentionally none;
- no wall of equally weighted cards;
- whitespace separating concepts;
- typography hierarchy rather than excessive borders;
- limited semantic color usage;
- images used where emotionally useful, not as decoration on operational screens;
- long data tables reserved for genuine analysis;
- consistent component patterns;
- no screen that looks like generated admin CRUD by default.

---

# 20. UX anti-patterns prohibited

- one-page application with every module stacked vertically;
- one universal table for all wedding data;
- entity detail as a 50-field form;
- nested modal inside nested modal;
- more than one permanent primary navigation rail;
- hidden actions discoverable only by hover;
- mobile horizontal table as primary workflow;
- color-only statuses;
- unexplained scores;
- every card having the same visual priority;
- dashboard replicating entire modules;
- destructive action adjacent to routine primary action without separation;
- losing list filters/context after opening and returning from detail;
- generic “Save” states that hide local-vs-cloud synchronization meaning.

---

# 21. UX review gate

A feature cannot reach `ACCEPTED` if UX review answers Yes to any of these without approved exception:

- Could the page be mistaken for an admin database interface?
- Are more than two actions visually competing as primary?
- Is important decision context hidden below raw details?
- Does mobile require horizontal scrolling for the primary task?
- Does the user need to understand internal data architecture to navigate?
- Does Back lose important workflow context unnecessarily?
- Are tables/forms being used because they are easy to code rather than because they fit the task?
- Is the feature reachable only through an obscure path?
- Does the user lack a clear next step after completing the task?
- Is the same concept represented differently in another module?

See `UX-REVIEW-CHECKLIST.md` for the implementation review procedure.
