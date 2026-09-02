# Tasks and Decisions Domain

Tasks and decisions solve different problems and must remain separate concepts.

## Tasks

A task represents an action to perform.

Core fields:

- internal UUID;
- project ID;
- title;
- optional description;
- status;
- priority;
- owner: member / both / external placeholder where useful;
- due date/time;
- waiting-for metadata;
- blocker/dependency metadata;
- linked entities;
- recurrence only when explicitly supported;
- created/updated/revision metadata.

## Task statuses

- todo;
- in_progress;
- waiting_external;
- blocked;
- done;
- cancelled.

### Waiting external

Requires at least a meaningful awaited party/reason. Normally includes `waiting_since` and optional/expected follow-up date.

### Blocked

Records dependency or blocker reason. A blocked task should not be presented as ordinary overdue work when the user cannot act yet.

## Task dependencies

Keep V1 dependency semantics simple and acyclic where possible.

Examples:

`Reserve caterer` depends on:

- wedding date selected;
- venue compatibility/selection sufficient for booking.

The system should warn against direct dependency cycles.

## Next-best-action scoring

Task prioritization may consider:

- overdue state;
- due-date proximity;
- explicit importance;
- number/importance of blocked dependents;
- project phase relevance.

The UI should translate this into understandable groups such as `Now`, `Soon`, `Later`, not opaque numeric precision.

## Decisions

A decision represents a choice/question, not work itself.

Core fields:

- question/title;
- context;
- options;
- deadline;
- linked entities;
- required approvers;
- partner comments/ratings where useful;
- selected result;
- rationale;
- lifecycle status;
- history/reopen metadata.

Examples:

- choose the venue;
- S29 versus S32;
- maximum flower budget;
- buffet versus table service.

## Joint decisions

A decision may require both primary owners.

It is not final while one required owner is pending.

## “Discuss together”

Any relevant object may create/link a lightweight joint-discussion decision/item without spamming the other partner with messages.

The weekly couple review surfaces these items.

## Decision lock and reopen

After a decision becomes operationally/contractually locked, reopening is explicit. Prior result and rationale remain in history.

## Task generation from missing information

The system may suggest tasks from missing/stale facts, but bulk automatic creation requires user review.

Example:

> 4 important venue facts are missing → “Create 4 questions/tasks”.

## External follow-up engine

When a request/quote has been waiting beyond the configured follow-up period, the system can suggest or activate a follow-up task without marking the original work as undone.

## Tests

Cover state transitions, ownership, waiting/blocking semantics, dependency cycles, idempotent completion, joint approvals, reopening, task suggestions and next-action ranking invariants.
