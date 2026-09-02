# Planning and Milestones Feature Contract

## Purpose

Track wedding progress from initial framing through post-wedding closure using weighted milestones and phase-aware priorities.

## Phases

Initial phase model:

1. Framing
2. Venue & date
3. Core bookings
4. Guest/invitation preparation
5. Logistics/details
6. Finalization
7. Final week
8. Wedding day
9. Post-wedding closure

Phase boundaries may overlap; they are planning guidance rather than rigid locks.

## Milestones

Milestones are higher-level outcomes, not ordinary tasks.

Examples:

- target budget agreed;
- venue/date confirmed;
- caterer contracted;
- invitations sent;
- RSVP closed;
- seating plan final;
- vendor balances scheduled;
- day-of timeline frozen.

Each milestone may have:

- importance weight;
- target offset relative to wedding date;
- dependencies;
- completion rule;
- linked tasks/decisions.

## Progress

Progress is weighted by milestone importance and phase, not count of completed microtasks.

## Timeline

Shows absolute dates computed from wedding date/offsets where appropriate. If wedding date changes, relative milestone deadlines recalculate; manually fixed contractual deadlines do not.

## Phase-aware dashboard

Current phase influences next-action priority and dashboard emphasis.

## Freeze mode near wedding

A future/late V1 or V1.x operational feature may create a frozen snapshot of day-of contacts/timeline/plan distributed to vendors/helpers. Later edits do not silently alter already distributed snapshots.

## Post-wedding

Track:

- final balances;
- refundable cautions;
- returns;
- photo/album delivery;
- thank-you tasks;
- private-data cleanup/archive.

## Acceptance criteria

- changing wedding date correctly recalculates relative milestones;
- contractual fixed due dates remain fixed unless edited;
- progress weighting is explainable;
- blocked milestones surface blockers rather than falsely counting microtasks;
- dashboard priorities shift with phase;
- no alert spam for low-priority future milestones.
