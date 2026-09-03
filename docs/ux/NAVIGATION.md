# Mariage OS — Navigation Architecture

Status: **Normative V1 navigation contract**

This document defines destination hierarchy and navigation behavior. See `UX-ARCHITECTURE.md` for page-pattern rules and `SCREEN-BLUEPRINTS.md` for detailed composition.

## Goal

Mariage OS must feel like a calm wedding workspace rather than enterprise software or a database admin panel. Navigation is shallow, predictable and oriented around the couple's mental tasks.

---

## Desktop navigation

Persistent sidebar groups:

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

Global Search is a shell action (`Ctrl/Cmd+K` where available), not a permanent module occupying visual weight.

Global `+` is a shell quick-capture/create action.

Do not expose every sub-feature as a sidebar item. Entity-specific Quotes, Sources, Contract Readiness, Photos, etc. live in the relevant detail workspace.

---

## Mobile navigation

Persistent bottom navigation contains at most five destinations:

- Home
- Venues
- Tasks
- Budget
- More

`More` opens a grouped menu:

### Organize
- Vendors
- Guests
- Seating

### Pilot
- Decisions
- Planning
- Timeline

### Resources
- Map
- Documents
- Inbox
- Import / Export

### System
- Settings

Search remains globally reachable. Quick Add remains globally reachable where it does not interfere with a focused flow.

Venue Visit, Import, Restore and other focused workflows may suppress ordinary bottom navigation to reduce accidental context switching.

---

## Global quick add

Persistent `+` prioritizes low-friction capture:

- Inbox note / URL;
- venue;
- vendor;
- guest/household;
- task;
- decision;
- budget item/payment entry where context allows;
- document/photo.

Creation is minimal. The user is not forced through the complete domain form.

If user input is unstructured/uncertain, default to Inbox rather than forcing premature classification.

---

## Global Search

Consistent trigger, preferably `Ctrl/Cmd+K` desktop plus visible search icon/action.

Search covers authorized project-scoped:
- venues;
- vendors;
- guests/households where appropriate;
- tasks;
- decisions;
- document metadata;
- Inbox.

Results navigate to the canonical entity/detail/workflow. Search never creates a second source of truth.

Offline clearly labels cached-only scope.

---

## Deep links

Important routes are stable/deep-linkable, including:

- `/venues/<id>`
- `/vendors/<id>`
- `/guests/<id>`
- `/households/<id>`
- `/tasks/<id>`
- `/decisions/<id>`
- `/budget/items/<id>`
- `/budget/scenarios/<id>`
- `/documents/<id>`
- `/imports/<id>`

Refreshing returns to the same logical resource after authentication/member resolution.

An internal link shared with the other authorized owner opens the same resource after sign-in. Unauthorized users receive non-leaking not-found/permission behavior.

---

## Collection → detail → workflow pattern

Normal navigation follows:

```text
Collection / Dashboard / Search / Inbox
→ Detail or focused workspace
→ Contextual action/workflow
→ Completion
→ Return to meaningful parent/context
```

Examples:

```text
Venues → Venue detail → Compare → Joint decision → Selected venue
Guests → Guest detail → Seating → Final readiness
Vendor → Offer → Contract readiness → Budget/payment → Timeline
Dashboard → Next action → Task/entity detail → Complete → Dashboard
```

The app should feel directed, not like browsing unrelated modules.

---

## Back/context preservation

Browser Back/Forward must behave naturally.

Where practical preserve:
- collection filters;
- sort;
- active gallery/table mode;
- venue comparison selection;
- guest filters;
- scroll position;
- active entity section.

Do not return a user from Venue Detail to a reset/unfiltered venue list after every edit if the previous context can safely be restored.

Modal/drawer history must not create confusing Back loops.

---

## Entity detail navigation

Major entity details use grouped sections rather than exposing every DB field at once.

Venue groups are defined by `SCREEN-BLUEPRINTS.md`:
- Evaluate;
- Commercial;
- Logistics;
- Evidence.

Mobile converts broad secondary navigation to progressive sections/accordions rather than a wide tab strip.

---

## Workspace-specific navigation

### Seating
Dedicated operational route. Desktop may use split panes. Mobile drills through Section → Table → Guest assignment.

### Timeline
Chronological operational route, not nested under Planning as a hidden tab. Planning and Timeline solve different mental jobs.

### Import/Restore
Dedicated focused workflows with step navigation. Ordinary global navigation may be visually reduced while the critical workflow is active.

### Settings
Grouped landing page. Danger zone remains isolated from ordinary project preferences.

---

## Dashboard relationship

Dashboard is a command/priority surface, not a second navigation tree and not a copy of every module.

Its cards link into canonical modules/workflows.

---

## Saved views / personal preferences

Per-user table columns and useful recurring view preferences may persist cross-device according to the personal-preferences model.

Saved views never alter shared project truth.

---

## Accessibility

- semantic navigation landmarks;
- keyboard operation;
- visible focus;
- selected state not color-only;
- touch-friendly mobile targets;
- no hover-only destination;
- screen-reader labels for icon-only global actions;
- focus moves appropriately after drawer/dialog/route transitions.

---

## Navigation anti-patterns prohibited

- separate desktop sidebar + full duplicate top menu;
- more than ~5 persistent mobile bottom destinations;
- every entity sub-section as top-level route in the sidebar;
- ordinary work hidden only in Settings;
- mobile requiring desktop table navigation;
- landing every workflow back on Dashboard regardless of origin;
- Search results opening duplicate “search detail” pages rather than canonical resources;
- modal chains used as substitute for route architecture;
- critical action accessible only through an obscure overflow menu.
