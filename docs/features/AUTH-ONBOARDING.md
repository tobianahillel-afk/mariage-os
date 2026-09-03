# Authentication and Couple Onboarding Feature Contract

Status: **Normative V1 feature contract**

This document describes user-facing onboarding. Security-sensitive mechanics are governed by `../security/BOOTSTRAP-INVITATIONS.md`, `../security/AUTHENTICATION.md` and the guest-communications security contracts where applicable.

## Purpose

Get exactly the intended couple into one private wedding project with secure/recoverable accounts and enough initial settings to make the app useful, without exposing a public project-creation service.

Onboarding is progressive: users can finish core setup without knowing every wedding detail or configuring external messaging providers.

---

## Entry states

### Signed out

Show:

- Mariage OS identity;
- browser-safe sign-in flow chosen by Lot 1;
- recovery entry;
- private-project explanation;
- no project existence/data leakage.

During controlled bootstrap only, registration may be available. After both production owners are enrolled, unrestricted new signup is disabled operationally.

### Signed in, no active project membership

Normal production does **not** offer arbitrary “Create wedding” after bootstrap.

Allowed situations:

- first-owner bootstrap when deployment contains no project and bootstrap is open;
- accept a valid partner invitation;
- account/recovery state with no current active membership.

### Signed in, active project

Route to safe intended route or Dashboard.

### Session expired

If local pending work exists:

- keep it durably;
- show reauthentication required to sync;
- never show cached private content to a different/unauthenticated user;
- after successful login, re-check membership then resume sync.

---

## First owner bootstrap

Minimum:

- verified account;
- project display name;
- owner display name/profile.

Project creation occurs through the protected initial-project command and is allowed only once for the private deployment.

Optional editable-later setup:

- wedding date candidates;
- timezone (default Europe/Paris);
- locale fr-FR;
- EUR;
- target guest count;
- budget target/reserve;
- one or more reference travel origins;
- venue criteria priorities;
- invitation/RSVP intent.

Unknown optional planning information never blocks creation.

---

## QIF onboarding structure

Onboarding follows the internal `QIF — Quick & Intuitive Flow` rule:

1. Welcome / project identity
2. Couple / partner setup
3. Wedding basics (date candidates, guest target, locale)
4. Planning preferences (budget/origins/venue criteria, skippable)
5. Invitations & RSVP intent (skippable/configurable later)
6. Security/MFA readiness
7. Data start choice (empty/import/add first item)
8. Summary + obvious next action

A first-time couple must be able to complete onboarding without learning technical terms such as RLS, E.164, DKIM, SPF, DMARC, WhatsApp template IDs or webhooks.

Each step has one primary action, a clear `Later`/skip behavior where allowed, and no irreversible external send.

---

## Invitations & RSVP onboarding step

This step configures intent, not provider internals.

Ask in wedding language:

### RSVP method

- `Utiliser les liens RSVP Mariage OS`
- `Je gérerai les réponses manuellement`
- `Je déciderai plus tard`

### Deadline

Optional RSVP deadline; editable later.

### Guest questions

Simple toggles/checklist for:

- dietary information;
- accessibility needs;
- transport interest;
- accommodation interest;
- guest message;
- +1/children policy handled per household later.

### Planned communication channels

- Email
- SMS
- WhatsApp
- Link / QR code manually
- decide later

### Contact-data readiness

- I already have emails;
- I already have phone numbers;
- I will import them later;
- I do not have them yet.

### Technical configuration

If the couple selects an automatic channel, offer:

- `Configurer maintenant`
- `Le faire plus tard`

Choosing later creates an actionable setup item/checklist and does not block onboarding or manual secure-link/QR RSVP.

Provider credentials/domain/template setup belongs under `Settings → Invitations & communications`, not the main onboarding path.

---

## Invite partner

Partner-account invitation remains separate from guest invitations.

V1 private bootstrap does not require the guest outbound provider stack to invite the second owner. Owner enters intended partner email and creates a secure one-time identity-bound invitation link according to `BOOTSTRAP-INVITATIONS.md`; sharing can remain manual/private.

Partner:

1. opens link;
2. registers/verifies the same invited email if needed while controlled signup is open;
3. signs in;
4. accepts invitation;
5. receives exactly one active owner membership;
6. enrolls MFA before production cutover.

Requirements:

- raw token absent from logs/activity/repo;
- wrong authenticated email cannot accept;
- expired/revoked token cannot accept;
- repeated successful request is idempotent;
- no duplicate membership;
- no unrelated project list/data appears.

