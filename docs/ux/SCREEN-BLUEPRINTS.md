# Mariage OS — V1 Screen Blueprints

Status: **Normative UX composition reference**

Purpose: remove ambiguity between route contracts and actual page composition. `SCREEN-CONTRACTS.md` defines what each route must support; this document defines **how major screens are organized visually and cognitively** so implementation does not regress into generic CRUD screens.

These are layout/hierarchy contracts, not pixel-perfect mockups.

---

# 1. Global shell

## Desktop

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Mariage OS        [Search ⌘K]                         Sync state   Profile  │
├────────────────┬────────────────────────────────────────────────────────────┤
│ Home           │ Page header / breadcrumb / contextual actions             │
│ Dashboard      │                                                            │
│                │ MAIN CONTENT                                               │
│ Organize       │                                                            │
│ Venues         │                                                            │
│ Vendors        │                                                            │
│ Guests         │                                                            │
│ Seating        │                                                            │
│                │                                                            │
│ Pilot          │                                                            │
│ Tasks          │                                                            │
│ Decisions      │                                                            │
│ Budget         │                                                            │
│ Planning       │                                                            │
│ Timeline       │                                                            │
│                │                                                            │
│ Resources      │                                                       [+]  │
│ Map            │                                                            │
│ Documents      │                                                            │
│ Inbox          │                                                            │
│ Import/Export  │                                                            │
│                │                                                            │
│ Settings       │                                                            │
└────────────────┴────────────────────────────────────────────────────────────┘
```

Rules:
- sidebar width stable and visually quiet;
- no duplicate top horizontal mega-nav;
- current section clearly indicated;
- global Search and Quick Add available without crowding page actions;
- sync state compact unless action required;
- no private content flashes before session/member context resolves.

## Mobile

```text
┌───────────────────────────────┐
│ ← / title          sync/avatar│
├───────────────────────────────┤
│                               │
│ CONTENT                       │
│                               │
│                          [+]  │
├───────────────────────────────┤
│ Home Venues Tasks Budget More│
└───────────────────────────────┘
```

`More` opens grouped destinations, not a miscellaneous flat menu.

---

# 2. Dashboard `/dashboard`

Primary question: **What matters now?**

Desktop hierarchy:

```text
Wedding date / J-___                     Current phase

┌──────────────────────────────────────────────────────────────────┐
│ NEXT USEFUL ACTION                                               │
│ “Relance S29 pour confirmer le prix du 14 juin”                  │
│ Why: finalist + quote overdue + venue decision blocked           │
│                                              [Open action]       │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────┐ ┌──────────────────────┐
│ Blockers             │ │ Decide together      │
│ 2                    │ │ 3                    │
│ top 1–2 preview      │ │ top 1–2 preview      │
└──────────────────────┘ └──────────────────────┘

┌──────────────────────┐ ┌──────────────────────┐
│ Waiting externally   │ │ Upcoming             │
│ 4                    │ │ tasks/payments       │
└──────────────────────┘ └──────────────────────┘

Budget summary
Expected | Contracted | Paid | Remaining | Next due

Progress by wedding area

Since your last visit
```

Rules:
- no full venue/guest/task tables on Dashboard;
- summaries link to canonical module;
- zero-value sections may collapse;
- next action remains visually dominant;
- critical warning never competes with decorative statistics.

Mobile:
- same order vertically;
- next action first;
- compact cards, no 2-column dependency;
- progress and activity later in page.

---

# 3. Venues collection `/venues`

Primary question: **Which venue should we inspect/compare next?**

Header:
- title + count by active status;
- `Add venue` primary action;
- Import secondary;
- search/filter.

Mode switch:
`Gallery | Table | Compare`

## Gallery default

```text
Filters: [Shortlist] [Region] [Compatible] [Favorite] [More]
Sort: Recommended / Status / Code / Recently changed

┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ HERO PHOTO          │ │ HERO PHOTO          │ │ HERO PHOTO          │
│ S29  Venue          │ │ S30 Venue           │ │ S32 Venue           │
│ Shortlist           │ │ Finalist            │ │ Research            │
│                     │ │                     │ │                     │
│ blockers: 0         │ │ blockers: 0         │ │ blockers: 1         │
│ 200 seats · 300m²   │ │ 200 seats · 420m²   │ │ 180 seats · ?       │
│ quote: waiting      │ │ quote: received     │ │ missing: 4          │
│ ♥ A 9 · B 8         │ │ ♥ A 9 · B 9         │ │ A 7 · B ?           │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

Card limit:
- 4–7 high-value facts;
- one status;
- one warning/missing summary;
- ratings separate from objective compatibility.

## Table mode

Default columns only:
- code/name;
- status;
- blocking result;
- capacity suitability;
- key price scenario;
- external caterer;
- access summary;
- quote state;
- missing critical count;
- partner ratings.

Secondary columns are user-configurable. Never default to every criterion.

Mobile collection uses cards/list, not compressed desktop table.

---

# 4. Venue detail `/venues/:id`

Primary question: **Is this venue right for us, what is uncertain, and what should we do next?**

## Above the fold

```text
← Venues

[Hero image]     S29 — Mas ...                   [Shortlist ▼]
                 Sisteron · Provence
                 A ♥ 9/10      B ♥ 8/10

Compatibility        Price context       Access          Missing
0 blocking failures  ~€____              __ from Paris  3 critical

NEXT ACTION
Confirm whether two dance areas remain feasible at 190 guests     [Open task]

Strengths                                   Reservations
• panoramic elevated setting                • room geometry to verify
• external caterer confirmed                • ...
```

## Secondary navigation

Desktop anchored sections, grouped rather than 12 tiny tabs:

**Evaluate**
- Overview
- Photos
- Spaces & capacity
- Technical / weather

**Commercial**
- Prices & dates
- Included / extras
- Catering
- Quotes & contacts
- Contract readiness

**Logistics**
- Access / transport
- Parking / accommodation

**Evidence**
- Documents
- Sources
- History

Mobile:
- hero compact;
- summary cards;
- grouped accordions/section links;
- no horizontal 12-tab strip.

A fact row may reveal source/confidence on demand; evidence metadata does not flood the default view.

---

# 5. Venue Compare `/venues/compare`

Primary question: **Which finalist better satisfies our real constraints?**

Top:
- selected 2–5 venues;
- current scenario/date/guest count context;
- toggle `Only differences`;
- no winner auto-declared solely from score.

Rows order:
1. blocking criteria;
2. capacity/configuration;
3. total/scenario cost;
4. access;
5. date availability;
6. key inclusions/logistics;
7. evidence completeness;
8. individual partner ratings;
9. optional bonus criteria.

Each value can open source/detail.

Actions:
- open venue;
- mark finalist/reject;
- create joint decision.

Mobile:
- compare two at a time with sticky row labels or stacked “criterion cards”;
- never require reading a 5-column matrix on a phone.

---

# 6. Vendors `/vendors` and vendor detail

Collection default:
- category/status/quote filter;
- list/cards with name, type, quote/follow-up state, price/package context, next action;
- not a raw contact database.

Detail above fold:
- vendor identity/type/status;
- primary contact;
- current quote/package;
- next action/follow-up;
- venue compatibility warning;
- budget/contract state.

Sections:
- Offers & packages
- Inclusions/extras
- Contacts/interactions
- Compatibility
- Contract readiness
- Documents
- Tasks/history

Caterer-specific fields live inside meaningful commercial sections, not a giant custom form.

---

# 7. Guests `/guests`

Primary question: **Who is invited/coming, and what needs attention?**

Top summary:

```text
Invited people  ___ | Expected ___ | Confirmed ___ | RSVP pending ___
Priority 1–2 ___ | Seating unassigned ___
```

Filters:
- category;
- priority;
- RSVP;
- household;
- seating status;
- transport/accommodation when needed.

Desktop management table default columns:
- guest/household;
- category;
- priority;
- probability;
- RSVP;
- seating;
- one alert indicator.

Phone/address/dietary/logistics are detail-only by default.

Mobile row:
- name + household;
- priority/RSVP;
- seating state;
- tap to edit details.

