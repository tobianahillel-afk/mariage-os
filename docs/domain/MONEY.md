# Money and Financial Semantics

## Currency

Each project has a primary currency, initially expected to be `EUR`.

Every monetary amount must carry or inherit a currency unambiguously.

## Representation

Do not use JavaScript floating-point numbers as the authoritative representation for money calculations.

Preferred options:

- integer minor units for simple currencies such as EUR cents; or
- exact PostgreSQL numeric/decimal with a matching exact application abstraction.

The chosen implementation must be consistent across calculations, imports, exports and tests.

## Amount categories

Financial UI must distinguish:

- estimate;
- quoted amount;
- negotiated/approved amount;
- contracted amount;
- amount paid;
- refund/credit;
- refundable caution/deposit where it is not expected to become cost.

## Cost versus cash flow

A refundable €2,000 caution may be a cash outflow but should not inflate the expected final wedding cost if expected to be returned.

Therefore budget reporting separates:

- expected final cost;
- contractual commitments;
- cash already paid;
- upcoming cash due;
- refundable cash temporarily immobilized.

## Calculation types

Budget components may use:

- fixed;
- per_guest;
- per_adult;
- per_child;
- per_table;
- per_hour;
- quantity × unit price;
- tiered/minimum-charge rules;
- optional/manual amount.

Each pricing component must state its calculation type explicitly.

## Guest-variable costs

A per-guest cost recalculates from the scenario/input guest population appropriate to the component. Do not assume every guest is billed at the same rate.

Future-supported distinctions may include adults, children, babies, vendor meals or complimentary places.

## Rounding

Rounding behavior must be explicit and testable. Do not repeatedly round intermediate calculations unless the underlying commercial rule requires it.

Display rounding and authoritative calculation rounding are separate concerns.

## Taxes

An amount must state whether tax is included, excluded, unknown or not applicable when relevant.

Do not infer VAT status from display formatting alone.

## Deposits and installments

Payments are separate records linked to a budget/contractual item.

Example:

```text
Venue contracted total: €10,000
Deposit paid: €3,000
Second installment: €2,000
Remaining contractual balance: €5,000
```

## Refunds and credits

Refund/credit records have explicit semantics rather than being represented as unexplained negative ordinary payments.

## Currency formatting

Machine representation is locale-neutral. UI display follows project locale, e.g. `9 500,00 €` for `fr-FR` where appropriate.

## Imports

Import parser must understand common French forms:

- `9 500 €`
- `9 500,50 €`
- `9500,50`

Preview must flag values whose currency or decimal interpretation is ambiguous.

## Scenarios

Scenario totals may expose:

- minimum known cost;
- probable cost;
- reasonable high scenario.

The calculation assumptions must be inspectable.

## Tests

At minimum test:

- zero;
- large values;
- fractional euros/cents;
- fixed and variable calculations;
- minimum charges;
- discounts/credits;
- deposits and refunds;
- child/adult variants where supported;
- guest-count changes;
- tax-inclusive/exclusive rules;
- imported French numeric formats;
- no floating-point cent drift.
