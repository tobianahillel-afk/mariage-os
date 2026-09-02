# Data Dictionary Rules

The physical schema will be implemented through migrations, but every field must follow the conventions in this document.

## Every field specification must define

- technical name;
- user-facing label where applicable;
- owning entity;
- data type;
- semantic meaning;
- unit/format;
- nullable/required behavior;
- default value if any;
- validation constraints;
- whether it is user-entered, imported, derived or system-managed;
- confidentiality class;
- freshness policy if relevant;
- import/export mapping if relevant;
- indexing needs if relevant;
- state-machine or invariant constraints if relevant.

## Null semantics

`null` means absence/unknown unless a field-specific rule says otherwise.

Do not overload `false`, `0`, empty string or empty array to mean “unknown.”

## Enumerations

Enumerations must be centrally defined, versioned and documented. Display labels may change without changing stable stored codes.

Example:

```text
stored: quote_requested
display fr-FR: Devis demandé
```

## Text fields

Text fields have documented maximum lengths. Long free-text notes are separate from identifiers/labels to avoid accidental oversized payloads.

User-controlled text is always treated as text, never executable HTML.

## Numbers

Numbers must define unit and domain constraints.

Examples:

- `area_m2`: decimal >= 0
- `capacity_seated`: integer >= 0
- `probability`: decimal in [0,1]
- `rating_10`: decimal in [0,10]

## Money

Money uses integer minor units or PostgreSQL numeric/decimal semantics according to `MONEY.md`. JavaScript floating-point arithmetic must not be the authoritative financial representation.

## Dates and times

Date-only values, local times and timestamps are distinct types/concepts. See `DATES-TIME.md`.

## IDs

Internal IDs are stable UUIDs. Human codes such as `S32` are not database primary keys. See `IDENTIFIERS.md`.

## Metadata fields

Mutable project entities generally include:

- `id`
- `project_id`
- `created_at`
- `created_by`
- `updated_at`
- `updated_by`
- `revision` or equivalent concurrency token
- soft-deletion metadata where applicable

Exact implementation may be centralized/triggered but semantics must remain available.

## Confidentiality classes

Every meaningful field belongs to a class defined later in the privacy/security documentation. Initial classes:

- PUBLIC_REFERENCE
- PRIVATE_PROJECT
- PERSONAL
- FINANCIAL
- SENSITIVE_DOCUMENT

Examples:

- venue official website: PUBLIC_REFERENCE
- couple's private venue comment: PRIVATE_PROJECT
- guest phone: PERSONAL
- payment amount: FINANCIAL
- signed contract: SENSITIVE_DOCUMENT

## Derived fields

A derived field must specify its inputs and recalculation rules.

Examples:

- `remaining_to_pay = contracted_total - net_paid`
- `expected_guest_count = sum(attendance_probability)` subject to guest status rules

Derived values must not drift from independent manually maintained copies.

## Sourceable fields

Important factual fields may be represented through the facts/provenance subsystem rather than fixed columns.

A field requiring evidence must be able to represent:

- current retained value;
- unknown/conflict state;
- confidence/verification level;
- observed date;
- source links;
- historical observations where necessary.

## Import/export names

Canonical machine-readable import names use stable ASCII snake_case identifiers, independent of localized UI labels.

## Schema change rule

Changing the meaning of an existing stored field is considered a migration/compatibility event and requires documentation and tests. Reusing an old field name for a new semantic meaning is forbidden.