Bulk action appears only after selection.

---

# 8. Guest / household detail

Guest detail:
- identity/household;
- category/priority/probability/RSVP first;
- seating summary;
- logistics/dietary collapsed if empty;
- history/import provenance de-emphasized.

Household detail:
- invitation context;
- household members as primary content;
- household-level address/contact/logistics;
- add/reassign member actions.

Do not duplicate household fields independently on every member unless semantics require it.

---

# 9. Seating `/seating`

Primary question: **Can everyone who needs a seat be placed correctly, and what is unresolved?**

Top:
- readiness status;
- assigned / required / unassigned;
- over-capacity warnings;
- RSVP-invalidated assignments.

Desktop split workspace:

```text
┌──────────────────────┬────────────────────────────┬───────────────────────┐
│ UNASSIGNED / FILTER  │ SECTIONS & TABLES          │ SELECTED TABLE        │
│ Search guest         │ Men                        │ Table M3  8/10         │
│ • Guest A            │  M1 10/10                  │ • ...                 │
│ • Guest B            │  M2 9/10                   │                       │
│                      │  M3 8/10  ← selected       │ [Assign guest]        │
│                      │ Women                      │ [Change capacity]      │
└──────────────────────┴────────────────────────────┴───────────────────────┘
```

V1 is non-graphical. Drag between lists may be added if robust/accessibly supported, but no floorplan canvas.

Mobile:
`Readiness → Sections → Table → Members → Add/Move guest`.

---

# 10. Tasks `/tasks`

Primary question: **What do I/we need to do, what is blocked, and what are we waiting for?**

Top view switch:
`Mine | Partner | Together | Waiting | Blocked | Completed`

Task row:
- title;
- status;
- owner;
- due/follow-up;
- linked entity;
- blocker/waiting context.

Do not display `waiting_external` as overdue personal work until follow-up becomes actionable.

Detail/drawer used for description, dependencies, history and links.

---

# 11. Decisions `/decisions`

Primary question: **What needs a decision, whose input is missing, and why did we choose?**

Views:
- Needs my input
- Need both
- Discuss together
- Finalized/history

Decision card:
- question;
- deadline;
- current option/approval state;
- missing partner input;
- linked evidence/entity.

Decision detail emphasizes options and each partner's view before history/system metadata.

---

# 12. Budget `/budget`

Primary question: **What will it cost, what have we committed/paid, and what is due next?**

Top scenario selector:
`Active: [June 14 · Venue S29 · 185 guests ▼]`

Summary:

```text
Expected total    Contracted    Paid    Remaining    Refundable exposure
€_____            €_____        €___    €_____       €_____
```

Below:
- upcoming/overdue payments;
- category distribution;
- largest changes/uncertainties;
- alerts for unknown tax/contract mismatch.

Tabs/modes:
`Overview | Items | Scenarios | Payments/Cash flow`

Items table never mixes base truth, scenario override and payment transaction in the same editable cell.

Mobile default remains summary + cards; analytical tables are secondary.

---

# 13. Budget scenario detail

Primary question: **What assumptions create this total?**

Header:
- name/class;
- date;
- venue;
- guest count;
- active/not active;
- total.

Sections:
- assumptions;
- included budget items;
- scenario overrides;
- unknown/review-needed inputs;
- comparison with active/other scenario.

Activation is an explicit protected action, not a toggle buried in table rows.

---

# 14. Planning `/planning`

Primary question: **Are we on track, and which milestone blocks the next phase?**

Default:
- current phase;
- weighted progress;
- critical milestones;
- upcoming preparation deadlines;
- blockers.

Planning is not the same as Tasks:
- milestones summarize outcomes/readiness;
- tasks execute work.

A milestone opens its linked tasks/decisions/entities rather than duplicating them.

---

# 15. Timeline `/timeline`

Primary question: **What happens when on the wedding day, and is the sequence operationally coherent?**

Chronological timeline rather than generic table:

```text
DAY 0
15:00 Venue access       confirmed     Venue
16:00 Caterer arrival    confirmed     Caterer
18:00 Ceremony           confirmed     Main garden
19:00 Cocktail           draft         Terrace
...
DAY +1
00:30 Dancing block      confirmed
01:30 Music end          confirmed
```

