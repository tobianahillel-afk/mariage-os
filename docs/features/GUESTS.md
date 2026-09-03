# Guests Feature Contract

Status: **NORMATIVE V1 FEATURE CONTRACT**

## Purpose

Manage households, individual invitees, contact points, priorities, attendance probabilities, RSVP, invitations, guest logistics and seating links while preserving the statistical behavior of the existing guest workbook.

Guest management is the private couple-side source of truth. Guest-facing RSVP access is a deliberately narrow capability surface defined by `GUEST-RSVP-PORTAL.md`.

## Main views

- guest table;
- household view;
- Invitations & RSVP workspace;
- statistics summary;
- RSVP status filters;
- priority/cumulative view;
- import/export center entry point;
- seating links/readiness.

## Table

Configurable columns may include:

- household;
- name;
- category;
- priority;
- probability;
- RSVP;
- people/age group;
- primary contact availability;
- invitation/send state;
- transport/accommodation need;
- seating assignment summary;
- notes.

Do not expose provider-message/debug fields by default.

Bulk actions must be safe, previewable/undoable for high-impact edits. Bulk communication uses the dedicated communication preflight flow rather than a one-click table action.

## Household view

Shows invitation unit and members, allowing partner/child-specific probability/priority when needed.

It also provides a focused `Communication & RSVP` section containing:

- email/phone contact points;
- active invitation link state;
- RSVP deadline/edit policy;
- invited-member composition;
- allowed +1/children;
- response state/history;
- communication timeline;
- copy/share/QR/rotate/revoke link actions;
- single-household send/reminder action.

Internal priorities, probabilities and private notes are never guest-visible merely because they are on the same household.

## Contact points

Contacts are first-class normalized data rather than ad-hoc strings hidden in notes.

- phone normalization/validation targets E.164 for automatic messaging eligibility;
- email/phone provenance can be retained;
- invalid/suppressed destinations are explicit;
- one guest/household may have multiple labeled contact points;
- provider credentials/status are not guest contact data.

## Statistics

Required derived outputs:

- total people invited;
- households;
- expected attendance;
- confirmed attending;
- confirmed not attending;
- pending;
- invitations prepared/sent/responded/awaiting response;
- contact-data gaps relevant to invitations;
- cumulative expected/maximum counts for priorities 1, 1+2, 1+2+3, etc.;
- adult/child segmentation when populated.

Calculations follow documented RSVP precedence and probability semantics.

## RSVP workflow

Statuses are distinct from planning probability. Updating RSVP automatically affects confirmed/expected outputs according to rules but does not erase historical probability unless deliberately edited.

RSVP can be updated by an authorized project member or through the secure guest portal. Guest submissions remain provenance/audit events and are constrained to the invitation household.

See:
- `GUEST-RSVP-PORTAL.md`;
- `COMMUNICATIONS.md`;
- `../security/GUEST-COMMUNICATIONS-SECURITY.md`.

## Invitations & RSVP workspace

This is part of the Guests domain rather than a separate top-level product silo.

It answers:

1. Who is invited?
2. Who has a valid invitation link?
3. Who has received an invitation/reminder and through which channel?
4. Who has responded?
5. Which contacts/messages failed?
6. Who needs the next action?

Automatic Email/SMS/WhatsApp sending is provider-backed and preview-first. Manual link/QR sharing remains available without provider setup.

## Privacy

Personal columns are private. Sensitive logistics are not shown in exports that do not need them.

Guest-facing portal payloads use an explicit allowlist and never include internal priority/probability/private notes, unrelated households, budget or research data.

## Import

Existing Excel/CSV must be importable with preview, mapping, duplicates and external IDs where available.

Import may include contact points, but it does not automatically activate/send invitations. Same-name guests are not automatically merged without adequate evidence.

## QIF — Quick & Intuitive Flow

Guest workflows must satisfy the internal Mariage OS QIF criterion:

- obvious next action;
- no provider/data jargon in primary flow;
- no accidental send without preview;
- invitations/status terminology understandable to a first-time couple;
- guest RSVP mobile flow requires no account;
- every blocked state tells the user what to do next;
- no dead-end between Guests → Invitations → Send → Responses → Seating/Budget updates.

## Acceptance criteria

- existing priority/probability planning can be reproduced from imported data;
- household members remain individual people for counts;
- RSVP update changes statistics correctly;
- 0/25/75/100% probabilities parse reliably;
- contact normalization does not merge unrelated people;
- guest token A cannot reveal/update household B;
- authorized guest response updates canonical RSVP once;
- unauthorized +1 creation is rejected;
- invitation send requires audience/message/channel preview;
- provider failure does not roll back a successfully committed RSVP;
- guest export respects privacy profile;
- 500 synthetic guests remain usable on supported devices;
- QIF usability review passes for couple-side invitation flow and mobile guest RSVP.