# Budget Feature Contract

## Purpose

Provide a trustworthy financial view that separates estimate, commitment, cash paid and future cash requirements, while supporting scenario comparison.

## Main views

- budget summary;
- line-item table;
- category breakdown;
- payment schedule/cash-flow view;
- scenario comparison.

## Header summary

At minimum:

- expected/probable total;
- contracted total;
- paid total;
- remaining contractual balance;
- upcoming amount due;
- refundable cautions tracked separately;
- contingency remaining.

## Line items

Each item shows calculation basis and state, not only one number.

Example:

`Catering · 110 €/adult × 175 planning guests · Quote · 19,250 €`

## Scenarios

Users can compare, for example:

- S29 + 175 guests + target date A;
- S32 + 175 guests + target date A;
- S32 + 195 guests + target date B.

Scenario recalculation does not overwrite contracted actuals.

## Date-aware pricing

Applicable venue/vendor offers are selected according to documented date/day validity and assumptions.

## Payments

Payment timeline shows due/paid/overdue installments and evidence links.

A payment task may be suggested without duplicating the financial due-date source.

## Cost transparency

Comparison should expose hidden/mandatory extras such as cleaning, security, furniture, shuttle and overtime.

## Cash flow

Monthly/period view shows expected outgoing cash, including refundable cautions separately.

## Acceptance criteria

- exact money semantics prevent cent drift;
- guest-count change updates only variable components;
- refundable caution is excluded from expected final cost but visible in cash needs;
- quote/contract/paid states remain separate;
- scenario comparisons explain assumptions;
- changing wedding date recalculates/invalidates relevant offers safely;
- privacy exports never expose total budget unless explicitly allowed.
