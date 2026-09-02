# Dashboard Feature Contract

## Purpose

The dashboard is the couple's operational cockpit. It answers “where are we and what should we do next?” without requiring navigation through every module.

## Required sections, in priority order

1. Wedding countdown/current phase
2. Next best action
3. Blocking issues
4. Decisions to make together
5. Waiting on external parties
6. Upcoming deadlines (default horizon: 14 days)
7. Budget summary
8. Progress by major area
9. Meaningful changes since the member's last visit

Do not add decorative analytics that push these below the fold unnecessarily.

## Next best action

Derived from task/decision/missing-info state using explainable factors:

- urgency/overdue;
- importance;
- blocking impact;
- current phase;
- due date;
- actionability.

UI displays a human reason, e.g.:

> Relance S29 aujourd'hui — devis attendu depuis 8 jours et décision salle bloquée.

## Blockers

Only actual blockers/high-risk unknowns appear as blockers. Avoid alert fatigue.

Examples:

- no venue/date confirmed;
- candidate final decision blocked by unavailable quote;
- payment overdue;
- critical criterion unresolved.

## Joint decisions

Show count and top items requiring both owners. Clicking opens Decisions filtered to joint pending.

## Waiting

Shows external dependencies separately from work the couple has failed to do.

Example:

`S32 — waiting for quote · 6 days · follow-up tomorrow`

## Budget widget

At minimum:

- probable/active-scenario expected total;
- contracted amount;
- paid amount;
- upcoming due amount;
- contingency/reserve if configured.

Never conflate refundable cautions with final cost.

## Progress

Weighted milestone progress by major area, for example:

- Venue/date
- Catering
- Guests
- Vendors
- Logistics
- Finalization

## Since your last visit

Show meaningful changes by the other member:

- status/decision changes;
- quote/price changes;
- new important documents;
- completed/assigned tasks;
- new comments requiring input.

Avoid flooding with low-level autosave audit noise.

## Phase awareness

Dashboard priorities change over time. At J-300 venue/date dominates; at J-7 operational timeline/payments dominate. Phase rules will be explicit in planning/milestones configuration.

## Empty state

A new project dashboard guides initial setup: target date/range, guest target, budget, criteria and first import/add action.

## Offline

Render cached dashboard state with a visible freshness/sync indicator. Do not pretend live external waiting/availability is current when offline.

## Acceptance criteria

- couple can identify next useful action in <30 seconds;
- no raw technical sync errors shown;
- budget values match BudgetEngine;
- counts link to filtered source views;
- mobile layout prioritizes action/decision/budget without dense tables;
- stale/offline state is visible;
- member-specific “since last visit” does not include own changes as partner changes.
