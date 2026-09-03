# Wedding Event Timeline Feature Contract

Status: **Normative V1 feature contract**

## Purpose

Represent the actual wedding-day/reception sequence as structured operational data. Milestones answer “is preparation complete?”; event timeline answers “what happens when, where and with whom?”

A rich dedicated command-center “Wedding Day Mode” remains post-V1, but V1 must be able to build, validate, print and export a reliable final timeline.

## Timeline item

Each item can store:

- title;
- description/notes;
- local start time;
- start day offset from selected wedding date;
- local end time/day offset where known;
- status: `draft`, `confirmed`, `cancelled`;
- sort order for items without exact time;
- location label and optional linked venue/venue space;
- linked vendor(s)/contact(s);
- owner/responsible person label or project member where useful;
- audience/section label where useful;
- setup/arrival buffer notes;
- dependency on another timeline item when operationally useful;
- source/confirmation note where timing is contractual.

## Examples

- venue access/setup;
- vendor arrival;
- chuppah/cérémonie;
- cocktail;
- guest seating;
- couple entrance;
- first dance / dancing blocks;
- meal courses/buffet opening;
- speeches;
- dessert/cake;
- music curfew;
- shuttle departures;
- venue handover/end.

## Time semantics

Use `DATES-TIME.md`:

- `20:00 dayOffset=0` = wedding-date evening;
- `01:30 dayOffset=1` = following civil day.

An end must not logically precede its start after applying offsets.

## Conflicts/warnings

Timeline validation surfaces:

- overlapping items that share a required exclusive resource/vendor/location when known;
- vendor arrival after their required activity starts;
- item outside contracted venue access/music window when data exists;
- impossible negative duration;
- missing time on an item marked confirmed where timing is required;
- dependencies whose predecessor occurs later.

Warnings do not invent assumptions when required underlying data is unknown.

## Vendor/contact packet

A vendor-specific timeline export includes only items relevant to that vendor plus explicitly allowed access/contact information. It must not expose unrelated project budget/private notes.

## Final snapshot

Before distribution, owners can generate a versioned final timeline snapshot/export. Later live edits do not silently alter already distributed snapshot; UI identifies that live data has changed since snapshot generation.

## Printing/export

V1 supports at minimum:

- chronological couple timeline;
- vendor-filtered schedule;
- concise print/PDF-friendly layout;
- structured JSON/CSV export where applicable;
- `.ics` export of selected timed entries where useful without requiring calendar-provider integration.

## Offline

Cached final/current timeline is available offline. Structured edits can queue offline according to sync rules. External links/maps may not work offline.

## Acceptance criteria

- after-midnight sequence sorts correctly;
- confirmed start/end validation deterministic;
- linked venue/vendor cannot belong to another project;
- vendor-specific export leaks no unrelated finance/guest/private note data;
- live changes after frozen export are detectable;
- timeline remains printable/useful without network;
- milestones and timeline are not conflated into one state model.