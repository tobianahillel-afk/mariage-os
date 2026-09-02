# Budget and Payments Domain

## Goals

The finance subsystem answers distinct questions:

- What do we expect the wedding to cost?
- What has been quoted?
- What have we committed contractually?
- What have we already paid?
- What remains due?
- When will money leave our accounts?
- Which scenarios change the total?

## Budget item

A budget item is an expected or committed cost component.

Core fields/concepts:

- project ID;
- category;
- label;
- linked venue/vendor/decision/scenario;
- calculation type;
- quantity/guest/table/hour assumptions;
- unit amount;
- estimated amount;
- quoted amount;
- approved/negotiated amount;
- contracted amount;
- confidence/source;
- required/optional flag;
- scenario applicability;
- notes.

## Categories

Initial configurable categories may include:

- venue;
- catering;
- photo/video;
- music;
- flowers/decor;
- attire;
- stationery;
- transport;
- accommodation;
- ceremony;
- gifts;
- administrative;
- contingency;
- other.

Categories are project-configurable and importable.

## Calculation types

At minimum:

- fixed;
- per_guest;
- per_adult;
- per_child;
- per_table;
- per_hour;
- quantity_unit;
- manual/quoted total;
- minimum-plus-variable where supported.

## Cost scenarios

Support named planning scenarios with assumptions such as:

- date;
- venue;
- guest count;
- selected vendor package;
- optional components.

The active operational scenario becomes explicit after relevant decisions are made.

## Minimum / probable / high

Where uncertainty exists, budget reporting may expose:

- minimum known;
- probable;
- reasonable high.

Assumptions must remain inspectable.

## Payments

A payment record represents planned or actual cash movement.

Fields include:

- budget/contract link;
- amount;
- due date;
- paid date;
- status;
- payment type: installment, deposit, refundable caution, refund/credit, final balance;
- evidence/document link;
- notes.

## Financial outputs

Derived dashboard totals include:

- planned/expected final cost;
- quoted total where meaningful;
- contracted total;
- amount paid;
- amount currently due/overdue;
- remaining contracted balance;
- refundable amount temporarily immobilized;
- next 30/60/90-day cash needs;
- contingency remaining.

## Variable guest impact

Changing planning guest count recalculates only components whose formulas depend on it.

A confirmed contracted fixed amount is not recalculated merely because a planning scenario changes unless contract pricing rules require it.

## Offer linkage

Venue/vendor offers can produce budget components. The system should avoid duplicating the same monetary truth in multiple manually editable places.

## Due-date tasks

Important upcoming payments may suggest/create tasks/calendar entries. Payment due dates remain financial records even if a task is dismissed/completed.

## Data integrity

Financial calculations require exact money semantics from `MONEY.md`.

## Privacy

Finance records are private/financial. Public or vendor exports use explicit allowlists and must not expose unrelated total-budget information.

## Tests

Test fixed/variable formulas, guest-count changes, quote-to-contract progression, deposits, cautions, refunds, overdue detection, monthly cash flow, scenario switching and export privacy.
