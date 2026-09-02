# Date, Time and Timezone Rules

## Project timezone

Each project has one canonical planning timezone. For the initial project this is expected to be `Europe/Paris`.

## Distinct temporal concepts

Do not collapse all temporal values into generic timestamps.

### Date-only

Examples:

- wedding date;
- quote validity date;
- RSVP deadline;
- accommodation check-in date when time is irrelevant.

Stored/transported as ISO date: `YYYY-MM-DD`.

### Local time-only

Examples:

- ceremony start time;
- music curfew time;
- venue access time when paired with a known event date.

Use explicit local-time semantics such as `HH:mm[:ss]`.

### Instant/timestamp

Examples:

- record creation;
- source verification timestamp;
- synchronization acknowledgement;
- audit event.

Store as timezone-aware timestamp/instant, normally UTC in transport/storage and localized for display.

### Local date-time tied to event timezone

Examples:

- venue visit appointment;
- payment deadline at a specific local clock time.

Store enough information to reconstruct the intended local time in the project/event timezone.

## Midnight and next-day wedding events

An event at `01:30` after a reception beginning the previous evening belongs operationally to the following calendar day.

The model must not represent “music until 01:30” as an ambiguous time-only fact when comparison/calendar logic needs the associated end-day offset.

Recommended representation for curfews:

- local time;
- day offset relative to event start date where relevant.

Example:

```text
music_end_time = 01:30
music_end_day_offset = 1
```

## DST

Conversions involving instants must use IANA timezones, not hard-coded UTC offsets.

`Europe/Paris` may be UTC+1 or UTC+2 depending on date.

## Locale

UI default locale is `fr-FR` for formatting, while canonical machine formats remain ISO.

Examples:

- display: `3 avril 2027`
- stored date: `2027-04-03`

## Imported dates

Imports must detect/preview ambiguous formats.

For `03/04/2027` under a confirmed `fr-FR` context, interpretation is 3 April 2027.

If file metadata/content suggests another locale or ambiguity cannot be resolved confidently, the preview must flag the value.

## Relative deadlines

Milestones may be defined relative to the wedding date, for example `J-30`. Store the rule/offset, not only the currently calculated absolute date, when ongoing recalculation is intended.

## Freshness timestamps

Source/fact freshness should use actual verification timestamps/dates, not only entity `updated_at`.

## Client clocks

Client clock values are useful for UX ordering but cannot be the sole authority for synchronization conflict order. Server revisions/acknowledgements remain authoritative where concurrency matters.

## Tests

Temporal tests must include:

- DST transitions;
- leap years;
- month/year boundaries;
- event end after midnight;
- ambiguous imported dates;
- project timezone conversion;
- relative deadlines before/after date changes;
- device timezone differing from project timezone.
