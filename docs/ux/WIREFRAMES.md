# Mariage OS — Functional Wireframes

Status: **Supporting low-fidelity wireframe reference**

The normative UX architecture is:

1. `UX-ARCHITECTURE.md` — page taxonomy, information hierarchy and interaction-pattern rules;
2. `SCREEN-BLUEPRINTS.md` — detailed composition for major V1 screens;
3. `SCREEN-CONTRACTS.md` — route/action/state requirements;
4. this file — compact low-fidelity visual reminders only.

If a sketch here appears less complete than `SCREEN-BLUEPRINTS.md`, the blueprint controls.

---

## Desktop shell

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Mariage OS       Search ⌘K                               Sync ✓    Profile  │
├────────────────┬────────────────────────────────────────────────────────────┤
│ Home           │ PAGE HEADER                                                │
│ Dashboard      │                                                            │
│                │ CURRENT SCREEN                                             │
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
│ Settings       │                                                            │
└────────────────┴────────────────────────────────────────────────────────────┘
```

---

## Mobile shell

```text
┌──────────────────────────────┐
│ ← Screen title      Sync / ○ │
│                              │
│ CONTENT                      │
│                              │
│                         [+]  │
├──────────────────────────────┤
│ Home Venues Tasks Budget More│
└──────────────────────────────┘
```

Focused workflows such as Visit, Import and Restore may hide ordinary bottom navigation.

---

## Dashboard

```text
J-___ ❤️                                      Current phase

┌────────────────────────────────────────────────────────────┐
│ NEXT USEFUL ACTION                                         │
│ Relance S29 aujourd’hui                                    │
│ Why: finalist + quote overdue + venue decision blocked     │
│                                             [Open]         │
└────────────────────────────────────────────────────────────┘

[Blockers] [Decide together]
[Waiting external] [Upcoming]

Budget: Expected | Contracted | Paid | Remaining | Next due

Weighted progress
Since your last visit
```

No full module tables belong on Dashboard.

---

## Venues gallery

```text
Venues                                      [+ Add] [Import]
[Gallery] [Table] [Compare]   Search   Filters   Sort

┌──────────────────┐ ┌──────────────────┐
│ PHOTO            │ │ PHOTO            │
│ S29 Name         │ │ S30 Name         │
│ Finalist         │ │ Shortlist        │
│ 0 blockers       │ │ 0 blockers       │
│ 200p · 300m²     │ │ 200p · 420m²     │
│ quote waiting    │ │ quote received   │
│ ♥ A9 · B8        │ │ ♥ A9 · B9        │
│ missing: 3       │ │ missing: 1       │
└──────────────────┘ └──────────────────┘
```

Cards contain only decision-relevant summary data.

---

## Venue detail

```text
← Venues

[Hero image]  S29 — Venue Name                      [Finalist ▼]
              City / Region
              A ♥ 9/10    B ♥ 8/10

Compatibility   Price context   Access   Missing critical
0 blockers      €___             ___      3

NEXT ACTION: Verify two dance areas at 190 guests      [Open]

Strengths                         Reservations
• ...                             • ...

Evaluate | Commercial | Logistics | Evidence
```

Details are progressively revealed below; raw evidence/history does not dominate above the fold.

---

## Venue compare

```text
Compare finalists      Scenario: 185 guests · June 14
[Only differences ✓]

Criterion             S29          S30          S32
BLOCKERS
External caterer      ✓            ✓            ✕
2 dance areas         ?            ✓            ✓
Capacity              200          220          200

COST / ACCESS / EVIDENCE
...

Partner ratings       A9/B8        A9/B9        A7/B8
```

Mobile compares a smaller set/criterion cards rather than a five-column matrix.

---

## Guests

```text
Guests
Invited ___ | Expected ___ | Confirmed ___ | RSVP pending ___ | Unassigned ___

Filters ...                                               [Import]

Name / Household | Priority | Probability | RSVP | Seating | Alert
...
```

Sensitive/rare fields stay out of default columns.

---

## Seating desktop

```text
Readiness: 172/180 assigned · 8 unassigned · 1 warning

┌────────────────────┬────────────────────────┬──────────────────────┐
│ UNASSIGNED         │ SECTIONS / TABLES      │ SELECTED TABLE       │
│ Guest A            │ Men                    │ M3 · 8/10            │
│ Guest B            │  M1 10/10              │ • Guest ...          │
│ ...                │  M2 9/10               │                      │
│                    │  M3 8/10 ←             │ [Assign] [Move]      │
└────────────────────┴────────────────────────┴──────────────────────┘
```

No graphical floor-plan canvas in V1.

---

## Budget

```text
Active scenario: June 14 · S29 · 185 guests ▼

Expected      Contracted      Paid      Remaining      Refundable
€___          €___            €___      €___           €___

Upcoming payments / overdue
Category summary
Key uncertainties

[Overview] [Items] [Scenarios] [Payments/Cash flow]
```

Do not collapse scenarios, quotes and payments into one ambiguous grid.

---

## Timeline

```text
Wedding timeline                     [+ Add] [Validate] [Export]

DAY 0
15:00 Venue access        confirmed       Venue
16:00 Caterer arrival     confirmed       Caterer
18:00 Ceremony            confirmed       Garden
19:00 Cocktail            draft           Terrace

DAY +1
00:30 Dancing             confirmed
01:30 Music end           confirmed
```

Warnings attach to affected events.

---

## Import workflow

```text
Select → Detect → Map → Validate → Duplicates → Preview → Apply → Report

Import guests.xlsx
Create 17 | Update 41 | Same 150 | Conflicts 2 | Errors 2

No project data has changed yet.

[Review conflicts] [Review errors]                  [Apply]
```

---

## Conflict resolution

```text
This changed in two places.

Tables included
Cloud / Partner A: 20
Local / Partner B: 22

[Keep 20] [Keep 22] [Mark to verify]
```

Use domain language, not revision/HTTP terminology.

---

## Universal variants

Every major blueprint has applicable variants for:
- loading;
- cached + refreshing;
- empty;
- partial;
- offline;
- pending sync;
- conflict;
- retryable error;
- permission/not-found;
- mobile;
- desktop;
- keyboard/focus.

A happy-path wireframe alone is never sufficient acceptance evidence.
