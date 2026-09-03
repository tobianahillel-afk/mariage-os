# Money and Financial Semantics

Status: **Normative V1 finance value contract**

## Currency

Project has primary currency, V1 default EUR. Every authoritative monetary amount carries currency explicitly or inherits it from a documented same-currency parent context without ambiguity.

Cross-currency arithmetic/conversion is not implicit V1 behavior.

## Authoritative representation

V1 money is **integer minor units** plus ISO-4217 currency code.

Example:

```json
{ "minor": 950050, "currency": "EUR" }
```

represents €9,500.50.

Rules:

- PostgreSQL authoritative amount columns use integer minor units (`bigint`) where frozen schema defines them;
- TypeScript/domain uses exact integer semantics, not binary floating-point decimal currency;
- canonical JSON uses `{minor,currency}`;
- localized display strings are formatting only;
- parser decimal input converts once under explicit locale/currency rules and reports ambiguity.

No implementation may switch core V1 money to a different representation merely as a library preference without reviewed schema/format migration.

## Amount categories

Distinguish:

- estimated amount;
- quoted amount;
- negotiated/approved amount;
- contracted amount;
- payment/cash movement;
- refund/credit;
- refundable security deposit/caution;
- returned deposit;
- remaining contractual balance (derived).

These are semantically different and cannot collapse into one editable “price”.

## Cost versus cash flow

A refundable €2,000 caution is cash outflow/exposure but is excluded from expected final wedding cost while expected refundable. Reporting separates:

- expected final cost;
- contractual commitments;
- confirmed amount paid;
- local pending financial mutations where applicable;
- upcoming due cash;
- refundable cash temporarily immobilized.

## Calculation types

V1 supports at least:

- fixed;
- per_guest;
- per_adult;
- per_child;
- per_table;
- per_hour;
- quantity × unit price;
- minimum-plus-variable/tiered rule where specified;
- explicit quoted/manual total.

Each component declares formula/basis rather than hiding it in label text.

## Guest-variable basis

A variable component uses the scenario/basis explicitly assigned to it. Adults/children or other supported counted groups are not assumed equal automatically.

Changing planning guest count recalculates eligible scenario components and never silently rewrites a historical quote/contract quantity.

## Rounding

Authoritative conversion/calculation rounding is explicit and deterministic.

Principles:

- integer minor-unit fixed amounts need no decimal currency rounding;
- multiplication/division that can create fractional minor units defines a rounding rule at the correct commercial boundary;
- do not repeatedly round intermediate values unless contract formula requires it;
- display rounding never changes authoritative stored amount.

Lot 5 must document/test concrete rounding for every formula that can produce fractional minor units.

## Taxes

Relevant commercial amounts carry tax treatment:

- `included`;
- `excluded`;
- `unknown`;
- `not_applicable`.

When tax rate is known and computation is supported, rate is explicit. Unknown treatment remains unknown; VAT cannot be inferred from currency symbol/display or vendor type.

## Deposits/installments/final balance

Payments are separate cash-movement records tied to budget/contractual context.

Example:

```text
Contracted total: 1,000,000 cents (€10,000)
Deposit paid: 300,000
Second installment paid: 200,000
Remaining contractual balance: 500,000
```

Remaining value is derived from validated movements/contract semantics.

## Refunds/credits/deposit returns

Do not encode as unexplained negative ordinary payments. Use explicit movement type and link/reference to source movement/item where required.

Partial refunds remain distinguishable from full refunds. Refund rules cannot produce invalid refundable amount without explicit credit/adjustment semantics.

## Named scenarios

Multiple scenarios may use distinct date/venue/guest/package/component assumptions. Scenario totals are derived and inspectable.

Changing/activating one scenario does not mutate:

- another scenario;
- historical quote;
- signed contract;
- actual payment records.

Minimum/probable/high are scenario/reporting assumptions, not payment lifecycle states.

## Locale/input parsing

Machine storage is locale-neutral. UI `fr-FR` may display `9 500,50 €`.

Importer may encounter:

- `9 500 €`;
- `9 500,50 €`;
- `9500,50`.

Mapping/preview establishes locale/currency. Ambiguous decimal/currency is flagged, never guessed into authoritative amount.

## Pending offline financial mutation

An offline-created payment/refund can be stored locally as pending intent. Until remote acknowledgement it is not cloud-confirmed truth. UI can show projected effect separately from confirmed shared totals.

## Required tests

At minimum:

- zero/max practical values;
- cents/fractional input conversion;
- fixed/per-person/per-table/hour/quantity/minimum-variable formulas;
- adult/child bases;
- rounding boundaries;
- tax included/excluded/unknown;
- deposits/installments/final balance;
- refundable caution/exposure;
- partial/full refunds/credits/returns;
- scenario independence/switching;
- French import formats/ambiguity;
- no floating-point cent drift;
- offline pending vs confirmed totals;
- property/mutation tests for critical financial engine.
