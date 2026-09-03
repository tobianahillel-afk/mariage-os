# Venues Feature Contract

## Primary jobs

- capture a venue quickly;
- decide whether it is worth deeper research;
- centralize photos/facts/sources/prices/contact history;
- identify missing critical information;
- compare finalists;
- track quote/visit/selection progress;
- preserve rejection reason/history.

## Main views

### Gallery

Visual discovery/shortlist view. Each card shows:

- main photo;
- code/name/location;
- lifecycle/status;
- both partners' favorites/ratings summary;
- critical badges such as capacity/external caterer/two-floor-fit/view;
- quote state and next action where useful.

### Table

Dense comparison/work view with configurable columns, sorting, filtering, resizing and saved personal preferences.

Pinned identity columns: code/name/status/photo or equivalent.

### Compare

Select ideally 2–5 venues. Show blocking criteria first, then objective facts/cost/access, then partner ratings and missing information.

Support `show differences only`.

### Detail

Sections:

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

## Summary screen

Must fit the most important decision state into approximately one desktop viewport:

- current status;
- compatibility/blocking status;
- probable cost impact;
- both partner ratings;
- critical facts;
- completeness/readiness;
- missing critical items;
- quote/availability status;
- next action;
- top strengths/reservations.

## Add venue

Quick add accepts as little as a name/URL. Record starts incomplete and may be enriched later.

Duplicate detector warns based on external ID, website, address and normalized name/city.

## Facts

Each important fact supports source/confidence/freshness view. Unknown/conflict states are explicit.

## Missing information

Venue detail provides a dedicated “To verify” section grouped by critical/important/optional.

Button may propose tasks/questions from missing/stale/conflicting critical facts.

## Photos

Gallery supports categories and distinction between:

- external/official reference;
- archived private copy;
- couple's own visit photo.

Empty-room images should be easily filterable to judge inherent architecture.

## Visit mode

Mobile-focused mode:

- take photo;
- note;
- measurement;
- generated questions;
- individual rating;
- finish-visit summary.

Checklist uses universal questions + project criteria + unknown/stale/conflicting venue data.

## Decisions/status

Reject action requires/recommends a reason category/text and is reversible. Selected/confirmed transitions follow state machine and approval requirements.

## Access

Venue page supports address, coordinates, nearest TGV station data, stored accessibility observations and generated Google Maps route link from selected project reference address.

## Acceptance criteria

- S/P-style human codes sort naturally;
- commercial venue capacity is not confused with main-space capacity;
- a failed blocking criterion is clearly visible regardless of score;
- rejected venues remain searchable/history-visible;
- at least two partner ratings remain independent;
- imported data keeps provenance;
- visit workflow functions with cached venue while offline;
- table/gallery/detail reflect synchronized updates without full-page manual reload.