Warnings attach to affected item.

Top actions:
- Add item;
- filter vendor/section;
- validate;
- print/export snapshot.

Final snapshot action is visually distinct from editing live timeline.

---

# 16. Inbox `/inbox`

Primary question: **What did we capture that still needs classification/action?**

Default only `inbox` items, newest/relevant first.

Each row/card:
- captured text/URL;
- captured by/date;
- optional detected hint;
- actions: Convert / Open / Archive.

Converted/history is secondary filter.

Do not turn Inbox into a permanent long-form notes system.

---

# 17. Search

Global overlay or `/search`.

Input receives focus immediately.

Results grouped:
- Venues
- Vendors
- Guests
- Tasks/Decisions
- Documents
- Inbox

Each result shows enough context to disambiguate but not private detail beyond the authorized project screen.

Offline banner: `Searching cached data only`.

Enter/open returns to canonical route.

---

# 18. Map `/map`

Map is useful visual context, not a data dead-end.

Desktop:

```text
┌───────────────────────────────┬────────────────────────────────────┐
│ Filters / venue result list   │ MAP                                │
│ S29 ...                       │ pins                               │
│ S30 ...                       │                                    │
│ S32 ...                       │ selected pin summary               │
└───────────────────────────────┴────────────────────────────────────┘
```

Selecting list↔pin stays synchronized.

Map failure replaces map pane with clear fallback and retains venue list/access facts.

Mobile may use list↔map toggle instead of split pane.

---

# 19. Documents `/documents`

Primary question: **Find/review the right wedding document or contract version.**

Default filters:
- type;
- linked entity;
- review state;
- recent.

Rows/cards show:
- title/type;
- linked entity;
- date/version status;
- review state;
- not raw storage path/hash.

Document detail route owns:
- preview/download;
- version lineage;
- links;
- contract readiness checks where applicable;
- evidence/source relation;
- history.

---

# 20. Import wizard `/import`

Dedicated focused workflow:

```text
1 Select
2 Detect
3 Map
4 Validate
5 Duplicates/conflicts
6 Preview
7 Apply
8 Report
```

At Preview:
- create/update/unchanged/conflict/error counts;
- important field-level samples;
- explicit statement: `No project data has changed yet`.

Do not combine mapping, duplicate resolution and final commit into one huge grid.

---

# 21. Export / backup / restore

Export page groups by intent:

### Share/use data
CSV/XLSX/module JSON/research export.

### Portable backup
Plain/encrypted `.mariage`.

### Operational print
Seating/timeline/vendor packets where supported.

Restore is a separate high-risk workflow:
`Choose → Inspect/Decrypt → Verify → Compatibility → Recovery target → Confirm → Restore report`.

Never place destructive restore next to ordinary CSV download without separation.

---

# 22. Settings

Settings home is grouped:
- Project
- Members & security
- Criteria
- Reference locations
- Offline/storage
- Backup
- Diagnostics
- Danger zone

Each category has a dedicated page/section.

Danger actions are isolated at bottom/own route and never visually adjacent to ordinary preferences.

---

# 23. Cross-screen continuity rules

- Entity names/codes/status treatments are consistent across Dashboard/Search/Map/Lists/Details.
- “Open venue” always leads to canonical Venue Detail, not a duplicate summary page.
- Search/Inbox/Dashboard are accelerators into domain workflows.
- Completing a linked task/decision updates parent summaries without forcing manual refresh.
- Back from detail returns to prior filtered collection state where feasible.
- Opening source/document and returning preserves in-progress context.
- Offline/pending/conflict status language is identical across modules.

---

# 24. Visual design implementation checkpoint

Before a major screen reaches `ACCEPTED`, retain synthetic-data screenshots at:
- desktop normal width;
- narrow mobile;
- important empty state;
- important error/offline state;
- any dense data mode.

Checkpoint reviewer compares them against this blueprint and `UX-ARCHITECTURE.md`, not merely against whether all fields exist.