---

## Close bootstrap

After both intended owners are active and MFA/recovery are verified:

- unrestricted production Auth registration is disabled;
- additional project creation remains refused by DB rule;
- Dashboard security blocker clears only when required owner setup is complete.

Guest RSVP capability links remain independently available because they are not account signup/project-membership links.

---

## MFA enrollment

Settings/onboarding flow:

1. explain purpose;
2. enroll TOTP;
3. verify code;
4. confirm strong-auth state;
5. guide backup/secondary factor/recovery according to provider support;
6. never persist/display TOTP enrollment secret beyond provider-required setup.

Real-data cutover is blocked until both production owners meet MFA/recovery policy.

---

## Reference origins

User can define private route-comparison origins such as Paris, home or family origin.

Each origin is a real project entity with label, optional address/coordinates and one default flag. Route observations are contextual per origin/mode.

External Google Maps/navigation is user-triggered and must not append unrelated private project data to URLs.

---

## Wedding date candidates

Onboarding can add zero or several candidate dates. Exactly zero/one becomes selected through explicit decision/action.

Selecting a date can invalidate/recalculate dependent availability/scenario/milestone data according to dependency rules; onboarding itself must not silently rewrite those objects.

---

## Initial criteria

Seed system criteria from `domain/DEFAULT-CRITERIA.md` and allow priority configuration:

- blocking;
- important;
- bonus/informational;
- optional weight.

Current use-case default blockers include:

- external caterer allowed;
- target capacity;
- one large shared reception room;
- two dance areas feasible;
- outdoor ceremony/chuppah requirement;
- indoor/rain backup.

Changing priority changes compatibility calculation, not historical facts.

---

## Initial data

Options:

- start empty;
- open Import Center;
- add first venue/vendor/guest manually.

If Guest setup was selected, the summary may suggest:

- import guest spreadsheet;
- add contact points;
- configure RSVP form;
- configure an automatic channel later.

Do not require private import before security setup.

---

## Project/account switch

Private production V1 intentionally has one wedding project for the real couple. Architecture still scopes local cache/queues by project ID and is public-SaaS-ready so tests/recovery projects cannot leak into each other.

---

## Logout

Follow frozen security policy:

- pending work must sync/export/discard explicitly;
- never silently lose pending edits;
- after safe logout, purge private project local data/cache from that browser profile;
- leave only non-sensitive static PWA shell where useful.

---

## Recovery/change

Use provider-secure flows for password/email/MFA/session recovery. No custom ownership recovery bypass exists.

---

## Empty Dashboard setup checklist

Before meaningful planning data exists, show setup actions rather than fake alerts:

- invite/verify partner;
- MFA/recovery completion;
- add date candidate(s) if known;
- target guest count;
- budget target;
- reference origin(s);
- review mandatory venue criteria;
- choose/import initial data;
- if guests are a current priority: configure RSVP basics/contact data;
- if automatic invitations are desired: complete selected provider setup.

Do not make provider configuration look mandatory when the couple can continue with manual link/QR.

---

## Acceptance criteria

- anonymous user sees no private project data;
- unrelated account cannot create another private-production project;
- initial owner/project creation atomic and one-time;
- partner invite one-time, email-bound and idempotent;
- no optional planning field blocks bootstrap;
- both owners access same project after acceptance;
- signup lock is part of cutover checklist;
- session expiry preserves pending local edits;
- logout never silently loses work and removes private cache after safe completion;
- no service-role/provider secret is needed in browser;
- onboarding works desktop/mobile;
- date candidates/reference origins persist as structured entities;
- Invitations & RSVP onboarding step uses nontechnical language and can be deferred;
- a couple can complete onboarding with no communication provider configured;
- choosing manual RSVP links yields a clear future next action;
- choosing automatic channels does not send anything during onboarding;
- QIF onboarding review passes without external documentation.

## Required tests

- first bootstrap once only;
- second arbitrary project create denied;
- partner invite accepted once;
- wrong email/expired/revoked partner invite;
- both owners edit same venue;
- session expiry + pending offline edit;
- TOTP protected action;
- signup closed unrelated account scenario;
- logout/relogin/purge local data;
- cross-project/direct UUID access denied;
- Invitations & RSVP onboarding skip/defer path;
- onboarding channel selection without provider credentials;
- mobile QIF completion;
- guest RSVP capability link remains separate from project membership/auth routes.