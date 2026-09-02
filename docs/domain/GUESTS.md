# Guest and Household Domain Model

## Purpose

The guest system must preserve the existing planning logic around households, priorities, attendance probabilities and cumulative counts while supporting later RSVP, transport, accommodation and seating workflows.

## Household

A household is the invitation/address grouping.

Typical examples:

- couple invited together;
- parents plus children;
- a single invitee;
- family unit sharing one postal invitation.

Household fields may include:

- internal UUID;
- project ID;
- display label;
- address/contact grouping fields;
- notes;
- invitation status;
- created/updated metadata.

## Guest

Each individual is a separate guest record.

Core data:

- first/last/display name;
- household;
- category/group;
- priority;
- attendance probability;
- RSVP status;
- age group where useful;
- relationship tags;
- notes;
- transport/accommodation needs;
- dietary/logistics information where genuinely needed;
- seating-plan linkage in later phases.

## Priority

Project-configurable priority scale supports the current planning approach, initially expected to be 1–5.

The system must calculate cumulative scenarios such as:

- priority 1;
- priority 1+2;
- priority 1+2+3;
- etc.

A guest's partner/children can have their own priority/probability when required.

## Probability

Store normalized probability in [0,1].

Examples:

- 100% → 1.0
- 75% → 0.75
- 25% → 0.25

Probability models planning uncertainty before definitive RSVP and must not be confused with confirmed attendance.

## RSVP precedence

Operational counts should define explicit precedence.

Conceptual rule:

- `attending` → confirmed present count 1 regardless of prior probability;
- `not_attending` → confirmed present count 0;
- `pending/maybe/not-yet-final` → use probability only in expected/planning statistics, not confirmed count.

## Statistics

Derived statistics include:

- invited individuals;
- invited households;
- confirmed attending;
- confirmed not attending;
- pending;
- expected attendance;
- maximum attendance;
- cumulative expected attendance by priority;
- adult/child counts when applicable;
- transport/accommodation demand.

## Privacy

Guest data is personal by default. Do not store unnecessary sensitive information.

Dietary/allergy/health-adjacent logistics require heightened privacy handling and should be removable after the event when no longer useful.

## Import

Guest import must support existing XLSX/CSV data with mapping preview.

Duplicate detection is conservative. Same name alone is never sufficient for automatic merge.

Potential matching signals:

- external ID;
- household relation;
- email/phone if present;
- full normalized name plus contextual data.

Ambiguous matches require review.

## Bulk actions

Useful bulk operations include:

- invitation sent;
- set category;
- set priority;
- RSVP follow-up state;
- export selected guests.

High-impact bulk edits require preview/undo.

## Future seating needs

The schema should leave room for:

- table assignment;
- must-sit-with preferences;
- avoid-with constraints;
- zone/gender-side requirements where applicable;
- seating-plan versioning.

The visual seating editor is deferred beyond core V1.

## Tests

Guest tests cover household membership, probabilities, RSVP precedence, cumulative priorities, bulk import/dedup, edge counts, privacy-export filtering and deletion/restore.
