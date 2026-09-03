# Basic Seating Plan Feature Contract

Status: **Normative V1 feature contract**

V1 includes a reliable non-visual table-assignment workflow. A drag-and-drop floor-plan canvas and automatic seating optimization remain post-V1.

## Goals

- create configurable seating sections;
- create reception tables and capacities;
- assign each attending/planned guest to at most one active table;
- identify unassigned guests and table capacity problems;
- support the event's separated seating configuration without modelling personal identity attributes unnecessarily;
- export/print a final seating list.

## Seating sections

Project-defined operational labels, for example:

- Men;
- Women;
- Children/family;
- Flexible/custom.

These are logistical event sections. The system must not infer broader identity information from them.

## Tables

Each table supports:

- name/number;
- section;
- capacity;
- optional shape;
- notes;
- sort order.

A table is not an invitation/RSVP entity; it references guests through assignments.

## Assignments

A guest has at most one active table assignment. Assignment states:

- `planned`;
- `confirmed`.

The UI shows:

- assigned count / table capacity;
- unassigned expected/attending guests;
- over-capacity error;
- guests whose RSVP change may invalidate the plan.

## RSVP interaction

When a guest becomes `not_attending`, an existing assignment is not silently destroyed. It is surfaced as obsolete/reviewable and can be removed/archived explicitly. When an unassigned guest becomes attending, seating readiness becomes incomplete.

## Capacity and finalization

Final/frozen seating export is blocked while:

- any table is over capacity;
- an attending guest required in the seating plan is unassigned;
- duplicate active assignments exist;
- a referenced guest/table is deleted or invalid.

## Import/export

CSV/XLSX/JSON import supports table definitions and guest assignments through stable IDs/mapping. Ambiguous guest matches require review.

Export supports at minimum:

- by table;
- alphabetical guest → table;
- by section;
- print-friendly list.

## Offline

Cached seating list is viewable offline. Structured assignment edits may queue offline using normal revision/conflict rules.

## Conflict semantics

Two devices assigning the same guest to different tables is an explicit conflict, never last-write-wins silently.

## Acceptance criteria

- guest cannot have two active assignments;
- cross-project guest/table assignment is impossible in DB;
- capacity count is deterministic;
- RSVP changes correctly invalidate readiness without deleting history;
- final export refuses known invalid assignment state;
- table assignment works on mobile and desktop;
- visual canvas is not required for V1 cutover.