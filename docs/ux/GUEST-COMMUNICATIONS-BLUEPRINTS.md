# Mariage OS — Guest Communications & RSVP UX Blueprints

Status: **NORMATIVE V1 UX CONTRACT**

## UX principle

The couple should think in wedding language, not provider/data language.

Primary concepts:

- Invitations
- RSVP
- Recipients
- Message
- Send / Schedule
- Responses
- Reminders

Provider configuration is secondary Settings material.

## Information architecture

Within `Guests`, add a first-class `Invitations & RSVP` workspace rather than a separate unrelated top-level app.

Recommended guest-domain tabs:

1. Guests
2. Households
3. Invitations & RSVP
4. Seating
5. Statistics

Desktop can expose these as tabs/subnavigation. Mobile uses a Guests landing screen with focused destinations.

### Invitations & RSVP workspace

Primary job: answer **who has been invited, who has received what, who has answered, and what should I do next?**

Top summary:

- households invited;
- invitations not yet sent;
- sent/delivered;
- responded;
- awaiting response;
- response problems/invalid contact;
- RSVP deadline.

Primary CTA: `Préparer un envoi`.

Secondary actions: `Copier un lien`, `QR codes`, `Configurer le RSVP`, `Importer/compléter les contacts`.

Main list is household-centric, not one row per provider message. Columns/cards emphasize:

- household name;
- invited people count;
- preferred/available channel;
- invitation-link state;
- latest send state;
- RSVP state;
- last communication;
- next action.

Provider message IDs and raw errors stay in detail/diagnostics.

## Campaign creation flow — QIF

Use a focused multi-step flow, not one huge form.

### Step 1 — Purpose

Choose:
- invitation;
- RSVP reminder;
- information/update;
- confirmation/follow-up.

### Step 2 — Audience

Human-friendly filters:
- not invited yet;
- invitation not sent;
- no RSVP response;
- attending;
- custom households/groups.

Show exact selected household and destination counts continuously.

### Step 3 — Channel

Show available configured channels as cards:
- Email
- SMS
- WhatsApp
- Manual link/QR

Unavailable channel explains why (`provider not configured`, `missing phone`, `no eligible template`) and offers the next setup action.

### Step 4 — Message/card

Preview actual rendered invitation for a sample household.

Editable content uses safe allowlisted variables with friendly chips, not template syntax.

Invitation card can be:
- image asset;
- email visual block;
- link-preview-safe generic art;
- QR code.

### Step 5 — Preflight

Show:
- exact recipients;
- missing/invalid contacts;
- suppressed recipients;
- duplicate destinations;
- RSVP links missing/expired;
- known cost estimate;
- schedule;
- sample message.

Primary CTA includes consequence, e.g. `Envoyer 86 invitations WhatsApp`.

### Step 6 — Result

Progress summary with:
- queued/sent/delivered/failed;
- channel;
- selective retry;
- jump to failed households;
- view RSVP responses.

No celebratory success state while a material number of recipients failed.

## Household detail integration

Household page gets a `Communication & RSVP` section:

- active RSVP link;
- copy/QR/rotate/revoke;
- invited member composition and allowances;
- RSVP response/history;
- contact points;
- communication timeline;
- send single message/reminder;
- guest message to couple.

Internal priority/probability remains in internal planning section, never guest-visible.

## Guest-facing RSVP pages

Guest portal has a distinct lightweight public visual shell derived from the project's visual identity but without the private app navigation.

### `/rsvp/:token`

Above the fold on mobile:
- wedding identity;
- household/invitation greeting;
- event date/location if configured public;
- `Serez-vous présents ?` primary choice.

Then progressively:
- invited people attendance;
- authorized +1/children additions;
- dietary/accessibility/logistics;
- guest message;
- review/submit.

### Confirmation

Show:
- response received;
- who is marked attending/not attending;
- date/time submitted;
- whether/when edits are allowed;
- configured wedding note.

Do not expose account/login UI.

## Onboarding integration

Project onboarding adds an optional but recommended `Invitations & RSVP` setup phase after initial wedding/project basics and before completion summary.

Wizard asks:

1. How will you collect RSVPs? (`Mariage OS link`, `manually`, `later`)
2. RSVP deadline (optional now).
3. Which guest questions do you expect? checkboxes for dietary/accessibility/transport/accommodation/+1 policy.
4. Which invitation channels do you plan to use? Email/SMS/WhatsApp/manual.
5. Contact data readiness (`I have emails`, `phones`, `not yet`).

Provider credentials are NOT requested inside the basic onboarding unless the user chooses `Configure now`; default path finishes onboarding quickly and creates a setup task/checklist.

QIF rule: a couple can complete product onboarding without understanding SPF, DKIM, WhatsApp templates, E.164 or webhooks.

## Settings

`Settings → Invitations & communications` contains advanced setup:

- public wedding identity;
- RSVP form/questions;
- link expiry/edit policy;
- email provider/domain status;
- SMS provider status;
- WhatsApp provider/template status;
- cost/send caps;
- default sender identity;
- suppression/invalid contacts;
- webhook health diagnostics.

Advanced technical provider diagnostics are behind a secondary `Diagnostics` surface.

## Empty states

No guests:
> Ajoutez ou importez d’abord vos invités pour préparer les invitations.

Guests but no contacts:
> Vos invités sont prêts. Ajoutez des emails ou numéros de téléphone, ou utilisez les liens/QR codes manuels.

Contacts but provider not configured:
> Vous pouvez déjà générer les liens RSVP. Configurez un canal automatique quand vous le souhaitez.

No sends yet:
> Préparez votre première invitation. Rien ne sera envoyé avant l’aperçu final.

## Mobile rules

- no wide delivery-status mega-table;
- household communication summary becomes cards/list rows;
- campaign wizard is one focused step per screen;
- sticky primary action only when it does not obscure validation;
- QR sharing uses native share/download where supported;
- guest RSVP is designed mobile-first.

## QIF acceptance criteria

A usability review must establish that a first-time user can, without docs:

- locate `Invitations & RSVP` from Guests;
- understand difference between invited/sent/responded;
- generate one household link;
- prepare a campaign without accidentally sending;
- identify exactly who will receive it before confirmation;
- understand failures and next action;
- configure the basic RSVP form from onboarding/settings;
- complete a guest RSVP from a phone without an account.

Any flow requiring knowledge of provider-specific API vocabulary in the primary path fails QIF.