# Functional Wireframes

These are low-fidelity information/layout contracts. Visual design can evolve, but required hierarchy should remain.

## Desktop shell

```text
┌────────────────────────────────────────────────────────────────────┐
│ Mariage OS                         Search        Sync ✓     Profile │
├──────────────┬─────────────────────────────────────────────────────┤
│ Dashboard    │                                                     │
│              │                 CURRENT SCREEN                      │
│ PREPARE      │                                                     │
│ Venues       │                                                     │
│ Vendors      │                                                     │
│ Guests       │                                                     │
│              │                                                     │
│ PILOT        │                                                     │
│ Tasks        │                                                     │
│ Decisions    │                                                     │
│ Budget       │                                                     │
│ Planning     │                                                     │
│              │                                                     │
│ RESOURCES    │                                                     │
│ Map          │                                                     │
│ Documents    │                                                     │
│ Inbox        │                                                     │
│              │                                                     │
│ Settings     │                                             [+]     │
└──────────────┴─────────────────────────────────────────────────────┘
```

## Mobile shell

```text
┌──────────────────────────────┐
│ Screen title         Sync ✓  │
│                              │
│         CONTENT              │
│                              │
│                         [+]  │
├──────────────────────────────┤
│ Home Venues Tasks Budget More│
└──────────────────────────────┘
```

## Dashboard

```text
J-___ ❤️                Current phase

┌──────────────────────────────────────┐
│ NEXT BEST ACTION                     │
│ Relance S29 today                    │
│ Why: quote overdue + venue decision  │
└──────────────────────────────────────┘

Blockers (2)          Decide together (3)
Waiting external (4) Upcoming 14 days (5)

Budget
Expected | Contracted | Paid | Next due

Progress by area

Since your last visit
```

## Venues gallery

```text
[ Gallery ] [ Table ] [ Compare ]     Filters

┌───────────────┐ ┌───────────────┐
│ PHOTO         │ │ PHOTO         │
│ S32 Name      │ │ S35 Name      │
│ KEEP          │ │ KEEP          │
│ 300m² 270p    │ │ 300m² 200p    │
│ Caterer ✓     │ │ Caterer ✓     │
│ H:9 P:8       │ │ H:9 P:9       │
│ Missing: 3    │ │ Missing: 2    │
└───────────────┘ └───────────────┘
```

## Venue detail

```text
PHOTO   S32 – Venue Name                     KEEP
        City / Region             H 9.0  P 8.5

Compatibility: blockers 6/6 ✓   Estimated impact: €___
Readiness: 87%                    Quote: waiting
Next action: Ask for June price

Strengths                     Reservations
• ...                         • ...

[Summary][Photos][Spaces][Prices][Included][Catering][Access]
[Technical][Quotes][Documents][Sources][History]
```

## Venue visit mobile

```text
S35 — VISIT                 Offline available ✓

Questions         4 remaining
[ Take photo ]
[ Add note ]
[ Add measurement ]
[ Answer questions ]
[ My rating ]

[ Finish visit ]
```

## Import preview

```text
Import guests.xlsx
Detected: Guests · 212 rows

Create 17 | Update 41 | Same 150 | Conflicts 2 | Errors 2

Mapping
File column       → Mariage OS field        Confidence
Prio              → Priority                High
Prob              → Attendance probability Certain

[Review conflicts] [Review errors]

No data has been changed yet.
                         [Apply 208 valid changes]
```

## Conflict modal

```text
This information changed on two devices.

Tables included
Cloud/Hillel: 20     Local/Partner: 22

[Keep 20] [Keep 22] [Mark to verify]
```

## Weekly couple review

```text
THIS WEEK ❤️

Decisions together    3
Overdue actionable    2
Waiting external      4
Payments next 30d     €____
Important changes     6

[Start review]
```

## Universal state requirements

Each wireframe must have designed variants for:

- loading;
- empty;
- error;
- offline;
- permission denied;
- conflict;
- partial data;
- mobile keyboard/touch.

High-fidelity visual design should preserve this information hierarchy rather than expose all available fields at once.
