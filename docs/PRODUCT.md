# Product Specification

## Product statement

Mariage OS is a private, collaborative wedding operating system for a couple. It is designed to centralize planning while reducing cognitive load, duplicated work, lost information and indecision.

It is not merely a wedding checklist. It links facts, sources, decisions, actions, deadlines, budget effects and historical reasoning.

## Primary users

### Couple owners

Two primary owners share the same project. Each can:

- read and edit shared data;
- have individual ratings/favorites;
- own tasks;
- participate in decisions;
- work from multiple devices;
- work temporarily offline;
- see what changed since their previous visit.

Future optional roles may include viewer/editor access for a parent, planner or trusted helper, but V1 is optimized for two owners.

## Jobs to be done

### Daily

- Know the next useful action.
- See urgent blockers and external responses being awaited.
- Add or edit information quickly from a phone.
- Capture a venue/vendor/idea without filling a long form.

### Weekly couple review

- See decisions requiring both partners.
- Review overdue/blocked tasks.
- Review quotes and replies received.
- Review upcoming payments and deadlines.
- Compare current finalists.

### Decision-making

- Compare options on objective compatibility and subjective preference.
- Separate facts from estimates.
- See missing critical information.
- Understand the true expected cost, not only headline pricing.
- Preserve why an option was rejected or selected.

### Operational planning

- Track every major area from initial research through post-wedding closure.
- Connect tasks to venues/vendors/guests/budget/documents.
- Track external dependencies and follow-ups.

## Core product areas

1. Dashboard / cockpit
2. Venues
3. Map
4. Vendors, including caterers
5. Guests and households
6. Budget and payments
7. Tasks and waiting items
8. Decisions
9. Planning / milestones
10. Documents and media
11. Inbox / quick capture
12. Import/export
13. Settings, members, backups and diagnostics

Later phases may add seating, advanced transport/accommodation planning and a dedicated day-of mode.

## Dashboard promise

Within 30 seconds the dashboard should make clear:

- current phase;
- next best action;
- blocking issues;
- decisions to make together;
- items waiting on external parties;
- upcoming deadlines;
- budget planned/committed/paid;
- progress by major category;
- important changes made by the other partner.

## Information model philosophy

Important information is not represented as only a primitive value. Where relevant it also carries:

- state: known / unknown / not applicable / conflict;
- provenance/source;
- verification strength;
- observation date;
- freshness expectations;
- import provenance;
- history.

The product must distinguish:

- observed fact;
- retained/current value;
- estimate;
- partner opinion;
- derived/calculated value;
- contractual confirmation.

## Decision philosophy

The software supports human decisions but does not make emotional decisions on behalf of the couple.

Objective compatibility and subjective preference are separate concepts.

A venue may be objectively compatible but emotionally undesirable. A high numeric score can never override a blocking criterion or both partners' judgment.

## Progress philosophy

Progress is milestone-weighted, not simply `completed_tasks / total_tasks`.

Choosing a venue and signing a contract contributes more than selecting a decorative detail.

## Cost philosophy

The budget must distinguish at least:

- estimated;
- quoted;
- approved;
- contracted;
- partially paid;
- paid;
- refunded/cancelled where applicable.

It must distinguish cost from cash flow, and refundable deposits/cautions from final expected cost.

## Import philosophy

Existing structured data should never need manual re-entry.

Import must support preview, mapping, validation, duplicate detection, conflict handling, provenance and rollback. Missing rows in an imported file must never imply deletion by default.

## Privacy philosophy

Real project data belongs in the private cloud project, not the public code repository. The product stores only data useful for wedding planning, and sensitive information should be removable when no longer needed.

## Offline philosophy

The product is cloud-collaborative but local-first in interaction. A temporary loss of network must not prevent basic viewing, visit workflows, task completion or note capture for data already available locally.

## Success criteria

Mariage OS is successful when it becomes the couple's single operational source of truth without feeling like enterprise project-management software.
