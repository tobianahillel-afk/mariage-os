# Budget and Payments Domain

Status: **Normative V1 finance contract**

## Goals

Finance answers distinct questions:

- What do we expect the wedding to cost under each planning scenario?
- What has been quoted?
- What is approved/negotiated?
- What is contractually committed?
- What has actually left our accounts?
- What remains due or overdue?
- What refundable cash is temporarily immobilized?
- How do date, venue and guest-count choices change the result?

Never collapse these into one “budget total”.

---

## Categories

Categories are project-scoped entities with stable keys/labels, not unconstrained repeated strings.

Initial configurable examples:

- venue;
- catering;
- photo_video;
- music;
- flowers_decor;
- attire;
- stationery;
- transport;
- accommodation;
- ceremony;
- gifts;
- administrative;
- contingency;
- other.

Imports may create a genuinely new category only after preview/deduplication.

---

## Budget item

A budget item is one expected/quoted/contracted cost component.

Required concepts:

- category;
- label;
- status;
- calculation type;
- base quantity/guest assumptions;
- unit/estimated/quoted/approved/contracted amounts;
- required vs optional;
- source offer where applicable;
- entity links;
- notes/audit.

Do not duplicate manually editable monetary truth between offer and budget item. If a budget item is generated/linked from an offer, provenance/linkage is retained and update semantics are explicit.

## Calculation types

V1 supports at minimum:

- `fixed`;
- `per_guest`;
- `per_adult`;
- `per_child`;
- `per_table`;
- `per_hour`;
- `quantity_unit`;
- `manual_total`;
- `minimum_plus_variable`.

Every engine formula defines rounding and missing-input behavior using `MONEY.md`.

---

# Named budget scenarios

A scenario is persisted independently from budget items so several alternatives can coexist.

Examples:

- `S29 · 20 June · 170 guests`;
- `S32 · 27 June · 190 guests`;
- `Maximum reasonable`.

Scenario stores:

- name;
- lifecycle `draft` / `active` / `archived`;
- optional candidate wedding date;
- optional venue;
- planning guest count;
- class `minimum` / `probable` / `maximum` / `custom`;
- notes;
- per-budget-item inclusion/overrides.

At most one scenario is operationally active at a time. Activating one is an atomic protected transition, not a generic field toggle.

## Scenario item overrides

A scenario may override, without overwriting the base budget item:

- whether item is included;
- quantity;
- guest count;
- unit amount when it is a planning assumption.

Contracted truth is not rewritten merely because a scenario changes.

## Minimum/probable/maximum

These are named scenario classes, not three magic columns that replace transparent assumptions. Any total must be explainable by the included items/assumptions.

---

# Commercial tax semantics

For offers/components where tax information is supplied, store:

- `tax_mode`: `included`, `excluded`, `not_applicable`, `unknown`;
- optional tax rate in basis points.

Unknown tax status remains unknown; Mariage OS never assumes TTC or HT silently.

Comparison UI must label tax uncertainty when it can materially change the total.

---

# Payment / cash movement model

A payment record is planned or actual cash movement tied to a budget item.

## Payment types

- `deposit_nonrefundable`;
- `installment`;
- `final_balance`;
- `refundable_security_deposit`;
- `refund`;
- `credit`;
- `deposit_return`;
- `other`.

Amounts are always non-negative integer minor units. Direction is represented by type, never by negative authoritative amount.

## Payment status

- `planned`;
- `due`;
- `processing`;
- `manual_pending`;
- `paid`;
- `partially_refunded`;
- `refunded`;
- `cancelled`;
- `overdue`.

A refund/return can reference the original payment.

Original status may transition to `partially_refunded` or `refunded` according to linked refund/return movements. The engine must prevent a refund total from exceeding the logically refundable amount unless an explicit credit model justifies it.

`overdue` depends on due date/current project date plus lifecycle; it is not inferred from “amount > 0” alone.

## Refundable security deposits

They affect cash-flow/exposure but **not expected final wedding cost** unless forfeited/converted into a charge through an explicit financial record.

Dashboard therefore separates:

- final/expected cost;
- paid cost;
- refundable cash temporarily immobilized.

---

# Financial outputs

At minimum:

- active-scenario expected total;
- minimum/probable/high comparison where configured;
- quoted amount;
- contracted amount;
- paid amount;
- due/overdue amount;
- remaining contracted balance;
- refundable cash exposure;
- next 30/60/90-day cash needs;
- contingency amount/remaining where configured.

Every displayed total must be reproducible from source rows and scenario assumptions.

---

# Variable guest impact

Changing scenario guest count recalculates only dependent components.

Examples:

- per-guest catering → recalculated;
- fixed venue rental → unchanged;
- contractual minimum → respected;
- manually fixed contracted total → unchanged unless contract formula says otherwise.

Guest RSVP changes do not silently rewrite the planning scenario guest count; UI may recommend aligning them.

---

# Offer linkage

Venue/vendor offer components may generate/link budget items. The application must avoid two independent authoritative amounts.

When offer is superseded:

- historical budget provenance remains;
- active planning can be updated through explicit reconciliation;
- contracted/paid history is not overwritten by a newer quote.

---

# Payment deadlines/tasks

A due payment remains financial truth even if its reminder task is dismissed/completed. The system may generate/suggest a task or calendar export, but task state does not mutate financial status automatically.

---

# Import protections

Ordinary imports:

- may add estimates/quotes with provenance;
- may not silently switch active scenario;
- may not mark existing payment `paid` without explicit supported financial review;
- may not downgrade contracted/paid truth to a weaker estimate;
- must preview significant amount/tax/status changes.

---

# Privacy

Finance data is private/financial. Vendor/guest exports use field allowlists and never include unrelated total budget or payment history.

---

# Tests

Required finance tests include:

- all calculation types;
- exact cents/rounding;
- named scenario coexistence/switching;
- date/venue/guest changes;
- tax included/excluded/unknown;
- fixed vs variable components;
- minimum-plus-variable;
- quote→approved→contracted progression;
- nonrefundable deposit;
- installments/final balance;
- refundable security deposit not counted as final cost;
- processing/manual-pending/due/overdue;
- partial/full refund and deposit return;
- monthly cash flow;
- imported estimate cannot overwrite contracted truth;
- export privacy;
- property-based invariants for totals/refunds/nonnegative minor units.