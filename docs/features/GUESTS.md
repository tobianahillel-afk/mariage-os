# Guests Feature Contract

## Purpose

Manage households, individual invitees, priorities, attendance probabilities, RSVP and logistics while preserving the statistical behavior of the existing guest workbook.

## Main views

- guest table;
- household view;
- statistics summary;
- RSVP status filters;
- priority/cumulative view;
- import/export center entry point.

## Table

Configurable columns may include:

- household;
- name;
- category;
- priority;
- probability;
- RSVP;
- people/age group;
- transport/accommodation need;
- table assignment later;
- notes.

Bulk actions must be safe, previewable/undoable for high-impact edits.

## Household view

Shows invitation unit and members, allowing partner/child-specific probability/priority when needed.

## Statistics

Required derived outputs:

- total people invited;
- households;
- expected attendance;
- confirmed attending;
- confirmed not attending;
- pending;
- cumulative expected/maximum counts for priorities 1, 1+2, 1+2+3, etc.;
- adult/child segmentation when populated.

Calculations follow documented RSVP precedence and probability semantics.

## RSVP workflow

Statuses are distinct from planning probability. Updating RSVP automatically affects confirmed/expected outputs according to rules but does not erase historical probability unless deliberately edited.

## Privacy

Personal columns are private. Sensitive logistics are not shown in exports that do not need them.

## Import

Existing Excel/CSV must be importable with preview, mapping, duplicates and external IDs where available.

Same-name guests are not automatically merged without adequate evidence.

## Acceptance criteria

- existing priority/probability planning can be reproduced from imported data;
- household members remain individual people for counts;
- RSVP update changes statistics correctly;
- 0/25/75/100% probabilities parse reliably;
- bulk update can be undone/reviewed;
- guest export respects privacy profile;
- 500 synthetic guests remain usable on supported devices.
