# Canonical JSON v1 — Freeze Addendum

Status: **Normative addendum to `CANONICAL-JSON-V1.md`**

This addendum resolves semantics discovered during the pre-code audit. If an example or sentence in the original canonical JSON document conflicts with this addendum, this addendum controls for V1.

## 1. Weekday

Numeric weekday is always:

- `0` Sunday
- `1` Monday
- `2` Tuesday
- `3` Wednesday
- `4` Thursday
- `5` Friday
- `6` Saturday

Therefore `"weekday": 6` means Saturday.

## 2. Nested external identifiers

Top-level IDs are scoped by source namespace + entity type.

Nested external IDs are additionally scoped by parent. Two different venues may both contain:

```json
{ "externalId": "main", "name": "Main room" }
```

without collision.

Parent-scoped identity applies to nested spaces, offer components, household members where represented as nested entities, media references and other documented nested objects.

## 3. Candidate wedding dates

Canonical project/date imports may include:

```json
{
  "externalId": "date-2027-06-20",
  "eventDate": "2027-06-20",
  "label": "June option",
  "status": "candidate"
}
```

Supported date-option statuses: `candidate`, `selected`, `rejected`, `archived`.

An ordinary import may propose a selected date in preview but may not silently replace the existing selected date. Selection is a protected transition.

## 4. Reference origins and access routes

Reference origin:

```json
{
  "externalId": "origin-paris",
  "label": "Paris",
  "addressText": "Paris, France",
  "latitude": null,
  "longitude": null,
  "isDefault": true
}
```

Venue access route:

```json
{
  "externalId": "paris-to-venue-car",
  "referenceOriginExternalId": "origin-paris",
  "routeType": "reference_to_venue",
  "mode": "car",
  "durationMinutes": 210,
  "distanceMeters": 690000,
  "transfersCount": 0,
  "observedAt": "2026-09-02T19:00:00Z",
  "sourceExternalId": "src-route"
}
```

Route values are contextual. An origin-specific duration must not overwrite a route from another origin/mode.

## 5. Observations may cite multiple sources

Preferred observation shape:

```json
{
  "externalId": "obs-001",
  "value": true,
  "rawValue": "Traiteur libre",
  "evidenceLevel": "official",
  "confidence": "high",
  "observedAt": "2026-09-02T19:00:00Z",
  "sourceExternalIds": ["src-official", "src-email"]
}
```

A legacy singular `sourceExternalId` may be accepted by a v1 compatibility parser and normalized to a one-element list, but canonical export uses `sourceExternalIds`.

## 6. Commercial tax semantics

Offers/components can include:

```json
{
  "taxMode": "included",
  "taxRateBasisPoints": 2000
}
```

`taxMode` values: `included`, `excluded`, `not_applicable`, `unknown`.

Unknown tax treatment stays unknown. An importer never assumes TTC/HT.

## 7. Named budget scenarios

```json
{
  "externalId": "scenario-s32-june-180",
  "name": "S32 · June · 180 guests",
  "status": "draft",
  "scenarioClass": "probable",
  "dateOptionExternalId": "date-2027-06-20",
  "venueExternalId": "venue-s32",
  "guestCount": 180,
  "items": [
    {
      "budgetItemExternalId": "budget-venue",
      "included": true,
      "quantityOverride": null,
      "guestCountOverride": null,
      "unitAmountOverride": null
    }
  ]
}
```

Scenario statuses: `draft`, `active`, `archived`.

Scenario classes: `minimum`, `probable`, `maximum`, `custom`.

An ordinary import cannot silently switch the operational active scenario.

## 8. Payment semantics

Canonical payment types:

- `deposit_nonrefundable`
- `installment`
- `final_balance`
- `refundable_security_deposit`
- `refund`
- `credit`
- `deposit_return`
- `other`

Statuses:

- `planned`
- `due`
- `processing`
- `manual_pending`
- `paid`
- `partially_refunded`
- `refunded`
- `cancelled`
- `overdue`

Refund/return objects may reference an original payment external ID. Amount is non-negative; direction comes from payment type.

Imports may not assert `paid` silently over existing production financial truth; protected financial review applies.

## 9. Basic seating plan

V1 canonical data may represent sections, tables and assignments.

```json
{
  "externalId": "table-01",
  "name": "Table 1",
  "sectionExternalId": "section-men",
  "capacity": 10,
  "shape": "round",
  "assignments": [
    {
      "guestExternalId": "guest-001",
      "seatLabel": null,
      "status": "planned"
    }
  ]
}
```

Duplicate active guest assignments/table over-capacity are validation conflicts, not silently applied.

## 10. Categories and tags

Guest categories, budget categories and tags use stable project-scoped keys/external IDs. Unknown values are previewed before creation and near-duplicate labels are not automatically duplicated.

## 11. Parent-scoped links

Any nested object referring to a parent/nested external ID must resolve within the parent/source namespace context first. Importer may not globally match `externalId="main"` across unrelated parents.

## 12. Round-trip update

Lossless canonical round-trip must now preserve:

- weekday meaning;
- tax mode/rate;
- parent-scoped nested identity;
- candidate dates;
- contextual access routes;
- multi-source observations;
- named budget scenarios;
- payment/refund semantics;
- seating assignments;
- categories/tags;

modulo internal UUIDs/audit timestamps and irrelevant ordering.