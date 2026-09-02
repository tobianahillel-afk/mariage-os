# Tasks Feature Contract

## Purpose

Tasks answer “what must be done, by whom, and when?” without confusing external waiting or joint decisions with ordinary unfinished work.

## Views

- My tasks
- Partner tasks
- Together
- Waiting external
- Blocked
- Overdue
- Upcoming
- All

Optional board representation may coexist with list view, but simple mobile usability is primary.

## Task card/list item

Shows:

- title;
- owner;
- due date;
- status;
- importance;
- linked entity;
- blocker/waiting indicator;
- next relevant action.

## Creation

Quick add requires only title. Additional metadata can be filled later.

Tasks can be created from:

- manual action;
- venue/vendor missing information suggestion;
- follow-up suggestion;
- milestone/deadline template;
- payment due event.

Automatic suggestion must not create noisy duplicate tasks silently.

## Waiting external

Displays who/what is awaited, since when and follow-up date.

Example:

`S29 quote · waiting for venue · 8 days · follow up today`

## Blocked

Displays reason/dependency. Blocked work is not treated as a user failure simply because its nominal deadline passes.

## Ownership

Task can belong to:

- owner A;
- owner B;
- both;
- optionally delegated external helper reference.

Members can reassign/take tasks with history.

## Next action

Dashboard ranking is explainable from urgency, impact and blocking/dependency data.

## Acceptance criteria

- completing task twice is idempotent;
- waiting/blocked states require meaningful metadata;
- dependency cycle is prevented/warned;
- task linked to deleted/rejected entity remains intelligible or is handled according to link policy;
- offline completion persists and syncs;
- same task concurrent edits use sync conflict policy;
- duplicate auto-suggestions are avoided.
