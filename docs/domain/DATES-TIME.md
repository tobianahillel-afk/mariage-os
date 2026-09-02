# Date, Time and Timezone Rules

Status: **Normative V1 temporal contract**

## Project timezone

Each project has one canonical planning timezone. Initial default: `Europe/Paris`.

## Distinct temporal concepts

Never collapse all temporal values into generic timestamps.

### Date-only

Examples:

- candidate/selected wedding date;
- quote validity date;
- RSVP deadline;
- accommodation check-in date when time is irrelevant.

Stored/transported as ISO `YYYY-MM-DD`.

### Local time-only

Examples:

- ceremony local start time;
- access time;
- music curfew when paired with event day-offset.

Canonical form `HH:mm[:ss]`.

### Instant/timestamp

Examples:

- record creation;
- source verification;
- synchronization acknowledgement;
- audit event.

Store as timezone-aware instant (`timestamptz`), transport ISO-8601, normally UTC, localize for display.

### Local date-time tied to event timezone

Examples:

- venue visit appointment;
- timed contractual deadline.

Store enough information to reconstruct intended local time in project/event timezone.

## Candidate and selected wedding dates

Before final selection, the project can contain several `wedding_date_options` with statuses:

- `candidate`;
- `selected`;
- `rejected`;
- `archived`.

Exactly zero or one active option is selected. Selection is an atomic protected transition. Venue availability and budget scenarios may reference candidate options before final choice.

Changing the selected date triggers documented dependency invalidation/recalculation. It does **not** rewrite fixed contractual deadlines.

## Weekday integer convention

Frozen V1 mapping in database, TypeScript and imports:

| Integer | Day |
|---:|---|
| 0 | Sunday |
| 1 | Monday |
| 2 | Tuesday |
| 3 | Wednesday |
| 4 | Thursday |
| 5 | Friday |
| 6 | Saturday |

Therefore canonical `weekday=6` means Saturday.

If an imported source uses ISO weekday numbering (Monday=1 ... Sunday=7), mapping must explicitly convert to Mariage OS convention during preview. Never silently reinterpret.

## Midnight and next-day wedding events

An event at `01:30` after a reception beginning the previous evening belongs to the following civil day.

For operational time windows that can cross midnight, represent:

- local time;
- day offset relative to event date.

Example:

```text
music_end_time = 01:30
music_end_day_offset = 1
```

Same rule applies to venue included end time and day-of schedule entries.

## DST

Conversions use IANA timezones, never fixed UTC offset assumptions.

`Europe/Paris` may be UTC+1 or UTC+2 depending on date.

For a nonexistent/ambiguous local time around DST, UI/import must surface the ambiguity rather than silently shifting a contractual/event time.

## Locale

Default display locale: `fr-FR`; canonical machine values remain ISO/normalized.

Example:

- UI: `3 avril 2027`;
- stored: `2027-04-03`.

## Imported dates

`03/04/2027` under confirmed `fr-FR` means 3 April 2027.

If metadata/content suggests another locale or confidence is insufficient, preview flags ambiguity and blocks silent commit for critical dates.

Spreadsheet serial dates must be interpreted through the workbook/date-system metadata and normalized before preview; raw serial number is never treated as an ISO date.

## Relative deadlines

Milestones can be `J±N`. Persist the offset/rule if the date should recalculate with selected wedding date.

A manually fixed/contractual deadline remains fixed unless deliberately edited.

## Freshness

Evidence freshness uses its own verification/observed timestamps, not entity `updated_at`.

## Client clocks

Client clock can support UX ordering/drafts, but never decides synchronization truth on its own. Server revisions/acknowledgements control concurrency.

## Tests

Temporal suite includes:

- weekday mapping including Saturday/Sunday pricing;
- DST spring/fall transitions;
- leap year;
- month/year boundaries;
- after-midnight day offset;
- ambiguous French/US imports;
- Excel date systems/serials;
- project/device timezone mismatch;
- candidate→selected date transition;
- date-change dependent recalculation;
- fixed contractual deadlines unaffected by planning-date changes.