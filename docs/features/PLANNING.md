# Planning and Milestones Feature Contract

Status: **Normative V1 feature contract**

## Purpose

Track project progress from initial framing through post-wedding closure using weighted milestones, dependencies and phase-aware priorities.

## Phases

Initial guidance:

1. Framing
2. Venue & date
3. Core bookings
4. Guest/invitation preparation
5. Logistics/details
6. Finalization
7. Final week
8. Wedding day
9. Post-wedding closure

Phases can overlap and do not lock work artificially.

## Milestones

Milestones represent outcomes, not microtasks.

Examples:

- target budget agreed;
- venue/date confirmed;
- caterer contracted;
- invitations sent;
- RSVP closed;
- basic seating/table assignment ready;
- final seating plan validated;
- vendor balances scheduled;
- day-of information frozen/exported;
- refundable cautions recovered.

Each milestone persists:

- stable/system key where applicable;
- label;
- phase;
- importance weight;
- status;
- fixed target date and/or J±N rule;
- completion-rule type/parameters;
- milestone dependencies;
- linked tasks/decisions/entities;
- completion timestamp/history.

## Completion rules

Supported patterns include:

- manual validation;
- all linked tasks done;
- linked decision locked;
- linked entity reaches required lifecycle state;
- a documented supported custom rule.

Automatic completion is explainable and reversible if its source state becomes invalid; it cannot rely on hidden magic.

## Dependencies

Milestone dependencies are persisted. Cycles are rejected. A milestone can be marked blocked when a prerequisite outcome is incomplete.

## Progress

Progress is weighted by milestone importance, not count of tiny tasks. UI can explain contributing milestones/weights.

A blocked or invalidated milestone may reduce readiness appropriately; the app never permanently caches a stale percentage as independent truth.

## Wedding date changes

Relative J±N milestones recalculate against newly selected wedding date. Fixed contractual/manual dates do not move unless deliberately edited.

Candidate date scenarios can exist before final selection without rewriting the project timeline as if confirmed.

## Phase-aware dashboard

Current phase influences next-action priority and dashboard emphasis, but urgent blockers/deadlines can override phase defaults.

## Seating milestone

V1 includes the non-visual table-assignment workflow defined in `SEATING.md`.

`Final seating plan` readiness means the underlying structured assignments pass validation. A graphical floor-plan canvas is **not** required for V1.

## Final-week freeze/export

V1 must support producing a stable operational export/snapshot of critical final information (timeline/contact/seating lists as available) so already distributed information is not silently mutated in retrospect.

This is an export/snapshot concept, not a second mutable source of truth. Later edits show that the live plan differs from the previously generated snapshot.

A dedicated rich “wedding-day mode” remains post-V1 unless promoted separately.

## Post-wedding

Track:

- final balances;
- refundable cautions/returns;
- photo/album delivery;
- outstanding vendor follow-up;
- thank-you tasks;
- privacy cleanup/archive.

## Acceptance criteria

- relative milestone dates recalculate correctly on selected date change;
- fixed contractual deadlines remain fixed;
- dependency cycles rejected;
- completion rules deterministic/explainable;
- progress reproducible from source milestones;
- blocked milestones surface reason;
- final seating milestone reflects structured seating validity;
- phase-aware priorities do not suppress urgent work;
- operational export/snapshot remains identifiable as a snapshot rather than live mutable truth;
- no alert spam for low-priority distant milestones.