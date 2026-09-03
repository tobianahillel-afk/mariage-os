# Mariage OS — Guest RSVP Portal V1

Status: **NORMATIVE V1 FEATURE CONTRACT**

## Purpose

Allow invited households to answer their invitation themselves through a secure, no-account guest portal while preserving the couple's authoritative guest list, privacy rules and statistics.

The guest portal is not a public directory and is not a general account-registration surface.

## Primary flow

1. Couple creates/imports household and guests.
2. Couple verifies contact data and invitation composition.
3. Mariage OS creates a cryptographically random household invitation token.
4. Only a hash of the token is stored server-side.
5. Guest opens `/rsvp/:token` from email, SMS, WhatsApp, QR code or copied link.
6. Portal resolves only the invitation scope represented by that token.
7. Guest sees the invitation name, invited household members, allowed additions and configurable RSVP questions.
8. Guest submits a response.
9. Server validates token state, household scope, allowed persons/additions and deadline.
10. RSVP changes are committed transactionally, history is appended and derived guest/seating/budget readiness is invalidated/recomputed as defined by dependency contracts.
11. Guest receives a confirmation screen and optionally a confirmation message.

## No guest account required

V1 guest respondents do not create Mariage OS user accounts. Guest-link authorization is capability-scoped and separate from project-member authentication.

A valid invitation token MUST NOT expose:

- other households or guests;
- internal priority/probability values unless explicitly designated guest-visible;
- internal notes;
- couple budget;
- venues/vendor research;
- documents;
- full seating plan;
- project-member identities beyond configured public wedding identity;
- arbitrary project search/API access.

## Household and person behavior

Existing invitees are updated, not duplicated.

The portal can support, when enabled for that invitation:

- household-level attendance answer;
- person-by-person attendance;
- permitted +1 addition;
- permitted child addition;
- guest-provided display/preferred name;
- dietary information;
- accessibility information;
- transport/accommodation interest;
- free-text message to the couple.

A +1/child can only be created when an explicit invitation allowance exists. New guest-created people are attached to the scoped household and carry provenance `guest_rsvp_portal`.

## Response lifecycle

Invitation link states:

- `draft`
- `active`
- `revoked`
- `expired`

Response states use the canonical guest RSVP lifecycle. A response never silently erases planning probability history.

The couple configures:

- RSVP deadline;
- whether response editing remains allowed before/after deadline;
- which questions are shown;
- whether +1 or child additions are permitted per household;
- confirmation message;
- whether a post-submit confirmation is sent.

## Edit flow

Reopening the same active token shows the latest guest-visible response and permits edits only according to current policy. Every accepted edit is auditable.

## Security requirements

See `../security/GUEST-LINK-SECURITY.md`.

Minimum rules:

- token generated with CSPRNG;
- high entropy and unguessable;
- raw token never stored in DB/logs/analytics;
- hash lookup performed server-side;
- rate limit token-resolution and submit endpoints;
- generic errors for invalid/revoked/expired links;
- no project membership granted;
- no service-role secret in browser;
- CSRF protection if future cookie-backed guest sessions are introduced;
- strict validation of every submitted field;
- idempotency key on RSVP submission;
- same-household relational checks on every mutation.

## Privacy

The portal follows data minimization. It displays only configured wedding identity and invitation-specific data.

Do not expose internal analytics such as open/read tracking unless explicitly required and legally/ethically reviewed. Email tracking pixels are disabled by default.

## QIF — Quick & Intuitive Flow

This feature MUST pass the Mariage OS QIF criteria:

- opening a valid link immediately explains who the invitation is for;
- no account/password is requested;
- primary attendance choice is visible without scrolling on common mobile sizes;
- person selection is comprehensible without knowing the household data model;
- optional questions are progressive and skippable when not required;
- validation errors are local, human-readable and preserve entered data;
- one clear primary CTA per step;
- successful submission gives an unmistakable confirmation and edit policy;
- typical household response should complete in a small number of focused steps rather than one giant form.

## Accessibility/mobile

Guest RSVP is mobile-first and must support keyboard, screen-reader labels, sufficient targets, reduced motion and no color-only meaning.

## Acceptance highlights

- token for household A cannot read/write household B;
- revoked/expired tokens cannot mutate data;
- replaying the same idempotent submission does not duplicate guests or responses;
- unauthorized +1 creation is rejected server-side;
- valid +1 creation updates household/person counts once;
- response updates derived guest statistics correctly;
- internal probability/priority/private notes never appear in portal payloads;
- page remains usable if confirmation-message provider fails after RSVP commit;
- mobile QIF review passes.