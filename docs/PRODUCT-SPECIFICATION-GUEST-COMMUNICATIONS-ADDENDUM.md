# Mariage OS — V1 Product Specification Addendum: Invitations, RSVP & Communications

Status: **NORMATIVE V1 SCOPE CHANGE**

This addendum promotes guest invitation delivery and guest self-service RSVP into V1. It overrides any earlier statement that a guest portal or automated invitation communications are post-V1.

## Product outcome

Mariage OS V1 must support the complete loop:

`Guest data → invitation link → invitation delivery/share → guest RSVP → canonical guest update → statistics/seating/budget/planning readiness`.

The couple should not need to manually copy RSVP answers back into the database when the guest uses the Mariage OS portal.

## V1 capabilities added

- normalized guest/household email and phone contact points;
- secure household invitation links;
- QR/copy/share fallback;
- no-account guest RSVP portal;
- household/person attendance responses;
- controlled +1/child additions;
- configurable guest questions and deadline/edit policy;
- invitation/RSVP history;
- email campaign delivery;
- SMS campaign delivery;
- WhatsApp Business-compatible campaign delivery;
- safe invitation-card/message templates;
- delivery/failure status ingestion;
- reminders/information campaigns;
- provider-neutral architecture;
- cost/usage caps and diagnostics;
- onboarding/settings for RSVP and communication intent.

## UX placement

This does **not** add three top-level sidebar modules.

The private application places the workflow under `Guests → Invitations & RSVP`, with household-level communication details in Household Detail and advanced channel setup under Settings.

Guest-facing `/rsvp/:token` is a separate minimal public/capability shell without private app navigation.

## QIF requirement

V1 adopts `QIF — Quick & Intuitive Flow` as an internal product quality criterion for high-frequency/first-time flows.

QIF means:

- next action is obvious;
- user does not need implementation/provider vocabulary;
- steps are focused and progressive;
- no accidental destructive/send action;
- blocked states explain the recovery action;
- mobile completion is first-class;
- no dead-end or unexplained context switch;
- outcome/confirmation is unmistakable.

QIF is not claimed as an external standard. It is a Mariage OS acceptance criterion and must be reviewed at feature/checkpoint level.

## Onboarding change

Initial project onboarding includes an optional, non-blocking Invitations & RSVP setup step:

- intended RSVP method;
- desired RSVP deadline;
- desired guest questions;
- intended communication channels;
- current availability of email/phone data.

Technical provider configuration can be deferred. The user can finish onboarding and use manual secure links/QR codes before configuring paid/automatic channels.

## Cost constraint clarification

Previous `€0/month` constraint applies to core Mariage OS infrastructure target, not a promise that external communication traffic is free.

SMS, WhatsApp or transactional email providers may charge per-message or require a paid plan. V1 therefore requires:

- provider configuration opt-in;
- known-cost preview where available;
- send caps;
- no automatic plan purchase/upgrade/overage;
- manual link/QR fallback.

No provider billing is hidden inside budget calculations unless the couple explicitly records/links it as a wedding/platform expense.

## Security boundary

Guest link authorization is not project membership. Automatic communication is not browser-to-provider direct sending.

Normative documents:

- `features/GUEST-RSVP-PORTAL.md`
- `features/COMMUNICATIONS.md`
- `security/GUEST-COMMUNICATIONS-SECURITY.md`
- `domain/PHYSICAL-SCHEMA-GUEST-COMMUNICATIONS-ADDENDUM.md`
- `requirements/GUEST-COMMUNICATIONS-REQUIREMENTS.md`
- `ux/GUEST-COMMUNICATIONS-BLUEPRINTS.md`
- `FEATURE-LEDGER-GUEST-COMMUNICATIONS-EXTENSION.md`

## Non-goals retained

- arbitrary public guest signup into a wedding without an invitation capability;
- cold marketing/bulk spam;
- personal WhatsApp browser automation;
- guest access to private project app;
- payment processing;
- guest social network/chat;
- automatic legal/compliance certification.