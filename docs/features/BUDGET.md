# Budget Feature Contract

Status: **Normative V1 feature contract**

Domain semantics: `../domain/BUDGET-PAYMENTS.md` and `MONEY.md`.

## Purpose

Provide a trustworthy financial view separating planning estimates, quote/approval/contract truth, actual cash movements and named alternative scenarios.

## Main views

- Summary
- Budget items/categories
- Named scenarios
- Payments
- Cash flow

## Summary

At minimum:

- active-scenario expected total;
- contracted total;
- paid non-refundable/final-cost cash;
- remaining contractual balance;
- due/overdue amount;
- next 30/60/90-day cash needs;
- refundable cash temporarily immobilized;
- contingency/reserve if configured.

A user can always drill into rows that reconstruct a total.

## Budget items

Each shows:

- category/label;
- calculation method;
- assumptions;
- estimate/quote/approved/contracted amounts where present;
- linked offer/entity/source;
- required/optional;
- scenario inclusion/override;
- related payments.

Example:

`Catering · 110 €/adult × 175 scenario guests · Quote · 19 250 €`

## Named scenarios

Users can persist/compare examples such as:

- S29 · Date A · 175 guests;
- S32 · Date A · 175 guests;
- S32 · Date B · 195 guests;
- Minimum / Probable / Maximum.

Each scenario owns assumptions/overrides without rewriting base budget-item truth.

Exactly zero/one scenario is operationally active. Activating is explicit and atomic; imports cannot switch it silently.

## Date-aware pricing

Offer applicability uses:

- candidate/selected date;
- frozen weekday convention;
- offer validity range;
- package/guest assumptions;
- tax semantics;
- documented mandatory components.

When applicability is uncertain, display uncertainty rather than choosing a price silently.

## Tax

Offer/item source displays `tax included`, `tax excluded`, `not applicable` or `unknown`. Unknown tax handling must remain visible when material to comparison.

## Payments

Payment view distinguishes:

- nonrefundable deposit;
- installment;
- final balance;
- refundable security deposit;
- refund/credit/deposit return.

Statuses include planned/due/processing/manual-pending/paid/partially-refunded/refunded/cancelled/overdue.

Refund/return can be linked to original payment. No negative authoritative payment amounts.

## Cash flow

Calendar/period view includes actual/planned outgoing cash and expected returns, while final-cost totals exclude refundable deposits unless forfeited/converted through explicit record.

## Hidden extras

Comparison exposes documented mandatory extras such as:

- cleaning;
- security;
- furniture;
- corkage;
- external-caterer fee;
- travel;
- overtime;
- taxes.

No “cheap” headline total if known mandatory components are omitted from probable scenario.

## Interaction with guests/date

Changing scenario guest count/date recalculates deterministic dependent items only. It does not alter historical quote/contract/payment records.

RSVP counts may be shown as a planning suggestion/reference but do not silently change active scenario guest count.

## Payment reminders

Creating/dismissing reminder task never changes the financial source row. Due/overdue remains finance truth.

## Import protections

Significant financial import changes are highlighted. Weaker estimate cannot overwrite contracted/paid truth. `paid`, active scenario, refund and tax treatment changes require explicit supported review.

## Acceptance criteria

- cent-exact calculations;
- scenario coexistence/switching deterministic;
- tax unknown visible;
- date/weekday selection correct;
- guest count updates only dependent formulas;
- refundable deposit excluded from final cost, included cash exposure;
- partial/full refund correct;
- contracted/paid history preserved;
- every aggregate explains source items;
- restricted export never leaks unrelated budget;
- offline edits/reconnect use finance conflict protections.